import { SupabaseClient } from "@supabase/supabase-js";
import { apiLogger } from "@/lib/logger";
import { getSubcategoryLabel, isValidSubcategory, type SubcategoryId } from "@/lib/subcategories";
import { resolveCycleScope, type CycleScope, type ResolvedCycleScope } from "./utils/cycle-scope";

/**
 * Fase 2.F: análisis de hábitos fiable y basado en evidencia.
 *
 * Sustituye, para el flujo activo agent-v2, el análisis de
 * `analyzeSpendingPattern` legado (src/lib/agents/tools/spending-analysis.ts)
 * — que resolvía "período" por rango de fecha de calendario
 * (current_month/last_month/...), ignorando por completo los ciclos libres
 * de la Fase 1 (un gasto con fecha de septiembre puede pertenecer al ciclo
 * de octubre vía `month_id`). Ese archivo NO se modifica: sigue siendo la
 * implementación que usa la arquitectura v1 no conectada
 * (src/lib/agents/nodes/*, /api/ai/agent). Este módulo es exclusivo del
 * flujo v2 en streaming (src/lib/agents-v2/stream-caller.ts).
 *
 * Principio rector: el modelo redacta y explica; TODO número (totales,
 * recuentos, porcentajes, variaciones) sale de aritmética determinista
 * sobre los gastos reales devueltos por Supabase. Ningún LLM interviene en
 * sumar, contar, inferir fechas o fabricar una comparación.
 */

export type AnalyzeHabitsCategory = "survival" | "optional" | "culture" | "extra" | "all";

export interface AnalyzeHabitsParams {
  /** Fase 2.C: contrato de ámbito real — obligatorio, nunca opcional aquí. */
  cycle_scope: CycleScope;
  cycle_ym?: string;
  category?: AnalyzeHabitsCategory;
  /**
   * Comparación explícita (evolución/tendencia/cambio). Solo se calcula un
   * segundo ciclo cuando el usuario lo ha pedido de forma expresa — nunca
   * por defecto. Requiere `compare_cycle_scope` cuando es `true`.
   */
  compare?: boolean;
  compare_cycle_scope?: CycleScope;
  compare_cycle_ym?: string;
  /** Nº máximo de elementos en `topExpenses`/`mostFrequent`. Default 5, máx 20. */
  limit?: number;
}

interface CategoryBreakdownEntry {
  category: string; // Nombre de categoría legible (Supervivencia, Opcional, ...)
  amount: number;
  count: number;
  percentage: number; // 0-100, redondeado a 1 decimal
}

interface SubcategoryBreakdownEntry {
  subcategory: SubcategoryId;
  label: string;
  amount: number;
  count: number;
  percentage: number;
}

interface FrequentExpenseEntry {
  concept: string;
  count: number;
  totalAmount: number;
}

interface TopExpenseEntry {
  concept: string;
  amount: number;
  date: string;
  category: string;
}

interface ScopeSummary {
  scope: CycleScope;
  cycleYm?: string;
  status?: "open" | "closed";
  description: string;
}

interface ComparisonResult {
  baseline: ScopeSummary & { totalAmount: number; count: number };
  deltaAmount: number;
  /** null cuando el ciclo base no tiene gasto alguno (división por cero evitada, nunca inferida). */
  deltaPercentage: number | null;
  deltaCount: number;
}

export interface HabitAnalysisResult {
  resolvedScope: ScopeSummary;
  category: AnalyzeHabitsCategory;
  totalAmount: number;
  count: number;
  averageAmount: number;
  byCategory: CategoryBreakdownEntry[];
  bySubcategory: SubcategoryBreakdownEntry[];
  mostFrequent: FrequentExpenseEntry[];
  topExpenses: TopExpenseEntry[];
  comparison?: ComparisonResult;
  coverage: { classified: number; unclassified: number };
  /**
   * `true` cuando hay demasiado pocos gastos en el ámbito para detectar
   * patrones de forma fiable — en ese caso `possiblePatterns` y
   * `recommendations` quedan vacíos a propósito, y `insights` lo explica.
   */
  limited: boolean;
  /** Hechos verificables directamente en los datos (importe, recuento, ámbito). */
  observations: string[];
  /** Señales dignas de mención, pero explícitamente marcadas como NO concluyentes. */
  possiblePatterns: string[];
  /** Sugerencias genéricas y prudentes, nunca diagnósticos — solo si hay un patrón detectado. */
  recommendations: string[];
  /** Resumen combinado para mostrar/registrar, en el mismo estilo que el resto de tools. */
  insights: string[];
}

