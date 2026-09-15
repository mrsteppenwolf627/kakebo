/**
 * POST /api/ai/agent-v2/cancel-confirmation
 *
 * Fase 2.E (corrección de seguridad): invalida en servidor una confirmación
 * de escritura de IA pendiente ("Cancelar" en el popup). Puramente
 * administrativo — nunca ejecuta ninguna herramienta ni modifica gastos.
 *
 * Body: { confirmationId: string (uuid) }
 * Éxito: 200 { success: true, data: { cancelled: true } }
 * Fallo (ya usada/cancelada/caducada/no encontrada): 409, sin modificar nada.
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth, responses, handleApiError, withLogging } from "@/lib/api";
import { cancelPendingAction, confirmFailureMessage } from "@/lib/agents-v2/pending-actions";

const cancelSchema = z.object({
  confirmationId: z.string().uuid(),
});

export const POST = withLogging(async (request: NextRequest) => {
  try {
    // requireAuth() is what actually authenticates this request — the only
    // way a user can reach cancelPendingAction. It internally uses the
    // admin client (createAdminClient()) to touch ai_pending_actions, since
    // that table has no RLS policies for authenticated/anon users.
    const user = await requireAuth();

    const body = await request.json();
    const input = cancelSchema.parse(body);

    const result = await cancelPendingAction(user.id, input.confirmationId);

    if (!result.success) {
      return responses.conflict(confirmFailureMessage(result.reason));
    }

    return responses.ok({ cancelled: true });
  } catch (error) {
    return handleApiError(error);
  }
});
