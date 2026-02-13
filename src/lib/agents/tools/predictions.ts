import { SupabaseClient } from "@supabase/supabase-js";
import { apiLogger } from "@/lib/logger";

/**
 * Parameters for spending prediction
 */
export interface PredictMonthlySpendingParams {
  month?: string; // YYYY-MM format
  category?: "survival" | "optional" | "culture" | "extra";
}

/**
 * Category prediction
 */
export interface CategoryPrediction {
  category: string;
  spentSoFar: number;
  projectedTotal: number;
  budget: number;
  projectedOverage: number;
  confidence: "high" | "medium" | "low";
}

/**
 * Monthly spending prediction result
 */
export interface MonthlyPredictionResult {
  month: string;
  currentDate: string;
  daysElapsed: number;
  daysRemaining: number;
  spentSoFar: number;
  projectedTotal: number;
  budget: number;
  projectedOverage: number;
  confidence: "high" | "medium" | "low";
  byCategory: CategoryPrediction[];
}

/**
 * Get current month in YYYY-MM format
 */
function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Calculate days in month
 */
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Calculate days elapsed in month
 */
function getDaysElapsed(year: number, month: number): number {
  const now = new Date();
  if (now.getFullYear() === year && now.getMonth() + 1 === month) {
    return now.getDate();
  }
  // If month is in the past, all days elapsed
  return getDaysInMonth(year, month);
}

/**
 * Get next month in YYYY-MM-01 format
 */
function getNextMonth(month: string): string {
  const [year, monthNum] = month.split("-").map(Number);
  const nextMonth = monthNum === 12 ? 1 : monthNum + 1;
  const nextYear = monthNum === 12 ? year + 1 : year;
  return `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
}

/**
 * Map category name to database column name (Spanish)
 */
function getCategoryBudgetColumn(category: string): string {
  const mapping: Record<string, string> = {
    survival: "budget_supervivencia",
    optional: "budget_opcional",
    culture: "budget_cultura",
    extra: "budget_extra",
  };
  return mapping[category] || `budget_${category}`;
}

/**
 * Map English category name to Spanish (as stored in expenses table)
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

/**
 * Project spending using simple linear projection
 * Formula: (total spent / days elapsed) × days in month
 */
function projectSpending(
  expenses: Array<{ date: string; amount: number }>,
  daysElapsed: number,
  daysInMonth: number
): { projection: number; confidence: "high" | "medium" | "low" } {
  if (expenses.length === 0 || daysElapsed === 0) {
    return { projection: 0, confidence: "low" };
  }

  // Linear projection: (total / days elapsed) × total days
  const totalSoFar = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const projection = (totalSoFar / daysElapsed) * daysInMonth;

  // Determine confidence based on data available
  let confidence: "high" | "medium" | "low";
  if (daysElapsed >= 20) {
    confidence = "high"; // More than 2/3 of month
  } else if (daysElapsed >= 10) {
    confidence = "medium"; // About 1/3 of month
  } else {
    confidence = "low"; // Less than 1/3 of month
  }

  return {
    projection: Math.round(projection * 100) / 100,
    confidence,
  };
}

/**
 * Predict monthly spending
 */
export async function predictMonthlySpending(
  supabase: SupabaseClient,
  userId: string,
  params: PredictMonthlySpendingParams
): Promise<MonthlyPredictionResult> {
  const month = params.month || getCurrentMonth();
  const [year, monthNum] = month.split("-").map(Number);
  const daysInMonth = getDaysInMonth(year, monthNum);
  const daysElapsed = getDaysElapsed(year, monthNum);
  const daysRemaining = daysInMonth - daysElapsed;

  const now = new Date();
  const currentDate = now.toISOString().split("T")[0];

  try {
    // Get user settings for budgets
    const { data: settings, error: settingsError } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (settingsError) {
      apiLogger.error(
        { error: settingsError },
        "Error fetching user settings"
      );
      throw settingsError;
    }

    if (!settings) {
      throw new Error("User settings not found");
    }

    // Get expenses for the month
    const { data: expenses, error: expensesError } = await supabase
      .from("expenses")
      .select("category, amount, date")
      .eq("user_id", userId)
      .gte("date", `${month}-01`)
      .lt("date", getNextMonth(month))
      .order("date", { ascending: true });

    if (expensesError) {
      apiLogger.error({ error: expensesError }, "Error fetching expenses");
      throw expensesError;
    }

    // Debug: Log query results
    console.log("📊 Prediction query params:", {
      month,
      startDate: `${month}-01`,
      endDate: getNextMonth(month),
      userId,
      daysElapsed,
      daysRemaining,
    });

    console.log("💰 Expenses found:", {
      count: expenses?.length || 0,
      categories: [...new Set(expenses?.map(e => e.category))],
      totalAmount: expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0,
    });

    // Calculate by category
    const categories: Array<"survival" | "optional" | "culture" | "extra"> = [
      "survival",
      "optional",
      "culture",
      "extra",
    ];

    const categoryPredictions: CategoryPrediction[] = [];

    for (const category of categories) {
      // Skip if user requested specific category
      if (params.category && category !== params.category) {
        continue;
      }

      // Map English category (from agent) to Spanish (db)
      const spanishCategory = getSpanishCategoryName(category);
      const categoryExpenses = (expenses || [])
        .filter((exp) => exp.category === spanishCategory)
        .map((exp) => ({
          date: exp.date || "",
          amount: exp.amount || 0,
        }));

      const spentSoFar = categoryExpenses.reduce(
        (sum, exp) => sum + exp.amount,
        0
      );

      const { projection, confidence } = projectSpending(
        categoryExpenses,
        daysElapsed,
        daysInMonth
      );

      // Use Spanish column names from database
      const budgetColumn = getCategoryBudgetColumn(category);
      const budget = (settings[budgetColumn as keyof typeof settings] as number) || 0;
      const projectedOverage = Math.max(0, projection - budget);

      categoryPredictions.push({
        category,
        spentSoFar: Math.round(spentSoFar * 100) / 100,
        projectedTotal: projection,
        budget,
        projectedOverage: Math.round(projectedOverage * 100) / 100,
        confidence,
      });
    }

    // Calculate totals
    const spentSoFar = categoryPredictions.reduce(
      (sum, cat) => sum + cat.spentSoFar,
      0
    );
    const projectedTotal = categoryPredictions.reduce(
      (sum, cat) => sum + cat.projectedTotal,
      0
    );
    const budget = categoryPredictions.reduce(
      (sum, cat) => sum + cat.budget,
      0
    );
    const projectedOverage = Math.max(0, projectedTotal - budget);

    // Overall confidence is the minimum of category confidences
    const confidenceLevels = { high: 3, medium: 2, low: 1 };
    const minConfidenceLevel = Math.min(
      ...categoryPredictions.map((cat) => confidenceLevels[cat.confidence])
    );
    const confidence =
      (Object.entries(confidenceLevels).find(
        ([, level]) => level === minConfidenceLevel
      )?.[0] as "high" | "medium" | "low") || "low";

    return {
      month,
      currentDate,
      daysElapsed,
      daysRemaining,
      spentSoFar: Math.round(spentSoFar * 100) / 100,
      projectedTotal: Math.round(projectedTotal * 100) / 100,
      budget,
      projectedOverage: Math.round(projectedOverage * 100) / 100,
      confidence,
      byCategory: categoryPredictions,
    };
  } catch (error) {
    apiLogger.error({ error, params }, "Error predicting monthly spending");
    throw error;
  }
}
