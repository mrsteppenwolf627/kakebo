import { describe, it, expect, vi } from "vitest";
import { searchExpenses } from "@/lib/agents/tools/search-expenses";

// Solo se usa en el test de fallback semántico dentro de ciclo (Fase 2.C,
// corrección); el resto de tests resuelve por keyword/coincidencia directa
// y no invoca este mock.
const searchExpensesByTextMock = vi.fn();
vi.mock("@/lib/ai/embeddings", () => ({
  searchExpensesByText: (...args: unknown[]) => searchExpensesByTextMock(...args),
}));

/**
 * Fase 2.B/2.C: filtro EXACTO por subcategoría y/o ámbito de ciclo real
 * (`cycle_scope`) en searchExpenses, con cobertura (clasificados vs sin
 * clasificar) y agregados (`totalCount`/`totalAmount`) independientes del
 * `limit`. Estas pruebas cubren únicamente la rama determinista añadida en
 * estas dos tareas; la búsqueda semántica/por keywords preexistente no se
 * modifica y queda fuera de este archivo.
 */
describe("searchExpenses — filtro exacto por subcategoría y ciclo real (Fase 2.B/2.C)", () => {
  const userId = "user-123";

  function makeSupabase({
    expenseRows = [] as Array<Record<string, unknown>>,
    monthsRows = [] as Array<Record<string, unknown>>,
  } = {}) {
    const expensesEq = vi.fn(() => expensesChain);
    const expensesGte = vi.fn(() => expensesChain);
    const expensesLte = vi.fn(() => expensesChain);
    const expensesChain: Record<string, unknown> = {
      eq: expensesEq,
      gte: expensesGte,
      lte: expensesLte,
      then: (resolve: (v: { data: typeof expenseRows; error: null }) => void) =>
        resolve({ data: expenseRows, error: null }),
    };

    const monthsChain: Record<string, unknown> = {
      eq: () => monthsChain,
      order: () => monthsChain,
      limit: () => Promise.resolve({ data: monthsRows, error: null }),
    };

    const from = vi.fn((table: string) => {
      if (table === "expenses") return { select: () => expensesChain };
      if (table === "months") return { select: () => monthsChain };
      throw new Error(`Unexpected table in test: ${table}`);
    });

    return { from, __expensesEq: expensesEq, __expensesGte: expensesGte, __expensesLte: expensesLte };
  }

  // ---------------------------------------------------------------------
  // Fase 2.B (regresión): filtro exacto por subcategoría y cobertura
  // ---------------------------------------------------------------------

  it("filters exactly by food_basic, never including a dining_out expense", async () => {
    const supabase = makeSupabase({
      expenseRows: [
        {
          id: "e1",
          date: "2026-02-01",
          amount: 40,
          note: "Mercadona",
          category: "supervivencia",
          subcategory: "food_basic",
        },
        {
          id: "e2",
          date: "2026-02-03",
          amount: 30,
          note: "Restaurante",
          category: "opcional",
          subcategory: "dining_out",
        },
      ],
    });

    const result = await searchExpenses(supabase as never, userId, {
      period: "all",
      subcategories: ["food_basic"],
    });

    expect(result.count).toBe(1);
    expect(result.expenses).toHaveLength(1);
    expect(result.expenses[0].subcategory).toBe("food_basic");
    expect(result.expenses.some((e) => e.subcategory === "dining_out")).toBe(false);
    expect(result.totalAmount).toBe(40);
  });

  it("filters exactly by dining_out, never including a food_basic expense", async () => {
    const supabase = makeSupabase({
      expenseRows: [
        {
          id: "e1",
          date: "2026-02-01",
          amount: 40,
          note: "Mercadona",
          category: "supervivencia",
          subcategory: "food_basic",
        },
        {
          id: "e2",
          date: "2026-02-03",
          amount: 30,
          note: "Restaurante",
          category: "opcional",
          subcategory: "dining_out",
        },
      ],
    });

    const result = await searchExpenses(supabase as never, userId, {
      period: "all",
      subcategories: ["dining_out"],
    });

    expect(result.count).toBe(1);
    expect(result.expenses[0].subcategory).toBe("dining_out");
    expect(result.expenses.some((e) => e.subcategory === "food_basic")).toBe(false);
    expect(result.totalAmount).toBe(30);
  });

  it("computes coverage correctly when some expenses in scope have no subcategory, and warns the search is not exhaustive", async () => {
    const supabase = makeSupabase({
      expenseRows: [
        {
          id: "e1",
          date: "2026-02-01",
          amount: 40,
          note: "Mercadona",
          category: "supervivencia",
          subcategory: "food_basic",
        },
        {
          id: "e2",
          date: "2026-02-02",
          amount: 10,
          note: "Gasto histórico sin clasificar",
          category: "supervivencia",
          subcategory: null,
        },
        {
          id: "e3",
          date: "2026-02-03",
          amount: 15,
          note: "Otro gasto histórico",
          category: "opcional",
          subcategory: null,
        },
      ],
    });

    const result = await searchExpenses(supabase as never, userId, {
      period: "all",
      subcategories: ["food_basic"],
    });

    expect(result.coverage).toEqual({ classified: 1, unclassified: 2 });
    expect(result.insights.some((i) => /no es exhaustiva/i.test(i))).toBe(true);
  });

  it("rejects a request where none of the requested subcategories are valid", async () => {
    const supabase = makeSupabase({ expenseRows: [] });

    await expect(
      searchExpenses(supabase as never, userId, {
        period: "all",
        subcategories: ["comida", "no-existe"],
      })
    ).rejects.toThrow();
  });

  // ---------------------------------------------------------------------
  // Fase 2.C: cycle_scope (ciclos libres — ciclo real, no fecha natural)
  // ---------------------------------------------------------------------

  it("cycle_scope 'current' includes an expense with a real date in the PREVIOUS calendar month, because it belongs to the open cycle via month_id", async () => {
    // El usuario cerró septiembre el 28; el ciclo abierto ya es octubre. Un
    // gasto con fecha real 2026-09-29 pertenece a ese ciclo abierto.
    const supabase = makeSupabase({
      monthsRows: [
        { id: "october-cycle", year: 2026, month: 10, status: "open", user_id: userId, savings_done: false },
      ],
      expenseRows: [
        {
          id: "e1",
          date: "2026-09-29", // fecha real en septiembre
          amount: 12,
          note: "Helado tras cerrar septiembre",
          category: "opcional",
          subcategory: null,
        },
      ],
    });

    const result = await searchExpenses(supabase as never, userId, {
      cycle_scope: "current",
    });

    expect(result.resolvedScope?.scope).toBe("current");
    expect(result.resolvedScope?.cycleYm).toBe("2026-10");
    expect(result.totalCount).toBe(1);
    expect(result.expenses[0].date).toBe("2026-09-29");

    // La consulta filtró por month_id del ciclo abierto, no por fecha.
    expect(supabase.__expensesEq).toHaveBeenCalledWith("month_id", "october-cycle");
    expect(supabase.__expensesGte).not.toHaveBeenCalled();
    expect(supabase.__expensesLte).not.toHaveBeenCalled();
  });

  it("cycle_scope 'specific' resolves a CLOSED cycle by cycle_ym and allows reading its expenses", async () => {
    const supabase = makeSupabase({
      monthsRows: [
        { id: "sept-cycle", year: 2026, month: 9, status: "closed", user_id: userId, savings_done: false },
      ],
      expenseRows: [
        {
          id: "e1",
          date: "2026-09-15",
          amount: 25,
          note: "Gasto de septiembre",
          category: "supervivencia",
          subcategory: null,
        },
      ],
    });

    const result = await searchExpenses(supabase as never, userId, {
      cycle_scope: "specific",
      cycle_ym: "2026-09",
    });

    expect(result.resolvedScope?.scope).toBe("specific");
    expect(result.resolvedScope?.cycleYm).toBe("2026-09");
    expect(result.resolvedScope?.status).toBe("closed");
    expect(result.totalCount).toBe(1);
    expect(supabase.__expensesEq).toHaveBeenCalledWith("month_id", "sept-cycle");
  });

  it("cycle_scope 'all_history' never filters by cycle or by calendar date", async () => {
    const supabase = makeSupabase({
      expenseRows: [
        { id: "e1", date: "2020-01-01", amount: 5, note: "Muy antiguo", category: "extra", subcategory: null },
        { id: "e2", date: "2026-09-29", amount: 12, note: "Reciente", category: "opcional", subcategory: null },
      ],
    });

    const result = await searchExpenses(supabase as never, userId, {
      cycle_scope: "all_history",
    });

    expect(result.resolvedScope?.scope).toBe("all_history");
    expect(result.totalCount).toBe(2);
    expect(supabase.__expensesEq).not.toHaveBeenCalledWith("month_id", expect.anything());
    expect(supabase.__expensesGte).not.toHaveBeenCalled();
    expect(supabase.__expensesLte).not.toHaveBeenCalled();
  });

  it("a nonexistent or foreign specific cycle fails clearly and never queries expenses", async () => {
    const supabase = makeSupabase({ monthsRows: [] }); // getMonthByYm -> null

    await expect(
      searchExpenses(supabase as never, userId, {
        cycle_scope: "specific",
        cycle_ym: "2026-09",
      })
    ).rejects.toThrow(/no existe/i);

    expect(supabase.from).not.toHaveBeenCalledWith("expenses");
  });

  it("distinguishes returnedCount, totalCount and totalAmount when there are more matches than 'limit'", async () => {
    const supabase = makeSupabase({
      monthsRows: [
        { id: "cycle-1", year: 2026, month: 10, status: "open", user_id: userId, savings_done: false },
      ],
      expenseRows: [
        { id: "e1", date: "2026-10-01", amount: 10, note: "A", category: "opcional", subcategory: null },
        { id: "e2", date: "2026-10-02", amount: 20, note: "B", category: "opcional", subcategory: null },
        { id: "e3", date: "2026-10-03", amount: 30, note: "C", category: "opcional", subcategory: null },
      ],
    });

    const result = await searchExpenses(supabase as never, userId, {
      cycle_scope: "current",
      limit: 2,
    });

    expect(result.returnedCount).toBe(2);
    expect(result.expenses).toHaveLength(2);
    expect(result.totalCount).toBe(3);
    expect(result.totalAmount).toBe(60); // 10 + 20 + 30, antes de aplicar el límite
    // `count` conserva su significado histórico: nº de elementos en `expenses`.
    expect(result.count).toBe(2);
  });

  it("keeps the coverage warning when combining cycle_scope with an exact subcategory filter", async () => {
    const supabase = makeSupabase({
      monthsRows: [
        { id: "cycle-1", year: 2026, month: 10, status: "open", user_id: userId, savings_done: false },
      ],
      expenseRows: [
        { id: "e1", date: "2026-10-01", amount: 10, note: "Mercadona", category: "supervivencia", subcategory: "food_basic" },
        { id: "e2", date: "2026-10-02", amount: 20, note: "Sin clasificar", category: "supervivencia", subcategory: null },
      ],
    });

    const result = await searchExpenses(supabase as never, userId, {
      cycle_scope: "current",
      subcategories: ["food_basic"],
    });

    expect(result.totalCount).toBe(1);
    expect(result.coverage).toEqual({ classified: 1, unclassified: 1 });
    expect(result.insights.some((i) => /no es exhaustiva/i.test(i))).toBe(true);
  });

  // ---------------------------------------------------------------------
  // Fase 2.C (corrección): cycle_scope se COMPONE con query, nunca lo borra
  // ---------------------------------------------------------------------

  it("BUG FIX: query: 'gasolina' + cycle_scope: 'current' returns ONLY gasoline expenses from the cycle, not the whole cycle", async () => {
    const supabase = makeSupabase({
      monthsRows: [
        { id: "october-cycle", year: 2026, month: 10, status: "open", user_id: userId, savings_done: false },
      ],
      expenseRows: [
        { id: "e1", date: "2026-10-02", amount: 45, note: "Gasolina Repsol", category: "supervivencia", subcategory: null },
        { id: "e2", date: "2026-10-05", amount: 60, note: "Mercadona compra semanal", category: "supervivencia", subcategory: null },
        { id: "e3", date: "2026-10-08", amount: 20, note: "Cine con amigos", category: "opcional", subcategory: null },
        { id: "e4", date: "2026-10-12", amount: 30, note: "Depósito lleno de gasolina", category: "supervivencia", subcategory: null },
      ],
    });

    const result = await searchExpenses(supabase as never, userId, {
      query: "gasolina",
      cycle_scope: "current",
    });

    expect(result.totalCount).toBe(2);
    expect(result.expenses).toHaveLength(2);
    expect(result.expenses.every((e) => e.concept.toLowerCase().includes("gasolina"))).toBe(true);
    expect(result.totalAmount).toBe(75); // 45 + 30, nunca los 155 del ciclo entero
    expect(result.returnedCount).toBe(2);
    // Nunca debe filtrarse por fecha de calendario dentro de un ámbito de ciclo.
    expect(supabase.__expensesGte).not.toHaveBeenCalled();
    expect(supabase.__expensesLte).not.toHaveBeenCalled();
  });

  it("an empty/generic query within a cycle scope still returns the whole cycle", async () => {
    const supabase = makeSupabase({
      monthsRows: [
        { id: "october-cycle", year: 2026, month: 10, status: "open", user_id: userId, savings_done: false },
      ],
      expenseRows: [
        { id: "e1", date: "2026-10-02", amount: 45, note: "Gasolina", category: "supervivencia", subcategory: null },
        { id: "e2", date: "2026-10-05", amount: 60, note: "Mercadona", category: "supervivencia", subcategory: null },
      ],
    });

    const result = await searchExpenses(supabase as never, userId, {
      cycle_scope: "current",
      // sin query: se normaliza internamente a "último", que es genérico
    });

    expect(result.totalCount).toBe(2);
    expect(result.totalAmount).toBe(105);
    expect(result.insights.some((i) => /todos los gastos/i.test(i))).toBe(true);
  });

  it("falls back to semantic search when no keyword/direct match, but strictly intersects results with cycle membership (never leaks an out-of-cycle hit)", async () => {
    const supabase = makeSupabase({
      monthsRows: [
        { id: "october-cycle", year: 2026, month: 10, status: "open", user_id: userId, savings_done: false },
      ],
      expenseRows: [
        { id: "in-cycle-1", date: "2026-10-02", amount: 15, note: "Repsol", category: "supervivencia", subcategory: null },
        { id: "in-cycle-2", date: "2026-10-05", amount: 8, note: "Cine", category: "opcional", subcategory: null },
      ],
    });

    // El motor semántico "encuentra" un gasto que SÍ pertenece al ciclo
    // (in-cycle-1) y otro que NO pertenece a este ciclo (de otro mes) — el
    // segundo nunca debe aparecer en el resultado.
    searchExpensesByTextMock.mockResolvedValue({
      results: [
        { expense_id: "in-cycle-1", note: "Repsol", amount: 15, category: "supervivencia", date: "2026-10-02", similarity: 0.7 },
        { expense_id: "outside-cycle-1", note: "Gasolinera otro mes", amount: 40, category: "supervivencia", date: "2026-08-01", similarity: 0.65 },
      ],
      queryTokens: 5,
      queryCostUsd: 0.0001,
    });

    const result = await searchExpenses(supabase as never, userId, {
      query: "combustible", // no está en el diccionario de keywords ni coincide literalmente con ninguna nota
      cycle_scope: "current",
    });

    expect(searchExpensesByTextMock).toHaveBeenCalled();
    expect(result.totalCount).toBe(1);
    expect(result.expenses).toHaveLength(1);
    expect(result.expenses[0].id).toBe("in-cycle-1");
    expect(result.expenses.some((e) => e.id === "outside-cycle-1")).toBe(false);
  });

  it("regression: an expense with a real date in September belonging to the October open cycle still appears when composed with a matching query", async () => {
    const supabase = makeSupabase({
      monthsRows: [
        { id: "october-cycle", year: 2026, month: 10, status: "open", user_id: userId, savings_done: false },
      ],
      expenseRows: [
        {
          id: "e1",
          date: "2026-09-29", // fecha real de septiembre
          amount: 12,
          note: "Helado tras cerrar septiembre",
          category: "opcional",
          subcategory: null,
        },
      ],
    });

    const result = await searchExpenses(supabase as never, userId, {
      query: "helado",
      cycle_scope: "current",
    });

    expect(result.resolvedScope?.cycleYm).toBe("2026-10");
    expect(result.totalCount).toBe(1);
    expect(result.expenses[0].date).toBe("2026-09-29");
    expect(supabase.__expensesEq).toHaveBeenCalledWith("month_id", "october-cycle");
  });

  it("RELIABILITY FIX: with more than 200 semantic candidates in the cycle, the limit sent covers the whole scope and totalCount/totalAmount include matches beyond position 200 (no longer capped at 200)", async () => {
    const CYCLE_SIZE = 250;
    const cycleExpenseRows = Array.from({ length: CYCLE_SIZE }, (_, i) => ({
      id: `e${i + 1}`,
      date: "2026-10-01",
      // El último elemento (posición 250, más allá del antiguo tope de 200)
      // lleva un importe distintivo para detectar si se pierde en el total.
      amount: i + 1 === CYCLE_SIZE ? 9999 : 1,
      note: `Gasto genérico ${i + 1}`, // no contiene el término de búsqueda
      category: "opcional",
      subcategory: null,
    }));

    const supabase = makeSupabase({
      monthsRows: [
        { id: "big-cycle", year: 2026, month: 10, status: "open", user_id: userId, savings_done: false },
      ],
      expenseRows: cycleExpenseRows,
    });

    // Simula un backend de embeddings real: respeta el `limit` que se le
    // envía y nunca devuelve más de eso, aunque existan más candidatos.
    searchExpensesByTextMock.mockImplementation(
      (_supabase: unknown, _userId: string, _query: string, options: { limit?: number }) => {
        const requestedLimit = options.limit ?? 5;
        const allIds = cycleExpenseRows.map((e) => e.id);
        const capped = allIds.slice(0, requestedLimit);
        return Promise.resolve({
          results: capped.map((id) => ({
            expense_id: id,
            note: "x",
            amount: 1,
            category: "opcional",
            date: "2026-10-01",
            similarity: 0.9,
          })),
          queryTokens: 1,
          queryCostUsd: 0,
        });
      }
    );

    const result = await searchExpenses(supabase as never, userId, {
      query: "conceptoraro", // no coincide con ningún diccionario ni nota literal -> fuerza el paso semántico
      cycle_scope: "current",
    });

    // El límite enviado a la búsqueda semántica cubre TODO el ámbito
    // (250), no el antiguo tope fijo de 200.
    expect(searchExpensesByTextMock).toHaveBeenCalled();
    const lastCall =
      searchExpensesByTextMock.mock.calls[searchExpensesByTextMock.mock.calls.length - 1];
    const sentOptions = lastCall[3] as { limit: number };
    expect(sentOptions.limit).toBeGreaterThanOrEqual(CYCLE_SIZE);

    // totalCount/totalAmount incluyen coincidencias más allá de la posición
    // 200 — en particular, el gasto #250 (amount 9999) no debe perderse.
    expect(result.totalCount).toBe(CYCLE_SIZE);
    expect(result.totalAmount).toBe(249 * 1 + 9999);
  });
});
