// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import Stripe from "stripe";

const PRICE = "price_test_pack";
const OTHER_PRICE = "price_test_other";
const WHSEC = "whsec_FAKE_FIXTURE_FOR_TESTS";

const purchases = vi.hoisted(() => ({
  hasProcessedEvent: vi.fn(),
  markEventProcessed: vi.fn(),
  recordPaidPurchase: vi.fn(),
  revokePurchaseByPaymentIntent: vi.fn(),
}));
vi.mock("@/lib/premium/purchases", () => purchases);
vi.mock("@/lib/logger", () => ({ apiLogger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() } }));

// Real SDK for signature verification; only the network call (line items) is stubbed.
const listLineItems = vi.hoisted(() => vi.fn());
vi.mock("@/lib/stripe/server", async () => {
  const { default: S } = await import("stripe");
  const real = new S("sk_test_FAKE_FIXTURE_FOR_TESTS");
  return { getStripe: () => ({ webhooks: real.webhooks, checkout: { sessions: { listLineItems } } }) };
});

import { POST } from "@/app/api/webhooks/stripe/route";

const stripeLocal = new Stripe("sk_test_FAKE_FIXTURE_FOR_TESTS");

function session(over: Record<string, unknown> = {}) {
  return {
    id: "cs_test_a1B2c3D4e5F6g7H8",
    object: "checkout.session",
    mode: "payment",
    payment_status: "paid",
    amount_total: 990,
    currency: "eur",
    payment_intent: "pi_test_123",
    customer_details: { email: "buyer@example.com" },
    metadata: { product_key: "kakebo-master-system-pack" },
    ...over,
  };
}

function payload(type: string, object: unknown, id = "evt_test_1") {
  return JSON.stringify({ id, object: "event", type, livemode: false, data: { object } });
}

function signed(body: string, secret = WHSEC) {
  return stripeLocal.webhooks.generateTestHeaderString({ payload: body, secret });
}

function req(body: string, signature?: string | null) {
  const headers: Record<string, string> = {};
  if (signature) headers["stripe-signature"] = signature;
  return new Request("http://localhost:3000/api/webhooks/stripe", { method: "POST", body, headers });
}

beforeEach(() => {
  vi.stubEnv("PREMIUM_COMMERCE_ENABLED", "true");
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", WHSEC);
  vi.stubEnv("STRIPE_PREMIUM_PRICE_ID", PRICE);
  Object.values(purchases).forEach((m) => m.mockReset());
  purchases.hasProcessedEvent.mockResolvedValue(false);
  listLineItems.mockReset().mockResolvedValue({ data: [{ price: { id: PRICE }, quantity: 1 }] });
});
afterEach(() => vi.unstubAllEnvs());

describe("POST /api/webhooks/stripe — signature", () => {
  it("rejects a missing signature (400) and writes nothing", async () => {
    const res = await POST(req(payload("checkout.session.completed", session())));
    expect(res.status).toBe(400);
    expect(purchases.recordPaidPurchase).not.toHaveBeenCalled();
  });

  it("rejects an invalid signature (400) and writes nothing", async () => {
    const body = payload("checkout.session.completed", session());
    const res = await POST(req(body, signed(body, "whsec_WRONG_SECRET")));
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe("invalid_signature");
    expect(purchases.recordPaidPurchase).not.toHaveBeenCalled();
    expect(purchases.markEventProcessed).not.toHaveBeenCalled();
  });

  it("rejects a tampered body", async () => {
    const body = payload("checkout.session.completed", session());
    const header = signed(body);
    const res = await POST(req(body.replace("990", "100"), header));
    expect(res.status).toBe(400);
    expect(purchases.recordPaidPurchase).not.toHaveBeenCalled();
  });

  it("is closed when commerce is disabled or the secret is missing", async () => {
    const body = payload("checkout.session.completed", session());
    vi.stubEnv("PREMIUM_COMMERCE_ENABLED", "false");
    expect((await POST(req(body, signed(body)))).status).toBe(503);
    vi.stubEnv("PREMIUM_COMMERCE_ENABLED", "true");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "");
    expect((await POST(req(body, signed(body)))).status).toBe(503);
    expect(purchases.recordPaidPurchase).not.toHaveBeenCalled();
  });
});

