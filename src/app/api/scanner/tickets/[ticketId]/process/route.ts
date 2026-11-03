import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { apiErrors, handleApiError, responses, withLogging } from "@/lib/api";
import { requireScannerAccess } from "@/lib/auth/require-access";
import { assertScannerSameOrigin } from "@/lib/scanner/csrf";
import { azureReceiptIsExplicitlyEnabled, createAzureReceiptProvider } from "@/lib/scanner/azure-receipt-provider";
import { proposeScannerCategory } from "@/lib/scanner/category-proposal";
import { failScannerProcessing, applyScannerOcrResult, startScannerProcessing } from "@/lib/scanner/persistence";
import { noStore, scannerPersistenceError } from "@/lib/scanner/http";
import { hasSupportedFileSignature, PrivateTicketBucket } from "@/lib/scanner/storage-adapter";
import type { OcrMime } from "@/lib/scanner/ocr-contract";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const bodySchema = z.strictObject({});
const OCR_MIME: readonly OcrMime[] = ["image/jpeg", "image/png"];
type RouteContext = { params: Promise<{ ticketId: string }> };

/** Ejecuta el OCR solo cuando está habilitado explícitamente y abre la revisión humana. */
export const POST = withLogging(async (request: NextRequest, context: RouteContext) => {
  try {
    assertScannerSameOrigin(request);
    const { ticketId } = await context.params;
    if (!UUID.test(ticketId)) throw apiErrors.notFound("Ticket");
    if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
      throw apiErrors.badRequest("El tipo de contenido debe ser application/json.");
    }
    bodySchema.parse(await request.json());
    if (!azureReceiptIsExplicitlyEnabled()) throw apiErrors.accessUnavailable();

    const supabase = await createClient();
    await requireScannerAccess(supabase);
    const { data: ticket, error: ticketError } = await supabase
      .from("scanner_tickets")
      .select("id,status,object_path,declared_mime,expires_at,locale")
      .eq("id", ticketId)
      .maybeSingle();
    if (ticketError) throw apiErrors.accessUnavailable();
    if (!ticket) throw apiErrors.notFound("Ticket");
    if (ticket.expires_at && new Date(ticket.expires_at).getTime() <= Date.now()) throw apiErrors.conflict("El ticket ha caducado.");
    if (ticket.status === "needs_review") return noStore(responses.ok({ ticketId, status: "needs_review", idempotent: true }));
    if (ticket.status === "processing") return noStore(responses.ok({ ticketId, status: "processing", idempotent: true }));
    if (ticket.status !== "uploaded" || typeof ticket.object_path !== "string") throw apiErrors.conflict("El ticket no está listo para procesarse.");

    const started = await startScannerProcessing(supabase, ticketId);
    if (!started.ok) throw scannerPersistenceError(started.code);
    if (started.idempotent) return noStore(responses.ok({ ticketId, status: "processing", idempotent: true }));

    const declaredMimeValue = typeof ticket.declared_mime === "string" ? ticket.declared_mime : null;
    if (!declaredMimeValue || !(OCR_MIME as readonly string[]).includes(declaredMimeValue)) {
      const failed = await failScannerProcessing(supabase, ticketId, "validation_rejected");
      if (!failed.ok) throw scannerPersistenceError(failed.code);
      return noStore(responses.ok({ ticketId, status: "failed", retryable: false }));
    }
    const declaredMime = declaredMimeValue as OcrMime;
    const object = await new PrivateTicketBucket(supabase).readObject(ticket.object_path);
    if (!object.ok || object.contentType !== declaredMime || !hasSupportedFileSignature(object.bytes, declaredMime)) {
      const failed = await failScannerProcessing(supabase, ticketId, "validation_rejected");
      if (!failed.ok) throw scannerPersistenceError(failed.code);
      return noStore(responses.ok({ ticketId, status: "failed", retryable: false }));
    }

    const outcome = await createAzureReceiptProvider().analyze({
      attemptId: ticketId,
      idempotencyKey: ticketId,
      bytes: object.bytes,
      mime: declaredMime,
      pageCount: 1,
      locale: ticket.locale === "en" ? "en" : "es",
      hints: { country: "ES", currency: "EUR" },
      deadlineMs: 10000,
    });
    if (!outcome.ok || outcome.receipt.currency.value !== "EUR") {
      const failed = await failScannerProcessing(supabase, ticketId, "provider_failed");
      if (!failed.ok) throw scannerPersistenceError(failed.code);
      return noStore(responses.ok({ ticketId, status: "failed", retryable: true }));
    }

    const receipt = outcome.receipt;
    const applied = await applyScannerOcrResult(supabase, ticketId, {
      merchant: receipt.merchant.value,
      date: receipt.date.value,
      totalCents: receipt.totalCents.value,
      currency: "EUR",
      lines: receipt.lines.map((line) => ({
        description: line.description.value,
        amountCents: line.amountCents.value,
        categoryProposal: proposeScannerCategory(line.description.value),
      })).filter((line): line is { description: string | null; amountCents: number; categoryProposal: "survival" | "optional" | "culture" | "extra" | null } => Number.isSafeInteger(line.amountCents) && line.amountCents !== 0),
    });
    if (!applied.ok) {
      const failed = await failScannerProcessing(supabase, ticketId, "validation_rejected");
      if (!failed.ok) throw scannerPersistenceError(failed.code);
      return noStore(responses.ok({ ticketId, status: "failed", retryable: false }));
    }
    return noStore(responses.ok({ ticketId, status: "needs_review", draftVersion: applied.draftVersion, idempotent: applied.idempotent }));
  } catch (error) {
    return handleApiError(error);
  }
});
