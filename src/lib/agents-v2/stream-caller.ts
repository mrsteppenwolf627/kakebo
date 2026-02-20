/**
 * Streaming version of the OpenAI Function Calling orchestrator (v2)
 *
 * Emits SSE-style events via callback throughout the request lifecycle:
 *
 *   thinking    → First LLM call started (show "Pensando...")
 *   tools       → Tool names identified (show "Consultando: analyzeSpendingPattern")
 *   executing   → Tools running (show "Analizando datos...")
 *   chunk       → Token from LLM output (append to message bubble)
 *   done        → Complete response (toolsUsed + metrics)
 *   error       → Unrecoverable error
 *   confirmation → Write operation needs user approval (same as non-streaming flow)
 *
 * Streaming strategy:
 *   - First LLM call: stream: true
 *     • Direct response (no tools) → text chunks emitted live
 *     • Tool response → tool_call deltas buffered, no text emitted
 *   - Second LLM call (synthesis): stream: true
 *     → text chunks emitted live
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { apiLogger } from "@/lib/logger";
import { openai, DEFAULT_MODEL, calculateCost } from "@/lib/ai/client";
import type {
  ChatCompletionMessageParam,
  ChatCompletionAssistantMessageParam,
} from "openai/resources/chat/completions";

import { KAKEBO_SYSTEM_PROMPT } from "./prompts";
import { KAKEBO_TOOLS, TOOL_METADATA } from "./tools/definitions";
import { executeTools, getToolNames } from "./tools/executor";
import {
  getUserContextCached,
  generateContextDisclaimer,
} from "./context-analyzer";
import {
  getRelevantExamples,
  formatExamplesForPrompt,
} from "@/lib/agents/tools/utils/example-retriever";
import type {
  ConversationMessage,
  ExecutionMetrics,
  OpenAIToolCall,
  PendingAction,
  ConfirmationRequest,
} from "./types";

// ─── Event types ──────────────────────────────────────────────────────────────

export type StreamEvent =
  | { type: "thinking" }
  | { type: "tools"; names: string[] }
  | { type: "executing" }
  | { type: "chunk"; text: string }
  | { type: "done"; toolsUsed: string[]; metrics: ExecutionMetrics }
  | { type: "error"; message: string }
  | { type: "confirmation"; request: ConfirmationRequest };

export type StreamEventCallback = (event: StreamEvent) => void;

// ─── Tool call validation (mirrors function-caller.ts) ───────────────────────

const TOOL_CALLING_LIMITS = {
  maxToolsPerCall: 3,
  forbiddenCombinations: [["predictMonthlySpending", "getSpendingTrends"]] as const,
  requiredCompanions: {
    predictMonthlySpending: "getBudgetStatus",
  } as const,
};

function filterToolCalls(toolCalls: OpenAIToolCall[]): OpenAIToolCall[] {
  // 1. Limit count
  let filtered = toolCalls.slice(0, TOOL_CALLING_LIMITS.maxToolsPerCall);

  // 2. Remove forbidden combinations
  const names = filtered.map((tc) => tc.function.name);
  for (const [a, b] of TOOL_CALLING_LIMITS.forbiddenCombinations) {
    if (names.includes(a) && names.includes(b)) {
      filtered = filtered.filter((tc) => tc.function.name !== b);
    }
  }

  return filtered;
}

// ─── Main streaming function ──────────────────────────────────────────────────

/**
 * Process a user message with streaming output via SSE-style callbacks.
 *
 * @param userMessage           Current user message
 * @param conversationHistory   Previous messages
 * @param supabase              Supabase client
 * @param userId                User ID
 * @param onEvent               Callback receiving stream events
 * @param confirmedAction       Optional: user-confirmed pending action
 */
