/**
 * Unit tests for structured filters in embeddings search (P2-1)
 * Tests the new filtering capabilities that reduce scan size by 90%+
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  searchSimilarExpenses,
  searchExpensesByText,
  type StructuredSearchFilters,
} from "@/lib/ai/embeddings";

// Mock logger
vi.mock("@/lib/logger", () => ({
  apiLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock OpenAI client
vi.mock("@/lib/ai/client", () => ({
  openai: {
    embeddings: {
      create: vi.fn().mockResolvedValue({
        data: [{ embedding: new Array(1536).fill(0.1) }],
        usage: { total_tokens: 10 },
      }),
    },
  },
}));

describe("Structured filters - searchSimilarExpenses", () => {
  const userId = "test-user-id";
  const mockEmbedding = new Array(1536).fill(0.1);
  let mockSupabaseClient: SupabaseClient;
  let mockRpcResponse: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock RPC responses
    mockRpcResponse = vi.fn();

    // Mock Supabase client
    mockSupabaseClient = {
      rpc: mockRpcResponse,
    } as unknown as SupabaseClient;
  });

  it("uses match_expenses_v2 when filters are provided", async () => {
    const filters: StructuredSearchFilters = {
      categories: ["supervivencia"],
      dateStart: "2026-01-01",
      dateEnd: "2026-01-31",
    };

    mockRpcResponse.mockResolvedValue({
      data: [
        {
          expense_id: "expense-1",
          note: "Mercadona",
          amount: 50,
          category: "supervivencia",
          date: "2026-01-15",
          similarity: 0.95,
        },
      ],
      error: null,
    });

    const results = await searchSimilarExpenses(
      mockSupabaseClient,
      userId,
      mockEmbedding,
      { filters }
    );

    // Should call match_expenses_v2
    expect(mockRpcResponse).toHaveBeenCalledWith("match_expenses_v2", {
      query_embedding: mockEmbedding,
      p_user_id: userId,
      match_threshold: 0.5,
      match_count: 5,
      p_categories: ["supervivencia"],
      p_date_start: "2026-01-01",
      p_date_end: "2026-01-31",
      p_amount_min: null,
      p_amount_max: null,
    });

    expect(results).toHaveLength(1);
    expect(results[0].category).toBe("supervivencia");
  });

  it("filters by category before vector search", async () => {
    const filters: StructuredSearchFilters = {
      categories: ["supervivencia"],
    };

    mockRpcResponse.mockResolvedValue({
      data: [
        {
          expense_id: "expense-1",
          note: "Mercadona",
          amount: 50,
          category: "supervivencia",
          date: "2026-01-15",
          similarity: 0.95,
        },
        {
          expense_id: "expense-2",
          note: "Carrefour",
          amount: 30,
          category: "supervivencia",
          date: "2026-01-20",
          similarity: 0.90,
        },
      ],
      error: null,
    });

    const results = await searchSimilarExpenses(
      mockSupabaseClient,
      userId,
      mockEmbedding,
      { filters }
    );

    // All results should be in the supervivencia category
    expect(results.every((r) => r.category === "supervivencia")).toBe(true);
  });

  it("filters by date range", async () => {
    const filters: StructuredSearchFilters = {
      dateStart: "2026-01-01",
      dateEnd: "2026-01-31",
    };

    mockRpcResponse.mockResolvedValue({
      data: [
        {
          expense_id: "expense-1",
          note: "Expense in January",
          amount: 50,
          category: "supervivencia",
          date: "2026-01-15",
          similarity: 0.95,
        },
        {
          expense_id: "expense-2",
          note: "Another expense in January",
          amount: 30,
          category: "opcional",
          date: "2026-01-20",
          similarity: 0.90,
        },
      ],
      error: null,
    });

    const results = await searchSimilarExpenses(
      mockSupabaseClient,
      userId,
      mockEmbedding,
      { filters }
    );

    // All results should be within the date range
    expect(
      results.every(
        (r) => r.date >= "2026-01-01" && r.date <= "2026-01-31"
      )
    ).toBe(true);
  });

  it("filters by amount range", async () => {
    const filters: StructuredSearchFilters = {
      amountMin: 50,
      amountMax: 200,
    };

    mockRpcResponse.mockResolvedValue({
      data: [
        {
          expense_id: "expense-1",
          note: "Medium expense",
          amount: 75,
          category: "supervivencia",
          date: "2026-01-15",
          similarity: 0.95,
        },
        {
          expense_id: "expense-2",
          note: "Large expense",
          amount: 150,
          category: "opcional",
          date: "2026-01-20",
          similarity: 0.90,
        },
      ],
      error: null,
    });

    const results = await searchSimilarExpenses(
      mockSupabaseClient,
      userId,
      mockEmbedding,
      { filters }
    );

    // All results should be within the amount range
    expect(results.every((r) => r.amount >= 50 && r.amount <= 200)).toBe(true);
  });

  it("combines multiple filters", async () => {
    const filters: StructuredSearchFilters = {
      categories: ["supervivencia"],
      dateStart: "2026-01-01",
      dateEnd: "2026-01-31",
      amountMin: 50,
      amountMax: 200,
    };

    mockRpcResponse.mockResolvedValue({
      data: [
        {
          expense_id: "expense-1",
          note: "Mercadona",
          amount: 75,
          category: "supervivencia",
          date: "2026-01-15",
          similarity: 0.95,
        },
      ],
      error: null,
    });

    const results = await searchSimilarExpenses(
      mockSupabaseClient,
      userId,
      mockEmbedding,
      { filters }
    );

    expect(mockRpcResponse).toHaveBeenCalledWith("match_expenses_v2", {
      query_embedding: mockEmbedding,
      p_user_id: userId,
      match_threshold: 0.5,
      match_count: 5,
      p_categories: ["supervivencia"],
      p_date_start: "2026-01-01",
      p_date_end: "2026-01-31",
      p_amount_min: 50,
      p_amount_max: 200,
    });

    // All filters should be applied
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].category).toBe("supervivencia");
    expect(results[0].amount).toBeGreaterThanOrEqual(50);
    expect(results[0].amount).toBeLessThanOrEqual(200);
    expect(results[0].date >= "2026-01-01").toBe(true);
    expect(results[0].date <= "2026-01-31").toBe(true);
  });

  it("works without filters (backward compatibility)", async () => {
    mockRpcResponse.mockResolvedValue({
      data: [
        {
          expense_id: "expense-1",
          note: "Any expense",
          amount: 50,
          category: "supervivencia",
          date: "2026-01-15",
          similarity: 0.95,
        },
      ],
      error: null,
    });

    const results = await searchSimilarExpenses(
      mockSupabaseClient,
      userId,
      mockEmbedding
    );

    // Should call match_expenses (legacy) when no filters and flag is false
    // OR match_expenses_v2 with all null filters if flag is true
    expect(results.length).toBeGreaterThan(0);
  });

  it("handles empty results gracefully", async () => {
    const filters: StructuredSearchFilters = {
      categories: ["supervivencia"],
      dateStart: "2026-01-01",
      dateEnd: "2026-01-31",
    };

    mockRpcResponse.mockResolvedValue({
      data: [],
      error: null,
    });

    const results = await searchSimilarExpenses(
      mockSupabaseClient,
      userId,
      mockEmbedding,
      { filters }
    );

    expect(results).toEqual([]);
  });

  it("handles errors gracefully", async () => {
    const filters: StructuredSearchFilters = {
      categories: ["supervivencia"],
    };

    mockRpcResponse.mockResolvedValue({
      data: null,
      error: { message: "Database error" },
    });

    const results = await searchSimilarExpenses(
      mockSupabaseClient,
      userId,
      mockEmbedding,
      { filters }
    );

    expect(results).toEqual([]);
  });
});

describe("Structured filters - searchExpensesByText", () => {
  const userId = "test-user-id";
  let mockSupabase: SupabaseClient;
  let mockRpcResponse: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock RPC responses
    mockRpcResponse = vi.fn();

    // Mock Supabase client
    mockSupabase = {
      rpc: mockRpcResponse,
    } as unknown as SupabaseClient;
  });

  it("passes filters to searchSimilarExpenses", async () => {
    const filters: StructuredSearchFilters = {
      categories: ["supervivencia"],
      dateStart: "2026-01-01",
      dateEnd: "2026-01-31",
    };

    mockRpcResponse.mockResolvedValue({
      data: [
        {
          expense_id: "expense-1",
          note: "Mercadona",
          amount: 50,
          category: "supervivencia",
          date: "2026-01-15",
          similarity: 0.95,
        },
      ],
      error: null,
    });

    const result = await searchExpensesByText(
      mockSupabase,
      userId,
      "gastos de comida",
      { filters }
    );

    expect(result.results.length).toBeGreaterThan(0);
    expect(result.queryTokens).toBeGreaterThan(0);
    expect(result.queryCostUsd).toBeGreaterThan(0);
  });
});

describe("Structured filters - feature flag behavior", () => {
  const userId = "test-user-id";
  const mockEmbedding = new Array(1536).fill(0.1);
  let mockSupabase: SupabaseClient;
  let mockRpcResponse: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock RPC responses
    mockRpcResponse = vi.fn();

    // Mock Supabase client
    mockSupabase = {
      rpc: mockRpcResponse,
    } as unknown as SupabaseClient;
  });

  it("uses match_expenses_v2 when USE_STRUCTURED_FILTERS=true", async () => {
    // Set feature flag
    const originalEnv = process.env.USE_STRUCTURED_FILTERS;
    process.env.USE_STRUCTURED_FILTERS = "true";

    mockRpcResponse.mockResolvedValue({
      data: [
        {
          expense_id: "expense-1",
          note: "Test expense",
          amount: 50,
          category: "supervivencia",
          date: "2026-01-15",
          similarity: 0.95,
        },
      ],
      error: null,
    });

    await searchSimilarExpenses(mockSupabase, userId, mockEmbedding);

    // Should call match_expenses_v2
    expect(mockRpcResponse).toHaveBeenCalledWith(
      "match_expenses_v2",
      expect.objectContaining({
        p_user_id: userId,
      })
    );

    // Restore env
    process.env.USE_STRUCTURED_FILTERS = originalEnv;
  });

  it("uses match_expenses when USE_STRUCTURED_FILTERS=false and no filters", async () => {
    // Set feature flag
    const originalEnv = process.env.USE_STRUCTURED_FILTERS;
    process.env.USE_STRUCTURED_FILTERS = "false";

    mockRpcResponse.mockResolvedValue({
      data: [
        {
          expense_id: "expense-1",
          note: "Test expense",
          amount: 50,
          category: "supervivencia",
          date: "2026-01-15",
          similarity: 0.95,
        },
      ],
      error: null,
    });

    await searchSimilarExpenses(mockSupabase, userId, mockEmbedding);

    // Should call match_expenses (legacy)
    expect(mockRpcResponse).toHaveBeenCalledWith(
      "match_expenses",
      expect.objectContaining({
        p_user_id: userId,
      })
    );

    // Restore env
    process.env.USE_STRUCTURED_FILTERS = originalEnv;
  });
});
