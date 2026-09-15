import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Fase 2.I (corrección): revisión estática de la migración de `ai_logs`
 * para el chat activo (turn metrics). No hay herramienta psql/CLI local
 * disponible para aplicarla de verdad contra Postgres, así que esta
 * prueba analiza el SQL en busca de las señales concretas que distinguen
 * "segura con la tabla existente Y sin la tabla" de una regresión:
 * - CERO sentencias sueltas (sin guardar) que puedan fallar si `ai_logs`
 *   no existe — ni ALTER TABLE, ni COMMENT ON, ni nada más.
 * - Toda operación sobre la tabla usa `IF EXISTS`/`to_regclass` como guard.
 * - Sigue siendo idempotente (CREATE/ADD con IF NOT EXISTS).
 * - `AI_LOGS_TABLE_SQL` (src/lib/ai/metrics.ts) es coherente con esta
 *   migración — mismo estado final, sin definiciones contradictorias.
 * - Solo existe UNA migración para `ai_logs` (no se creó una segunda).
 */

const MIGRATION_PATH = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "supabase",
  "migrations",
  "20260914_add_ai_logs_agent_v2_turn_metrics.sql"
);

const METRICS_TS_PATH = path.resolve(__dirname, "..", "..", "lib", "ai", "metrics.ts");

describe("Migración ai_logs (turn metrics, Fase 2.I) — segura con y sin la tabla existente", () => {
  const sql = fs.readFileSync(MIGRATION_PATH, "utf8");

  /**
   * Quita bloques `DO $$ ... $$;` y líneas de comentario `-- ...` (que
   * pueden mencionar "ALTER TABLE"/"COMMENT ON" como prosa, sin ser SQL
   * ejecutable), dejando solo sentencias SQL reales a nivel superior.
   */
  function executableTopLevelSql(source: string): string {
    const withoutDoBlocks = source.replace(/DO \$\$[\s\S]*?\$\$;/g, "");
    return withoutDoBlocks
      .split("\n")
      .map((line) => line.replace(/--.*$/, ""))
      .join("\n");
  }

  it("ningún ALTER TABLE toca ai_logs sin IF EXISTS", () => {
    const topLevelSql = executableTopLevelSql(sql);
    const topLevelAlters = topLevelSql
      .split("\n")
      .filter((line) => /^\s*ALTER TABLE\b/i.test(line));
    expect(topLevelAlters.length).toBeGreaterThan(0); // Sanity: hay algo que comprobar.
    for (const line of topLevelAlters) {
      expect(line.trim()).toMatch(/^ALTER TABLE IF EXISTS\b/i);
    }
  });

  it("no hay ningún COMMENT ON ejecutable suelto (fuera de un bloque DO $$ guardado)", () => {
    const topLevelSql = executableTopLevelSql(sql);
    expect(topLevelSql).not.toMatch(/COMMENT ON/i);
  });

  it("todos los COMMENT ON están dentro de un bloque que primero comprueba to_regclass('public.ai_logs')", () => {
    const doBlocks = sql.match(/DO \$\$[\s\S]*?\$\$;/g) ?? [];
    const blocksWithComment = doBlocks.filter((b) => /COMMENT ON/i.test(b));
    expect(blocksWithComment.length).toBeGreaterThan(0);
    for (const block of blocksWithComment) {
      expect(block).toMatch(/to_regclass\('public\.ai_logs'\)\s+IS\s+NULL/i);
      // El guard debe aparecer ANTES del primer COMMENT ON dentro del bloque.
      const guardIndex = block.search(/to_regclass\('public\.ai_logs'\)\s+IS\s+NULL/i);
      const commentIndex = block.search(/COMMENT ON/i);
      expect(guardIndex).toBeGreaterThanOrEqual(0);
      expect(guardIndex).toBeLessThan(commentIndex);
    }
  });

  it("todos los bloques DO $$ que tocan ai_logs comprueban to_regclass antes de actuar", () => {
    const doBlocks = sql.match(/DO \$\$[\s\S]*?\$\$;/g) ?? [];
    const blocksTouchingTable = doBlocks.filter((b) => /ai_logs/i.test(b));
    expect(blocksTouchingTable.length).toBeGreaterThan(0);
    for (const block of blocksTouchingTable) {
      expect(block).toMatch(/to_regclass\('public\.ai_logs'\)\s+IS\s+NULL/i);
    }
  });

  it("sigue siendo idempotente: columnas con IF NOT EXISTS, constraints comprobados antes de añadirse", () => {
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS turn_type/i);
    expect(sql).toMatch(/DROP COLUMN.*NOT NULL|ALTER COLUMN input DROP NOT NULL/i);
    expect(sql).toMatch(/NOT EXISTS\s*\(\s*SELECT 1 FROM pg_constraint/i);
  });

  it("solo existe una migración de ai_logs (no se creó una segunda)", () => {
    const migrationsDir = path.dirname(MIGRATION_PATH);
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql"));
    const forAiLogs = files.filter((f) => {
      const content = fs.readFileSync(path.join(migrationsDir, f), "utf8");
      return content.includes("ai_logs");
    });
    expect(forAiLogs).toEqual(["20260914_add_ai_logs_agent_v2_turn_metrics.sql"]);
  });

  it("AI_LOGS_TABLE_SQL (metrics.ts) es coherente con la migración: mismo estado final, sin esquemas contradictorios", () => {
    const metricsTs = fs.readFileSync(METRICS_TS_PATH, "utf8");
    const tableSqlMatch = metricsTs.match(/AI_LOGS_TABLE_SQL = `([\s\S]*?)`;/);
    expect(tableSqlMatch).not.toBeNull();
    const tableSql = tableSqlMatch![1];

    // La definición de referencia para un entorno nuevo ya incluye lo mismo
    // que esta migración añade a un entorno existente.
    expect(tableSql).toMatch(/'agent_v2'/);
    expect(tableSql).toMatch(/turn_type/);
    expect(tableSql).not.toMatch(/input TEXT NOT NULL/);

    // Y deja una instrucción inequívoca de que, para una tabla YA
    // existente, hace falta la migración dedicada (no basta con
    // re-ejecutar CREATE TABLE IF NOT EXISTS).
    expect(metricsTs).toMatch(/20260914_add_ai_logs_agent_v2_turn_metrics\.sql/);
  });
});
