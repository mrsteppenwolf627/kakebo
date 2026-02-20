/**
 * POST /api/ai/agent-v2/stream
 *
 * Streaming version of the agent-v2 endpoint.
 * Returns Server-Sent Events (SSE) instead of a single JSON response.
 *
 * SSE event format:
 *   data: {"type":"thinking"}\n\n
 *   data: {"type":"tools","names":["analyzeSpendingPattern"]}\n\n
 *   data: {"type":"executing"}\n\n
 *   data: {"type":"chunk","text":"Has "}\n\n
 *   ...more chunks...
 *   data: {"type":"done","toolsUsed":[...],"metrics":{...}}\n\n
 *
 * Error events:
 *   data: {"type":"error","message":"..."}\n\n
 *
 * Confirmation events (write operations with ENABLE_WRITE_CONFIRMATION=true):
 *   data: {"type":"confirmation","request":{...}}\n\n
 *   data: {"type":"done",...}\n\n
 *
 * Client usage (fetch + ReadableStream):
 *   const response = await fetch('/api/ai/agent-v2/stream', { method: 'POST', body: ... });
 *   const reader = response.body.getReader();
 *   // read + parse SSE events
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/api";
import { processFunctionCallingStream } from "@/lib/agents-v2/stream-caller";

// ─── Request schema (matches agent-v2 for compatibility) ─────────────────────

const streamRequestSchema = z.object({
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
  confirmedAction: z
    .object({
      toolCall: z.object({
        id: z.string(),
        type: z.literal("function"),
        function: z.object({
          name: z.string(),
          arguments: z.string(),
        }),
      }),
      toolName: z.string(),
      arguments: z.record(z.string(), z.unknown()),
      description: z.string(),
    })
    .optional(),
});

// ─── SSE helpers ──────────────────────────────────────────────────────────────

const encoder = new TextEncoder();

function sseData(payload: object): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Auth (outside the stream so auth errors return normal 401)
  let user: { id: string };
  let supabase: Awaited<ReturnType<typeof createClient>>;

  try {
    user = await requireAuth();
    supabase = await createClient();
  } catch {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validate body (outside stream for clean 422 responses)
  let input: z.infer<typeof streamRequestSchema>;
  try {
    const body = await request.json();
    input = streamRequestSchema.parse(body);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 422,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── Create SSE ReadableStream ─────────────────────────────────────────────
  const stream = new ReadableStream({
    async start(controller) {
      try {
        await processFunctionCallingStream(
          input.message,
          input.history,
          supabase,
          user.id,
          (event) => {
            // Bridge callback event → SSE data frame
            controller.enqueue(sseData(event));
          },
          input.confirmedAction
        );
      } catch {
        // Unhandled error (processFunctionCallingStream already handles internal errors)
        controller.enqueue(
          sseData({ type: "error", message: "Error interno del servidor" })
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx/Vercel response buffering
    },
  });
}
