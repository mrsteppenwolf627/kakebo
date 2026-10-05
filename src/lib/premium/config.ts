/**
 * Premium product ("Kakebo Master System") commerce configuration.
 *
 * Server-only. `PREMIUM_COMMERCE_ENABLED` follows the project convention for
 * feature flags (plain env var compared against the string "true", like
 * `ENABLE_WRITE_CONFIRMATION`). Missing or any other value means DISABLED.
 *
 * Do not prefix it with NEXT_PUBLIC_: the flag is read on the server and the
 * landing receives the result as a prop.
 */
export function isPremiumCommerceEnabled(): boolean {
  return process.env.PREMIUM_COMMERCE_ENABLED === "true";
}

/**
 * Local-only folder reserved for the premium Excel/PDF while commerce is being built.
 * It lives OUTSIDE `public/` and its contents are git-ignored (see .gitignore).
 * It is NOT the production solution: the final destination should be private
 * storage (e.g. a private Supabase Storage bucket) served through a protected
 * download route. See docs/planning/premium-commerce-architecture.md.
 */
export const PREMIUM_PRIVATE_DIR = "private/premium";
