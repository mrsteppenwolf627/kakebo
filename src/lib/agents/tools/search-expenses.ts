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
 * Keyword mapping for common search categories
 * These keywords are matched case-insensitively in expense notes
 */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
    salud: [
        "medicamento", "medicina", "farmacia", "doctor", "médico", "medico",
        "psicólogo", "psicologo", "terapeuta", "terapia", "consulta", "clínica", "clinica",
        "hospital", "seguro", "mutua", "dentista", "análisis", "analisis",
        "insulina", "pastilla", "antibiótico", "antibiotico", "receta"
    ],
    restaurantes: [
        "restaurante", "cena", "comida", "almuerzo", "desayuno", "bar",
        "cafetería", "cafeteria", "café", "cafe", "pizzería", "pizzeria",
        "hamburguesería", "hamburgueseria", "tapas", "menú", "menu",
        "comida fuera", "comer fuera", "delivery", "domicilio"
    ],
    transporte: [
        "metro", "bus", "autobús", "autobus", "taxi", "uber", "cabify",
        "gasolina", "combustible", "parking", "aparcamiento", "peaje",
        "tren", "renfe", "ave", "cercanías", "cercanias", "bici", "patinete"
    ],
    ocio: [
        "cine", "teatro", "concierto", "museo", "parque", "entrada",
        "espectáculo", "espectaculo", "fiesta", "discoteca", "pub",
        "videojuego", "netflix", "spotify", "streaming", "suscripción", "suscripcion"
    ],
    vicios: [
        "tabaco", "cigarro", "cigarrillo", "vaper", "vape", "alcohol",
        "cerveza", "vino", "licor", "bebida", "apuesta", "lotería", "loteria"
    ],
    gimnasio: [
        "gimnasio", "gym", "fitness", "deporte", "entrenamiento", "piscina",
        "clase", "yoga", "pilates", "crossfit", "running", "natación", "natacion"
    ],
    supermercado: [
        "mercadona", "carrefour", "lidl", "aldi", "día", "dia", "alcampo",
        "eroski", "supermercado", "compra", "súper", "super"
    ],
};

/**
 * Detect if query matches a known category and return keywords
 */
function getCategoryKeywords(query: string): string[] | null {
    const queryLower = query.toLowerCase().trim();

    // Exact match
    if (CATEGORY_KEYWORDS[queryLower]) {
        return CATEGORY_KEYWORDS[queryLower];
    }

    // Partial match (e.g., "gasto en salud" → "salud")
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (queryLower.includes(category)) {
            return keywords;
        }
    }

    return null;
}

/**
 * Determine optimal similarity threshold based on query type
 */
