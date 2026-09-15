import { describe, it, expect } from "vitest";
import { KAKEBO_TOOLS } from "@/lib/agents-v2/tools/definitions";

/**
 * Fase 2.D (corrección): verifica que el contrato de la tool searchExpenses
 * expuesto a OpenAI documenta y exige `search_intent` — sin esto, el modelo
 * podría omitir el campo y la puerta de ámbito (search-scope-gate) lo
 * trataría como "analysis" igualmente, pero el objetivo es que el propio
 * esquema ya empuje al modelo a incluirlo siempre.
 */
describe("searchExpenses tool definition (agent-v2) — contrato search_intent", () => {
  const tool = KAKEBO_TOOLS.find(
    (t) => t.type === "function" && t.function.name === "searchExpenses"
  );

  it("existe la tool searchExpenses en KAKEBO_TOOLS", () => {
    expect(tool).toBeDefined();
  });

  it("declara search_intent como parámetro con enum individual_lookup/analysis", () => {
    if (tool?.type !== "function") throw new Error("tool no es de tipo function");
    const params = tool.function.parameters as {
      properties: Record<string, { enum?: string[] }>;
      required?: string[];
    };

    expect(params.properties.search_intent).toBeDefined();
    expect(params.properties.search_intent.enum).toEqual(["individual_lookup", "analysis"]);
  });

  it("search_intent es obligatorio en el esquema (required)", () => {
    if (tool?.type !== "function") throw new Error("tool no es de tipo function");
    const params = tool.function.parameters as { required?: string[] };
    expect(params.required).toContain("search_intent");
  });

  it("cycle_scope y subcategories siguen presentes en el esquema (Fase 2.C/2.B, sin regresión)", () => {
    if (tool?.type !== "function") throw new Error("tool no es de tipo function");
    const params = tool.function.parameters as { properties: Record<string, unknown> };
    expect(params.properties.cycle_scope).toBeDefined();
    expect(params.properties.cycle_ym).toBeDefined();
    expect(params.properties.subcategories).toBeDefined();
  });
});

/**
 * Cierre de Fase 2 (revisión final): guarda de regresión para un hallazgo
 * real detectado en la revisión de diff final — la descripción de
 * searchExpenses (enviada al modelo en CADA llamada, como parte del
 * esquema de function calling) afirmaba "Aprende de TODOS los usuarios,
 * así que mejora con el tiempo", una claim preexistente al margen de
 * KAKEBO_SYSTEM_PROMPT que sobrevivió sin querer a la Fase 2.D y que
 * contradecía directamente el requisito de la Fase 2.G de no afirmar
 * aprendizaje colectivo activo. Corregido; este test evita que una
 * afirmación equivalente reaparezca en la descripción de NINGUNA tool.
 */
describe("Ninguna descripción de tool afirma aprendizaje colectivo activo (cierre Fase 2)", () => {
  // Patrones acotados a la afirmación concreta que prohíbe la Fase 2.G
  // ("aprende/mejora a partir de otros usuarios o de la comunidad") — no a
  // cualquier mención de "todos los usuarios" en un contexto no relacionado
  // con aprendizaje (p. ej. "no todos los usuarios usan meses calendario
  // estándar", que es sobre configuración personal de ciclo, no sobre IA).
  const FORBIDDEN_PATTERNS = [
    /aprende[^.]{0,60}(todos los usuarios|otros usuarios|la comunidad)/i,
    /mejora[^.]{0,60}(todos los usuarios|otros usuarios|la comunidad)/i,
    /entrena(mos)? (un|el) modelo/i,
  ];

  it("ninguna tool de KAKEBO_TOOLS menciona aprendizaje colectivo/comunitario en su descripción", () => {
    for (const tool of KAKEBO_TOOLS) {
      if (tool.type !== "function") continue;
      const description = tool.function.description ?? "";
      for (const pattern of FORBIDDEN_PATTERNS) {
        expect(description).not.toMatch(pattern);
      }
    }
  });
});
