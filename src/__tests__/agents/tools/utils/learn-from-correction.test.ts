/**
 * Tests for learning from corrections (P1-1)
 *
 * Validates that merchant rules are correctly saved when users correct categories,
 * creating a feedback loop for improved accuracy.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  learnFromCorrection,
  learnFromCorrectionsBatch,
  getLearningStats,
} from "@/lib/agents/tools/utils/learn-from-correction";
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

// Mock merchant extractor
vi.mock("@/lib/agents/tools/utils/merchant-extractor", () => ({
  extractMerchant: vi.fn((concept: string) => {
    const lower = concept.toLowerCase();
    if (lower.includes("mercadona")) return "mercadona";
    if (lower.includes("netflix")) return "netflix";
    if (lower.includes("uber")) return "uber";
    if (lower.includes("unknown")) return null; // Cannot extract
    return null;
  }),
}));

describe("Learn From Correction (P1-1)", () => {
  let mockSupabase: SupabaseClient;
  const userId = "test-user-123";

  beforeEach(() => {
    // Mock Supabase client with default behavior
    const defaultFromMock = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            limit: vi.fn(() => ({
              single: vi.fn(() => ({
                data: null,
                error: { code: "PGRST116" }, // Not found (new rule)
              })),
            })),
          })),
          limit: vi.fn(() => ({
            single: vi.fn(() => ({
              data: null,
              error: { code: "PGRST116" },
            })),
          })),
        })),
        is: vi.fn(() => ({
          eq: vi.fn(() => ({
            limit: vi.fn(() => ({
              single: vi.fn(() => ({
                data: null, // No global rule found
                error: null,
              })),
            })),
          })),
        })),
      })),
    }));

    mockSupabase = {
      rpc: vi.fn(),
      from: defaultFromMock,
    } as any;
  });

  describe("learnFromCorrection", () => {
    it("should create new rule when user corrects category", async () => {
      // Mock upsert_merchant_rule to return success
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: "rule-123",
        error: null,
      } as any);

      const result = await learnFromCorrection(
        mockSupabase,
        userId,
        "Mercadona compra semanal",
        "opcional", // Old category (wrong)
        "supervivencia" // New category (correct)
      );

      expect(result.success).toBe(true);
      expect(result.merchant).toBe("mercadona");
      expect(result.ruleCreated).toBe(true);
      expect(result.message).toContain("aprendida");
      expect(result.message).toContain("mercadona");
      expect(result.message).toContain("supervivencia");

      // Check that upsert_merchant_rule was called correctly
      expect(mockSupabase.rpc).toHaveBeenCalledWith("upsert_merchant_rule", {
        p_user_id: userId,
        p_merchant: "mercadona",
        p_category: "supervivencia",
        p_confidence: 1.0, // User correction = max confidence
      });
    });

    it("should update existing rule when correcting again", async () => {
      // Mock upsert_merchant_rule to return success
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: "existing-rule-123",
        error: null,
      } as any);

      // Mock existing rule found (this is checked AFTER upsert)
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn((field: string, value: any) => {
            // First eq() is user_id
            return {
              eq: vi.fn(() => ({
                // Second eq() is merchant
                limit: vi.fn(() => ({
                  single: vi.fn(() => ({
                    data: { id: "existing-rule-123" },
                    error: null,
                  })),
                })),
              })),
            };
          }),
          is: vi.fn(() => ({
            // For global rule check (returns nothing)
            eq: vi.fn(() => ({
              limit: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: null,
                  error: null,
                })),
              })),
            })),
          })),
        })),
      }));

      mockSupabase.from = mockFrom as any;

      const result = await learnFromCorrection(
        mockSupabase,
        userId,
        "Netflix suscripción",
        "supervivencia", // Old category
        "opcional" // New category (corrected again)
      );

      expect(result.success).toBe(true);
      expect(result.merchant).toBe("netflix");
      expect(result.ruleUpdated).toBe(true);
      expect(result.ruleCreated).toBe(false);
      expect(result.message).toContain("actualizada");
    });

    it("should handle merchant extraction failure gracefully", async () => {
      const result = await learnFromCorrection(
        mockSupabase,
        userId,
        "Unknown merchant concept",
        "opcional",
        "supervivencia"
      );

      expect(result.success).toBe(true); // Not an error, just no merchant
      expect(result.merchant).toBeNull();
      expect(result.ruleCreated).toBe(false);
      expect(result.ruleUpdated).toBe(false);
      expect(result.message).toContain("No se pudo identificar");
    });

    it("should handle upsert error gracefully", async () => {
      // Mock upsert_merchant_rule to return error
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      } as any);

      const result = await learnFromCorrection(
        mockSupabase,
        userId,
        "Mercadona compra",
        "opcional",
        "supervivencia"
      );

      expect(result.success).toBe(false);
      expect(result.merchant).toBe("mercadona");
      expect(result.ruleCreated).toBe(false);
      expect(result.message).toContain("Error al crear regla");
    });

    it("should handle exceptions gracefully", async () => {
      // Mock upsert_merchant_rule to throw exception
      vi.mocked(mockSupabase.rpc).mockRejectedValue(new Error("Network error"));

      const result = await learnFromCorrection(
        mockSupabase,
        userId,
        "Mercadona compra",
        "opcional",
        "supervivencia"
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain("Error al aprender");
    });

    it("should increment global rule vote if correction matches global consensus", async () => {
      // Mock upsert_merchant_rule success
      const mockRpc = vi
        .fn()
        .mockResolvedValueOnce({
          // First call: upsert_merchant_rule
          data: "rule-123",
          error: null,
        })
        .mockResolvedValueOnce({
          // Second call: increment_global_rule_vote
          data: null,
          error: null,
        });

      mockSupabase.rpc = mockRpc as any;

      // Mock from() to handle both the existing rule check AND global rule check
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn((field: string, value: any) => {
            // This is the check for existing user rule (returns not found)
            return {
              eq: vi.fn(() => ({
                limit: vi.fn(() => ({
                  single: vi.fn(() => ({
                    data: null,
                    error: { code: "PGRST116" }, // Not found = new rule
                  })),
                })),
              })),
            };
          }),
          is: vi.fn((field: string, value: any) => {
            // This is the check for global rule (returns matching global rule)
            return {
              eq: vi.fn(() => ({
                limit: vi.fn(() => ({
                  single: vi.fn(() => ({
                    data: { category: "supervivencia", vote_count: 5 },
                    error: null,
                  })),
                })),
              })),
            };
          }),
        })),
      }));

      mockSupabase.from = mockFrom as any;

      const result = await learnFromCorrection(
        mockSupabase,
        userId,
        "Mercadona compra",
        "opcional",
        "supervivencia"
      );

      expect(result.success).toBe(true);
      expect(result.globalVoteIncremented).toBe(true);
    });
  });

  describe("learnFromCorrectionsBatch", () => {
    it("should learn from multiple corrections", async () => {
      // Mock upsert_merchant_rule to always succeed
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: "rule-123",
        error: null,
      } as any);

      const results = await learnFromCorrectionsBatch(mockSupabase, userId, [
        {
          concept: "Mercadona compra",
          oldCategory: "opcional",
          newCategory: "supervivencia",
        },
        {
          concept: "Netflix suscripción",
          oldCategory: "supervivencia",
          newCategory: "opcional",
        },
        {
          concept: "Unknown merchant",
          oldCategory: "opcional",
          newCategory: "supervivencia",
        },
      ]);

      expect(results.length).toBe(3);

      // First two should succeed
      expect(results[0].success).toBe(true);
      expect(results[0].merchant).toBe("mercadona");
      expect(results[1].success).toBe(true);
      expect(results[1].merchant).toBe("netflix");

      // Third should succeed but with no merchant
      expect(results[2].success).toBe(true);
      expect(results[2].merchant).toBeNull();
    });

    it("should continue on individual failures", async () => {
      // Mock upsert_merchant_rule to fail on second call
      const mockRpc = vi
        .fn()
        .mockResolvedValueOnce({ data: "rule-1", error: null })
        .mockResolvedValueOnce({ data: null, error: { message: "Error" } })
        .mockResolvedValueOnce({ data: "rule-3", error: null });

      mockSupabase.rpc = mockRpc as any;

      const results = await learnFromCorrectionsBatch(mockSupabase, userId, [
        {
          concept: "Mercadona compra",
          oldCategory: "opcional",
          newCategory: "supervivencia",
        },
        {
          concept: "Netflix suscripción",
          oldCategory: "supervivencia",
          newCategory: "opcional",
        },
        {
          concept: "Uber viaje",
          oldCategory: "opcional",
          newCategory: "supervivencia",
        },
      ]);

      expect(results.length).toBe(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);
    });
  });

  describe("getLearningStats", () => {
    it("should return learning statistics", async () => {
      // Mock from().select() to return rules
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            data: [
              {
                merchant: "mercadona",
                category: "supervivencia",
                confidence: 1.0,
              },
              {
                merchant: "netflix",
                category: "opcional",
                confidence: 1.0,
              },
              {
                merchant: "uber",
                category: "supervivencia",
                confidence: 1.0,
              },
              {
                merchant: "farmacia",
                category: "supervivencia",
                confidence: 1.0,
              },
              {
                merchant: "spotify",
                category: "opcional",
                confidence: 1.0,
              },
            ],
            error: null,
          })),
        })),
      }));

      mockSupabase.from = mockFrom as any;

      const stats = await getLearningStats(mockSupabase, userId);

      expect(stats.totalRules).toBe(5);
      expect(stats.rulesByCategory["supervivencia"]).toBe(3);
      expect(stats.rulesByCategory["opcional"]).toBe(2);
      expect(stats.topMerchants.length).toBe(5);
    });

    it("should handle empty rules gracefully", async () => {
      // Mock from().select() to return empty
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            data: [],
            error: null,
          })),
        })),
      }));

      mockSupabase.from = mockFrom as any;

      const stats = await getLearningStats(mockSupabase, userId);

      expect(stats.totalRules).toBe(0);
      expect(stats.rulesByCategory).toEqual({});
      expect(stats.topMerchants).toEqual([]);
    });

    it("should handle query errors gracefully", async () => {
      // Mock from().select() to return error
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            data: null,
            error: { message: "Database error" },
          })),
        })),
      }));

      mockSupabase.from = mockFrom as any;

      const stats = await getLearningStats(mockSupabase, userId);

      expect(stats.totalRules).toBe(0);
      expect(stats.rulesByCategory).toEqual({});
      expect(stats.topMerchants).toEqual([]);
    });
  });
});
