import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMarketingEmail } from "@/lib/marketing-mail/provider";
import { renderMarketingEmail } from "@/lib/marketing-mail/templates";
import {
  LEAD_CONFIRMATION_RESEND_MS,
  LEAD_CONSENT_TEXT_VERSION,
  LEAD_PRIVACY_POLICY_VERSION,
  leadActionUrl,
  normalizeLeadEmail,
  normalizeLeadSource,
} from "@/lib/marketing-mail/leads";
import { apiLogger } from "@/lib/logger";

const NO_STORE = { "Cache-Control": "no-store" };

// Respuesta idéntica exista o no el correo, para no revelar qué direcciones están registradas.
const ACCEPTED = () => NextResponse.json({ ok: true }, { status: 202, headers: NO_STORE });

/**
 * Alta de un lead con consentimiento explícito. El consentimiento solo se da con `consent === true`.
 * La suscripción queda pendiente hasta que la persona pulse el enlace del correo de confirmación.
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400, headers: NO_STORE });
  }

  // Campo trampa para bots: los navegadores reales no lo rellenan.
  if (typeof body.website === "string" && body.website.trim() !== "") return ACCEPTED();

  const email = normalizeLeadEmail(body.email);
  if (!email) return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400, headers: NO_STORE });
  if (body.consent !== true) return NextResponse.json({ ok: false, error: "consent_required" }, { status: 400, headers: NO_STORE });
  const source = normalizeLeadSource(body.source);

  try {
    const admin = createAdminClient();
    const now = new Date();
    const { data: existing, error: selectError } = await admin
      .from("marketing_leads")
      .select("id, confirmed_at, unsubscribed_at, confirmation_sent_at")
      .eq("email", email)
      .maybeSingle();
    if (selectError) throw selectError;

    let leadId: string;
    if (existing) {
      // Ya confirmado y activo: nada que hacer. Dado de baja: solo se reactiva con un nuevo consentimiento.
      if (existing.confirmed_at && !existing.unsubscribed_at) return ACCEPTED();
      const sentAt = existing.confirmation_sent_at ? new Date(existing.confirmation_sent_at).getTime() : 0;
      if (now.getTime() - sentAt < LEAD_CONFIRMATION_RESEND_MS) return ACCEPTED();
      const { error: updateError } = await admin
        .from("marketing_leads")
        .update({
          source,
          consent_at: now.toISOString(),
          consent_text_version: LEAD_CONSENT_TEXT_VERSION,
          privacy_policy_version: LEAD_PRIVACY_POLICY_VERSION,
          confirmed_at: null,
          unsubscribed_at: null,
        })
        .eq("id", existing.id);
      if (updateError) throw updateError;
      leadId = existing.id;
    } else {
      const { data: inserted, error: insertError } = await admin
        .from("marketing_leads")
        .insert({
          email,
          source,
          consent_at: now.toISOString(),
          consent_text_version: LEAD_CONSENT_TEXT_VERSION,
          privacy_policy_version: LEAD_PRIVACY_POLICY_VERSION,
        })
        .select("id")
        .single();
      if (insertError) throw insertError;
      leadId = inserted.id;
    }

    const html = renderMarketingEmail({
      title: "Confirma tu suscripción",
      preheader: "Un clic para recibir consejos del método Kakebo.",
      bodyHtml:
        "<p>Has pedido recibir consejos y novedades del método Kakebo en este correo. Para confirmarlo, pulsa el botón. Si no fuiste tú, ignora este mensaje y no recibirás nada.</p>",
      ctaLabel: "Confirmar suscripción",
      ctaUrl: leadActionUrl(leadId, "confirm"),
      unsubscribeUrl: leadActionUrl(leadId, "unsubscribe"),
    });

    try {
      await sendMarketingEmail({ to: email, subject: "Confirma tu suscripción a Kakebo", html, campaignKey: "lead_confirmation" });
      await admin.from("marketing_leads").update({ confirmation_sent_at: now.toISOString() }).eq("id", leadId);
    } catch (error) {
      // El lead queda guardado como pendiente; el envío se puede reintentar. Nunca se registra el correo.
      apiLogger.error({ reason: "lead_confirmation_failed" }, error instanceof Error ? error.message : "lead confirmation failed");
      // Se avisa a la persona: si no, creería que llegará un correo que no se ha enviado.
      return NextResponse.json({ ok: false, error: "email_unavailable" }, { status: 503, headers: NO_STORE });
    }
    return ACCEPTED();
  } catch (error) {
    apiLogger.error({ reason: "lead_capture_failed" }, error instanceof Error ? error.message : "lead capture failed");
    return NextResponse.json({ ok: false, error: "unavailable" }, { status: 503, headers: NO_STORE });
  }
}
