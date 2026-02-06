import { describe, it, expect, vi, beforeEach } from "vitest";
import { processFunctionCalling } from "@/lib/agents-v2/function-caller";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Unit tests for OpenAI Function Calling (v2 architecture)
 *
 * Tests cover:
 * 1. General questions without tools
 * 2. Semantic mapping ("comida" → "survival")
 * 3. Temporal context ("este mes" → "current_month")
 * 4. Multiple tools in one query
 * 5. Error handling in tools
 * 6. Multi-turn conversation with context
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

const mockCreate = vi.mocked(openai.chat.completions.create);
const mockAnalyze = vi.mocked(analyzeSpendingPattern);
const mockBudget = vi.mocked(getBudgetStatus);
const mockAnomalies = vi.mocked(detectAnomalies);

// Mock Supabase client
const mockSupabase = {} as SupabaseClient;
const testUserId = "test-user-123";

describe("OpenAI Function Calling (v2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Test 1: General questions without tools", () => {
    it("should respond directly to general questions without calling tools", async () => {
      // Mock: GPT responds directly without tool calls
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: "assistant",
              content:
                "El método Kakebo es un sistema japonés de gestión de finanzas personales que te ayuda a ser consciente de tus gastos.",
            },
          },
        ],
        usage: {
          prompt_tokens: 150,
          completion_tokens: 45,
        },
      } as never);

      const result = await processFunctionCalling(
        "¿Qué es el método Kakebo?",
        [],
        mockSupabase,
        testUserId
      );

      // Should return direct response
      expect(result.message).toContain("Kakebo");
      expect(result.message).toContain("japonés");

      // Should NOT use any tools
      expect(result.toolsUsed).toHaveLength(0);

      // Should have metrics
      expect(result.metrics.inputTokens).toBe(150);
      expect(result.metrics.outputTokens).toBe(45);
      expect(result.metrics.toolCalls).toBe(0);
      expect(result.metrics.model).toBe("gpt-4o-mini");

      // Should only call OpenAI once (no tool execution)
      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(mockAnalyze).not.toHaveBeenCalled();
    });

    it("should respond to greetings without tools", async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: "assistant",
              content:
                "¡Hola! Soy tu asistente financiero Kakebo. ¿En qué puedo ayudarte con tus finanzas hoy?",
            },
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 30,
        },
      } as never);

      const result = await processFunctionCalling(
        "Hola",
        [],
        mockSupabase,
        testUserId
      );

      expect(result.message).toContain("Hola");
      expect(result.toolsUsed).toHaveLength(0);
      expect(result.metrics.toolCalls).toBe(0);
    });
  });

  describe("Test 2: Semantic mapping", () => {
    it('should map "comida" to "survival" category', async () => {
      // Mock: First call - GPT decides to use analyzeSpendingPattern tool
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
                      category: "survival", // Semantic mapping: "comida" → "survival"
                      period: "current_month",
                    }),
                  },
                },
              ],
            },
          },
        ],
        usage: {
          prompt_tokens: 200,
          completion_tokens: 50,
        },
      } as never);

      // Mock: Tool execution result
      mockAnalyze.mockResolvedValueOnce({
        totalSpent: 450.5,
        transactionCount: 15,
        averagePerTransaction: 30.03,
        dailyBreakdown: [],
        topMerchants: [
          { name: "Mercadona", total: 180.0, count: 5 },
          { name: "Carrefour", total: 150.0, count: 4 },
        ],
      });

      // Mock: Second call - GPT synthesizes response
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: "assistant",
              content:
                "Has gastado €450.50 en comida este mes en 15 transacciones. Tu gasto promedio por compra es de €30.03. Los supermercados donde más compras son Mercadona (€180) y Carrefour (€150).",
            },
          },
        ],
        usage: {
          prompt_tokens: 400,
          completion_tokens: 80,
        },
      } as never);

      const result = await processFunctionCalling(
        "¿Cuánto he gastado en comida este mes?",
        [],
        mockSupabase,
        testUserId
      );

      // Verify semantic mapping worked
      expect(mockAnalyze).toHaveBeenCalledWith(
        mockSupabase,
        testUserId,
        expect.objectContaining({
          category: "survival", // "comida" should map to "survival"
          period: "current_month",
        })
      );

      // Verify response
      expect(result.message).toContain("€450.50");
      expect(result.message).toContain("comida");
      expect(result.toolsUsed).toContain("analyzeSpendingPattern");
      expect(result.metrics.toolCalls).toBe(1);
      expect(result.metrics.inputTokens).toBe(600); // 200 + 400
      expect(result.metrics.outputTokens).toBe(130); // 50 + 80
    });

    it('should map "ocio" to "optional" category', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: "assistant",
              content: null,
              tool_calls: [
                {
                  id: "call_2",
                  type: "function" as const,
                  function: {
                    name: "analyzeSpendingPattern",
                    arguments: JSON.stringify({
                      category: "optional", // Semantic mapping: "ocio" → "optional"
                      period: "current_month",
                    }),
                  },
                },
              ],
            },
          },
        ],
        usage: {
          prompt_tokens: 180,
          completion_tokens: 45,
        },
      } as never);

      mockAnalyze.mockResolvedValueOnce({
        totalSpent: 120.0,
        transactionCount: 4,
        averagePerTransaction: 30.0,
        dailyBreakdown: [],
        topMerchants: [],
      });

      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: "assistant",
              content: "Has gastado €120 en ocio este mes.",
            },
          },
        ],
        usage: {
          prompt_tokens: 350,
          completion_tokens: 25,
        },
      } as never);

      const result = await processFunctionCalling(
        "Gastos de ocio este mes",
        [],
        mockSupabase,
        testUserId
      );

      expect(mockAnalyze).toHaveBeenCalledWith(
        mockSupabase,
        testUserId,
        expect.objectContaining({
          category: "optional", // "ocio" should map to "optional"
        })
      );
    });
  });

  describe("Test 3: Temporal context mapping", () => {
    it('should map "este mes" to "current_month"', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: "assistant",
              content: null,
              tool_calls: [
                {
                  id: "call_3",
                  type: "function" as const,
                  function: {
                    name: "analyzeSpendingPattern",
                    arguments: JSON.stringify({
                      category: "all",
                      period: "current_month", // "este mes" → "current_month"
                    }),
                  },
                },
              ],
            },
          },
        ],
        usage: {
          prompt_tokens: 180,
          completion_tokens: 40,
        },
      } as never);

      mockAnalyze.mockResolvedValueOnce({
        totalSpent: 800.0,
        transactionCount: 25,
        averagePerTransaction: 32.0,
        dailyBreakdown: [],
        topMerchants: [],
      });

      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: "assistant",
              content: "Este mes has gastado €800 en total.",
            },
          },
        ],
        usage: {
          prompt_tokens: 350,
          completion_tokens: 20,
        },
      } as never);

      await processFunctionCalling(
        "¿Cuánto he gastado este mes?",
        [],
        mockSupabase,
        testUserId
      );

      expect(mockAnalyze).toHaveBeenCalledWith(
        mockSupabase,
        testUserId,
        expect.objectContaining({
          period: "current_month",
        })
      );
    });

    it('should map "esta semana" to "current_week"', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: "assistant",
              content: null,
              tool_calls: [
                {
                  id: "call_4",
                  type: "function" as const,
                  function: {
                    name: "analyzeSpendingPattern",
                    arguments: JSON.stringify({
                      category: "optional",
                      period: "current_week", // "esta semana" → "current_week"
                    }),
                  },
                },
              ],
            },
          },
        ],
        usage: {
          prompt_tokens: 190,
          completion_tokens: 45,
        },
      } as never);

      mockAnalyze.mockResolvedValueOnce({
        totalSpent: 75.0,
        transactionCount: 3,
        averagePerTransaction: 25.0,
        dailyBreakdown: [],
        topMerchants: [],
      });

      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: "assistant",
              content: "Esta semana has gastado €75 en ocio.",
            },
          },
        ],
        usage: {
          prompt_tokens: 360,
          completion_tokens: 22,
        },
      } as never);

      await processFunctionCalling(
        "Gastos de ocio esta semana",
        [],
        mockSupabase,
        testUserId
      );

      expect(mockAnalyze).toHaveBeenCalledWith(
        mockSupabase,
        testUserId,
        expect.objectContaining({
          period: "current_week",
        })
      );
    });

    it('should map "el mes pasado" to "last_month"', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: "assistant",
              content: null,
              tool_calls: [
                {
                  id: "call_5",
                  type: "function" as const,
                  function: {
                    name: "analyzeSpendingPattern",
                    arguments: JSON.stringify({
                      category: "all",
                      period: "last_month", // "el mes pasado" → "last_month"
                    }),
                  },
                },
              ],
            },
          },
        ],
        usage: {
          prompt_tokens: 185,
          completion_tokens: 42,
        },
      } as never);

      mockAnalyze.mockResolvedValueOnce({
        totalSpent: 950.0,
        transactionCount: 30,
        averagePerTransaction: 31.67,
        dailyBreakdown: [],
        topMerchants: [],
      });

      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: "assistant",
              content: "El mes pasado gastaste €950 en total.",
            },
          },
        ],
        usage: {
          prompt_tokens: 355,
          completion_tokens: 23,
        },
      } as never);

      await processFunctionCalling(
        "¿Cuánto gasté el mes pasado?",
        [],
        mockSupabase,
        testUserId
      );

      expect(mockAnalyze).toHaveBeenCalledWith(
        mockSupabase,
        testUserId,
        expect.objectContaining({
          period: "last_month",
        })
      );
    });
  });

  describe("Test 4: Multiple tools in one query", () => {
    it("should execute multiple tools in parallel", async () => {
      // Mock: GPT calls BOTH getBudgetStatus AND detectAnomalies
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: "assistant",
              content: null,
              tool_calls: [
                {
                  id: "call_budget",
                  type: "function" as const,
                  function: {
                    name: "getBudgetStatus",
                    arguments: JSON.stringify({}),
                  },
                },
                {
                  id: "call_anomalies",
                  type: "function" as const,
                  function: {
                    name: "detectAnomalies",
                    arguments: JSON.stringify({
                      period: "current_month",
                    }),
                  },
                },
              ],
            },
          },
        ],
        usage: {
          prompt_tokens: 220,
          completion_tokens: 60,
        },
      } as never);

      // Mock: Budget tool result
      mockBudget.mockResolvedValueOnce({
        totalSpent: 750.0,
        budgetLimit: 1000.0,
        percentageUsed: 75.0,
        remaining: 250.0,
        status: "warning" as const,
        categoryBreakdown: [],
      });

      // Mock: Anomalies tool result
      mockAnomalies.mockResolvedValueOnce({
        anomalies: [
          {
            transactionId: "tx_1",
            amount: 250.0,
            description: "Compra inusual",
            category: "optional",
            date: "2026-02-05",
            zScore: 2.5,
            reason: "Gasto 2.5x superior al promedio",
          },
        ],
        totalAnomalies: 1,
        period: "current_month",
      });

      // Mock: GPT synthesizes combined response
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: "assistant",
              content:
                "Tu presupuesto va al 75% (€750 de €1000), quedando €250. ⚠️ Detecté un gasto inusual de €250, que es 2.5x superior al promedio habitual.",
            },
          },
        ],
        usage: {
          prompt_tokens: 500,
          completion_tokens: 90,
        },
      } as never);

      const result = await processFunctionCalling(
        "¿Cómo va mi presupuesto y hay gastos raros?",
        [],
        mockSupabase,
        testUserId
      );

      // Both tools should be called
      expect(mockBudget).toHaveBeenCalledTimes(1);
      expect(mockAnomalies).toHaveBeenCalledTimes(1);

      // Both tools should be in toolsUsed
      expect(result.toolsUsed).toContain("getBudgetStatus");
      expect(result.toolsUsed).toContain("detectAnomalies");
      expect(result.metrics.toolCalls).toBe(2);

      // Response should combine both results
      expect(result.message).toContain("75%");
      expect(result.message).toContain("€250");
    });
  });

  describe("Test 5: Error handling", () => {
    it("should handle tool execution errors gracefully", async () => {
      // Mock: GPT requests a tool
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: "assistant",
              content: null,
              tool_calls: [
                {
                  id: "call_error",
                  type: "function" as const,
                  function: {
                    name: "analyzeSpendingPattern",
                    arguments: JSON.stringify({
                      category: "survival",
                    }),
                  },
                },
              ],
            },
          },
        ],
        usage: {
          prompt_tokens: 200,
          completion_tokens: 45,
        },
      } as never);

      // Mock: Tool throws error
      mockAnalyze.mockRejectedValueOnce(new Error("Database connection failed"));

      // Mock: GPT handles the error in synthesis
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: "assistant",
              content:
                "Lo siento, hubo un problema al consultar tus datos de gastos. Por favor, inténtalo de nuevo.",
            },
          },
        ],
        usage: {
          prompt_tokens: 380,
          completion_tokens: 35,
        },
      } as never);

      const result = await processFunctionCalling(
        "¿Cuánto he gastado en comida?",
        [],
        mockSupabase,
        testUserId
      );

      // Should still return a response (error handling in executor)
      expect(result.message).toContain("problema");
      expect(result.toolsUsed).toContain("analyzeSpendingPattern");
      expect(mockCreate).toHaveBeenCalledTimes(2); // Still completes flow
    });

    it("should handle OpenAI API errors", async () => {
      // Mock: OpenAI API throws error
      mockCreate.mockRejectedValueOnce(
        new Error("OpenAI API rate limit exceeded")
      );

      const result = await processFunctionCalling(
        "Test message",
        [],
        mockSupabase,
        testUserId
      );

      // Should return error response
      expect(result.message).toContain("error");
      expect(result.toolsUsed).toHaveLength(0);
      expect(result.metrics.toolCalls).toBe(0);
    });

    it("should handle invalid tool arguments", async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: "assistant",
              content: null,
              tool_calls: [
                {
                  id: "call_invalid",
                  type: "function" as const,
                  function: {
                    name: "analyzeSpendingPattern",
                    arguments: "not valid JSON", // Invalid JSON
                  },
                },
              ],
            },
          },
        ],
        usage: {
          prompt_tokens: 200,
          completion_tokens: 40,
        },
      } as never);

      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: "assistant",
              content:
                "Lo siento, hubo un error al procesar tu solicitud.",
            },
          },
        ],
        usage: {
          prompt_tokens: 350,
          completion_tokens: 25,
        },
      } as never);

      const result = await processFunctionCalling(
        "Test",
        [],
        mockSupabase,
        testUserId
      );

      // Should handle JSON parse error gracefully
      expect(result.message).toContain("error");
      expect(mockCreate).toHaveBeenCalledTimes(2);
    });
  });

  describe("Test 6: Multi-turn conversation with context", () => {
    it("should maintain context across multiple turns", async () => {
      const conversationHistory = [
        {
          role: "user" as const,
          content: "¿Cuánto he gastado este mes?",
        },
        {
          role: "assistant" as const,
          content: "Has gastado €800 en total este mes.",
        },
      ];

      // Mock: GPT understands context "en comida" refers to previous month context
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: "assistant",
              content: null,
              tool_calls: [
                {
                  id: "call_context",
                  type: "function" as const,
                  function: {
                    name: "analyzeSpendingPattern",
                    arguments: JSON.stringify({
                      category: "survival", // "comida" with context
                      period: "current_month", // Maintains "este mes" from history
                    }),
                  },
                },
              ],
            },
          },
        ],
        usage: {
          prompt_tokens: 300, // Higher due to history
          completion_tokens: 50,
        },
      } as never);

      mockAnalyze.mockResolvedValueOnce({
        totalSpent: 400.0,
        transactionCount: 12,
        averagePerTransaction: 33.33,
        dailyBreakdown: [],
        topMerchants: [],
      });

      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: "assistant",
              content: "De esos €800, has gastado €400 en comida este mes.",
            },
          },
        ],
        usage: {
          prompt_tokens: 550,
          completion_tokens: 28,
        },
      } as never);

      const result = await processFunctionCalling(
        "¿Y en comida?", // Follow-up question with context
        conversationHistory,
        mockSupabase,
        testUserId
      );

      // Should use context to understand the query
      expect(mockAnalyze).toHaveBeenCalledWith(
        mockSupabase,
        testUserId,
        expect.objectContaining({
          category: "survival",
          period: "current_month",
        })
      );

      expect(result.message).toContain("€400");
      expect(result.message).toContain("comida");

      // First OpenAI call should include conversation history
      expect(mockCreate).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ role: "system" }),
            expect.objectContaining({
              role: "user",
              content: "¿Cuánto he gastado este mes?",
            }),
            expect.objectContaining({
              role: "assistant",
              content: "Has gastado €800 en total este mes.",
            }),
            expect.objectContaining({ role: "user", content: "¿Y en comida?" }),
          ]),
        })
      );
    });

    it("should handle complex multi-turn context", async () => {
      const conversationHistory = [
        {
          role: "user" as const,
          content: "Muéstrame mis gastos de supervivencia",
        },
        {
          role: "assistant" as const,
          content: "Tus gastos de supervivencia este mes son €500.",
        },
        {
          role: "user" as const,
          content: "¿Y los de ocio?",
        },
        {
          role: "assistant" as const,
          content: "Los gastos de ocio suman €150 este mes.",
        },
      ];

      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: "assistant",
              content: null,
              tool_calls: [
                {
                  id: "call_compare",
                  type: "function" as const,
                  function: {
                    name: "analyzeSpendingPattern",
                    arguments: JSON.stringify({
                      category: "all",
                      period: "last_month", // Understands "mes pasado" vs current context
                    }),
                  },
                },
              ],
            },
          },
        ],
        usage: {
          prompt_tokens: 400,
          completion_tokens: 48,
        },
      } as never);

      mockAnalyze.mockResolvedValueOnce({
        totalSpent: 700.0,
        transactionCount: 28,
        averagePerTransaction: 25.0,
        dailyBreakdown: [],
        topMerchants: [],
      });

      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: "assistant",
              content:
                "El mes pasado gastaste €700 en total, comparado con €650 este mes.",
            },
          },
        ],
        usage: {
          prompt_tokens: 650,
          completion_tokens: 32,
        },
      } as never);

      const result = await processFunctionCalling(
        "¿Y el mes pasado cuánto gasté en total?",
        conversationHistory,
        mockSupabase,
        testUserId
      );

      expect(result.message).toContain("€700");

      // Verify conversation history was passed
      expect(mockCreate).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: "Muéstrame mis gastos de supervivencia",
            }),
            expect.objectContaining({
              content: "Tus gastos de supervivencia este mes son €500.",
            }),
          ]),
        })
      );
    });
  });

  describe("Performance and optimization tests", () => {
    it("should complete in reasonable time (< 3s simulation)", async () => {
      const startTime = Date.now();

      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: "assistant",
              content: "Test response",
            },
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 20,
        },
      } as never);

      const result = await processFunctionCalling(
        "Test",
        [],
        mockSupabase,
        testUserId
      );

      const elapsed = Date.now() - startTime;

      // Should complete quickly (mocked, so should be < 100ms)
      expect(elapsed).toBeLessThan(100);
      expect(result.metrics.latencyMs).toBeDefined();
    });

    it("should include accurate token and cost metrics", async () => {
      mockCreate
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                role: "assistant",
                content: null,
                tool_calls: [
                  {
                    id: "call_metrics",
                    type: "function" as const,
                    function: {
                      name: "analyzeSpendingPattern",
                      arguments: JSON.stringify({ category: "all" }),
                    },
                  },
                ],
              },
            },
          ],
          usage: {
            prompt_tokens: 250,
            completion_tokens: 55,
          },
        } as never)
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                role: "assistant",
                content: "Final response",
              },
            },
          ],
          usage: {
            prompt_tokens: 450,
            completion_tokens: 75,
          },
        } as never);

      mockAnalyze.mockResolvedValueOnce({
        totalSpent: 500.0,
        transactionCount: 10,
        averagePerTransaction: 50.0,
        dailyBreakdown: [],
        topMerchants: [],
      });

      const result = await processFunctionCalling(
        "Test metrics",
        [],
        mockSupabase,
        testUserId
      );

      // Metrics should sum both LLM calls
      expect(result.metrics.inputTokens).toBe(700); // 250 + 450
      expect(result.metrics.outputTokens).toBe(130); // 55 + 75
      expect(result.metrics.totalTokens).toBe(830);
      expect(result.metrics.costUsd).toBeDefined();
      expect(result.metrics.toolCalls).toBe(1);
    });
  });
});
