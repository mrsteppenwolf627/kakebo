import { NextRequest } from "next/server";
import { responses, handleApiError, requireAuth, withLogging } from "@/lib/api";
import { classifyExpenseSchema, classifyExpensesBatchSchema } from "@/lib/schemas";
import { classifyExpense, classifyExpenses } from "@/lib/ai";

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
    // Auth is optional for classification (could be used before creating expense)
    // But we still check to track usage per user
    await requireAuth();

    const body = await request.json();

    // Check if it's a batch request
    if (body.texts && Array.isArray(body.texts)) {
      const input = classifyExpensesBatchSchema.parse(body);

      const results = await classifyExpenses(input.texts, {
        model: input.model,
        promptVersion: input.promptVersion,
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
    });

    return responses.ok(result);
  } catch (error) {
    return handleApiError(error);
  }
});
