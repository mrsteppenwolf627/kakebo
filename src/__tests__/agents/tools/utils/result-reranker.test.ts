import { describe, it, expect } from "vitest";
import {
  calculateRecencyScore,
  inferQueryCategories,
  calculateCategoryMatchScore,
  computeConfidence,
  rerankResults,
} from "@/lib/agents/tools/utils/result-reranker";
import type { SimilarExpense } from "@/lib/ai/embeddings";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const REFERENCE_DATE = "2026-02-20";

function makeExpense(overrides: Partial<SimilarExpense> = {}): SimilarExpense {
  return {
    expense_id: "test-id",
    note: "Test expense",
    amount: 10,
    category: "optional",
    date: "2026-02-15",
    similarity: 0.8,
    ...overrides,
  };
}

// ─── calculateRecencyScore ────────────────────────────────────────────────────

describe("calculateRecencyScore", () => {
  it("returns 1.0 for today", () => {
    const score = calculateRecencyScore(REFERENCE_DATE, {
      referenceDate: REFERENCE_DATE,
    });
    expect(score).toBeCloseTo(1.0, 5);
  });

  it("returns ~0.5 at the half-life boundary", () => {
    // Default half-life is 30 days
    const pastDate = "2026-01-21"; // 30 days before 2026-02-20
    const score = calculateRecencyScore(pastDate, {
      referenceDate: REFERENCE_DATE,
      halfLifeDays: 30,
    });
    expect(score).toBeCloseTo(0.5, 2);
  });

  it("returns ~0.25 at 2× half-life", () => {
    const pastDate = "2025-12-22"; // 60 days before 2026-02-20
    const score = calculateRecencyScore(pastDate, {
      referenceDate: REFERENCE_DATE,
      halfLifeDays: 30,
    });
    expect(score).toBeCloseTo(0.25, 2);
  });

  it("returns a value close to 0 for very old expenses", () => {
    const score = calculateRecencyScore("2020-01-01", {
      referenceDate: REFERENCE_DATE,
    });
    expect(score).toBeLessThan(0.01);
  });

  it("returns 0.5 for invalid dates (graceful degradation)", () => {
    const score = calculateRecencyScore("not-a-date", {
      referenceDate: REFERENCE_DATE,
    });
    expect(score).toBe(0.5);
  });

  it("respects custom half-life days", () => {
    // With halfLifeDays=7, a 7-day-old expense should score ~0.5
    const pastDate = "2026-02-13"; // 7 days before 2026-02-20
    const score = calculateRecencyScore(pastDate, {
      referenceDate: REFERENCE_DATE,
      halfLifeDays: 7,
    });
    expect(score).toBeCloseTo(0.5, 2);
  });

  it("clamps negative time difference to 0 (future dates)", () => {
    // Future date → diffDays clamped to 0 → score = 1.0
    const score = calculateRecencyScore("2026-03-01", {
      referenceDate: REFERENCE_DATE,
    });
    expect(score).toBeCloseTo(1.0, 5);
  });
});

// ─── inferQueryCategories ─────────────────────────────────────────────────────

describe("inferQueryCategories", () => {
  it("maps food queries to survival category", () => {
    const result = inferQueryCategories("cuánto he gastado en comida");
    expect(result).toContain("survival");
    expect(result).toContain("supervivencia");
  });

  it("maps gym queries to optional category", () => {
    const result = inferQueryCategories("gimnasio este mes");
    expect(result).toContain("optional");
    expect(result).toContain("opcional");
  });

  it("maps book queries to culture category", () => {
    const result = inferQueryCategories("gastos en libros");
    expect(result).toContain("culture");
    expect(result).toContain("cultura");
  });

  it("maps transport queries to survival category", () => {
    const result = inferQueryCategories("gastos de transporte");
    expect(result).toContain("survival");
    expect(result).toContain("supervivencia");
  });

  it("maps restaurant queries to optional category", () => {
    const result = inferQueryCategories("restaurantes caros esta semana");
    expect(result).toContain("optional");
    expect(result).toContain("opcional");
  });

  it("returns null for unrecognized queries", () => {
    const result = inferQueryCategories("algún gasto raro");
    expect(result).toBeNull();
  });

  it("is case-insensitive", () => {
    const result = inferQueryCategories("GIMNASIO");
    expect(result).not.toBeNull();
    expect(result).toContain("optional");
  });
});

