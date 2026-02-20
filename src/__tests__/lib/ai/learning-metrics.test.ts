/**
 * Tests for P2-3: Learning Metrics System
 *
 * Validates that learning metrics are correctly computed from
 * merchant_rules, correction_examples, and search_feedback tables.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getLearningMetrics,
  calculateLearningScore,
  type MerchantRuleMetrics,
  type CorrectionExampleMetrics,
  type SearchFeedbackMetrics,
} from "@/lib/ai/learning-metrics";
import type { SupabaseClient } from "@supabase/supabase-js";

// ─── Logger mock ──────────────────────────────────────────────────────────────

vi.mock("@/lib/logger", () => ({
  apiLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build an ISO timestamp N days ago from a reference date */
function daysAgo(days: number, from = "2026-02-20"): string {
  const d = new Date(from);
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

const NOW_ISO = "2026-02-20T00:00:00.000Z";

function makeSupabaseMock(tableData: Record<string, unknown[]>): SupabaseClient {
  return {
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: tableData[table] ?? [],
          error: null,
        })),
      })),
    })),
  } as unknown as SupabaseClient;
}

// ─── calculateLearningScore ───────────────────────────────────────────────────

describe("calculateLearningScore", () => {
  const makeRules = (overrides: Partial<MerchantRuleMetrics> = {}): MerchantRuleMetrics => ({
    total: 0,
    highConfidence: 0,
    avgConfidence: 0,
    addedThisWeek: 0,
    addedLastWeek: 0,
    velocityTrend: "stable",
    ...overrides,
  });

  const makeExamples = (
    overrides: Partial<CorrectionExampleMetrics> = {}
  ): CorrectionExampleMetrics => ({
    total: 0,
    totalUsages: 0,
    avgUsages: 0,
    addedThisWeek: 0,
    topMisclassifications: [],
    ...overrides,
  });

  const makeFeedback = (
    overrides: Partial<SearchFeedbackMetrics> = {}
  ): SearchFeedbackMetrics => ({
    total: 0,
    correctCount: 0,
    incorrectCount: 0,
    precision: 100,
    addedThisWeek: 0,
    topQueriesWithIssues: [],
    ...overrides,
  });

  it("returns 35 for a new user with no data (precision defaults to 100)", () => {
    // 40% * 0 (no rules) + 35% * 100 (perfect precision) + 25% * 0 (no usage)
    const score = calculateLearningScore(makeRules(), makeExamples(), makeFeedback());
    expect(score).toBe(35);
  });

  it("returns 100 for a fully trained system", () => {
    // 40% * 100 (10+ rules) + 35% * 100 (perfect precision) + 25% * 100 (20+ usages)
    const score = calculateLearningScore(
      makeRules({ total: 10 }),
      makeExamples({ totalUsages: 20 }),
      makeFeedback({ precision: 100 })
    );
    expect(score).toBe(100);
  });

  it("gives 0 for a system with bad precision and no learning", () => {
    const score = calculateLearningScore(
      makeRules({ total: 0 }),
      makeExamples({ totalUsages: 0 }),
      makeFeedback({ precision: 0 })
    );
    expect(score).toBe(0);
  });

  it("caps rule coverage at 100% for more than 10 rules", () => {
    const score = calculateLearningScore(
      makeRules({ total: 50 }), // Way more than target of 10
      makeExamples({ totalUsages: 0 }),
      makeFeedback({ precision: 0 })
    );
    // 40% * 100 + 35% * 0 + 25% * 0 = 40
    expect(score).toBe(40);
  });

  it("caps example usage at 100% for more than 20 usages", () => {
    const score = calculateLearningScore(
      makeRules({ total: 0 }),
      makeExamples({ totalUsages: 999 }),
      makeFeedback({ precision: 0 })
    );
    // 40% * 0 + 35% * 0 + 25% * 100 = 25
    expect(score).toBe(25);
  });

  it("reflects partial learning correctly", () => {
    // 5 rules = 50% coverage, precision = 80%, 10 usages = 50% activity
    // 0.40 * 50 + 0.35 * 80 + 0.25 * 50 = 20 + 28 + 12.5 = 60.5 → rounds to 61
    const score = calculateLearningScore(
      makeRules({ total: 5 }),
      makeExamples({ totalUsages: 10 }),
      makeFeedback({ precision: 80 })
    );
    expect(score).toBe(61);
  });
});

