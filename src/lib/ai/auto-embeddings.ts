import { SupabaseClient } from "@supabase/supabase-js";

/** External embedding generation is disabled; search is local and free. */
export async function shouldTriggerEmbeddings(
  _supabase: SupabaseClient
): Promise<boolean> {
  void _supabase;
  return false;
}

export async function generatePendingEmbeddings(
  _supabase: SupabaseClient,
  _maxExpenses = 50
): Promise<{ processed: number; errors: number; remaining: number }> {
  void _supabase;
  void _maxExpenses;
  return { processed: 0, errors: 0, remaining: 0 };
}

export const EXPENSE_COUNTER_SQL = `-- Deprecated: external embeddings are disabled.`;
