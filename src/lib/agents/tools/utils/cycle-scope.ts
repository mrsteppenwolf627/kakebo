import { SupabaseClient } from "@supabase/supabase-js";
import { getOpenMonth, getMonthByYm, getPreviousMonth } from "@/lib/months";

/**
 * Fase 2.C: ámbito de ciclo real para herramientas de búsqueda/análisis de
 * IA. Ciclos libres (Fase 1): el "ciclo actual" NUNCA se calcula con fechas
 * de calendario — un gasto con fecha real de septiembre puede pertenecer al
 * ciclo ya abierto de octubre mediante `month_id`. Por eso toda resolución
 * de ámbito pasa por los helpers centralizados de `src/lib/months.ts`
 * (misma fuente que usan `/api/expenses`, `/api/months` y `createTransaction`
 * desde la Fase 1/2.A), nunca por rangos de fecha.
 */
export type CycleScope = "current" | "specific" | "all_history" | "previous";

export interface ResolvedCycleScope {
  scope: CycleScope;
  /**
   * `month_id` por el que filtrar, o `null` cuando no debe aplicarse ningún
   * filtro de ciclo (`all_history`).
   */
  monthId: string | null;
  /** Etiqueta YYYY-MM del ciclo resuelto. Ausente para `all_history`. */
  cycleYm?: string;
  status?: "open" | "closed";
  /** Descripción legible para que el agente pueda explicar qué se consultó. */
  description: string;
}

const CYCLE_YM_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

/**
 * Resolución compartida y testeable de `cycle_scope`:
 * - `"current"`: ciclo actualmente ABIERTO del usuario (`getOpenMonth`).
 *   Si el usuario no tiene ningún ciclo todavía, lanza un error claro.
 * - `"specific"`: ciclo del propio usuario identificado por `cycleYm`
 *   ("YYYY-MM"), abierto o cerrado — la lectura de ciclos cerrados está
 *   permitida. Si no existe ese ciclo para este usuario (inexistente o
 *   perteneciente a otro usuario), lanza un error claro sin filtrar ni
 *   exponer ningún dato.
 * - `"all_history"`: no se resuelve ningún ciclo concreto; `monthId` es
 *   `null` y el llamador no debe aplicar ningún filtro de ciclo (ni de
 *   fecha de calendario).
 * - `"previous"` (Hotfix 2.1): el ciclo INMEDIATAMENTE ANTERIOR al ciclo
 *   abierto actual del usuario, resuelto vía `getOpenMonth` + `getPreviousMonth`
 *   (tabla `months`), nunca por fecha de calendario ni por la fecha actual.
 *   Permite leer un ciclo cerrado. Si el usuario no tiene ciclo abierto, o no
 *   tiene ningún ciclo anterior a ese, lanza un error claro sin consultar
 *   ningún gasto — nunca elige ni infiere un mes de calendario arbitrario.
 */
export async function resolveCycleScope(
  supabase: SupabaseClient,
  userId: string,
  scope: CycleScope,
  cycleYm?: string
): Promise<ResolvedCycleScope> {
  if (scope === "all_history") {
    return {
      scope,
      monthId: null,
      description: "todo el histórico (sin filtrar por ciclo)",
    };
  }

  if (scope === "current") {
    const openMonth = await getOpenMonth(supabase, userId);

    if (!openMonth) {
      throw new Error(
        "No tienes ningún ciclo abierto todavía. No se puede resolver el ciclo actual."
      );
    }

    const ym = `${openMonth.year}-${String(openMonth.month).padStart(2, "0")}`;

    return {
      scope,
      monthId: openMonth.id,
      cycleYm: ym,
      status: openMonth.status,
      description: `ciclo abierto actual (${ym})`,
    };
  }

  if (scope === "previous") {
    const openMonth = await getOpenMonth(supabase, userId);

    if (!openMonth) {
      throw new Error(
        "No tienes ningún ciclo abierto todavía. No se puede resolver el ciclo anterior."
      );
    }

    const previousMonth = await getPreviousMonth(
      supabase,
      userId,
      openMonth.year,
      openMonth.month
    );

    if (!previousMonth) {
      throw new Error(
        "No tienes ningún ciclo anterior al actual todavía. No se ha consultado ningún gasto."
      );
    }

    const ym = `${previousMonth.year}-${String(previousMonth.month).padStart(2, "0")}`;

    return {
      scope,
      monthId: previousMonth.id,
      cycleYm: ym,
      status: previousMonth.status,
      description: `ciclo anterior (${ym}, ${previousMonth.status === "closed" ? "cerrado" : "abierto"})`,
    };
  }

  // scope === "specific"
  if (!cycleYm || !CYCLE_YM_REGEX.test(cycleYm)) {
    throw new Error(
      `Para cycle_scope "specific" debes indicar cycle_ym en formato YYYY-MM. Recibido: ${cycleYm ?? "(ninguno)"
      }`
    );
  }

  const [yearStr, monthStr] = cycleYm.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const monthRow = await getMonthByYm(supabase, userId, year, month);

  if (!monthRow) {
    // No existe para este usuario (inexistente o de otro usuario): se
    // rechaza explícitamente, nunca se filtra ni se expone nada.
    throw new Error(
      `No existe el ciclo ${cycleYm} para este usuario. No se ha consultado ningún gasto.`
    );
  }

  return {
    scope,
    monthId: monthRow.id,
    cycleYm,
    status: monthRow.status,
    description: `ciclo ${cycleYm} (${monthRow.status === "closed" ? "cerrado" : "abierto"})`,
  };
}
