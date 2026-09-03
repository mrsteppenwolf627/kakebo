const SIGNUP_INTENT_KEY = "kakebo_signup_intent";

/**
 * Marks that the OAuth redirect about to start was initiated from signup intent
 * (as opposed to a normal login), so the callback page can tell them apart.
 */
export function markGoogleSignupIntent() {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(SIGNUP_INTENT_KEY, "google");
}

export function clearGoogleSignupIntent() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(SIGNUP_INTENT_KEY);
}

/**
 * Reads and immediately deletes the signup intent flag, so a reload of the
 * callback page (or a second effect run) can never observe it again.
 */
export function consumeGoogleSignupIntent(): boolean {
  if (typeof window === "undefined") return false;
  const hadIntent = window.sessionStorage.getItem(SIGNUP_INTENT_KEY) === "google";
  window.sessionStorage.removeItem(SIGNUP_INTENT_KEY);
  return hadIntent;
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
