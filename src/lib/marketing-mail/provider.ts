import { createHmac, timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export type MarketingEmail = {
  userId?: string;
  to: string;
  subject: string;
  html: string;
  campaignKey: string;
};

export function createUnsubscribeSignature(userId: string): string {
  const secret = process.env.MARKETING_UNSUBSCRIBE_SECRET;
  if (!secret) throw new Error("MARKETING_UNSUBSCRIBE_SECRET is not configured");
  return createHmac("sha256", secret).update(userId).digest("hex");
}

export function verifyUnsubscribeSignature(userId: string, signature: string): boolean {
  try {
    const expected = createUnsubscribeSignature(userId);
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export function createUnsubscribeUrl(userId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.metodokakebo.com";
  return `${baseUrl}/api/marketing/unsubscribe?u=${encodeURIComponent(userId)}&s=${createUnsubscribeSignature(userId)}`;
}

export async function sendMarketingEmail(email: MarketingEmail): Promise<{ provider: string; messageId?: string }> {
  const provider = process.env.MARKETING_MAIL_PROVIDER;
  if (provider !== "brevo" && provider !== "resend") {
    throw new Error("Marketing email provider is not configured for sending");
  }

  const apiKey = provider === "resend" ? process.env.RESEND_API_KEY : process.env.BREVO_API_KEY;
  const fromEmail = process.env.MARKETING_MAIL_FROM_EMAIL;
  const replyTo = process.env.MARKETING_MAIL_REPLY_TO;
  const fromName = process.env.MARKETING_MAIL_FROM_NAME || "Kakebo";
  if (!apiKey || !fromEmail) throw new Error(`${provider} marketing email variables are incomplete`);

  if (provider === "resend") {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [email.to],
        subject: email.subject,
        html: email.html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });
    if (!response.ok) {
      const error = new Error(`Resend returned HTTP ${response.status}`);
      await recordMarketingEvent(email, { eventType: "failed", errorCode: String(response.status), provider: "resend" });
      throw error;
    }
    const data = (await response.json()) as { id?: string };
    await recordMarketingEvent(email, { eventType: "sent", providerMessageId: data.id, provider: "resend" });
    return { provider: "resend", messageId: data.id };
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": apiKey, "content-type": "application/json" },
    body: JSON.stringify({
      sender: { email: fromEmail, name: fromName },
      to: [{ email: email.to }],
      ...(replyTo ? { replyTo: { email: replyTo } } : {}),
      subject: email.subject,
      htmlContent: email.html,
      headers: { "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    }),
  });

  if (!response.ok) {
    const error = new Error(`Brevo returned HTTP ${response.status}`);
    await recordMarketingEvent(email, { eventType: "failed", errorCode: String(response.status), provider: "brevo" });
    throw error;
  }
  const data = (await response.json()) as { messageId?: string };
  await recordMarketingEvent(email, { eventType: "sent", providerMessageId: data.messageId, provider: "brevo" });
  return { provider: "brevo", messageId: data.messageId };
}

async function recordMarketingEvent(
  email: MarketingEmail,
  details: { eventType: string; providerMessageId?: string; errorCode?: string; provider?: string },
): Promise<void> {
  try {
    await createAdminClient().from("marketing_email_events").insert({
      user_id: email.userId || null,
      campaign_key: email.campaignKey,
      event_type: details.eventType,
      provider: details.provider || "brevo",
      provider_message_id: details.providerMessageId,
      error_code: details.errorCode,
      metadata: { recipient: email.to },
    });
  } catch (error) {
    console.error("Could not record marketing email event", error);
  }
}
