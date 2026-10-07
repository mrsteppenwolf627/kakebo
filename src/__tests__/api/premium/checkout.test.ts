// @vitest-environment node
import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import * as checkoutModule from "@/app/api/premium/checkout/route";

const { POST } = checkoutModule;

const SECRET = "FAKE_STRIPE_SECRET_FIXTURE_FOR_TESTS";

beforeEach(() => {
  vi.mocked(fetch).mockClear();
  vi.stubEnv("STRIPE_SECRET_KEY", SECRET);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("POST /api/premium/checkout — commerce disabled", () => {
  it.each([undefined, "false", "nope"])(
    "returns 503 premium_commerce_disabled (flag=%s)",
    async (flag) => {
      if (flag === undefined) delete process.env.PREMIUM_COMMERCE_ENABLED;
      else vi.stubEnv("PREMIUM_COMMERCE_ENABLED", flag);

      const res = await POST();
      const body = await res.json();

      expect(res.status).toBe(503);
      expect(body.ok).toBe(false);
      expect(body.code).toBe("premium_commerce_disabled");
      expect(res.headers.get("Cache-Control")).toBe("no-store");
    }
  );

  it("does not call Stripe or any network resource and creates no session", async () => {
    vi.stubEnv("PREMIUM_COMMERCE_ENABLED", "false");
    const body = await (await POST()).json();

    expect(fetch).not.toHaveBeenCalled();
    expect(body).not.toHaveProperty("url");
    expect(body).not.toHaveProperty("sessionId");
  });

  it("never exposes secrets", async () => {
    vi.stubEnv("PREMIUM_COMMERCE_ENABLED", "false");
    const text = await (await POST()).text();
    expect(text).not.toContain(SECRET);
    expect(text).not.toMatch(/sk_(live|test)_/);
  });
});

describe("POST /api/premium/checkout — commerce enabled, Stripe not configured", () => {
  beforeEach(() => {
    vi.stubEnv("PREMIUM_COMMERCE_ENABLED", "true");
  });

  it("returns 501 stripe_not_configured, never 500", async () => {
    const res = await POST();
    const body = await res.json();

    expect(res.status).toBe(501);
    expect(res.status).not.toBe(500);
    expect(body.ok).toBe(false);
    expect(body.code).toBe("stripe_not_configured");
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("does not call Stripe and does not create a session", async () => {
    const body = await (await POST()).json();
    expect(fetch).not.toHaveBeenCalled();
    expect(body).not.toHaveProperty("url");
    expect(body).not.toHaveProperty("sessionId");
  });

  it("does not expose keys or secrets even when Stripe keys exist in the environment", async () => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "FAKE_WEBHOOK_SECRET_FIXTURE");
    const text = await (await POST()).text();
    expect(text).not.toContain(SECRET);
    expect(text).not.toContain("FAKE_WEBHOOK_SECRET_FIXTURE");
    expect(text).not.toMatch(/sk_(live|test)_/);
  });
});

describe("/api/premium/checkout — methods and wiring", () => {
  it("only exports POST, so GET, PUT and DELETE get HTTP 405 from Next.js", () => {
    const exported = Object.keys(checkoutModule);
    expect(exported).toEqual(["POST"]);
    for (const method of ["GET", "PUT", "DELETE", "PATCH"]) {
      expect(exported).not.toContain(method);
    }
  });

  it("route source uses the shared Stripe SDK wrapper, never raw HTTP", () => {
    const src = fs.readFileSync(
      path.join(process.cwd(), "src/app/api/premium/checkout/route.ts"),
      "utf8"
    );
    const imports = src
      .split("\n")
      .filter((l) => /^\s*import\s/.test(l))
      .join("\n");
    expect(imports).toContain("@/lib/stripe/server");
    expect(src).not.toContain("api.stripe.com");
  });
});
