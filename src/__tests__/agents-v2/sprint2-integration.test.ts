import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  analyzeUserContext,
  generateContextDisclaimer,
  isToolAppropriateForUser,
  getUserContextCached,
  clearAllContextCache,
} from "@/lib/agents-v2/context-analyzer";
import { processFunctionCalling } from "@/lib/agents-v2/function-caller";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Integration tests for Sprint 2 changes:
 * 4. User Context Analyzer
 * 5. Tool Calling Limits
 */

// Mock OpenAI client
vi.mock("@/lib/ai/client", () => ({
  openai: {
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  },
  DEFAULT_MODEL: "gpt-4o-mini",
  calculateCost: vi.fn(() => 0.0002),
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  apiLogger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock tool implementations
vi.mock("@/lib/agents/tools/spending-analysis", () => ({
  analyzeSpendingPattern: vi.fn(),
}));

vi.mock("@/lib/agents/tools/budget-status", () => ({
  getBudgetStatus: vi.fn(),
}));

vi.mock("@/lib/agents/tools/anomalies", () => ({
  detectAnomalies: vi.fn(),
}));

vi.mock("@/lib/agents/tools/predictions", () => ({
  predictMonthlySpending: vi.fn(),
}));

vi.mock("@/lib/agents/tools/trends", () => ({
  getSpendingTrends: vi.fn(),
}));

// Get mock references
import { openai } from "@/lib/ai/client";
import { analyzeSpendingPattern } from "@/lib/agents/tools/spending-analysis";
import { getBudgetStatus } from "@/lib/agents/tools/budget-status";
import { detectAnomalies } from "@/lib/agents/tools/anomalies";
import { predictMonthlySpending } from "@/lib/agents/tools/predictions";
import { getSpendingTrends } from "@/lib/agents/tools/trends";

const mockCreate = vi.mocked(openai.chat.completions.create);
const mockAnalyze = vi.mocked(analyzeSpendingPattern);
const mockBudget = vi.mocked(getBudgetStatus);
const mockAnomalies = vi.mocked(detectAnomalies);
const mockPredict = vi.mocked(predictMonthlySpending);
const mockTrends = vi.mocked(getSpendingTrends);

// Mock Supabase client
const createMockSupabase = (expenses: any[] = []) => {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: expenses,
            error: null,
          }),
        }),
      }),
    }),
  } as unknown as SupabaseClient;
};

const testUserId = "test-user-123";

