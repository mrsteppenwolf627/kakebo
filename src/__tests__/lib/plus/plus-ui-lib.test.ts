// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";

const h = vi.hoisted(() => ({
  user: { id: "u1" } as { id: string } | null,
  rpc: { data: null as unknown, error: null as unknown },
  subs: [] as unknown[],
  billing: null as unknown,
  calls: { createClient: 0, createAdmin: 0 },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => {
    h.calls.createClient++;
    return { auth: { getUser: async () => ({ data: { user: h.user } }) }, rpc: async () => h.rpc };
  },
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => {
    h.calls.createAdmin++;
    const chain: Record<string, unknown> = {};
    chain.select = () => chain;
    chain.eq = () => chain;
    chain.in = () => chain;
    chain.order = () => chain;
    chain.limit = async () => ({ data: h.subs });
    chain.maybeSingle = async () => ({ data: h.billing });
    return { from: () => chain };
  },
}));

import { buildPlusView, getPlusAccessView, isAiBlocked, type SubscriptionRow } from "@/lib/plus/access-view";
import {
  isPlusRequired, isSafeStripeUrl, kindFromStatus, openPortal, readApiFailure, startCheckout, syncCheckout,
} from "@/lib/plus/client";
import { PLUS_ANNUAL_CENTS, PLUS_ANNUAL_SAVING_CENTS, PLUS_MONTHLY_CENTS, formatEur } from "@/lib/plus/pricing";
import type { MyAccess } from "@/lib/auth/require-access";

const perms = (premium: boolean, billing = false) => ({
  can_create_expense: true, can_use_ai: premium, can_export_reports: premium, can_use_plus_features: premium, can_manage_billing: billing,
});
const access = (state: MyAccess["state"], o: Partial<MyAccess> = {}): MyAccess => ({
  state, is_premium: state !== "free_under_limit" && state !== "free_readonly", 
  plus_access_until: null, cancel_at_period_end: false, free_expenses_used: null, free_expenses_limit: 30,
  permissions: perms(state !== "free_under_limit" && state !== "free_readonly"), ...o,
});
const sub = (o: Partial<SubscriptionRow> = {}): SubscriptionRow => ({
  status: "active", plan_interval: "monthly", current_period_start: "2026-10-01T00:00:00Z", current_period_end: "2026-11-01T00:00:00Z",
  cancel_at_period_end: false, ...o,
});

beforeEach(() => {
  h.user = { id: "u1" };
  h.rpc = { data: access("plus_active", { plus_access_until: "2026-11-01T00:00:00Z" }), error: null };
  h.subs = [sub()];
  h.billing = { user_id: "u1" };
  h.calls.createClient = 0;
  h.calls.createAdmin = 0;
});
afterEach(() => vi.unstubAllEnvs());

describe("getPlusAccessView — flag", () => {
  it("apagado (por defecto o cualquier valor distinto de \"true\"): no consulta nada y devuelve disabled", async () => {
    for (const v of [undefined, "", "false", "TRUE", "1"]) {
      vi.unstubAllEnvs();
      if (v !== undefined) vi.stubEnv("PLUS_SUBSCRIPTIONS_ENABLED", v);
      expect(await getPlusAccessView()).toEqual({ status: "disabled" });
    }
    expect(h.calls).toEqual({ createClient: 0, createAdmin: 0 });
    expect(isAiBlocked({ status: "disabled" })).toBe(false);
  });

  describe("encendido", () => {
    beforeEach(() => vi.stubEnv("PLUS_SUBSCRIPTIONS_ENABLED", "true"));

    it("sin sesión -> unauthenticated; error de fn_my_access -> error (nunca estados inventados)", async () => {
      h.user = null;
      expect(await getPlusAccessView()).toEqual({ status: "unauthenticated" });
      h.user = { id: "u1" };
      h.rpc = { data: null, error: { message: "boom" } };
      expect(await getPlusAccessView()).toEqual({ status: "error" });
      h.rpc = { data: { nope: true }, error: null };
      expect(await getPlusAccessView()).toEqual({ status: "error" });
    });

    it("lee el estado propio y el plan de SU suscripción", async () => {
      const v = await getPlusAccessView();
      expect(v).toMatchObject({ status: "ready", state: "plus_active", planInterval: "monthly", plusAccessUntil: "2026-11-01T00:00:00Z", pastDue: false, hasBillingAccount: true });
    });
  });
});

