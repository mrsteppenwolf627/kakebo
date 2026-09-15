/**
 * Fase 2.F: ámbito obligatorio antes de analizar hábitos.
 *
 * Mismo patrón que `search-scope-gate.ts` (Fase 2.D) pero para
 * `analyzeSpendingPattern`: es, por definición, siempre una consulta
 * agregada (nunca la localización de un gasto individual concreto — para
 * eso está `searchExpenses`), así que aquí NO existe una excepción de tipo
 * "individual_lookup": `cycle_scope` es obligatorio en TODA llamada.
 *
 * Además, cuando el usuario pide explícitamente una comparación (`compare:
 * true`), hace falta saber con qué ciclo se compara antes de ejecutar nada
 * — nunca se añade un segundo ciclo "porque sí".
 *
 * Función pura y testeable: opera solo sobre los argumentos ya construidos
 * por el modelo, nunca sobre el texto libre del usuario.
 */

export interface AnalyzeHabitsScopeGateArgs {
  cycle_scope?: string;
  cycle_ym?: string;
  compare?: boolean;
  compare_cycle_scope?: string;
  compare_cycle_ym?: string;
}

export type AnalyzeHabitsScopeGateResult =
  | { action: "proceed" }
  | { action: "ask_scope" }
  | { action: "ask_compare_scope" };

export function evaluateAnalyzeHabitsScope(
  args: AnalyzeHabitsScopeGateArgs
): AnalyzeHabitsScopeGateResult {
  if (!args.cycle_scope) {
    return { action: "ask_scope" };
  }

  if (args.compare && !args.compare_cycle_scope) {
    return { action: "ask_compare_scope" };
  }

  return { action: "proceed" };
}
