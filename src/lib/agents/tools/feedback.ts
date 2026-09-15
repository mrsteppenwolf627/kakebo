import { SupabaseClient } from "@supabase/supabase-js";
import { apiLogger } from "@/lib/logger";

/**
 * Feedback type
 */
export type FeedbackType = "correct" | "incorrect";

/**
 * Parameters for submitting search feedback
 */
export interface SubmitFeedbackParams {
    query: string; // The search query (e.g., "vicios")
    correctExpenses?: string[]; // Expense IDs that SHOULD be included
    incorrectExpenses?: string[]; // Expense IDs that should NOT be included
}

/**
 * Feedback for a specific query
 */
export interface QueryFeedback {
    correctExpenseIds: Set<string>;
    incorrectExpenseIds: Set<string>;
}

/**
 * Submit user feedback on search results
 * 
 * This allows the agent to learn from user corrections:
 * - "La insulina NO es un vicio" → marks insulina as incorrect for "vicios"
 * - "El vaper SÍ es un vicio" → marks vaper as correct for "vicios"
 */
export async function submitSearchFeedback(
    supabase: SupabaseClient,
    userId: string,
    params: SubmitFeedbackParams
): Promise<{ success: boolean; message: string }> {
    try {
        const { query, correctExpenses = [], incorrectExpenses = [] } = params;

        // ========== FILTER OUT FIXED EXPENSES ==========
        // Fixed expenses have IDs like "fixed-xxxxx" - they can't be saved in search_feedback
        // because search_feedback has a foreign key to the expenses table
        const filterFixedExpenses = (ids: string[]) =>
            ids.filter(id => !id.startsWith("fixed-"));

        const validCorrectExpenses = filterFixedExpenses(correctExpenses);
        const validIncorrectExpenses = filterFixedExpenses(incorrectExpenses);

        const fixedExpensesSkipped =
            (correctExpenses.length - validCorrectExpenses.length) +
            (incorrectExpenses.length - validIncorrectExpenses.length);

        if (fixedExpensesSkipped > 0) {
            apiLogger.warn(
                {
                    query,
                    fixedExpensesSkipped,
                },
                "Skipped feedback for fixed expenses (not yet supported)"
            );
        }
        // ================================================

        // ========== VERIFY OWNERSHIP (Fase 2.A) ==========
        // Un expense_id inexistente o perteneciente a otro usuario nunca debe
        // guardarse como feedback — se rechaza de forma segura sin insertar.
        const candidateIds = Array.from(
            new Set([...validCorrectExpenses, ...validIncorrectExpenses])
        );

        let ownedIds = new Set<string>();

        if (candidateIds.length > 0) {
            const { data: ownedExpenses, error: ownershipError } = await supabase
                .from("expenses")
                .select("id")
                .in("id", candidateIds)
                .eq("user_id", userId);

            if (ownershipError) {
                apiLogger.error(
                    { error: ownershipError, userId },
                    "Failed to verify expense ownership for feedback"
                );
                throw ownershipError;
            }

            ownedIds = new Set((ownedExpenses ?? []).map((e) => e.id as string));
        }

        const rejectedIds = candidateIds.filter((id) => !ownedIds.has(id));
        if (rejectedIds.length > 0) {
            apiLogger.warn(
                { query, rejectedIds, userId },
                "Rejected feedback for nonexistent or foreign expense_id"
            );
        }

        const ownedCorrectExpenses = validCorrectExpenses.filter((id) => ownedIds.has(id));
        const ownedIncorrectExpenses = validIncorrectExpenses.filter((id) => ownedIds.has(id));
        // ===================================================

        apiLogger.info(
            {
                query,
                correctCount: ownedCorrectExpenses.length,
                incorrectCount: ownedIncorrectExpenses.length,
                rejectedCount: rejectedIds.length,
            },
            "Submitting search feedback"
        );

        // Prepare feedback records (only for valid AND owned expense IDs)
        const feedbackRecords = [
            ...ownedCorrectExpenses.map((expenseId) => ({
                user_id: userId,
                query: query.toLowerCase().trim(),
                expense_id: expenseId,
                feedback_type: "correct" as FeedbackType,
            })),
            ...ownedIncorrectExpenses.map((expenseId) => ({
                user_id: userId,
                query: query.toLowerCase().trim(),
                expense_id: expenseId,
                feedback_type: "incorrect" as FeedbackType,
            })),
        ];

        if (feedbackRecords.length === 0) {
            // If all expenses were fixed expenses, return special message
            if (fixedExpensesSkipped > 0) {
                return {
                    success: false,
                    message: "No se puede guardar feedback para gastos fijos en este momento",
                };
            }

            // If every provided expense_id was nonexistent or foreign, reject explicitly.
            if (rejectedIds.length > 0) {
                return {
                    success: false,
                    message: "No se pudo guardar el feedback: el gasto indicado no existe o no te pertenece",
                };
            }

            return {
                success: false,
                message: "No feedback provided",
            };
        }

        // Upsert feedback (update if exists, insert if not)
        const { error } = await supabase
            .from("search_feedback")
            .upsert(feedbackRecords, {
                onConflict: "user_id,query,expense_id",
            });

        if (error) {
            apiLogger.error({ error }, "Failed to submit search feedback");
            throw error;
        }

        apiLogger.info(
            {
                query,
                recordsSubmitted: feedbackRecords.length,
                fixedExpensesSkipped,
            },
            "Search feedback submitted successfully"
        );

        // Build success message
        let message = `Aprendido: ${ownedCorrectExpenses.length} correctos, ${ownedIncorrectExpenses.length} incorrectos para "${query}"`;
        if (fixedExpensesSkipped > 0) {
            message += ` (${fixedExpensesSkipped} gastos fijos omitidos)`;
        }
        if (rejectedIds.length > 0) {
            message += ` (${rejectedIds.length} gasto(s) rechazado(s) por no pertenecer al usuario)`;
        }

        return {
            success: true,
            message,
        };
    } catch (error) {
        apiLogger.error({ error, params }, "Error submitting search feedback");
        throw error;
    }
}