describe("buildPlusView — estados", () => {
  it("sin trial: la vista no expone campos de trial", () => {
    const v = buildPlusView(access("free_under_limit", { free_expenses_used: 3 }), null, false);
    expect(v).not.toHaveProperty("trialEndsAt");
    expect(v).not.toHaveProperty("trialDaysLeft");
    expect(v).toMatchObject({ state: "free_under_limit", planInterval: null, plusAccessUntil: null, pastDue: false, canUseAi: false });
  });
  it("Plus mensual / anual", () => {
    expect(buildPlusView(access("plus_active", { plus_access_until: "2026-11-01T00:00:00Z" }), sub({ plan_interval: "annual" }), true).planInterval).toBe("annual");
    expect(buildPlusView(access("plus_active", { plus_access_until: "2026-11-01T00:00:00Z" }), sub(), true).planInterval).toBe("monthly");
  });
  it("cancelación pendiente", () => {
    const v = buildPlusView(access("plus_canceled_pending", { plus_access_until: "2026-11-01T00:00:00Z", cancel_at_period_end: true }), sub({ cancel_at_period_end: true }), true);
    expect(v).toMatchObject({ cancelAtPeriodEnd: true, plusAccessUntil: "2026-11-01T00:00:00Z" });
  });
  it("past_due dentro de gracia: 3 días desde el inicio del periodo, con tope en el fin del periodo", () => {
    const v = buildPlusView(access("plus_active", { plus_access_until: "2026-11-01T00:00:00Z" }), sub({ status: "past_due", current_period_start: "2026-10-12T00:00:00Z" }), true);
    expect(v.pastDue).toBe(true);
    expect(v.graceEndsAt).toBe("2026-10-15T00:00:00.000Z");
    const capped = buildPlusView(access("plus_active", { plus_access_until: "2026-10-13T00:00:00Z" }), sub({ status: "past_due", current_period_start: "2026-10-12T00:00:00Z", current_period_end: "2026-10-13T00:00:00Z" }), true);
    expect(capped.graceEndsAt).toBe("2026-10-13T00:00:00.000Z");
  });
  it("gratis: uso y límite; legacy_full y founder: sin fechas de Plus", () => {
    expect(buildPlusView(access("free_under_limit", { free_expenses_used: 12 }), null, false)).toMatchObject({ freeExpensesUsed: 12, freeExpensesLimit: 30, canUseAi: false });
    expect(buildPlusView(access("legacy_full"), null, false)).toMatchObject({ state: "legacy_full", plusAccessUntil: null, planInterval: null, isPremium: true });
    expect(buildPlusView(access("founder"), null, false).state).toBe("founder");
  });
  it("isAiBlocked solo con estado conocido sin permiso de IA", () => {
    expect(isAiBlocked(buildPlusView(access("free_readonly"), null, false))).toBe(true);
    expect(isAiBlocked(buildPlusView(access("plus_active"), null, false))).toBe(false);
    expect(isAiBlocked({ status: "error" })).toBe(false);
    expect(isAiBlocked({ status: "unauthenticated" })).toBe(false);
  });
});

describe("cliente: helpers de red", () => {
  const res = (status: number, body: unknown = {}) => new Response(JSON.stringify(body), { status });

  it("readApiFailure entiende los dos formatos y nunca lanza", async () => {
    expect(await readApiFailure(res(403, { success: false, error: { code: "PLUS_REQUIRED", message: "m" } }))).toEqual({ status: 403, code: "PLUS_REQUIRED", message: "m" });
    expect(await readApiFailure(res(500, { error: "texto" }))).toEqual({ status: 500, code: null, message: "texto" });
    expect(await readApiFailure(new Response("<html>", { status: 502 }))).toEqual({ status: 502, code: null, message: null });
  });
  it("isPlusRequired solo con 403 + PLUS_REQUIRED (no con otros 403)", () => {
    expect(isPlusRequired({ status: 403, code: "PLUS_REQUIRED" })).toBe(true);
    expect(isPlusRequired({ status: 403, code: "FORBIDDEN" })).toBe(false);
    expect(isPlusRequired({ status: 503, code: "PLUS_REQUIRED" })).toBe(false);
  });
  it("kindFromStatus", () => {
    expect([401, 403, 409, 422, 503, 500].map(kindFromStatus)).toEqual(["unauthorized", "forbidden", "conflict", "validation", "unavailable", "unknown"]);
  });
  it("isSafeStripeUrl solo acepta https en stripe.com", () => {
    expect(isSafeStripeUrl("https://checkout.stripe.com/c/pay_x")).toBe(true);
    expect(isSafeStripeUrl("https://billing.stripe.com/p/x")).toBe(true);
    for (const bad of ["http://checkout.stripe.com/x", "https://stripe.com.evil.example/x", "https://evilstripe.com/x", "javascript:alert(1)", "", null, 5]) {
      expect(isSafeStripeUrl(bad as unknown)).toBe(false);
    }
  });
  it("startCheckout / openPortal envían solo los campos permitidos y mapean errores", async () => {
    const f = vi.fn().mockResolvedValue(res(200, { data: { url: "https://checkout.stripe.com/c/a" } }));
    expect(await startCheckout("month", "es", f as unknown as typeof fetch)).toEqual({ ok: true, url: "https://checkout.stripe.com/c/a" });
    expect(JSON.parse(f.mock.calls[0][1].body)).toEqual({ interval: "month", locale: "es" });
    f.mockResolvedValue(res(409));
    expect(await startCheckout("year", "en", f as unknown as typeof fetch)).toEqual({ ok: false, kind: "conflict" });
    f.mockRejectedValue(new TypeError("x"));
    expect(await openPortal("es", f as unknown as typeof fetch)).toEqual({ ok: false, kind: "network" });
  });
  it("syncCheckout: confirmed solo con Plus; 409 pendiente; errores", async () => {
    const f = vi.fn();
    f.mockResolvedValue(res(200, { data: { access: "plus_active" } }));
    expect(await syncCheckout("cs_test_x", f as unknown as typeof fetch)).toEqual({ kind: "confirmed", access: "plus_active" });
    f.mockResolvedValue(res(200, { data: { access: "trialing" } }));
    expect(await syncCheckout("cs_test_x", f as unknown as typeof fetch)).toEqual({ kind: "pending" });
    f.mockResolvedValue(res(409));
    expect(await syncCheckout("cs_test_x", f as unknown as typeof fetch)).toEqual({ kind: "pending" });
    f.mockResolvedValue(res(403));
    expect(await syncCheckout("cs_test_x", f as unknown as typeof fetch)).toEqual({ kind: "error", error: "forbidden" });
  });
});

