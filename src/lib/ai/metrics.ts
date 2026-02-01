import { SupabaseClient } from "@supabase/supabase-js";
import { apiLogger } from "@/lib/logger";

/**
 * AI Log entry for tracking and evaluation
 */
export interface AILogEntry {
  id?: string;
  user_id: string;
  type: "classification" | "assistant";
  input: string;
  output: unknown;
  model: string;
  prompt_version?: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  latency_ms: number;
  tools_used?: string[];
  success: boolean;
  error_message?: string;
  // For classification: was it corrected by user?
  was_corrected?: boolean;
  corrected_category?: string;
  created_at?: string;
}

/**
 * Aggregated metrics for dashboard
 */
export interface AIMetrics {
  period: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRate: number;
  totalCostUsd: number;
  avgCostPerRequest: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  avgLatencyMs: number;
  byType: {
    classification: number;
    assistant: number;
  };
  byModel: Record<string, number>;
  // Classification accuracy (if corrections available)
  classificationsTotal: number;
  classificationsCorrected: number;
  classificationAccuracy: number;
}

/**
 * Log an AI interaction to the database
 */
export async function logAIInteraction(
  supabase: SupabaseClient,
  entry: Omit<AILogEntry, "id" | "created_at">
): Promise<void> {
  try {
    const { error } = await supabase.from("ai_logs").insert({
      user_id: entry.user_id,
      type: entry.type,
      input: entry.input,
      output: entry.output,
      model: entry.model,
      prompt_version: entry.prompt_version,
      input_tokens: entry.input_tokens,
      output_tokens: entry.output_tokens,
      cost_usd: entry.cost_usd,
      latency_ms: entry.latency_ms,
      tools_used: entry.tools_used,
      success: entry.success,
      error_message: entry.error_message,
    });

    if (error) {
      // Don't throw - logging shouldn't break the main flow
      apiLogger.warn({ error }, "Failed to log AI interaction");
    }
  } catch (err) {
    apiLogger.warn({ err }, "Failed to log AI interaction");
  }
}

/**
 * Get aggregated AI metrics for a period
 */
export async function getAIMetrics(
  supabase: SupabaseClient,
  userId: string,
  options: {
    startDate?: string;
    endDate?: string;
  } = {}
): Promise<AIMetrics> {
  const startDate =
    options.startDate ||
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const endDate = options.endDate || new Date().toISOString();

  let query = supabase
    .from("ai_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", startDate)
    .lte("created_at", endDate);

  const { data: logs, error } = await query;

  if (error) {
    apiLogger.error({ error }, "Failed to fetch AI metrics");
    return createEmptyMetrics(startDate, endDate);
  }

  if (!logs || logs.length === 0) {
    return createEmptyMetrics(startDate, endDate);
  }

  // Calculate aggregated metrics
  const totalRequests = logs.length;
  const successfulRequests = logs.filter((l) => l.success).length;
  const failedRequests = totalRequests - successfulRequests;

  const totalCostUsd = logs.reduce((sum, l) => sum + (l.cost_usd || 0), 0);
  const totalInputTokens = logs.reduce((sum, l) => sum + (l.input_tokens || 0), 0);
  const totalOutputTokens = logs.reduce((sum, l) => sum + (l.output_tokens || 0), 0);
  const avgLatencyMs =
    logs.reduce((sum, l) => sum + (l.latency_ms || 0), 0) / totalRequests;

  // By type
  const classifications = logs.filter((l) => l.type === "classification");
  const assistantCalls = logs.filter((l) => l.type === "assistant");

  // By model
  const byModel: Record<string, number> = {};
  for (const log of logs) {
    byModel[log.model] = (byModel[log.model] || 0) + 1;
  }

  // Classification accuracy
  const classificationsCorrected = classifications.filter(
    (l) => l.was_corrected
  ).length;

  return {
    period: `${startDate.split("T")[0]} to ${endDate.split("T")[0]}`,
    totalRequests,
    successfulRequests,
    failedRequests,
    successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
    totalCostUsd: Math.round(totalCostUsd * 10000) / 10000,
    avgCostPerRequest:
      totalRequests > 0
        ? Math.round((totalCostUsd / totalRequests) * 10000) / 10000
        : 0,
    totalInputTokens,
    totalOutputTokens,
    avgLatencyMs: Math.round(avgLatencyMs),
    byType: {
      classification: classifications.length,
      assistant: assistantCalls.length,
    },
    byModel,
    classificationsTotal: classifications.length,
    classificationsCorrected,
    classificationAccuracy:
      classifications.length > 0
        ? Math.round(
            ((classifications.length - classificationsCorrected) /
              classifications.length) *
              100
          )
        : 100,
  };
}

/**
 * Record a classification correction (for accuracy tracking)
 */
export async function recordCorrection(
  supabase: SupabaseClient,
  logId: string,
  correctedCategory: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from("ai_logs")
      .update({
        was_corrected: true,
        corrected_category: correctedCategory,
      })
      .eq("id", logId);

    if (error) {
      apiLogger.warn({ error }, "Failed to record correction");
    }
  } catch (err) {
    apiLogger.warn({ err }, "Failed to record correction");
  }
}

/**
 * Get recent AI logs for debugging/review
 */
export async function getRecentLogs(
  supabase: SupabaseClient,
  userId: string,
  limit: number = 20
): Promise<AILogEntry[]> {
  const { data, error } = await supabase
    .from("ai_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    apiLogger.error({ error }, "Failed to fetch recent logs");
    return [];
  }

  return data || [];
}

function createEmptyMetrics(startDate: string, endDate: string): AIMetrics {
  return {
    period: `${startDate.split("T")[0]} to ${endDate.split("T")[0]}`,
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    successRate: 0,
    totalCostUsd: 0,
    avgCostPerRequest: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    avgLatencyMs: 0,
    byType: { classification: 0, assistant: 0 },
    byModel: {},
    classificationsTotal: 0,
    classificationsCorrected: 0,
    classificationAccuracy: 100,
  };
}

/**
 * SQL to create the ai_logs table in Supabase
 *
 * Run this in Supabase SQL Editor:
 */
export const AI_LOGS_TABLE_SQL = `
-- Create ai_logs table for tracking AI interactions
CREATE TABLE IF NOT EXISTS ai_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('classification', 'assistant')),
  input TEXT NOT NULL,
  output JSONB,
  model TEXT NOT NULL,
  prompt_version TEXT,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  cost_usd DECIMAL(10, 6) DEFAULT 0,
  latency_ms INTEGER DEFAULT 0,
  tools_used TEXT[],
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  was_corrected BOOLEAN DEFAULT false,
  corrected_category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_ai_logs_user_id ON ai_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_created_at ON ai_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_logs_type ON ai_logs(type);

-- Enable RLS
ALTER TABLE ai_logs ENABLE ROW LEVEL SECURITY;

-- Policy: users can only see their own logs
CREATE POLICY "Users can view own ai_logs"
  ON ai_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: users can insert their own logs
CREATE POLICY "Users can insert own ai_logs"
  ON ai_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: users can update their own logs (for corrections)
CREATE POLICY "Users can update own ai_logs"
  ON ai_logs FOR UPDATE
  USING (auth.uid() = user_id);
`;