const CATEGORY_DB_TO_LABEL: Record<string, string> = {
  supervivencia: "Supervivencia",
  opcional: "Opcional",
  cultura: "Cultura",
  extra: "Extra",
};

const CATEGORY_EN_TO_DB: Record<Exclude<AnalyzeHabitsCategory, "all">, string> = {
  survival: "supervivencia",
  optional: "opcional",
  culture: "cultura",
  extra: "extra",
};

// ─── Umbrales deterministas de detección de patrones (documentados a propósito) ──
// Menos gastos que esto en el ámbito: no se intenta detectar ningún patrón,
// se devuelve un análisis explícitamente limitado.
const MIN_SAMPLE_FOR_PATTERNS = 5;
// Un concepto (categoría/subcategoría) que concentra >= este % del importe
// total se señala como posible concentración inusual.
const CONCENTRATION_THRESHOLD_PCT = 40;
// Un mismo concepto normalizado (nota de gasto) repetido al menos estas
// veces se señala como posible repetición.
const REPETITION_MIN_COUNT = 3;
// Variación (en valor absoluto) frente al ciclo de comparación que se
// considera lo bastante significativa para mencionarla.
const COMPARISON_SIGNIFICANT_DELTA_PCT = 15;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function normalizeConcept(note: string | null): string {
  return (note || "sin concepto").trim().toLowerCase();
}

interface RawExpense {
  id: string;
  date: string;
  amount: number;
  note: string | null;
  category: string;
  subcategory: string | null;
}

/**
 * Toda la aritmética de la herramienta vive en esta función pura,
 * independiente de Supabase — así se puede probar con conjuntos de datos
 * conocidos sin mockear la base de datos.
 */
