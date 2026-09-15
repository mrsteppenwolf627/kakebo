/**
 * Hotfix 2.1: protección determinista contra adivinanzas de "ciclo anterior".
 *
 * Bug observado en producción: el usuario pedía un análisis y, al responder
 * "ciclo anterior", la IA consultaba enero — un mes de calendario inventado
 * por el propio modelo, sin ninguna resolución determinista. La causa era
 * que el contrato de `cycle_scope` no tenía ningún valor dedicado a "el
 * ciclo inmediatamente anterior al actual"; ahora existe (`"previous"`, ver
 * `cycle-scope.ts`), pero nada impedía que el modelo, ante la misma
 * expresión, siguiera traduciéndola a `cycle_scope: "specific"` con un
 * `cycle_ym` arbitrario, o a `cycle_scope: "current"`.
 *
 * Este módulo es un backstop puro y testeable, en la misma línea que
 * `search-scope-gate.ts` y `analyze-habits-scope-gate.ts`: NO decide qué
 * significa el texto del usuario en general (eso es responsabilidad del
 * prompt), solo detecta la expresión literal "ciclo anterior" (o un
 * equivalente reconocido) en el mensaje del turno actual y bloquea la
 * ejecución si la llamada construida por el modelo no usa `"previous"` en
 * ningún campo relevante — nunca dejando pasar un ciclo adivinado.
 */

const PREVIOUS_CYCLE_PHRASES = [
  "ciclo anterior",
  "el ciclo anterior",
  "mi ciclo anterior",
  "anterior ciclo",
  "ciclo pasado",
  "el ciclo pasado",
  "mi ciclo pasado",
  "previous cycle",
  "last cycle",
];

/**
 * true si el mensaje del usuario pide explícitamente el "ciclo anterior" (o
 * un equivalente reconocido) — evaluado solo sobre el texto literal del
 * turno actual, nunca sobre historial ni inferencia semántica.
 */
export function messageRequestsPreviousCycle(userMessage: string): boolean {
  const lower = (userMessage || "").toLowerCase();
  return PREVIOUS_CYCLE_PHRASES.some((phrase) => lower.includes(phrase));
}

export interface PreviousCycleGuardArgs {
  cycle_scope?: string;
  compare?: boolean;
  compare_cycle_scope?: string;
}

/**
 * true si la llamada evita indebidamente `cycle_scope: "previous"` pese a
 * que el usuario lo pidió explícitamente en este turno.
 *
 * Solo se dispara cuando la llamada YA trae un `cycle_scope` (si falta, el
 * gate de ámbito obligatorio de `search-scope-gate.ts`/`analyze-habits-scope-gate.ts`
 * ya bloquea la ejecución antes de llegar aquí). Se considera correcta
 * cualquier llamada donde `"previous"` aparezca en AL MENOS uno de los
 * campos de ámbito relevantes (`cycle_scope` o, si se pidió una
 * comparación, `compare_cycle_scope`) — así no se marca en falso un caso
 * legítimo como "compara este ciclo con el anterior" (cycle_scope:
 * "current", compare_cycle_scope: "previous").
 */
export function callMissesExplicitPreviousCycle(
  userMessage: string,
  args: PreviousCycleGuardArgs
): boolean {
  if (!messageRequestsPreviousCycle(userMessage)) return false;
  if (!args.cycle_scope) return false;

  const usesPreviousSomewhere =
    args.cycle_scope === "previous" ||
    (args.compare === true && args.compare_cycle_scope === "previous");

  return !usesPreviousSomewhere;
}
