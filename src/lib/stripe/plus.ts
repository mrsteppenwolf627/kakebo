/**
 * Suscripción Kakebo Plus con Stripe — utilidades server-only.
 *
 * Reglas:
 *  - Los precios se resuelven en el servidor a partir de variables de entorno (price IDs). El navegador solo elige
 *    el intervalo ("month" | "year"); nunca un precio, un customer ni un user_id.
 *  - Solo se aceptan suscripciones con UN item cuyo price sea exactamente uno de los dos precios Plus. Cualquier otra
 *    suscripción (otro producto, varios items) se ignora y no concede nada.
 *  - Todas las escrituras de facturación van con el cliente service_role (createAdminClient), nunca con la sesión.
 *  - Nada de este módulo registra claves, firmas, cuerpos de eventos ni datos personales.
 */
import { createHash } from "node:crypto";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

export type PlusInterval = "month" | "year";
export type PlanInterval = "monthly" | "annual";

export class PlusConfigError extends Error {
  constructor(what: string) {
    super(`Plus billing is not configured: ${what}`);
    this.name = "PlusConfigError";
  }
}

export interface PlusPriceIds {
  month: string;
  year: string;
}

export function getPlusPriceIds(env: Record<string, string | undefined> = process.env): PlusPriceIds {
  const month = env.STRIPE_PLUS_PRICE_MONTHLY_ID;
  const year = env.STRIPE_PLUS_PRICE_ANNUAL_ID;
  if (!month || !/^price_[A-Za-z0-9]+$/.test(month)) throw new PlusConfigError("STRIPE_PLUS_PRICE_MONTHLY_ID");
  if (!year || !/^price_[A-Za-z0-9]+$/.test(year)) throw new PlusConfigError("STRIPE_PLUS_PRICE_ANNUAL_ID");
  return { month, year };
}

/** URL base de la web. Solo https, o http en localhost (desarrollo). Sin barra final. */
export function getSiteUrl(env: Record<string, string | undefined> = process.env): string {
  const raw = env.NEXT_PUBLIC_SITE_URL;
  if (!raw) throw new PlusConfigError("NEXT_PUBLIC_SITE_URL");
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new PlusConfigError("NEXT_PUBLIC_SITE_URL");
  }
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !(local && url.protocol === "http:")) throw new PlusConfigError("NEXT_PUBLIC_SITE_URL");
  return url.origin;
}

/** URL absoluta de una página de la app respetando el prefijo de idioma (es = sin prefijo, en = /en). */
export function appUrl(site: string, locale: "es" | "en", pathname: string): string {
  return `${site}${locale === "en" ? "/en" : ""}${pathname}`;
}

