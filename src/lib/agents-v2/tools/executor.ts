/**
 * Tool executor for OpenAI Function Calling
 *
 * Executes tools in PARALLEL using Promise.all() for better performance.
 * Handles errors gracefully and returns results in OpenAI format.
 *
 * VERSION: 2.0 - ENHANCED ERROR HANDLING
 * - Classifies errors by type for better UX
 * - Provides user-friendly error messages
 * - Forces LLM to acknowledge errors explicitly
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { apiLogger } from "@/lib/logger";
import type {
  OpenAIToolCall,
  OpenAIToolMessage,
  ToolCallLog,
} from "../types";

// Import existing tool implementations (NO CHANGES to these files)
import {
  analyzeSpendingPattern,
  type AnalyzeSpendingPatternParams,
} from "@/lib/agents/tools/spending-analysis";
import {
  getBudgetStatus,
  type GetBudgetStatusParams,
} from "@/lib/agents/tools/budget-status";
import {
  detectAnomalies,
  type DetectAnomaliesParams,
} from "@/lib/agents/tools/anomalies";
import {
  predictMonthlySpending,
  type PredictMonthlySpendingParams,
} from "@/lib/agents/tools/predictions";
import {
  getSpendingTrends,
  type GetSpendingTrendsParams,
} from "@/lib/agents/tools/trends";
import { validateToolOutput, enhanceToolResult } from "./validator";

/**
 * Error classification for better handling
 */
enum ErrorType {
  DATABASE = "database",
  VALIDATION = "validation",
  NOT_FOUND = "not_found",
  PERMISSION = "permission",
  UNKNOWN = "unknown",
}

/**
 * Classify error by type for appropriate user messaging
 */
function classifyError(error: Error): ErrorType {
  const message = error.message.toLowerCase();

  if (
    message.includes("database") ||
    message.includes("connection") ||
    message.includes("timeout") ||
    message.includes("supabase")
  ) {
    return ErrorType.DATABASE;
  }

  if (
    message.includes("validation") ||
    message.includes("invalid") ||
    message.includes("required")
  ) {
    return ErrorType.VALIDATION;
  }

  if (
    message.includes("not found") ||
    message.includes("no data") ||
    message.includes("empty")
  ) {
    return ErrorType.NOT_FOUND;
  }

  if (
    message.includes("permission") ||
    message.includes("unauthorized") ||
    message.includes("forbidden")
  ) {
    return ErrorType.PERMISSION;
  }

  return ErrorType.UNKNOWN;
}

/**
 * Generate user-friendly error message based on type
 */
function getUserFriendlyError(toolName: string, errorType: ErrorType): string {
  const toolNameSpanish: Record<string, string> = {
    analyzeSpendingPattern: "análisis de gastos",
    getBudgetStatus: "estado de presupuesto",
    detectAnomalies: "detección de anomalías",
    predictMonthlySpending: "proyección de gastos",
    getSpendingTrends: "tendencias de gasto",
  };

  const friendlyName = toolNameSpanish[toolName] || toolName;

  switch (errorType) {
    case ErrorType.DATABASE:
      return `No pude acceder a tu información de ${friendlyName} en este momento. Por favor, inténtalo de nuevo en unos momentos.`;

    case ErrorType.VALIDATION:
      return `Los datos para ${friendlyName} no se pudieron procesar correctamente. Esto puede indicar un problema técnico.`;

    case ErrorType.NOT_FOUND:
      return `No encontré datos para ${friendlyName}. Esto puede ser normal si no has registrado gastos aún.`;

    case ErrorType.PERMISSION:
      return `No tengo permiso para acceder a los datos de ${friendlyName}. Verifica tu sesión.`;

    case ErrorType.UNKNOWN:
      return `Ocurrió un error al ejecutar ${friendlyName}. Por favor, inténtalo de nuevo.`;
  }
}

/**
 * Result of executing a single tool
 */
interface ToolExecutionResult {
  toolMessage: OpenAIToolMessage;
  log: ToolCallLog;
}

/**
 * Execute a single tool call
 *
 * @param toolCall - OpenAI tool call object
 * @param supabase - Supabase client
 * @param userId - User ID
 * @returns Tool result in OpenAI format + execution log
 */
