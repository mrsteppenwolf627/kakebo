import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiErrors, handleApiError, responses, withLogging } from "@/lib/api";
import { requireScannerAccess } from "@/lib/auth/require-access";
import { noStore } from "@/lib/scanner/http";
import { PrivateTicketBucket } from "@/lib/scanner/storage-adapter";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RouteContext = { params: Promise<{ ticketId: string }> };

export const POST = withLogging(async (request: NextRequest, context: RouteContext) => {
  try {
    const { ticketId } = await context.params;
    if (!UUID.test(ticketId)) throw apiErrors.notFound("Ticket");
    if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
      throw apiErrors.badRequest("El tipo de contenido debe ser application/json.");
    }
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).length !== 0) {
      throw apiErrors.validation("La autorización de subida no admite campos.");
    }

    const supabase = await createClient();
    await requireScannerAccess(supabase);
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw apiErrors.unauthorized();

    const { data: ticket, error: ticketError } = await supabase
      .from("scanner_tickets")
      .select("id,status,object_path,expires_at")
      .eq("id", ticketId)
      .maybeSingle();
    if (ticketError) throw apiErrors.accessUnavailable();
    if (!ticket) throw apiErrors.notFound("Ticket");
    if (ticket.status !== "initiated") throw apiErrors.conflict("El ticket no admite una nueva subida.");
    if (ticket.expires_at && new Date(ticket.expires_at).getTime() <= Date.now()) throw apiErrors.conflict("El ticket ha caducado.");

    const upload = await new PrivateTicketBucket(supabase).createUploadUrl(userData.user.id, ticketId);
    if (!upload.ok) throw apiErrors.accessUnavailable();
    return noStore(responses.ok({
      mode: "direct",
      upload: { method: "PUT", url: upload.url, token: upload.token, path: upload.path, maxBytes: upload.maxBytes },
    }));
  } catch (error) {
    return handleApiError(error);
  }
});
