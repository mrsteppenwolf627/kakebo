import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { apiErrors, handleApiError, responses, withLogging } from "@/lib/api";
import { requireScannerAccess } from "@/lib/auth/require-access";
import { confirmScannerTicket } from "@/lib/scanner/persistence";
import { assertScannerSameOrigin } from "@/lib/scanner/csrf";
import { noStore, scannerPersistenceError } from "@/lib/scanner/http";

export const dynamic = "force-dynamic";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ticketId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const bodySchema = z.strictObject({ confirmKey: z.string().regex(UUID_V4), draftVersion: z.number().int().nonnegative(), userConfirmed: z.literal(true) });
type RouteContext = { params: Promise<{ ticketId: string }> };

/** Confirmación explícita: la función SQL crea todos los gastos de forma atómica e idempotente. */
export const POST = withLogging(async (request: NextRequest, context: RouteContext) => {
  try {
    assertScannerSameOrigin(request);
    const { ticketId: id } = await context.params;
    if (!ticketId.test(id)) throw apiErrors.notFound("Ticket");
    if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
      throw apiErrors.badRequest("El tipo de contenido debe ser application/json.");
    }
    const input = bodySchema.parse(await request.json());

    const supabase = await createClient();
    await requireScannerAccess(supabase);
    const result = await confirmScannerTicket(supabase, id, input.confirmKey, input.draftVersion);
    if (!result.ok) throw scannerPersistenceError(result.code);
    return noStore(responses.ok({ ticketId: id, status: result.status, idempotent: result.idempotent, expenses: result.expenses.map((expense) => ({
      expenseId: expense.expenseId,
      category: expense.category,
      amountCents: expense.amountCents,
    })) }));
  } catch (error) {
    return handleApiError(error);
  }
});
