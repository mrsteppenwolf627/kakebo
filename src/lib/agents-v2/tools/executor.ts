/**
 * Tool executor for OpenAI Function Calling
 *
 * Executes tools in PARALLEL using Promise.all() for better performance.
 * Handles errors gracefully and returns results in OpenAI format.
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

    const executionTimeMs = Date.now() - startTime;

    // Success: return result as JSON string
    const toolMessage: OpenAIToolMessage = {
      role: "tool",
      tool_call_id: toolCall.id,
      content: JSON.stringify(result),
    };

    const log: ToolCallLog = {
      toolName,
      arguments: args,
      result,
      executionTimeMs,
    };

    apiLogger.debug(
      {
        toolName,
        toolCallId: toolCall.id,
        executionTimeMs,
      },
      "Tool executed successfully"
    );

    return { toolMessage, log };
  } catch (error) {
    const executionTimeMs = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    apiLogger.error(
      {
        toolName,
        toolCallId: toolCall.id,
        error: errorMessage,
        executionTimeMs,
      },
      "Tool execution failed"
    );

    // Error: return error message in tool response
    const toolMessage: OpenAIToolMessage = {
      role: "tool",
      tool_call_id: toolCall.id,
      content: JSON.stringify({
        error: errorMessage,
        message: `Error al ejecutar ${toolName}: ${errorMessage}`,
      }),
    };

    const log: ToolCallLog = {
      toolName,
      arguments: {},
      result: null,
      error: errorMessage,
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
