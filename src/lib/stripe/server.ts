import Stripe from "stripe";

/**
 * Official Stripe SDK client (server-only). Lazily created so that importing this module
 * never fails when the key is absent. Never log the key or any client created from it.
 */
let cached: Stripe | null = null;

export class StripeNotConfiguredError extends Error {
  constructor() {
    super("Stripe is not configured.");
    this.name = "StripeNotConfiguredError";
  }
}

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new StripeNotConfiguredError();
  if (!cached) cached = new Stripe(key, { maxNetworkRetries: 2 });
  return cached;
}
