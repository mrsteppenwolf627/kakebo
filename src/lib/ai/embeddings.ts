import { openai } from "./client";
import { SupabaseClient } from "@supabase/supabase-js";
import { apiLogger } from "@/lib/logger";

/**
 * Embedding model configuration
 * text-embedding-3-small: Fast, cheap, good quality for semantic search
 *
 * Pricing (as of 2026):
 * - $0.02 / 1M tokens
 *
 * Dimensions: 1536 (default) or can be reduced
 */
export const EMBEDDING_MODEL = "text-embedding-3-small";
export const EMBEDDING_DIMENSIONS = 1536;
export const EMBEDDING_COST_PER_1M = 0.02;

/**
 * Result of generating an embedding
 */
export interface EmbeddingResult {
  embedding: number[];
  tokens: number;
  costUsd: number;
}

/**
 * Expense with embedding for storage
 */
export interface ExpenseEmbedding {
  expense_id: string;
  user_id: string;
  embedding: number[];
  text_content: string;
  created_at?: string;
}

/**
 * Search result with similarity score
 */
export interface SimilarExpense {
  expense_id: string;
  note: string;
  amount: number;
  category: string;
  date: string;
  similarity: number;
}

/**
 * Generate embedding for a text using OpenAI
 */
export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
  const startTime = Date.now();

  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
      dimensions: EMBEDDING_DIMENSIONS,
    });

    const embedding = response.data[0].embedding;
    const tokens = response.usage?.total_tokens || 0;
    const costUsd = (tokens / 1_000_000) * EMBEDDING_COST_PER_1M;

    apiLogger.info(
      {
        text: text.slice(0, 50),
        tokens,
        costUsd,
        latencyMs: Date.now() - startTime,
      },
      "Generated embedding"
    );

    return { embedding, tokens, costUsd };
  } catch (error) {
    apiLogger.error({ error, text: text.slice(0, 50) }, "Failed to generate embedding");
    throw error;
  }
}

/**
 * Generate embeddings for multiple texts (batch)
 */
export async function generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
  if (texts.length === 0) return [];

  const startTime = Date.now();

  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: texts,
      dimensions: EMBEDDING_DIMENSIONS,
    });

    const totalTokens = response.usage?.total_tokens || 0;
    const costUsd = (totalTokens / 1_000_000) * EMBEDDING_COST_PER_1M;
    const tokensPerText = Math.ceil(totalTokens / texts.length);
    const costPerText = costUsd / texts.length;

    apiLogger.info(
      {
        count: texts.length,
        totalTokens,
        costUsd,
        latencyMs: Date.now() - startTime,
      },
      "Generated batch embeddings"
    );

    return response.data.map((item) => ({
      embedding: item.embedding,
      tokens: tokensPerText,
      costUsd: costPerText,
    }));
  } catch (error) {
    apiLogger.error({ error, count: texts.length }, "Failed to generate batch embeddings");
    throw error;
  }
}

/**
 * Create text content for embedding from expense data
 */
export function createExpenseText(expense: {
  note: string;
  amount: number;
  category: string;
  date?: string;
}): string {
  const categoryLabels: Record<string, string> = {
    survival: "supervivencia",
    optional: "opcional",
    culture: "cultura",
    extra: "extra",
    supervivencia: "supervivencia",
    opcional: "opcional",
    cultura: "cultura",
  };

  const categoryLabel = categoryLabels[expense.category] || expense.category;
  const dateStr = expense.date ? ` el ${expense.date}` : "";

  return `${expense.note} - ${expense.amount}€ en ${categoryLabel}${dateStr}`;
}

/**
 * Store embedding for an expense
 */
export async function storeExpenseEmbedding(
  supabase: SupabaseClient,
  expenseId: string,
  userId: string,
  textContent: string,
  embedding: number[]
): Promise<void> {
  try {
    // Upsert: update if exists, insert if not
    const { error } = await supabase.from("expense_embeddings").upsert(
      {
        expense_id: expenseId,
        user_id: userId,
        embedding: embedding,
        text_content: textContent,
      },
      { onConflict: "expense_id" }
    );

    if (error) {
      apiLogger.warn({ error, expenseId }, "Failed to store expense embedding");
    }
  } catch (err) {
    apiLogger.warn({ err, expenseId }, "Failed to store expense embedding");
  }
}

