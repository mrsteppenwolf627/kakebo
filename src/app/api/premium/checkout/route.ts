import { NextResponse } from "next/server";
import { isPremiumCommerceEnabled } from "@/lib/premium/config";
import { PREMIUM_PACK_ID, PREMIUM_PRODUCT_METADATA_KEY } from "@/lib/premium/manifest";
import { getStripe, StripeNotConfiguredError } from "@/lib/stripe/server";
import { apiLogger } from "@/lib/logger";

// Premium checkout: creates a Stripe Checkout Session (mode "payment", guest, no account).
//
// The request body is IGNORED on purpose: price, product, quantity and email come exclusively
// from server configuration (STRIPE_PREMIUM_PRICE_ID). Access is never granted here; only the
// signed webhook creates the purchase.

const NO_STORE = { "Cache-Control": "no-store" };
const LANDING_PATH = "/herramientas/plantilla-kakebo-excel-premium";

function fail(code: string, message: string, status: number) {
  return NextResponse.json({ ok: false, code, message }, { status, headers: NO_STORE });
}

function siteOrigin(request?: Request): string | null {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/+$/, "");
  return request ? new URL(request.url).origin : null;
}

export async function POST(request?: Request) {
  if (!isPremiumCommerceEnabled()) {
    return fail("premium_commerce_disabled", "Premium checkout is not available yet.", 503);
  }

  const priceId = process.env.STRIPE_PREMIUM_PRICE_ID;
  const origin = siteOrigin(request);
  if (!priceId || !process.env.STRIPE_SECRET_KEY || !origin) {
    return fail("stripe_not_configured", "Premium checkout is enabled but Stripe is not configured yet.", 501);
  }

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { [PREMIUM_PRODUCT_METADATA_KEY]: PREMIUM_PACK_ID },
      payment_intent_data: { metadata: { [PREMIUM_PRODUCT_METADATA_KEY]: PREMIUM_PACK_ID } },
      success_url: `${origin}/api/premium/claim?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${LANDING_PATH}?checkout=cancelled`,
    });
    if (!session.url) return fail("checkout_unavailable", "Checkout is temporarily unavailable.", 502);
    return NextResponse.json({ ok: true, url: session.url }, { headers: NO_STORE });
  } catch (error) {
    apiLogger.error(
      { reason: error instanceof StripeNotConfiguredError ? "stripe_not_configured" : "stripe_error" },
      "Premium checkout session could not be created"
    );
    return fail("checkout_unavailable", "Checkout is temporarily unavailable.", 502);
  }
}