export function computeHabitAggregate(
  expenses: RawExpense[],
  limit: number
): {
  totalAmount: number;
  count: number;
  averageAmount: number;
  byCategory: CategoryBreakdownEntry[];
  bySubcategory: SubcategoryBreakdownEntry[];
  mostFrequent: FrequentExpenseEntry[];
  topExpenses: TopExpenseEntry[];
  coverage: { classified: number; unclassified: number };
} {
  const count = expenses.length;
  const totalAmount = round2(expenses.reduce((sum, e) => sum + (e.amount || 0), 0));
  const averageAmount = count > 0 ? round2(totalAmount / count) : 0;

  // ── Distribución por categoría ──────────────────────────────────────────
  const categoryTotals = new Map<string, { amount: number; count: number }>();
  for (const e of expenses) {
    const label = CATEGORY_DB_TO_LABEL[e.category] || e.category;
    const entry = categoryTotals.get(label) || { amount: 0, count: 0 };
    entry.amount += e.amount || 0;
    entry.count += 1;
    categoryTotals.set(label, entry);
  }
  const byCategory: CategoryBreakdownEntry[] = Array.from(categoryTotals.entries())
    .map(([category, v]) => ({
      category,
      amount: round2(v.amount),
      count: v.count,
      percentage: totalAmount > 0 ? round1((v.amount / totalAmount) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // ── Distribución por subcategoría (solo gastos clasificados) ───────────
  const classified = expenses.filter((e) => e.subcategory && isValidSubcategory(e.subcategory));
  const unclassifiedCount = count - classified.length;

  const subcategoryTotals = new Map<SubcategoryId, { amount: number; count: number }>();
  for (const e of classified) {
    const sub = e.subcategory as SubcategoryId;
    const entry = subcategoryTotals.get(sub) || { amount: 0, count: 0 };
    entry.amount += e.amount || 0;
    entry.count += 1;
    subcategoryTotals.set(sub, entry);
  }
  const bySubcategory: SubcategoryBreakdownEntry[] = Array.from(subcategoryTotals.entries())
    .map(([subcategory, v]) => ({
      subcategory,
      label: getSubcategoryLabel(subcategory),
      amount: round2(v.amount),
      count: v.count,
      percentage: totalAmount > 0 ? round1((v.amount / totalAmount) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // ── Gastos más frecuentes (mismo concepto normalizado, >=2 repeticiones) ─
  const conceptGroups = new Map<string, { count: number; totalAmount: number; label: string }>();
  for (const e of expenses) {
    const key = normalizeConcept(e.note);
    const entry = conceptGroups.get(key) || { count: 0, totalAmount: 0, label: e.note || "Sin concepto" };
    entry.count += 1;
    entry.totalAmount += e.amount || 0;
    conceptGroups.set(key, entry);
  }
  const mostFrequent: FrequentExpenseEntry[] = Array.from(conceptGroups.values())
    .filter((g) => g.count >= 2)
    .sort((a, b) => b.count - a.count || b.totalAmount - a.totalAmount)
    .slice(0, limit)
    .map((g) => ({ concept: g.label, count: g.count, totalAmount: round2(g.totalAmount) }));

  // ── Mayores gastos individuales ─────────────────────────────────────────
  const topExpenses: TopExpenseEntry[] = [...expenses]
    .sort((a, b) => (b.amount || 0) - (a.amount || 0))
    .slice(0, limit)
    .map((e) => ({
      concept: e.note || "Sin concepto",
      amount: e.amount,
      date: e.date,
      category: CATEGORY_DB_TO_LABEL[e.category] || e.category,
    }));

  return {
    totalAmount,
    count,
    averageAmount,
    byCategory,
    bySubcategory,
    mostFrequent,
    topExpenses,
    coverage: { classified: classified.length, unclassified: unclassifiedCount },
  };
}

/**
 * Detección determinista de patrones "posibles" — nunca hechos, nunca
 * diagnósticos. Cada patrón se basa en un umbral fijo y documentado sobre
 * datos ya calculados por `computeHabitAggregate`; no hay ningún paso de
 * LLM en esta función.
 */
function detectPossiblePatterns(agg: ReturnType<typeof computeHabitAggregate>): string[] {
  const patterns: string[] = [];

  // Concentración inusual por categoría.
  const topCategory = agg.byCategory[0];
  if (topCategory && topCategory.percentage >= CONCENTRATION_THRESHOLD_PCT && agg.byCategory.length > 1) {
    patterns.push(
      `Posible concentración: "${topCategory.category}" representa el ${topCategory.percentage}% del importe total (${topCategory.count} gasto(s), ${topCategory.amount}€) — no es una conclusión definitiva, solo una proporción alta respecto al resto de categorías.`
    );
  }

  // Concentración inusual por subcategoría.
  const topSubcategory = agg.bySubcategory[0];
  if (topSubcategory && topSubcategory.percentage >= CONCENTRATION_THRESHOLD_PCT) {
    patterns.push(
      `Posible concentración: "${topSubcategory.label}" representa el ${topSubcategory.percentage}% del importe total (${topSubcategory.count} gasto(s), ${topSubcategory.amount}€).`
    );
  }

  // Repetición de un mismo concepto.
  const topFrequent = agg.mostFrequent[0];
  if (topFrequent && topFrequent.count >= REPETITION_MIN_COUNT) {
    patterns.push(
      `Posible repetición: "${topFrequent.concept}" aparece ${topFrequent.count} veces en este ámbito, por un total de ${topFrequent.totalAmount}€.`
    );
  }

  return patterns;
}

function buildRecommendations(patterns: string[]): string[] {
  // Recomendaciones genéricas y prudentes, solo cuando hay al menos un
  // patrón detectado — nunca diagnósticos psicológicos, médicos ni
  // financieros personalizados, solo sugerencias de revisión.
  if (patterns.length === 0) return [];
  return [
    "Si quieres, puedo desglosar estos gastos concretos para que decidas si quieres ajustar algo — esto no es una valoración de si está bien o mal gastado.",
  ];
}

function buildComparison(
  currentTotal: number,
  currentCount: number,
  baselineScope: ScopeSummary,
  baselineTotal: number,
  baselineCount: number
): ComparisonResult {
  const deltaAmount = round2(currentTotal - baselineTotal);
  const deltaPercentage = baselineTotal !== 0 ? round1((deltaAmount / baselineTotal) * 100) : null;
  const deltaCount = currentCount - baselineCount;

  return {
    baseline: { ...baselineScope, totalAmount: baselineTotal, count: baselineCount },
    deltaAmount,
    deltaPercentage,
    deltaCount,
  };
}

function toScopeSummary(resolved: ResolvedCycleScope): ScopeSummary {
  return {
    scope: resolved.scope,
    cycleYm: resolved.cycleYm,
    status: resolved.status,
    description: resolved.description,
  };
}

async function fetchScopedExpenses(
  supabase: SupabaseClient,
  userId: string,
  resolved: ResolvedCycleScope,
  category: AnalyzeHabitsCategory
): Promise<RawExpense[]> {
  let query = supabase
    .from("expenses")
    .select("id,date,amount,note,category,subcategory")
    .eq("user_id", userId);

  // Ciclos libres (Fase 1/2.C): SIEMPRE por month_id real, nunca por rango
  // de fecha de calendario. all_history (monthId null) no filtra por ciclo.
  if (resolved.monthId !== null) {
    query = query.eq("month_id", resolved.monthId);
  }

  if (category !== "all") {
    query = query.eq("category", CATEGORY_EN_TO_DB[category]);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as RawExpense[];
}

/**
 * Análisis de hábitos determinista sobre un ámbito de ciclo real.
 *
 * Contrato: `cycle_scope` es obligatorio (a diferencia del `analyzeSpendingPattern`
 * legado, que asumía un mes de calendario por defecto). El orquestador
 * (stream-caller.ts) ya bloquea la ejecución antes de llegar aquí si el
 * modelo no lo proporciona — ver evaluateAnalyzeHabitsScope.
 */
export async function analyzeSpendingHabits(
  supabase: SupabaseClient,
  userId: string,
  params: AnalyzeHabitsParams
): Promise<HabitAnalysisResult> {
  const category = params.category || "all";
  const limit = Math.min(Math.max(params.limit || 5, 1), 20);

  const resolvedScope = await resolveCycleScope(supabase, userId, params.cycle_scope, params.cycle_ym);
  const expenses = await fetchScopedExpenses(supabase, userId, resolvedScope, category);

  const agg = computeHabitAggregate(expenses, limit);
  const limited = agg.count < MIN_SAMPLE_FOR_PATTERNS;

  const possiblePatterns = limited ? [] : detectPossiblePatterns(agg);
  const recommendations = limited ? [] : buildRecommendations(possiblePatterns);

  // ── Observaciones: hechos verificables directamente en los datos ───────
  const observations: string[] = [
    `Ámbito consultado: ${resolvedScope.description}.`,
  ];

  if (agg.count === 0) {
    observations.push(`No hay gastos registrados en ${resolvedScope.description}.`);
  } else {
    observations.push(
      `${agg.count} gasto(s) por un total de ${agg.totalAmount}€ (promedio ${agg.averageAmount}€ por gasto).`
    );
    if (category === "all" && agg.byCategory.length > 0) {
      const breakdown = agg.byCategory.map((c) => `${c.category}: ${c.amount}€ (${c.percentage}%)`).join(", ");
      observations.push(`Distribución por categoría: ${breakdown}.`);
    }
  }

  if (agg.coverage.unclassified > 0) {
    observations.push(
      `Aviso de cobertura: ${agg.coverage.unclassified} de ${agg.count} gasto(s) de este ámbito no tienen subcategoría asignada — el desglose por subcategoría no los incluye y no es exhaustivo sobre histórico sin clasificar.`
    );
  }

  // ── Comparación (SOLO si se pidió explícitamente) ──────────────────────
  let comparison: ComparisonResult | undefined;
  if (params.compare) {
    if (!params.compare_cycle_scope) {
      throw new Error(
        'Para comparar (compare: true) hace falta indicar compare_cycle_scope ("current" | "specific" | "all_history").'
      );
    }
    const baselineResolved = await resolveCycleScope(
      supabase,
      userId,
      params.compare_cycle_scope,
      params.compare_cycle_ym
    );
    const baselineExpenses = await fetchScopedExpenses(supabase, userId, baselineResolved, category);
    const baselineAgg = computeHabitAggregate(baselineExpenses, limit);

    comparison = buildComparison(
      agg.totalAmount,
      agg.count,
      toScopeSummary(baselineResolved),
      baselineAgg.totalAmount,
      baselineAgg.count
    );

    observations.push(
      `Comparado con ${comparison.baseline.description}: ${comparison.baseline.totalAmount}€ en ${comparison.baseline.count} gasto(s).`
    );

    if (comparison.deltaPercentage === null) {
      observations.push(
        `El ciclo de comparación no tiene gasto registrado, así que la variación porcentual no se puede calcular (evitando una división por cero) — solo la diferencia en euros: ${comparison.deltaAmount >= 0 ? "+" : ""}${comparison.deltaAmount}€.`
      );
    } else {
      observations.push(
        `Variación frente al ciclo de comparación: ${comparison.deltaAmount >= 0 ? "+" : ""}${comparison.deltaAmount}€ (${comparison.deltaPercentage >= 0 ? "+" : ""}${comparison.deltaPercentage}%), ${comparison.deltaCount >= 0 ? "+" : ""}${comparison.deltaCount} gasto(s).`
      );

      if (!limited && Math.abs(comparison.deltaPercentage) >= COMPARISON_SIGNIFICANT_DELTA_PCT) {
        possiblePatterns.push(
          `Posible cambio de tendencia: variación de ${comparison.deltaPercentage >= 0 ? "+" : ""}${comparison.deltaPercentage}% frente a ${comparison.baseline.description} — conviene contrastarlo con el contexto (p. ej. un gasto puntual grande) antes de sacar conclusiones.`
        );
      }
    }
  }

  if (limited) {
    observations.push(
      `Análisis limitado: solo hay ${agg.count} gasto(s) en este ámbito, un número insuficiente para detectar patrones de forma fiable (mínimo ${MIN_SAMPLE_FOR_PATTERNS}). Se muestran los totales, pero no se buscan patrones ni se hacen recomendaciones.`
    );
  }

  const insights: string[] = [...observations];
  if (possiblePatterns.length > 0) {
    insights.push(...possiblePatterns.map((p) => `[Posible patrón] ${p}`));
  }
  if (recommendations.length > 0) {
    insights.push(...recommendations.map((r) => `[Sugerencia] ${r}`));
  }

  apiLogger.info(
    {
      userId,
      cycleScope: params.cycle_scope,
      resolvedScope,
      category,
      compare: !!params.compare,
      count: agg.count,
      totalAmount: agg.totalAmount,
      limited,
      patternsDetected: possiblePatterns.length,
    },
    "analyzeSpendingHabits executed (Fase 2.F)"
  );

  return {
    resolvedScope: toScopeSummary(resolvedScope),
    category,
    totalAmount: agg.totalAmount,
    count: agg.count,
    averageAmount: agg.averageAmount,
    byCategory: agg.byCategory,
    bySubcategory: agg.bySubcategory,
    mostFrequent: agg.mostFrequent,
    topExpenses: agg.topExpenses,
    comparison,
    coverage: agg.coverage,
    limited,
    observations,
    possiblePatterns,
    recommendations,
    insights,
  };
}
