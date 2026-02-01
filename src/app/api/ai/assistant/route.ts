import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { responses, handleApiError, requireAuth, withLogging } from "@/lib/api";
import { processMessage, Message } from "@/lib/ai";
import { z } from "zod";

/**
 * Schema for assistant request
 */
const assistantRequestSchema = z.object({
  message: z
    .string()
    .min(1, { message: "El mensaje no puede estar vacío" })
    .max(1000, { message: "El mensaje no puede exceder 1000 caracteres" }),
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

/**
 * POST /api/ai/assistant
 * Chat with the Kakebo AI assistant
 *
 * Body:
 * - message: string (required) - User's message
 * - history: Message[] (optional) - Previous conversation messages
 *
 * Returns:
 * - message: AI response text
 * - toolsUsed: Array of tools that were called
 * - metrics: { model, latencyMs, inputTokens, outputTokens, costUsd, toolCalls }
 *
 * Example:
 * ```
 * POST /api/ai/assistant
 * { "message": "Añade 30€ de gasolina" }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "message": "He registrado 30€ en supervivencia (Gasolina) ✓",
 *     "toolsUsed": [{ "name": "create_expense", ... }],
 *     "metrics": { ... }
 *   }
 * }
 * ```
 */
export const POST = withLogging(async (request: NextRequest) => {
  try {
    const user = await requireAuth();
    const supabase = createClient();

    const body = await request.json();
    const input = assistantRequestSchema.parse(body);

    const result = await processMessage(
      input.message,
      input.history as Message[],
      supabase,
      user.id
    );

    return responses.ok(result);
  } catch (error) {
    return handleApiError(error);
  }
});
