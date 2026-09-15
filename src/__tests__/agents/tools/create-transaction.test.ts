import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTransaction } from "@/lib/agents/tools/create-transaction";

describe("createTransaction", () => {
  let mockSupabase: any;
  const userId = "test-user-123";

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      // getOpenMonth() (ciclos libres, Fase 1/2.A) terminates in .limit():
      // by default simulate an open cycle already existing, so existing
      // tests exercise the normal "imputed to the open cycle" path.
      limit: vi.fn().mockResolvedValue({
        data: [{ id: "open-month-uuid", status: "open", year: 2026, month: 2 }],
        error: null,
      }),
      single: vi.fn().mockReturnThis(),
    };
  });

  it("should create an expense successfully", async () => {
    const mockInsertedExpense = {
      id: "expense-uuid-123",
      user_id: userId,
      amount: 50,
      note: "Compra supermercado",
      category: "supervivencia",
      date: "2026-02-12",
    };

    mockSupabase.single.mockResolvedValue({
      data: mockInsertedExpense,
      error: null,
    });

    const result = await createTransaction(mockSupabase, userId, {
      type: "expense",
      amount: 50,
      concept: "Compra supermercado",
      category: "survival",
      date: "2026-02-12",
    });

    expect(result.success).toBe(true);
    expect(result.transactionId).toBe("expense-uuid-123");
    expect(result.amount).toBe(50);
    expect(result.category).toBe("survival");
    expect(result.message).toContain("Gasto de 50€");
    expect(mockSupabase.from).toHaveBeenCalledWith("expenses");
  });

  it("should create an income successfully", async () => {
    const mockInsertedIncome = {
      id: "income-uuid-456",
      user_id: userId,
      amount: 1500,
      note: "Nómina febrero",
      date: "2026-02-01",
    };

    mockSupabase.single.mockResolvedValue({
      data: mockInsertedIncome,
      error: null,
    });

    const result = await createTransaction(mockSupabase, userId, {
      type: "income",
      amount: 1500,
      concept: "Nómina febrero",
      category: "survival", // Not used for incomes but required by interface
    });

    expect(result.success).toBe(true);
    expect(result.transactionId).toBe("income-uuid-456");
    expect(result.type).toBe("income");
    expect(result.message).toContain("Ingreso de 1500€");
    expect(mockSupabase.from).toHaveBeenCalledWith("incomes");
  });

  it("should map English categories to Spanish correctly", async () => {
    const mockInsertedExpense = {
      id: "expense-uuid-789",
      user_id: userId,
      amount: 30,
      note: "Cine",
      category: "opcional",
      date: "2026-02-12",
    };

    mockSupabase.single.mockResolvedValue({
      data: mockInsertedExpense,
      error: null,
    });

    await createTransaction(mockSupabase, userId, {
      type: "expense",
      amount: 30,
      concept: "Cine",
      category: "optional",
    });

    // Verify insert was called with Spanish category
    expect(mockSupabase.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "opcional",
      })
    );
  });

  it("should use current date when date is not provided", async () => {
    const mockInsertedExpense = {
      id: "expense-uuid-current",
      user_id: userId,
      amount: 25,
      note: "Café",
      category: "opcional",
      date: expect.any(String),
    };

    mockSupabase.single.mockResolvedValue({
      data: mockInsertedExpense,
      error: null,
    });

    const result = await createTransaction(mockSupabase, userId, {
      type: "expense",
      amount: 25,
      concept: "Café",
      category: "optional",
      // No date provided - should use current date
    });

    expect(result.success).toBe(true);
    // Verify date is in YYYY-MM-DD format
    expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("should reject negative amounts", async () => {
    await expect(
      createTransaction(mockSupabase, userId, {
        type: "expense",
        amount: -50,
        concept: "Invalid",
        category: "survival",
      })
    ).rejects.toThrow("El importe debe ser mayor que 0");
  });

  it("should reject zero amounts", async () => {
    await expect(
      createTransaction(mockSupabase, userId, {
        type: "expense",
        amount: 0,
        concept: "Invalid",
        category: "survival",
      })
    ).rejects.toThrow("El importe debe ser mayor que 0");
  });

  it("should reject empty concept", async () => {
    await expect(
      createTransaction(mockSupabase, userId, {
        type: "expense",
        amount: 50,
        concept: "",
        category: "survival",
      })
    ).rejects.toThrow("El concepto no puede estar vacío");
  });

  it("should reject whitespace-only concept", async () => {
    await expect(
      createTransaction(mockSupabase, userId, {
        type: "expense",
        amount: 50,
        concept: "   ",
        category: "survival",
      })
    ).rejects.toThrow("El concepto no puede estar vacío");
  });

  it("should handle database errors gracefully", async () => {
    mockSupabase.single.mockResolvedValue({
      data: null,
      error: { message: "Database connection failed" },
    });

    await expect(
      createTransaction(mockSupabase, userId, {
        type: "expense",
        amount: 50,
        concept: "Test",
        category: "survival",
      })
    ).rejects.toThrow();
  });

  it("should correctly map all Kakebo categories", async () => {
    const categories = [
      { english: "survival", spanish: "supervivencia" },
      { english: "optional", spanish: "opcional" },
      { english: "culture", spanish: "cultura" },
      { english: "extra", spanish: "extra" },
    ] as const;

    for (const { english, spanish } of categories) {
      const mockData = {
        id: `expense-${english}`,
        user_id: userId,
        amount: 10,
        note: "Test",
        category: spanish,
        date: "2026-02-12",
      };

      mockSupabase.single.mockResolvedValue({
        data: mockData,
        error: null,
      });

      await createTransaction(mockSupabase, userId, {
        type: "expense",
        amount: 10,
        concept: "Test",
        category: english,
      });

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          category: spanish,
        })
      );
    }
  });

  describe("Fase 2.A: ciclos libres en createTransaction (IA)", () => {
    it("imputes an AI-created expense to the currently open cycle, preserving its real date even when the cycle label is a later month", async () => {
      // Escenario: el usuario cerró su ciclo anterior anticipadamente hace
      // unos días; el ciclo abierto actual ya está etiquetado con el mes
      // "siguiente" a la fecha real del gasto (ciclo libre). Se calcula una
      // fecha real reciente en relación al reloj real para no depender de
      // una fecha fija que acabe cayendo fuera del rango permitido por el
      // validador (máx. 7 días en el futuro).
      const realDate = new Date();
      realDate.setDate(realDate.getDate() - 5);
      const dateStr = realDate.toISOString().slice(0, 10);
      const labelMonth = new Date(realDate);
      labelMonth.setMonth(labelMonth.getMonth() + 1);

      mockSupabase.limit.mockResolvedValueOnce({
        data: [
          {
            id: "next-cycle-uuid",
            status: "open",
            year: labelMonth.getFullYear(),
            month: labelMonth.getMonth() + 1,
          },
        ],
        error: null,
      });

      const mockInsertedExpense = {
        id: "expense-after-close",
        user_id: userId,
        amount: 12,
        note: "Helado",
        category: "opcional",
        date: dateStr,
        month_id: "next-cycle-uuid",
      };
      mockSupabase.single.mockResolvedValue({
        data: mockInsertedExpense,
        error: null,
      });

      const result = await createTransaction(mockSupabase, userId, {
        type: "expense",
        amount: 12,
        concept: "Helado",
        category: "optional",
        date: dateStr,
      });

      expect(result.success).toBe(true);
      expect(result.date).toBe(dateStr);
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({ date: dateStr, month_id: "next-cycle-uuid" })
      );
    });

    it("aborts without inserting when the resolved cycle is closed (no open cycle, bootstrap finds a closed month)", async () => {
      // No hay ningún ciclo abierto (getOpenMonth -> []); el bootstrap por
      // fecha encuentra que el mes natural correspondiente ya existe y está
      // cerrado.
      mockSupabase.limit.mockResolvedValueOnce({ data: [], error: null });
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: "closed-month-uuid", status: "closed", year: 2026, month: 2 },
        error: null,
      });

      await expect(
        createTransaction(mockSupabase, userId, {
          type: "expense",
          amount: 20,
          concept: "Test",
          category: "survival",
          date: "2026-02-15",
        })
      ).rejects.toThrow(/cerrado/i);

      expect(mockSupabase.insert).not.toHaveBeenCalled();
    });

    it("aborts without inserting when the cycle cannot be resolved at all (never creates an expense without month_id)", async () => {
      mockSupabase.limit.mockResolvedValueOnce({
        data: null,
        error: { message: "DB unavailable" },
      });

      await expect(
        createTransaction(mockSupabase, userId, {
          type: "expense",
          amount: 15,
          concept: "Test",
          category: "survival",
          date: "2026-02-15",
        })
      ).rejects.toThrow();

      expect(mockSupabase.insert).not.toHaveBeenCalled();
    });
  });

  describe("Fase 2.B: subcategoría en createTransaction (IA)", () => {
    it("persists a valid subcategory on the created expense", async () => {
      mockSupabase.single.mockResolvedValue({
        data: {
          id: "expense-food",
          user_id: userId,
          amount: 40,
          note: "Mercadona",
          category: "supervivencia",
          date: "2026-02-12",
          subcategory: "food_basic",
        },
        error: null,
      });

      const result = await createTransaction(mockSupabase, userId, {
        type: "expense",
        amount: 40,
        concept: "Mercadona",
        category: "survival",
        date: "2026-02-12",
        subcategory: "food_basic",
      });

      expect(result.success).toBe(true);
      expect(result.subcategory).toBe("food_basic");
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({ subcategory: "food_basic" })
      );
    });

    it("distinguishes food_basic from dining_out — dining_out is persisted as its own value, never merged with food_basic", async () => {
      mockSupabase.single.mockResolvedValue({
        data: {
          id: "expense-dining",
          user_id: userId,
          amount: 35,
          note: "Cena en restaurante",
          category: "opcional",
          date: "2026-02-12",
          subcategory: "dining_out",
        },
        error: null,
      });

      const result = await createTransaction(mockSupabase, userId, {
        type: "expense",
        amount: 35,
        concept: "Cena en restaurante",
        category: "optional",
        date: "2026-02-12",
        subcategory: "dining_out",
      });

      expect(result.subcategory).toBe("dining_out");
      expect(result.subcategory).not.toBe("food_basic");
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({ subcategory: "dining_out" })
      );
    });

    it("still creates the expense without a subcategory when none is provided (manual/legacy behavior preserved)", async () => {
      mockSupabase.single.mockResolvedValue({
        data: {
          id: "expense-no-sub",
          user_id: userId,
          amount: 20,
          note: "Test",
          category: "supervivencia",
          date: "2026-02-12",
          subcategory: null,
        },
        error: null,
      });

      const result = await createTransaction(mockSupabase, userId, {
        type: "expense",
        amount: 20,
        concept: "Test",
        category: "survival",
        date: "2026-02-12",
      });

      expect(result.success).toBe(true);
      expect(result.subcategory).toBeNull();
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({ subcategory: null })
      );
    });

    it("rejects an invalid subcategory and never inserts the expense", async () => {
      await expect(
        createTransaction(mockSupabase, userId, {
          type: "expense",
          amount: 20,
          concept: "Test",
          category: "survival",
          date: "2026-02-12",
          // @ts-expect-error intentionally invalid for this test
          subcategory: "comida",
        })
      ).rejects.toThrow(/subcategoría inválida/i);

      expect(mockSupabase.insert).not.toHaveBeenCalled();
    });
  });
});
