import { SupabaseClient } from "@supabase/supabase-js";
import { apiLogger } from "@/lib/logger";

/**
 * Parameters for budget status check
 */
export interface GetBudgetStatusParams {
  month?: string; // YYYY-MM format
  category?: "survival" | "optional" | "culture" | "extra";
}

/**
 * Status level for a budget
 */
export type BudgetStatusLevel = "safe" | "warning" | "exceeded";

/**
 * Category budget status
 */
export interface CategoryBudgetStatus {
  category: string;
  budget: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: BudgetStatusLevel;
  daysRemaining: number;
  projectedSpending: number;
}

/**
 * Overall budget status result
 */
export interface BudgetStatusResult {
  month: string;
  categories: CategoryBudgetStatus[];
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  overallStatus: BudgetStatusLevel;
  // Financial overview (for real disponible calculation)
  monthlyIncome?: number;
  fixedExpenses?: number;
  savingGoal?: number;
  utilizable?: number; // Income - Fixed - Saving
  disponibleReal?: number; // Utilizable - Spent (THIS is what user can really spend)
  currentBalance?: number;
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
 * Calculate days remaining in month
 */
function getDaysRemainingInMonth(month: string): number {
  const [year, monthNum] = month.split("-").map(Number);
  const now = new Date();
  const endOfMonth = new Date(year, monthNum, 0); // Day 0 of next month = last day of current month
  const daysInMonth = endOfMonth.getDate();
  const currentDay = now.getDate();
  return Math.max(0, daysInMonth - currentDay);
}

/**
 * Calculate days elapsed in month
 */
function getDaysElapsedInMonth(month: string): number {
  const [year, monthNum] = month.split("-").map(Number);
  const now = new Date();
  const startOfMonth = new Date(year, monthNum - 1, 1);
  const endOfMonth = new Date(year, monthNum, 0);
  const daysInMonth = endOfMonth.getDate();

  // If month is current month, use current day
  if (
    now.getFullYear() === year &&
    now.getMonth() + 1 === monthNum
  ) {
    return now.getDate();
  }

  // If month is in the past, all days elapsed
  return daysInMonth;
}

/**
 * Determine status level based on percentage
 */
function getStatusLevel(percentage: number): BudgetStatusLevel {
  if (percentage >= 100) return "exceeded";
  if (percentage >= 70) return "warning";
  return "safe";
}

/**
 * Project spending for rest of month
 * 
 * Uses weighted average to avoid panic-inducing projections from early large expenses
 * (e.g., rent paid on day 1 shouldn't project to 24k/month)
 */
function projectSpending(
  spent: number,
  daysElapsed: number,
  daysInMonth: number
): number {
  if (daysElapsed === 0) return spent;

  // If very early in month (< 5 days), use more conservative projection
  if (daysElapsed < 5) {
    // Weight recent spending less heavily
    const dailyAverage = spent / daysElapsed;
    const conservativeFactor = 0.7; // Assume spending will slow down
    return spent + (dailyAverage * conservativeFactor * (daysInMonth - daysElapsed));
  }

  // Standard linear projection for mid/late month
  const dailyAverage = spent / daysElapsed;
  return dailyAverage * daysInMonth;
}

/**
 * Get budget status for user
 */
export async function getBudgetStatus(
  supabase: SupabaseClient,
  userId: string,
  params: GetBudgetStatusParams
): Promise<BudgetStatusResult> {
  const month = params.month || getCurrentMonth();
  const specificCategory = params.category;

  try {
    // Get user settings (budgets)
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

    // Debug: Log ALL settings keys to see actual column names
    console.log("📊 Budget values from DB:", {
      supervivencia: settings.budget_supervivencia,
      opcional: settings.budget_opcional,
      cultura: settings.budget_cultura,
      extra: settings.budget_extra,
    });

    // Debug: Log query parameters
    console.log("🔍 Budget query params:", {
      month,
      startDate: `${month}-01`,
      endDate: getNextMonth(month),
      userId
    });

    // Get expenses for the month
    const { data: expenses, error: expensesError } = await supabase
      .from("expenses")
      .select("category, amount")
      .eq("user_id", userId)
      .gte("date", `${month}-01`)
      .lt("date", getNextMonth(month));

    if (expensesError) {
      apiLogger.error({ error: expensesError }, "Error fetching expenses");
      throw expensesError;
    }

    // Debug: Log expenses to see category names
    console.log("💰 Expenses from DB:", {
      count: expenses?.length || 0,
      categories: [...new Set(expenses?.map(e => e.category))],
      totalAmount: expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0
    });

    // Calculate spending by category (expenses use Spanish category names)
    const spendingByCategory = (expenses || []).reduce(
      (acc, exp) => {
        const cat = exp.category || "extra";
        acc[cat] = (acc[cat] || 0) + (exp.amount || 0);
        return acc;
      },
      {} as Record<string, number>
    );

    console.log("📊 Spending by category:", spendingByCategory);

    // Calculate days
    const daysElapsed = getDaysElapsedInMonth(month);
    const daysRemaining = getDaysRemainingInMonth(month);
    const [year, monthNum] = month.split("-").map(Number);
    const daysInMonth = new Date(year, monthNum, 0).getDate();

    // Build category statuses
    const categories: CategoryBudgetStatus[] = [];
    const categoryNames: Array<"survival" | "optional" | "culture" | "extra"> =
      ["survival", "optional", "culture", "extra"];

    for (const category of categoryNames) {
      // Skip if user requested specific category
      if (specificCategory && category !== specificCategory) {
        continue;
      }

      // Use Spanish column names from database
      const budgetColumn = getCategoryBudgetColumn(category);
      const budget = (settings[budgetColumn as keyof typeof settings] as number) || 0;
      // Get spending using Spanish category name (expenses use Spanish categories)
      const spanishCategory = getSpanishCategoryName(category);
      const spent = spendingByCategory[spanishCategory] || 0;
      const remaining = budget - spent;
      const percentage = budget > 0 ? (spent / budget) * 100 : 0;
      const status = getStatusLevel(percentage);
      const projectedSpending = projectSpending(
        spent,
        daysElapsed,
        daysInMonth
      );

      categories.push({
        category,
        budget,
        spent,
        remaining,
        percentage: Math.round(percentage * 10) / 10,
        status,
        daysRemaining,
        projectedSpending: Math.round(projectedSpending * 100) / 100,
      });
    }

    // Calculate totals
    const totalBudget = categories.reduce((sum, cat) => sum + cat.budget, 0);
    const totalSpent = categories.reduce((sum, cat) => sum + cat.spent, 0);
    const totalRemaining = totalBudget - totalSpent;
    const overallPercentage =
      totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    const overallStatus = getStatusLevel(overallPercentage);

    // ========== FINANCIAL OVERVIEW (NEW) ==========
    // Get fixed expenses for the month
    const { data: fixedExpenses, error: fixedError } = await supabase
      .from("fixed_expenses")
      .select("amount")
      .eq("user_id", userId)
      .eq("active", true)
      .lte("start_ym", month)
      .or(`end_ym.is.null,end_ym.gte.${month}`);

    if (fixedError) {
      apiLogger.warn(
        { error: fixedError },
        "Error fetching fixed expenses, continuing without them"
      );
    }

    const totalFixedExpenses =
      fixedExpenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;

    // Extract financial overview fields from settings
    const monthlyIncome = (settings.monthly_income as number) || 0;
    const savingGoal = (settings.monthly_saving_goal as number) || 0;
    const currentBalance = (settings.current_balance as number) || 0;

    // Calculate utilizable and disponible real
    const utilizable = monthlyIncome - totalFixedExpenses - savingGoal;
    const disponibleReal = utilizable - totalSpent;

    apiLogger.info(
      {
        monthlyIncome,
        fixedExpenses: totalFixedExpenses,
        savingGoal,
        utilizable,
        totalSpent,
        disponibleReal,
        currentBalance,
      },
      "Financial overview calculated"
    );
    // ==============================================

    const result = {
      month,
      categories,
      totalBudget,
      totalSpent,
      totalRemaining,
      overallStatus,
      // Financial overview
      monthlyIncome,
      fixedExpenses: totalFixedExpenses,
      savingGoal,
      utilizable,
      disponibleReal, // THIS is what user can really spend
      currentBalance,
    };

    console.log("✅ Budget status result:", JSON.stringify(result, null, 2));

    return result;
  } catch (error) {
    apiLogger.error({ error, params }, "Error getting budget status");
    throw error;
  }
}
