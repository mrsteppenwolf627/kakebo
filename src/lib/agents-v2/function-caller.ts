/**
 * OpenAI Function Calling orchestrator (v2)
 *
 * This replaces the LangGraph 3-node pipeline with native OpenAI function calling.
 * Benefits:
 * - 1-2 LLM calls instead of 3 (Router → Tools → Synthesizer)
 * - Better semantic understanding (GPT-native)
 * - Parallel tool execution
 * - Simpler code
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { apiLogger } from "@/lib/logger";
import { openai, DEFAULT_MODEL, calculateCost } from "@/lib/ai/client";
import type {
  ChatCompletionMessageParam,
  ChatCompletionAssistantMessageParam,
} from "openai/resources/chat/completions";

import { KAKEBO_SYSTEM_PROMPT } from "./prompts";
import { KAKEBO_TOOLS } from "./tools/definitions";
import { executeTools, getToolNames } from "./tools/executor";
import type {
  ConversationMessage,
  AgentResponse,
  OpenAIToolCall,
  OpenAIAssistantMessage,
} from "./types";

/**
 * Process a user message using OpenAI Function Calling
 *
 * Flow:
 * 1. Build messages array (system prompt + history + user message)
 * 2. First LLM call with tools available
 * 3. If no tool calls → return direct response (DONE)
 * 4. If tool calls → execute tools in parallel
 * 5. Second LLM call with tool results
 * 6. Return final response with metrics
 *
 * @param userMessage - Current user message
 * @param conversationHistory - Previous messages in conversation
 * @param supabase - Supabase client
 * @param userId - User ID
 * @returns Agent response with message, tools used, and metrics
 */
