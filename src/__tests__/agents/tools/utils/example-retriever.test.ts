/**
 * Tests for example retrieval (P1-2)
 *
 * Validates that correction examples are correctly retrieved for few-shot learning.
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

  beforeEach(() => {
    // Mock Supabase client
    mockSupabase = {
      rpc: vi.fn(),
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          or: vi.fn(() => ({
            gte: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => ({
                  data: [],
                  error: null,
                })),
              })),
            })),
          })),
        })),
      })),
    } as any;
  });

  describe("getRelevantExamples", () => {
    it("should retrieve examples via RPC when category filter provided", async () => {
      // Mock RPC to return examples
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: [
          {
            concept: "mercadona compra",
            old_category: "opcional",
            new_category: "supervivencia",
            merchant: "mercadona",
            confidence: 1.0,
          },
          {
            concept: "lidl productos",
            old_category: "opcional",
            new_category: "supervivencia",
            merchant: "lidl",
            confidence: 1.0,
          },
        ],
        error: null,
      } as any);

      const examples = await getRelevantExamples(mockSupabase, userId, {
        categoryFilter: "supervivencia",
        limit: 3,
      });

      expect(examples).toHaveLength(2);
      expect(examples[0].concept).toBe("mercadona compra");
      expect(examples[0].oldCategory).toBe("opcional");
      expect(examples[0].newCategory).toBe("supervivencia");
      expect(examples[0].merchant).toBe("mercadona");
      expect(examples[0].confidence).toBe(1.0);

      expect(mockSupabase.rpc).toHaveBeenCalledWith("get_relevant_examples", {
        p_user_id: userId,
        p_category: "supervivencia",
        p_limit: 3,
      });
    });

    it("should return empty array if RPC returns no data", async () => {
      // Mock RPC to return empty
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: [],
        error: null,
      } as any);

      const examples = await getRelevantExamples(mockSupabase, userId, {
        categoryFilter: "supervivencia",
      });

      expect(examples).toEqual([]);
    });

    it("should return empty array if RPC fails", async () => {
      // Mock RPC to return error
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      } as any);

      const examples = await getRelevantExamples(mockSupabase, userId, {
        categoryFilter: "supervivencia",
      });

      expect(examples).toEqual([]);
    });

    it("should use direct query when no category filter", async () => {
      // Mock from() chain
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          or: vi.fn(() => ({
            gte: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => ({
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
                })),
              })),
            })),
          })),
        })),
      }));

      mockSupabase.from = mockFrom as any;

      const examples = await getRelevantExamples(mockSupabase, userId, {
        limit: 5,
      });

      expect(examples).toHaveLength(1);
      expect(examples[0].concept).toBe("netflix");
      expect(mockFrom).toHaveBeenCalledWith("correction_examples");
    });

    it("should handle exceptions gracefully", async () => {
      // Mock RPC to throw exception
      vi.mocked(mockSupabase.rpc).mockRejectedValue(new Error("Network error"));

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
    it("should find examples with similar keywords", async () => {
      // Mock from() chain
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          or: vi.fn(() => ({
            or: vi.fn(() => ({
              gte: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(() => ({
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
                  })),
                })),
              })),
            })),
          })),
        })),
      }));

      mockSupabase.from = mockFrom as any;

      const similar = await getSimilarExamples(
        mockSupabase,
        userId,
        "Mercadona productos",
        3
      );

      expect(similar).toHaveLength(1);
      expect(similar[0].concept).toBe("mercadona compra semanal");
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
      // Mock from() to return error
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          or: vi.fn(() => ({
            or: vi.fn(() => ({
              gte: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(() => ({
                    data: null,
                    error: { message: "Database error" },
                  })),
                })),
              })),
            })),
          })),
        })),
      }));

      mockSupabase.from = mockFrom as any;

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