function getOptimalThreshold(query: string): number {
    const queryLower = query.toLowerCase().trim();

    // Specific brands/services (use strict threshold)
    const specificBrands = ["netflix", "spotify", "amazon", "youtube", "uber", "cabify"];
    if (specificBrands.some(brand => queryLower.includes(brand))) {
        return 0.6; // Strict
    }

    // Category keywords (use permissive threshold)
    if (getCategoryKeywords(query)) {
        return 0.3; // Permissive for broad categories
    }

    // Default: balanced threshold
    return 0.4;
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

            // ========== CRITICAL DIAGNOSTIC ==========
            console.log("🚨 [searchExpenses] BUILDING QUERY WITH userId:", userId);
            console.log("🚨 [searchExpenses] Period dates:", periodDates);
            // ==========================================

            // Build query
            let query = supabase
                .from("expenses")
                .select("id,date,amount,note,category,user_id") // ← INCLUDE user_id to verify
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

            // ========== DIAGNOSTIC: Log raw query results ==========
            console.log("🔍 [searchExpenses FAST PATH] Raw query results:");
            console.log("🔍 [searchExpenses] Error:", error);
            console.log("🔍 [searchExpenses] Number of expenses:", expenses?.length ?? 0);
            if (expenses && expenses.length > 0) {
                console.log("🔍 [searchExpenses] First expense raw data:", JSON.stringify(expenses[0], null, 2));
                console.log("🔍 [searchExpenses] First expense ID:", expenses[0].id);
                console.log("🔍 [searchExpenses] First expense ID type:", typeof expenses[0].id);
            }
            apiLogger.info(
                {
                    userId,
                    query: params.query,
                    period,
                    resultsCount: expenses?.length ?? 0,
                    firstExpenseId: expenses?.[0]?.id,
                },
                "searchExpenses fast path executed - DIAGNOSTIC"
            );
            // =======================================================

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

        // ========== SEARCH IN FIXED EXPENSES (text matching) ==========
        // Fixed expenses don't have embeddings, so use simple text search
        const { data: fixedExpenses, error: fixedError } = await supabase
            .from("fixed_expenses")
            .select("id, name, amount, expense_date, is_active")
            .eq("user_id", userId)
            .eq("is_active", true)
            .ilike("name", `%${params.query}%`); // Case-insensitive pattern match

        if (fixedError) {
            apiLogger.warn({ error: fixedError }, "Error searching fixed expenses");
        }

        apiLogger.info({
            query: params.query,
            fixedExpensesFound: fixedExpenses?.length ?? 0,
        }, "Fixed expenses search completed");

        // ========== KEYWORD MATCHING FOR COMMON CATEGORIES ==========
        const categoryKeywords = getCategoryKeywords(params.query);
        let keywordResults: Array<{
            expense_id: string;
            note: string;
            amount: number;
            date: string;
            category: string;
            similarity: number;
        }> = [];

        if (categoryKeywords && categoryKeywords.length > 0) {
            apiLogger.info({
                query: params.query,
                keywordCount: categoryKeywords.length,
            }, "Using keyword matching for known category");

            // Build OR condition for keyword matching
            const keywordPattern = categoryKeywords.map(k => `%${k}%`).join("|");

            // Query expenses matching any keyword
            const { data: keywordExpenses } = await supabase
                .from("expenses")
                .select("id, note, amount, date, category")
                .eq("user_id", userId);

            // Filter by keyword matching (case-insensitive)
            if (keywordExpenses) {
                keywordResults = keywordExpenses
                    .filter(exp => {
                        const noteLower = (exp.note || "").toLowerCase();
                        return categoryKeywords.some(keyword =>
                            noteLower.includes(keyword.toLowerCase())
                        );
                    })
                    .map(exp => ({
                        expense_id: exp.id,
                        note: exp.note || "Sin concepto",
                        amount: exp.amount,
                        date: exp.date,
                        category: exp.category,
                        similarity: 0.95, // High similarity for keyword matches
                    }));

                apiLogger.info({
                    query: params.query,
                    keywordMatches: keywordResults.length,
                }, "Keyword matching completed");
            }
        }

        // ========== SEMANTIC SEARCH WITH DYNAMIC THRESHOLD ==========
        // Skip semantic search if we're using keywords (to avoid false positives)
        let results: Awaited<ReturnType<typeof searchExpensesByText>>['results'] = [];

        if (!categoryKeywords || categoryKeywords.length === 0) {
            // Only use semantic search for non-category queries
            const optimalThreshold = getOptimalThreshold(params.query);
            apiLogger.info({
                query: params.query,
                threshold: optimalThreshold,
            }, "Using semantic search (no category keywords matched)");

            const searchResults = await searchExpensesByText(
                supabase,
                userId,
                params.query,
                {
                    limit: 100, // Get more results for filtering
                    threshold: optimalThreshold, // Dynamic threshold based on query type
                }
            );
            results = searchResults.results;
        } else {
            apiLogger.info({
                query: params.query,
                keywordCount: categoryKeywords.length,
            }, "Skipping semantic search (using keyword matching only for known category)");
        }

        // Check if we have any results at all (manual or fixed)
        if (results.length === 0 && (!fixedExpenses || fixedExpenses.length === 0)) {
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

        // ========== MERGE ALL RESULTS (KEYWORDS + EMBEDDINGS + FIXED) ==========
        // Apply period filter to keyword results
        let filteredKeywordResults = keywordResults;
        if (periodDates) {
            filteredKeywordResults = keywordResults.filter(exp =>
                exp.date >= periodDates.start && exp.date <= periodDates.end
            );
        }

        // Convert fixed expenses to same format as manual expenses
        const fixedExpensesFormatted = (fixedExpenses || [])
            .filter(fe => {
                // Apply period filter
                if (!periodDates) return true;
                const expenseDate = fe.expense_date || new Date().toISOString().split("T")[0];
                return expenseDate >= periodDates.start && expenseDate <= periodDates.end;
            })
            .map(fe => ({
                expense_id: `fixed-${fe.id}`, // Prefix to distinguish from manual expenses
                note: `${fe.name} (Gasto fijo)`, // Mark as fixed expense
                amount: fe.amount,
                date: fe.expense_date || new Date().toISOString().split("T")[0],
                category: "extra", // Fixed expenses don't have category, default to "extra"
                similarity: 1.0, // Perfect match for text search
            }));

        // Merge all sources: keyword matches + semantic search + fixed expenses
        // Remove duplicates (prefer keyword matches over semantic)
        const seenIds = new Set<string>();
        const combinedResults: typeof filteredResults = [];

        // 1. Add keyword matches first (highest priority)
        for (const result of filteredKeywordResults) {
            if (!seenIds.has(result.expense_id)) {
                combinedResults.push(result);
                seenIds.add(result.expense_id);
            }
        }

        // 2. Add semantic search results (medium priority)
        for (const result of filteredResults) {
            if (!seenIds.has(result.expense_id)) {
                combinedResults.push(result);
                seenIds.add(result.expense_id);
            }
        }

        // 3. Add fixed expenses (low priority, but still included)
        for (const result of fixedExpensesFormatted) {
            if (!seenIds.has(result.expense_id)) {
                combinedResults.push(result);
                seenIds.add(result.expense_id);
            }
        }

        apiLogger.info({
            query: params.query,
            keywordMatches: filteredKeywordResults.length,
            semanticMatches: filteredResults.length,
            fixedMatches: fixedExpensesFormatted.length,
            totalCombined: combinedResults.length,
        }, "Merged all search results");

        // Sort by similarity and limit
        combinedResults.sort((a, b) => b.similarity - a.similarity);
        const topResults = combinedResults.slice(0, limit);

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
