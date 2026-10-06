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
    // Se revoca por nombre a anon y authenticated (REVOKE ... FROM PUBLIC no quita los EXECUTE que
    // Supabase concede por privilegios por defecto) y solo se concede a service_role.
    expect(baseMigrationRaw).toMatch(
      /REVOKE\s+(ALL|EXECUTE)\s+ON\s+FUNCTION\s+public\.fn_recompute_plus_access_until\s*\(\s*uuid\s*\)\s+FROM\s+PUBLIC\s*,\s*anon\s*,\s*authenticated/i
    );
    expect(baseMigrationRaw).toMatch(
      /GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.fn_recompute_plus_access_until\s*\(\s*uuid\s*\)\s+TO\s+service_role/i
    );
    // Nunca debe concederse GRANT EXECUTE ... TO authenticated para esta función.
    expect(baseMigrationRaw).not.toMatch(
      /GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.fn_recompute_plus_access_until[\s\S]{0,40}TO\s+authenticated/i
    );
  });
});

// ---------------------------------------------------------------------------
// Fase 3.B reconstruida en MODO COMPATIBLE (2026-10-06)
// ---------------------------------------------------------------------------

const DEFERRED_DIR = path.join(SUPABASE_ROOT, "deferred", "freemium");
const MIGRATIONS_DIR = path.join(SUPABASE_ROOT, "migrations");
const DEFERRED_FILES = [
  "01_access_foundation.sql",
  "02_usage_backfill.sql",
  "03_enforce_expense_limit.sql",
  "04_legacy_access_grants.sql",
  "05_close_direct_expense_insert.sql",
  "rollback_freemium.sql",
];
const COMPAT_MIGRATIONS = [
  "20260916_phase3b_monetization_foundation.sql",
  "20260917_phase3b_profiles_hardening.sql",
  "20261001_first_expense_activation.sql",
];

