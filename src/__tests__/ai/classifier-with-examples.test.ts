/**
 * Tests for AI classifier with correction examples integration (P1-2)
 *
 * Validates that the classifier correctly integrates user correction examples
 * into the GPT prompt for improved few-shot learning.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { classifyExpense } from "@/lib/ai/classifier";
import type { SupabaseClient } from "@supabase/supabase-js";

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
  calculateCost: vi.fn(() => 0.0001),
}));

// Mock prompts
vi.mock("@/lib/ai/prompts", () => ({
  getPromptVersion: vi.fn(() => ({
    system: "You are a helpful expense classifier.",
    examples: [
      { input: "Mercadona", category: "survival", note: "Compra supermercado" },
    ],
  })),
  formatExamplesForPrompt: vi.fn(() => "Example 1: Mercadona -> survival"),
  CURRENT_PROMPT_VERSION: "v1",
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  apiLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock example retriever
vi.mock("@/lib/agents/tools/utils/example-retriever", () => ({
  getRelevantExamples: vi.fn(),
  formatExamplesForPrompt: vi.fn(),
  trackExampleUsage: vi.fn(),
}));

import { openai } from "@/lib/ai/client";
import { getRelevantExamples, formatExamplesForPrompt as formatCorrectionExamples } from "@/lib/agents/tools/utils/example-retriever";

describe("AI Classifier with Correction Examples (P1-2 Integration)", () => {
  let mockSupabase: SupabaseClient;
  const userId = "test-user-123";

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Supabase client
    mockSupabase = {} as any;

    // Mock OpenAI response
    vi.mocked(openai.chat.completions.create).mockResolvedValue({
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
        prompt_tokens: 100,
        completion_tokens: 20,
      },
    } as any);
  });

  it("should retrieve and use correction examples when supabase and userId provided", async () => {
    // Mock correction examples
    vi.mocked(getRelevantExamples).mockResolvedValue([
      {
        concept: "mercadona compra",
        oldCategory: "opcional",
        newCategory: "supervivencia",
        merchant: "mercadona",
        confidence: 1.0,
      },
      {
        concept: "lidl productos",
        oldCategory: "opcional",
        newCategory: "supervivencia",
        merchant: "lidl",
        confidence: 1.0,
      },
    ]);

    vi.mocked(formatCorrectionExamples).mockReturnValue(
      'Aquí hay transacciones similares que has corregido antes:\n  - "mercadona compra" → supervivencia (antes: opcional)\n  - "lidl productos" → supervivencia (antes: opcional)'
    );

    const result = await classifyExpense("Mercadona 45€", {
      supabase: mockSupabase,
      userId,
    });

    // Should have retrieved correction examples
    expect(getRelevantExamples).toHaveBeenCalledWith(mockSupabase, userId, {
      limit: 3,
      minConfidence: 0.8,
    });

    // Should have formatted correction examples
    expect(formatCorrectionExamples).toHaveBeenCalled();

    // Should have called OpenAI with enhanced prompt
    expect(openai.chat.completions.create).toHaveBeenCalled();

    const callArgs = vi.mocked(openai.chat.completions.create).mock.calls[0][0];
    const messages = callArgs.messages;

    // Should have static examples
    expect(messages.some((m: any) => m.content?.includes("Aquí tienes ejemplos"))).toBe(true);

    // Should have correction examples
    expect(messages.some((m: any) => m.content?.includes("transacciones similares que has corregido"))).toBe(true);

    // Should return valid result
    expect(result.category).toBe("survival");
    expect(result.confidence).toBe(0.95);
  });

  it("should work without correction examples when supabase not provided", async () => {
    const result = await classifyExpense("Netflix mensual");

    // Should NOT retrieve correction examples
    expect(getRelevantExamples).not.toHaveBeenCalled();

    // Should still call OpenAI
    expect(openai.chat.completions.create).toHaveBeenCalled();

    // Should return valid result
    expect(result.category).toBe("survival");
  });

  it("should work without correction examples when userId not provided", async () => {
    const result = await classifyExpense("Netflix mensual", {
      supabase: mockSupabase,
      // No userId provided
    });

    // Should NOT retrieve correction examples
    expect(getRelevantExamples).not.toHaveBeenCalled();

    // Should still call OpenAI
    expect(openai.chat.completions.create).toHaveBeenCalled();
  });

  it("should work when useCorrectionExamples is explicitly disabled", async () => {
    const result = await classifyExpense("Netflix mensual", {
      supabase: mockSupabase,
      userId,
      useCorrectionExamples: false,
    });

    // Should NOT retrieve correction examples
    expect(getRelevantExamples).not.toHaveBeenCalled();

    // Should still call OpenAI
    expect(openai.chat.completions.create).toHaveBeenCalled();
  });

  it("should handle errors in correction example retrieval gracefully", async () => {
    // Mock getRelevantExamples to throw error
    vi.mocked(getRelevantExamples).mockRejectedValue(new Error("Database error"));

    const result = await classifyExpense("Mercadona 45€", {
      supabase: mockSupabase,
      userId,
    });

    // Should have attempted to retrieve examples
    expect(getRelevantExamples).toHaveBeenCalled();

    // Should still call OpenAI (without correction examples)
    expect(openai.chat.completions.create).toHaveBeenCalled();

    // Should return valid result
    expect(result.category).toBe("survival");
  });

  it("should handle empty correction examples", async () => {
    // Mock getRelevantExamples to return empty array
    vi.mocked(getRelevantExamples).mockResolvedValue([]);

    const result = await classifyExpense("Mercadona 45€", {
      supabase: mockSupabase,
      userId,
    });

    // Should have attempted to retrieve examples
    expect(getRelevantExamples).toHaveBeenCalled();

    // Should NOT format correction examples (empty array)
    expect(formatCorrectionExamples).not.toHaveBeenCalled();

    // Should still call OpenAI (without correction examples)
    expect(openai.chat.completions.create).toHaveBeenCalled();

    // Should return valid result
    expect(result.category).toBe("survival");
  });

  it("should include both static and correction examples in prompt", async () => {
    // Mock correction examples
    vi.mocked(getRelevantExamples).mockResolvedValue([
      {
        concept: "netflix suscripción",
        oldCategory: "supervivencia",
        newCategory: "opcional",
        merchant: "netflix",
        confidence: 1.0,
      },
    ]);

    vi.mocked(formatCorrectionExamples).mockReturnValue(
      'Aquí hay transacciones similares que has corregido antes:\n  - "netflix suscripción" → opcional (antes: supervivencia)'
    );

    const result = await classifyExpense("Netflix 12.99€", {
      supabase: mockSupabase,
      userId,
    });

    const callArgs = vi.mocked(openai.chat.completions.create).mock.calls[0][0];
    const messages = callArgs.messages;

    // Should have system message
    expect(messages[0].role).toBe("system");

    // Should have static examples
    const staticExampleMsg = messages.find((m: any) =>
      m.role === "user" && m.content?.includes("Aquí tienes ejemplos")
    );
    expect(staticExampleMsg).toBeDefined();

    // Should have correction examples
    const correctionExampleMsg = messages.find((m: any) =>
      m.role === "user" && m.content?.includes("transacciones similares que has corregido")
    );
    expect(correctionExampleMsg).toBeDefined();

    // Should have actual input at the end
    const inputMsg = messages[messages.length - 1];
    expect(inputMsg.role).toBe("user");
    expect(inputMsg.content).toContain("Clasifica este gasto");
  });
});
