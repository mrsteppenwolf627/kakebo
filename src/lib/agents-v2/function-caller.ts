/**
 * OpenAI Function Calling orchestrator (v2)
 *
 * This replaces the LangGraph 3-node pipeline with native OpenAI function calling.
 * Benefits:
 * - 1-2 LLM calls instead of 3 (Router → Tools → Synthesizer)
 * - Better semantic understanding (GPT-native)
 * - Parallel tool execution
 * - Simpler code
 *
 * VERSION: 2.1 - Added user context awareness and tool calling limits
 */

/**
 * Tool calling constraints to prevent abuse and control costs
 */
const TOOL_CALLING_LIMITS = {
  // Maximum tools per request (prevents GPT from calling everything)
  maxToolsPerCall: 3,

  // Forbidden combinations (tools that shouldn't be called together)
  forbiddenCombinations: [
    // Don't predict AND analyze trends simultaneously (redundant)
    ["predictMonthlySpending", "getSpendingTrends"],
  ],

  // Required companions (if tool A is called, tool B should also be called for context)
  requiredCompanions: {
    // If predicting spending, also show current budget status for context
    predictMonthlySpending: "getBudgetStatus",
  },
} as const;

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
  AgentResponse,
  OpenAIToolCall,
  OpenAIAssistantMessage,
  PendingAction,
} from "./types";

/**
 * Validate tool calls against constraints
 *
 * Checks:
 * 1. Not exceeding max tools per call
 * 2. No forbidden combinations
 * 3. Required companions are present
 *
 * @param toolCalls - Tool calls from GPT
 * @returns Validation result with filtered calls if needed
 */
