// @vitest-environment node
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

/** Guardas estáticas de la integración Stripe de Plus (Bloque 3) y regresión del pack Excel/PDF. */

const ROOT = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");
// Código sin comentarios (los comentarios pueden mencionar el pack para documentar la separación).
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const PLUS_FILES = [
  "src/app/api/stripe/checkout/route.ts",
  "src/app/api/stripe/portal/route.ts",
  "src/app/api/stripe/sync/route.ts",
  "src/app/api/webhooks/stripe-subscriptions/route.ts",
  "src/lib/stripe/plus.ts",
  "src/lib/stripe/plus-webhook.ts",
];

describe("integración Stripe Plus: guardas", () => {
  it("sin claves, secretos ni IDs de Stripe hardcodeados", () => {
    for (const f of PLUS_FILES) {
      const src = read(f);
      expect(src, f).not.toMatch(/sk_(live|test)_[A-Za-z0-9]{6,}|rk_(live|test)_[A-Za-z0-9]{6,}|whsec_[A-Za-z0-9]{6,}/);
      expect(src, f).not.toMatch(/\bprice_[A-Za-z0-9]{10,}\b|\bprod_[A-Za-z0-9]{8,}\b|\bcus_[A-Za-z0-9]{8,}\b/);
    }
  });

  it("el webhook verifica la firma ANTES de procesar el evento y usa su propio secreto", () => {
    const src = code("src/app/api/webhooks/stripe-subscriptions/route.ts");
    expect(src.indexOf("constructEvent")).toBeGreaterThan(-1);
    expect(src.indexOf("constructEvent")).toBeLessThan(src.indexOf("await handlePlusEvent("));
    expect(src.indexOf("constructEvent")).toBeLessThan(src.indexOf("createAdminClient()"));
    expect(src).toMatch(/STRIPE_SUBSCRIPTION_WEBHOOK_SECRET/);
    expect(src).not.toMatch(/process\.env\.STRIPE_WEBHOOK_SECRET/);
    expect(src).toMatch(/status\s*===?\s*500|reply\(500/);
  });

  it("checkout y portal solo aceptan un cuerpo estricto (sin precio, customer ni user_id del navegador)", () => {
    for (const f of ["src/app/api/stripe/checkout/route.ts", "src/app/api/stripe/portal/route.ts", "src/app/api/stripe/sync/route.ts"]) {
      const src = read(f);
      expect(src, f).toMatch(/\.strict\(\)/);
      expect(src, f).not.toMatch(/body\.(price|price_id|customer|customer_id|user_id|userId)\b/);
    }
    expect(read("src/app/api/stripe/checkout/route.ts")).not.toMatch(/trial_period_days|trial_end/);
  });

  it("las escrituras de facturación usan el cliente admin (service_role), nunca la sesión del usuario", () => {
    for (const f of ["src/app/api/stripe/checkout/route.ts", "src/app/api/stripe/portal/route.ts", "src/app/api/stripe/sync/route.ts", "src/app/api/webhooks/stripe-subscriptions/route.ts"]) {
      expect(read(f), f).toMatch(/createAdminClient/);
    }
    const sync = read("src/app/api/stripe/sync/route.ts");
    // La sesión solo se usa para LEER fn_my_access del propio usuario.
    expect(sync.match(/supabase\.rpc\(/g)).toEqual(["supabase.rpc("]);
    expect(sync).toMatch(/supabase\.rpc\("fn_my_access"\)/);
  });

  it("las rutas Plus no tocan el pack premium (webhook, tablas ni librería)", () => {
    for (const f of PLUS_FILES) {
      const src = code(f);
      expect(src, f).not.toMatch(/@\/lib\/premium|premium_(purchases|downloads|webhook_events|access_tokens)|STRIPE_PREMIUM_PRICE_ID|PREMIUM_COMMERCE_ENABLED|STRIPE_WEBHOOK_SECRET\b/);
    }
  });

  it("todas las rutas de facturación respetan PLUS_SUBSCRIPTIONS_ENABLED (apagado por defecto)", () => {
    for (const f of PLUS_FILES.filter((x) => x.includes("/app/api/"))) {
      expect(read(f), f).toMatch(/isPlusSubscriptionsEnabled\(\)/);
    }
    // No hay ningún archivo de configuración que lo encienda.
    for (const f of ["vercel.json", "next.config.ts", "next.config.js", "next.config.mjs", ".env.example"]) {
      if (fs.existsSync(path.join(ROOT, f))) expect(read(f), f).not.toMatch(/PLUS_SUBSCRIPTIONS_ENABLED\s*[=:]\s*["']?true/);
    }
  });

  it("/api/ai/search exige acceso Plus; feedback, cancel-confirmation y embeddings no", () => {
    expect(read("src/app/api/ai/search/route.ts")).toMatch(/requireAccess\("ai_search"/);
    for (const f of ["feedback", "agent-v2/cancel-confirmation", "migrate-embeddings", "process-embeddings"]) {
      expect(read(`src/app/api/ai/${f}/route.ts`), f).not.toMatch(/requireAccess/);
    }
  });
});

describe("pack Excel/PDF: regresión", () => {
  it("el webhook y la librería del pack no han cambiado respecto a la base b8e9468", () => {
    let changed: string;
    try {
      changed = execFileSync("git", ["diff", "--name-only", "b8e9468", "--", "src/app/api/webhooks/stripe/route.ts", "src/lib/premium", "src/app/api/premium"], {
        cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"],
      }).trim();
    } catch {
      return; // sin git o sin esa referencia (clon superficial)
    }
    expect(changed).toBe("");
  });

  it("el webhook del pack sigue siendo independiente: usa STRIPE_WEBHOOK_SECRET y premium_webhook_events, sin lógica de suscripciones", () => {
    const pack = read("src/app/api/webhooks/stripe/route.ts");
    expect(pack).toMatch(/STRIPE_WEBHOOK_SECRET/);
    expect(pack).not.toMatch(/STRIPE_SUBSCRIPTION_WEBHOOK_SECRET|fn_apply_subscription_event|billing_customers|stripe-subscriptions/);
  });

  it("ninguna migración de este bloque toca tablas premium_*", () => {
    const dir = path.join(ROOT, "supabase", "migrations");
    for (const f of fs.readdirSync(dir).filter((x) => /_plus_/.test(x))) {
      const sql = fs.readFileSync(path.join(dir, f), "utf8").replace(/--[^\n]*/g, "").replace(/'(?:[^']|'')*'/g, "''");
      expect(sql, f).not.toMatch(/\bpremium_/);
    }
  });
});
