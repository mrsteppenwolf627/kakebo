/**
 * Tests for category suggestion (P1-1)
 *
 * Validates that category suggestions are correctly retrieved from merchant rules
 * with proper priority (user-specific > global).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  suggestCategory,
  suggestCategoriesBatch,
  shouldUseSuggestion,
} from "@/lib/agents/tools/utils/category-suggester";
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

// Mock merchant extractor (we test it separately)
vi.mock("@/lib/agents/tools/utils/merchant-extractor", () => ({
  extractMerchant: vi.fn((concept: string) => {
    // Simple mock: extract first word if it's a known merchant
    const lower = concept.toLowerCase();
    if (lower.includes("mercadona")) return "mercadona";
    if (lower.includes("netflix")) return "netflix";
    if (lower.includes("uber")) return "uber";
    if (lower.includes("unknown")) return "unknown"; // Not in rules
    return null;
  }),
  getMerchantConfidence: vi.fn(() => 1.0),
}));

describe("Category Suggester (P1-1)", () => {
  let mockSupabase: SupabaseClient;
  const userId = "test-user-123";

  beforeEach(() => {
    // Mock Supabase client
    mockSupabase = {
      rpc: vi.fn(),
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            in: vi.fn(() => ({
              gte: vi.fn(() => ({
                data: [],
                error: null,
              })),
            })),
          })),
          is: vi.fn(() => ({
            in: vi.fn(() => ({
              gte: vi.fn(() => ({
                data: [],
                error: null,
              })),
            })),
          })),
        })),
      })),
    } as any;
  });

  describe("suggestCategory", () => {
    it("should return user-specific rule if found", async () => {
      // Mock get_merchant_rule to return user rule
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: [
          {
            category: "supervivencia",
            confidence: 1.0,
            source: "user_rule",
          },
        ],
        error: null,
      } as any);

      const result = await suggestCategory(
        mockSupabase,
        userId,
        "Mercadona compra"
      );

      expect(result).not.toBeNull();
      expect(result?.category).toBe("supervivencia");
      expect(result?.confidence).toBe(1.0);
      expect(result?.source).toBe("user_rule");
      expect(result?.merchant).toBe("mercadona");
    });

    it("should return global rule if no user rule found", async () => {
      // Mock get_merchant_rule to return global rule
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: [
          {
            category: "opcional",
            confidence: 0.8, // Discounted global confidence
            source: "global_rule",
          },
        ],
        error: null,
      } as any);

      const result = await suggestCategory(
        mockSupabase,
        userId,
        "Netflix suscripción"
      );

      expect(result).not.toBeNull();
      expect(result?.category).toBe("opcional");
      expect(result?.confidence).toBe(0.8);
      expect(result?.source).toBe("global_rule");
      expect(result?.merchant).toBe("netflix");
    });

    it("should return null if no rule found", async () => {
      // Mock get_merchant_rule to return empty
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: [],
        error: null,
      } as any);

      const result = await suggestCategory(
        mockSupabase,
        userId,
        "Unknown merchant"
      );

      expect(result).toBeNull();
    });

    it("should return null if merchant extraction fails", async () => {
      const result = await suggestCategory(
        mockSupabase,
        userId,
        "ab" // Too short, no merchant extracted
      );

      expect(result).toBeNull();
    });

    it("should return null if RPC call fails", async () => {
      // Mock RPC error
      vi.mocked(mockSupabase.rpc).mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      } as any);

      const result = await suggestCategory(
        mockSupabase,
        userId,
        "Mercadona compra"
      );

      expect(result).toBeNull();
    });

    it("should return null if RPC throws exception", async () => {
      // Mock RPC exception
      vi.mocked(mockSupabase.rpc).mockRejectedValue(new Error("Network error"));

      const result = await suggestCategory(
        mockSupabase,
        userId,
        "Mercadona compra"
      );

      expect(result).toBeNull();
    });
  });

  describe("suggestCategoriesBatch", () => {
    beforeEach(() => {
      // Mock from() chain for batch queries
      const mockFrom = vi.fn((table: string) => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            in: vi.fn(() => ({ data: [], error: null })),
          })),
          is: vi.fn(() => ({
            in: vi.fn(() => ({
              gte: vi.fn(() => ({ data: [], error: null })),
            })),
          })),
        })),
      }));

      mockSupabase.from = mockFrom as any;
    });

    it("should return suggestions for multiple concepts", async () => {
      // Mock user rules
      const mockFromUser = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            in: vi.fn(() => ({
              data: [
                {
                  merchant: "mercadona",
                  category: "supervivencia",
                  confidence: 1.0,
                },
              ],
              error: null,
            })),
          })),
        })),
      }));

      // Mock global rules
      const mockFromGlobal = vi.fn(() => ({
        select: vi.fn(() => ({
          is: vi.fn(() => ({
            in: vi.fn(() => ({
              gte: vi.fn(() => ({
                data: [
                  {
                    merchant: "netflix",
                    category: "opcional",
                    confidence: 1.0,
                    vote_count: 5,
                  },
                ],
                error: null,
              })),
            })),
          })),
        })),
      }));

      // Mock from to return different responses
      let callCount = 0;
      mockSupabase.from = vi.fn(() => {
        callCount++;
        if (callCount === 1) return mockFromUser() as any;
        return mockFromGlobal() as any;
      }) as any;

      const results = await suggestCategoriesBatch(mockSupabase, userId, [
        "Mercadona compra",
        "Netflix suscripción",
        "Unknown merchant",
      ]);

      expect(results.size).toBe(3);

      const mercadonaSuggestion = results.get("Mercadona compra");
      expect(mercadonaSuggestion).not.toBeNull();
      expect(mercadonaSuggestion?.category).toBe("supervivencia");
      expect(mercadonaSuggestion?.source).toBe("user_rule");

      const netflixSuggestion = results.get("Netflix suscripción");
      expect(netflixSuggestion).not.toBeNull();
      expect(netflixSuggestion?.category).toBe("opcional");
      expect(netflixSuggestion?.source).toBe("global_rule");

      const unknownSuggestion = results.get("Unknown merchant");
      expect(unknownSuggestion).toBeNull();
    });

    it("should return all nulls if no merchants extracted", async () => {
      const results = await suggestCategoriesBatch(mockSupabase, userId, [
        "ab",
        "cd",
      ]);

      expect(results.size).toBe(2);
      expect(results.get("ab")).toBeNull();
      expect(results.get("cd")).toBeNull();
    });

    it("should handle query errors gracefully", async () => {
      // Mock from to return error
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            in: vi.fn(() => ({
              data: null,
              error: { message: "Database error" },
            })),
          })),
          is: vi.fn(() => ({
            in: vi.fn(() => ({
              gte: vi.fn(() => ({
                data: null,
                error: { message: "Database error" },
              })),
            })),
          })),
        })),
      })) as any;

      const results = await suggestCategoriesBatch(mockSupabase, userId, [
        "Mercadona compra",
      ]);

      expect(results.size).toBe(1);
      expect(results.get("Mercadona compra")).toBeNull();
    });
  });

  describe("shouldUseSuggestion", () => {
    it("should return true for user rules (always)", () => {
      const suggestion = {
        category: "supervivencia" as const,
        confidence: 1.0,
        source: "user_rule" as const,
        merchant: "mercadona",
      };

      expect(shouldUseSuggestion(suggestion, 0.9)).toBe(true);
      expect(shouldUseSuggestion(suggestion, 1.0)).toBe(true);
    });

    it("should return true for global rules with high confidence", () => {
      const suggestion = {
        category: "opcional" as const,
        confidence: 0.8,
        source: "global_rule" as const,
        merchant: "netflix",
      };

      expect(shouldUseSuggestion(suggestion, 0.7)).toBe(true);
      expect(shouldUseSuggestion(suggestion, 0.8)).toBe(true);
    });

    it("should return false for global rules with low confidence", () => {
      const suggestion = {
        category: "opcional" as const,
        confidence: 0.6,
        source: "global_rule" as const,
        merchant: "netflix",
      };

      expect(shouldUseSuggestion(suggestion, 0.7)).toBe(false);
      expect(shouldUseSuggestion(suggestion, 0.8)).toBe(false);
    });

    it("should return false for null suggestion", () => {
      expect(shouldUseSuggestion(null, 0.7)).toBe(false);
    });

    it("should use default threshold of 0.7 if not provided", () => {
      const highConfidence = {
        category: "opcional" as const,
        confidence: 0.8,
        source: "global_rule" as const,
        merchant: "netflix",
      };

      const lowConfidence = {
        category: "opcional" as const,
        confidence: 0.6,
        source: "global_rule" as const,
        merchant: "netflix",
      };

      expect(shouldUseSuggestion(highConfidence)).toBe(true);
      expect(shouldUseSuggestion(lowConfidence)).toBe(false);
    });
  });
});
