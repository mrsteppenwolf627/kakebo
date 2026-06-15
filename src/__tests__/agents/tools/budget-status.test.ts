import { describe, it, expect, vi, beforeEach } from "vitest";
import { getBudgetStatus } from "@/lib/agents/tools/budget-status";

// Helper: creates a full Supabase mock chain for budget-status.ts
// Chains used in getBudgetStatus:
//   user_settings: .from().select().eq().single()
//   expenses:      .from().select().eq().gte().lt()
//   fixed_expenses:.from().select().eq().eq().lte().or()
function makeTableMock(data: unknown, error: null | { message: string } = null) {
  const mock: any = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockResolvedValue({ data, error }),
    lte: vi.fn().mockReturnThis(),
    or: vi.fn().mockResolvedValue({ data, error }),
    single: vi.fn().mockResolvedValue({ data, error }),
  };
  return mock;
}

describe("getBudgetStatus", () => {
  let mockSupabase: any;
  const userId = "test-user-123";

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    };
  });

  it("should calculate budget status correctly", async () => {
    const mockSettings = {
      user_id: userId,
      budget_supervivencia: 500,
      budget_opcional: 200,
      budget_cultura: 100,
      budget_extra: 50,
    };

    // expenses table uses Spanish category names
    const mockExpenses = [
      { category: "supervivencia", amount: 300 },
      { category: "opcional", amount: 150 },
      { category: "cultura", amount: 50 },
    ];

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "user_settings") return makeTableMock(mockSettings);
      if (table === "expenses") return makeTableMock(mockExpenses);
      return makeTableMock([]); // fixed_expenses
    });

    const result = await getBudgetStatus(mockSupabase, userId, {});

    expect(result.totalBudget).toBe(850);
    expect(result.totalSpent).toBe(500);
    expect(result.totalRemaining).toBe(350);
    expect(result.categories).toHaveLength(4);
  });

  it("should identify safe status when under 70%", async () => {
    const mockSettings = {
      user_id: userId,
      budget_supervivencia: 1000,
      budget_opcional: 200,
      budget_cultura: 100,
      budget_extra: 50,
    };

    const mockExpenses = [{ category: "supervivencia", amount: 500 }]; // 50%

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "user_settings") return makeTableMock(mockSettings);
      if (table === "expenses") return makeTableMock(mockExpenses);
      return makeTableMock([]);
    });

    const result = await getBudgetStatus(mockSupabase, userId, {
      category: "survival",
    });

    const survivalCategory = result.categories.find(
      (c) => c.category === "survival"
    );
    expect(survivalCategory?.status).toBe("safe");
    expect(survivalCategory?.percentage).toBe(50);
  });

  it("should identify warning status when 70-100%", async () => {
    const mockSettings = {
      user_id: userId,
      budget_supervivencia: 1000,
      budget_opcional: 200,
      budget_cultura: 100,
      budget_extra: 50,
    };

    const mockExpenses = [{ category: "supervivencia", amount: 850 }]; // 85%

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "user_settings") return makeTableMock(mockSettings);
      if (table === "expenses") return makeTableMock(mockExpenses);
      return makeTableMock([]);
    });

    const result = await getBudgetStatus(mockSupabase, userId, {
      category: "survival",
    });

    const survivalCategory = result.categories.find(
      (c) => c.category === "survival"
    );
    expect(survivalCategory?.status).toBe("warning");
  });

  it("should identify exceeded status when over 100%", async () => {
    const mockSettings = {
      user_id: userId,
      budget_supervivencia: 1000,
      budget_opcional: 200,
      budget_cultura: 100,
      budget_extra: 50,
    };

    const mockExpenses = [{ category: "supervivencia", amount: 1200 }]; // 120%

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "user_settings") return makeTableMock(mockSettings);
      if (table === "expenses") return makeTableMock(mockExpenses);
      return makeTableMock([]);
    });

    const result = await getBudgetStatus(mockSupabase, userId, {
      category: "survival",
    });

    const survivalCategory = result.categories.find(
      (c) => c.category === "survival"
    );
    expect(survivalCategory?.status).toBe("exceeded");
  });

  it("should project spending correctly", async () => {
    const mockSettings = {
      user_id: userId,
      budget_supervivencia: 1000,
      budget_opcional: 200,
      budget_cultura: 100,
      budget_extra: 50,
    };

    const mockExpenses = [{ category: "supervivencia", amount: 300 }];

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "user_settings") return makeTableMock(mockSettings);
      if (table === "expenses") return makeTableMock(mockExpenses);
      return makeTableMock([]);
    });

    const result = await getBudgetStatus(mockSupabase, userId, {});

    const survivalCategory = result.categories.find(
      (c) => c.category === "survival"
    );
    expect(survivalCategory?.projectedSpending).toBeGreaterThan(0);
  });

  it("should handle specific month parameter", async () => {
    const mockSettings = {
      user_id: userId,
      budget_supervivencia: 1000,
      budget_opcional: 200,
      budget_cultura: 100,
      budget_extra: 50,
    };

    const mockExpenses = [{ category: "supervivencia", amount: 300 }];

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "user_settings") return makeTableMock(mockSettings);
      if (table === "expenses") return makeTableMock(mockExpenses);
      return makeTableMock([]);
    });

    const result = await getBudgetStatus(mockSupabase, userId, {
      month: "2026-01",
    });

    expect(result.month).toBe("2026-01");
  });

  it("should handle missing settings", async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    });

    await expect(getBudgetStatus(mockSupabase, userId, {})).rejects.toThrow(
      "User settings not found"
    );
  });

  it("should handle database errors", async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      single: vi.fn().mockRejectedValue(new Error("Database error")),
    });

    await expect(getBudgetStatus(mockSupabase, userId, {})).rejects.toThrow(
      "Database error"
    );
  });
});
