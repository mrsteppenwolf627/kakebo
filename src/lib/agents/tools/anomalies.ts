import { SupabaseClient } from "@supabase/supabase-js";
import { apiLogger } from "@/lib/logger";

/**
 * Parameters for anomaly detection
 */
export interface DetectAnomaliesParams {
  period?: "current_month" | "last_week" | "last_3_days";
  sensitivity?: "low" | "medium" | "high";
}

/**
 * Anomaly reason types
 */
export type AnomalyReason =
  | "unusually_high_amount"
  | "rare_category"
  | "unusual_timing";

/**
 * Anomaly severity levels
 */
export type AnomalySeverity = "low" | "medium" | "high";

/**
 * Detected anomaly
 */
export interface Anomaly {
  expense_id: string;
  concept: string;
  amount: number;
  category: string;
  date: string;
  reason: AnomalyReason;
  severity: AnomalySeverity;
  historicalAverage: number;
  deviationPercentage: number;
}

/**
 * Result of anomaly detection
 */
export interface AnomaliesResult {
  anomalies: Anomaly[];
  summary: string;
}

/**
 * Calculate date range for period
 */
function getPeriodDates(period: string): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString().split("T")[0];
  let start: Date;

  switch (period) {
    case "last_3_days":
      start = new Date(now);
      start.setDate(start.getDate() - 3);
      break;
    case "last_week":
      start = new Date(now);
      start.setDate(start.getDate() - 7);
      break;
    case "current_month":
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
  }

  return {
    start: start.toISOString().split("T")[0],
    end,
  };
}

/**
 * Calculate statistics for a category
 */
interface CategoryStats {
  mean: number;
  stdDev: number;
  count: number;
}

function calculateStats(amounts: number[]): CategoryStats {
  if (amounts.length === 0) {
    return { mean: 0, stdDev: 0, count: 0 };
  }

  const mean = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
  const variance =
    amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    amounts.length;
  const stdDev = Math.sqrt(variance);

  return { mean, stdDev, count: amounts.length };
}

/**
 * Get sensitivity threshold multiplier
 */
function getSensitivityMultiplier(sensitivity: string): number {
  switch (sensitivity) {
    case "low":
      return 3; // More tolerant (3 std deviations)
    case "high":
      return 1.5; // More sensitive (1.5 std deviations)
    case "medium":
    default:
      return 2; // Balanced (2 std deviations)
  }
}

/**
 * Determine severity based on deviation
 */
function getSeverity(deviationPercentage: number): AnomalySeverity {
  if (deviationPercentage > 200) return "high";
  if (deviationPercentage > 100) return "medium";
  return "low";
}

/**
 * Detect spending anomalies
 */
