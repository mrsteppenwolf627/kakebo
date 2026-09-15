import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Fase 2.E (corrección de seguridad): revisión estática de la migración de
 * `ai_pending_actions` — RLS debe seguir activado, pero sin ninguna
 * política que conceda acceso directo a `authenticated`/`anon`. No hay
 * herramienta psql/CLI local disponible para aplicar y probar la
 * migración de verdad, así que esta prueba analiza el SQL en busca de las
 * señales concretas que indicarían una regresión (un CREATE POLICY nuevo,
 * o RLS desactivado).
 */

const MIGRATION_PATH = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "supabase",
  "migrations",
  "20260914_add_ai_pending_actions.sql"
);

describe("Migración ai_pending_actions — tabla exclusiva de servidor (Fase 2.E)", () => {
  const sql = fs.readFileSync(MIGRATION_PATH, "utf8");

  it("sigue habilitando RLS en la tabla", () => {
    expect(sql).toMatch(/ALTER TABLE public\.ai_pending_actions ENABLE ROW LEVEL SECURITY/);
  });

  it("no define ninguna política CREATE POLICY (cero acceso directo, ni siquiera propio)", () => {
    const policyMatches = sql.match(/CREATE POLICY/gi) ?? [];
    expect(policyMatches).toHaveLength(0);
  });

  it("no concede privilegios explícitos a los roles authenticated/anon (GRANT)", () => {
    expect(sql).not.toMatch(/GRANT[\s\S]*?\bTO\s+(authenticated|anon)\b/i);
  });

  it("sigue siendo idempotente: usa CREATE TABLE/INDEX IF NOT EXISTS", () => {
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public\.ai_pending_actions/);
    expect(sql).toMatch(/CREATE INDEX IF NOT EXISTS idx_ai_pending_actions_user\b/);
  });

  it("solo existe una migración para esta tabla (no se añadió una segunda antes de aplicar la primera)", () => {
    const migrationsDir = path.dirname(MIGRATION_PATH);
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql"));
    const forThisTable = files.filter((f) => {
      const content = fs.readFileSync(path.join(migrationsDir, f), "utf8");
      return content.includes("ai_pending_actions");
    });
    expect(forThisTable).toEqual(["20260914_add_ai_pending_actions.sql"]);
  });

  it("documenta explícitamente que es una tabla exclusiva de servidor (cliente admin)", () => {
    expect(sql).toMatch(/EXCLUSIVA DE SERVIDOR/);
    expect(sql).toMatch(/createAdminClient/);
  });
});