export async function processFunctionCalling(
  userMessage: string,
  conversationHistory: ConversationMessage[],
  supabase: SupabaseClient,
  userId: string
): Promise<AgentResponse> {
  const startTime = Date.now();
  let inputTokens = 0;
  let outputTokens = 0;
  let toolCallsCount = 0;

  apiLogger.info(
    {
      userId,
      messageLength: userMessage.length,
      historyLength: conversationHistory.length,
    },
    "Processing message with function calling"
  );

  try {
    // Step 1: Build messages array for OpenAI
    const messages: ChatCompletionMessageParam[] = [
      // System prompt defines role, capabilities, and semantic mapping
      {
        role: "system",
        content: KAKEBO_SYSTEM_PROMPT,
      },

      // Conversation history (for multi-turn context)
      ...conversationHistory.map(
        (msg): ChatCompletionMessageParam => ({
          role: msg.role,
          content: msg.content,
        })
      ),

      // Current user message
      {
        role: "user",
        content: userMessage,
      },
    ];

    // Step 2: First LLM call with tools available
    apiLogger.debug(
      {
        userId,
        messageCount: messages.length,
        toolsAvailable: KAKEBO_TOOLS.length,
      },
      "Making first LLM call with tools"
    );

    const firstCompletion = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages,
      tools: KAKEBO_TOOLS,
      tool_choice: "auto", // Let GPT decide if/which tools to use
      temperature: 0.3, // Lower temperature for more consistent tool calling
    });

    const firstMessage = firstCompletion.choices[0]
      ?.message as OpenAIAssistantMessage;

    // Track token usage from first call
    inputTokens += firstCompletion.usage?.prompt_tokens || 0;
    outputTokens += firstCompletion.usage?.completion_tokens || 0;

    // Step 3: Check if GPT wants to use tools
    if (!firstMessage.tool_calls || firstMessage.tool_calls.length === 0) {
      // No tools needed - return direct response
      const latencyMs = Date.now() - startTime;
      const costUsd = calculateCost(DEFAULT_MODEL, inputTokens, outputTokens);

      apiLogger.info(
        {
          userId,
          latencyMs,
          inputTokens,
          outputTokens,
          costUsd,
          toolsUsed: [],
        },
        "Completed without tools (direct response)"
      );

      return {
        message: firstMessage.content || "No pude generar una respuesta.",
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
      };
    }

    // Step 4: Tools requested - execute them in parallel
    toolCallsCount = firstMessage.tool_calls.length;
    const toolNames = getToolNames(firstMessage.tool_calls);

    apiLogger.info(
      {
        userId,
        toolsRequested: toolNames,
        toolCount: toolCallsCount,
      },
      "Tools requested - executing in parallel"
    );

    const { toolMessages, logs } = await executeTools(
      firstMessage.tool_calls,
      supabase,
      userId
    );

    // Log tool execution results
    const successfulTools = logs.filter((log) => !log.error).length;
    const failedTools = logs.filter((log) => log.error).length;

    apiLogger.debug(
      {
        userId,
        successfulTools,
        failedTools,
        totalExecutionTime: Math.max(...logs.map((l) => l.executionTimeMs)),
      },
      "Tool execution completed"
    );

    // Step 5: Second LLM call with tool results
    const messagesWithTools: ChatCompletionMessageParam[] = [
      ...messages,
      // Assistant message with tool calls
      {
        role: "assistant",
        content: firstMessage.content,
        tool_calls: firstMessage.tool_calls,
      } as ChatCompletionAssistantMessageParam,
      // Tool results
      ...toolMessages,
    ];

    apiLogger.debug(
      {
        userId,
        messageCount: messagesWithTools.length,
      },
      "Making second LLM call with tool results"
    );

    const finalCompletion = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: messagesWithTools,
      temperature: 0.6, // Slightly higher temperature for more natural synthesis
    });

    const finalMessage = finalCompletion.choices[0]?.message;

    // Track token usage from second call
    inputTokens += finalCompletion.usage?.prompt_tokens || 0;
    outputTokens += finalCompletion.usage?.completion_tokens || 0;

    // Step 6: Calculate metrics and return
    const latencyMs = Date.now() - startTime;
    const costUsd = calculateCost(DEFAULT_MODEL, inputTokens, outputTokens);

    apiLogger.info(
      {
        userId,
        latencyMs,
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        costUsd,
        toolsUsed: toolNames,
        toolCalls: toolCallsCount,
      },
      "Function calling completed successfully"
    );

    return {
      message:
        finalMessage?.content || "No pude generar una respuesta final.",
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
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;

    apiLogger.error(
      {
        userId,
        error,
        latencyMs,
        inputTokens,
        outputTokens,
      },
      "Function calling failed"
    );

    // Return error response
    return {
      message:
        "Lo siento, hubo un error al procesar tu solicitud. Por favor, inténtalo de nuevo.",
      toolsUsed: [],
      metrics: {
        model: DEFAULT_MODEL,
        latencyMs,
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        costUsd: calculateCost(DEFAULT_MODEL, inputTokens, outputTokens),
        toolCalls: toolCallsCount,
      },
    };
  }
}

/**
 * Build conversation messages from history
 *
 * Utility function to convert conversation history to OpenAI format
 */
export function buildConversationMessages(
  history: ConversationMessage[]
): ChatCompletionMessageParam[] {
  return history.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
}

/**
 * Validate conversation history
 *
 * Ensures history doesn't exceed reasonable limits
 */
export function validateConversationHistory(
  history: ConversationMessage[]
): { valid: boolean; error?: string } {
  // Max 50 messages in history (25 turns)
  if (history.length > 50) {
    return {
      valid: false,
      error: "Conversation history too long (max 50 messages)",
    };
  }

  // Validate message structure
  for (const msg of history) {
    if (!msg.role || !msg.content) {
      return {
        valid: false,
        error: "Invalid message in history (missing role or content)",
      };
    }
    if (msg.role !== "user" && msg.role !== "assistant") {
      return {
        valid: false,
        error: `Invalid role in history: ${msg.role}`,
      };
    }
  }

  return { valid: true };
}
