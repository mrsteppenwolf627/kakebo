// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const logSpy = vi.hoisted(() => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() }));
vi.mock("@/lib/logger", () => ({ apiLogger: logSpy }));

// In-memory model of the database function `claim_premium_purchase` (row lock => one winner).
type Row = { status: "paid" | "refunded" | "disputed"; claimed: boolean };
const db = vi.hoisted(() => ({ rows: new Map<string, { status: string; claimed: boolean }>(), tokens: [] as string[] }));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    // Each rpc call runs to completion before another starts, like a serialized row lock.
    rpc: async (_fn: string, args: { p_session_id: string; p_token_hash: string }) => {
      await Promise.resolve();
      const row = db.rows.get(args.p_session_id);
      if (!row) return { data: "not_found", error: null };
      if (row.status !== "paid") return { data: "not_paid", error: null };
      if (row.claimed) return { data: "already_claimed", error: null };
      row.claimed = true;
      db.tokens.push(args.p_token_hash);
      return { data: "claimed", error: null };
    },
  }),
}));

import { GET } from "@/app/api/premium/claim/route";
import { PREMIUM_ACCESS_COOKIE } from "@/lib/premium/purchases";

const SESSION = "cs_test_a1B2c3D4e5F6g7H8";
const url = (q: string) => new Request("http://localhost:3000/api/premium/claim" + q);
const seed = (status: Row["status"] = "paid", claimed = false) => db.rows.set(SESSION, { status, claimed });

beforeEach(() => {
  vi.stubEnv("PREMIUM_COMMERCE_ENABLED", "true");
  db.rows.clear();
  db.tokens.length = 0;
  Object.values(logSpy).forEach((m) => m.mockClear());
});
afterEach(() => vi.unstubAllEnvs());

describe("GET /api/premium/claim — single use", () => {
  it("first valid claim: 303 to a clean URL, HttpOnly cookie, no-store, no-referrer", async () => {
    seed();
    const res = await GET(url("?session_id=" + SESSION));
    expect(res.status).toBe(303);
    const location = res.headers.get("Location") ?? "";
    expect(location).toContain("checkout=success");
    expect(location).not.toContain("session_id");
    expect(location).not.toContain(SESSION);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(res.headers.get("Referrer-Policy")).toBe("no-referrer");
    const cookie = (res.headers.get("set-cookie") ?? "").toLowerCase();
    expect(cookie).toContain(PREMIUM_ACCESS_COOKIE);
    expect(cookie).toContain("httponly");
    expect(cookie).toContain("samesite=lax");
    expect(cookie).toContain("path=/api/premium");
    expect(db.tokens).toHaveLength(1);
  });

  it("second claim with the same session id: refused, no cookie, no new token", async () => {
    seed();
    await GET(url("?session_id=" + SESSION));
    const res = await GET(url("?session_id=" + SESSION));
    expect(res.status).toBe(303);
    expect(res.headers.get("Location")).toContain("checkout=already_claimed");
    expect(res.headers.get("Location")).not.toContain("session_id");
    expect(res.headers.get("set-cookie")).toBeNull();
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(db.tokens).toHaveLength(1);
  });

  it("two concurrent claims: exactly one succeeds, exactly one token exists", async () => {
    seed();
    const results = await Promise.all([GET(url("?session_id=" + SESSION)), GET(url("?session_id=" + SESSION))]);
    const cookies = results.map((r) => r.headers.get("set-cookie")).filter(Boolean);
    const outcomes = results.map((r) => r.headers.get("Location") ?? "").sort();
    expect(cookies).toHaveLength(1);
    expect(outcomes[0]).toContain("already_claimed");
    expect(outcomes[1]).toContain("success");
    expect(db.tokens).toHaveLength(1);
  });

  it.each(["", "?session_id=", "?session_id=abc", "?paid=true", "?session_id=cs_test_x'%20or%201=1"])(
    "invalid session id %s: refused without touching the database",
    async (q) => {
      seed();
      const res = await GET(url(q));
      expect(res.headers.get("Location")).toContain("checkout=invalid");
      expect(res.headers.get("set-cookie")).toBeNull();
      expect(db.tokens).toHaveLength(0);
      expect(db.rows.get(SESSION)?.claimed).toBe(false);
    }
  );

  it("payment not confirmed by the webhook yet: no claim consumed, no cookie, short polling page", async () => {
    const res = await GET(url("?session_id=" + SESSION));
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toBeNull();
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(res.headers.get("Referrer-Policy")).toBe("no-referrer");
    expect(await res.text()).toContain("n=1");
    expect(db.tokens).toHaveLength(0);
  });

  it("gives up polling with a clean URL after the retry limit", async () => {
    const res = await GET(url("?session_id=" + SESSION + "&n=20"));
    expect(res.status).toBe(303);
    expect(res.headers.get("Location")).toContain("checkout=pending");
    expect(res.headers.get("Location")).not.toContain("session_id");
  });

  it.each(["refunded", "disputed"] as const)("a %s purchase cannot be claimed", async (status) => {
    seed(status);
    const res = await GET(url("?session_id=" + SESSION));
    expect(res.headers.get("Location")).toContain("checkout=unavailable");
    expect(res.headers.get("set-cookie")).toBeNull();
    expect(db.tokens).toHaveLength(0);
  });

  it("is closed when commerce is disabled", async () => {
    vi.stubEnv("PREMIUM_COMMERCE_ENABLED", "false");
    seed();
    const res = await GET(url("?session_id=" + SESSION));
    expect(res.headers.get("Location")).toContain("checkout=unavailable");
    expect(db.tokens).toHaveLength(0);
  });
});

describe("GET /api/premium/claim — logging", () => {
  it("never logs the session id, token or cookie, even when the database fails", async () => {
    seed();
    await GET(url("?session_id=" + SESSION));
    await GET(url("?session_id=" + SESSION));
    await GET(url("?session_id=bad"));

    vi.doMock("@/lib/premium/purchases", async (orig) => {
      const actual = await orig<typeof import("@/lib/premium/purchases")>();
      return { ...actual, claimPurchase: async () => { throw new Error("db down " + SESSION); } };
    });
    vi.resetModules();
    const { GET: failing } = await import("@/app/api/premium/claim/route");
    const res = await failing(url("?session_id=" + SESSION));
    expect(res.headers.get("Location")).toContain("checkout=error");
    vi.doUnmock("@/lib/premium/purchases");

    const logged = JSON.stringify(Object.values(logSpy).flatMap((m) => m.mock.calls));
    expect(logged).not.toContain(SESSION);
    expect(logged).not.toContain("session_id");
    expect(logged).not.toMatch(/token|cookie|signedUrl/i);
  });
});
