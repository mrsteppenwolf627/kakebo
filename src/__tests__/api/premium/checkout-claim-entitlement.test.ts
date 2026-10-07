// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const create = vi.hoisted(() => vi.fn());
vi.mock("@/lib/stripe/server", () => ({
  getStripe: () => ({ checkout: { sessions: { create } } }),
  StripeNotConfiguredError: class extends Error {},
}));
vi.mock("@/lib/logger", () => ({ apiLogger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() } }));

const store = vi.hoisted(() => ({
  findPurchaseByToken: vi.fn(),
  insertDownload: vi.fn(),
}));
vi.mock("@/lib/premium/purchases", async (orig) => {
  const actual = await orig<typeof import("@/lib/premium/purchases")>();
  return { ...actual, ...store };
});

import { POST } from "@/app/api/premium/checkout/route";
import { verifyPackEntitlement } from "@/lib/premium/delivery";
import { PREMIUM_ACCESS_COOKIE, generateAccessToken, hashAccessToken } from "@/lib/premium/purchases";

const PACK = "kakebo-master-system-pack";
const SESSION = "cs_test_a1B2c3D4e5F6g7H8";

beforeEach(() => {
  vi.stubEnv("PREMIUM_COMMERCE_ENABLED", "true");
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_FAKE_FIXTURE_FOR_TESTS");
  vi.stubEnv("STRIPE_PREMIUM_PRICE_ID", "price_test_pack");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://staging.example.test");
  create.mockReset().mockResolvedValue({ url: "https://checkout.stripe.com/c/pay/cs_test_x" });
  Object.values(store).forEach((m) => m.mockReset());
});
afterEach(() => vi.unstubAllEnvs());

describe("POST /api/premium/checkout — Stripe TEST session", () => {
  it("creates a payment-mode session from server-side config only", async () => {
    const res = await POST(
      new Request("http://localhost/api/premium/checkout", {
        method: "POST",
        // Hostile client input must be ignored.
        body: JSON.stringify({ price: "price_evil", amount: 1, email: "x@y.z", quantity: 99 }),
      })
    );
    expect(res.status).toBe(200);
    expect((await res.json()).url).toBe("https://checkout.stripe.com/c/pay/cs_test_x");
    expect(create).toHaveBeenCalledTimes(1);
    const args = create.mock.calls[0][0];
    expect(args.mode).toBe("payment");
    expect(args.line_items).toEqual([{ price: "price_test_pack", quantity: 1 }]);
    expect(args.metadata.product_key).toBe(PACK);
    expect(args.success_url).toBe("https://staging.example.test/api/premium/claim?session_id={CHECKOUT_SESSION_ID}");
    expect(args.cancel_url).toContain("checkout=cancelled");
    expect(JSON.stringify(args)).not.toMatch(/price_evil|x@y\.z/);
    expect(args.customer_email).toBeUndefined();
  });

  it("answers 501 when the price id is not configured and never calls Stripe", async () => {
    vi.stubEnv("STRIPE_PREMIUM_PRICE_ID", "");
    const res = await POST();
    expect(res.status).toBe(501);
    expect(create).not.toHaveBeenCalled();
  });

  it("answers a generic 502 (no Stripe details) when Stripe fails", async () => {
    create.mockRejectedValue(new Error("sk_test_LEAK something"));
    const res = await POST();
    const text = await res.text();
    expect(res.status).toBe(502);
    expect(text).not.toContain("sk_test_LEAK");
  });
});

describe("verifyPackEntitlement — guest cookie", () => {
  const withCookie = (c?: string) =>
    new Request("http://localhost/api/premium/download?file=excel&paid=true&token=x", {
      headers: c ? { cookie: c } : {},
    });

  it("grants for a valid, paid, non-revoked token cookie", async () => {
    store.findPurchaseByToken.mockResolvedValue({ purchaseId: "p1" });
    const r = await verifyPackEntitlement(PACK, withCookie(`a=1; ${PREMIUM_ACCESS_COOKIE}=GOOD; b=2`));
    expect(r).toEqual({ granted: true, purchaseId: "p1" });
    expect(store.findPurchaseByToken).toHaveBeenCalledWith("GOOD");
  });

  it("denies without cookie, ignoring ?paid=true and ?token=x", async () => {
    const r = await verifyPackEntitlement(PACK, withCookie());
    expect(r.granted).toBe(false);
    expect(store.findPurchaseByToken).not.toHaveBeenCalled();
  });

  it("denies unknown/revoked tokens, other packs and database errors (fail closed)", async () => {
    store.findPurchaseByToken.mockResolvedValue(null);
    expect((await verifyPackEntitlement(PACK, withCookie(`${PREMIUM_ACCESS_COOKIE}=REVOKED`))).granted).toBe(false);
    expect((await verifyPackEntitlement("other-pack", withCookie(`${PREMIUM_ACCESS_COOKIE}=GOOD`))).granted).toBe(false);
    store.findPurchaseByToken.mockRejectedValue(new Error("db"));
    expect((await verifyPackEntitlement(PACK, withCookie(`${PREMIUM_ACCESS_COOKIE}=GOOD`))).granted).toBe(false);
  });
});

describe("access token primitives", () => {
  it("tokens are long, unique and stored only as SHA-256 hex", () => {
    const a = generateAccessToken();
    const b = generateAccessToken();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(43);
    expect(hashAccessToken(a)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashAccessToken(a)).not.toContain(a);
  });
});
