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
});
