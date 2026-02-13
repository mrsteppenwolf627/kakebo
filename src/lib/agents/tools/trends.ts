import { SupabaseClient } from "@supabase/supabase-js";
import { apiLogger } from "@/lib/logger";

/**
 * Parameters for spending trends
 */
export interface GetSpendingTrendsParams {
  period: "last_3_months" | "last_6_months" | "last_year";
  groupBy: "week" | "month";
  category?: "survival" | "optional" | "culture" | "extra";
}

/**
 * Data point in trend
 */
export interface TrendDataPoint {
  date: string; // Week start or month (YYYY-MM)
  amount: number;
  count: number; // Number of expenses in this period
  isProjected?: boolean; // True if this is a projection (incomplete month)
}

/**
 * Peak or low point
 */
export interface ExtremePoint {
  date: string;
  amount: number;
}

/**
 * Spending trends result
 */
export interface SpendingTrendsResult {
  period: string;
  groupBy: string;
  category?: string;
  dataPoints: TrendDataPoint[];
  trend: "increasing" | "decreasing" | "stable";
  trendPercentage: number;
  average: number;
  peak: ExtremePoint;
  low: ExtremePoint;
}

/**
 * Get start date for period
 */
function getStartDate(period: string): string {
  const now = new Date();
  let start: Date;

  switch (period) {
    case "last_year":
      start = new Date(now);
      start.setFullYear(start.getFullYear() - 1);
      break;
    case "last_6_months":
      start = new Date(now);
      start.setMonth(start.getMonth() - 6);
      break;
    case "last_3_months":
    default:
      start = new Date(now);
      start.setMonth(start.getMonth() - 3);
      break;
  }

  return start.toISOString().split("T")[0];
}

/**
 * Get week start date (Monday)
 */
function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

/**
 * Get month string
 */
function getMonthString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Check if a month period is incomplete (current month)
 */
function isCurrentMonth(monthStr: string): boolean {
  const now = new Date();
  const currentMonth = getMonthString(now);
  return monthStr === currentMonth;
}

/**
 * Get days in a specific month
 */
function getDaysInSpecificMonth(monthStr: string): number {
  const [year, month] = monthStr.split("-").map(Number);
  return new Date(year, month, 0).getDate();
}

/**
 * Get days elapsed in a specific month
 */
function getDaysElapsedInMonth(monthStr: string): number {
  if (!isCurrentMonth(monthStr)) {
    return getDaysInSpecificMonth(monthStr);
  }

  const now = new Date();
  return now.getDate();
}

/**
 * Project incomplete month to full month amount
 */
function projectMonthAmount(amount: number, monthStr: string): number {
  const daysElapsed = getDaysElapsedInMonth(monthStr);
  const daysInMonth = getDaysInSpecificMonth(monthStr);

  if (daysElapsed === 0 || daysElapsed === daysInMonth) {
    return amount;
  }

  // Linear projection: (amount / days elapsed) × total days
  return (amount / daysElapsed) * daysInMonth;
}

/**
 * Group expenses by period
 */
function groupExpenses(
  expenses: Array<{ date: string; amount: number }>,
  groupBy: "week" | "month"
): Record<string, { amount: number; count: number }> {
  const grouped: Record<string, { amount: number; count: number }> = {};

  for (const expense of expenses) {
    const date = new Date(expense.date);
    const key =
      groupBy === "week" ? getWeekStart(date) : getMonthString(date);

    if (!grouped[key]) {
      grouped[key] = { amount: 0, count: 0 };
    }

    grouped[key].amount += expense.amount;
    grouped[key].count += 1;
  }

  return grouped;
}

/**
 * Calculate trend from data points
 * Uses simple percentage change between first and last period
 */
function calculateTrend(dataPoints: TrendDataPoint[]): {
  trend: "increasing" | "decreasing" | "stable";
  percentage: number;
} {
  if (dataPoints.length < 2) {
    return { trend: "stable", percentage: 0 };
  }

  // Simple and intuitive: compare first vs last period
  const firstAmount = dataPoints[0].amount;
  const lastAmount = dataPoints[dataPoints.length - 1].amount;

  if (firstAmount === 0) {
    return { trend: "stable", percentage: 0 };
  }

  // Calculate percentage change: ((last - first) / first) × 100
  const percentageChange = ((lastAmount - firstAmount) / firstAmount) * 100;

  // Consider stable if change is less than 5%
  if (Math.abs(percentageChange) < 5) {
    return { trend: "stable", percentage: 0 };
  }

  return {
    trend: percentageChange > 0 ? "increasing" : "decreasing",
    percentage: Math.abs(percentageChange),
  };
}

/**
 * Get spending trends over time
 */
export async function getSpendingTrends(
  supabase: SupabaseClient,
  userId: string,
  params: GetSpendingTrendsParams
): Promise<SpendingTrendsResult> {
  const { period, groupBy, category } = params;
  const startDate = getStartDate(period);
  const endDate = new Date().toISOString().split("T")[0];

  try {
    // Query expenses
    let query = supabase
      .from("expenses")
      .select("amount, date, category")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true });

    if (category) {
      query = query.eq("category", category);
    }

    const { data: expenses, error } = await query;

    if (error) {
      apiLogger.error({ error }, "Error fetching expenses for trends");
      throw error;
    }

    if (!expenses || expenses.length === 0) {
      return {
        period,
        groupBy,
        category,
        dataPoints: [],
        trend: "stable",
        trendPercentage: 0,
        average: 0,
        peak: { date: "", amount: 0 },
        low: { date: "", amount: 0 },
      };
    }

    // Group by period
    const grouped = groupExpenses(
      expenses.map((exp) => ({
        date: exp.date || "",
        amount: exp.amount || 0,
      })),
      groupBy
    );

    // Convert to data points with projection for incomplete months
    const dataPoints: TrendDataPoint[] = Object.entries(grouped)
      .map(([date, data]) => {
        const amount = data.amount;
        const isIncomplete = groupBy === "month" && isCurrentMonth(date);
        const projectedAmount = isIncomplete
          ? projectMonthAmount(amount, date)
          : amount;

        return {
          date,
          amount: Math.round(projectedAmount * 100) / 100,
          count: data.count,
          isProjected: isIncomplete,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate statistics
    const amounts = dataPoints.map((dp) => dp.amount);
    const average =
      amounts.reduce((sum, val) => sum + val, 0) / amounts.length;

    const peak = dataPoints.reduce(
      (max, dp) => (dp.amount > max.amount ? dp : max),
      dataPoints[0]
    );

    const low = dataPoints.reduce(
      (min, dp) => (dp.amount < min.amount ? dp : min),
      dataPoints[0]
    );

    const { trend, percentage: trendPercentage } =
      calculateTrend(dataPoints);

    return {
      period,
      groupBy,
      category,
      dataPoints,
      trend,
      trendPercentage: Math.round(trendPercentage * 10) / 10,
      average: Math.round(average * 100) / 100,
      peak: {
        date: peak.date,
        amount: peak.amount,
      },
      low: {
        date: low.date,
        amount: low.amount,
      },
    };
  } catch (error) {
    apiLogger.error({ error, params }, "Error getting spending trends");
    throw error;
  }
}
