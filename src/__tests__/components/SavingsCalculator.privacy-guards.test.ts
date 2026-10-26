import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const SRC = path.resolve(__dirname, "..", "..");
const source = fs.readFileSync(path.join(SRC, "components", "landing", "tools", "SavingsCalculator.tsx"), "utf8");
const page = fs.readFileSync(path.join(SRC, "app", "[locale]", "(public)", "herramientas", "calculadora-ahorro", "page.tsx"), "utf8");

// Guardas estáticas: complementan las pruebas de payload en tiempo de ejecución.
describe("calculadora de ahorro: privacidad de los datos introducidos", () => {
  it("cada analytics.track solo usa los parámetros permitidos y solo existen los 5 eventos", () => {
    // Llamadas directas (tool_viewed, CTA) y envíos de un solo uso (sendEvent("nombre")).
    const direct = [...source.matchAll(/analytics\.track\(\s*"([a-z_]+)"\s*,\s*\{([\s\S]*?)\}\s*\)/g)];
    const once = [...source.matchAll(/sendEvent\(\s*"([a-z_]+)"\s*\)/g)].map((m) => m[1]);
    expect([...direct.map((c) => c[1]), ...once].sort()).toEqual([
      "click_tool_to_app",
      "savings_calculator_calculate",
      "savings_calculator_goal_result",
      "tool_viewed",
      "use_savings_calculator",
    ]);
    // La única llamada genérica a track dentro de sendOnce lleva solo el contexto de página.
    expect(source).toMatch(/analytics\.track\(name, \{ tool_name: "calculadora_ahorro", \.\.\.pageContext\(\) \}\)/);
    const allowed = new Set(["tool_name", "page_path", "page_title", "source", "...pageContext()"]);
    for (const [, name, body] of direct) {
      const keys = body
        .split(/,\s*(?![^()]*\))/)
        .map((entry) => entry.trim())
        .filter(Boolean)
        .map((entry) => entry.split(":")[0].trim());
      for (const key of keys) expect(allowed.has(key), `${name} usa el parámetro no permitido «${key}»`).toBe(true);
      if (name !== "click_tool_to_app") expect(keys).not.toContain("source");
    }
  });

  it("el source del CTA es una constante fija, no derivada del resultado", () => {
    expect(source).toContain('const CTA_SOURCE = "calculadora_ahorro";');
    expect(source).toMatch(/source: CTA_SOURCE/);
    expect(source).not.toMatch(/source: (?!CTA_SOURCE)/);
    expect(source).toContain("source=" + "calculadora_ahorro");
  });

  it("pageContext solo expone ruta y título del documento", () => {
    const body = source.match(/const pageContext = \(\) => \(\{([\s\S]*?)\}\);/)?.[1] ?? "";
    expect(body).toMatch(/page_path: .*window\.location\.pathname/);
    expect(body).toMatch(/page_title: .*document\.title/);
    expect(body).not.toMatch(/location\.(search|hash|href)/);
    expect(body.match(/page_[a-z]+:/g)).toEqual(["page_path:", "page_title:"]);
  });

  it("no hay parámetros de analítica con rangos, estados ni importes derivados", () => {
    for (const forbidden of [
      "income_range",
      "real_margin_range",
      "savings_rate_range",
      "months_to_goal",
      "has_goal",
      "has_deadline",
      "result_status",
      "cta_location",
      "incomeRange",
      "marginRange",
      "rateRange",
    ]) {
      expect(source, forbidden).not.toContain(forbidden);
    }
  });

  it("el componente no guarda lo que escribe la persona: ni storage, ni cookies, ni URL, ni logs", () => {
    for (const pattern of [
      /localStorage/,
      /sessionStorage/,
      /indexedDB/,
      /document\.cookie/,
      /history\.(pushState|replaceState)/,
      /router\.(push|replace)/,
      /URLSearchParams/,
      /console\.(log|info|debug|warn|error)/,
      /fetch\(/,
      /sendBeacon/,
    ]) {
      expect(source).not.toMatch(pattern);
    }
  });

  it("el CTA solo lleva el origen, sin importes", () => {
    expect(source).toContain('const CTA_HREF = "/login?mode=signup&source=calculadora_ahorro";');
  });

  it("la página no serializa valores financieros: ningún prop llega al componente cliente", () => {
    expect(page).toMatch(/<SavingsCalculator \/>/);
  });
});