describe("Sprint 2 - Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAllContextCache();
  });

  describe("4. User Context Analyzer", () => {
    describe("Context Analysis", () => {
      it("should detect brand new user (0 expenses)", async () => {
        const mockSupabase = createMockSupabase([]);

        const context = await analyzeUserContext(mockSupabase, testUserId);

        expect(context.isNewUser).toBe(true);
        expect(context.daysSinceFirstExpense).toBe(0);
        expect(context.totalTransactions).toBe(0);
        expect(context.dataQuality).toBe("poor");
        expect(context.recommendedActions).toContain(
          "Start by registering your daily expenses"
        );
      });

      it("should detect new user (< 30 days, few transactions)", async () => {
        const recentDate = new Date();
        recentDate.setDate(recentDate.getDate() - 15); // 15 days ago

        const expenses = Array.from({ length: 5 }, (_, i) => ({
          date: new Date(recentDate.getTime() + i * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          category: "supervivencia",
        }));

        const mockSupabase = createMockSupabase(expenses);

        const context = await analyzeUserContext(mockSupabase, testUserId);

        expect(context.isNewUser).toBe(true);
        expect(context.daysSinceFirstExpense).toBeLessThan(30);
        expect(context.totalTransactions).toBe(5);
        expect(context.dataQuality).toBe("poor");
      });

      it("should detect user with fair data quality (30+ days, 20+ transactions)", async () => {
        const oldDate = new Date();
        oldDate.setDate(oldDate.getDate() - 35); // 35 days ago

        const expenses = Array.from({ length: 25 }, (_, i) => ({
          date: new Date(oldDate.getTime() + i * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          category: i % 2 === 0 ? "supervivencia" : "opcional",
        }));

        const mockSupabase = createMockSupabase(expenses);

        const context = await analyzeUserContext(mockSupabase, testUserId);

        expect(context.isNewUser).toBe(false);
        expect(context.hasLimitedHistory).toBe(true);
        expect(context.daysSinceFirstExpense).toBeGreaterThanOrEqual(30);
        expect(context.totalTransactions).toBe(25);
        expect(context.dataQuality).toBe("fair");
      });

      it("should detect excellent data quality (90+ days, 100+ transactions)", async () => {
        const oldDate = new Date();
        oldDate.setDate(oldDate.getDate() - 120); // 4 months ago

        const expenses = Array.from({ length: 150 }, (_, i) => ({
          date: new Date(oldDate.getTime() + i * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          category: ["supervivencia", "opcional", "cultura", "extra"][i % 4],
        }));

        const mockSupabase = createMockSupabase(expenses);

        const context = await analyzeUserContext(mockSupabase, testUserId);

        expect(context.isNewUser).toBe(false);
        expect(context.hasLimitedHistory).toBe(false);
        expect(context.daysSinceFirstExpense).toBeGreaterThanOrEqual(90);
        expect(context.totalTransactions).toBe(150);
        expect(context.dataQuality).toBe("excellent");
      });
    });

    describe("Context Disclaimers", () => {
      it("should generate strong warning for new users", async () => {
        const mockSupabase = createMockSupabase([
          {
            date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
            category: "supervivencia",
          },
        ]);

        const context = await analyzeUserContext(mockSupabase, testUserId);
        const disclaimer = generateContextDisclaimer(context);

        expect(disclaimer).toContain("IMPORTANTE - USUARIO NUEVO");
        expect(disclaimer).toContain("MUY POCO HISTÓRICO");
        expect(disclaimer).toContain("NO hagas comparaciones");
        expect(disclaimer).toContain("NO detectes \"anomalías\"");
      });

      it("should generate moderate warning for limited history", async () => {
        const oldDate = new Date();
        oldDate.setDate(oldDate.getDate() - 45);

        const expenses = Array.from({ length: 30 }, (_, i) => ({
          date: new Date(oldDate.getTime() + i * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          category: "supervivencia",
        }));

        const mockSupabase = createMockSupabase(expenses);

        const context = await analyzeUserContext(mockSupabase, testUserId);
        const disclaimer = generateContextDisclaimer(context);

        expect(disclaimer).toContain("HISTÓRICO LIMITADO");
        expect(disclaimer).toContain("PRECAUCIONES");
        expect(disclaimer).not.toContain("MUY POCO");
      });

      it("should generate simple context for established users", async () => {
        const oldDate = new Date();
        oldDate.setDate(oldDate.getDate() - 150);

        const expenses = Array.from({ length: 200 }, (_, i) => ({
          date: new Date(oldDate.getTime() + i * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          category: "supervivencia",
        }));

        const mockSupabase = createMockSupabase(expenses);

        const context = await analyzeUserContext(mockSupabase, testUserId);
        const disclaimer = generateContextDisclaimer(context);

        expect(disclaimer).toContain("CONTEXTO:");
        expect(disclaimer).toContain("excellent");
        expect(disclaimer).toContain("Histórico suficiente");
      });
    });

    describe("Tool Appropriateness", () => {
      it("should block anomaly detection for users < 30 days", async () => {
        const mockSupabase = createMockSupabase([
          {
            date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
            category: "supervivencia",
          },
        ]);

        const context = await analyzeUserContext(mockSupabase, testUserId);
        const result = isToolAppropriateForUser("detectAnomalies", context);

        expect(result.appropriate).toBe(false);
        expect(result.reason).toContain("30 days of historical data");
      });

      it("should block trend analysis for users < 60 days", async () => {
        const mockSupabase = createMockSupabase([
          {
            date: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
            category: "supervivencia",
          },
        ]);

        const context = await analyzeUserContext(mockSupabase, testUserId);
        const result = isToolAppropriateForUser("getSpendingTrends", context);

        expect(result.appropriate).toBe(false);
        expect(result.reason).toContain("60 days of data");
      });

      it("should allow basic tools for any user", async () => {
        const mockSupabase = createMockSupabase([]);

        const context = await analyzeUserContext(mockSupabase, testUserId);

        expect(
          isToolAppropriateForUser("analyzeSpendingPattern", context)
            .appropriate
        ).toBe(true);
        expect(
          isToolAppropriateForUser("getBudgetStatus", context).appropriate
        ).toBe(true);
      });
    });

    describe("Caching", () => {
      it("should cache user context", async () => {
        const expenses = [
          {
            date: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
            category: "supervivencia",
          },
        ];

        const mockSupabase = createMockSupabase(expenses);

        // First call - should hit database
        await getUserContextCached(mockSupabase, testUserId);

        // Second call - should use cache
        await getUserContextCached(mockSupabase, testUserId);

        // Verify database was only queried once
        expect(mockSupabase.from).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("5. Tool Calling Limits", () => {
    describe("Max Tools Limit", () => {
      it("should limit to 3 tools when GPT requests more", async () => {
        mockCreate.mockResolvedValueOnce({
          choices: [
            {
              message: {
                role: "assistant",
                content: null,
                tool_calls: [
                  {
                    id: "call_1",
                    type: "function" as const,
                    function: {
                      name: "analyzeSpendingPattern",
                      arguments: JSON.stringify({}),
                    },
                  },
                  {
                    id: "call_2",
                    type: "function" as const,
                    function: {
                      name: "getBudgetStatus",
                      arguments: JSON.stringify({}),
                    },
                  },
                  {
                    id: "call_3",
                    type: "function" as const,
                    function: {
                      name: "detectAnomalies",
                      arguments: JSON.stringify({}),
                    },
                  },
                  {
                    id: "call_4",
                    type: "function" as const,
                    function: {
                      name: "predictMonthlySpending",
                      arguments: JSON.stringify({}),
                    },
                  },
                  // 4 tools requested, but max is 3
                ],
              },
            },
          ],
          usage: { prompt_tokens: 250, completion_tokens: 80 },
        } as never);

        // Mock tools
        const mockExpenses = [
          {
            date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
            category: "supervivencia",
          },
        ];
        const mockSupabase = createMockSupabase(mockExpenses);

        mockAnalyze.mockResolvedValueOnce({
          totalAmount: 500,
          transactionCount: 20,
          averagePerPeriod: 25,
          trend: "stable",
          trendPercentage: 0,
          topExpenses: [],
          insights: [],
          category: "all",
          period: "current_month",
        });

        mockBudget.mockResolvedValueOnce({
          totalBudget: 1000,
          totalSpent: 500,
          totalRemaining: 500,
          overallStatus: "safe",
          categories: [],
          month: "2026-02",
        });

        mockAnomalies.mockResolvedValueOnce({
          anomalies: [],
          summary: "No anomalies",
        });

        mockCreate.mockResolvedValueOnce({
          choices: [
            {
              message: {
                role: "assistant",
                content: "Analysis complete",
              },
            },
          ],
          usage: { prompt_tokens: 500, completion_tokens: 50 },
        } as never);

        const result = await processFunctionCalling(
          "Analiza todo",
          [],
          mockSupabase,
          testUserId
        );

        // Should only execute first 3 tools
        expect(result.toolsUsed.length).toBeLessThanOrEqual(3);
        expect(mockAnalyze).toHaveBeenCalled();
        expect(mockBudget).toHaveBeenCalled();
        expect(mockAnomalies).toHaveBeenCalled();
        // 4th tool should NOT be called
        expect(mockPredict).not.toHaveBeenCalled();
      });
    });

    describe("Forbidden Combinations", () => {
      it("should remove redundant tool from forbidden combination", async () => {
        mockCreate.mockResolvedValueOnce({
          choices: [
            {
              message: {
                role: "assistant",
                content: null,
                tool_calls: [
                  {
                    id: "call_predict",
                    type: "function" as const,
                    function: {
                      name: "predictMonthlySpending",
                      arguments: JSON.stringify({}),
                    },
                  },
                  {
                    id: "call_trends",
                    type: "function" as const,
                    function: {
                      name: "getSpendingTrends",
                      arguments: JSON.stringify({
                        period: "last_3_months",
                        groupBy: "month",
                      }),
                    },
                  },
                  // These two are forbidden together (redundant)
                ],
              },
            },
          ],
          usage: { prompt_tokens: 250, completion_tokens: 60 },
        } as never);

        const mockExpenses = [
          {
            date: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
            category: "supervivencia",
          },
        ];
        const mockSupabase = createMockSupabase(mockExpenses);

        mockPredict.mockResolvedValueOnce({
          predictedTotal: 1200,
          confidence: "medium",
          daysAnalyzed: 15,
        });

        mockCreate.mockResolvedValueOnce({
          choices: [
            {
              message: {
                role: "assistant",
                content: "Prediction complete",
              },
            },
          ],
          usage: { prompt_tokens: 400, completion_tokens: 40 },
        } as never);

        const result = await processFunctionCalling(
          "¿Cuánto voy a gastar y cuál es la tendencia?",
          [],
          mockSupabase,
          testUserId
        );

        // Should only call predictMonthlySpending (first one)
        expect(result.toolsUsed).toContain("predictMonthlySpending");
        expect(result.toolsUsed).not.toContain("getSpendingTrends");
        expect(mockPredict).toHaveBeenCalled();
        expect(mockTrends).not.toHaveBeenCalled();
      });
    });
  });

  describe("Integration: Context + Tool Limits", () => {
    it("should inject context disclaimer into system prompt", async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: "assistant",
              content: "Direct response",
            },
          },
        ],
        usage: { prompt_tokens: 200, completion_tokens: 30 },
      } as never);

      const mockExpenses = [
        {
          date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          category: "supervivencia",
        },
      ];
      const mockSupabase = createMockSupabase(mockExpenses);

      await processFunctionCalling(
        "Test message",
        [],
        mockSupabase,
        testUserId
      );

      // Verify OpenAI was called with context in system messages
      const callArgs = mockCreate.mock.calls[0][0];
      const messages = callArgs.messages as any[];

      // Should have 2 system messages: base prompt + context disclaimer
      const systemMessages = messages.filter((m) => m.role === "system");
      expect(systemMessages.length).toBeGreaterThanOrEqual(2);

      // Second system message should contain context
      const contextMessage = systemMessages[1];
      expect(contextMessage.content).toMatch(
        /IMPORTANTE|CONTEXTO|HISTÓRICO LIMITADO/
      );
    });

    it("should work end-to-end: context analysis + tool validation + execution", async () => {
      // Setup: User with 50 days of data (fair quality)
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 50);

      const expenses = Array.from({ length: 40 }, (_, i) => ({
        date: new Date(oldDate.getTime() + i * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        category: "supervivencia",
      }));

      const mockSupabase = createMockSupabase(expenses);

      // GPT requests 2 tools (within limit)
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: "assistant",
              content: null,
              tool_calls: [
                {
                  id: "call_1",
                  type: "function" as const,
                  function: {
                    name: "analyzeSpendingPattern",
                    arguments: JSON.stringify({
                      category: "survival",
                      period: "current_month",
                    }),
                  },
                },
                {
                  id: "call_2",
                  type: "function" as const,
                  function: {
                    name: "getBudgetStatus",
                    arguments: JSON.stringify({}),
                  },
                },
              ],
            },
          },
        ],
        usage: { prompt_tokens: 300, completion_tokens: 60 },
      } as never);

      mockAnalyze.mockResolvedValueOnce({
        totalAmount: 450,
        transactionCount: 15,
        averagePerPeriod: 30,
        trend: "stable",
        trendPercentage: 0,
        topExpenses: [],
        insights: [],
        category: "survival",
        period: "current_month",
      });

      mockBudget.mockResolvedValueOnce({
        totalBudget: 1000,
        totalSpent: 450,
        totalRemaining: 550,
        overallStatus: "safe",
        categories: [],
        month: "2026-02",
      });

      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: "assistant",
              content:
                "Has gastado €450 en supervivencia este mes (basado en 15 transacciones). Tu presupuesto va bien, has usado el 45% de tu límite.",
            },
          },
        ],
        usage: { prompt_tokens: 600, completion_tokens: 80 },
      } as never);

      const result = await processFunctionCalling(
        "¿Cuánto he gastado en comida y cómo va mi presupuesto?",
        [],
        mockSupabase,
        testUserId
      );

      // Verify successful execution
      expect(result.message).toContain("€450");
      expect(result.toolsUsed).toContain("analyzeSpendingPattern");
      expect(result.toolsUsed).toContain("getBudgetStatus");
      expect(result.toolsUsed.length).toBe(2);
    });
  });
});
