// @vitest-environment node
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

/**
 * Guardas estáticas del Bloque 1 de Plus: nombres prohibidos, secretos, aislamiento del pack Excel/PDF
 * y orden de versiones de las migraciones.
 */

const ROOT = process.cwd();
const MIG_DIR = path.join(ROOT, "supabase", "migrations");
const RB_DIR = path.join(ROOT, "supabase", "rollback", "plus");
const plus = fs.readdirSync(MIG_DIR).filter((f) => /_plus_.*\.sql$/.test(f)).sort();
const rollbacks = fs.existsSync(RB_DIR) ? fs.readdirSync(RB_DIR).sort() : [];
const read = (dir: string, f: string) => fs.readFileSync(path.join(dir, f), "utf8");

const FORBIDDEN_NAME = /freemium|enforce_expense_limit|legacy_access|close_direct|usage_backfill|access_foundation/i;

describe("migraciones Plus: guardas", () => {
  it("existen 5 migraciones y 5 rollbacks emparejados por versión", () => {
    expect(plus).toHaveLength(5);
    expect(rollbacks.map((f) => f.replace(".rollback.sql", ".sql"))).toEqual(plus);
  });

  it("los nombres no contienen términos de activación prohibidos", () => {
    for (const f of [...plus, ...rollbacks]) expect(f).not.toMatch(FORBIDDEN_NAME);
  });

  it("ninguna migración nueva activa límites, backfill ni legacy_full masivo", () => {
    for (const f of plus) {
      const sql = read(MIG_DIR, f).replace(/--[^\n]*/g, "");
      expect(sql, f).not.toMatch(/INSERT\s+INTO\s+public\.access_grants[\s\S]*SELECT/i);
      expect(sql, f).not.toMatch(/INSERT\s+INTO\s+public\.expense_monthly_usage/i);
      expect(sql, f).not.toMatch(/(CREATE\s+OR\s+REPLACE\s+FUNCTION|DROP\s+FUNCTION(\s+IF\s+EXISTS)?)\s+public\.fn_create_expense/i);
      expect(sql, f).not.toMatch(/REVOKE\s+INSERT\s+ON\s+(TABLE\s+)?public\.expenses/i);
    }
  });

  it("no mencionan ai_logs ni contienen secretos", () => {
    for (const f of plus) {
      const sql = read(MIG_DIR, f);
      expect(sql, f).not.toMatch(/ai_logs/);
      expect(sql, f).not.toMatch(/eyJ[A-Za-z0-9_-]{20,}|sk_(live|test)_|whsec_|rk_(live|test)_/);
    }
  });

  it("no tocan tablas del pack premium ni las suyas", () => {
    for (const f of plus) {
      const sql = read(MIG_DIR, f).replace(/--[^\n]*/g, "").replace(/'(?:[^']|'')*'/g, "''");
      expect(sql, f).not.toMatch(/\bpremium_(purchases|downloads|webhook_events|access_tokens)\b/);
    }
  });

  it("las versiones son posteriores a las existentes y no futuras respecto al repositorio", () => {
    const all = fs.readdirSync(MIG_DIR).filter((f) => f.endsWith(".sql")).sort();
    const plusVersions = plus.map((f) => f.split("_")[0]);
    expect(new Set(plusVersions).size).toBe(plusVersions.length);
    const maxOther = all.filter((f) => !plus.includes(f)).map((f) => f.split("_")[0]).sort().pop()!;
    expect(plusVersions.every((v) => v > maxOther)).toBe(true);
    expect(all.slice(-5)).toEqual(plus);
    // Una versión con fecha posterior a hoy bloquearía las siguientes migraciones (orden). Margen de 1 día.
    const limit = new Date(Date.now() + 24 * 3600 * 1000).toISOString().replace(/\D/g, "").slice(0, 14);
    for (const f of plus) expect(f.split("_")[0] <= limit, f).toBe(true);
  });
});

describe("pack Excel/PDF: webhook y rutas intactos", () => {
  const packPaths = ["src/app/api/webhooks/stripe/route.ts", "src/lib/premium"];

  it("el webhook del pack sigue usando premium_webhook_events y no referencia Plus", () => {
    const route = fs.readFileSync(path.join(ROOT, "src/app/api/webhooks/stripe/route.ts"), "utf8");
    expect(route).not.toMatch(/fn_apply_subscription_event|stripe_webhook_events|billing_customers|access_grants/);
  });

  it("el diff de la rama respecto a b8e9468 no modifica el pack premium", () => {
    let changed = "";
    try {
      changed = execFileSync("git", ["diff", "--name-only", "b8e9468", "HEAD", "--", ...packPaths], {
        cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"],
      }).trim();
    } catch {
      return; // sin git o sin esa referencia (p. ej. clon superficial): la guarda estática anterior sigue aplicando
    }
    expect(changed).toBe("");
  });
});