export async function processFunctionCallingStream(
  userMessage: string,
  conversationHistory: ConversationMessage[],
  supabase: SupabaseClient,
  userId: string,
  onEvent: StreamEventCallback,
  confirmedAction?: PendingAction
): Promise<void> {
  const startTime = Date.now();
  let inputTokens = 0;
  let outputTokens = 0;
  let toolCallsCount = 0;

  try {
    // ── User context (same as function-caller.ts) ─────────────────────────
    const userContext = await getUserContextCached(supabase, userId);
    const contextDisclaimer = generateContextDisclaimer(userContext);

    // ── P1-2: Few-shot correction examples ───────────────────────────────
    let correctionExamplesMessage = "";
    try {
      const examples = await getRelevantExamples(supabase, userId, {
        limit: 6,
        minConfidence: 0.8,
      });
      if (examples.length > 0) {
        correctionExamplesMessage = formatExamplesForPrompt(examples);
      }
    } catch {
      // Non-blocking
    }

    // ── Build messages ────────────────────────────────────────────────────
    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: KAKEBO_SYSTEM_PROMPT },
      { role: "system", content: contextDisclaimer },
      ...(correctionExamplesMessage
        ? [
            {
              role: "system" as const,
              content: `CORRECCIONES PREVIAS DEL USUARIO (úsalas para categorizar con precisión):\n${correctionExamplesMessage}`,
            },
          ]
        : []),
      ...conversationHistory.map(
        (msg): ChatCompletionMessageParam => ({
          role: msg.role,
          content: msg.content,
        })
      ),
      { role: "user", content: userMessage },
    ];

    // ── Emit: thinking ────────────────────────────────────────────────────
    onEvent({ type: "thinking" });

    // ── First LLM call — stream: true ─────────────────────────────────────
    // • Direct response: text chunks arrive → emit as "chunk" events
    // • Tool response: tool_call deltas buffered → no text emitted
    const firstStream = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages,
      tools: KAKEBO_TOOLS,
      tool_choice: "auto",
      stream: true,
      stream_options: { include_usage: true },
    });

    // Buffer for assembling tool_call argument fragments
    const toolCallBuffers = new Map<
      number,
      { id: string; name: string; arguments: string }
    >();
    let hasToolCalls = false;

    for await (const chunk of firstStream) {
      const delta = chunk.choices[0]?.delta;

      // Text content → emit as chunk (direct response path)
      if (delta?.content) {
        onEvent({ type: "chunk", text: delta.content });
      }

      // Tool call deltas → buffer (tool response path)
      if (delta?.tool_calls) {
        hasToolCalls = true;
        for (const tc of delta.tool_calls) {
          const idx = tc.index ?? 0;
          if (!toolCallBuffers.has(idx)) {
            toolCallBuffers.set(idx, { id: "", name: "", arguments: "" });
          }
          const buf = toolCallBuffers.get(idx)!;
          if (tc.id) buf.id = tc.id;
          if (tc.function?.name) buf.name = tc.function.name;
          if (tc.function?.arguments) buf.arguments += tc.function.arguments;
        }
      }

      // Usage from last chunk (stream_options.include_usage)
      if (chunk.usage) {
        inputTokens += chunk.usage.prompt_tokens ?? 0;
        outputTokens += chunk.usage.completion_tokens ?? 0;
      }
    }

    // ── Direct response: done ─────────────────────────────────────────────
    if (!hasToolCalls) {
      const latencyMs = Date.now() - startTime;
      const costUsd = calculateCost(DEFAULT_MODEL, inputTokens, outputTokens);
      onEvent({
        type: "done",
        toolsUsed: [],
        metrics: {
          model: DEFAULT_MODEL,
          latencyMs,
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
          costUsd,
          toolCalls: 0,
        },
      });
      return;
    }

    // ── Tool response path ────────────────────────────────────────────────

    // Reconstruct OpenAIToolCall[] from buffered deltas
    const assembledToolCalls: OpenAIToolCall[] = Array.from(
      toolCallBuffers.values()
    ).map((buf) => ({
      id: buf.id,
      type: "function" as const,
      function: { name: buf.name, arguments: buf.arguments },
    }));

    // Validate & filter
    const toolCallsToExecute = confirmedAction
      ? [confirmedAction.toolCall]
      : filterToolCalls(assembledToolCalls);

    toolCallsCount = toolCallsToExecute.length;
    const toolNames = getToolNames(toolCallsToExecute);

    // ── Emit: tools identified ────────────────────────────────────────────
    onEvent({ type: "tools", names: toolNames });

    // ── Write confirmation check ──────────────────────────────────────────
    const confirmationEnabled = process.env.ENABLE_WRITE_CONFIRMATION === "true";
    const toolsNeedingConfirmation = toolCallsToExecute.filter((tc) => {
      const meta = TOOL_METADATA[tc.function.name];
      return meta?.requiresConfirmation === true;
    });

    if (confirmationEnabled && toolsNeedingConfirmation.length > 0 && !confirmedAction) {
      const tc = toolsNeedingConfirmation[0];
      const toolName = tc.function.name;
      const args = JSON.parse(tc.function.arguments);
      const meta = TOOL_METADATA[toolName];
      const confirmMsg = meta.confirmationTemplate
        ? meta.confirmationTemplate(args)
        : "¿Confirmas que quieres ejecutar esta acción?";

      const latencyMs = Date.now() - startTime;
      const costUsd = calculateCost(DEFAULT_MODEL, inputTokens, outputTokens);

      onEvent({
        type: "confirmation",
        request: {
          message: confirmMsg,
          pendingAction: { toolCall: tc, toolName, arguments: args, description: confirmMsg },
          requiresConfirmation: true,
        },
      });

      onEvent({
        type: "done",
        toolsUsed: [],
        metrics: {
          model: DEFAULT_MODEL,
          latencyMs,
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
          costUsd,
          toolCalls: 0,
        },
      });
      return;
    }

    // ── Emit: executing ───────────────────────────────────────────────────
    onEvent({ type: "executing" });

    // ── Execute tools in parallel ─────────────────────────────────────────
    const { toolMessages } = await executeTools(toolCallsToExecute, supabase, userId);

    // ── Build messages for synthesis call ────────────────────────────────
    const messagesWithTools: ChatCompletionMessageParam[] = [
      ...messages,
      {
        role: "assistant",
        content: null,
        tool_calls: assembledToolCalls,
      } as ChatCompletionAssistantMessageParam,
      ...toolMessages,
    ];

    // ── Second LLM call — stream synthesis ───────────────────────────────
    const secondStream = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: messagesWithTools,
      stream: true,
      stream_options: { include_usage: true },
    });

    for await (const chunk of secondStream) {
      const text = chunk.choices[0]?.delta?.content ?? "";
      if (text) {
        onEvent({ type: "chunk", text });
      }
      if (chunk.usage) {
        inputTokens += chunk.usage.prompt_tokens ?? 0;
        outputTokens += chunk.usage.completion_tokens ?? 0;
      }
    }

    // ── Done ──────────────────────────────────────────────────────────────
    const latencyMs = Date.now() - startTime;
    const costUsd = calculateCost(DEFAULT_MODEL, inputTokens, outputTokens);

    apiLogger.info(
      { userId, latencyMs, toolsUsed: toolNames, inputTokens, outputTokens, costUsd },
      "Streaming function calling completed"
    );

    onEvent({
      type: "done",
      toolsUsed: toolNames,
      metrics: {
        model: DEFAULT_MODEL,
        latencyMs,
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        costUsd,
        toolCalls: toolCallsCount,
      },
    });
  } catch (error) {
    apiLogger.error({ error, userId }, "Stream calling failed");
    onEvent({
      type: "error",
      message: "Lo siento, hubo un error al procesar tu solicitud. Por favor, inténtalo de nuevo.",
    });
  }
}
