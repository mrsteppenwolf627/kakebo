import { describe, it, expect, vi, beforeEach } from "vitest";
import { setBudget } from "@/lib/agents/tools/set-budget";

describe("setBudget", () => {
  let mockSupabase: any;
  const userId = "test-user-123";

  beforeEach(() => {
    // Mock RPC call for get_current_cycle
    const rpcMock = vi.fn().mockResolvedValue({
      data: [
        {
          cycle_start: "2026-02-12",
          cycle_end: "2026-03-11",
          days_remaining: 28,
          days_elapsed: 0,
          days_total: 28,
          cycle_type: "calendar",
        },
      ],
      error: null,
    });

    mockSupabase = {
      rpc: rpcMock,
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    };
  });

  it("should create new budget for survival category", async () => {
    // No existing budget
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: { code: "PGRST116" }, // Not found
    });

    // Insert returns new budget
    const mockNewBudget = {
      user_id: userId,
      cycle_start: "2026-02-12",
      cycle_end: "2026-03-11",
      budget_supervivencia: 500,
      budget_opcional: 0,
      budget_cultura: 0,
      budget_extra: 0,
    };

    mockSupabase.single.mockResolvedValueOnce({
      data: mockNewBudget,
      error: null,
    });

    const result = await setBudget(mockSupabase, userId, {
      category: "survival",
      amount: 500,
    });

    expect(result.success).toBe(true);
    expect(result.category).toBe("survival");
    expect(result.amount).toBe(500);
    expect(result.totalBudget).toBe(500);
    expect(result.message).toContain("500€");
    expect(mockSupabase.from).toHaveBeenCalledWith("cycle_budgets");
  });

  it("should update existing budget for optional category", async () => {
    // Existing budget
    const mockExistingBudget = {
      user_id: userId,
      cycle_start: "2026-02-12",
      cycle_end: "2026-03-11",
      budget_supervivencia: 500,
      budget_opcional: 100,
      budget_cultura: 50,
      budget_extra: 50,
    };

    mockSupabase.single.mockResolvedValueOnce({
      data: mockExistingBudget,
      error: null,
    });

    // Update returns updated budget
    const mockUpdatedBudget = {
      ...mockExistingBudget,
      budget_opcional: 200,
    };

    mockSupabase.single.mockResolvedValueOnce({
      data: mockUpdatedBudget,
      error: null,
    });

    const result = await setBudget(mockSupabase, userId, {
      category: "optional",
      amount: 200,
    });

    expect(result.success).toBe(true);
    expect(result.category).toBe("optional");
    expect(result.amount).toBe(200);
    expect(result.totalBudget).toBe(800); // 500 + 200 + 50 + 50
    expect(mockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({
        budget_opcional: 200,
      })
    );
  });

  it("should set all categories to same amount when category is 'all'", async () => {
    // No existing budget
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: { code: "PGRST116" },
    });

    // Insert returns new budget
    const mockNewBudget = {
      user_id: userId,
      cycle_start: "2026-02-12",
      cycle_end: "2026-03-11",
      budget_supervivencia: 300,
      budget_opcional: 300,
      budget_cultura: 300,
      budget_extra: 300,
    };

    mockSupabase.single.mockResolvedValueOnce({
      data: mockNewBudget,
      error: null,
    });

    const result = await setBudget(mockSupabase, userId, {
      category: "all",
      amount: 300,
    });

    expect(result.success).toBe(true);
    expect(result.category).toBe("all");
    expect(result.amount).toBe(300);
    expect(result.totalBudget).toBe(1200); // 300 × 4
    expect(result.message).toContain("todas las categorías");
  });

  it("should use provided cycle dates instead of current cycle", async () => {
    // When dates are provided, should NOT call get_current_cycle
    // No existing budget
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: { code: "PGRST116" },
    });

    const mockNewBudget = {
      user_id: userId,
      cycle_start: "2026-03-01",
      cycle_end: "2026-03-31",
      budget_supervivencia: 400,
      budget_opcional: 0,
      budget_cultura: 0,
      budget_extra: 0,
    };

    mockSupabase.single.mockResolvedValueOnce({
      data: mockNewBudget,
      error: null,
    });

    const result = await setBudget(mockSupabase, userId, {
      category: "survival",
      amount: 400,
      cycleStart: "2026-03-01",
      cycleEnd: "2026-03-31",
    });

    expect(result.success).toBe(true);
    expect(result.cycleStart).toBe("2026-03-01");
    expect(result.cycleEnd).toBe("2026-03-31");
    // Should not call RPC when dates are provided
    expect(mockSupabase.rpc).not.toHaveBeenCalled();
  });

  it("should fetch current cycle when dates are not provided", async () => {
    // No existing budget
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: { code: "PGRST116" },
    });

    const mockNewBudget = {
      user_id: userId,
      cycle_start: "2026-02-12",
      cycle_end: "2026-03-11",
      budget_supervivencia: 450,
      budget_opcional: 0,
      budget_cultura: 0,
      budget_extra: 0,
    };

    mockSupabase.single.mockResolvedValueOnce({
      data: mockNewBudget,
      error: null,
    });

    const result = await setBudget(mockSupabase, userId, {
      category: "survival",
      amount: 450,
    });

    expect(result.success).toBe(true);
    expect(result.cycleStart).toBe("2026-02-12");
    expect(result.cycleEnd).toBe("2026-03-11");
    // Should call RPC to get current cycle
    expect(mockSupabase.rpc).toHaveBeenCalledWith("get_current_cycle", {
      p_user_id: userId,
    });
  });

  it("should allow setting budget to zero", async () => {
    // Existing budget
    const mockExistingBudget = {
      user_id: userId,
      cycle_start: "2026-02-12",
      cycle_end: "2026-03-11",
      budget_supervivencia: 500,
      budget_opcional: 100,
      budget_cultura: 50,
      budget_extra: 50,
    };

    mockSupabase.single.mockResolvedValueOnce({
      data: mockExistingBudget,
      error: null,
    });

    const mockUpdatedBudget = {
      ...mockExistingBudget,
      budget_cultura: 0,
    };

    mockSupabase.single.mockResolvedValueOnce({
      data: mockUpdatedBudget,
      error: null,
    });

    const result = await setBudget(mockSupabase, userId, {
      category: "culture",
      amount: 0,
    });

    expect(result.success).toBe(true);
    expect(result.amount).toBe(0);
    expect(result.totalBudget).toBe(650); // 500 + 100 + 0 + 50
  });

  it("should reject negative amounts", async () => {
    await expect(
      setBudget(mockSupabase, userId, {
        category: "survival",
        amount: -100,
      })
    ).rejects.toThrow("El presupuesto no puede ser negativo");
  });

  it("should handle error when current cycle cannot be fetched", async () => {
    // Mock RPC error
    mockSupabase.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: "Cycle not found" },
    });

    await expect(
      setBudget(mockSupabase, userId, {
        category: "survival",
        amount: 500,
      })
    ).rejects.toThrow("No se pudo obtener el ciclo actual");
  });

  it("should handle error when current cycle returns empty data", async () => {
    // Mock RPC empty data
    mockSupabase.rpc.mockResolvedValueOnce({
      data: [],
      error: null,
    });

    await expect(
      setBudget(mockSupabase, userId, {
        category: "survival",
        amount: 500,
      })
    ).rejects.toThrow("No se pudo obtener el ciclo actual");
  });

  it("should handle database errors on insert", async () => {
    // No existing budget
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: { code: "PGRST116" },
    });

    // Insert error
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: { message: "Database connection failed" },
    });

    await expect(
      setBudget(mockSupabase, userId, {
        category: "survival",
        amount: 500,
      })
    ).rejects.toThrow();
  });

  it("should handle database errors on update", async () => {
    // Existing budget
    const mockExistingBudget = {
      user_id: userId,
      cycle_start: "2026-02-12",
      cycle_end: "2026-03-11",
      budget_supervivencia: 500,
      budget_opcional: 100,
      budget_cultura: 50,
      budget_extra: 50,
    };

    mockSupabase.single.mockResolvedValueOnce({
      data: mockExistingBudget,
      error: null,
    });

    // Update error
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: { message: "Update failed" },
    });

    await expect(
      setBudget(mockSupabase, userId, {
        category: "survival",
        amount: 600,
      })
    ).rejects.toThrow();
  });

  it("should correctly map category to database column names", async () => {
    const categories = [
      { category: "survival" as const, column: "budget_supervivencia" },
      { category: "optional" as const, column: "budget_opcional" },
      { category: "culture" as const, column: "budget_cultura" },
      { category: "extra" as const, column: "budget_extra" },
    ];

    for (const { category, column } of categories) {
      // Mock existing budget for each iteration
      const mockExistingBudget = {
        user_id: userId,
        cycle_start: "2026-02-12",
        cycle_end: "2026-03-11",
        budget_supervivencia: 500,
        budget_opcional: 200,
        budget_cultura: 100,
        budget_extra: 50,
      };

      // Mock for select (fetch existing)
      mockSupabase.single.mockResolvedValueOnce({
        data: mockExistingBudget,
        error: null,
      });

      // Mock for update result
      const mockUpdatedBudget = {
        ...mockExistingBudget,
        [column]: 250,
      };

      mockSupabase.single.mockResolvedValueOnce({
        data: mockUpdatedBudget,
        error: null,
      });

      await setBudget(mockSupabase, userId, {
        category,
        amount: 250,
      });

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          [column]: 250,
        })
      );
    }
  });
});
