/**
 * User Context Analyzer
 *
 * Analyzes user's data history to provide context for responses.
 * Adjusts bot behavior based on data availability and quality.
 *
 * VERSION: 1.0
 * Created: 2026-02-09
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { apiLogger } from "@/lib/logger";

/**
 * User context information
 */
export interface UserContext {
  isNewUser: boolean; // < 30 days of data
  hasLimitedHistory: boolean; // < 3 months of data
  daysSinceFirstExpense: number;
  totalTransactions: number;
  transactionsByCategory: Record<string, number>;
  dataQuality: "excellent" | "good" | "fair" | "poor";
  recommendedActions: string[];
  firstExpenseDate: string | null;
}

/**
 * Analyze user's historical data quality
 *
 * This function queries the database to understand:
 * - How long the user has been using Kakebo
 * - How many transactions they have
 * - Data quality level for appropriate bot responses
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @returns User context with data quality assessment
 */
export async function analyzeUserContext(
  supabase: SupabaseClient,
  userId: string
): Promise<UserContext> {
  try {
    // Get first and all expenses for analysis
    const { data: expenses, error } = await supabase
      .from("expenses")
      .select("date, category")
      .eq("user_id", userId)
      .order("date", { ascending: true });

    if (error) {
      apiLogger.error({ error, userId }, "Error fetching expenses for context");
      // Return conservative context on error
      return createEmptyContext();
    }

    // No expenses - brand new user
    if (!expenses || expenses.length === 0) {
      return createEmptyContext();
    }

    // Calculate metrics
    const firstExpenseDate = new Date(expenses[0].date);
    const now = new Date();
    const daysSinceFirst = Math.floor(
      (now.getTime() - firstExpenseDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const totalTransactions = expenses.length;

    // Transactions by category (for detecting which categories user uses)
    const transactionsByCategory = expenses.reduce(
      (acc, exp) => {
        const cat = exp.category || "extra";
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Determine user classification
    const isNewUser = daysSinceFirst < 30;
    const hasLimitedHistory = daysSinceFirst < 90;

    // Data quality assessment
    const dataQuality = assessDataQuality(totalTransactions, daysSinceFirst);

    // Recommended actions based on context
    const recommendedActions = generateRecommendedActions(
      isNewUser,
      totalTransactions,
      transactionsByCategory
    );

    apiLogger.debug(
      {
        userId,
        daysSinceFirst,
        totalTransactions,
        dataQuality,
        isNewUser,
      },
      "User context analyzed"
    );

    return {
      isNewUser,
      hasLimitedHistory,
      daysSinceFirstExpense: daysSinceFirst,
      totalTransactions,
      transactionsByCategory,
      dataQuality,
      recommendedActions,
      firstExpenseDate: expenses[0].date,
    };
  } catch (error) {
    apiLogger.error({ error, userId }, "Failed to analyze user context");

    // Return conservative context on error (assume new user)
    return createEmptyContext();
  }
}

/**
 * Create empty context for new users or errors
 */
function createEmptyContext(): UserContext {
  return {
    isNewUser: true,
    hasLimitedHistory: true,
    daysSinceFirstExpense: 0,
    totalTransactions: 0,
    transactionsByCategory: {},
    dataQuality: "poor",
    recommendedActions: [
      "Start by registering your daily expenses",
      "Set monthly budgets for each category",
    ],
    firstExpenseDate: null,
  };
}

/**
 * Assess data quality based on transactions and time
 */
function assessDataQuality(
  transactions: number,
  daysSinceFirst: number
): "excellent" | "good" | "fair" | "poor" {
  // Excellent: 100+ transactions AND 3+ months
  if (transactions >= 100 && daysSinceFirst >= 90) {
    return "excellent";
  }

  // Good: 50+ transactions AND 2+ months
  if (transactions >= 50 && daysSinceFirst >= 60) {
    return "good";
  }

  // Fair: 20+ transactions AND 1+ month
  if (transactions >= 20 && daysSinceFirst >= 30) {
    return "fair";
  }

  // Poor: anything less
  return "poor";
}

/**
 * Generate recommended actions for improving data quality
 */
function generateRecommendedActions(
  isNewUser: boolean,
  totalTransactions: number,
  transactionsByCategory: Record<string, number>
): string[] {
  const actions: string[] = [];

  if (isNewUser) {
    actions.push("Keep registering expenses daily for more accurate insights");
  }

  if (totalTransactions < 50) {
    actions.push(
      "More transaction history will improve anomaly detection and trend analysis"
    );
  }

  // Check if user is only using 1-2 categories
  const categoriesUsed = Object.keys(transactionsByCategory).length;
  if (categoriesUsed < 3) {
    actions.push(
      "Try categorizing your expenses across all 4 categories for better insights"
    );
  }

  return actions;
}

/**
 * Generate context disclaimer for LLM based on user context
 *
 * This injects critical information into the system prompt dynamically
 * so the LLM knows to adjust its behavior appropriately.
 */
export function generateContextDisclaimer(context: UserContext): string {
  // New user (< 30 days) - STRONG warning
  if (context.isNewUser) {
    return `IMPORTANTE - USUARIO NUEVO: Este usuario empezó hace ${context.daysSinceFirstExpense} días con ${context.totalTransactions} transacciones. Tienes MUY POCO HISTÓRICO.

RESTRICCIONES OBLIGATORIAS:
- ✗ NO hagas comparaciones con "patrones habituales" (no existen aún)
- ✗ NO hagas proyecciones a largo plazo
- ✗ NO detectes "anomalías" (no hay baseline)
- ✗ NO analices "tendencias" (insuficiente histórico)
- ✓ SÍ reconoce explícitamente: "Como empezaste hace poco, aún no tengo suficiente histórico"
- ✓ SÍ limita respuestas a datos del período actual solamente

Calidad de datos: ${context.dataQuality}`;
  }

  // Limited history (30-90 days) - Moderate warning
  if (context.hasLimitedHistory) {
    return `CONTEXTO - HISTÓRICO LIMITADO: Este usuario tiene ${context.daysSinceFirstExpense} días de histórico (${context.totalTransactions} transacciones).

PRECAUCIONES:
- Menciona limitaciones si el análisis requiere más histórico
- Proyecciones de largo plazo tienen baja confianza
- Comparaciones temporales limitadas al período disponible

Calidad de datos: ${context.dataQuality}`;
  }

  // Established user (90+ days) - Just context info
  return `CONTEXTO: Usuario con ${context.daysSinceFirstExpense} días de histórico (${context.totalTransactions} transacciones). Calidad de datos: ${context.dataQuality}. Histórico suficiente para análisis completos.`;
}

/**
 * Check if specific tool is appropriate for user's data quality
 *
 * Some tools require minimum data to work properly.
 * This function prevents calling tools that won't work well.
 */
export function isToolAppropriateForUser(
  toolName: string,
  context: UserContext
): { appropriate: boolean; reason?: string } {
  switch (toolName) {
    case "detectAnomalies":
      // Need at least 30 days to establish baseline
      if (context.daysSinceFirstExpense < 30) {
        return {
          appropriate: false,
          reason:
            "Anomaly detection requires at least 30 days of historical data to establish baseline patterns.",
        };
      }
      break;

    case "getSpendingTrends":
      // Need at least 60 days for meaningful trends
      if (context.daysSinceFirstExpense < 60) {
        return {
          appropriate: false,
          reason:
            "Trend analysis requires at least 60 days of data for meaningful insights.",
        };
      }
      break;

    case "predictMonthlySpending":
      // Need at least 15 days of current month OR 30 days total
      if (context.daysSinceFirstExpense < 30) {
        return {
          appropriate: false,
          reason:
            "Predictions require at least 30 days of historical data for accuracy.",
        };
      }
      break;

    // These tools work with any amount of data
    case "analyzeSpendingPattern":
    case "getBudgetStatus":
      return { appropriate: true };

    default:
      return { appropriate: true };
  }

  return { appropriate: true };
}

/**
 * Cache configuration for user context
 *
 * Context doesn't change frequently, so we can cache it
 * to avoid repeated database queries.
 */
export const USER_CONTEXT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Simple in-memory cache (for MVP - can be replaced with Redis)
const contextCache = new Map<
  string,
  { context: UserContext; timestamp: number }
>();

/**
 * Get user context with caching
 *
 * Checks cache first, only queries DB if cache miss or expired.
 */
export async function getUserContextCached(
  supabase: SupabaseClient,
  userId: string
): Promise<UserContext> {
  const now = Date.now();
  const cached = contextCache.get(userId);

  // Return cached if valid
  if (cached && now - cached.timestamp < USER_CONTEXT_CACHE_TTL_MS) {
    apiLogger.debug({ userId }, "User context cache HIT");
    return cached.context;
  }

  // Cache miss or expired - fetch fresh
  apiLogger.debug({ userId }, "User context cache MISS - fetching fresh");
  const context = await analyzeUserContext(supabase, userId);

  // Update cache
  contextCache.set(userId, { context, timestamp: now });

  return context;
}

/**
 * Clear cache for a specific user
 *
 * Call this after user adds new expenses to refresh their context
 */
export function clearUserContextCache(userId: string): void {
  contextCache.delete(userId);
  apiLogger.debug({ userId }, "User context cache cleared");
}

/**
 * Clear entire cache
 *
 * Useful for testing or after deployment
 */
export function clearAllContextCache(): void {
  const size = contextCache.size;
  contextCache.clear();
  apiLogger.info({ cachedUsers: size }, "All user context cache cleared");
}
