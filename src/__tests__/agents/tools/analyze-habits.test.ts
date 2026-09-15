import { describe, it, expect, vi, beforeEach } from "vitest";
import { computeHabitAggregate, analyzeSpendingHabits } from "@/lib/agents/tools/analyze-habits";
import { getOpenMonth, getMonthByYm, getPreviousMonth } from "@/lib/months";

vi.mock("@/lib/logger", () => ({
  apiLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock("@/lib/months", () => ({
  getOpenMonth: vi.fn(),
  getMonthByYm: vi.fn(),
  getPreviousMonth: vi.fn(),
}));

const mockGetOpenMonth = vi.mocked(getOpenMonth);
const mockGetMonthByYm = vi.mocked(getMonthByYm);
const mockGetPreviousMonth = vi.mocked(getPreviousMonth);

/**
 * Fase 2.F: pruebas de la función determinista pura `computeHabitAggregate`
 * (sin base de datos, sin LLM) y de `analyzeSpendingHabits` de extremo a
 * extremo con una base de datos simulada, verificando ciclos reales
 * (month_id, no fecha de calendario), datos insuficientes, comparación
 * solo cuando se pide, y totales/porcentajes/recuentos exactos sobre un
 * conjunto de prueba conocido.
 */

function expense(
  id: string,
  date: string,
  amount: number,
  note: string,
  category: string,
  subcategory: string | null = null
) {
  return { id, date, amount, note, category, subcategory };
}

describe("computeHabitAggregate (Fase 2.F) — aritmética pura y determinista", () => {
  it("calcula totales, recuento y promedio exactos sobre un conjunto de prueba conocido", () => {
    const expenses = [
      expense("e1", "2026-10-01", 40, "Mercadona", "supervivencia", "food_basic"),
      expense("e2", "2026-10-05", 30, "Restaurante", "opcional", "dining_out"),
      expense("e3", "2026-10-10", 20, "Netflix", "opcional", "subscriptions"),
    ];

    const agg = computeHabitAggregate(expenses, 5);

    expect(agg.count).toBe(3);
    expect(agg.totalAmount).toBe(90);
    expect(agg.averageAmount).toBe(30);
  });

  it("calcula la distribución por categoría con porcentajes exactos", () => {
    const expenses = [
      expense("e1", "2026-10-01", 60, "Mercadona", "supervivencia"),
      expense("e2", "2026-10-05", 40, "Restaurante", "opcional"),
    ];

    const agg = computeHabitAggregate(expenses, 5);

    expect(agg.byCategory).toEqual([
      { category: "Supervivencia", amount: 60, count: 1, percentage: 60 },
      { category: "Opcional", amount: 40, count: 1, percentage: 40 },
    ]);
  });

  it("calcula la distribución por subcategoría solo sobre gastos clasificados, y reporta cobertura", () => {
    const expenses = [
      expense("e1", "2026-10-01", 50, "Mercadona", "supervivencia", "food_basic"),
      expense("e2", "2026-10-05", 30, "Restaurante", "opcional", "dining_out"),
      expense("e3", "2026-10-10", 20, "Gasto histórico sin clasificar", "extra", null),
    ];

    const agg = computeHabitAggregate(expenses, 5);

    expect(agg.coverage).toEqual({ classified: 2, unclassified: 1 });
    expect(agg.bySubcategory.map((s) => s.subcategory)).toEqual(["food_basic", "dining_out"]);
  });

  it("identifica los gastos más frecuentes (mismo concepto normalizado, >=2 repeticiones)", () => {
    const expenses = [
      expense("e1", "2026-10-01", 12, "Café Central", "opcional"),
      expense("e2", "2026-10-02", 12, "café central", "opcional"), // misma nota, distinta capitalización
      expense("e3", "2026-10-03", 12, "Café Central", "opcional"),
      expense("e4", "2026-10-04", 5, "Bocadillo", "opcional"), // solo 1 vez, no cuenta como frecuente
    ];

    const agg = computeHabitAggregate(expenses, 5);

    expect(agg.mostFrequent).toEqual([
      { concept: "Café Central", count: 3, totalAmount: 36 },
    ]);
  });

  it("ordena los mayores gastos individuales de mayor a menor y respeta el límite", () => {
    const expenses = [
      expense("e1", "2026-10-01", 10, "A", "extra"),
      expense("e2", "2026-10-02", 100, "B", "extra"),
      expense("e3", "2026-10-03", 50, "C", "extra"),
    ];

    const agg = computeHabitAggregate(expenses, 2);

    expect(agg.topExpenses).toEqual([
      { concept: "B", amount: 100, date: "2026-10-02", category: "Extra" },
      { concept: "C", amount: 50, date: "2026-10-03", category: "Extra" },
    ]);
  });

  it("con cero gastos, todos los agregados son cero/vacíos, sin división por cero", () => {
    const agg = computeHabitAggregate([], 5);

    expect(agg.count).toBe(0);
    expect(agg.totalAmount).toBe(0);
    expect(agg.averageAmount).toBe(0);
    expect(agg.byCategory).toEqual([]);
    expect(agg.bySubcategory).toEqual([]);
    expect(agg.mostFrequent).toEqual([]);
    expect(agg.topExpenses).toEqual([]);
  });
});

describe("analyzeSpendingHabits (Fase 2.F) — ámbito de ciclo real y análisis prudente", () => {
  const userId = "user-123";

  function makeSupabase({
    expenseRows = [] as Array<Record<string, unknown>>,
  } = {}) {
    const chain: Record<string, unknown> = {
      eq: vi.fn(() => chain),
      then: (resolve: (v: { data: typeof expenseRows; error: null }) => void) =>
        resolve({ data: expenseRows, error: null }),
    };

    const from = vi.fn((table: string) => {
      if (table === "expenses") return { select: () => chain };
      throw new Error(`Unexpected table in test: ${table}`);
    });

    return { from } as never;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ciclo actual: incluye gastos cuya fecha real cae en OTRO mes de calendario, siempre que compartan month_id", async () => {
    mockGetOpenMonth.mockResolvedValue({
      id: "october-cycle",
      user_id: userId,
      year: 2026,
      month: 10,
      status: "open",
      savings_done: false,
    });

    // Simula que la BD ya filtró por month_id (el mock no re-implementa el
    // filtro; lo importante es que la función NUNCA filtra por fecha de
    // calendario cuando hay cycle_scope — aquí se verifica devolviendo
    // deliberadamente un gasto con fecha de SEPTIEMBRE, que en un filtrado
    // por calendario ("current_month") habría quedado fuera.
    const supabase = makeSupabase({
      expenseRows: [
        expense("e1", "2026-09-29", 40, "Gasto de finales de septiembre, ciclo de octubre", "supervivencia"),
        expense("e2", "2026-10-05", 20, "Gasto de octubre", "opcional"),
      ],
    });

    const result = await analyzeSpendingHabits(supabase, userId, { cycle_scope: "current" });

    expect(result.count).toBe(2);
    expect(result.totalAmount).toBe(60);
    expect(result.topExpenses.some((e) => e.date === "2026-09-29")).toBe(true);
    expect(result.resolvedScope.description).toContain("2026-10");
  });

  it("ciclo específico cerrado: lectura correcta permitida", async () => {
    mockGetMonthByYm.mockResolvedValue({
      id: "august-cycle",
      user_id: userId,
      year: 2026,
      month: 8,
      status: "closed",
      savings_done: true,
    });

    const supabase = makeSupabase({
      expenseRows: [
        expense("e1", "2026-08-02", 100, "Gasto de agosto", "supervivencia"),
      ],
    });

    const result = await analyzeSpendingHabits(supabase, userId, {
      cycle_scope: "specific",
      cycle_ym: "2026-08",
    });

    expect(result.totalAmount).toBe(100);
    expect(result.resolvedScope.status).toBe("closed");
    expect(mockGetMonthByYm).toHaveBeenCalledWith(supabase, userId, 2026, 8);
  });

  it("análisis sin datos suficientes: limited=true, sin patrones ni recomendaciones fabricados", async () => {
    mockGetOpenMonth.mockResolvedValue({
      id: "cycle-1",
      user_id: userId,
      year: 2026,
      month: 10,
      status: "open",
      savings_done: false,
    });

    const supabase = makeSupabase({
      expenseRows: [
        expense("e1", "2026-10-01", 10, "Único gasto", "extra"),
      ],
    });

    const result = await analyzeSpendingHabits(supabase, userId, { cycle_scope: "current" });

    expect(result.limited).toBe(true);
    expect(result.possiblePatterns).toEqual([]);
    expect(result.recommendations).toEqual([]);
    expect(result.insights.some((i) => i.toLowerCase().includes("limitado"))).toBe(true);
  });

  it("sin datos en absoluto: cero gastos, cero patrones, mensaje explícito", async () => {
    mockGetOpenMonth.mockResolvedValue({
      id: "cycle-1",
      user_id: userId,
      year: 2026,
      month: 10,
      status: "open",
      savings_done: false,
    });

    const supabase = makeSupabase({ expenseRows: [] });

    const result = await analyzeSpendingHabits(supabase, userId, { cycle_scope: "current" });

    expect(result.count).toBe(0);
    expect(result.totalAmount).toBe(0);
    expect(result.limited).toBe(true);
    expect(result.observations.some((o) => o.includes("No hay gastos"))).toBe(true);
  });

  it("sin compare, NUNCA consulta un segundo ciclo ni añade el campo comparison", async () => {
    mockGetOpenMonth.mockResolvedValue({
      id: "cycle-1",
      user_id: userId,
      year: 2026,
      month: 10,
      status: "open",
      savings_done: false,
    });

    const supabase = makeSupabase({
      expenseRows: Array.from({ length: 6 }, (_, i) => expense(`e${i}`, "2026-10-0" + (i + 1), 10, `Gasto ${i}`, "extra")),
    });

    const result = await analyzeSpendingHabits(supabase, userId, { cycle_scope: "current" });

    expect(result.comparison).toBeUndefined();
    // getMonthByYm no debería haberse llamado — no hay ningún segundo ciclo implicado.
    expect(mockGetMonthByYm).not.toHaveBeenCalled();
  });

  it("con compare explícito, calcula la variación determinista frente al ciclo indicado", async () => {
    mockGetOpenMonth.mockResolvedValueOnce({
      id: "october-cycle",
      user_id: userId,
      year: 2026,
      month: 10,
      status: "open",
      savings_done: false,
    });
    mockGetMonthByYm.mockResolvedValueOnce({
      id: "september-cycle",
      user_id: userId,
      year: 2026,
      month: 9,
      status: "closed",
      savings_done: true,
    });

    let callCount = 0;
    const currentExpenses = Array.from({ length: 6 }, (_, i) =>
      expense(`oct-${i}`, "2026-10-0" + (i + 1), 20, `Gasto ${i}`, "extra")
    ); // total 120
    const baselineExpenses = Array.from({ length: 5 }, (_, i) =>
      expense(`sep-${i}`, "2026-09-0" + (i + 1), 20, `Gasto sep ${i}`, "extra")
    ); // total 100

    const chain: Record<string, unknown> = {
      eq: vi.fn(() => chain),
      then: (resolve: (v: { data: unknown; error: null }) => void) => {
        callCount += 1;
        // Primera consulta = ciclo actual, segunda = ciclo de comparación.
        resolve({ data: callCount === 1 ? currentExpenses : baselineExpenses, error: null });
      },
    };
    const supabase = { from: vi.fn(() => ({ select: () => chain })) } as never;

    const result = await analyzeSpendingHabits(supabase, userId, {
      cycle_scope: "current",
      compare: true,
      compare_cycle_scope: "specific",
      compare_cycle_ym: "2026-09",
    });

    expect(result.comparison).toBeDefined();
    expect(result.comparison?.baseline.totalAmount).toBe(100);
    expect(result.comparison?.deltaAmount).toBe(20);
    expect(result.comparison?.deltaPercentage).toBe(20); // (120-100)/100 * 100
    expect(result.comparison?.deltaCount).toBe(1);
  });

  it("Hotfix 2.1: con compare_cycle_scope: 'previous', compara con el ciclo inmediatamente anterior — nunca un mes inventado", async () => {
    const octoberCycle = {
      id: "october-cycle",
      user_id: userId,
      year: 2026,
      month: 10,
      status: "open" as const,
      savings_done: false,
    };
    // Se resuelve dos veces: el ámbito principal ("current") y, dentro de
    // la resolución de "previous" para la comparación, el ciclo abierto de
    // referencia — en ambos casos es el mismo ciclo real de octubre.
    mockGetOpenMonth.mockResolvedValue(octoberCycle);
    mockGetPreviousMonth.mockResolvedValue({
      id: "september-cycle",
      user_id: userId,
      year: 2026,
      month: 9,
      status: "closed",
      savings_done: true,
    });

    let callCount = 0;
    const currentExpenses = Array.from({ length: 6 }, (_, i) =>
      expense(`oct-${i}`, "2026-10-0" + (i + 1), 20, `Gasto ${i}`, "extra")
    ); // total 120
    const baselineExpenses = Array.from({ length: 5 }, (_, i) =>
      expense(`sep-${i}`, "2026-09-0" + (i + 1), 20, `Gasto sep ${i}`, "extra")
    ); // total 100

    const chain: Record<string, unknown> = {
      eq: vi.fn(() => chain),
      then: (resolve: (v: { data: unknown; error: null }) => void) => {
        callCount += 1;
        resolve({ data: callCount === 1 ? currentExpenses : baselineExpenses, error: null });
      },
    };
    const supabase = { from: vi.fn(() => ({ select: () => chain })) } as never;

    const result = await analyzeSpendingHabits(supabase, userId, {
      cycle_scope: "current",
      compare: true,
      compare_cycle_scope: "previous",
    });

    expect(result.comparison).toBeDefined();
    expect(result.comparison?.baseline.scope).toBe("previous");
    expect(result.comparison?.baseline.cycleYm).toBe("2026-09");
    expect(result.comparison?.baseline.totalAmount).toBe(100);
    expect(result.comparison?.deltaAmount).toBe(20);
    expect(mockGetPreviousMonth).toHaveBeenCalledWith(supabase, userId, 2026, 10);
  });

  it("compare: true sin compare_cycle_scope lanza un error claro (no se ejecuta sin ámbito de comparación)", async () => {
    mockGetOpenMonth.mockResolvedValue({
      id: "cycle-1",
      user_id: userId,
      year: 2026,
      month: 10,
      status: "open",
      savings_done: false,
    });
    const supabase = makeSupabase({ expenseRows: [] });

    await expect(
      analyzeSpendingHabits(supabase, userId, { cycle_scope: "current", compare: true })
    ).rejects.toThrow(/compare_cycle_scope/);
  });

  it("avisa de cobertura incompleta cuando hay gastos históricos sin subcategoría", async () => {
    mockGetOpenMonth.mockResolvedValue({
      id: "cycle-1",
      user_id: userId,
      year: 2026,
      month: 10,
      status: "open",
      savings_done: false,
    });

    const supabase = makeSupabase({
      expenseRows: [
        expense("e1", "2026-10-01", 10, "Clasificado", "supervivencia", "food_basic"),
        expense("e2", "2026-10-02", 10, "Sin clasificar", "supervivencia", null),
      ],
    });

    const result = await analyzeSpendingHabits(supabase, userId, { cycle_scope: "current" });

    expect(result.coverage).toEqual({ classified: 1, unclassified: 1 });
    expect(result.observations.some((o) => o.includes("Aviso de cobertura"))).toBe(true);
  });
});
