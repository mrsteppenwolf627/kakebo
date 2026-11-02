import { createHmac, timingSafeEqual } from "node:crypto";

export type MarketingEmail = {
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
  if (provider !== "brevo") {
    throw new Error("Marketing email provider is not configured for sending");
  }

  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.MARKETING_MAIL_FROM_EMAIL;
  const fromName = process.env.MARKETING_MAIL_FROM_NAME || "Kakebo";
  if (!apiKey || !fromEmail) throw new Error("Brevo marketing email variables are incomplete");

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": apiKey, "content-type": "application/json" },
    body: JSON.stringify({
      sender: { email: fromEmail, name: fromName },
      to: [{ email: email.to }],
      subject: email.subject,
      htmlContent: email.html,
      headers: { "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    }),
  });

  if (!response.ok) throw new Error(`Brevo returned HTTP ${response.status}`);
  const data = (await response.json()) as { messageId?: string };
  return { provider: "brevo", messageId: data.messageId };
}
