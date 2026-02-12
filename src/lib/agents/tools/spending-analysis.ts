import { SupabaseClient } from "@supabase/supabase-js";
import { apiLogger } from "@/lib/logger";

/**
 * Parameters for spending pattern analysis
 */
export interface AnalyzeSpendingPatternParams {
  category?: "survival" | "optional" | "culture" | "extra" | "all";
  period?: "current_month" | "last_month" | "last_3_months" | "last_6_months" | "current_week" | "last_week";
  groupBy?: "day" | "week" | "month";
  limit?: number; // Max expenses to return (default 5, max 50)
  semanticFilter?: string; // Natural language filter (e.g., "comida", "restaurantes", "salud")
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
  let start: Date;
  let end: Date;

  switch (period) {
    case "current_month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = now;
      break;
    case "last_month":
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0); // Last day of previous month
      break;
    case "last_3_months":
      start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      end = now;
      break;
    case "last_6_months":
      start = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      end = now;
      break;
    case "current_week":
      // Start of current week (Monday)
      const currentDay = now.getDay();
      const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1; // Sunday = 0, adjust to Monday = 0
      start = new Date(now);
      start.setDate(now.getDate() - daysFromMonday);
      start.setHours(0, 0, 0, 0);
      end = now;
      break;
    case "last_week":
      // Last week (Monday to Sunday)
      const lastWeekEnd = new Date(now);
      const currentDayLW = now.getDay();
      const daysFromMondayLW = currentDayLW === 0 ? 6 : currentDayLW - 1;
      lastWeekEnd.setDate(now.getDate() - daysFromMondayLW - 1); // Sunday of last week
      lastWeekEnd.setHours(23, 59, 59, 999);

      start = new Date(lastWeekEnd);
      start.setDate(lastWeekEnd.getDate() - 6); // Monday of last week
      start.setHours(0, 0, 0, 0);

      end = lastWeekEnd;
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = now;
  }

  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
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
      .select("id, note, amount, date")
      .eq("user_id", userId)
      .gte("date", start)
      .lte("date", end);

    /**
     * Get Spanish category name for database query
     */
    function getSpanishCategoryName(category: string): string {
      const mapping: Record<string, string> = {
        survival: "supervivencia",
        optional: "opcional",
        culture: "cultura",
        extra: "extra",
      };
      return mapping[category] || category;
    }

    // ... inside analyzeSpendingPattern
    if (category !== "all") {
      // Map English category (from agent) to Spanish (db)
      const dbCategory = getSpanishCategoryName(category);
      query = query.eq("category", dbCategory);
    }

    query = query.order("amount", { ascending: false });

    const { data: expenses, error } = await query;

    if (error) {
      apiLogger.error({ error }, "Error fetching expenses for analysis");
      throw error;
    }

    // Apply semantic filtering if requested
    let filteredExpenses = expenses || [];

    if (params.semanticFilter && filteredExpenses.length > 0) {
      try {
        // Import embeddings module
        const { searchExpensesByText } = await import("@/lib/ai/embeddings");

        // Search for semantically similar expenses
        const { results } = await searchExpensesByText(
          supabase,
          userId,
          params.semanticFilter,
          {
            limit: 100, // Get more results for filtering
            threshold: 0.2, // Lower threshold for broader matching (0.3 was too restrictive)
          }
        );

        // Filter original expenses to only include semantically similar ones
        const similarExpenseIds = new Set(results.map(r => r.expense_id));
        filteredExpenses = filteredExpenses.filter(exp =>
          similarExpenseIds.has(exp.id)
        );

        apiLogger.info({
          originalCount: expenses?.length || 0,
          filteredCount: filteredExpenses.length,
          semanticFilter: params.semanticFilter
        }, "Applied semantic filtering");
      } catch (embeddingError) {
        apiLogger.warn({ error: embeddingError }, "Semantic filtering failed, using all expenses");
        // Fall back to showing all expenses if semantic search fails
      }
    }

    if (!filteredExpenses || filteredExpenses.length === 0) {
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
    const totalAmount = filteredExpenses.reduce(
      (sum, exp) => sum + (exp.amount || 0),
      0
    );
    const averagePerPeriod = totalAmount / filteredExpenses.length;

    // Get expenses (limited by params.limit, default 5, max 50)
    const limit = Math.min(params.limit || 5, 50);
    const topExpenses = filteredExpenses.slice(0, limit).map((exp) => ({
      concept: exp.note || "Sin concepto",
      amount: exp.amount || 0,
      date: exp.date || "",
    }));

    // Add transparency note if there are more expenses than shown
    const hasMoreExpenses = filteredExpenses.length > limit;

    // Calculate trend (group by day and analyze)
    const expensesByDay = filteredExpenses.reduce(
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

    // Add transparency about data completeness
    if (hasMoreExpenses) {
      insights.unshift(`Mostrando los ${limit} gastos más altos de ${filteredExpenses.length} transacciones totales`);
    } else if (limit >= filteredExpenses.length && filteredExpenses.length > 5) {
      insights.unshift(`Mostrando todas las ${filteredExpenses.length} transacciones`);
    }

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
