import { createAdminClient } from "@/lib/supabase/admin";
import { listAllAuthUsers } from "@/lib/admin/auth-users";
import { createUnsubscribeUrl, sendMarketingEmail } from "@/lib/marketing-mail/provider";
import { renderMarketingEmail } from "@/lib/marketing-mail/templates";

export const MARKETING_CAMPAIGNS = {
  usage_reminder: { type: "Recordatorio de uso", subject: "Un minuto para poner tus gastos al día" },
  practical_tip: { type: "Consejo práctico", subject: "Un pequeño hábito para ahorrar mejor" },
  monthly_summary: { type: "Resumen mensual", subject: "Tu revisión mensual de Kakebo" },
  product_news: { type: "Novedades", subject: "Novedades de Kakebo" },
} as const;

export type MarketingCampaignKey = keyof typeof MARKETING_CAMPAIGNS;

export function isMarketingCampaignKey(value: string): value is MarketingCampaignKey {
  return value in MARKETING_CAMPAIGNS;
}

function campaignBody(campaignKey: MarketingCampaignKey): string {
  switch (campaignKey) {
    case "usage_reminder":
      return "<p>Registrar tus gastos cuando ocurren hace que la revisión sea mucho más sencilla. Entra en Kakebo y añade hoy los movimientos que tengas pendientes.</p>";
    case "practical_tip":
      return "<p>Antes de comprar, prueba a esperar diez minutos y pregúntate si es una necesidad, un deseo o algo que puede esperar. Esa pausa convierte el presupuesto en una decisión consciente.</p>";
    case "monthly_summary":
      return "<p>Reserva unos minutos para revisar el mes: qué categorías se desviaron, qué gastos fueron excepcionales y qué cantidad puedes separar para tu objetivo de ahorro.</p>";
    case "product_news":
      return "<p>Estamos mejorando Kakebo para que registrar y revisar tus gastos sea cada vez más claro. Te avisaremos aquí cuando haya una novedad realmente útil.</p>";
  }
}

export async function getMarketingAudience(campaignKey: MarketingCampaignKey, limit = 100) {
  const admin = createAdminClient();
  const [{ data: preferences, error: preferencesError }, { data: events, error: eventsError }] = await Promise.all([
    admin.from("communication_preferences").select("user_id, marketing_email_consent, unsubscribed_at"),
    admin.from("marketing_email_events").select("user_id, campaign_key, event_type").eq("campaign_key", campaignKey),
  ]);
  if (preferencesError) throw preferencesError;
  if (eventsError) throw eventsError;

  const sentUserIds = new Set((events || []).filter((event) => event.event_type === "sent").map((event) => event.user_id).filter(Boolean));
  const authUsers = await listAllAuthUsers(admin);
  const emailById = new Map(authUsers.map((user) => [user.id, user.email || ""]));

  return (preferences || [])
    .filter((preference) => preference.marketing_email_consent && !preference.unsubscribed_at)
    .filter((preference) => !sentUserIds.has(preference.user_id))
    .map((preference) => ({ userId: preference.user_id, email: emailById.get(preference.user_id) || "" }))
    .filter((recipient) => recipient.email)
    .slice(0, Math.max(1, Math.min(limit, 500)));
}

export async function previewMarketingCampaign(campaignKey: MarketingCampaignKey, limit = 100) {
  const recipients = await getMarketingAudience(campaignKey, limit);
  return { campaignKey, definition: MARKETING_CAMPAIGNS[campaignKey], count: recipients.length, recipients };
}

export async function sendMarketingCampaign(campaignKey: MarketingCampaignKey, limit = 100) {
  const recipients = await getMarketingAudience(campaignKey, limit);
  const definition = MARKETING_CAMPAIGNS[campaignKey];
  const results = [] as Array<{ userId: string; email: string; status: string; messageId?: string; error?: string }>;

  for (const recipient of recipients) {
    try {
      const html = renderMarketingEmail({
        title: definition.subject,
        preheader: definition.type,
        bodyHtml: campaignBody(campaignKey),
        unsubscribeUrl: createUnsubscribeUrl(recipient.userId),
      });
      const delivery = await sendMarketingEmail({
        userId: recipient.userId,
        to: recipient.email,
        subject: definition.subject,
        html,
        campaignKey,
      });
      results.push({ userId: recipient.userId, email: recipient.email, status: "sent", messageId: delivery.messageId });
    } catch (error) {
      results.push({ userId: recipient.userId, email: recipient.email, status: "failed", error: error instanceof Error ? error.message : "Unknown error" });
    }
  }
  return { campaignKey, attempted: recipients.length, results };
}
