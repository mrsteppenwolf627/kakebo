import { SupabaseClient } from "@supabase/supabase-js";
import { apiLogger } from "@/lib/logger";
import {
  generateEmbeddings,
  createExpenseText,
  storeExpenseEmbedding,
} from "./embeddings";

/**
 * Auto-embeddings configuration
 */
const AUTO_EMBEDDING_BATCH_SIZE = 5; // Trigger every 5 expenses globally
const MAX_EXPENSES_PER_BATCH = 50; // Process up to 50 expenses at once

/**
 * Check if we should trigger embedding generation based on global expense counter
 * This reads the counter (which is auto-incremented by PostgreSQL trigger)
 *
 * @returns true if embeddings should be generated (every 5 expenses)
 */
export async function shouldTriggerEmbeddings(
  supabase: SupabaseClient
): Promise<boolean> {
  try {
    // Read current counter value (already incremented by PostgreSQL trigger)
    const { data, error } = await supabase
      .from("expense_counter")
      .select("count")
      .eq("id", 1)
      .single();

    if (error) {
      apiLogger.warn({ error }, "Failed to read expense counter");
      return false;
    }

    // Check if we hit the threshold (every 5 expenses)
    const currentCount = data.count as number;
    const shouldTrigger = currentCount % AUTO_EMBEDDING_BATCH_SIZE === 0;

    if (shouldTrigger) {
      apiLogger.info(
        { globalCount: currentCount },
        "Embedding generation triggered"
      );
    }

    return shouldTrigger;
  } catch (err) {
    apiLogger.error({ err }, "Error checking embedding trigger");
    return false;
  }
}

/**
 * Generate embeddings for expenses that don't have them yet (batch processing)
 * This processes expenses from ALL users, not just the current user
 *
 * @param supabase - Supabase client with service role key (bypasses RLS)
 * @param maxExpenses - Maximum number of expenses to process in this batch
 */
export async function generatePendingEmbeddings(
  supabase: SupabaseClient,
  maxExpenses: number = MAX_EXPENSES_PER_BATCH
): Promise<{
  processed: number;
  errors: number;
  remaining: number;
}> {
  const startTime = Date.now();

  try {
    // Get expenses without embeddings (across all users)
    // We use a LEFT JOIN to find expenses without embeddings
    const { data: expensesWithoutEmbeddings, error: queryError } =
      await supabase
        .from("expenses")
        .select(
          `
          id,
          user_id,
          note,
          amount,
          category,
          date
        `
        )
        .not("note", "is", null)
        .neq("note", "")
        .order("created_at", { ascending: false })
        .limit(maxExpenses * 2); // Get more to filter later

    if (queryError) throw queryError;

    if (!expensesWithoutEmbeddings || expensesWithoutEmbeddings.length === 0) {
      apiLogger.info("No pending expenses for embedding generation");
      return { processed: 0, errors: 0, remaining: 0 };
    }

    // Get existing embeddings to filter out expenses that already have them
    const expenseIds = expensesWithoutEmbeddings.map((e) => e.id);
    const { data: existingEmbeddings, error: embError } = await supabase
      .from("expense_embeddings")
      .select("expense_id")
      .in("expense_id", expenseIds);

    if (embError) throw embError;

    const existingIds = new Set(
      (existingEmbeddings || []).map((e) => e.expense_id)
    );

    // Filter out expenses that already have embeddings
    const expensesToProcess = expensesWithoutEmbeddings
      .filter((e) => !existingIds.has(e.id))
      .slice(0, maxExpenses);

    if (expensesToProcess.length === 0) {
      apiLogger.info("All expenses already have embeddings");
      return { processed: 0, errors: 0, remaining: 0 };
    }

    apiLogger.info(
      { count: expensesToProcess.length },
      "Starting batch embedding generation"
    );

    // Prepare texts for batch embedding generation
    const textsToEmbed = expensesToProcess.map((expense) =>
      createExpenseText({
        note: expense.note!,
        amount: expense.amount,
        category: expense.category,
        date: expense.date,
      })
    );

    // Generate embeddings in batch (more efficient than one-by-one)
    const embeddingResults = await generateEmbeddings(textsToEmbed);

    // Store embeddings
    let processed = 0;
    let errors = 0;

    for (let i = 0; i < expensesToProcess.length; i++) {
      const expense = expensesToProcess[i];
      const embeddingResult = embeddingResults[i];

      try {
        await storeExpenseEmbedding(
          supabase,
          expense.id,
          expense.user_id,
          textsToEmbed[i],
          embeddingResult.embedding
        );
        processed++;
      } catch (err) {
        apiLogger.warn(
          { err, expenseId: expense.id },
          "Failed to store embedding"
        );
        errors++;
      }
    }

    // Count remaining expenses without embeddings (rough estimate)
    const remaining = Math.max(
      0,
      expensesWithoutEmbeddings.length - existingIds.size - processed
    );

    const duration = Date.now() - startTime;

    apiLogger.info(
      {
        processed,
        errors,
        remaining,
        durationMs: duration,
        expensesPerSecond: ((processed / duration) * 1000).toFixed(2),
      },
      "Batch embedding generation completed"
    );

    return { processed, errors, remaining };
  } catch (err) {
    apiLogger.error({ err }, "Failed to generate pending embeddings");
    throw err;
  }
}

/**
 * SQL to create the global expense counter table
 * This should be run in Supabase SQL Editor
 */
export const EXPENSE_COUNTER_SQL = `
-- Create a simple counter table to track global expense creation
CREATE TABLE IF NOT EXISTS expense_counter (
  id INTEGER PRIMARY KEY DEFAULT 1,
  count BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (id = 1) -- Ensure only one row exists
);

-- Insert the initial row if it doesn't exist
INSERT INTO expense_counter (id, count)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

-- Create function to atomically increment counter
CREATE OR REPLACE FUNCTION increment_expense_counter()
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
  new_count BIGINT;
BEGIN
  UPDATE expense_counter
  SET count = count + 1,
      updated_at = NOW()
  WHERE id = 1
  RETURNING count INTO new_count;

  RETURN new_count;
END;
$$;

-- Optional: Create a trigger to automatically increment counter when expense is created
-- This ensures the counter is always up to date even if the app logic fails
CREATE OR REPLACE FUNCTION trigger_increment_expense_counter()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM increment_expense_counter();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_increment_expense_counter ON expenses;
CREATE TRIGGER auto_increment_expense_counter
  AFTER INSERT ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION trigger_increment_expense_counter();

-- Grant necessary permissions (adjust if needed)
-- The counter table doesn't need RLS since it's only modified by triggers/functions
ALTER TABLE expense_counter ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for authenticated users"
  ON expense_counter FOR SELECT
  TO authenticated
  USING (true);
`;