/**
 * Get user's feedback for a specific query
 * 
 * Returns sets of expense IDs that the user has marked as correct/incorrect
 * for this query.
 */
export async function getSearchFeedback(
    supabase: SupabaseClient,
    userId: string,
    query: string
): Promise<QueryFeedback> {
    try {
        const normalizedQuery = query.toLowerCase().trim();

        const { data, error } = await supabase
            .from("search_feedback")
            .select("expense_id, feedback_type")
            .eq("user_id", userId)
            .eq("query", normalizedQuery);

        if (error) {
            apiLogger.error({ error, query }, "Failed to get search feedback");
            throw error;
        }

        const feedback: QueryFeedback = {
            correctExpenseIds: new Set(),
            incorrectExpenseIds: new Set(),
        };

        for (const record of data || []) {
            if (record.feedback_type === "correct") {
                feedback.correctExpenseIds.add(record.expense_id);
            } else if (record.feedback_type === "incorrect") {
                feedback.incorrectExpenseIds.add(record.expense_id);
            }
        }

        apiLogger.debug(
            {
                query,
                correctCount: feedback.correctExpenseIds.size,
                incorrectCount: feedback.incorrectExpenseIds.size,
            },
            "Retrieved search feedback"
        );

        return feedback;
    } catch (error) {
        apiLogger.error({ error, query }, "Error getting search feedback");
        // Return empty feedback on error (graceful degradation)
        return {
            correctExpenseIds: new Set(),
            incorrectExpenseIds: new Set(),
        };
    }
}

