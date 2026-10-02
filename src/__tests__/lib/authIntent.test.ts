import { describe, it, expect, beforeEach } from "vitest";
import {
  markGoogleSignupIntent,
  clearGoogleSignupIntent,
  consumeGoogleSignupIntent,
  consumeGoogleSignup,
  markEmailSignupPending,
  consumeEmailSignupPending,
  getSourceFromHref,
  getSourceFromSearch,
  buildEmailCallbackUrl,
  isEmailSignupConfirmed,
  claimSignupConfirmation,
  resolveAttributionSource,
  isLikelyNewUser,
} from "@/lib/authIntent";

describe("authIntent", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("marks and consumes the Google signup intent exactly once", () => {
    markGoogleSignupIntent();

    expect(consumeGoogleSignupIntent()).toBe(true);
    expect(consumeGoogleSignupIntent()).toBe(false);
  });

  it("clears the intent so a later consume returns false", () => {
    markGoogleSignupIntent();
    clearGoogleSignupIntent();

    expect(consumeGoogleSignupIntent()).toBe(false);
  });

  it("returns false from consume when no intent was ever marked", () => {
    expect(consumeGoogleSignupIntent()).toBe(false);
  });

  it("keeps the source with the Google signup intent and consumes both once", () => {
    markGoogleSignupIntent("calculadora_ahorro");

    expect(consumeGoogleSignup()).toEqual({ hadIntent: true, source: "calculadora_ahorro" });
    expect(consumeGoogleSignup()).toEqual({ hadIntent: false, source: "direct" });
  });

  it("defaults the Google signup source to direct", () => {
    markGoogleSignupIntent();

    expect(consumeGoogleSignup()).toEqual({ hadIntent: true, source: "direct" });
  });

  it("clearing the Google intent also clears its source", () => {
    markGoogleSignupIntent("blog");
    clearGoogleSignupIntent();

    expect(window.sessionStorage.getItem("kakebo_signup_source")).toBeNull();
  });

  it("stores and consumes the pending email signup exactly once", () => {
    markEmailSignupPending("a@b.com", "blog_excel");

    expect(window.sessionStorage.getItem("kakebo_email_signup_pending")).toBe("a@b.com");
    expect(consumeEmailSignupPending()).toEqual({ email: "a@b.com", source: "blog_excel" });
    expect(consumeEmailSignupPending()).toBeNull();
    expect(window.sessionStorage.getItem("kakebo_email_signup_source")).toBeNull();
  });

  it("resolves attribution sources with a direct fallback", () => {
    expect(resolveAttributionSource(null)).toBe("direct");
    expect(resolveAttributionSource("  ")).toBe("direct");
    expect(resolveAttributionSource(" blog ")).toBe("blog");
  });

  it("reads source from an href and falls back to direct", () => {
    expect(getSourceFromHref("/login?mode=signup&source=calculadora_ahorro")).toBe("calculadora_ahorro");
    expect(getSourceFromHref("/login")).toBe("direct");
    expect(getSourceFromHref("/app")).toBe("direct");
  });

  it("builds the email callback URL with an encoded source, defaulting to direct", () => {
    expect(buildEmailCallbackUrl("https://x.test", "calculator_503020")).toBe(
      "https://x.test/auth/callback?source=calculator_503020"
    );
    expect(buildEmailCallbackUrl("https://x.test")).toBe("https://x.test/auth/callback?source=direct");
    expect(buildEmailCallbackUrl("https://x.test", "a b&c")).toBe("https://x.test/auth/callback?source=a%20b%26c");
  });

  it("reads the source from a callback search string and returns null when absent", () => {
    expect(getSourceFromSearch("?code=1&source=blog_excel")).toBe("blog_excel");
    expect(getSourceFromSearch("?code=1")).toBeNull();
    expect(getSourceFromSearch("?source=")).toBeNull();
  });

  it("confirms an email signup from email_confirmed_at or confirmed_at, hours after created_at", () => {
    const base = { last_sign_in_at: "2026-09-03T12:30:01.000Z" };
    expect(isEmailSignupConfirmed({ ...base, email_confirmed_at: "2026-09-03T12:30:00.000Z" })).toBe(true);
    expect(isEmailSignupConfirmed({ ...base, email_confirmed_at: null, confirmed_at: "2026-09-03T12:30:00.000Z" })).toBe(true);
    expect(isEmailSignupConfirmed({ email_confirmed_at: "2026-09-03T12:30:00.000Z" })).toBe(true);
  });

  it("does not confirm an email signup without confirmation timestamps", () => {
    expect(isEmailSignupConfirmed({ last_sign_in_at: "2026-09-03T12:30:01.000Z" })).toBe(false);
    expect(isEmailSignupConfirmed({ email_confirmed_at: null, confirmed_at: null })).toBe(false);
  });

  it("does not treat a much later login of an already confirmed account as a confirmation", () => {
    expect(
      isEmailSignupConfirmed({
        email_confirmed_at: "2020-01-01T00:05:00.000Z",
        last_sign_in_at: "2026-09-03T12:30:01.000Z",
      })
    ).toBe(false);
  });

  it("lets a signup confirmation be claimed once per user and tab session", () => {
    expect(claimSignupConfirmation("user-1")).toBe(true);
    expect(claimSignupConfirmation("user-1")).toBe(false);
    expect(claimSignupConfirmation("user-2")).toBe(true);
  });

  it("treats a user whose last_sign_in_at matches created_at as new", () => {
    const now = new Date().toISOString();
    expect(isLikelyNewUser({ created_at: now, last_sign_in_at: now })).toBe(true);
  });

  it("treats a user with a last_sign_in_at far after created_at as returning", () => {
    const created = new Date("2020-01-01T00:00:00Z").toISOString();
    const lastSignIn = new Date("2026-01-01T00:00:00Z").toISOString();
    expect(isLikelyNewUser({ created_at: created, last_sign_in_at: lastSignIn })).toBe(false);
  });
});
