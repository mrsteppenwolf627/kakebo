import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  responses,
  handleApiError,
  requireAuth,
  withLogging,
  ApiError,
} from "@/lib/api";
import { processAgentMessage } from "@/lib/agents";
import { canUsePremium, Profile } from "@/lib/auth/access-control";

/**
 * Request schema for agent endpoint
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
 * POST /api/ai/agent
 *
 * Process a user message through the multi-agent system
 *
 * Request body:
 * ```json
 * {
 *   "message": "¿Cuánto he gastado en comida?",
 *   "history": [
 *     { "role": "user", "content": "..." },
 *     { "role": "assistant", "content": "..." }
 *   ]
 * }
 * ```
 *
 * Response:
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "message": "Este mes has gastado €350 en la categoría Supervivencia",
 *     "intent": "analyze_spending",
 *     "toolsUsed": ["analyzeSpendingPattern"],
 *     "metrics": {
 *       "model": "gpt-4o-mini",
 *       "latencyMs": 1234,
 *       "inputTokens": 45,
 *       "outputTokens": 120,
 *       "costUsd": 0.002,
 *       "toolCalls": 1
 *     }
 *   }
 * }
 * ```
 *
 * Errors:
 * - 401: Not authenticated
 * - 422: Validation error
 * - 500: Server error
 */
export const POST = withLogging(async (request: NextRequest) => {
  try {
    // Require authentication
    const user = await requireAuth();

    // Get Supabase client
    const supabase = await createClient();

    // Check Premium Access (Reverse Trial / Subscription)
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!canUsePremium(profile as Profile)) {
      throw new ApiError(
        "FORBIDDEN",
        "Tu periodo de prueba ha finalizado. Suscríbete para continuar usando el Agente IA.",
        403
      );
    }

    // Parse and validate request
    const body = await request.json();
    const input = agentRequestSchema.parse(body);

    // Process message through agent
    const result = await processAgentMessage(
      input.message,
      input.history,
      supabase,
      user.id
    );

    // Return successful response
    return responses.ok(result);
  } catch (error) {
    // Handle all errors (validation, auth, processing)
    return handleApiError(error);
  }
});

/**
 * GET /api/ai/agent
 *
 * Health check endpoint
 * Returns information about the agent system
 */
export async function GET() {
  return responses.ok({
    status: "ready",
    version: "1.0.0",
    capabilities: [
      "analyze_spending",
      "check_budget",
      "detect_anomalies",
      "predict_spending",
      "view_trends",
    ],
    model: "gpt-4o-mini",
  });
}
