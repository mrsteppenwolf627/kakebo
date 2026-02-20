import { SupabaseClient } from "@supabase/supabase-js";
import { apiLogger } from "@/lib/logger";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MerchantRuleMetrics {
  total: number;            // All rules learned for this user
  highConfidence: number;   // Rules with confidence >= 0.9 (explicit corrections)
  avgConfidence: number;    // Average confidence across all rules
  addedThisWeek: number;    // New rules in the last 7 days
  addedLastWeek: number;    // Rules in the 7 days prior (for trend comparison)
  velocityTrend: "improving" | "stable" | "declining";
}

export interface CorrectionExampleMetrics {
  total: number;           // Total examples stored
  totalUsages: number;     // Cumulative uses in few-shot prompts
  avgUsages: number;       // Average uses per example
  addedThisWeek: number;   // New examples this week
  topMisclassifications: Array<{
    from: string;
    to: string;
    count: number;
  }>;
}

export interface SearchFeedbackMetrics {
  total: number;              // Total feedback entries
  correctCount: number;       // Marked as "correct" by user
  incorrectCount: number;     // Marked as "incorrect" by user
  precision: number;          // correct / total * 100 (100 if no feedback yet)
  addedThisWeek: number;      // Feedback submitted this week
  topQueriesWithIssues: Array<{
    query: string;
    incorrectCount: number;
  }>;
}

/**
 * Aggregated metrics for the AI learning subsystems (P1-1, P1-2, search feedback).
 * Complements AIMetrics (which tracks ai_logs: cost, tokens, latency, accuracy).
 */
export interface LearningMetrics {
  period: string;
  merchantRules: MerchantRuleMetrics;
  correctionExamples: CorrectionExampleMetrics;
  searchFeedback: SearchFeedbackMetrics;
  /**
   * Composite score (0–100) indicating overall learning health.
   *
   * Formula:
   *   40% merchant rule coverage  — min(total / 10, 1) × 100
   *   35% search precision        — feedback.precision
   *   25% example usage activity  — min(totalUsages / 20, 1) × 100
   */
  overallLearningScore: number;
  generatedAt: string;
}

// ─── Individual queries ───────────────────────────────────────────────────────

async function getMerchantRuleMetrics(
  supabase: SupabaseClient,
  userId: string,
  weekAgo: string,
  twoWeeksAgo: string
): Promise<MerchantRuleMetrics> {
  try {
    const { data, error } = await supabase
      .from("merchant_rules")
      .select("confidence, created_at")
      .eq("user_id", userId);

    if (error || !data) {
      apiLogger.warn({ error }, "Failed to fetch merchant_rules metrics");
      return emptyMerchantRuleMetrics();
    }

    const total = data.length;
    const highConfidence = data.filter((r) => r.confidence >= 0.9).length;
    const avgConfidence =
      total > 0 ? data.reduce((s, r) => s + r.confidence, 0) / total : 0;

    const addedThisWeek = data.filter((r) => r.created_at >= weekAgo).length;
    const addedLastWeek = data.filter(
      (r) => r.created_at >= twoWeeksAgo && r.created_at < weekAgo
    ).length;

    const velocityTrend: MerchantRuleMetrics["velocityTrend"] =
      addedThisWeek > addedLastWeek
        ? "improving"
        : addedThisWeek < addedLastWeek
        ? "declining"
        : "stable";

    return {
      total,
      highConfidence,
      avgConfidence: Math.round(avgConfidence * 100) / 100,
      addedThisWeek,
      addedLastWeek,
      velocityTrend,
    };
  } catch (err) {
    apiLogger.warn({ err }, "Error fetching merchant_rules metrics");
    return emptyMerchantRuleMetrics();
  }
}

