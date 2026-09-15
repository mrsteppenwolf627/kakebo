/**
 * Fase 2.D (+ corrección): diálogo fiable antes de analizar datos.
 *
 * Helper puro y testeable que decide, a partir de los ARGUMENTOS ya
 * construidos por el modelo para `searchExpenses` (no del texto libre del
 * usuario — esa clasificación de intención es responsabilidad del prompt,
 * `KAKEBO_SYSTEM_PROMPT`), si la llamada puede ejecutarse tal cual o si debe
 * bloquearse para pedir una aclaración al usuario primero.
 *
 * Contrato: `searchExpenses` exige un `search_intent` explícito:
 * - "individual_lookup": localizar un gasto concreto (p. ej. "busca mi
 *   último gasto de Netflix"). Exento del requisito de ámbito.
 * - "analysis": totales, categorías, hábitos, comparativas, resúmenes,
 *   tendencias, "cuánto he gastado" y cualquier consulta agregada. Requiere
 *   `cycle_scope` siempre.
 *
 * Reglas (en este orden — nunca dos preguntas en el mismo turno):
 * 1. Si la llamada es de análisis (ver `isAnalysisIntent` más abajo) y no
 *    lleva `cycle_scope`, se pide el ámbito primero — incluso si la
 *    consulta también es una alimentación ambigua.
 * 2. Solo si ya hay `cycle_scope` (o la llamada no es de análisis) se
 *    evalúa la ambigüedad de alimentación ("alimentación"/"comida" sin
 *    `subcategories` ni pistas de food_basic/dining_out en el texto).
 *
 * Una llamada se considera de análisis si:
 * - `search_intent` es cualquier valor distinto de "individual_lookup"
 *   (incluido: ausente — se trata SIEMPRE de forma conservadora como
 *   análisis, nunca como búsqueda individual), O
 * - lleva `subcategories` (señal inequívoca de consulta agregada), incluso
 *   si el modelo etiquetó erróneamente la llamada como "individual_lookup".
 */

export interface SearchExpensesScopeGateArgs {
  query?: string;
  cycle_scope?: string;
  cycle_ym?: string;
  subcategories?: string[];
  search_intent?: "individual_lookup" | "analysis";
}

export type SearchExpensesScopeGateResult =
  | { action: "proceed" }
  | { action: "ask_scope" }
  | { action: "ask_food_type" };

const FOOD_BASIC_HINTS = [
  "supermercado",
  "mercadona",
  "mercado",
  "comida para casa",
  "comida en casa",
  "compra semanal",
  "carrefour",
  "lidl",
  "alcampo",
  "eroski",
];

const DINING_OUT_HINTS = [
  "restaurante",
  "bar",
  "chiringuito",
  "domicilio",
  "delivery",
  "comer fuera",
  "cena fuera",
  "comida fuera",
  "cafetería",
  "cafeteria",
];

// Términos que, por sí solos, no dejan claro si el usuario se refiere a
// alimentación básica (comprar para casa) o a comer fuera.
const AMBIGUOUS_FOOD_TERMS = ["alimentación", "alimentacion", "alimentos", "alimenticio", "comida"];

function hasAny(text: string, terms: string[]): boolean {
  return terms.some((t) => text.includes(t));
}

/**
 * Determina si una llamada a searchExpenses es de análisis (necesita
 * ámbito) — nunca a partir del texto libre, solo de los argumentos ya
 * construidos por el modelo. `subcategories` fuerza "análisis" aunque
 * `search_intent` diga lo contrario. Un `search_intent` ausente se trata
 * SIEMPRE como análisis (nunca como búsqueda individual, por defecto
 * conservador).
 */
function isAnalysisIntent(args: SearchExpensesScopeGateArgs): boolean {
  const hasSubcategories = !!(args.subcategories && args.subcategories.length > 0);
  if (hasSubcategories) return true;
  return args.search_intent !== "individual_lookup";
}

/**
 * Evalúa si una llamada a `searchExpenses` puede ejecutarse tal cual o si
 * debe pedirse una aclaración antes. No ejecuta nada ni tiene efectos
 * secundarios — es una función pura sobre los argumentos ya construidos.
 */
export function evaluateSearchExpensesScope(
  args: SearchExpensesScopeGateArgs
): SearchExpensesScopeGateResult {
  const query = (args.query || "").toLowerCase();
  const hasSubcategories = !!(args.subcategories && args.subcategories.length > 0);
  const isAnalysis = isAnalysisIntent(args);

  // 1) Búsqueda individual concreta: exenta del requisito de ámbito y de la
  // desambiguación de alimentación (no es una consulta agregada).
  if (!isAnalysis) {
    return { action: "proceed" };
  }

  // 2) Análisis sin ámbito: se pregunta el ciclo ANTES que cualquier otra
  // cosa — nunca se combina con la pregunta de alimentación en el mismo
  // turno, aunque la consulta también sea ambigua.
  if (!args.cycle_scope) {
    return { action: "ask_scope" };
  }

  // 3) Con ámbito ya resuelto, se evalúa la ambigüedad de alimentación.
  if (!hasSubcategories && hasAny(query, AMBIGUOUS_FOOD_TERMS)) {
    const hasFoodBasicHint = hasAny(query, FOOD_BASIC_HINTS);
    const hasDiningOutHint = hasAny(query, DINING_OUT_HINTS);
    if (!hasFoodBasicHint && !hasDiningOutHint) {
      return { action: "ask_food_type" };
    }
  }

  return { action: "proceed" };
}
