import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateTransaction } from "@/lib/agents/tools/update-transaction";

describe("updateTransaction", () => {
  let mockSupabase: any;
  const userId = "test-user-123";
  const transactionId = "expense-uuid-123";

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    };
  });

  it("should update amount successfully", async () => {
    const mockUpdatedExpense = {
      id: transactionId,
      user_id: userId,
      amount: 45,
      note: "Supermercado",
      category: "supervivencia",
      date: "2026-02-12",
    };

    mockSupabase.single.mockResolvedValue({
      data: mockUpdatedExpense,
      error: null,
    });

    const result = await updateTransaction(mockSupabase, userId, {
      transactionId,
      amount: 45,
    });

    expect(result.success).toBe(true);
    expect(result.transactionId).toBe(transactionId);
    expect(result.updatedFields).toContain("importe");
    expect(result.message).toContain("importe");
    expect(mockSupabase.from).toHaveBeenCalledWith("expenses");
    expect(mockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 45 })
    );
  });

  it("should update concept successfully", async () => {
    const mockUpdatedExpense = {
      id: transactionId,
      user_id: userId,
      amount: 50,
      note: "Cena con Ana",
      category: "opcional",
      date: "2026-02-12",
    };

    mockSupabase.single.mockResolvedValue({
      data: mockUpdatedExpense,
      error: null,
    });

    const result = await updateTransaction(mockSupabase, userId, {
      transactionId,
      concept: "Cena con Ana",
    });

    expect(result.success).toBe(true);
    expect(result.updatedFields).toContain("concepto");
    expect(mockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({ note: "Cena con Ana" })
    );
  });

  it("should update category with Spanish mapping", async () => {
    const mockUpdatedExpense = {
      id: transactionId,
      user_id: userId,
      amount: 50,
      note: "Restaurant",
      category: "opcional",
      date: "2026-02-12",
    };

    mockSupabase.single.mockResolvedValue({
      data: mockUpdatedExpense,
      error: null,
    });

    const result = await updateTransaction(mockSupabase, userId, {
      transactionId,
      category: "optional",
    });

    expect(result.success).toBe(true);
    expect(result.updatedFields).toContain("categoría");
    expect(mockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({ category: "opcional" })
    );
  });

  it("should update date successfully", async () => {
    const mockUpdatedExpense = {
      id: transactionId,
      user_id: userId,
      amount: 50,
      note: "Supermercado",
      category: "supervivencia",
      date: "2026-02-11",
    };

    mockSupabase.single.mockResolvedValue({
      data: mockUpdatedExpense,
      error: null,
    });

    const result = await updateTransaction(mockSupabase, userId, {
      transactionId,
      date: "2026-02-11",
    });

    expect(result.success).toBe(true);
    expect(result.updatedFields).toContain("fecha");
    expect(mockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({ date: "2026-02-11" })
    );
  });

  it("should update multiple fields at once", async () => {
    const mockUpdatedExpense = {
      id: transactionId,
      user_id: userId,
      amount: 60,
      note: "Mercadona - productos frescos",
      category: "supervivencia",
      date: "2026-02-11",
    };

    mockSupabase.single.mockResolvedValue({
      data: mockUpdatedExpense,
      error: null,
    });

    const result = await updateTransaction(mockSupabase, userId, {
      transactionId,
      amount: 60,
      concept: "Mercadona - productos frescos",
      date: "2026-02-11",
    });

    expect(result.success).toBe(true);
    expect(result.updatedFields).toHaveLength(3);
    expect(result.updatedFields).toContain("importe");
    expect(result.updatedFields).toContain("concepto");
    expect(result.updatedFields).toContain("fecha");
  });

  it("should update income instead of expense when type is income", async () => {
    const mockUpdatedIncome = {
      id: transactionId,
      user_id: userId,
      amount: 1600,
      note: "Nómina corregida",
      date: "2026-02-01",
    };

    mockSupabase.single.mockResolvedValue({
      data: mockUpdatedIncome,
      error: null,
    });

    const result = await updateTransaction(mockSupabase, userId, {
      transactionId,
      type: "income",
      amount: 1600,
    });

    expect(result.success).toBe(true);
    expect(mockSupabase.from).toHaveBeenCalledWith("incomes");
  });

  it("should reject when no fields are provided", async () => {
    await expect(
      updateTransaction(mockSupabase, userId, {
        transactionId,
      })
    ).rejects.toThrow("al menos un campo a actualizar");
  });

  it("should reject negative amounts", async () => {
    await expect(
      updateTransaction(mockSupabase, userId, {
        transactionId,
        amount: -50,
      })
    ).rejects.toThrow("El importe debe ser mayor que 0");
  });

  it("should reject zero amounts", async () => {
    await expect(
      updateTransaction(mockSupabase, userId, {
        transactionId,
        amount: 0,
      })
    ).rejects.toThrow("El importe debe ser mayor que 0");
  });

  it("should reject empty concept", async () => {
    await expect(
      updateTransaction(mockSupabase, userId, {
        transactionId,
        concept: "",
      })
    ).rejects.toThrow("El concepto no puede estar vacío");
  });

  it("should reject whitespace-only concept", async () => {
    await expect(
      updateTransaction(mockSupabase, userId, {
        transactionId,
        concept: "   ",
      })
    ).rejects.toThrow("El concepto no puede estar vacío");
  });

  it("should handle transaction not found", async () => {
    mockSupabase.single.mockResolvedValue({
      data: null,
      error: null,
    });

    await expect(
      updateTransaction(mockSupabase, userId, {
        transactionId,
        amount: 50,
      })
    ).rejects.toThrow("No se encontró la transacción");
  });

  it("should handle database errors", async () => {
    mockSupabase.single.mockResolvedValue({
      data: null,
      error: { message: "Database connection failed" },
    });

    await expect(
      updateTransaction(mockSupabase, userId, {
        transactionId,
        amount: 50,
      })
    ).rejects.toThrow();
  });

  it("should enforce user ownership via userId filter", async () => {
    const mockUpdatedExpense = {
      id: transactionId,
      user_id: userId,
      amount: 55,
      note: "Test",
      category: "supervivencia",
      date: "2026-02-12",
    };

    mockSupabase.single.mockResolvedValue({
      data: mockUpdatedExpense,
      error: null,
    });

    await updateTransaction(mockSupabase, userId, {
      transactionId,
      amount: 55,
    });

    // Verify that eq was called with user_id filter
    expect(mockSupabase.eq).toHaveBeenCalledWith("user_id", userId);
  });
});