/**
 * Delete embedding for an expense
 */
export async function deleteExpenseEmbedding(
  supabase: SupabaseClient,
  expenseId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from("expense_embeddings")
      .delete()
      .eq("expense_id", expenseId);

    if (error) {
      apiLogger.warn({ error, expenseId }, "Failed to delete expense embedding");
    }
  } catch (err) {
    apiLogger.warn({ err, expenseId }, "Failed to delete expense embedding");
  }
}

/**
 * Search for similar expenses using vector similarity
 *
 * Uses the match_expenses function created in Supabase
 */
export async function searchSimilarExpenses(
  supabase: SupabaseClient,
  userId: string,
  queryEmbedding: number[],
  options: {
    limit?: number;
    threshold?: number;
  } = {}
): Promise<SimilarExpense[]> {
  const { limit = 5, threshold = 0.5 } = options;

  try {
    const { data, error } = await supabase.rpc("match_expenses", {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit,
      p_user_id: userId,
    });

    if (error) {
      apiLogger.error({ error }, "Failed to search similar expenses");
      return [];
    }

    return (data || []).map((item: {
      expense_id: string;
      note: string;
      amount: number;
      category: string;
      date: string;
      similarity: number;
    }) => ({
      expense_id: item.expense_id,
      note: item.note,
      amount: item.amount,
      category: item.category,
      date: item.date,
      similarity: item.similarity,
    }));
  } catch (err) {
    apiLogger.error({ err }, "Failed to search similar expenses");
    return [];
  }
}

/**
 * Search expenses by text query
 * Generates embedding for query and finds similar expenses
 */
export async function searchExpensesByText(
  supabase: SupabaseClient,
  userId: string,
  query: string,
  options: {
    limit?: number;
    threshold?: number;
  } = {}
): Promise<{
  results: SimilarExpense[];
  queryTokens: number;
  queryCostUsd: number;
}> {
  // Generate embedding for query
  const { embedding, tokens, costUsd } = await generateEmbedding(query);

  // Search for similar expenses
  const results = await searchSimilarExpenses(supabase, userId, embedding, options);

  return {
    results,
    queryTokens: tokens,
    queryCostUsd: costUsd,
  };
}

/**
 * SQL to create the expense_embeddings table in Supabase
 *
 * IMPORTANT: Run these commands in Supabase SQL Editor in order:
 * 1. Enable pgvector extension
 * 2. Create the table
 * 3. Create the search function
 */
export const EXPENSE_EMBEDDINGS_SQL = `
-- Step 1: Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: Create expense_embeddings table
CREATE TABLE IF NOT EXISTS expense_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id UUID NOT NULL UNIQUE REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  embedding vector(1536) NOT NULL,
  text_content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_expense_embeddings_user_id ON expense_embeddings(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_embeddings_expense_id ON expense_embeddings(expense_id);

-- HNSW index for fast similarity search (recommended for production)
CREATE INDEX IF NOT EXISTS idx_expense_embeddings_vector ON expense_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Enable RLS
ALTER TABLE expense_embeddings ENABLE ROW LEVEL SECURITY;

-- Policies: users can only access their own embeddings
CREATE POLICY "Users can view own expense_embeddings"
  ON expense_embeddings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expense_embeddings"
  ON expense_embeddings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expense_embeddings"
  ON expense_embeddings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expense_embeddings"
  ON expense_embeddings FOR DELETE
  USING (auth.uid() = user_id);

-- Step 3: Create the similarity search function
CREATE OR REPLACE FUNCTION match_expenses(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_user_id uuid
)
RETURNS TABLE (
  expense_id uuid,
  note text,
  amount numeric,
  category text,
  date date,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id AS expense_id,
    e.note,
    e.amount,
    e.category,
    e.date,
    1 - (ee.embedding <=> query_embedding) AS similarity
  FROM expense_embeddings ee
  JOIN expenses e ON ee.expense_id = e.id
  WHERE ee.user_id = p_user_id
    AND 1 - (ee.embedding <=> query_embedding) > match_threshold
  ORDER BY ee.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
`;