// ─── calculateCategoryMatchScore ─────────────────────────────────────────────

describe("calculateCategoryMatchScore", () => {
  it("returns 1.0 when expense category matches query intent", () => {
    const score = calculateCategoryMatchScore("survival", ["survival", "supervivencia"]);
    expect(score).toBe(1.0);
  });

  it("returns 1.0 for Spanish form of matching category", () => {
    const score = calculateCategoryMatchScore("supervivencia", ["survival", "supervivencia"]);
    expect(score).toBe(1.0);
  });

  it("returns 0.5 when categories do not match", () => {
    const score = calculateCategoryMatchScore("optional", ["survival", "supervivencia"]);
    expect(score).toBe(0.5);
  });

  it("returns 1.0 when no query categories provided (no penalty)", () => {
    const score = calculateCategoryMatchScore("optional", null);
    expect(score).toBe(1.0);
  });

  it("returns 1.0 for empty query categories array (no penalty)", () => {
    const score = calculateCategoryMatchScore("optional", []);
    expect(score).toBe(1.0);
  });

  it("is case-insensitive", () => {
    const score = calculateCategoryMatchScore("SURVIVAL", ["survival", "supervivencia"]);
    expect(score).toBe(1.0);
  });
});

// ─── computeConfidence ───────────────────────────────────────────────────────

describe("computeConfidence", () => {
  it("returns a score between 0 and 1", () => {
    const expense = makeExpense({ similarity: 0.8, date: "2026-02-01", category: "survival" });
    const { confidence } = computeConfidence(expense, "comida", { queryDate: REFERENCE_DATE });
    expect(confidence).toBeGreaterThanOrEqual(0);
    expect(confidence).toBeLessThanOrEqual(1);
  });

  it("gives higher confidence to recent results with matching category", () => {
    const recent = makeExpense({ similarity: 0.7, date: "2026-02-19", category: "optional" });
    const old = makeExpense({ similarity: 0.7, date: "2024-01-01", category: "optional" });
    const query = "gimnasio";

    const { confidence: confRecent } = computeConfidence(recent, query, {
      queryDate: REFERENCE_DATE,
    });
    const { confidence: confOld } = computeConfidence(old, query, {
      queryDate: REFERENCE_DATE,
    });

    expect(confRecent).toBeGreaterThan(confOld);
  });

  it("gives higher confidence when category matches query intent", () => {
    const matching = makeExpense({ category: "survival", similarity: 0.7, date: "2026-02-15" });
    const nonMatching = makeExpense({ category: "optional", similarity: 0.7, date: "2026-02-15" });
    const query = "supermercado";

    const { confidence: confMatch } = computeConfidence(matching, query, {
      queryDate: REFERENCE_DATE,
    });
    const { confidence: confNoMatch } = computeConfidence(nonMatching, query, {
      queryDate: REFERENCE_DATE,
    });

    expect(confMatch).toBeGreaterThan(confNoMatch);
  });

  it("gives higher confidence to higher similarity scores", () => {
    const highSim = makeExpense({ similarity: 0.9, date: "2026-02-15", category: "optional" });
    const lowSim = makeExpense({ similarity: 0.3, date: "2026-02-15", category: "optional" });
    const query = "algo genérico";

    const { confidence: confHigh } = computeConfidence(highSim, query, {
      queryDate: REFERENCE_DATE,
    });
    const { confidence: confLow } = computeConfidence(lowSim, query, {
      queryDate: REFERENCE_DATE,
    });

    expect(confHigh).toBeGreaterThan(confLow);
  });

  it("includes all three signals in output", () => {
    const expense = makeExpense();
    const { signals } = computeConfidence(expense, "comida", { queryDate: REFERENCE_DATE });

    expect(signals).toHaveProperty("semantic");
    expect(signals).toHaveProperty("recency");
    expect(signals).toHaveProperty("categoryMatch");
  });

  it("normalizes custom weights to sum to 1", () => {
    // Even if weights don't sum to 1, the result should still be in [0, 1]
    const expense = makeExpense({ similarity: 0.8, date: "2026-02-15" });
    const { confidence } = computeConfidence(expense, "comida", {
      queryDate: REFERENCE_DATE,
      weights: { semantic: 3, recency: 1, categoryMatch: 1 },
    });

    expect(confidence).toBeGreaterThanOrEqual(0);
    expect(confidence).toBeLessThanOrEqual(1);
  });
});