async function executeSingleTool(
  toolCall: OpenAIToolCall,
  supabase: SupabaseClient,
  userId: string
): Promise<ToolExecutionResult> {
  const startTime = Date.now();
  const toolName = toolCall.function.name;

  try {
    // Parse arguments (JSON string → object)
    const args = JSON.parse(toolCall.function.arguments);

    apiLogger.debug(
      {
        toolName,
        toolCallId: toolCall.id,
        arguments: args,
      },
      "Executing tool"
    );

    let result: unknown;

    // Route to appropriate tool implementation
    switch (toolName) {
      case "analyzeSpendingPattern":
        result = await analyzeSpendingPattern(
          supabase,
          userId,
          args as AnalyzeSpendingPatternParams
        );
        break;

      case "getBudgetStatus":
        result = await getBudgetStatus(
          supabase,
          userId,
          args as GetBudgetStatusParams
        );
        break;

      case "detectAnomalies":
        result = await detectAnomalies(
          supabase,
          userId,
          args as DetectAnomaliesParams
        );
        break;

      case "predictMonthlySpending":
        result = await predictMonthlySpending(
          supabase,
          userId,
          args as PredictMonthlySpendingParams
        );
        break;

      case "getSpendingTrends":
        result = await getSpendingTrends(
          supabase,
          userId,
          args as GetSpendingTrendsParams
        );
        break;

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }

    // ========== VALIDATE TOOL OUTPUT ==========
    const validation = validateToolOutput(toolName, result);

    if (!validation.valid) {
      apiLogger.error(
        {
          toolName,
          validationErrors: validation.errors,
          result,
        },
        "Tool output validation failed"
      );

      // Throw error to trigger error handling
      throw new Error(
        `Data validation failed: ${validation.errors.join(", ")}`
      );
    }

    // Enhance result with validation metadata (warnings, etc.)
    const enhancedResult = enhanceToolResult(toolName, result, validation);
    // ==========================================

    const executionTimeMs = Date.now() - startTime;

    // Success: return result as JSON string
    const toolMessage: OpenAIToolMessage = {
      role: "tool",
      tool_call_id: toolCall.id,
      content: JSON.stringify(enhancedResult), // Use enhanced result
    };

    const log: ToolCallLog = {
      toolName,
      arguments: args,
      result: enhancedResult, // Log enhanced result
      executionTimeMs,
    };

    apiLogger.debug(
      {
        toolName,
        toolCallId: toolCall.id,
        executionTimeMs,
        hasWarnings: validation.warnings.length > 0,
      },
      "Tool executed successfully"
    );

    return { toolMessage, log };
  } catch (error) {
    const executionTimeMs = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // ========== ENHANCED: CLASSIFY AND PROVIDE USER-FRIENDLY ERROR ==========
    const errorType = classifyError(error as Error);
    const userMessage = getUserFriendlyError(toolName, errorType);

    apiLogger.error(
      {
        toolName,
        toolCallId: toolCall.id,
        error: errorMessage,
        errorType,
        executionTimeMs,
      },
      "Tool execution failed"
    );

    // Return CLEAR error structure that LLM MUST acknowledge
    // The _error flag and _instruction force the LLM to inform the user
    const toolMessage: OpenAIToolMessage = {
      role: "tool",
      tool_call_id: toolCall.id,
      content: JSON.stringify({
        _error: true,
        _errorType: errorType,
        _userMessage: userMessage,
        _technicalDetails: errorMessage,
        _instruction:
          "CRITICAL: You MUST inform the user about this error using the _userMessage. DO NOT make up data. DO NOT proceed as if the tool worked.",
      }),
    };
    // ========================================================================

    const log: ToolCallLog = {
      toolName,
      arguments: {},
      result: null,
      error: errorMessage,
      errorType, // Include error type for monitoring
      executionTimeMs,
    };

    return { toolMessage, log };
  }
}

/**
 * Execute multiple tool calls in PARALLEL
 *
 * This is a key optimization over the LangGraph sequential approach.
 * Multiple tools can run simultaneously using Promise.all().
 *
 * @param toolCalls - Array of OpenAI tool calls
 * @param supabase - Supabase client
 * @param userId - User ID
 * @returns Tool messages for OpenAI + execution logs
 */
export async function executeTools(
  toolCalls: OpenAIToolCall[],
  supabase: SupabaseClient,
  userId: string
): Promise<{
  toolMessages: OpenAIToolMessage[];
  logs: ToolCallLog[];
}> {
  if (!toolCalls || toolCalls.length === 0) {
    return { toolMessages: [], logs: [] };
  }

  apiLogger.info(
    {
      userId,
      toolCount: toolCalls.length,
      tools: toolCalls.map((tc) => tc.function.name),
    },
    "Executing tools in parallel"
  );

  const startTime = Date.now();

  try {
    // Execute ALL tools in parallel using Promise.all()
    // This is much faster than sequential execution (LangGraph approach)
    const results = await Promise.all(
      toolCalls.map((toolCall) =>
        executeSingleTool(toolCall, supabase, userId)
      )
    );

    const totalExecutionTime = Date.now() - startTime;

    // Separate tool messages and logs
    const toolMessages = results.map((r) => r.toolMessage);
    const logs = results.map((r) => r.log);

    // Calculate max individual execution time (for monitoring)
    const maxExecutionTime = Math.max(
      ...logs.map((log) => log.executionTimeMs)
    );

    apiLogger.info(
      {
        userId,
        toolCount: toolCalls.length,
        totalExecutionTimeMs: totalExecutionTime,
        maxIndividualTimeMs: maxExecutionTime,
        successCount: logs.filter((log) => !log.error).length,
        errorCount: logs.filter((log) => log.error).length,
      },
      "Tools execution completed"
    );

    return { toolMessages, logs };
  } catch (error) {
    // This catch is for unexpected errors in Promise.all
    // Individual tool errors are already handled in executeSingleTool
    apiLogger.error(
      {
        userId,
        error,
        toolCalls: toolCalls.map((tc) => tc.function.name),
      },
      "Unexpected error in parallel tool execution"
    );

    throw error;
  }
}

/**
 * Get a list of tool names from tool calls
 *
 * Utility function for logging and metrics
 */
export function getToolNames(toolCalls: OpenAIToolCall[]): string[] {
  return toolCalls.map((tc) => tc.function.name);
}

/**
 * Calculate total tokens used by tool results
 *
 * Rough estimate: 1 token ≈ 4 characters
 * Used for monitoring and cost estimation
 */
export function estimateToolResultTokens(
  toolMessages: OpenAIToolMessage[]
): number {
  const totalChars = toolMessages.reduce(
    (sum, msg) => sum + msg.content.length,
    0
  );
  return Math.ceil(totalChars / 4);
}