/** ¿La clave de Stripe configurada es de producción (live)? */
export function isLiveStripeKey(env: Record<string, string | undefined> = process.env): boolean {
  const key = env.STRIPE_SECRET_KEY ?? "";
  return key.startsWith("sk_live_") || key.startsWith("rk_live_");
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const idOf = (v: string | { id: string } | null | undefined): string | null =>
  typeof v === "string" ? v : v?.id ?? null;

const iso = (ts: number | null | undefined): string | null => (typeof ts === "number" ? new Date(ts * 1000).toISOString() : null);

export interface NormalizedSubscription {
  subscription_id: string;
  customer_id: string;
  status: string;
  interval: PlanInterval;
  current_period_start: string | null;
  current_period_end: string;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  ended_at: string | null;
  price_id: string;
  latest_invoice_id: string | null;
}

/** Normaliza una suscripción de Stripe al contrato de fn_apply_subscription_event. `null` = no es una suscripción Plus. */
export function normalizeSubscription(sub: Stripe.Subscription, prices: PlusPriceIds): NormalizedSubscription | null {
  const items = sub.items?.data ?? [];
  if (items.length !== 1) return null;
  const item = items[0];
  const priceId = item.price?.id;
  let interval: PlanInterval;
  if (priceId === prices.month) interval = "monthly";
  else if (priceId === prices.year) interval = "annual";
  else return null;

  const customer = idOf(sub.customer as string | { id: string });
  if (!customer || typeof item.current_period_end !== "number") return null;

  return {
    subscription_id: sub.id,
    customer_id: customer,
    status: sub.status,
    interval,
    current_period_start: iso(item.current_period_start),
    current_period_end: iso(item.current_period_end)!,
    cancel_at_period_end: Boolean(sub.cancel_at_period_end),
    canceled_at: iso(sub.canceled_at),
    ended_at: iso(sub.ended_at),
    price_id: priceId,
    latest_invoice_id: idOf(sub.latest_invoice as string | { id: string } | null),
  };
}

type Admin = SupabaseClient;

export async function getBillingCustomerId(admin: Admin, userId: string): Promise<string | null> {
  const { data, error } = await admin.from("billing_customers").select("stripe_customer_id").eq("user_id", userId).maybeSingle();
  if (error) throw new Error("billing_customers lookup failed");
  return (data as { stripe_customer_id: string } | null)?.stripe_customer_id ?? null;
}

/**
 * Usuario dueño de una suscripción: billing_customers es la fuente de verdad. Si no hay mapeo, solo se acepta
 * metadata.user_id (que fija el servidor al crear el Checkout) con formato UUID; fn_apply_subscription_event
 * vuelve a validar existencia del usuario y propiedad del customer/suscripción.
 */
export async function resolveSubscriptionUser(admin: Admin, sub: Stripe.Subscription): Promise<string | null> {
  const customer = idOf(sub.customer as string | { id: string });
  const meta = sub.metadata?.user_id;
  if (customer) {
    const { data, error } = await admin.from("billing_customers").select("user_id").eq("stripe_customer_id", customer).maybeSingle();
    if (error) throw new Error("billing_customers lookup failed");
    const mapped = (data as { user_id: string } | null)?.user_id;
    if (mapped) {
      if (meta && meta !== mapped) return null; // metadata contradice al mapeo: no se concede nada
      return mapped;
    }
  }
  return meta && UUID_RE.test(meta) ? meta : null;
}

export interface ApplyResult {
  applied: boolean;
  result: string;
  reason?: string;
  state?: string;
}

export async function applySubscription(
  admin: Admin,
  args: { eventId: string; eventType: string; livemode: boolean; createdAt: Date; userId: string | null; subscription: NormalizedSubscription },
): Promise<ApplyResult> {
  const { data, error } = await admin.rpc("fn_apply_subscription_event", {
    p_event_id: args.eventId,
    p_event_type: args.eventType,
    p_livemode: args.livemode,
    p_event_created: args.createdAt.toISOString(),
    p_user_id: args.userId,
    p_subscription: args.subscription,
  });
  if (error) throw new Error("fn_apply_subscription_event failed");
  return data as ApplyResult;
}

/** Id de evento sintético y determinista para sincronizaciones (sync) — idempotente por estado de la suscripción. */
export function syncEventId(sub: NormalizedSubscription): string {
  const h = createHash("sha256")
    .update([sub.subscription_id, sub.status, sub.current_period_end, sub.cancel_at_period_end, sub.latest_invoice_id ?? ""].join("|"))
    .digest("hex")
    .slice(0, 32);
  return `evt_sync_${h}`;
}

/** Vincula usuario <-> customer (sin conceder acceso). Devuelve false si el vínculo choca con otro usuario/cliente. */
export async function linkBillingCustomer(admin: Admin, userId: string, customerId: string, livemode: boolean): Promise<boolean> {
  const existing = await getBillingCustomerId(admin, userId);
  if (existing) return existing === customerId;
  const { data: owner, error: ownerError } = await admin.from("billing_customers").select("user_id").eq("stripe_customer_id", customerId).maybeSingle();
  if (ownerError) throw new Error("billing_customers lookup failed");
  if (owner) return (owner as { user_id: string }).user_id === userId;
  const { error } = await admin.from("billing_customers").insert({ user_id: userId, stripe_customer_id: customerId, livemode });
  if (error) {
    if ((error as { code?: string }).code === "23505") return (await getBillingCustomerId(admin, userId)) === customerId;
    throw new Error("billing_customers insert failed");
  }
  return true;
}
