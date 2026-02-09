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

        apiLogger.info(
            {
                query,
                correctCount: correctExpenses.length,
                incorrectCount: incorrectExpenses.length,
            },
            "Submitting search feedback"
        );

        // Prepare feedback records
        const feedbackRecords = [
            ...correctExpenses.map((expenseId) => ({
                user_id: userId,
                query: query.toLowerCase().trim(),
                expense_id: expenseId,
                feedback_type: "correct" as FeedbackType,
            })),
            ...incorrectExpenses.map((expenseId) => ({
                user_id: userId,
                query: query.toLowerCase().trim(),
                expense_id: expenseId,
                feedback_type: "incorrect" as FeedbackType,
            })),
        ];

        if (feedbackRecords.length === 0) {
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
            },
            "Search feedback submitted successfully"
        );

        return {
            success: true,
            message: `Aprendido: ${correctExpenses.length} correctos, ${incorrectExpenses.length} incorrectos para "${query}"`,
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
 * Uses majority voting: if 60%+ of users mark an expense as incorrect,
 * it's considered globally incorrect.
 * 
 * This allows the agent to learn from ALL users, not just one.
 */
export async function getGlobalFeedback(
    supabase: SupabaseClient,
    query: string,
    minVotes: number = 3 // Minimum votes needed for consensus
): Promise<QueryFeedback> {
    try {
        const normalizedQuery = query.toLowerCase().trim();

        // Get all feedback for this query across all users
        const { data, error } = await supabase
            .from("search_feedback")
            .select("expense_id, feedback_type")
            .eq("query", normalizedQuery);

        if (error) {
            apiLogger.error({ error, query }, "Failed to get global feedback");
            throw error;
        }

        // Count votes per expense
        const votesByExpense = new Map<string, { correct: number; incorrect: number }>();

        for (const record of data || []) {
            if (!votesByExpense.has(record.expense_id)) {
                votesByExpense.set(record.expense_id, { correct: 0, incorrect: 0 });
            }

            const votes = votesByExpense.get(record.expense_id)!;
            if (record.feedback_type === "correct") {
                votes.correct++;
            } else if (record.feedback_type === "incorrect") {
                votes.incorrect++;
            }
        }

        const feedback: QueryFeedback = {
            correctExpenseIds: new Set(),
            incorrectExpenseIds: new Set(),
        };

        // Apply consensus threshold (60% majority)
        const consensusThreshold = 0.6;

        for (const [expenseId, votes] of votesByExpense.entries()) {
            const totalVotes = votes.correct + votes.incorrect;

            // Need minimum votes for consensus
            if (totalVotes < minVotes) {
                continue;
            }

            const incorrectRatio = votes.incorrect / totalVotes;
            const correctRatio = votes.correct / totalVotes;

            if (incorrectRatio >= consensusThreshold) {
                feedback.incorrectExpenseIds.add(expenseId);
            } else if (correctRatio >= consensusThreshold) {
                feedback.correctExpenseIds.add(expenseId);
            }
        }

        apiLogger.info(
            {
                query,
                totalExpenses: votesByExpense.size,
                globalCorrect: feedback.correctExpenseIds.size,
                globalIncorrect: feedback.incorrectExpenseIds.size,
            },
            "Retrieved global feedback consensus"
        );

        return feedback;
    } catch (error) {
        apiLogger.error({ error, query }, "Error getting global feedback");
        return {
            correctExpenseIds: new Set(),
            incorrectExpenseIds: new Set(),
        };
    }
}

/**
 * Get hybrid feedback: personal + global
 * 
 * Priority:
 * 1. User's personal feedback (highest priority)
 * 2. Global consensus from all users (fallback)
 * 
 * This gives users control while benefiting from collective knowledge.
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
