import { describe, it, expect, vi, beforeEach } from "vitest";
import { analyzeSpendingPattern } from "@/lib/agents/tools/spending-analysis";

describe("analyzeSpendingPattern", () => {
  let mockSupabase: any;
  const userId = "test-user-123";

  beforeEach(() => {
    const chainedMock = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    };

    mockSupabase = chainedMock;
  });

  it("should analyze spending for current month", async () => {
    const mockExpenses = [
      { note: "Mercadona", amount: 50, date: "2026-02-01" },
      { note: "Carrefour", amount: 30, date: "2026-02-05" },
      { note: "Gasolinera", amount: 45, date: "2026-02-10" },
    ];

    mockSupabase.order.mockResolvedValue({
      data: mockExpenses,
      error: null,
    });

    const result = await analyzeSpendingPattern(mockSupabase, userId, {
      category: "survival",
      period: "current_month",
    });

    expect(result.category).toBe("survival");
    expect(result.totalAmount).toBe(125);
    expect(result.topExpenses).toHaveLength(3);
    expect(result.insights).toBeInstanceOf(Array);
  });

  it("should identify increasing trend", async () => {
    const mockExpenses = [
      { note: "Day 1", amount: 10, date: "2026-02-01" },
      { note: "Day 2", amount: 20, date: "2026-02-02" },
      { note: "Day 3", amount: 30, date: "2026-02-03" },
      { note: "Day 4", amount: 40, date: "2026-02-04" },
    ];

    mockSupabase.order.mockResolvedValue({
      data: mockExpenses,
      error: null,
    });

    const result = await analyzeSpendingPattern(mockSupabase, userId, {
      period: "current_month",
    });

    expect(result.trend).toBe("increasing");
    expect(result.trendPercentage).toBeGreaterThan(0);
  });

  it("should identify decreasing trend", async () => {
    const mockExpenses = [
      { note: "Day 1", amount: 40, date: "2026-02-01" },
      { note: "Day 2", amount: 30, date: "2026-02-02" },
      { note: "Day 3", amount: 20, date: "2026-02-03" },
      { note: "Day 4", amount: 10, date: "2026-02-04" },
    ];

    mockSupabase.order.mockResolvedValue({
      data: mockExpenses,
      error: null,
    });

    const result = await analyzeSpendingPattern(mockSupabase, userId, {
      period: "current_month",
    });

    expect(result.trend).toBe("decreasing");
    expect(result.trendPercentage).toBeGreaterThan(0);
  });

  it("should handle category filter", async () => {
    const mockExpenses = [
      { note: "Netflix", amount: 15.99, date: "2026-02-01" },
      { note: "Spotify", amount: 9.99, date: "2026-02-01" },
    ];

    mockSupabase.order.mockResolvedValue({
      data: mockExpenses,
      error: null,
    });

    const result = await analyzeSpendingPattern(mockSupabase, userId, {
      category: "culture",
      period: "current_month",
    });

    expect(result.category).toBe("culture");
    expect(result.totalAmount).toBeCloseTo(25.98, 2);
  });

  it("should generate relevant insights", async () => {
    const mockExpenses = [
      { note: "Large expense", amount: 200, date: "2026-02-01" },
      { note: "Small 1", amount: 10, date: "2026-02-02" },
      { note: "Small 2", amount: 10, date: "2026-02-03" },
      { note: "Small 3", amount: 10, date: "2026-02-04" },
    ];

    mockSupabase.order.mockResolvedValue({
      data: mockExpenses,
      error: null,
    });

    const result = await analyzeSpendingPattern(mockSupabase, userId, {
      period: "current_month",
    });

    expect(result.insights.length).toBeGreaterThan(0);
    // Should mention the large expense
    const hasLargeExpenseInsight = result.insights.some((insight) =>
      insight.includes("Large expense")
    );
    expect(hasLargeExpenseInsight).toBe(true);
  });

  it("should handle empty expenses", async () => {
    mockSupabase.order.mockResolvedValue({
      data: [],
      error: null,
    });

    const result = await analyzeSpendingPattern(mockSupabase, userId, {
      period: "current_month",
    });

    expect(result.totalAmount).toBe(0);
    expect(result.topExpenses).toHaveLength(0);
    expect(result.insights).toContain(
      "No hay gastos registrados en este período"
    );
  });

  it("should handle database errors", async () => {
    mockSupabase.order.mockRejectedValue(new Error("Database error"));

    await expect(
      analyzeSpendingPattern(mockSupabase, userId, {
        period: "current_month",
      })
    ).rejects.toThrow("Database error");
  });
});
