import { describe, it, expect, vi } from "vitest";
import { submitSearchFeedback } from "@/lib/agents/tools/feedback";

/**
 * Fase 2.A: submitSearchFeedback debe comprobar que cada expense_id
 * pertenece al usuario autenticado antes de guardar feedback. Un
 * identificador inexistente o ajeno debe rechazarse de forma segura, sin
 * insertar nada en `search_feedback`.
 */
describe("submitSearchFeedback — verificación de propiedad (Fase 2.A)", () => {
  const userId = "user-123";

  function makeSupabase({
    ownedIds = [] as string[],
    upsertError = null as { message: string } | null,
  } = {}) {
    return {
      from: vi.fn((table: string) => {
        if (table === "expenses") {
          return {
            select: () => ({
              in: () => ({
                eq: () =>
                  Promise.resolve({
                    data: ownedIds.map((id) => ({ id })),
                    error: null,
                  }),
              }),
            }),
          };
        }
        if (table === "search_feedback") {
          return {
            upsert: () => Promise.resolve({ error: upsertError }),
          };
        }
        throw new Error(`Unexpected table in test: ${table}`);
      }),
    };
  }

  it("accepts feedback for an expense owned by the authenticated user", async () => {
    const mockSupabase = makeSupabase({ ownedIds: ["own-expense-1"] });

    const result = await submitSearchFeedback(mockSupabase as never, userId, {
      query: "vicios",
      correctExpenses: ["own-expense-1"],
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain("1 correctos");
    expect(mockSupabase.from).toHaveBeenCalledWith("search_feedback");
  });

  it("rejects feedback for a nonexistent or foreign expense_id, never inserting into search_feedback", async () => {
    // ownedIds vacío: el expense_id indicado no pertenece (o no existe) para este usuario
    const mockSupabase = makeSupabase({ ownedIds: [] });

    const result = await submitSearchFeedback(mockSupabase as never, userId, {
      query: "vicios",
      correctExpenses: ["foreign-or-missing-expense"],
    });

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/no existe o no te pertenece/i);
    expect(mockSupabase.from).not.toHaveBeenCalledWith("search_feedback");
  });

  it("saves only the owned subset and reports the rejected ones when mixing owned and foreign expense_ids", async () => {
    const mockSupabase = makeSupabase({ ownedIds: ["own-expense-1"] });

    const result = await submitSearchFeedback(mockSupabase as never, userId, {
      query: "vicios",
      correctExpenses: ["own-expense-1", "foreign-expense-2"],
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain("1 correctos");
    expect(result.message).toMatch(/1 gasto\(s\) rechazado/i);
    expect(mockSupabase.from).toHaveBeenCalledWith("search_feedback");
  });

  it("rejects a foreign expense_id passed as incorrect (not only correct)", async () => {
    const mockSupabase = makeSupabase({ ownedIds: [] });

    const result = await submitSearchFeedback(mockSupabase as never, userId, {
      query: "comida",
      incorrectExpenses: ["someone-elses-expense"],
    });

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/no existe o no te pertenece/i);
    expect(mockSupabase.from).not.toHaveBeenCalledWith("search_feedback");
  });
});
