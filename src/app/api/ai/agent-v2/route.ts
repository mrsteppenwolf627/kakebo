import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  responses,
  handleApiError,
  requireAuth,
  withLogging,
} from "@/lib/api";
import { processFunctionCalling } from "@/lib/agents-v2/function-caller";

/**
 * Request schema for agent-v2 endpoint
 *
 * Same as v1 for compatibility with existing frontend
 */
const agentRequestSchema = z.object({
  message: z
    .string()
    .min(1, "El mensaje no puede estar vacío")
    .max(1000, "El mensaje no puede exceder 1000 caracteres"),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .optional()
    .default([]),
});

type AgentRequest = z.infer<typeof agentRequestSchema>;

/**
 * POST /api/ai/agent-v2
 *
 * Process a user message using OpenAI Function Calling (v2 architecture)
 *
 * This endpoint uses the new function calling approach instead of LangGraph:
 * - 1-2 LLM calls instead of 3 (Router → Tools → Synthesizer)
 * - Better semantic understanding via native GPT function calling
 * - Parallel tool execution for lower latency
 * - Simpler codebase
 *
 * Request body:
 * ```json
 * {
 *   "message": "¿Cuánto he gastado en comida este mes?",
 *   "history": [
 *     { "role": "user", "content": "..." },
 *     { "role": "assistant", "content": "..." }
 *   ]
 * }
 * ```
 *
 * Response format (compatible with v1 for frontend):
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "message": "Has gastado €450 en comida este mes...",
 *     "toolsUsed": ["analyzeSpendingPattern"],
 *     "metrics": {
 *       "model": "gpt-4o-mini",
 *       "latencyMs": 1234,
 *       "inputTokens": 150,
 *       "outputTokens": 85,
 *       "totalTokens": 235,
 *       "costUsd": 0.0002,
 *       "toolCalls": 1
 *     }
 *   }
 * }
 * ```
 *
 * Errors:
 * - 401: Not authenticated
 * - 422: Validation error (invalid message or history)
 * - 500: Server error (LLM error, tool execution error, etc.)
 */
export const POST = withLogging(async (request: NextRequest) => {
  try {
    // Require authentication
    const user = await requireAuth();

    // Parse and validate request body
    const body = await request.json();
    const input = agentRequestSchema.parse(body);

    // Get Supabase client for tool execution
    const supabase = await createClient();

    // Process message using OpenAI Function Calling
    const result = await processFunctionCalling(
      input.message,
      input.history,
      supabase,
      user.id
    );

    // Return successful response
    // Format is compatible with v1 (frontend expects same structure)
    return responses.ok({
      message: result.message,
      toolsUsed: result.toolsUsed,
      metrics: result.metrics,
    });
  } catch (error) {
    // Handle all errors (validation, auth, processing)
    return handleApiError(error);
  }
});

/**
 * GET /api/ai/agent-v2
 *
 * Health check endpoint
 * Returns information about the v2 agent system
 */
export async function GET() {
  return responses.ok({
    status: "ready",
    version: "2.0.0",
    architecture: "OpenAI Function Calling",
    capabilities: [
      "analyze_spending", // analyzeSpendingPattern
      "check_budget", // getBudgetStatus
      "detect_anomalies", // detectAnomalies
      "predict_spending", // predictMonthlySpending
      "view_trends", // getSpendingTrends
    ],
    tools: [
      "analyzeSpendingPattern",
      "getBudgetStatus",
      "detectAnomalies",
      "predictMonthlySpending",
      "getSpendingTrends",
    ],
    model: "gpt-4o-mini",
    features: [
      "Native GPT function calling",
      "Parallel tool execution",
      "Semantic category mapping",
      "Multi-turn conversation context",
      "1-2 LLM calls (vs 3 in v1)",
    ],
    improvements: {
      latency: "40-60% faster than v1",
      semanticUnderstanding: "Better natural language interpretation",
      codeComplexity: "Simpler architecture without LangGraph",
    },
  });
}
