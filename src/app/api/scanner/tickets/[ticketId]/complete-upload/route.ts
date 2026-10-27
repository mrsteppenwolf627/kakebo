import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiErrors, handleApiError, responses, withLogging } from "@/lib/api";
import { requireScannerAccess } from "@/lib/auth/require-access";
import { noStore, scannerPersistenceError } from "@/lib/scanner/http";
import { registerScannerUpload } from "@/lib/scanner/persistence";
import { PrivateTicketBucket } from "@/lib/scanner/storage-adapter";
import { assertScannerSameOrigin } from "@/lib/scanner/csrf";
import { z } from "zod";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const bodySchema = z.strictObject({ path: z.string().min(1).max(200) });
type RouteContext = { params: Promise<{ ticketId: string }> };

/** Confirma una subida directa solo después de comprobar el objeto privado en Storage. */
export const POST = withLogging(async (request: NextRequest, context: RouteContext) => {
  try {
    assertScannerSameOrigin(request);
    const { ticketId } = await context.params;
    if (!UUID.test(ticketId)) throw apiErrors.notFound("Ticket");
    if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
      throw apiErrors.badRequest("El tipo de contenido debe ser application/json.");
    }
    const { path } = bodySchema.parse(await request.json());

    const supabase = await createClient();
    await requireScannerAccess(supabase);
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw apiErrors.unauthorized();

    const bucket = new PrivateTicketBucket(supabase);
    const exists = await bucket.exists(path);
    if (!exists.ok) throw apiErrors.accessUnavailable();
    if (!exists.exists) throw apiErrors.validation("La subida no está disponible para confirmar.");

    const result = await registerScannerUpload(supabase, ticketId, path);
    if (!result.ok) throw scannerPersistenceError(result.code);
    return noStore(responses.ok({ ticketId, status: "uploaded", idempotent: result.idempotent }));
  } catch (error) {
    return handleApiError(error);
  }
});
