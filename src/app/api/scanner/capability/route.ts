import { createClient } from "@/lib/supabase/server";
import { handleApiError, responses, withLogging } from "@/lib/api";
import { getScannerAccess } from "@/lib/auth/require-access";

/**
 * GET /api/scanner/capability
 *
 * Devuelve la capacidad para que la UI pueda mostrar una pantalla explicativa a usuarios gratuitos.
 * No crea tickets, no expone datos financieros y no permite subir archivos.
 */
export const GET = withLogging(async () => {
  try {
    const access = await getScannerAccess(await createClient());
    return responses.ok({ allowed: access.decision.allowed, reason: access.decision.reason });
  } catch (error) {
    return handleApiError(error);
  }
});
