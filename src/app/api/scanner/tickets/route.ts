import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiErrors, handleApiError, responses, withLogging } from "@/lib/api";
import { requireScannerAccess } from "@/lib/auth/require-access";
import { createScannerTicket } from "@/lib/scanner/persistence";
import { noStore, requireIdempotencyKey, scannerPersistenceError } from "@/lib/scanner/http";
import { scannerStartTicketSchema } from "@/lib/scanner/http";
import { assertScannerSameOrigin } from "@/lib/scanner/csrf";
import { getOpenMonth, getOrCreateMonth } from "@/lib/months";

export const dynamic = "force-dynamic";

export const GET = withLogging(async () => {
  try {
    const supabase = await createClient();
    await requireScannerAccess(supabase);
    const { data, error } = await supabase
      .from("scanner_tickets")
      .select("id,status,status_reason,merchant,receipt_date,total_cents,currency,expires_at,updated_at")
      .neq("status", "deleted")
      .order("updated_at", { ascending: false })
      .limit(20);
    if (error) throw apiErrors.accessUnavailable();
    return noStore(responses.ok({ tickets: (data ?? []).map((ticket) => ({
      id: ticket.id,
      status: ticket.status,
      statusReason: ticket.status_reason,
      merchant: ticket.merchant,
      date: ticket.receipt_date,
      totalCents: ticket.total_cents,
      currency: ticket.currency,
      expiresAt: ticket.expires_at,
      updatedAt: ticket.updated_at,
    })) }));
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withLogging(async (request: NextRequest) => {
  try {
    assertScannerSameOrigin(request);
    const supabase = await createClient();
    await requireScannerAccess(supabase);
    const key = requireIdempotencyKey(request.headers.get("idempotency-key"));
    if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
      throw apiErrors.badRequest("El tipo de contenido debe ser application/json.");
    }
    const input = scannerStartTicketSchema.parse(await request.json());

    // Bootstrap the first cycle just like the manual expense flow does. The
    // scanner is allowed to be the user's first expense, so requiring an
    // already-open `months` row would make a new Plus account unusable.
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw apiErrors.unauthorized();
    const openMonth = await getOpenMonth(supabase, user.id);
    if (!openMonth) {
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/Madrid",
        year: "numeric",
        month: "2-digit",
      }).formatToParts(new Date());
      const year = Number(parts.find((part) => part.type === "year")?.value);
      const month = Number(parts.find((part) => part.type === "month")?.value);
      if (!Number.isInteger(year) || !Number.isInteger(month)) {
        throw scannerPersistenceError("NO_OPEN_CYCLE");
      }
      const { row } = await getOrCreateMonth(supabase, user.id, year, month);
      if (row.status !== "open") throw scannerPersistenceError("NO_OPEN_CYCLE");
    }

    const result = await createScannerTicket(supabase, key, input);
    if (!result.ok) throw scannerPersistenceError(result.code);
    const response = result.idempotent
      ? responses.ok({ ticketId: result.ticketId, cycleId: result.cycleId, status: "initiated", idempotent: true })
      : responses.created({ ticketId: result.ticketId, cycleId: result.cycleId, status: "initiated", idempotent: false });
    return noStore(response);
  } catch (error) {
    return handleApiError(error);
  }
});
