import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { apiErrors, handleApiError, responses, withLogging } from "@/lib/api";
import { requireScannerAccess } from "@/lib/auth/require-access";
import { replaceScannerDraft } from "@/lib/scanner/persistence";
import { assertScannerSameOrigin } from "@/lib/scanner/csrf";
import { noStore, scannerPersistenceError } from "@/lib/scanner/http";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const category = z.enum(["survival", "optional", "culture", "extra"]);
const allocation = z.strictObject({ category, amountCents: z.number().int().refine((value) => value !== 0) });
const line = z.strictObject({
  kind: z.enum(["item", "adjustment"]),
  description: z.string().max(200).nullable(),
  amountCents: z.number().int().refine((value) => value !== 0),
  categoryProposal: category.nullable(),
  category: category.nullable(),
  allocations: z.array(allocation).max(10),
});
const bodySchema = z.strictObject({
  draftVersion: z.number().int().nonnegative(),
  merchant: z.string().max(120).nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  totalCents: z.number().int().positive().nullable(),
  lines: z.array(line).max(100),
});
type RouteContext = { params: Promise<{ ticketId: string }> };

/** Reemplaza el borrador editado mediante una RPC atómica y con control de versión. */
export const PATCH = withLogging(async (request: NextRequest, context: RouteContext) => {
  try {
    assertScannerSameOrigin(request);
    const { ticketId } = await context.params;
    if (!UUID.test(ticketId)) throw apiErrors.notFound("Ticket");
    if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
      throw apiErrors.badRequest("El tipo de contenido debe ser application/json.");
    }
    const input = bodySchema.parse(await request.json());
    const supabase = await createClient();
    await requireScannerAccess(supabase);
    const result = await replaceScannerDraft(supabase, ticketId, input.draftVersion, input);
    if (!result.ok) throw scannerPersistenceError(result.code);
    return noStore(responses.ok({ ticketId, status: "needs_review", draftVersion: result.draftVersion }));
  } catch (error) {
    return handleApiError(error);
  }
});
