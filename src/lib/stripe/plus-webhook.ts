import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe/server";
import {
  applySubscription,
  getPlusPriceIds,
  idOf,
  linkBillingCustomer,
  normalizeSubscription,
  resolveSubscriptionUser,
  UUID_RE,
} from "@/lib/stripe/plus";

/**
 * Lógica de los eventos de suscripción de Stripe (webhook /api/webhooks/stripe-subscriptions).
 *
 * - checkout.session.completed: SOLO vincula usuario <-> customer. No concede acceso.
 * - customer.subscription.created|updated|deleted e invoice.paid|payment_failed: se recupera la suscripción en
 *   Stripe (estado actual, no el del evento) y se aplica con fn_apply_subscription_event, que es idempotente,
 *   ignora eventos antiguos y nunca concede acceso a otro usuario.
 * - Un fallo lanza una excepción: el route responde 500 y Stripe reintenta. Nada de aquí revoca acceso; el acceso solo
 *   caduca por el paso del tiempo (+ gracia) o por un estado verificado en Stripe.
 */
export const PLUS_EVENT_TYPES = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
]);

export interface HandleResult {
  result: string;
  reason?: string;
}

async function fetchFreshSubscription(subscriptionId: string, fallback?: Stripe.Subscription): Promise<Stripe.Subscription> {
  try {
    return await getStripe().subscriptions.retrieve(subscriptionId);
  } catch (error) {
    // Suscripción ya eliminada en Stripe: se usa el objeto del propio evento.
    if (fallback && (error as { code?: string }).code === "resource_missing") return fallback;
    throw error;
  }
}

async function applyFromSubscription(admin: SupabaseClient, event: Stripe.Event, sub: Stripe.Subscription): Promise<HandleResult> {
  const normalized = normalizeSubscription(sub, getPlusPriceIds());
  if (!normalized) return { result: "ignored", reason: "not_plus_subscription" };
  const userId = await resolveSubscriptionUser(admin, sub);
  const applied = await applySubscription(admin, {
    eventId: event.id,
    eventType: event.type,
    livemode: event.livemode,
    createdAt: new Date(event.created * 1000),
    userId,
    subscription: normalized,
  });
  return { result: applied.result, reason: applied.reason };
}

export async function handlePlusEvent(admin: SupabaseClient, event: Stripe.Event): Promise<HandleResult> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription") return { result: "ignored", reason: "not_subscription_session" };
      const userId = session.client_reference_id;
      const customerId = idOf(session.customer as string | { id: string } | null);
      if (!userId || !UUID_RE.test(userId) || session.metadata?.user_id !== userId || !customerId) {
        return { result: "ignored", reason: "session_without_user" };
      }
      const linked = await linkBillingCustomer(admin, userId, customerId, event.livemode);
      return linked ? { result: "linked" } : { result: "ignored", reason: "customer_conflict" };
    }

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const eventSub = event.data.object as Stripe.Subscription;
      const sub = await fetchFreshSubscription(eventSub.id, eventSub);
      return applyFromSubscription(admin, event, sub);
    }

    case "invoice.paid":
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = idOf(invoice.parent?.subscription_details?.subscription as string | { id: string } | null | undefined);
      if (!subId) return { result: "ignored", reason: "invoice_without_subscription" };
      const sub = await fetchFreshSubscription(subId);
      return applyFromSubscription(admin, event, sub);
    }

    default:
      return { result: "ignored", reason: "irrelevant_event" };
  }
}
