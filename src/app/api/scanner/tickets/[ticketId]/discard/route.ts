import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiErrors, handleApiError, responses, withLogging } from "@/lib/api";
import { requireScannerAccess } from "@/lib/auth/require-access";
import { assertScannerSameOrigin } from "@/lib/scanner/csrf";
import { discardScannerTicket } from "@/lib/scanner/persistence";
import { noStore, scannerPersistenceError } from "@/lib/scanner/http";
import { PrivateTicketBucket } from "@/lib/scanner/storage-adapter";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type RouteContext = { params: Promise<{ ticketId: string }> };

/** Descarta un ticket propio: primero borra/verifica el original privado y después el tombstone SQL. */
export const DELETE = withLogging(async (request: NextRequest, context: RouteContext) => {
  try {
    assertScannerSameOrigin(request);
    const { ticketId } = await context.params;
    if (!UUID.test(ticketId)) throw apiErrors.notFound("Ticket");
    const supabase = await createClient();
    await requireScannerAccess(supabase);
    const { data: ticket, error } = await supabase.from("scanner_tickets").select("id,status,object_path").eq("id", ticketId).maybeSingle();
    if (error) throw apiErrors.accessUnavailable();
    if (!ticket) throw apiErrors.notFound("Ticket");
    if (ticket.status === "confirmed") throw apiErrors.conflict("El ticket ya está confirmado.");
    if (ticket.status !== "deleted" && typeof ticket.object_path === "string") {
      const bucket = new PrivateTicketBucket(supabase);
      const removed = await bucket.remove(ticket.object_path);
      if (!removed.ok) throw apiErrors.accessUnavailable();
      const verified = await bucket.exists(ticket.object_path);
      if (!verified.ok || verified.exists) throw apiErrors.conflict("No se pudo verificar el borrado del archivo.");
    }
    const result = await discardScannerTicket(supabase, ticketId);
    if (!result.ok) throw scannerPersistenceError(result.code);
    return noStore(responses.ok({ ticketId, status: "deleted", idempotent: result.idempotent }));
  } catch (error) {
    return handleApiError(error);
  }
});