function validateToolCalls(toolCalls: OpenAIToolCall[]): {
  valid: boolean;
  reason?: string;
  filteredCalls?: OpenAIToolCall[];
  warnings?: string[];
} {
  const warnings: string[] = [];

  // 1. Check max limit
  if (toolCalls.length > TOOL_CALLING_LIMITS.maxToolsPerCall) {
    apiLogger.warn(
      {
        toolCount: toolCalls.length,
        maxAllowed: TOOL_CALLING_LIMITS.maxToolsPerCall,
        tools: toolCalls.map((tc) => tc.function.name),
      },
      "Too many tools requested - limiting to first 3"
    );

    // Take first N tools (GPT orders by priority)
    return {
      valid: true,
      reason: `Limited to ${TOOL_CALLING_LIMITS.maxToolsPerCall} tools for performance`,
      filteredCalls: toolCalls.slice(0, TOOL_CALLING_LIMITS.maxToolsPerCall),
      warnings: [
        `Reduced from ${toolCalls.length} to ${TOOL_CALLING_LIMITS.maxToolsPerCall} tools`,
      ],
    };
  }

  // 2. Check forbidden combinations
  const toolNames = toolCalls.map((tc) => tc.function.name);

  for (const forbidden of TOOL_CALLING_LIMITS.forbiddenCombinations) {
    const hasBoth = forbidden.every((tool) => toolNames.includes(tool));

    if (hasBoth) {
      apiLogger.warn(
        {
          forbiddenPair: forbidden,
          requestedTools: toolNames,
        },
        "Forbidden tool combination detected - removing redundant tool"
      );

      // Keep first tool, remove second (it's redundant)
      const filtered = toolCalls.filter(
        (tc) => tc.function.name !== forbidden[1]
      );

      return {
        valid: true,
        reason: `Removed redundant tool: ${forbidden[1]}`,
        filteredCalls: filtered,
        warnings: [
          `${forbidden[0]} and ${forbidden[1]} are redundant - removed ${forbidden[1]}`,
        ],
      };
    }
  }

  // 3. Check for required companions
  for (const [mainTool, companionTool] of Object.entries(
    TOOL_CALLING_LIMITS.requiredCompanions
  )) {
    if (toolNames.includes(mainTool) && !toolNames.includes(companionTool)) {
      warnings.push(
        `${mainTool} called without companion ${companionTool} - context may be incomplete`
      );
    }
  }

  // All checks passed
  return {
    valid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Process a user message using OpenAI Function Calling
 *
 * Flow:
 * 0. Analyze user context (data quality, experience level)
 * 1. Build messages array (system prompt + context + history + user message)
 * 2. First LLM call with tools available
 * 3. If no tool calls → return direct response (DONE)
 * 4. If tool calls → validate and filter tool calls
 * 5. CHECK CONFIRMATION: If tool requires confirmation and not confirmed → return confirmationRequest
 * 6. Execute tools in parallel
 * 7. Second LLM call with tool results
 * 8. Return final response with metrics
 *
 * @param userMessage - Current user message
 * @param conversationHistory - Previous messages in conversation
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param confirmedAction - Optional: Pending action that user has confirmed
 * @returns Agent response with message, tools used, and metrics
 */
export async function processFunctionCalling(
  userMessage: string,
  conversationHistory: ConversationMessage[],
  supabase: SupabaseClient,
  userId: string,
  confirmedAction?: PendingAction
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
    // ========== STEP 0: ANALYZE USER CONTEXT ==========
    // Get user's data quality to adjust bot behavior appropriately
    const userContext = await getUserContextCached(supabase, userId);
    const contextDisclaimer = generateContextDisclaimer(userContext);

    apiLogger.debug(
      {
        userId,
        dataQuality: userContext.dataQuality,
        isNewUser: userContext.isNewUser,
        daysSinceFirst: userContext.daysSinceFirstExpense,
        totalTransactions: userContext.totalTransactions,
      },
      "User context analyzed"
    );
    // =================================================

    // ========== P1-2: FETCH CORRECTION EXAMPLES FOR FEW-SHOT LEARNING ==========
    // Retrieve user's past corrections to guide GPT category decisions
    let correctionExamplesMessage = "";
    try {
      const correctionExamples = await getRelevantExamples(supabase, userId, {
        limit: 6,
        minConfidence: 0.8,
      });
      if (correctionExamples.length > 0) {
        correctionExamplesMessage = formatExamplesForPrompt(correctionExamples);
        apiLogger.debug(
          { userId, count: correctionExamples.length },
          "P1-2: Loaded correction examples for few-shot prompting"
        );
      }
    } catch (err) {
      // Non-blocking: if fetch fails, proceed without examples
      apiLogger.warn({ err, userId }, "P1-2: Failed to load correction examples");
    }
    // =========================================================================

    // Step 1: Build messages array for OpenAI
    const messages: ChatCompletionMessageParam[] = [
      // System prompt defines role, capabilities, and semantic mapping
      {
        role: "system",
        content: KAKEBO_SYSTEM_PROMPT,
      },

      // ========== INJECT USER CONTEXT ==========
      // Dynamic system message that adjusts behavior based on data quality
      {
        role: "system",
        content: contextDisclaimer,
      },
      // ========================================

      // ========== P1-2: FEW-SHOT EXAMPLES ==========
      // Inject correction examples to improve category accuracy
      ...(correctionExamplesMessage
        ? [
            {
              role: "system" as const,
              content: `CORRECCIONES PREVIAS DEL USUARIO (úsalas para categorizar con precisión):\n${correctionExamplesMessage}`,
            },
          ]
        : []),
      // ===============================================

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

    // Step 4: Tools requested - validate and execute them
    toolCallsCount = firstMessage.tool_calls.length;

    // ========== VALIDATE TOOL CALLS ==========
    const validation = validateToolCalls(firstMessage.tool_calls);

    // Use filtered calls if validation adjusted them
    const toolCallsToExecute =
      validation.filteredCalls || firstMessage.tool_calls;

    // Log if validation made changes
    if (validation.reason) {
      apiLogger.info(
        {
          userId,
          originalCount: firstMessage.tool_calls.length,
          filteredCount: toolCallsToExecute.length,
          reason: validation.reason,
        },
        "Tool calls filtered by validation"
      );
    }

    // Log warnings if any
    if (validation.warnings) {
      for (const warning of validation.warnings) {
        apiLogger.warn({ userId, warning }, "Tool calling validation warning");
      }
    }
    // ========================================

    const toolNames = getToolNames(toolCallsToExecute);

    apiLogger.info(
      {
        userId,
        toolsRequested: toolNames,
        toolCount: toolCallsToExecute.length,
      },
      "Tools validated - checking confirmation requirements"
    );

    // ========== STEP 4.5: CHECK WRITE CONFIRMATION ==========
    // If any tool requires confirmation and user hasn't confirmed, return confirmation request
    const toolsRequiringConfirmation = toolCallsToExecute.filter((toolCall) => {
      const toolName = toolCall.function.name;
      const metadata = TOOL_METADATA[toolName];
      return metadata?.requiresConfirmation === true;
    });

    // Check if confirmation is enabled via feature flag
    const confirmationEnabled = process.env.ENABLE_WRITE_CONFIRMATION === "true";

    if (confirmationEnabled && toolsRequiringConfirmation.length > 0 && !confirmedAction) {
      // User needs to confirm - return confirmation request
      const toolCall = toolsRequiringConfirmation[0]; // Take first tool requiring confirmation
      const toolName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);
      const metadata = TOOL_METADATA[toolName];

      const confirmationMessage = metadata.confirmationTemplate
        ? metadata.confirmationTemplate(args)
        : `¿Confirmas que quieres ejecutar esta acción?`;

      const pendingAction: PendingAction = {
        toolCall,
        toolName,
        arguments: args,
        description: confirmationMessage,
      };

      const latencyMs = Date.now() - startTime;
      const costUsd = calculateCost(DEFAULT_MODEL, inputTokens, outputTokens);

      apiLogger.info(
        {
          userId,
          toolName,
          requiresConfirmation: true,
        },
        "Write operation requires confirmation - returning confirmation request"
      );

      // Return confirmation request instead of executing
      return {
        message: confirmationMessage,
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
        confirmationRequest: {
          message: confirmationMessage,
          pendingAction,
          requiresConfirmation: true,
        },
      };
    }

    // If user confirmed action, use the confirmed tool call directly
    const finalToolCallsToExecute = confirmedAction
      ? [confirmedAction.toolCall]
      : toolCallsToExecute;

    // ========================================================

    apiLogger.info(
      {
        userId,
        toolsRequested: toolNames,
        toolCount: finalToolCallsToExecute.length,
        confirmed: !!confirmedAction,
      },
      "Executing tools in parallel"
    );

    const { toolMessages, logs } = await executeTools(
      finalToolCallsToExecute,
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
