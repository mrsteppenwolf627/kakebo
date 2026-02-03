import { describe, it, expect, vi, beforeEach } from "vitest";
import { detectAnomalies } from "@/lib/agents/tools/anomalies";
import { predictMonthlySpending } from "@/lib/agents/tools/predictions";
import { getSpendingTrends } from "@/lib/agents/tools/trends";

describe("Day 2 Tools", () => {
  let mockSupabase: any;
  const userId = "test-user-123";

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      like: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    };
  });

  describe("detectAnomalies", () => {
    it("should detect unusually high amounts", async () => {
      // Historical: average 30€
      const historicalExpenses = Array(10)
        .fill(null)
        .map((_, i) => ({
          category: "survival",
          amount: 30 + i,
        }));

      // Current: one expense of 200€ (anomaly)
      const currentExpenses = [
        {
          id: "1",
          note: "Expensive item",
          amount: 200,
          category: "survival",
          date: "2026-02-01",
        },
        {
          id: "2",
          note: "Normal item",
          amount: 30,
          category: "survival",
          date: "2026-02-02",
        },
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        const chainMock = {
          from: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockReturnThis(),
          lt: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
        };

        if (table === "expenses") {
          // First call is for historical
          if (!mockSupabase.from.mock.calls.length || mockSupabase.from.mock.calls.length === 1) {
            chainMock.lt.mockResolvedValue({
              data: historicalExpenses,
              error: null,
            });
          } else {
            // Second call is for current
            chainMock.order.mockResolvedValue({
              data: currentExpenses,
              error: null,
            });
          }
        }

        return chainMock;
      });

      const result = await detectAnomalies(mockSupabase, userId, {
        period: "current_month",
        sensitivity: "medium",
      });

      expect(result.anomalies.length).toBeGreaterThan(0);
      const highAmountAnomaly = result.anomalies.find(
        (a) => a.reason === "unusually_high_amount"
      );
      expect(highAmountAnomaly).toBeDefined();
      expect(highAmountAnomaly?.severity).toBe("high");
    });

    it("should handle no anomalies", async () => {
      // Need at least 6 historical expenses to not be considered "rare"
      const historicalExpenses = Array(10)
        .fill(null)
        .map(() => ({
          category: "survival",
          amount: 30,
        }));

      const normalCurrentExpenses = [
        {
          id: "1",
          note: "Normal expense",
          amount: 30,
          category: "survival",
          date: "2026-02-01",
        },
        {
          id: "2",
          note: "Normal expense",
          amount: 32,
          category: "survival",
          date: "2026-02-02",
        },
      ];

      mockSupabase.from.mockImplementation(() => {
        const chainMock = {
          from: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lte: vi.fn().mockReturnThis(),
          lt: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
        };

        chainMock.lt.mockResolvedValue({
          data: historicalExpenses,
          error: null,
        });
        chainMock.order.mockResolvedValue({
          data: normalCurrentExpenses,
          error: null,
        });

        return chainMock;
      });

      const result = await detectAnomalies(mockSupabase, userId, {});

      expect(result.anomalies.length).toBe(0);
      expect(result.summary).toContain("No se detectaron anomalías");
    });
  });

  describe("predictMonthlySpending", () => {
    it("should predict spending for current month", async () => {
      const mockSettings = {
        user_id: userId,
        budget_survival: 500,
        budget_optional: 200,
        budget_culture: 100,
        budget_extra: 50,
      };

      // Simulate spending 10€/day in survival for 10 days
      const mockExpenses = Array(10)
        .fill(null)
        .map((_, i) => ({
          category: "survival",
          amount: 10,
          date: `2026-02-${String(i + 1).padStart(2, "0")}`,
        }));

      mockSupabase.from.mockImplementation((table: string) => {
        const chainMock = {
          from: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          like: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          single: vi.fn().mockReturnThis(),
        };

        if (table === "user_settings") {
          chainMock.single.mockResolvedValue({
            data: mockSettings,
            error: null,
          });
        } else if (table === "expenses") {
          chainMock.order.mockResolvedValue({
            data: mockExpenses,
            error: null,
          });
        }

        return chainMock;
      });

      const result = await predictMonthlySpending(mockSupabase, userId, {});

      expect(result.spentSoFar).toBe(100); // 10 days * 10€
      expect(result.projectedTotal).toBeGreaterThan(100); // Should project more
      expect(result.byCategory.length).toBe(4); // All 4 categories
      expect(result.confidence).toBeDefined();
    });

    it("should have low confidence with few days", async () => {
      const mockSettings = {
        user_id: userId,
        budget_survival: 500,
        budget_optional: 200,
        budget_culture: 100,
        budget_extra: 50,
      };

      const mockExpenses = [
        { category: "survival", amount: 50, date: "2026-02-01" },
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        const chainMock = {
          from: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          like: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          single: vi.fn().mockReturnThis(),
        };

        if (table === "user_settings") {
          chainMock.single.mockResolvedValue({
            data: mockSettings,
            error: null,
          });
        } else if (table === "expenses") {
          chainMock.order.mockResolvedValue({
            data: mockExpenses,
            error: null,
          });
        }

        return chainMock;
      });

      const result = await predictMonthlySpending(mockSupabase, userId, {});

      expect(result.confidence).toBe("low");
    });
  });

  describe("getSpendingTrends", () => {
    it("should calculate trends by month", async () => {
      const mockExpenses = [
        {
          amount: 100,
          date: "2025-11-15",
          category: "survival",
        },
        {
          amount: 150,
          date: "2025-12-15",
          category: "survival",
        },
        {
          amount: 200,
          date: "2026-01-15",
          category: "survival",
        },
      ];

      mockSupabase.order.mockResolvedValue({
        data: mockExpenses,
        error: null,
      });

      const result = await getSpendingTrends(mockSupabase, userId, {
        period: "last_3_months",
        groupBy: "month",
      });

      expect(result.dataPoints.length).toBe(3);
      expect(result.trend).toBe("increasing");
      expect(result.average).toBeGreaterThan(0);
      expect(result.peak.amount).toBe(200);
      expect(result.low.amount).toBe(100);
    });

    it("should identify decreasing trend", async () => {
      const mockExpenses = [
        { amount: 200, date: "2025-11-15", category: "survival" },
        { amount: 150, date: "2025-12-15", category: "survival" },
        { amount: 100, date: "2026-01-15", category: "survival" },
      ];

      mockSupabase.order.mockResolvedValue({
        data: mockExpenses,
        error: null,
      });

      const result = await getSpendingTrends(mockSupabase, userId, {
        period: "last_3_months",
        groupBy: "month",
      });

      expect(result.trend).toBe("decreasing");
    });

    it("should handle empty data", async () => {
      mockSupabase.order.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await getSpendingTrends(mockSupabase, userId, {
        period: "last_3_months",
        groupBy: "month",
      });

      expect(result.dataPoints.length).toBe(0);
      expect(result.trend).toBe("stable");
      expect(result.average).toBe(0);
    });
  });
});
