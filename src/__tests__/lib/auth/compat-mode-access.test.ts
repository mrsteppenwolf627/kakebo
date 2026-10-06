// @vitest-environment node
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { canUsePremium, canUseAI, getTrialDaysLeft, type Profile } from "@/lib/auth/access-control";

/**
 * MODO COMPATIBLE (Fase 3.B): hoy Kakebo no aplica ninguna restricción comercial. Estos tests
 * documentan y vigilan ese comportamiento hasta que se active el modelo freemium diferido
 * (supabase/deferred/freemium/). Si alguno falla, alguien ha empezado a restringir acceso sin
 * pasar por la fase de activación.
 */

const ROOT = process.cwd();

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "__tests__" ? [] : walk(full);
    return /\.(ts|tsx)$/.test(e.name) ? [full] : [];
  });
}
const rel = (f: string) => path.relative(ROOT, f).split(path.sep).join("/");
const appFiles = walk(path.join(ROOT, "src"));
const read = (f: string) => fs.readFileSync(f, "utf8");

const baseProfile: Profile = {
  id: "u1",
  email: "user@example.com",
  tier: "free",
  trial_ends_at: null,
  stripe_customer_id: null,
  stripe_subscription_id: null,
};

const day = 24 * 60 * 60 * 1000;
const profiles: Array<[string, Profile]> = [
  ["tier free con trial vigente", { ...baseProfile, trial_ends_at: new Date(Date.now() + 10 * day).toISOString() }],
  ["tier free con trial caducado", { ...baseProfile, trial_ends_at: new Date(Date.now() - 400 * day).toISOString() }],
  ["tier free con trial NULL", { ...baseProfile, trial_ends_at: null }],
  ["tier pro", { ...baseProfile, tier: "pro" }],
  ["manual_override true", { ...baseProfile, manual_override: true, trial_ends_at: null }],
  ["manual_override false y trial caducado", { ...baseProfile, manual_override: false, trial_ends_at: "2020-01-01T00:00:00Z" }],
  ["con suscripción de Stripe", { ...baseProfile, stripe_customer_id: "cus_x", stripe_subscription_id: "sub_x" }],
  ["usuario existente sin más datos", { ...baseProfile }],
];

describe("modo compatible — acceso de los usuarios existentes", () => {
  it.each(profiles)("%s conserva acceso completo (IA y funciones premium)", (_name, profile) => {
    expect(canUsePremium(profile)).toBe(true);
    expect(canUseAI(profile)).toBe(true);
  });

  it("sin perfil cargado no hay acceso (comportamiento previo, no una restricción nueva)", () => {
    expect(canUsePremium(null)).toBe(false);
  });

  it("el helper de días de prueba no restringe nada", () => {
    for (const [, p] of profiles) expect(getTrialDaysLeft(p)).toBe(0);
  });
});

describe("modo compatible — no hay enforcement comercial en el código de la app", () => {
  it("ningún código de producción importa el resolvedor freemium (access-state)", () => {
    const importers = appFiles
      .filter((f) => rel(f) !== "src/lib/auth/access-state.ts")
      .filter((f) => /from\s+["']@\/lib\/auth\/access-state["']|from\s+["'][./]*access-state["']/.test(read(f)));
    expect(importers.map(rel)).toEqual([]);
  });

  it("ningún código de producción conoce el límite de 30 gastos salvo access-state.ts (diferido)", () => {
    const withLimit = appFiles
      .filter((f) => rel(f) !== "src/lib/auth/access-state.ts")
      .filter((f) => /FREE_MONTHLY_EXPENSE_LIMIT|free_readonly|free_under_limit/.test(read(f)));
    expect(withLimit.map(rel)).toEqual([]);
  });

  it("KB001 solo aparece como traducción latente de un error (nunca se genera en TypeScript)", () => {
    const withCode = appFiles.filter((f) => /KB001/.test(read(f))).map(rel).sort();
    expect(withCode).toEqual([
      "src/lib/agents/tools/create-transaction.ts",
      "src/lib/ai/tool-executor.ts",
      "src/lib/api/errors.ts",
    ]);
    for (const f of withCode) {
      const src = read(path.join(ROOT, f));
      expect(src).not.toMatch(/throw[^;]*KB001|code:\s*["']KB001["']/);
    }
  });

  it("la IA no está restringida: el endpoint del agente solo usa canUsePremium (siempre true con perfil)", () => {
    const agent = read(path.join(ROOT, "src/app/api/ai/agent/route.ts"));
    expect(agent).toMatch(/canUsePremium/);
    expect(agent).not.toMatch(/access-state|canExport|free_readonly|KB001/);
  });

  it("los informes PDF no están restringidos: ReportButton y ReportDialog no consultan acceso", () => {
    for (const f of ["ReportButton.tsx", "ReportDialog.tsx", "ReportPDF.tsx"]) {
      const src = read(path.join(ROOT, "src/components/reports", f));
      expect(src).not.toMatch(/canUsePremium|canUseAI|canExport|access-state|access-control|PremiumPrompt|tier|manual_override/);
    }
  });

  it("access-control sigue siendo permisivo para cualquier perfil autenticado", () => {
    const src = read(path.join(ROOT, "src/lib/auth/access-control.ts"));
    expect(src).toMatch(/return profile !== null;/);
  });
});

describe("modo compatible — trial de 14 días y creación de gastos sin límite (SQL)", () => {
  const migrations = path.join(ROOT, "supabase", "migrations");
  const active = fs
    .readdirSync(migrations)
    .filter((f) => /^(20260916|20260917|20261001)_/.test(f))
    .map((f) => fs.readFileSync(path.join(migrations, f), "utf8").split("\n").filter((l) => !l.trim().startsWith("--")).join("\n"))
    .join("\n");

  it("las migraciones aplicables no tocan el trial (ni 30 días ni redefinición de handle_new_user)", () => {
    expect(active).not.toMatch(/interval\s+'30\s+days'/i);
    expect(active).not.toMatch(/FUNCTION\s+public\.handle_new_user/i);
    expect(active).not.toMatch(/trial_ends_at\s*=/i);
  });

  it("el trial de 14 días solo se (re)define en el script diferido y en su rollback", () => {
    const deferred = path.join(ROOT, "supabase", "deferred", "freemium");
    expect(fs.readFileSync(path.join(deferred, "01_access_foundation.sql"), "utf8")).toMatch(/interval\s+'14\s+days'/);
    expect(fs.readFileSync(path.join(deferred, "rollback_freemium.sql"), "utf8")).toMatch(/interval\s+'14\s+days'/);
    for (const f of fs.readdirSync(deferred).filter((x) => x.endsWith(".sql"))) {
      expect(fs.readFileSync(path.join(deferred, f), "utf8")).not.toMatch(/interval\s+'30\s+days'/i);
    }
  });

  it("fn_create_expense (compat) no limita y siempre cuenta; el límite solo está en el script 03", () => {
    expect(active).not.toMatch(/count\s*<\s*30/i);
    const f03 = fs.readFileSync(path.join(ROOT, "supabase", "deferred", "freemium", "03_enforce_expense_limit.sql"), "utf8");
    expect(f03).toMatch(/count\s*<\s*30/);
  });
});