export async function detectAnomalies(
  supabase: SupabaseClient,
  userId: string,
  params: DetectAnomaliesParams
): Promise<AnomaliesResult> {
  const period = params.period || "current_month";
  const sensitivity = params.sensitivity || "medium";
  const { start, end } = getPeriodDates(period);

  try {
    // Get historical data (last 3 months before the period)
    const historicalStart = new Date(start);
    historicalStart.setMonth(historicalStart.getMonth() - 3);

    const { data: historicalExpenses, error: historicalError } = await supabase
      .from("expenses")
      .select("category, amount")
      .eq("user_id", userId)
      .gte("date", historicalStart.toISOString().split("T")[0])
      .lt("date", start);

    if (historicalError) {
      apiLogger.error(
        { error: historicalError },
        "Error fetching historical expenses"
      );
      throw historicalError;
    }

    // Get current period expenses
    const { data: currentExpenses, error: currentError } = await supabase
      .from("expenses")
      .select("id, note, amount, category, date")
      .eq("user_id", userId)
      .gte("date", start)
      .lte("date", end)
      .order("date", { ascending: false });

    if (currentError) {
      apiLogger.error(
        { error: currentError },
        "Error fetching current expenses"
      );
      throw currentError;
    }

    if (!currentExpenses || currentExpenses.length === 0) {
      return {
        anomalies: [],
        summary: "No hay gastos en este período para analizar",
      };
    }

    // Check if we have enough historical data for reliable anomaly detection
    const totalHistoricalExpenses = (historicalExpenses || []).length;
    const MINIMUM_HISTORICAL_DATA = 20; // Need at least 20 historical expenses

    if (totalHistoricalExpenses < MINIMUM_HISTORICAL_DATA) {
      apiLogger.info(
        {
          userId,
          totalHistorical: totalHistoricalExpenses,
          minimumRequired: MINIMUM_HISTORICAL_DATA,
        },
        "Insufficient historical data for anomaly detection"
      );

      return {
        anomalies: [],
        summary: `Necesitas más histórico para detectar anomalías fiables. Actualmente tienes ${totalHistoricalExpenses} gastos de los últimos 3 meses. Se recomienda al menos ${MINIMUM_HISTORICAL_DATA} gastos históricos (aproximadamente 2-3 meses de uso regular).`,
      };
    }

    // Calculate statistics by category
    // NOTE: Database stores categories in Spanish
    const statsByCategory: Record<string, CategoryStats> = {};
    const categories = ["supervivencia", "opcional", "cultura", "extra"];

    for (const category of categories) {
      const amounts = (historicalExpenses || [])
        .filter((exp) => exp.category === category)
        .map((exp) => exp.amount || 0);

      statsByCategory[category] = calculateStats(amounts);
    }

    // Detect anomalies
    const anomalies: Anomaly[] = [];
    const multiplier = getSensitivityMultiplier(sensitivity);

    for (const expense of currentExpenses) {
      const category = expense.category || "extra";
      const stats = statsByCategory[category];
      const amount = expense.amount || 0;

      // Skip if no stats available (shouldn't happen, but defensive programming)
      if (!stats) {
        apiLogger.warn(
          { category, expenseId: expense.id },
          "No stats found for category"
        );
        continue;
      }

      // Check for unusually high amount
      if (stats.count > 5 && stats.stdDev > 0) {
        const threshold = stats.mean + multiplier * stats.stdDev;
        if (amount > threshold) {
          const deviationPercentage =
            ((amount - stats.mean) / stats.mean) * 100;
          anomalies.push({
            expense_id: expense.id,
            concept: expense.note || "Sin concepto",
            amount,
            category,
            date: expense.date || "",
            reason: "unusually_high_amount",
            severity: getSeverity(deviationPercentage),
            historicalAverage: Math.round(stats.mean * 100) / 100,
            deviationPercentage:
              Math.round(deviationPercentage * 10) / 10,
          });
        }
      }

      // Check for rare category (less than 5 historical occurrences)
      if (stats.count < 5 && stats.count > 0) {
        anomalies.push({
          expense_id: expense.id,
          concept: expense.note || "Sin concepto",
          amount,
          category,
          date: expense.date || "",
          reason: "rare_category",
          severity: "low",
          historicalAverage: stats.mean || 0,
          deviationPercentage: 0,
        });
      }
    }

    // Check for unusual timing (multiple large expenses on same day)
    const expensesByDay = currentExpenses.reduce(
      (acc, exp) => {
        const date = exp.date || "";
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(exp);
        return acc;
      },
      {} as Record<string, typeof currentExpenses>
    );

    for (const [date, expenses] of Object.entries(expensesByDay)) {
      if (expenses.length >= 3) {
        const totalAmount = expenses.reduce(
          (sum, exp) => sum + (exp.amount || 0),
          0
        );
        const avgAmount = totalAmount / expenses.length;

        // If multiple expenses and average is high
        if (avgAmount > 50) {
          for (const expense of expenses.slice(0, 2)) {
            // Only flag first 2
            const alreadyFlagged = anomalies.some(
              (a) => a.expense_id === expense.id
            );
            if (!alreadyFlagged) {
              anomalies.push({
                expense_id: expense.id,
                concept: expense.note || "Sin concepto",
                amount: expense.amount || 0,
                category: expense.category || "extra",
                date: expense.date || "",
                reason: "unusual_timing",
                severity: "low",
                historicalAverage: 0,
                deviationPercentage: 0,
              });
            }
          }
        }
      }
    }

    // Generate summary
    let summary = "";
    if (anomalies.length === 0) {
      summary =
        "No se detectaron anomalías. Tus gastos están dentro de lo normal.";
    } else {
      const highSeverity = anomalies.filter((a) => a.severity === "high")
        .length;
      const mediumSeverity = anomalies.filter((a) => a.severity === "medium")
        .length;

      summary = `Se detectaron ${anomalies.length} anomalía(s)`;
      if (highSeverity > 0) {
        summary += ` (${highSeverity} de alta severidad)`;
      } else if (mediumSeverity > 0) {
        summary += ` (${mediumSeverity} de severidad media)`;
      }
      summary += ". Revisa los detalles para más información.";
    }

    // Sort by severity (high first)
    anomalies.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });

    return {
      anomalies,
      summary,
    };
  } catch (error) {
    apiLogger.error({ error, params }, "Error detecting anomalies");
    throw error;
  }
}
