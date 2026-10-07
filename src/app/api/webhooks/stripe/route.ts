import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { isPremiumCommerceEnabled } from "@/lib/premium/config";
import {
  PREMIUM_PACK_AMOUNT_CENTS,
  PREMIUM_PACK_CURRENCY,
  PREMIUM_PACK_ID,
  PREMIUM_PRODUCT_METADATA_KEY,
} from "@/lib/premium/manifest";
import {
  hasProcessedEvent,
  markEventProcessed,
  recordPaidPurchase,
  revokePurchaseByPaymentIntent,
} from "@/lib/premium/purchases";
import { getStripe } from "@/lib/stripe/server";
import { apiLogger } from "@/lib/logger";

// Stripe webhook for the premium pack (guest purchase). It is the ONLY place that creates a
// purchase. Order: signature -> relevant event type -> idempotency -> validation -> write.
// Never log the body, the signature, the secret or customer data.

const NO_STORE = { "Cache-Control": "no-store" };
const ok = (extra: Record<string, unknown> = {}) =>
  NextResponse.json({ received: true, ...extra }, { status: 200, headers: NO_STORE });
const reject = (status: number, code: string) =>
  NextResponse.json({ received: false, code }, { status, headers: NO_STORE });

const RELEVANT = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "charge.refunded",
  "charge.dispute.created",
]);

const idOf = (v: string | { id: string } | null | undefined) => (typeof v === "string" ? v : v?.id ?? null);

async function isPackSession(session: Stripe.Checkout.Session): Promise<boolean> {
  const priceId = process.env.STRIPE_PREMIUM_PRICE_ID;
  if (!priceId) return false;
  if (session.mode !== "payment" || session.payment_status !== "paid") return false;
  if (session.metadata?.[PREMIUM_PRODUCT_METADATA_KEY] !== PREMIUM_PACK_ID) return false;
  if (session.amount_total !== PREMIUM_PACK_AMOUNT_CENTS) return false;
  if (session.currency?.toLowerCase() !== PREMIUM_PACK_CURRENCY) return false;

  // The line items are authoritative: exactly one item, our price, quantity 1.
  const items = await getStripe().checkout.sessions.listLineItems(session.id, { limit: 5 });
  return items.data.length === 1 && items.data[0].price?.id === priceId && items.data[0].quantity === 1;
}

export async function POST(request: Request) {
  if (!isPremiumCommerceEnabled()) return reject(503, "premium_commerce_disabled");

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret) return reject(503, "webhook_not_configured");
  if (!signature) return reject(400, "missing_signature");

  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, secret);
  } catch {
    return reject(400, "invalid_signature");
  }

  if (!RELEVANT.has(event.type)) return ok({ ignored: true });

  try {
    if (await hasProcessedEvent(event.id)) return ok({ duplicate: true });

    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (!(await isPackSession(session))) {
        // Other products, unpaid sessions or tampered terms: acknowledge, create nothing.
        await markEventProcessed(event.id, event.type);
        return ok({ ignored: true });
      }
      await recordPaidPurchase({
        stripeSessionId: session.id,
        stripePaymentIntentId: idOf(session.payment_intent),
        customerEmail: session.customer_details?.email ?? null,
        amountTotal: session.amount_total as number,
        currency: PREMIUM_PACK_CURRENCY,
        livemode: event.livemode,
      });
    } else {
      const obj = event.data.object as Stripe.Charge | Stripe.Dispute;
      const paymentIntent = idOf(obj.payment_intent as string | { id: string } | null);
      // Unknown payment intents are a no-op (purchases of other products are not ours).
      if (paymentIntent) {
        await revokePurchaseByPaymentIntent(paymentIntent, event.type === "charge.refunded" ? "refunded" : "disputed");
      }
    }

    await markEventProcessed(event.id, event.type);
    return ok();
  } catch {
    apiLogger.error({ eventType: event.type, reason: "processing_failed" }, "Premium webhook processing failed");
    // 500 makes Stripe retry; every write above is idempotent.
    return reject(500, "processing_failed");
  }
}
