import { describe, it, expect, vi, beforeEach } from "vitest";
import { classifyExpense, classifyExpenses } from "@/lib/ai/classifier";

// Mock OpenAI
vi.mock("@/lib/ai/client", () => ({
  openai: {
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  },
  DEFAULT_MODEL: "gpt-4o-mini",
  calculateCost: vi.fn(() => 0.0001),
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  apiLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Get mock reference
import { openai } from "@/lib/ai/client";
const mockCreate = vi.mocked(openai.chat.completions.create);

describe("AI Classifier", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("classifyExpense", () => {
    it("should classify a supermarket expense as survival", async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                category: "survival",
                note: "Compra supermercado",
                confidence: 0.95,
              }),
            },
          },
        ],
        usage: {
          prompt_tokens: 500,
          completion_tokens: 30,
        },
      } as never);

      const result = await classifyExpense("Mercadona 45€");

      expect(result.category).toBe("survival");
      expect(result.note).toBe("Compra supermercado");
      expect(result.confidence).toBe(0.95);
      expect(result.metrics.model).toBe("gpt-4o-mini");
    });

    it("should classify Netflix as culture", async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                category: "culture",
                note: "Suscripción streaming",
                confidence: 0.98,
              }),
            },
          },
        ],
        usage: {
          prompt_tokens: 500,
          completion_tokens: 25,
        },
      } as never);

      const result = await classifyExpense("Netflix mensual");

      expect(result.category).toBe("culture");
      expect(result.note).toBe("Suscripción streaming");
    });

    it("should classify restaurant as optional", async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                category: "optional",
                note: "Cena restaurante",
                confidence: 0.92,
              }),
            },
          },
        ],
        usage: {
          prompt_tokens: 500,
          completion_tokens: 25,
        },
      } as never);

      const result = await classifyExpense("Cena con amigos");

      expect(result.category).toBe("optional");
    });

    it("should classify urgent repair as extra", async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                category: "extra",
                note: "Reparación urgente",
                confidence: 0.88,
              }),
            },
          },
        ],
        usage: {
          prompt_tokens: 500,
          completion_tokens: 25,
        },
      } as never);

      const result = await classifyExpense("Fontanero emergencia");

      expect(result.category).toBe("extra");
    });

    it("should handle invalid JSON response gracefully", async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: "This is not valid JSON",
            },
          },
        ],
        usage: {
          prompt_tokens: 500,
          completion_tokens: 10,
        },
      } as never);

      const result = await classifyExpense("Something");

      // Should return fallback values
      expect(result.category).toBe("optional");
      expect(result.confidence).toBe(0.5);
    });

    it("should handle API errors gracefully", async () => {
      mockCreate.mockRejectedValueOnce(new Error("API Error"));

      const result = await classifyExpense("Test expense");

      // Should return fallback values
      expect(result.category).toBe("optional");
      expect(result.confidence).toBe(0);
      expect(result.metrics.inputTokens).toBe(0);
    });

    it("should clamp confidence to 0-1 range", async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                category: "survival",
                note: "Test",
                confidence: 1.5, // Invalid: > 1
              }),
            },
          },
        ],
        usage: {
          prompt_tokens: 500,
          completion_tokens: 25,
        },
      } as never);

      const result = await classifyExpense("Test");

      expect(result.confidence).toBe(1); // Should be clamped to 1
    });

    it("should return metrics with each classification", async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                category: "survival",
                note: "Test",
                confidence: 0.9,
              }),
            },
          },
        ],
        usage: {
          prompt_tokens: 550,
          completion_tokens: 30,
        },
      } as never);

      const result = await classifyExpense("Test");

      expect(result.metrics).toHaveProperty("model");
      expect(result.metrics).toHaveProperty("promptVersion");
      expect(result.metrics).toHaveProperty("latencyMs");
      expect(result.metrics).toHaveProperty("inputTokens", 550);
      expect(result.metrics).toHaveProperty("outputTokens", 30);
      expect(result.metrics).toHaveProperty("costUsd");
    });
  });

  describe("classifyExpenses (batch)", () => {
    it("should classify multiple expenses", async () => {
      mockCreate
        .mockResolvedValueOnce({
          choices: [{ message: { content: JSON.stringify({ category: "survival", note: "Supermercado", confidence: 0.95 }) } }],
          usage: { prompt_tokens: 500, completion_tokens: 25 },
        } as never)
        .mockResolvedValueOnce({
          choices: [{ message: { content: JSON.stringify({ category: "culture", note: "Streaming", confidence: 0.98 }) } }],
          usage: { prompt_tokens: 500, completion_tokens: 25 },
        } as never)
        .mockResolvedValueOnce({
          choices: [{ message: { content: JSON.stringify({ category: "optional", note: "Restaurante", confidence: 0.90 }) } }],
          usage: { prompt_tokens: 500, completion_tokens: 25 },
        } as never);

      const results = await classifyExpenses([
        "Mercadona 50€",
        "Netflix",
        "Cena cumpleaños",
      ]);

      expect(results).toHaveLength(3);
      expect(results[0].category).toBe("survival");
      expect(results[1].category).toBe("culture");
      expect(results[2].category).toBe("optional");
    });
  });
});
