import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { responses, handleApiError, requireAuth, withLogging } from "@/lib/api";
import {
  generateEmbedding,
  createExpenseText,
  storeExpenseEmbedding,
} from "@/lib/ai";

/**
 * POST /api/ai/migrate-embeddings
 * Generate embeddings for expenses that don't have them yet
 *
 * This is a migration endpoint to backfill embeddings for existing expenses.
 * It processes expenses in batches to avoid timeout issues.
 *
 * Query params:
 * - limit: number (optional, default 50, max 100) - Max expenses to process
 * - dryRun: boolean (optional, default false) - Just count, don't generate
 *
 * Returns:
 * - processed: number of expenses that got embeddings
 * - skipped: number of expenses already with embeddings
 * - remaining: number of expenses still without embeddings
 * - errors: array of error messages for failed expenses
 */
export const POST = withLogging(async (request: NextRequest) => {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    // Parse query params
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const dryRun = searchParams.get("dryRun") === "true";

    // Get all expenses for this user
    const { data: allExpenses, error: expensesError } = await supabase
      .from("expenses")
      .select("id, note, amount, category, date")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (expensesError) throw expensesError;

    // Get existing embeddings
    const { data: existingEmbeddings, error: embeddingsError } = await supabase
      .from("expense_embeddings")
      .select("expense_id")
      .eq("user_id", user.id);

    if (embeddingsError) throw embeddingsError;

    const existingIds = new Set(
      (existingEmbeddings || []).map((e) => e.expense_id)
    );

    // Find expenses without embeddings
    const expensesWithoutEmbeddings = (allExpenses || []).filter(
      (exp) => !existingIds.has(exp.id) && exp.note && exp.note.trim()
    );

    const toProcess = expensesWithoutEmbeddings.slice(0, limit);
    const remaining = expensesWithoutEmbeddings.length - toProcess.length;

    // If dry run, just return counts
    if (dryRun) {
      return responses.ok({
        dryRun: true,
        total: allExpenses?.length || 0,
        withEmbeddings: existingIds.size,
        withoutEmbeddings: expensesWithoutEmbeddings.length,
        wouldProcess: toProcess.length,
        remaining,
      });
    }

    // Process expenses
    const errors: string[] = [];
    let processed = 0;

    for (const expense of toProcess) {
      try {
        const textContent = createExpenseText({
          note: expense.note,
          amount: expense.amount,
          category: expense.category,
          date: expense.date,
        });

        const { embedding } = await generateEmbedding(textContent);

        await storeExpenseEmbedding(
          supabase,
          expense.id,
          user.id,
          textContent,
          embedding
        );

        processed++;
      } catch (err) {
        errors.push(
          `Expense ${expense.id} (${expense.note?.slice(0, 30)}): ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
      }
    }

    return responses.ok({
      processed,
      skipped: existingIds.size,
      remaining,
      errors: errors.length > 0 ? errors : undefined,
      message:
        remaining > 0
          ? `Procesados ${processed} gastos. Quedan ${remaining} por procesar. Ejecuta de nuevo para continuar.`
          : `Migración completada. ${processed} gastos procesados.`,
    });
  } catch (error) {
    return handleApiError(error);
  }
});

/**
 * GET /api/ai/migrate-embeddings
 * Get the current status of embeddings migration
 */
export const GET = withLogging(async () => {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    // Count total expenses
    const { count: totalExpenses, error: expError } = await supabase
      .from("expenses")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (expError) throw expError;

    // Count expenses with embeddings
    const { count: withEmbeddings, error: embError } = await supabase
      .from("expense_embeddings")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (embError) throw embError;

    const withoutEmbeddings = (totalExpenses || 0) - (withEmbeddings || 0);
    const percentage =
      totalExpenses && totalExpenses > 0
        ? Math.round(((withEmbeddings || 0) / totalExpenses) * 100)
        : 100;

    return responses.ok({
      totalExpenses: totalExpenses || 0,
      withEmbeddings: withEmbeddings || 0,
      withoutEmbeddings,
      percentage,
      status:
        withoutEmbeddings === 0
          ? "complete"
          : withEmbeddings === 0
          ? "not_started"
          : "in_progress",
    });
  } catch (error) {
    return handleApiError(error);
  }
});