async function getCorrectionExampleMetrics(
  supabase: SupabaseClient,
  userId: string,
  weekAgo: string
): Promise<CorrectionExampleMetrics> {
  try {
    const { data, error } = await supabase
      .from("correction_examples")
      .select("old_category, new_category, times_used, created_at")
      .eq("user_id", userId);

    if (error || !data) {
      apiLogger.warn({ error }, "Failed to fetch correction_examples metrics");
      return emptyCorrectionExampleMetrics();
    }

    const total = data.length;
    const totalUsages = data.reduce((s, e) => s + (e.times_used || 0), 0);
    const avgUsages = total > 0 ? totalUsages / total : 0;
    const addedThisWeek = data.filter((e) => e.created_at >= weekAgo).length;

    // Count category correction pairs
    const pairCounts = new Map<string, number>();
    for (const example of data) {
      const key = `${example.old_category}→${example.new_category}`;
      pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
    }

    const topMisclassifications = Array.from(pairCounts.entries())
      .map(([key, count]) => {
        const [from, to] = key.split("→");
        return { from, to, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      total,
      totalUsages,
      avgUsages: Math.round(avgUsages * 10) / 10,
      addedThisWeek,
      topMisclassifications,
    };
  } catch (err) {
    apiLogger.warn({ err }, "Error fetching correction_examples metrics");
    return emptyCorrectionExampleMetrics();
  }
}

async function getSearchFeedbackMetrics(
  supabase: SupabaseClient,
  userId: string,
  weekAgo: string
): Promise<SearchFeedbackMetrics> {
  try {
    const { data, error } = await supabase
      .from("search_feedback")
      .select("query, feedback_type, created_at")
      .eq("user_id", userId);

    if (error || !data) {
      apiLogger.warn({ error }, "Failed to fetch search_feedback metrics");
      return emptySearchFeedbackMetrics();
    }

    const total = data.length;
    const correctCount = data.filter((f) => f.feedback_type === "correct").length;
    const incorrectCount = data.filter((f) => f.feedback_type === "incorrect").length;
    const precision = total > 0 ? Math.round((correctCount / total) * 100) : 100;
    const addedThisWeek = data.filter((f) => f.created_at >= weekAgo).length;

    // Count incorrect feedback per query
    const incorrectByQuery = new Map<string, number>();
    for (const f of data) {
      if (f.feedback_type === "incorrect") {
        incorrectByQuery.set(f.query, (incorrectByQuery.get(f.query) || 0) + 1);
      }
    }

    const topQueriesWithIssues = Array.from(incorrectByQuery.entries())
      .map(([query, incorrectCount]) => ({ query, incorrectCount }))
      .sort((a, b) => b.incorrectCount - a.incorrectCount)
      .slice(0, 5);

    return {
      total,
      correctCount,
      incorrectCount,
      precision,
      addedThisWeek,
      topQueriesWithIssues,
    };
  } catch (err) {
    apiLogger.warn({ err }, "Error fetching search_feedback metrics");
    return emptySearchFeedbackMetrics();
  }
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

/**
 * Computes a composite learning score from 0 to 100.
 *
 * Weights:
 *   40% merchant rule coverage — min(total / 10, 1) × 100
 *   35% search precision       — feedback.precision (already 0-100)
 *   25% example usage activity — min(totalUsages / 20, 1) × 100
 */
export function calculateLearningScore(
  rules: MerchantRuleMetrics,
  examples: CorrectionExampleMetrics,
  feedback: SearchFeedbackMetrics
): number {
  const ruleCoverage = Math.min(rules.total / 10, 1) * 100;
  const searchPrecision = feedback.precision; // already 0-100
  const exampleActivity = Math.min(examples.totalUsages / 20, 1) * 100;

  const score = 0.4 * ruleCoverage + 0.35 * searchPrecision + 0.25 * exampleActivity;
  return Math.round(score);
}

// ─── Main function ────────────────────────────────────────────────────────────

/**
 * Get aggregated learning metrics for the AI learning subsystems.
 *
 * Queries in parallel:
 *   - merchant_rules  (P1-1)
 *   - correction_examples (P1-2)
 *   - search_feedback
 *
 * Each sub-query fails gracefully — a single table error returns
 * empty metrics for that section, not an overall failure.
 */
export async function getLearningMetrics(
  supabase: SupabaseClient,
  userId: string
): Promise<LearningMetrics> {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const weekAgoIso = weekAgo.toISOString();
  const twoWeeksAgoIso = twoWeeksAgo.toISOString();

  // Run all three queries in parallel
  const [merchantRules, correctionExamples, searchFeedback] = await Promise.all([
    getMerchantRuleMetrics(supabase, userId, weekAgoIso, twoWeeksAgoIso),
    getCorrectionExampleMetrics(supabase, userId, weekAgoIso),
    getSearchFeedbackMetrics(supabase, userId, weekAgoIso),
  ]);

  const overallLearningScore = calculateLearningScore(
    merchantRules,
    correctionExamples,
    searchFeedback
  );

  apiLogger.info(
    {
      userId,
      merchantRulesTotal: merchantRules.total,
      correctionExamplesTotal: correctionExamples.total,
      searchFeedbackTotal: searchFeedback.total,
      overallLearningScore,
    },
    "Learning metrics computed (P2-3)"
  );

  return {
    period: `${twoWeeksAgoIso.split("T")[0]} to ${now.toISOString().split("T")[0]}`,
    merchantRules,
    correctionExamples,
    searchFeedback,
    overallLearningScore,
    generatedAt: now.toISOString(),
  };
}

// ─── Empty defaults ───────────────────────────────────────────────────────────

function emptyMerchantRuleMetrics(): MerchantRuleMetrics {
  return {
    total: 0,
    highConfidence: 0,
    avgConfidence: 0,
    addedThisWeek: 0,
    addedLastWeek: 0,
    velocityTrend: "stable",
  };
}

function emptyCorrectionExampleMetrics(): CorrectionExampleMetrics {
  return {
    total: 0,
    totalUsages: 0,
    avgUsages: 0,
    addedThisWeek: 0,
    topMisclassifications: [],
  };
}

function emptySearchFeedbackMetrics(): SearchFeedbackMetrics {
  return {
    total: 0,
    correctCount: 0,
    incorrectCount: 0,
    precision: 100, // No data → assume perfect
    addedThisWeek: 0,
    topQueriesWithIssues: [],
  };
}