// ─── rerankResults ────────────────────────────────────────────────────────────

describe("rerankResults", () => {
  it("returns empty array for empty input", () => {
    const result = rerankResults([], "comida");
    expect(result).toHaveLength(0);
  });

  it("preserves all results", () => {
    const expenses = [
      makeExpense({ expense_id: "a", similarity: 0.8, date: "2026-02-15" }),
      makeExpense({ expense_id: "b", similarity: 0.6, date: "2026-02-10" }),
      makeExpense({ expense_id: "c", similarity: 0.7, date: "2026-02-18" }),
    ];
    const result = rerankResults(expenses, "comida", { queryDate: REFERENCE_DATE });
    expect(result).toHaveLength(3);
  });

  it("adds confidence and signals fields to each result", () => {
    const expenses = [makeExpense({ expense_id: "a" })];
    const result = rerankResults(expenses, "comida", { queryDate: REFERENCE_DATE });

    expect(result[0]).toHaveProperty("confidence");
    expect(result[0]).toHaveProperty("signals");
    expect(result[0].signals).toHaveProperty("semantic");
    expect(result[0].signals).toHaveProperty("recency");
    expect(result[0].signals).toHaveProperty("categoryMatch");
  });

  it("sorts results by confidence (descending)", () => {
    const expenses: SimilarExpense[] = [
      // Old expense, high semantic similarity
      makeExpense({ expense_id: "a", similarity: 0.95, date: "2024-01-01", category: "optional" }),
      // Recent expense, medium similarity, matching category
      makeExpense({ expense_id: "b", similarity: 0.75, date: "2026-02-19", category: "opcional" }),
      // Old expense, low similarity
      makeExpense({ expense_id: "c", similarity: 0.5, date: "2023-06-01", category: "survival" }),
    ];

    const result = rerankResults(expenses, "gimnasio", { queryDate: REFERENCE_DATE });

    // Verify descending confidence order
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].confidence).toBeGreaterThanOrEqual(result[i + 1].confidence);
    }
  });

  it("promotes recent results even with slightly lower similarity", () => {
    const expenses: SimilarExpense[] = [
      // Old but high similarity
      makeExpense({ expense_id: "old", similarity: 0.9, date: "2023-01-01", category: "optional" }),
      // Recent with decent similarity
      makeExpense({ expense_id: "recent", similarity: 0.75, date: "2026-02-18", category: "opcional" }),
    ];

    const result = rerankResults(expenses, "gimnasio", { queryDate: REFERENCE_DATE });

    // Recent should beat old due to recency bonus
    expect(result[0].expense_id).toBe("recent");
  });

  it("preserves original expense fields in output", () => {
    const expense = makeExpense({
      expense_id: "test-123",
      note: "Mercadona",
      amount: 45.50,
      category: "survival",
      date: "2026-02-15",
      similarity: 0.85,
    });

    const result = rerankResults([expense], "supermercado", { queryDate: REFERENCE_DATE });

    expect(result[0].expense_id).toBe("test-123");
    expect(result[0].note).toBe("Mercadona");
    expect(result[0].amount).toBe(45.50);
    expect(result[0].category).toBe("survival");
    expect(result[0].similarity).toBe(0.85);
  });

  it("handles single result without errors", () => {
    const expenses = [makeExpense({ expense_id: "solo" })];
    const result = rerankResults(expenses, "comida", { queryDate: REFERENCE_DATE });

    expect(result).toHaveLength(1);
    expect(result[0].expense_id).toBe("solo");
    expect(result[0].confidence).toBeGreaterThan(0);
  });

  it("correctly applies custom weights", () => {
    // With all weight on recency, more recent expense should always win
    const expenses: SimilarExpense[] = [
      makeExpense({ expense_id: "high-sim", similarity: 0.99, date: "2020-01-01" }),
      makeExpense({ expense_id: "recent", similarity: 0.5, date: "2026-02-19" }),
    ];

    const result = rerankResults(expenses, "any query", {
      queryDate: REFERENCE_DATE,
      weights: { semantic: 0, recency: 1, categoryMatch: 0 },
    });

    expect(result[0].expense_id).toBe("recent");
  });
});
