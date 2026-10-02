const SIGNUP_INTENT_KEY = "kakebo_signup_intent";
const SIGNUP_SOURCE_KEY = "kakebo_signup_source";
const EMAIL_SIGNUP_PENDING_KEY = "kakebo_email_signup_pending";
const EMAIL_SIGNUP_SOURCE_KEY = "kakebo_email_signup_source";
const SIGNUP_CONFIRMED_TRACKED_KEY = "kakebo_signup_confirmed_tracked";

// Email confirmation and the sign-in it triggers happen in the same request,
// so a genuine confirmation has last_sign_in_at right next to the confirmation
// timestamp. A generous window absorbs slow code exchanges.
const EMAIL_CONFIRMATION_WINDOW_MS = 10 * 60 * 1000;

export const DEFAULT_ATTRIBUTION_SOURCE = "direct";

/**
 * Normalizes an attribution source coming from a query string or a link:
 * trims it and falls back to "direct" when it is missing or empty.
 */
export function resolveAttributionSource(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, 100) : DEFAULT_ATTRIBUTION_SOURCE;
}

/**
 * Reads the ?source= param from an internal href (e.g. "/login?source=foo"),
 * defaulting to "direct" when the link carries none.
 */
export function getSourceFromHref(href: string): string {
  try {
    return resolveAttributionSource(new URL(href, "http://kakebo.local").searchParams.get("source"));
  } catch {
    return DEFAULT_ATTRIBUTION_SOURCE;
  }
}

/**
 * Marks that the OAuth redirect about to start was initiated from signup intent
 * (as opposed to a normal login), so the callback page can tell them apart.
 * The attribution source travels with it so the callback can report it.
 */
export function markGoogleSignupIntent(source?: string | null) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(SIGNUP_INTENT_KEY, "google");
  window.sessionStorage.setItem(SIGNUP_SOURCE_KEY, resolveAttributionSource(source));
}

export function clearGoogleSignupIntent() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(SIGNUP_INTENT_KEY);
  window.sessionStorage.removeItem(SIGNUP_SOURCE_KEY);
}

/**
 * Reads and immediately deletes the signup intent flag and its source, so a
 * reload of the callback page (or a second effect run) can never observe them
 * again.
 */
export function consumeGoogleSignup(): { hadIntent: boolean; source: string } {
  if (typeof window === "undefined") return { hadIntent: false, source: DEFAULT_ATTRIBUTION_SOURCE };
  const hadIntent = window.sessionStorage.getItem(SIGNUP_INTENT_KEY) === "google";
  const source = resolveAttributionSource(window.sessionStorage.getItem(SIGNUP_SOURCE_KEY));
  window.sessionStorage.removeItem(SIGNUP_INTENT_KEY);
  window.sessionStorage.removeItem(SIGNUP_SOURCE_KEY);
  return { hadIntent, source };
}

export function consumeGoogleSignupIntent(): boolean {
  return consumeGoogleSignup().hadIntent;
}

/**
 * Remembers that an email signup was accepted and is waiting for the user to
 * confirm it from the email link.
 */
export function markEmailSignupPending(email: string, source?: string | null) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(EMAIL_SIGNUP_PENDING_KEY, email);
  window.sessionStorage.setItem(EMAIL_SIGNUP_SOURCE_KEY, resolveAttributionSource(source));
}

/**
 * Reads and immediately deletes the pending email signup marks. Returns null
 * when no email signup was pending.
 */
export function consumeEmailSignupPending(): { email: string; source: string } | null {
  if (typeof window === "undefined") return null;
  const email = window.sessionStorage.getItem(EMAIL_SIGNUP_PENDING_KEY);
  const source = resolveAttributionSource(window.sessionStorage.getItem(EMAIL_SIGNUP_SOURCE_KEY));
  window.sessionStorage.removeItem(EMAIL_SIGNUP_PENDING_KEY);
  window.sessionStorage.removeItem(EMAIL_SIGNUP_SOURCE_KEY);
  return email ? { email, source } : null;
}

/**
 * Builds the callback URL Supabase redirects to after the email confirmation
 * link, carrying the attribution source so it survives confirming the email in
 * a different browser (where sessionStorage is not shared).
 */
export function buildEmailCallbackUrl(origin: string, source?: string | null): string {
  return `${origin}/auth/callback?source=${encodeURIComponent(resolveAttributionSource(source))}`;
}

/**
 * Returns the source carried by the callback URL, or null when the URL has none
 * (so callers can fall back to sessionStorage).
 */
export function getSourceFromSearch(search: string): string | null {
  const value = new URLSearchParams(search).get("source")?.trim();
  return value ? resolveAttributionSource(value) : null;
}

/**
 * Whether a session user has really confirmed an email signup. Unlike
 * isLikelyNewUser this does not compare against created_at, because the
 * confirmation can happen minutes or hours after signing up. A user counts as
 * confirmed when email_confirmed_at (or confirmed_at) is set, and, if
 * last_sign_in_at is known, that sign-in is the confirmation one rather than a
 * much later login of an already confirmed account.
 */
export function isEmailSignupConfirmed(user: {
  email_confirmed_at?: string | null;
  confirmed_at?: string | null;
  last_sign_in_at?: string | null;
}): boolean {
  const confirmedAt = user.email_confirmed_at ?? user.confirmed_at;
  if (!confirmedAt) return false;
  if (!user.last_sign_in_at) return true;

  const confirmed = new Date(confirmedAt).getTime();
  const lastSignIn = new Date(user.last_sign_in_at).getTime();
  if (Number.isNaN(confirmed) || Number.isNaN(lastSignIn)) return true;

  return Math.abs(lastSignIn - confirmed) < EMAIL_CONFIRMATION_WINDOW_MS;
}

/**
 * Duplicate guard for sign_up_confirmed: returns true the first time it is
 * called for a user in this tab session and false afterwards, so a re-run of the
 * callback effect (or a reload) cannot report the same confirmation twice even
 * when the source comes from the URL.
 */
export function claimSignupConfirmation(userId: string | null | undefined): boolean {
  if (typeof window === "undefined") return false;
  const key = userId ?? "unknown";
  if (window.sessionStorage.getItem(SIGNUP_CONFIRMED_TRACKED_KEY) === key) return false;
  window.sessionStorage.setItem(SIGNUP_CONFIRMED_TRACKED_KEY, key);
  return true;
}

/**
 * Heuristic to avoid counting a returning user as a new sign-up: Supabase sets
 * created_at and last_sign_in_at to (near-)equal timestamps on a brand new
 * account's first sign-in, while a returning user's last_sign_in_at is far
 * ahead of their original created_at.
 */
export function isLikelyNewUser(user: { created_at?: string | null; last_sign_in_at?: string | null }): boolean {
  if (!user.created_at || !user.last_sign_in_at) return true;

  const created = new Date(user.created_at).getTime();
  const lastSignIn = new Date(user.last_sign_in_at).getTime();

  if (Number.isNaN(created) || Number.isNaN(lastSignIn)) return true;

  return Math.abs(lastSignIn - created) < 10_000;
}
