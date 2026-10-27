import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiErrors, handleApiError, responses, withLogging } from "@/lib/api";
import { requireScannerAccess } from "@/lib/auth/require-access";
import { createScannerTicket } from "@/lib/scanner/persistence";
import { noStore, requireIdempotencyKey, scannerPersistenceError } from "@/lib/scanner/http";
import { scannerStartTicketSchema } from "@/lib/scanner/http";
import { assertScannerSameOrigin } from "@/lib/scanner/csrf";

export const dynamic = "force-dynamic";

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