// ─── getLearningMetrics (integration-level with mocked Supabase) ──────────────

describe("getLearningMetrics", () => {
  const userId = "user-abc";

  it("returns all zero metrics for empty tables", async () => {
    const supabase = makeSupabaseMock({
      merchant_rules: [],
      correction_examples: [],
      search_feedback: [],
    });

    const metrics = await getLearningMetrics(supabase, userId);

    expect(metrics.merchantRules.total).toBe(0);
    expect(metrics.correctionExamples.total).toBe(0);
    expect(metrics.searchFeedback.total).toBe(0);
    expect(metrics.searchFeedback.precision).toBe(100); // Default when no data
    expect(metrics.overallLearningScore).toBe(35); // 35% from default precision
  });

  it("correctly counts merchant rules", async () => {
    const supabase = makeSupabaseMock({
      merchant_rules: [
        { confidence: 1.0, created_at: daysAgo(1) }, // This week, high confidence
        { confidence: 0.8, created_at: daysAgo(3) }, // This week, medium
        { confidence: 1.0, created_at: daysAgo(10) }, // Last week
      ],
      correction_examples: [],
      search_feedback: [],
    });

    const metrics = await getLearningMetrics(supabase, userId);

    expect(metrics.merchantRules.total).toBe(3);
    expect(metrics.merchantRules.highConfidence).toBe(2); // confidence >= 0.9
    expect(metrics.merchantRules.addedThisWeek).toBe(2); // within 7 days
    expect(metrics.merchantRules.addedLastWeek).toBe(1); // between 14 and 7 days
    expect(metrics.merchantRules.avgConfidence).toBeCloseTo((1.0 + 0.8 + 1.0) / 3, 2);
  });

  it("detects improving velocity trend", async () => {
    const supabase = makeSupabaseMock({
      merchant_rules: [
        { confidence: 1.0, created_at: daysAgo(1) },  // This week
        { confidence: 1.0, created_at: daysAgo(2) },  // This week
        { confidence: 1.0, created_at: daysAgo(8) },  // Last week (only 1)
      ],
      correction_examples: [],
      search_feedback: [],
    });

    const metrics = await getLearningMetrics(supabase, userId);

    expect(metrics.merchantRules.addedThisWeek).toBe(2);
    expect(metrics.merchantRules.addedLastWeek).toBe(1);
    expect(metrics.merchantRules.velocityTrend).toBe("improving");
  });

  it("detects declining velocity trend", async () => {
    const supabase = makeSupabaseMock({
      merchant_rules: [
        { confidence: 1.0, created_at: daysAgo(1) },  // This week (only 1)
        { confidence: 1.0, created_at: daysAgo(8) },  // Last week
        { confidence: 1.0, created_at: daysAgo(10) }, // Last week
      ],
      correction_examples: [],
      search_feedback: [],
    });

    const metrics = await getLearningMetrics(supabase, userId);

    expect(metrics.merchantRules.velocityTrend).toBe("declining");
  });

  it("correctly counts correction examples and usages", async () => {
    const supabase = makeSupabaseMock({
      merchant_rules: [],
      correction_examples: [
        {
          old_category: "opcional",
          new_category: "supervivencia",
          times_used: 5,
          created_at: daysAgo(2),
        },
        {
          old_category: "opcional",
          new_category: "supervivencia",
          times_used: 3,
          created_at: daysAgo(2),
        },
        {
          old_category: "supervivencia",
          new_category: "cultura",
          times_used: 2,
          created_at: daysAgo(20), // Older than this week
        },
      ],
      search_feedback: [],
    });

    const metrics = await getLearningMetrics(supabase, userId);

    expect(metrics.correctionExamples.total).toBe(3);
    expect(metrics.correctionExamples.totalUsages).toBe(10);
    expect(metrics.correctionExamples.avgUsages).toBeCloseTo(10 / 3, 1);
    expect(metrics.correctionExamples.addedThisWeek).toBe(2);
  });

  it("computes top misclassifications from correction examples", async () => {
    const supabase = makeSupabaseMock({
      merchant_rules: [],
      correction_examples: [
        { old_category: "opcional", new_category: "supervivencia", times_used: 0, created_at: daysAgo(1) },
        { old_category: "opcional", new_category: "supervivencia", times_used: 0, created_at: daysAgo(2) },
        { old_category: "supervivencia", new_category: "cultura", times_used: 0, created_at: daysAgo(3) },
        { old_category: "opcional", new_category: "supervivencia", times_used: 0, created_at: daysAgo(4) },
      ],
      search_feedback: [],
    });

    const metrics = await getLearningMetrics(supabase, userId);

    const top = metrics.correctionExamples.topMisclassifications[0];
    expect(top.from).toBe("opcional");
    expect(top.to).toBe("supervivencia");
    expect(top.count).toBe(3);
  });

  it("correctly computes search feedback precision", async () => {
    const supabase = makeSupabaseMock({
      merchant_rules: [],
      correction_examples: [],
      search_feedback: [
        { query: "vicios", feedback_type: "correct", created_at: daysAgo(1) },
        { query: "vicios", feedback_type: "correct", created_at: daysAgo(2) },
        { query: "vicios", feedback_type: "incorrect", created_at: daysAgo(3) },
        { query: "comida", feedback_type: "correct", created_at: daysAgo(4) },
      ],
    });

    const metrics = await getLearningMetrics(supabase, userId);

    expect(metrics.searchFeedback.total).toBe(4);
    expect(metrics.searchFeedback.correctCount).toBe(3);
    expect(metrics.searchFeedback.incorrectCount).toBe(1);
    expect(metrics.searchFeedback.precision).toBe(75); // 3/4 * 100
  });

  it("returns precision=100 when there is no feedback", async () => {
    const supabase = makeSupabaseMock({
      merchant_rules: [],
      correction_examples: [],
      search_feedback: [],
    });

    const metrics = await getLearningMetrics(supabase, userId);

    expect(metrics.searchFeedback.precision).toBe(100);
  });

  it("identifies top queries with issues", async () => {
    const supabase = makeSupabaseMock({
      merchant_rules: [],
      correction_examples: [],
      search_feedback: [
        { query: "vicios", feedback_type: "incorrect", created_at: daysAgo(1) },
        { query: "vicios", feedback_type: "incorrect", created_at: daysAgo(2) },
        { query: "comida", feedback_type: "incorrect", created_at: daysAgo(3) },
        { query: "gym", feedback_type: "correct", created_at: daysAgo(4) },
      ],
    });

    const metrics = await getLearningMetrics(supabase, userId);

    const topIssue = metrics.searchFeedback.topQueriesWithIssues[0];
    expect(topIssue.query).toBe("vicios");
    expect(topIssue.incorrectCount).toBe(2);
  });

  it("returns a valid overall learning score between 0 and 100", async () => {
    const supabase = makeSupabaseMock({
      merchant_rules: [
        { confidence: 1.0, created_at: daysAgo(1) },
        { confidence: 0.9, created_at: daysAgo(5) },
      ],
      correction_examples: [
        { old_category: "opcional", new_category: "supervivencia", times_used: 8, created_at: daysAgo(2) },
      ],
      search_feedback: [
        { query: "comida", feedback_type: "correct", created_at: daysAgo(1) },
        { query: "comida", feedback_type: "correct", created_at: daysAgo(2) },
      ],
    });

    const metrics = await getLearningMetrics(supabase, userId);

    expect(metrics.overallLearningScore).toBeGreaterThanOrEqual(0);
    expect(metrics.overallLearningScore).toBeLessThanOrEqual(100);
  });

  it("includes period and generatedAt fields", async () => {
    const supabase = makeSupabaseMock({
      merchant_rules: [],
      correction_examples: [],
      search_feedback: [],
    });

    const metrics = await getLearningMetrics(supabase, userId);

    expect(metrics.period).toBeTruthy();
    expect(metrics.period).toContain("to");
    expect(metrics.generatedAt).toBeTruthy();
    expect(new Date(metrics.generatedAt).getTime()).not.toBeNaN();
  });

  it("handles supabase errors gracefully — returns empty metrics per table", async () => {
    // All queries return errors
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            data: null,
            error: new Error("Database error"),
          })),
        })),
      })),
    } as unknown as SupabaseClient;

    const metrics = await getLearningMetrics(supabase, userId);

    // Should not throw — returns zeros
    expect(metrics.merchantRules.total).toBe(0);
    expect(metrics.correctionExamples.total).toBe(0);
    expect(metrics.searchFeedback.total).toBe(0);
    expect(metrics.searchFeedback.precision).toBe(100);
  });
});
