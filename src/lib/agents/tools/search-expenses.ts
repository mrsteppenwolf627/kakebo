import { SupabaseClient } from "@supabase/supabase-js";
import { apiLogger } from "@/lib/logger";
import { searchExpensesByText } from "@/lib/ai/embeddings";

/**
 * Parameters for free-form expense search
 */
export interface SearchExpensesParams {
    query?: string; // Natural language query (e.g., "vicios", "restaurantes caros", "gimnasio"). Defaults to "último" if not provided.
    period?: "current_month" | "last_month" | "last_3_months" | "last_6_months" | "current_week" | "last_week" | "all";
    minAmount?: number; // Minimum amount filter
    maxAmount?: number; // Maximum amount filter
    limit?: number; // Max results (default 20, max 50)
}

/**
 * Result of expense search
 */
export interface SearchExpensesResult {
    query: string;
    period: string;
    totalAmount: number;
    count: number;
    expenses: Array<{
        id?: string; // Expense ID (for updateTransaction)
        concept: string;
        amount: number;
        date: string;
        category: string;
        similarity: number; // How similar to the query (0-1)
    }>;
    insights: string[];
}

/**
 * Get period dates for filtering
 */
function getPeriodDates(period: string): { start: string; end: string } | null {
    if (period === "all") return null;

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
            end = new Date(now.getFullYear(), now.getMonth(), 0);
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
            const currentDay = now.getDay();
            const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
            start = new Date(now);
            start.setDate(now.getDate() - daysFromMonday);
            start.setHours(0, 0, 0, 0);
            end = now;
            break;
        case "last_week":
            const lastWeekEnd = new Date(now);
            const currentDayLW = now.getDay();
            const daysFromMondayLW = currentDayLW === 0 ? 6 : currentDayLW - 1;
            lastWeekEnd.setDate(now.getDate() - daysFromMondayLW - 1);
            lastWeekEnd.setHours(23, 59, 59, 999);

            start = new Date(lastWeekEnd);
            start.setDate(lastWeekEnd.getDate() - 6);
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
 * Search expenses using natural language
 * 
 * This tool uses semantic embeddings to understand ANY query:
 * - "vicios" → finds tobacco, alcohol, gambling
 * - "restaurantes caros" → finds restaurants >€30
 * - "gimnasio" → finds gym memberships, classes
 * 
 * It learns from ALL users' expense descriptions over time.
 */
export async function searchExpenses(
    supabase: SupabaseClient,
    userId: string,
    params: SearchExpensesParams
): Promise<SearchExpensesResult> {
    const period = params.period || "current_month";
    const limit = Math.min(params.limit || 20, 50);

    // ========== VALIDATION: query is required ==========
    if (!params.query || params.query.trim().length === 0) {
        // If no query provided, default to "last" (most recent expenses)
        params.query = "último";
        apiLogger.info(
            { userId, originalParams: params },
            "No query provided, defaulting to 'último' for last expenses"
        );
    }
    // ===================================================

    try {
        // ========== FAST PATH: Simple queries without embeddings ==========
        // For queries like "último", "last", "recent", use direct SQL
        const queryLower = params.query.toLowerCase().trim();

        // Check for "last expense" type queries
        const isSimpleLastQuery =
            queryLower === "último" ||
            queryLower === "ultimo" ||
            queryLower === "last" ||
            queryLower === "reciente" ||
            queryLower === "recent" ||
            queryLower === "más reciente" ||
            queryLower === "mas reciente" ||
            // Include variations with "gasto", "expense", etc.
            queryLower.includes("último gasto") ||
            queryLower.includes("ultimo gasto") ||
            queryLower.includes("last expense") ||
            queryLower.includes("última compra") ||
            queryLower.includes("ultima compra") ||
            queryLower.includes("gasto reciente") ||
            queryLower.includes("compra reciente") ||
            queryLower.includes("recent expense");

        if (isSimpleLastQuery) {
            apiLogger.info({ query: params.query, period }, "Using fast path for 'last expense' query");

            // Get period dates
            const periodDates = getPeriodDates(period);

            // Build query
            let query = supabase
                .from("expenses")
                .select("id,date,amount,note,category")
                .eq("user_id", userId)
                .order("date", { ascending: false })
                .order("created_at", { ascending: false })
                .limit(limit);

            // Apply period filter if specified
            if (periodDates) {
                query = query
                    .gte("date", periodDates.start)
                    .lte("date", periodDates.end);
            }

            // Apply amount filters
            if (params.minAmount !== undefined) {
                query = query.gte("amount", params.minAmount);
            }
            if (params.maxAmount !== undefined) {
                query = query.lte("amount", params.maxAmount);
            }

            const { data: expenses, error } = await query;

            if (error) {
                throw error;
            }

            if (!expenses || expenses.length === 0) {
                return {
                    query: params.query,
                    period,
                    totalAmount: 0,
                    count: 0,
                    expenses: [],
                    insights: [`No encontré gastos en el período "${period}"`],
                };
            }

            // Calculate total
            const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

            // Map category names
            const categoryMap: Record<string, string> = {
                supervivencia: "Supervivencia",
                opcional: "Opcional",
                cultura: "Cultura",
                extra: "Extra",
            };

            // Format results
            const formattedExpenses = expenses.map(exp => ({
                id: exp.id, // ← IMPORTANT: Include ID for updateTransaction
                concept: exp.note || "Sin concepto",
                amount: exp.amount,
                date: exp.date,
                category: categoryMap[exp.category] || exp.category,
                similarity: 1.0, // Perfect match for direct query
            }));

            // Generate insights with explicit ID mention for first expense
            const insights = [`Encontré ${formattedExpenses.length} gasto(s) reciente(s)`];

            if (formattedExpenses.length > 0 && formattedExpenses[0].id) {
                const first = formattedExpenses[0];
                insights.push(
                    `Más reciente: "${first.concept}" (${first.amount}€) el ${first.date}`,
                    `ID de este gasto: ${first.id}` // ← EXPLICIT ID for LLM
                );
            }

            insights.push(`Total: €${totalAmount.toFixed(2)}`);

            return {
                query: params.query,
                period,
                totalAmount: Math.round(totalAmount * 100) / 100,
                count: formattedExpenses.length,
                expenses: formattedExpenses,
                insights,
            };
        }
        // ================================================================

        apiLogger.info({ query: params.query, period }, "Searching expenses with embeddings");

        // Search using semantic embeddings
        const { results } = await searchExpensesByText(
            supabase,
            userId,
            params.query,
            {
                limit: 100, // Get more results for filtering
                threshold: 0.2, // Lower threshold for broader matching
            }
        );

        if (results.length === 0) {
            return {
                query: params.query,
                period,
                totalAmount: 0,
                count: 0,
                expenses: [],
                insights: [`No encontré gastos relacionados con "${params.query}"`],
            };
        }

        // Apply period filter
        let filteredResults = results;
        const periodDates = getPeriodDates(period);

        if (periodDates) {
            filteredResults = results.filter(exp =>
                exp.date >= periodDates.start && exp.date <= periodDates.end
            );
        }

        // Apply amount filters
        if (params.minAmount !== undefined) {
            filteredResults = filteredResults.filter(exp => exp.amount >= params.minAmount!);
        }
        if (params.maxAmount !== undefined) {
            filteredResults = filteredResults.filter(exp => exp.amount <= params.maxAmount!);
        }

        // ========== APPLY USER FEEDBACK LEARNING ==========
        // Get user's previous corrections for this query
        const { getHybridFeedback, applyFeedbackFilter } = await import("./feedback");
        const feedback = await getHybridFeedback(supabase, userId, params.query);

        // Filter results based on user feedback
        filteredResults = applyFeedbackFilter(filteredResults, feedback);

        apiLogger.info({
            query: params.query,
            originalCount: results.length,
            afterFeedback: filteredResults.length,
            excludedCount: feedback.incorrectExpenseIds.size,
        }, "Applied hybrid feedback (personal + global) to search results");

        // Sort by similarity and limit
        filteredResults.sort((a, b) => b.similarity - a.similarity);
        const topResults = filteredResults.slice(0, limit);

        // Calculate metrics
        const totalAmount = topResults.reduce((sum, exp) => sum + exp.amount, 0);

        // Map category names to Spanish
        const categoryMap: Record<string, string> = {
            supervivencia: "Supervivencia",
            opcional: "Opcional",
            cultura: "Cultura",
            extra: "Extra",
        };

        // Format expenses
        const expenses = topResults.map(exp => ({
            id: exp.expense_id, // ← IMPORTANT: Include ID for updateTransaction
            concept: exp.note,
            amount: exp.amount,
            date: exp.date,
            category: categoryMap[exp.category] || exp.category,
            similarity: Math.round(exp.similarity * 100) / 100,
        }));

        // Generate insights
        const insights: string[] = [];

        if (filteredResults.length > limit) {
            insights.push(`Mostrando los ${limit} resultados más relevantes de ${filteredResults.length} gastos encontrados`);
        }

        // Category breakdown
        const byCategory = topResults.reduce((acc, exp) => {
            const cat = categoryMap[exp.category] || exp.category;
            acc[cat] = (acc[cat] || 0) + exp.amount;
            return acc;
        }, {} as Record<string, number>);

        const categories = Object.entries(byCategory)
            .sort(([, a], [, b]) => b - a)
            .map(([cat, amount]) => `${cat}: €${amount.toFixed(2)}`)
            .join(", ");

        if (Object.keys(byCategory).length > 1) {
            insights.push(`Distribuido en: ${categories}`);
        }

        // Average expense
        const avgAmount = totalAmount / topResults.length;
        insights.push(`Gasto promedio: €${avgAmount.toFixed(2)}`);

        // Highest expense
        const highest = topResults[0];
        if (highest && topResults.length > 1) {
            insights.push(`Gasto más alto: ${highest.note} (€${highest.amount})`);
        }

        return {
            query: params.query,
            period,
            totalAmount: Math.round(totalAmount * 100) / 100,
            count: topResults.length,
            expenses,
            insights,
        };
    } catch (error) {
        apiLogger.error({ error, params }, "Error searching expenses");
        throw error;
    }
}
