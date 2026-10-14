// @vitest-environment node
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
// @ts-expect-error — script .mjs sin tipos
import { evaluateEnv, jwtRef, STAGING_REF, PRODUCTION_REF } from "../../../scripts/plus-staging-preflight.mjs";

type Env = Record<string, string | undefined>;

// JWT falso (no real): cabecera.payload.firma con el claim ref indicado.
const fakeJwt = (ref: string) => `${Buffer.from('{"alg":"HS256"}').toString("base64url")}.${Buffer.from(JSON.stringify({ ref, role: "service_role" })).toString("base64url")}.sig`;

const good = (): Env => ({
  PLUS_SUBSCRIPTIONS_ENABLED: "true",
  STRIPE_SECRET_KEY: "sk_test_" + "x".repeat(24),
  STRIPE_PLUS_PRICE_MONTHLY_ID: "price_monthly1",
  STRIPE_PLUS_PRICE_ANNUAL_ID: "price_annual1",
  STRIPE_SUBSCRIPTION_WEBHOOK_SECRET: "whsec_" + "a".repeat(32),
  STRIPE_WEBHOOK_SECRET: "whsec_" + "b".repeat(32),
  NEXT_PUBLIC_SUPABASE_URL: `https://${STAGING_REF}.supabase.co`,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: fakeJwt(STAGING_REF),
  SUPABASE_SERVICE_ROLE_KEY: fakeJwt(STAGING_REF),
  NEXT_PUBLIC_SITE_URL: "https://kakebo-git-feat-staging.vercel.app",
});
const failures = (env: Env) => evaluateEnv(env).filter((r: { ok: boolean }) => !r.ok).map((r: { name: string }) => r.name);

describe("preflight de staging Plus", () => {
  it("configuración correcta: sin fallos", () => {
    expect(failures(good())).toEqual([]);
  });

  it("rechaza claves LIVE de Stripe", () => {
    for (const k of ["sk_live_" + "x".repeat(24), "rk_live_" + "x".repeat(24)]) {
      const f = failures({ ...good(), STRIPE_SECRET_KEY: k });
      expect(f).toContain("STRIPE_SECRET_KEY es de TEST (sk_test_)");
    }
  });

  it("rechaza Supabase de producción (URL, anon y service role)", () => {
    expect(failures({ ...good(), NEXT_PUBLIC_SUPABASE_URL: `https://${PRODUCTION_REF}.supabase.co` })).toContain("NEXT_PUBLIC_SUPABASE_URL apunta a STAGING");
    expect(failures({ ...good(), NEXT_PUBLIC_SUPABASE_ANON_KEY: fakeJwt(PRODUCTION_REF) })).toContain("la anon key pertenece a STAGING");
    expect(failures({ ...good(), SUPABASE_SERVICE_ROLE_KEY: fakeJwt(PRODUCTION_REF) })).toContain("la service role key pertenece a STAGING");
  });

  it("rechaza el dominio de producción como NEXT_PUBLIC_SITE_URL y URLs http no locales", () => {
    expect(failures({ ...good(), NEXT_PUBLIC_SITE_URL: "https://www.metodokakebo.com" })).toContain("NEXT_PUBLIC_SITE_URL NO es el dominio de producción");
    expect(failures({ ...good(), NEXT_PUBLIC_SITE_URL: "http://preview.example" })).toContain("NEXT_PUBLIC_SITE_URL es https (o http en localhost)");
  });

  it("exige el flag exacto, price IDs válidos y distintos, y secreto de webhook propio", () => {
    expect(failures({ ...good(), PLUS_SUBSCRIPTIONS_ENABLED: "TRUE" })).toHaveLength(1);
    expect(failures({ ...good(), STRIPE_PLUS_PRICE_ANNUAL_ID: "price_monthly1" })).toContain("los dos price IDs son distintos");
    expect(failures({ ...good(), STRIPE_PLUS_PRICE_MONTHLY_ID: "prod_nope" })).toContain("STRIPE_PLUS_PRICE_MONTHLY_ID con formato price_…");
    const same = "whsec_" + "c".repeat(32);
    expect(failures({ ...good(), STRIPE_SUBSCRIPTION_WEBHOOK_SECRET: same, STRIPE_WEBHOOK_SECRET: same })).toContain(
      "el secreto de suscripciones es DISTINTO del del pack Excel/PDF (STRIPE_WEBHOOK_SECRET)",
    );
    expect(failures({ ...good(), STRIPE_SUBSCRIPTION_WEBHOOK_SECRET: undefined })).toContain("STRIPE_SUBSCRIPTION_WEBHOOK_SECRET con formato whsec_…");
  });

  it("variables ausentes -> fallos (nunca excepciones) y los resultados jamás contienen valores", () => {
    const env = good();
    const results = JSON.stringify(evaluateEnv(env));
    for (const v of Object.values(env)) if (v && v.length > 12) expect(results).not.toContain(v);
    expect(failures({}).length).toBeGreaterThan(8);
  });

  it("jwtRef lee el claim ref y tolera valores que no son JWT", () => {
    expect(jwtRef(fakeJwt("abc"))).toBe("abc");
    expect(jwtRef("sb_secret_nojwt")).toBeNull();
    expect(jwtRef("")).toBeNull();
  });

  it("el script no contiene claves ni secretos y no escribe en ningún sitio", () => {
    const src = fs.readFileSync(path.join(process.cwd(), "scripts/plus-staging-preflight.mjs"), "utf8");
    expect(src).not.toMatch(/sk_(live|test)_[A-Za-z0-9]{8,}|whsec_[A-Za-z0-9]{8,}|eyJ[A-Za-z0-9_-]{20,}/);
    expect(src).not.toMatch(/writeFile|appendFile|\.insert\(|\.update\(|\.delete\(|method:\s*"(PUT|PATCH|DELETE)"/);
  });
});