/**
 * Get global feedback consensus across ALL users
 *
 * Fase 2.G (aprendizaje personalizado y consentimiento colectivo opcional):
 * DESACTIVADO — falla cerrado. Devuelve siempre feedback vacío, sin
 * consultar `search_feedback` de otros usuarios en absoluto.
 *
 * Motivo: `search_feedback` está indexado por `expense_id` (identificador
 * de una fila de gasto concreta) y `query` (texto libre tecleado por el
 * usuario) — ninguno de los dos es un dato minimizado (etiqueta/categoría +
 * señal de corrección); son, respectivamente, un identificador de un
 * registro específico y texto libre. Cumplir la minimización exigida por
 * la Fase 2.G ("nunca nota libre... ni identificador de usuario ni
 * historial") exigiría rediseñar el esquema de `search_feedback` para
 * agregar por categoría/subcategoría en vez de por gasto individual — una
 * refactorización grande, fuera de alcance de esta tarea. Además, antes de
 * esta fase, esta función no comprobaba consentimiento alguno: consultaba
 * feedback de TODOS los usuarios sin distinción. En vez de intentar un
 * filtrado parcial (que seguiría exponiendo expense_id/query no
 * minimizados de usuarios consintientes), se desactiva por completo.
 *
 * `getHybridFeedback` (más abajo) sigue funcionando con normalidad para el
 * feedback personal del propio usuario — el aprendizaje individual no se
 * ve afectado por esta desactivación.
 */
export async function getGlobalFeedback(
    _supabase: SupabaseClient,
    _query: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for call-site compatibility; unused now that this is disabled (see doc comment above)
    _minVotes: number = 3
): Promise<QueryFeedback> {
    return {
        correctExpenseIds: new Set(),
        incorrectExpenseIds: new Set(),
    };
}

/**
 * Get hybrid feedback: personal + global
 *
 * Fase 2.G: `getGlobalFeedback` está desactivado (siempre devuelve vacío,
 * ver su comentario), así que esta función es, en la práctica, feedback
 * PERSONAL únicamente — se conserva la firma y la fusión para no tener que
 * tocar los llamantes (search-expenses.ts), y porque si en el futuro
 * `getGlobalFeedback` se rediseña con datos minimizados y consentimiento
 * real, esta función ya sabe fusionarlo correctamente (personal con
 * prioridad).
 */
export async function getHybridFeedback(
    supabase: SupabaseClient,
    userId: string,
    query: string
): Promise<QueryFeedback> {
    // Get personal feedback
    const personalFeedback = await getSearchFeedback(supabase, userId, query);

    // Get global consensus
    const globalFeedback = await getGlobalFeedback(supabase, query);

    // Merge: personal takes priority
    const hybrid: QueryFeedback = {
        correctExpenseIds: new Set(personalFeedback.correctExpenseIds),
        incorrectExpenseIds: new Set(personalFeedback.incorrectExpenseIds),
    };

    // Add global feedback for expenses without personal feedback
    for (const expenseId of globalFeedback.correctExpenseIds) {
        if (!hybrid.incorrectExpenseIds.has(expenseId)) {
            hybrid.correctExpenseIds.add(expenseId);
        }
    }

    for (const expenseId of globalFeedback.incorrectExpenseIds) {
        if (!hybrid.correctExpenseIds.has(expenseId)) {
            hybrid.incorrectExpenseIds.add(expenseId);
        }
    }

    apiLogger.debug(
        {
            query,
            personalCorrect: personalFeedback.correctExpenseIds.size,
            personalIncorrect: personalFeedback.incorrectExpenseIds.size,
            globalCorrect: globalFeedback.correctExpenseIds.size,
            globalIncorrect: globalFeedback.incorrectExpenseIds.size,
            hybridCorrect: hybrid.correctExpenseIds.size,
            hybridIncorrect: hybrid.incorrectExpenseIds.size,
        },
        "Merged personal and global feedback"
    );

    return hybrid;
}

/**
 * Apply user feedback to filter search results
 * 
 * Removes expenses marked as "incorrect" and boosts expenses marked as "correct"
 */
export function applyFeedbackFilter<T extends { expense_id: string; similarity: number }>(
    results: T[],
    feedback: QueryFeedback
): T[] {
    return results
        .filter((result) => {
            // Exclude expenses marked as incorrect
            if (feedback.incorrectExpenseIds.has(result.expense_id)) {
                return false;
            }
            return true;
        })
        .map((result) => {
            // Boost similarity for expenses marked as correct
            if (feedback.correctExpenseIds.has(result.expense_id)) {
                return {
                    ...result,
                    similarity: Math.min(result.similarity * 1.2, 1.0), // Boost by 20%
                };
            }
            return result;
        })
        .sort((a, b) => b.similarity - a.similarity); // Re-sort after boosting
}
