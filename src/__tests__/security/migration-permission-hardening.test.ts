import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Fase 3.B (corrección de seguridad, 2026-09-16): un comentario "pendiente de
 * preflight" dentro de un archivo de migración NO impide que las sentencias
 * SQL que le siguen se ejecuten al aplicar esa migración. Este test estático
 * verifica, leyendo los archivos reales (sin necesitar una base de datos), que:
 *
 * 1. La migración base (20260916_phase3b_monetization_foundation.sql) NO
 *    contiene ningún REVOKE/DROP POLICY activo sobre profiles/expenses --
 *    solo prepara esquema y funciones RPC.
 * 2. El endurecimiento de permisos vive en un script manual aparte
 *    (phase3b_permission_hardening.sql) y, dentro de ese script, las
 *    sentencias destructivas (REVOKE/DROP POLICY) están comentadas -- no se
 *    ejecutarían aunque alguien corriera el archivo entero sin editarlo.
 * 3. El diseño de recálculo de plus_access_until multi-suscripción
 *    (UNIQUE(stripe_subscription_id), índice por user_id,
 *    fn_recompute_plus_access_until) está presente en la migración base.
 */

const SUPABASE_ROOT = path.resolve(__dirname, "..", "..", "..", "supabase");
const BASE_MIGRATION = path.join(
  SUPABASE_ROOT,
  "migrations",
  "20260916_phase3b_monetization_foundation.sql"
);
const HARDENING_SCRIPT = path.join(
  SUPABASE_ROOT,
  "manual-ops",
  "phase3b_permission_hardening.sql"
);

/**
 * Elimina los comentarios de línea SQL ("-- ..." hasta fin de línea) de cada
 * línea, para poder buscar patrones solo en el SQL que realmente se
 * ejecutaría. No maneja comentarios de bloque /* *\/ (no se usan en estos
 * archivos) ni cadenas de texto que contengan "--" literal (no aplica aquí).
 */
function stripSqlLineComments(sql: string): string {
  return sql
    .split("\n")
    .map((line) => {
      const idx = line.indexOf("--");
      return idx === -1 ? line : line.slice(0, idx);
    })
    .join("\n");
}

describe("Fase 3.B — endurecimiento de permisos separado de la migración base (corrección de seguridad)", () => {
  const baseMigrationRaw = fs.readFileSync(BASE_MIGRATION, "utf8");
  const baseMigrationActive = stripSqlLineComments(baseMigrationRaw);

  const hardeningRaw = fs.readFileSync(HARDENING_SCRIPT, "utf8");
  const hardeningActive = stripSqlLineComments(hardeningRaw);

  it("la migración base existe y no está vacía", () => {
    expect(baseMigrationRaw.length).toBeGreaterThan(100);
  });

  it("la migración base NO contiene ningún REVOKE INSERT sobre expenses fuera de comentarios", () => {
    expect(baseMigrationActive).not.toMatch(/REVOKE\s+INSERT\s+ON\s+public\.expenses/i);
  });

  it("la migración base NO contiene ningún REVOKE UPDATE sobre profiles fuera de comentarios", () => {
    expect(baseMigrationActive).not.toMatch(/REVOKE\s+UPDATE\s+ON\s+public\.profiles/i);
  });

  it("la migración base NO contiene ningún DROP POLICY sobre profiles fuera de comentarios", () => {
    expect(baseMigrationActive).not.toMatch(/DROP\s+POLICY[\s\S]{0,80}public\.profiles/i);
  });

  it("la migración base remite explícitamente al script manual de endurecimiento", () => {
    expect(baseMigrationRaw).toMatch(/phase3b_permission_hardening\.sql/);
  });

  it("el script de endurecimiento existe y advierte explícitamente de no ejecutarse automáticamente", () => {
    expect(hardeningRaw.length).toBeGreaterThan(100);
    expect(hardeningRaw).toMatch(/NO EJECUTAR AUTOMÁTICAMENTE/i);
    expect(hardeningRaw).toMatch(/preflight/i);
  });

  it("el script de endurecimiento contiene las sentencias REVOKE/DROP POLICY, pero comentadas (no ejecutables tal cual)", () => {
    // Deben aparecer en el texto crudo (documentan la acción)...
    expect(hardeningRaw).toMatch(/REVOKE\s+INSERT\s+ON\s+public\.expenses/i);
    expect(hardeningRaw).toMatch(/REVOKE\s+UPDATE\s+ON\s+public\.profiles/i);
    expect(hardeningRaw).toMatch(/DROP\s+POLICY/i);
    // ...pero NINGUNA debe sobrevivir tras quitar los comentarios de línea:
    // si sobrevive, significa que no estaba realmente comentada.
    expect(hardeningActive).not.toMatch(/REVOKE\s+INSERT\s+ON\s+public\.expenses/i);
    expect(hardeningActive).not.toMatch(/REVOKE\s+UPDATE\s+ON\s+public\.profiles/i);
    expect(hardeningActive).not.toMatch(/DROP\s+POLICY/i);
  });

  it("cada línea del script de endurecimiento con REVOKE/DROP POLICY empieza literalmente por '--' (comentada línea a línea, no solo dentro de un bloque)", () => {
    const offendingLines = hardeningRaw
      .split("\n")
      .filter((line) => /REVOKE\s+(INSERT|UPDATE)\s+ON\s+public\.(expenses|profiles)|DROP\s+POLICY/i.test(line))
      .filter((line) => !line.trim().startsWith("--"));

    expect(offendingLines).toEqual([]);
  });
});

describe("Fase 3.B — recálculo de plus_access_until multi-suscripción (corrección de seguridad)", () => {
  const baseMigrationRaw = fs.readFileSync(BASE_MIGRATION, "utf8");

  it("subscriptions tiene un UNIQUE explícito sobre stripe_subscription_id", () => {
    expect(baseMigrationRaw).toMatch(
      /CONSTRAINT\s+subscriptions_stripe_subscription_id_key\s+UNIQUE\s*\(\s*stripe_subscription_id\s*\)/i
    );
  });

  it("existe un índice sobre subscriptions.user_id", () => {
    expect(baseMigrationRaw).toMatch(
      /CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_subscriptions_user_id\s+ON\s+public\.subscriptions\s*\(\s*user_id\s*\)/i
    );
  });

  it("existe fn_recompute_plus_access_until y agrega sobre TODAS las suscripciones del usuario (max(current_period_end)), no una sola fila", () => {
    expect(baseMigrationRaw).toMatch(/fn_recompute_plus_access_until/);
    expect(baseMigrationRaw).toMatch(/max\(current_period_end\)/i);
    // La función debe filtrar por user_id (agregación por usuario, no global).
    expect(baseMigrationRaw).toMatch(
      /FROM\s+public\.subscriptions\s+WHERE\s+user_id\s*=\s*p_user_id/i
    );
  });

  it("fn_recompute_plus_access_until no está expuesta a PUBLIC/authenticated (solo uso interno del futuro webhook)", () => {
    expect(baseMigrationRaw).toMatch(
      /REVOKE\s+EXECUTE\s+ON\s+FUNCTION\s+public\.fn_recompute_plus_access_until\s*\(\s*uuid\s*\)\s+FROM\s+PUBLIC/i
    );
    // Nunca debe concederse GRANT EXECUTE ... TO authenticated para esta función.
    expect(baseMigrationRaw).not.toMatch(
      /GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.fn_recompute_plus_access_until[\s\S]{0,40}TO\s+authenticated/i
    );
  });
});
