import { SupabaseClient } from "@supabase/supabase-js";
import { apiLogger } from "@/lib/logger";

/**
 * Parameters for spending pattern analysis
 */
export interface AnalyzeSpendingPatternParams {
  category?: "survival" | "optional" | "culture" | "extra" | "all";
  period?: "current_month" | "last_month" | "last_3_months" | "last_6_months";
  groupBy?: "day" | "week" | "month";
}

/**
 * Result of spending pattern analysis
 */
export interface SpendingPatternResult {
  category: string;
  period: string;
  totalAmount: number;
  averagePerPeriod: number;
  trend: "increasing" | "decreasing" | "stable";
  trendPercentage: number;
  topExpenses: Array<{
    concept: string;
    amount: number;
    date: string;
  }>;
  insights: string[];
}

/**
 * Calculate date range for period
 */
function getPeriodDates(period: string): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString().split("T")[0];
  let start: Date;

  switch (period) {
    case "current_month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "last_month":
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      break;
    case "last_3_months":
      start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      break;
    case "last_6_months":
      start = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return {
    start: start.toISOString().split("T")[0],
    end,
  };
}

/**
 * Calculate trend from amounts over time
 */
function calculateTrend(amounts: number[]): {
  trend: "increasing" | "decreasing" | "stable";
  percentage: number;
} {
  if (amounts.length < 2) {
    return { trend: "stable", percentage: 0 };
  }

  // Simple linear regression
  const n = amounts.length;
  const indices = Array.from({ length: n }, (_, i) => i);
  const sumX = indices.reduce((a, b) => a + b, 0);
  const sumY = amounts.reduce((a, b) => a + b, 0);
  const sumXY = indices.reduce((sum, x, i) => sum + x * amounts[i], 0);
  const sumX2 = indices.reduce((sum, x) => sum + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const average = sumY / n;

  // Calculate percentage change
  const percentage = average !== 0 ? (slope / average) * 100 : 0;

  if (Math.abs(percentage) < 5) {
    return { trend: "stable", percentage: 0 };
  }

  return {
    trend: slope > 0 ? "increasing" : "decreasing",
    percentage: Math.abs(percentage),
  };
}

/**
 * Generate insights based on analysis
 */
function generateInsights(
  totalAmount: number,
  trend: string,
  trendPercentage: number,
  topExpenses: Array<{ concept: string; amount: number; date: string }>,
  category: string
): string[] {
  const insights: string[] = [];

  // Trend insight
  if (trend === "increasing" && trendPercentage > 10) {
    insights.push(
      `Tus gastos en ${category} están aumentando un ${trendPercentage.toFixed(1)}% en este período`
    );
  } else if (trend === "decreasing" && trendPercentage > 10) {
    insights.push(
      `Tus gastos en ${category} están disminuyendo un ${trendPercentage.toFixed(1)}% - ¡bien hecho!`
    );
  }

  // Top expense insight
  if (topExpenses.length > 0) {
    const topExpense = topExpenses[0];
    const percentageOfTotal = (topExpense.amount / totalAmount) * 100;
    if (percentageOfTotal > 20) {
      insights.push(
        `"${topExpense.concept}" representa el ${percentageOfTotal.toFixed(1)}% del total en esta categoría`
      );
    }
  }

  // Frequency insight
  if (topExpenses.length > 5) {
    insights.push(
      `Tienes ${topExpenses.length} gastos registrados en esta categoría`
    );
  }

  return insights;
}

/**
 * Analyze spending patterns for a category and period
 */
export async function analyzeSpendingPattern(
  supabase: SupabaseClient,
  userId: string,
  params: AnalyzeSpendingPatternParams
): Promise<SpendingPatternResult> {
  const category = params.category || "all";
  const period = params.period || "current_month";
  const { start, end } = getPeriodDates(period);

  try {
    // Query expenses
    let query = supabase
      .from("expenses")
      .select("note, amount, date")
      .eq("user_id", userId)
      .gte("date", start)
      .lte("date", end);

    if (category !== "all") {
      query = query.eq("category", category);
    }

    query = query.order("amount", { ascending: false });

    const { data: expenses, error } = await query;

    if (error) {
      apiLogger.error({ error }, "Error fetching expenses for analysis");
      throw error;
    }

    if (!expenses || expenses.length === 0) {
      return {
        category,
        period,
        totalAmount: 0,
        averagePerPeriod: 0,
        trend: "stable",
        trendPercentage: 0,
        topExpenses: [],
        insights: ["No hay gastos registrados en este período"],
      };
    }

    // Calculate metrics
    const totalAmount = expenses.reduce(
      (sum, exp) => sum + (exp.amount || 0),
      0
    );
    const averagePerPeriod = totalAmount / expenses.length;

    // Get top expenses
    const topExpenses = expenses.slice(0, 5).map((exp) => ({
      concept: exp.note || "Sin concepto",
      amount: exp.amount || 0,
      date: exp.date || "",
    }));

    // Calculate trend (group by day and analyze)
    const expensesByDay = expenses.reduce(
      (acc, exp) => {
        const date = exp.date || "";
        if (!acc[date]) {
          acc[date] = 0;
        }
        acc[date] += exp.amount || 0;
        return acc;
      },
      {} as Record<string, number>
    );

    const dailyAmounts = Object.values(expensesByDay);
    const { trend, percentage: trendPercentage } =
      calculateTrend(dailyAmounts);

    // Generate insights
    const insights = generateInsights(
      totalAmount,
      trend,
      trendPercentage,
      topExpenses,
      category
    );

    return {
      category,
      period,
      totalAmount,
      averagePerPeriod,
      trend,
      trendPercentage,
      topExpenses,
      insights,
    };
  } catch (error) {
    apiLogger.error({ error, params }, "Error analyzing spending pattern");
    throw error;
  }
}
