// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";

const create = vi.hoisted(() => vi.fn());
vi.mock("@/lib/stripe/server", () => ({
  getStripe: () => ({ checkout: { sessions: { create } } }),
  StripeNotConfiguredError: class extends Error {},
}));
vi.mock("@/lib/logger", () => ({ apiLogger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() } }));

import { POST } from "@/app/api/premium/checkout/route";
import { applyLiveCopy } from "@/lib/premium/landing-live-copy";

beforeEach(() => {
  vi.stubEnv("PREMIUM_COMMERCE_ENABLED", "true");
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_FAKE_FIXTURE_FOR_TESTS");
  vi.stubEnv("STRIPE_PREMIUM_PRICE_ID", "price_test_pack");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://staging.example.test");
  create.mockReset().mockResolvedValue({ url: "https://checkout.stripe.com/c/pay/cs_test_x" });
});
afterEach(() => vi.unstubAllEnvs());

describe("fiscal configuration of the Checkout Session (price is tax-inclusive: 9,90 € total)", () => {
  it("sells the configured Price as is: no automatic tax, no extra tax rates, no ad-hoc price data", async () => {
    await POST(new Request("http://localhost/api/premium/checkout", { method: "POST" }));
    const args = create.mock.calls[0][0];
    expect(args.line_items).toEqual([{ price: "price_test_pack", quantity: 1 }]);
    expect(args.automatic_tax).toBeUndefined();
    expect(args.tax_id_collection).toBeUndefined();
    expect(JSON.stringify(args)).not.toMatch(/tax_rates|price_data|unit_amount/);
  });

  it("the commercial terms enforced by the webhook are exactly 990 cents in EUR", async () => {
    const { PREMIUM_PACK_AMOUNT_CENTS, PREMIUM_PACK_CURRENCY } = await import("@/lib/premium/manifest");
    expect(PREMIUM_PACK_AMOUNT_CENTS).toBe(990);
    expect(PREMIUM_PACK_CURRENCY).toBe("eur");
  });
});

describe("landing price copy (live) — no fiscal claim until validated", () => {
  const base = {
    meta: { description: "" },
    purchase: {},
    compare: { plus: {} },
    terms: { items: [["Precio", "x"], ["Disponibilidad", "y"]] },
    faq: { items: [["¿Cuánto cuesta?", "x"], ["¿Ya se puede comprar?", "y"]] },
    state: {},
    finalCta: {},
  };
  it.each([
    ["es", /9,90 €/, /pago único/i, /IVA/i],
    ["en", /€9\.90/, /one-time payment/i, /VAT/i],
  ] as const)("%s: states the price and one-time payment, never IVA/VAT", (locale, price, once, fiscal) => {
    const live = JSON.stringify(applyLiveCopy(base, locale));
    expect(live).toMatch(price);
    expect(live).toMatch(once);
    expect(live).not.toMatch(fiscal);
  });
});

describe("Referrer-Policy and Cache-Control configuration", () => {
  async function headerRules() {
    const mod = await import("../../../next.config");
    const config = mod.default as { headers?: () => Promise<{ source: string; headers: { key: string; value: string }[] }[]> };
    return (await config.headers!()) ?? [];
  }

  it("/api/premium/* gets no-referrer, declared after (so it overrides) the global rule", async () => {
    const rules = await headerRules();
    const global = rules.findIndex((r) => r.source === "/:path*" || r.source === "/(.*)");
    const premium = rules.findIndex((r) => r.source === "/api/premium/:path*");
    expect(premium).toBeGreaterThan(-1);
    expect(premium).toBeGreaterThan(global);
    expect(rules[premium].headers).toEqual([{ key: "Referrer-Policy", value: "no-referrer" }]);
  });

  it("the global Referrer-Policy is unchanged for every other route", async () => {
    const rules = await headerRules();
    const global = rules.find((r) => r.source === "/:path*" || r.source === "/(.*)")!;
    expect(global.headers.find((h) => h.key === "Referrer-Policy")?.value).toBe("strict-origin-when-cross-origin");
  });

  it("only the premium rule was added to next.config.ts", () => {
    const src = fs.readFileSync(path.join(process.cwd(), "next.config.ts"), "utf8");
    expect(src.match(/source:/g)?.length).toBe(2);
  });

  it("the premium routes set Cache-Control: no-store themselves", () => {
    for (const r of ["claim", "download", "checkout"]) {
      const src = fs.readFileSync(path.join(process.cwd(), `src/app/api/premium/${r}/route.ts`), "utf8");
      expect(src).toMatch(/no-store/);
    }
  });
});
