import { createClient } from "@/lib/supabase/server";
import { handleApiError, responses, withLogging } from "@/lib/api";
import { getScannerAccess } from "@/lib/auth/require-access";
import { noStore } from "@/lib/scanner/http";

/**
 * GET /api/scanner/capability
 *
 * Devuelve la capacidad para que la UI pueda mostrar una pantalla explicativa a usuarios gratuitos.
 * No crea tickets, no expone datos financieros y no permite subir archivos.
 */
export const GET = withLogging(async () => {
  try {
    const access = await getScannerAccess(await createClient());
    return noStore(responses.ok({
      contractVersion: 1,
      enabled: false,
      access: { allowed: access.decision.allowed, reason: access.decision.reason },
      quota: { limit: null, used: null, remaining: null, cycleId: null },
      limits: { maxBytes: null, maxPages: null, mimeTypes: [], maxOpenTickets: null },
    }));
  } catch (error) {
    return handleApiError(error);
  }
});
