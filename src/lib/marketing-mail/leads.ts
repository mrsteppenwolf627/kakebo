import { createHmac, timingSafeEqual } from "node:crypto";

export const LEAD_CONSENT_TEXT_VERSION = "2026-11-05";
export const LEAD_PRIVACY_POLICY_VERSION = "2026-11-02";
export const LEAD_CONFIRMATION_RESEND_MS = 10 * 60 * 1000;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type LeadAction = "confirm" | "unsubscribe";

export function normalizeLeadEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (email.length < 5 || email.length > 254 || !EMAIL_PATTERN.test(email)) return null;
  return email;
}

/** Fuentes de captación permitidas: solo claves cortas conocidas, nunca texto libre del cliente. */
export function normalizeLeadSource(value: unknown): string {
  return typeof value === "string" && /^[a-z0-9_]{1,40}$/.test(value) ? value : "unknown";
}

function secret(): string {
  const value = process.env.MARKETING_UNSUBSCRIBE_SECRET;
  if (!value) throw new Error("MARKETING_UNSUBSCRIBE_SECRET is not configured");
  return value;
}

export function signLeadAction(leadId: string, action: LeadAction): string {
  return createHmac("sha256", secret()).update(`lead:${action}:${leadId}`).digest("hex");
}

export function verifyLeadAction(leadId: string, action: LeadAction, signature: string): boolean {
  try {
    const expected = Buffer.from(signLeadAction(leadId, action));
    const received = Buffer.from(signature);
    return expected.length === received.length && timingSafeEqual(expected, received);
  } catch {
    return false;
  }
}

function baseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "https://www.metodokakebo.com";
}

export function leadActionUrl(leadId: string, action: LeadAction): string {
  return `${baseUrl()}/api/marketing/leads/${action}?id=${encodeURIComponent(leadId)}&s=${signLeadAction(leadId, action)}`;
}