describe("Fase 3.B — migraciones en modo compatible (sin límite ni cambios comerciales)", () => {
  const active = COMPAT_MIGRATIONS.map((f) =>
    stripSqlLineComments(fs.readFileSync(path.join(MIGRATIONS_DIR, f), "utf8"))
  );
  const all = active.join("\n");
  const foundation = stripSqlLineComments(fs.readFileSync(BASE_MIGRATION, "utf8"));

  it("ninguna migración aplicable contiene KB001 ni un límite numérico de gastos", () => {
    expect(all).not.toMatch(/KB001/);
    expect(all).not.toMatch(/count\s*<\s*30/i);
    expect(all).not.toMatch(/free_readonly|free_under_limit/);
  });

  it("ninguna migración aplicable cambia el trial: no redefine handle_new_user ni usa interval de 30 días", () => {
    expect(all).not.toMatch(/FUNCTION\s+public\.handle_new_user\s*\(/i);
    expect(all).not.toMatch(/interval\s+'30\s+days'/i);
  });

  it("ninguna migración aplicable modifica datos de profiles ni de suscripciones (fuera de cuerpos de función)", () => {
    // Los cuerpos de función ($$ ... $$) no se ejecutan al aplicar la migración: se excluyen.
    const topLevel = all.replace(/\$\$[\s\S]*?\$\$/g, "");
    expect(topLevel).not.toMatch(/UPDATE\s+public\.profiles/i);
    expect(topLevel).not.toMatch(/INSERT\s+INTO\s+public\.profiles/i);
    expect(topLevel).not.toMatch(/UPDATE\s+public\.subscriptions|INSERT\s+INTO\s+public\.subscriptions/i);
  });

  it("ninguna migración aplicable crea access_grants ni fn_resolve_access_state (son freemium)", () => {
    expect(all).not.toMatch(/access_grants/i);
    expect(all).not.toMatch(/fn_resolve_access_state\s*\(\s*p_user_id/i);
  });

  it("fn_create_expense compat conserva las validaciones técnicas", () => {
    expect(foundation).toMatch(/p_month_id\s+IS\s+NULL/i);
    expect(foundation).toMatch(/v_month_owner\s*<>\s*v_user_id/i);
    expect(foundation).toMatch(/v_month_status\s*=\s*'closed'/i);
    expect(foundation).toMatch(/'NaN'::numeric/);
    expect(foundation).toMatch(/p_amount\s*<\s*0/);
    expect(foundation).toMatch(/ERRCODE\s*=\s*'KB002'/);
    expect(foundation).toMatch(/SECURITY\s+DEFINER/i);
    expect(foundation).toMatch(/SET\s+search_path\s*=\s*public\s*,\s*pg_temp/i);
    expect(foundation).toMatch(
      /REVOKE\s+ALL\s+ON\s+FUNCTION\s+public\.fn_create_expense[^;]*FROM\s+PUBLIC\s*,\s*anon/i
    );
  });

  it("todas las funciones SECURITY DEFINER de las migraciones fijan search_path", () => {
    for (const sql of active) {
      const defs = sql
        .split(/CREATE\s+OR\s+REPLACE\s+FUNCTION/i)
        .slice(1)
        .map((d) => d.split("$$")[0])
        .filter((header) => /SECURITY\s+DEFINER/i.test(header));
      for (const header of defs) expect(header).toMatch(/SET\s+search_path\s*=/i);
    }
  });

  it("el hardening de profiles protege los campos de acceso y no quita permisos de tabla ni políticas", () => {
    const hardening = stripSqlLineComments(
      fs.readFileSync(path.join(MIGRATIONS_DIR, "20260917_phase3b_profiles_hardening.sql"), "utf8")
    );
    for (const col of ["is_founder", "founder_captured_at", "plus_access_until", "manual_override"]) {
      expect(hardening).toContain(col);
    }
    expect(hardening).toMatch(/current_user\s+NOT\s+IN\s*\(\s*'anon'\s*,\s*'authenticated'\s*\)/i);
    expect(hardening).not.toMatch(/REVOKE\s+(UPDATE|INSERT|DELETE|ALL)\s+ON\s+(TABLE\s+)?public\.(profiles|expenses)/i);
    expect(hardening).not.toMatch(/DROP\s+POLICY/i);
    // SECURITY INVOKER: con SECURITY DEFINER current_user sería el propietario.
    const header = hardening
      .split(/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.protect_profile_access_columns/i)[1]
      .split("$$")[0];
    expect(header).not.toMatch(/SECURITY\s+DEFINER/i);
  });

  it("la marca de primera activación sobrevive al borrado de gastos y no concede acceso", () => {
    const activation = stripSqlLineComments(
      fs.readFileSync(path.join(MIGRATIONS_DIR, "20261001_first_expense_activation.sql"), "utf8")
    );
    expect(activation).toMatch(/ON\s+DELETE\s+SET\s+NULL/i);
    expect(activation).toMatch(/ON\s+CONFLICT\s*\(\s*user_id\s*\)\s+DO\s+NOTHING/i);
    expect(activation).not.toMatch(/plus_access_until|is_founder|manual_override|\btier\b/i);
  });
});

describe("Fase 3.B — scripts diferidos de freemium (inactivos)", () => {
  const readDeferred = (f: string) => fs.readFileSync(path.join(DEFERRED_DIR, f), "utf8");

  it("existen los seis scripts y NO están en supabase/migrations/", () => {
    for (const f of DEFERRED_FILES) {
      expect(fs.existsSync(path.join(DEFERRED_DIR, f))).toBe(true);
      expect(fs.existsSync(path.join(MIGRATIONS_DIR, f))).toBe(false);
    }
    const strays = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => /freemium|enforce_expense_limit|legacy_access|close_direct|usage_backfill|access_foundation/i.test(f));
    expect(strays).toEqual([]);
  });

  it.each(DEFERRED_FILES)("%s está protegido por un guard de confirmación explícita y por una transacción", (f) => {
    const sql = readDeferred(f);
    expect(sql).toMatch(/current_setting\('kakebo\.freemium_(activation|rollback)'/);
    expect(sql).toMatch(/<>\s*'confirmed'/);
    expect(sql).toMatch(/RAISE\s+EXCEPTION/);
    expect(sql).toMatch(/\bBEGIN;/);
    expect(sql).toMatch(/\bCOMMIT;/);
    // El guard debe estar ANTES de cualquier sentencia de cambio.
    const guardAt = sql.search(/current_setting\('kakebo\./);
    const firstChange = stripSqlLineComments(sql).search(
      /\b(CREATE\s+(OR\s+REPLACE\s+)?(TABLE|FUNCTION|UNIQUE\s+INDEX)|REVOKE|GRANT|INSERT\s+INTO|DROP)\b/i
    );
    expect(guardAt).toBeGreaterThan(-1);
    expect(firstChange).toBeGreaterThan(-1);
    expect(guardAt).toBeLessThan(sql.length);
    // Posición relativa medida sobre el texto sin comentarios.
    const guardAtActive = stripSqlLineComments(sql).search(/current_setting\('kakebo\./);
    expect(guardAtActive).toBeLessThan(firstChange);
  });

  it("solo 03_enforce_expense_limit.sql activa el límite de 30 gastos (KB001)", () => {
    const withLimit = DEFERRED_FILES.filter((f) =>
      /ERRCODE\s*=\s*'KB001'/.test(stripSqlLineComments(readDeferred(f)))
    );
    expect(withLimit).toEqual(["03_enforce_expense_limit.sql"]);
  });

  it("solo 05_close_direct_expense_insert.sql revoca INSERT sobre expenses (y el rollback lo restituye)", () => {
    const revokers = DEFERRED_FILES.filter((f) =>
      /REVOKE\s+INSERT\s+ON\s+public\.expenses/i.test(stripSqlLineComments(readDeferred(f)))
    );
    expect(revokers).toEqual(["05_close_direct_expense_insert.sql"]);
    expect(readDeferred("rollback_freemium.sql")).toMatch(
      /GRANT\s+INSERT\s+ON\s+public\.expenses\s+TO\s+authenticated/i
    );
  });

  it("03 exige legacy grants, 05 exige modo freemium, 04 y 02 son idempotentes", () => {
    const f03 = readDeferred("03_enforce_expense_limit.sql");
    expect(f03).toMatch(/legacy_full/);
    expect(f03).toMatch(/RAISE\s+EXCEPTION[^;]*legacy/i);
    expect(readDeferred("05_close_direct_expense_insert.sql")).toMatch(/MODE: freemium/);
    expect(readDeferred("04_legacy_access_grants.sql")).toMatch(/ON\s+CONFLICT[^;]*DO\s+NOTHING/i);
    expect(readDeferred("02_usage_backfill.sql")).toMatch(/GREATEST\s*\(/i);
  });

  it("02 y 04 no modifican profiles ni suscripciones; el rollback freemium no borra datos", () => {
    for (const f of ["02_usage_backfill.sql", "04_legacy_access_grants.sql"]) {
      expect(stripSqlLineComments(readDeferred(f))).not.toMatch(
        /UPDATE\s+public\.(profiles|subscriptions)|DELETE\s+FROM|TRUNCATE|DROP\s+TABLE/i
      );
    }
    expect(stripSqlLineComments(readDeferred("rollback_freemium.sql"))).not.toMatch(
      /DELETE\s+FROM|TRUNCATE|DROP\s+TABLE|UPDATE\s+public\./i
    );
  });

  it("ningún script de supabase/ se invoca desde package.json", () => {
    const pkg = fs.readFileSync(path.join(SUPABASE_ROOT, "..", "package.json"), "utf8");
    expect(pkg).not.toMatch(/supabase\/(deferred|manual-ops|rollback)/);
  });
});

describe("Fase 3.B — scripts operativos", () => {
  const files = {
    snapshot: path.join(SUPABASE_ROOT, "manual-ops", "phase3b_pre_apply_snapshot.sql"),
    verify: path.join(SUPABASE_ROOT, "verification", "phase3b_verify.sql"),
    rollback: path.join(SUPABASE_ROOT, "rollback", "phase3b_rollback.sql"),
    baseline: path.join(SUPABASE_ROOT, "tests", "phase3b_prod_baseline.sql"),
  };

  it("existen los cuatro scripts operativos", () => {
    for (const f of Object.values(files)) expect(fs.existsSync(f)).toBe(true);
  });

  it("la verificación y la línea base son de SOLO LECTURA", () => {
    for (const f of [files.verify, files.baseline]) {
      const sql = stripSqlLineComments(fs.readFileSync(f, "utf8"));
      expect(sql).not.toMatch(/\b(INSERT\s+INTO|UPDATE\s+public|DELETE\s+FROM|DROP\s|ALTER\s|CREATE\s|TRUNCATE|GRANT|REVOKE)\b/i);
    }
  });

  it("el snapshot no modifica public y protege las copias", () => {
    const sql = stripSqlLineComments(fs.readFileSync(files.snapshot, "utf8"));
    expect(sql).not.toMatch(/UPDATE\s+public|DELETE\s+FROM|DROP\s+TABLE\s+public|TRUNCATE/i);
    expect(sql).toMatch(/ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);
    expect(sql).toMatch(/REVOKE\s+ALL[^;]*anon/i);
  });

  it("el rollback principal exige confirmación, distingue freemium y solo borra tablas vacías", () => {
    const raw = fs.readFileSync(files.rollback, "utf8");
    expect(raw).toMatch(/kakebo\.phase3b_rollback/);
    expect(raw).toMatch(/MODE: freemium/);
    expect(raw).toMatch(/v_rows\s*=\s*0/);
    expect(stripSqlLineComments(raw)).not.toMatch(/TRUNCATE|DELETE\s+FROM|DROP\s+COLUMN/i);
  });
});

describe("Fase 3.B — ningún secreto en scripts ni documentación", () => {
  const roots = [SUPABASE_ROOT, path.join(SUPABASE_ROOT, "..", "docs", "planning")];
  function walk(dir: string): string[] {
    if (!fs.existsSync(dir)) return [];
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
  }

  it("no hay JWT, claves sk_/whsec_ ni service_role literales", () => {
    const offenders: string[] = [];
    for (const f of roots.flatMap(walk).filter((x) => /\.(sql|md|toml)$/.test(x))) {
      const text = fs.readFileSync(f, "utf8");
      if (/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/.test(text)) offenders.push(`${f} (JWT)`);
      if (/\b(sk|rk)_(live|test)_[A-Za-z0-9]{8,}/.test(text)) offenders.push(`${f} (Stripe key)`);
      if (/whsec_[A-Za-z0-9]{8,}/.test(text)) offenders.push(`${f} (webhook secret)`);
      if (/SUPABASE_SERVICE_ROLE_KEY\s*=\s*\S{10,}/.test(text)) offenders.push(`${f} (service role)`);
    }
    expect(offenders).toEqual([]);
  });
});