describe("precios mostrados", () => {
  it("3,99 / 39,90 y ahorro = 2 mensualidades (7,98 €)", () => {
    expect(PLUS_MONTHLY_CENTS).toBe(399);
    expect(PLUS_ANNUAL_CENTS).toBe(3990);
    expect(PLUS_ANNUAL_SAVING_CENTS).toBe(2 * PLUS_MONTHLY_CENTS);
    expect(formatEur(399, "es")).toMatch(/3,99\s?€/);
    expect(formatEur(3990, "en")).toBe("€39.90");
  });
});

describe("mensajes es/en", () => {
  const root = process.cwd();
  const es = JSON.parse(fs.readFileSync(path.join(root, "messages/es.json"), "utf8")).Plus as Record<string, string>;
  const en = JSON.parse(fs.readFileSync(path.join(root, "messages/en.json"), "utf8")).Plus as Record<string, string>;

  it("mismas claves, sin textos vacíos y mismos marcadores {…}", () => {
    expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort());
    for (const k of Object.keys(es)) {
      expect(es[k].trim().length, k).toBeGreaterThan(0);
      expect(en[k].trim().length, k).toBeGreaterThan(0);
      const ph = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(",");
      expect(ph(en[k]), k).toBe(ph(es[k]));
    }
  });

  it("todas las claves usadas por los componentes existen en ambos idiomas", () => {
    const files = [
      "src/components/plus/PlanClient.tsx", "src/components/plus/UpgradePanel.tsx", "src/components/plus/PortalButton.tsx",
      "src/components/plus/PlusRequiredNotice.tsx", "src/components/saas/StripeSuccessHandler.tsx", "src/components/saas/SubscriptionGuard.tsx",
      "src/app/[locale]/app/subscription/page.tsx", "src/components/UserMenu.tsx", "src/app/[locale]/app/settings/SettingsClient.tsx",
    ];
    const used = new Set<string>();
    for (const f of files) {
      const src = fs.readFileSync(path.join(root, f), "utf8");
      const usesPlus = /useTranslations\("Plus"\)|getTranslations\("Plus"\)/.test(src);
      if (!usesPlus) continue;
      for (const m of src.matchAll(/\b(?:t|tPlus)\(\s*"(\w+)"/g)) used.add(m[1]);
      for (const m of src.matchAll(/"(plusFeature\w+|state_\w+|plan\w+)"/g)) used.add(m[1]);
    }
    expect(used.size).toBeGreaterThan(40);
    for (const k of used) {
      expect(es[k], `es.${k}`).toBeTruthy();
      expect(en[k], `en.${k}`).toBeTruthy();
    }
  });

  it("los textos hablan de 3,99/39,90 solo a través de formateo (sin importes escritos a mano)", () => {
    for (const k of Object.keys(es)) {
      expect(es[k], k).not.toMatch(/3,99|39,90/);
      expect(en[k], k).not.toMatch(/3\.99|39\.90/);
    }
  });
});
