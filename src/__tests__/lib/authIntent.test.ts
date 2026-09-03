import { describe, it, expect, beforeEach } from "vitest";
import {
  markGoogleSignupIntent,
  clearGoogleSignupIntent,
  consumeGoogleSignupIntent,
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
