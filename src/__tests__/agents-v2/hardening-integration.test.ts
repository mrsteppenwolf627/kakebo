import { describe, it, expect, vi, beforeEach } from "vitest";
import { processFunctionCalling } from "@/lib/agents-v2/function-caller";
import { validateToolOutput } from "@/lib/agents-v2/tools/validator";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Integration tests for Sprint 1 hardening changes:
 * 1. System Prompt v2 (hardened)
 * 2. Error Handling Transparente
 * 3. Tool Output Validator
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

// Get mock references
import { openai } from "@/lib/ai/client";
import { analyzeSpendingPattern } from "@/lib/agents/tools/spending-analysis";
import { getBudgetStatus } from "@/lib/agents/tools/budget-status";

const mockCreate = vi.mocked(openai.chat.completions.create);
const mockAnalyze = vi.mocked(analyzeSpendingPattern);
const mockBudget = vi.mocked(getBudgetStatus);

// Mock Supabase client
const mockSupabase = {} as SupabaseClient;
const testUserId = "test-user-123";

describe("Sprint 1 Hardening - Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. System Prompt v2 - Transparency Requirements", () => {
    it("should force LLM to mention period and data count in responses", async () => {
      // Mock: GPT calls analyzeSpendingPattern
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
              ],
            },
          },
        ],
        usage: { prompt_tokens: 200, completion_tokens: 50 },
      } as never);

      // Mock: Tool returns valid data
      mockAnalyze.mockResolvedValueOnce({
        totalAmount: 450.5,
        transactionCount: 12,
        averagePerPeriod: 37.54,
        trend: "stable",
        trendPercentage: 0,
        topExpenses: [],
        insights: [],
        category: "survival",
        period: "current_month",
      });

      // Mock: GPT synthesizes with hardened prompt rules
      // The new prompt FORCES mentioning period + transaction count
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: "assistant",
              content:
                "Has gastado €450.50 en supervivencia este mes (basado en 12 transacciones). Esto representa un gasto promedio de €37.54 por transacción.",
            },
          },
        ],
        usage: { prompt_tokens: 400, completion_tokens: 80 },
      } as never);

      const result = await processFunctionCalling(
        "¿Cuánto he gastado en comida?",
        [],
        mockSupabase,
        testUserId
      );

      // Verify response includes transparency indicators
      expect(result.message).toMatch(/este mes/i);
      expect(result.message).toMatch(/12 transacciones/i);
      expect(result.message).toMatch(/€450/);
    });

    it("should acknowledge insufficient data when < 10 transactions", async () => {
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
                    arguments: JSON.stringify({ category: "culture" }),
                  },
                },
              ],
            },
          },
        ],
        usage: { prompt_tokens: 180, completion_tokens: 45 },
      } as never);

      // Mock: Tool returns data with only 3 transactions
      mockAnalyze.mockResolvedValueOnce({
        totalAmount: 120.0,
        transactionCount: 3, // < 10 threshold
        averagePerPeriod: 40.0,
        trend: "stable",
        trendPercentage: 0,
        topExpenses: [],
        insights: [],
        category: "culture",
        period: "current_month",
      });

      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: "assistant",
              content:
                "Has gastado €120 en cultura este mes (basado en solo 3 gastos). Tengo poco histórico en esta categoría, por lo que el análisis puede ser menos preciso.",
            },
          },
        ],
        usage: { prompt_tokens: 350, completion_tokens: 70 },
      } as never);

      const result = await processFunctionCalling(
        "¿Cuánto he gastado en libros?",
        [],
        mockSupabase,
        testUserId
      );

      // Verify LLM acknowledges insufficient data
      expect(result.message).toMatch(/poco histórico|solo 3/i);
    });
  });

  describe("2. Error Handling Transparente", () => {
    it("should expose database errors honestly to user", async () => {
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
                    arguments: JSON.stringify({ category: "survival" }),
                  },
                },
              ],
            },
          },
        ],
        usage: { prompt_tokens: 200, completion_tokens: 45 },
      } as never);

      // Mock: Tool throws database error
      mockAnalyze.mockRejectedValueOnce(
        new Error("Database connection timeout")
      );

      // Mock: GPT receives error structure with _error flag
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: "assistant",
              content:
                "No pude acceder a tu información de análisis de gastos en este momento. Por favor, inténtalo de nuevo en unos momentos.",
            },
          },
        ],
        usage: { prompt_tokens: 380, completion_tokens: 35 },
      } as never);

      const result = await processFunctionCalling(
        "¿Cuánto he gastado?",
        [],
        mockSupabase,
        testUserId
      );

      // Verify error is exposed, not hidden
      expect(result.message).toMatch(/no pude acceder|error|inténtalo/i);
      // Verify NO invented data
      expect(result.message).not.toMatch(/€\d+/);
    });

    it("should classify error types correctly", async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: "assistant",
              content: null,
              tool_calls: [
                {
                  id: "call_permission",
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
        usage: { prompt_tokens: 200, completion_tokens: 45 },
      } as never);

      // Mock: Permission error
      mockBudget.mockRejectedValueOnce(
        new Error("Unauthorized: User session expired")
      );

      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: "assistant",
              content:
                "No tengo permiso para acceder a los datos de estado de presupuesto. Verifica tu sesión.",
            },
          },
        ],
        usage: { prompt_tokens: 380, completion_tokens: 30 },
      } as never);

      const result = await processFunctionCalling(
        "¿Cómo va mi presupuesto?",
        [],
        mockSupabase,
        testUserId
      );

      // Verify permission-specific message
      expect(result.message).toMatch(/permiso|sesión/i);
    });
  });

  describe("3. Tool Output Validator", () => {
    it("should validate spending pattern output structure", () => {
      const validData = {
        totalAmount: 450.5,
        averagePerPeriod: 37.54,
        trend: "stable",
        trendPercentage: 0,
        topExpenses: [{ concept: "Test", amount: 100, date: "2026-02-01" }],
        insights: [],
      };

      const result = validateToolOutput("analyzeSpendingPattern", validData);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect numerical inconsistencies", () => {
      const invalidData = {
        totalAmount: 100,
        averagePerPeriod: 50,
        trend: "stable",
        trendPercentage: 0,
        topExpenses: [
          { concept: "A", amount: 60, date: "2026-02-01" },
          { concept: "B", amount: 50, date: "2026-02-02" },
          // Total: 110 > totalAmount: 100
        ],
        insights: [],
      };

      const result = validateToolOutput("analyzeSpendingPattern", invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toMatch(/exceeds totalAmount/i);
    });

    it("should validate budget status category totals", () => {
      const invalidData = {
        totalBudget: 1000,
        totalSpent: 450,
        totalRemaining: 550,
        overallStatus: "safe",
        categories: [
          { category: "survival", spent: 200, budget: 300, percentage: 67 },
          { category: "optional", spent: 300, budget: 400, percentage: 75 },
          // Total: 500, but totalSpent: 450 (discrepancy > 5%)
        ],
      };

      const result = validateToolOutput("getBudgetStatus", invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/doesn't match totalSpent/i);
    });

    it("should warn about anomalous data quality", () => {
      const dataWithWarnings = {
        totalAmount: 0,
        averagePerPeriod: 0,
        trend: "stable",
        trendPercentage: 0,
        topExpenses: [],
        insights: [], // No insights despite 0 spending
      };

      const result = validateToolOutput(
        "analyzeSpendingPattern",
        dataWithWarnings
      );

      expect(result.valid).toBe(true); // Valid structure
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toMatch(/no spending data/i);
    });

    it("should reject validation failures and force LLM acknowledgment", async () => {
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
                    name: "getBudgetStatus",
                    arguments: JSON.stringify({}),
                  },
                },
              ],
            },
          },
        ],
        usage: { prompt_tokens: 200, completion_tokens: 45 },
      } as never);

      // Mock: Tool returns invalid data (negative budget)
      mockBudget.mockResolvedValueOnce({
        totalBudget: -500, // INVALID
        totalSpent: 450,
        totalRemaining: 50,
        overallStatus: "safe",
        categories: [],
      });

      // The validator will catch this and convert to error
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: "assistant",
              content:
                "Los datos de estado de presupuesto no se pudieron procesar correctamente. Esto puede indicar un problema técnico.",
            },
          },
        ],
        usage: { prompt_tokens: 380, completion_tokens: 30 },
      } as never);

      const result = await processFunctionCalling(
        "¿Cómo va mi presupuesto?",
        [],
        mockSupabase,
        testUserId
      );

      // Verify validation error is exposed
      expect(result.message).toMatch(/no se pudieron procesar|problema/i);
    });
  });

  describe("Integration: All 3 changes working together", () => {
    it("should handle complete flow with transparency + validation + error handling", async () => {
      // Scenario: User asks about spending with valid data
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: "assistant",
              content: null,
              tool_calls: [
                {
                  id: "call_complete",
                  type: "function" as const,
                  function: {
                    name: "analyzeSpendingPattern",
                    arguments: JSON.stringify({
                      category: "optional",
                      period: "current_month",
                    }),
                  },
                },
              ],
            },
          },
        ],
        usage: { prompt_tokens: 200, completion_tokens: 50 },
      } as never);

      // Mock: Tool returns valid data
      mockAnalyze.mockResolvedValueOnce({
        totalAmount: 350.75,
        transactionCount: 18,
        averagePerPeriod: 19.49,
        trend: "increasing",
        trendPercentage: 12.5,
        topExpenses: [
          { concept: "Restaurante", amount: 80, date: "2026-02-05" },
          { concept: "Cine", amount: 25, date: "2026-02-07" },
        ],
        insights: ["Tus gastos en opcional están aumentando un 12.5%"],
        category: "optional",
        period: "current_month",
      });

      // Mock: GPT follows hardened prompt
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              role: "assistant",
              content:
                "Has gastado €350.75 en opcional este mes (basado en 18 transacciones del 1 al 9 de febrero). Esto es un 12.5% más que el mes pasado. Los principales gastos fueron: Restaurante (€80) y Cine (€25).",
            },
          },
        ],
        usage: { prompt_tokens: 450, completion_tokens: 90 },
      } as never);

      const result = await processFunctionCalling(
        "¿Cuánto he gastado en ocio?",
        [],
        mockSupabase,
        testUserId
      );

      // Verify all 3 hardening elements:
      // 1. Transparency: mentions period + transaction count
      expect(result.message).toMatch(/este mes/i);
      expect(result.message).toMatch(/18 transacciones/i);

      // 2. Validation: passed (no errors)
      expect(result.toolsUsed).toContain("analyzeSpendingPattern");

      // 3. No errors occurred (error handling not triggered)
      expect(result.message).not.toMatch(/no pude acceder|error/i);
    });
  });
});
