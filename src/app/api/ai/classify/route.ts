import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { responses, handleApiError, requireAuth, withLogging } from "@/lib/api";
import { classifyExpenseSchema, classifyExpensesBatchSchema } from "@/lib/schemas";
import { classifyExpense, classifyExpenses, logAIInteraction } from "@/lib/ai";

/**
 * POST /api/ai/classify
 * Classify an expense using AI
 *
 * Body:
 * - text: string (required) - The expense to classify
 * - promptVersion: string (optional) - Specific prompt version
 * - model: "gpt-4o-mini" | "gpt-4o" (optional)
 *
 * Or for batch:
 * - texts: string[] (required) - Array of expenses to classify
 *
 * Returns:
 * - category: survival|optional|culture|extra
 * - note: Suggested note/description
 * - confidence: 0-1 confidence score
 * - metrics: { model, promptVersion, latencyMs, inputTokens, outputTokens, costUsd }
 */
export const POST = withLogging(async (request: NextRequest) => {
  try {
    // Auth is required for classification to track usage per user
    const user = await requireAuth();
    const supabase = await createClient();

    const body = await request.json();

    // Check if it's a batch request
    if (body.texts && Array.isArray(body.texts)) {
      const input = classifyExpensesBatchSchema.parse(body);

      const results = await classifyExpenses(input.texts, {
        model: input.model,
        promptVersion: input.promptVersion,
        supabase, // Pass supabase client for P1-2 correction examples
        userId: user.id, // Pass user ID for P1-2 correction examples
      });

      // Calculate totals
      const totalMetrics = {
        totalLatencyMs: results.reduce((sum, r) => sum + r.metrics.latencyMs, 0),
        totalInputTokens: results.reduce((sum, r) => sum + r.metrics.inputTokens, 0),
        totalOutputTokens: results.reduce((sum, r) => sum + r.metrics.outputTokens, 0),
        totalCostUsd: results.reduce((sum, r) => sum + r.metrics.costUsd, 0),
      };

      return responses.ok({
        results,
        totals: totalMetrics,
      });
    }

    // Single classification
    const input = classifyExpenseSchema.parse(body);

    const result = await classifyExpense(input.text, {
      model: input.model,
      promptVersion: input.promptVersion,
      supabase, // Pass supabase client for P1-2 correction examples
      userId: user.id, // Pass user ID for P1-2 correction examples
    });

    // Log the AI interaction and get the logId
    const { data: logData } = await supabase
      .from("ai_logs")
      .insert({
        user_id: user.id,
        type: "classification",
        input: input.text,
        output: { category: result.category, note: result.note, confidence: result.confidence },
        model: result.metrics.model,
        prompt_version: result.metrics.promptVersion,
        input_tokens: result.metrics.inputTokens,
        output_tokens: result.metrics.outputTokens,
        cost_usd: result.metrics.costUsd,
        latency_ms: result.metrics.latencyMs,
        success: result.confidence > 0,
        error_message: result.confidence === 0 ? "Classification failed" : null,
      })
      .select("id")
      .single();

    return responses.ok({
      ...result,
      logId: logData?.id || null,
    });
  } catch (error) {
    return handleApiError(error);
  }
});
