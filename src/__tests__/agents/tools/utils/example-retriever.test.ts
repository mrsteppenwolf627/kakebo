/**
 * Tests for example retrieval (P1-2 + Fase 2.G)
 *
 * Validates that correction examples are correctly retrieved for few-shot
 * learning, and that (Fase 2.G) global examples (`user_id IS NULL`) are
 * NEVER mixed in — only the querying user's own examples.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getRelevantExamples,
  formatExamplesForPrompt,
  getSimilarExamples,
  trackExampleUsage,
  getExampleStats,
  type CorrectionExample,
} from "@/lib/agents/tools/utils/example-retriever";
import type { SupabaseClient } from "@supabase/supabase-js";

// Mock logger
vi.mock("@/lib/logger", () => ({
  apiLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("Example Retriever (P1-2)", () => {
  let mockSupabase: SupabaseClient;
  const userId = "test-user-123";

  /** Chainable query builder mock: every modifier returns itself; awaiting resolves the final result. */
  function makeChain(result: { data: unknown; error: unknown }) {
    const chain: Record<string, unknown> = {
      eq: vi.fn(() => chain),
      gte: vi.fn(() => chain),
      or: vi.fn(() => chain),
      order: vi.fn(() => chain),
      limit: vi.fn(() => Promise.resolve(result)),
    };
    return chain;
  }

  beforeEach(() => {
    // Mock Supabase client
    mockSupabase = {
      rpc: vi.fn(),
      from: vi.fn(() => ({
        select: vi.fn(() => makeChain({ data: [], error: null })),
      })),
    } as any;
  });

  describe("getRelevantExamples", () => {
    it("Fase 2.G: NUNCA llama a la RPC get_relevant_examples (su fallback global vive en SQL, no filtrable por consentimiento)", async () => {
      const chain = makeChain({ data: [], error: null });
      const mockFrom = vi.fn(() => ({ select: vi.fn(() => chain) }));
      mockSupabase.from = mockFrom as any;

      await getRelevantExamples(mockSupabase, userId, {
        categoryFilter: "supervivencia",
        limit: 3,
      });

      expect(mockSupabase.rpc).not.toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalledWith("correction_examples");
    });

    it("Fase 2.G: filtra SIEMPRE por user_id = userId, incluso con categoryFilter — nunca user_id IS NULL", async () => {
      const chain = makeChain({
        data: [
          {
            concept: "mercadona compra",
            old_category: "opcional",
            new_category: "supervivencia",
            merchant: "mercadona",
            confidence: 1.0,
          },
        ],
        error: null,
      });
      mockSupabase.from = vi.fn(() => ({ select: vi.fn(() => chain) })) as any;

      const examples = await getRelevantExamples(mockSupabase, userId, {
        categoryFilter: "supervivencia",
        limit: 3,
      });

      expect(examples).toHaveLength(1);
      expect(examples[0].concept).toBe("mercadona compra");
      expect(chain.eq).toHaveBeenCalledWith("user_id", userId);
      expect(chain.eq).toHaveBeenCalledWith("new_category", "supervivencia");
      // Nunca se usa .or() para combinar con user_id IS NULL.
      expect(chain.or).not.toHaveBeenCalled();
    });

    it("should return empty array if the query returns no data", async () => {
      const chain = makeChain({ data: [], error: null });
      mockSupabase.from = vi.fn(() => ({ select: vi.fn(() => chain) })) as any;

      const examples = await getRelevantExamples(mockSupabase, userId, {
        categoryFilter: "supervivencia",
      });

      expect(examples).toEqual([]);
    });

    it("should return empty array if the query fails", async () => {
      const chain = makeChain({ data: null, error: { message: "Database error" } });
      mockSupabase.from = vi.fn(() => ({ select: vi.fn(() => chain) })) as any;

      const examples = await getRelevantExamples(mockSupabase, userId, {
        categoryFilter: "supervivencia",
      });

      expect(examples).toEqual([]);
    });

    it("should use the direct query when no category filter, still scoped to the user only", async () => {
      const chain = makeChain({
        data: [
          {
            concept: "netflix",
            old_category: "supervivencia",
            new_category: "opcional",
            merchant: "netflix",
            confidence: 1.0,
          },
        ],
        error: null,
      });
      const mockFrom = vi.fn(() => ({ select: vi.fn(() => chain) }));
      mockSupabase.from = mockFrom as any;

      const examples = await getRelevantExamples(mockSupabase, userId, {
        limit: 5,
      });

      expect(examples).toHaveLength(1);
      expect(examples[0].concept).toBe("netflix");
      expect(mockFrom).toHaveBeenCalledWith("correction_examples");
      expect(chain.eq).toHaveBeenCalledWith("user_id", userId);
    });

    it("should handle exceptions gracefully", async () => {
      mockSupabase.from = vi.fn(() => {
        throw new Error("Network error");
      }) as any;

      const examples = await getRelevantExamples(mockSupabase, userId, {
        categoryFilter: "supervivencia",
      });

      expect(examples).toEqual([]);
    });
  });

  describe("formatExamplesForPrompt", () => {
    it("should format examples in Spanish (default)", () => {
      const examples: CorrectionExample[] = [
        {
          concept: "mercadona compra",
          oldCategory: "opcional",
          newCategory: "supervivencia",
          merchant: "mercadona",
          confidence: 1.0,
        },
        {
          concept: "netflix suscripción",
          oldCategory: "supervivencia",
          newCategory: "opcional",
          merchant: "netflix",
          confidence: 1.0,
        },
      ];

      const formatted = formatExamplesForPrompt(examples);

      expect(formatted).toContain("Aquí hay transacciones similares");
      expect(formatted).toContain('"mercadona compra" → supervivencia (antes: opcional)');
      expect(formatted).toContain('"netflix suscripción" → opcional (antes: supervivencia)');
    });

    it("should format examples in English", () => {
      const examples: CorrectionExample[] = [
        {
          concept: "mercadona compra",
          oldCategory: "opcional",
          newCategory: "supervivencia",
          merchant: "mercadona",
          confidence: 1.0,
        },
      ];

      const formatted = formatExamplesForPrompt(examples, "en");

      expect(formatted).toContain("Here are similar transactions");
      expect(formatted).toContain('"mercadona compra" → supervivencia (was: opcional)');
    });

    it("should return empty string for no examples", () => {
      const formatted = formatExamplesForPrompt([]);
      expect(formatted).toBe("");
    });

    it("should format multiple examples correctly", () => {
      const examples: CorrectionExample[] = [
        {
          concept: "example 1",
          oldCategory: "a",
          newCategory: "b",
          merchant: null,
          confidence: 1.0,
        },
        {
          concept: "example 2",
          oldCategory: "c",
          newCategory: "d",
          merchant: null,
          confidence: 1.0,
        },
        {
          concept: "example 3",
          oldCategory: "e",
          newCategory: "f",
          merchant: null,
          confidence: 1.0,
        },
      ];

      const formatted = formatExamplesForPrompt(examples);

      expect(formatted.split("\n")).toHaveLength(4); // Header + 3 examples
    });
  });

  describe("getSimilarExamples", () => {
    it("should find examples with similar keywords, scoped to the user only (Fase 2.G: no global fallback)", async () => {
      const chain = makeChain({
        data: [
          {
            concept: "mercadona compra semanal",
            old_category: "opcional",
            new_category: "supervivencia",
            merchant: "mercadona",
            confidence: 1.0,
          },
        ],
        error: null,
      });
      const mockFrom = vi.fn(() => ({ select: vi.fn(() => chain) }));
      mockSupabase.from = mockFrom as any;

      const similar = await getSimilarExamples(
        mockSupabase,
        userId,
        "Mercadona productos",
        3
      );

      expect(similar).toHaveLength(1);
      expect(similar[0].concept).toBe("mercadona compra semanal");
      expect(chain.eq).toHaveBeenCalledWith("user_id", userId);
    });

    it("should return empty array for concepts with no keywords", async () => {
      const similar = await getSimilarExamples(
        mockSupabase,
        userId,
        "a b c", // All words < 4 chars
        3
      );

      expect(similar).toEqual([]);
    });

    it("should return empty array if query fails", async () => {
      const chain = makeChain({ data: null, error: { message: "Database error" } });
      mockSupabase.from = vi.fn(() => ({ select: vi.fn(() => chain) })) as any;

      const similar = await getSimilarExamples(
        mockSupabase,
        userId,
        "Mercadona",
        3
      );

      expect(similar).toEqual([]);
    });

    it("should handle exceptions gracefully", async () => {
      // Mock from() to throw exception
      mockSupabase.from = vi.fn(() => {
        throw new Error("Network error");
      }) as any;

      const similar = await getSimilarExamples(
        mockSupabase,
        userId,
        "Mercadona",
        3
      );

      expect(similar).toEqual([]);
    });
  });

  describe("trackExampleUsage", () => {
    it("should increment usage for all examples", async () => {
      // Mock RPC to succeed
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: null,
      } as any);

      const count = await trackExampleUsage(mockSupabase, [
        "uuid-1",
        "uuid-2",
        "uuid-3",
      ]);

      expect(count).toBe(3);
      expect(mockSupabase.rpc).toHaveBeenCalledTimes(3);
      expect(mockSupabase.rpc).toHaveBeenCalledWith("increment_example_usage", {
        p_example_id: "uuid-1",
      });
    });

    it("should return 0 for empty array", async () => {
      const count = await trackExampleUsage(mockSupabase, []);
      expect(count).toBe(0);
      expect(mockSupabase.rpc).not.toHaveBeenCalled();
    });

    it("should continue on individual failures", async () => {
      // Mock RPC to fail on second call
      vi.mocked(mockSupabase.rpc)
        .mockResolvedValueOnce({ data: null, error: null } as any)
        .mockResolvedValueOnce({
          data: null,
          error: { message: "Error" },
        } as any)
        .mockResolvedValueOnce({ data: null, error: null } as any);

      const count = await trackExampleUsage(mockSupabase, [
        "uuid-1",
        "uuid-2",
        "uuid-3",
      ]);

      expect(count).toBe(2); // Only 2 succeeded
    });

    it("should handle exceptions gracefully", async () => {
      // Mock RPC to throw exception
      vi.mocked(mockSupabase.rpc).mockRejectedValue(new Error("Network error"));

      const count = await trackExampleUsage(mockSupabase, ["uuid-1"]);

      expect(count).toBe(0);
    });
  });

  describe("getExampleStats", () => {
    it("should return statistics about examples", async () => {
      // Mock RPC to return stats
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: [
          {
            total_examples: 25,
            examples_by_category: {
              supervivencia: 10,
              opcional: 12,
              cultura: 3,
            },
            most_corrected: "opcional",
            correction_count: 12,
          },
        ],
        error: null,
      } as any);

      const stats = await getExampleStats(mockSupabase, userId);

      expect(stats.totalExamples).toBe(25);
      expect(stats.examplesByCategory.supervivencia).toBe(10);
      expect(stats.examplesByCategory.opcional).toBe(12);
      expect(stats.examplesByCategory.cultura).toBe(3);
      expect(stats.mostCorrected).toBe("opcional");
      expect(stats.correctionCount).toBe(12);
    });

    it("should return empty stats if no data", async () => {
      // Mock RPC to return empty
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: [],
        error: null,
      } as any);

      const stats = await getExampleStats(mockSupabase, userId);

      expect(stats.totalExamples).toBe(0);
      expect(stats.examplesByCategory).toEqual({});
      expect(stats.mostCorrected).toBeNull();
      expect(stats.correctionCount).toBe(0);
    });

    it("should return empty stats if RPC fails", async () => {
      // Mock RPC to return error
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      } as any);

      const stats = await getExampleStats(mockSupabase, userId);

      expect(stats.totalExamples).toBe(0);
      expect(stats.examplesByCategory).toEqual({});
      expect(stats.mostCorrected).toBeNull();
      expect(stats.correctionCount).toBe(0);
    });

    it("should handle exceptions gracefully", async () => {
      // Mock RPC to throw exception
      vi.mocked(mockSupabase.rpc).mockRejectedValue(new Error("Network error"));

      const stats = await getExampleStats(mockSupabase, userId);

      expect(stats.totalExamples).toBe(0);
      expect(stats.examplesByCategory).toEqual({});
      expect(stats.mostCorrected).toBeNull();
      expect(stats.correctionCount).toBe(0);
    });
  });
});