describe("POST /api/webhooks/stripe — purchase creation", () => {
  it("creates exactly one purchase for a valid paid pack session", async () => {
    const body = payload("checkout.session.completed", session());
    const res = await POST(req(body, signed(body)));
    expect(res.status).toBe(200);
    expect(purchases.recordPaidPurchase).toHaveBeenCalledTimes(1);
    expect(purchases.recordPaidPurchase).toHaveBeenCalledWith({
      stripeSessionId: "cs_test_a1B2c3D4e5F6g7H8",
      stripePaymentIntentId: "pi_test_123",
      customerEmail: "buyer@example.com",
      amountTotal: 990,
      currency: "eur",
      livemode: false,
    });
    expect(purchases.markEventProcessed).toHaveBeenCalledWith("evt_test_1", "checkout.session.completed");
  });

  it("is idempotent: a repeated event id has no effect", async () => {
    purchases.hasProcessedEvent.mockResolvedValue(true);
    const body = payload("checkout.session.completed", session());
    const res = await POST(req(body, signed(body)));
    expect(res.status).toBe(200);
    expect((await res.json()).duplicate).toBe(true);
    expect(purchases.recordPaidPurchase).not.toHaveBeenCalled();
  });

  it.each([
    ["another product (metadata)", session({ metadata: { product_key: "something-else" } }), undefined],
    ["no metadata", session({ metadata: {} }), undefined],
    ["unpaid session", session({ payment_status: "unpaid" }), undefined],
    ["subscription mode", session({ mode: "subscription" }), undefined],
    ["wrong amount", session({ amount_total: 100 }), undefined],
    ["wrong currency", session({ currency: "usd" }), undefined],
    ["VAT added on top of 9,90 (amount_total 11,98)", session({ amount_total: 1198, total_details: { amount_tax: 208 } }), undefined],
    ["another price id", session(), [{ price: { id: OTHER_PRICE }, quantity: 1 }]],
    ["two line items", session(), [{ price: { id: PRICE }, quantity: 1 }, { price: { id: PRICE }, quantity: 1 }]],
    ["quantity 2", session(), [{ price: { id: PRICE }, quantity: 2 }]],
  ])("acknowledges but creates nothing for %s", async (_name, sess, items) => {
    if (items) listLineItems.mockResolvedValue({ data: items });
    const body = payload("checkout.session.completed", sess);
    const res = await POST(req(body, signed(body)));
    expect(res.status).toBe(200);
    expect(purchases.recordPaidPurchase).not.toHaveBeenCalled();
  });

  it("returns 500 (so Stripe retries) when persistence fails, and does not mark the event done", async () => {
    purchases.recordPaidPurchase.mockRejectedValue(new Error("db down"));
    const body = payload("checkout.session.completed", session());
    const res = await POST(req(body, signed(body)));
    expect(res.status).toBe(500);
    expect(purchases.markEventProcessed).not.toHaveBeenCalled();
  });

  it("ignores irrelevant event types", async () => {
    const body = payload("checkout.session.expired", session({ payment_status: "unpaid" }));
    const res = await POST(req(body, signed(body)));
    expect(res.status).toBe(200);
    expect(purchases.hasProcessedEvent).not.toHaveBeenCalled();
    expect(purchases.recordPaidPurchase).not.toHaveBeenCalled();
  });
});

describe("POST /api/webhooks/stripe — refunds and disputes", () => {
  it("revokes the purchase on charge.refunded", async () => {
    const body = payload("charge.refunded", { id: "ch_1", object: "charge", payment_intent: "pi_test_123" }, "evt_ref");
    const res = await POST(req(body, signed(body)));
    expect(res.status).toBe(200);
    expect(purchases.revokePurchaseByPaymentIntent).toHaveBeenCalledWith("pi_test_123", "refunded");
  });

  it("revokes the purchase on charge.dispute.created", async () => {
    const body = payload("charge.dispute.created", { id: "dp_1", object: "dispute", payment_intent: "pi_test_123" }, "evt_dp");
    await POST(req(body, signed(body)));
    expect(purchases.revokePurchaseByPaymentIntent).toHaveBeenCalledWith("pi_test_123", "disputed");
  });
});
