import { NextResponse } from "next/server";
import { isPremiumCommerceEnabled } from "@/lib/premium/config";

// Premium checkout entry point (PREPARED, NOT CONNECTED).
// Never calls Stripe and never creates records. Safe to hit: it always answers
// with a controlled JSON response and never throws.
//
// TODO when Stripe is connected (all of these are intentionally missing today):
//  - Require an authenticated user (Supabase session) or a verified email.
//  - Read the Stripe Price ID from env (e.g. STRIPE_PREMIUM_PRICE_ID).
//  - Create a Stripe Checkout Session (mode: "payment") with metadata
//    { product: "kakebo-master-system", user_id | email }.
//  - Provide success_url and cancel_url (localized, back to the premium landing).
//  - Return { ok: true, url: session.url } and let the client redirect.
//  - Emit the `checkout_started` analytics event client-side right before redirecting.
//  - Handle payment confirmation ONLY in a signed webhook (checkout.session.completed),
//    which must write the purchase/entitlement record (see /api/premium/download).
//  - The existing /api/stripe/* and /api/webhooks/stripe routes are disabled stubs
//    (410/200) from the old subscription model; do not reuse them blindly.

const NO_STORE = { "Cache-Control": "no-store" };

export async function POST() {
  if (!isPremiumCommerceEnabled()) {
    return NextResponse.json(
      {
        ok: false,
        code: "premium_commerce_disabled",
        message: "Premium checkout is not available yet.",
      },
      { status: 503, headers: NO_STORE }
    );
  }

  // Flag is on but there is no payment provider wired up yet: fail closed.
  return NextResponse.json(
    {
      ok: false,
      code: "stripe_not_configured",
      message: "Premium checkout is enabled but Stripe is not configured yet.",
    },
    { status: 501, headers: NO_STORE }
  );
}
