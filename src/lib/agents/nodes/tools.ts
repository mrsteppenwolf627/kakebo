import { SupabaseClient } from "@supabase/supabase-js";
import { openai, DEFAULT_MODEL } from "@/lib/ai/client";
import { apiLogger } from "@/lib/logger";
import { AgentState, ToolResult } from "../state";
import { getParameterExtractionPrompt } from "../prompts";
import {
  analyzeSpendingPattern,
  getBudgetStatus,
  detectAnomalies,
  predictMonthlySpending,
  getSpendingTrends,
} from "../tools";

/**
 * Available analysis tools
 */
const ANALYSIS_TOOLS = {
  analyzeSpendingPattern,
  getBudgetStatus,
  detectAnomalies,
  predictMonthlySpending,
  getSpendingTrends,
} as const;

type ToolName = keyof typeof ANALYSIS_TOOLS;

/**
 * Extract parameters for a specific tool from the user message
 */
async function extractToolParams(
  toolName: string,
  userMessage: string
): Promise<Record<string, unknown>> {
  try {
    const prompt = getParameterExtractionPrompt(toolName, userMessage);

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 300,
    });

    const content = response.choices[0]?.message.content;
    if (!content) {
      throw new Error("Empty response from parameter extraction");
    }

    const params = JSON.parse(content) as Record<string, unknown>;
    apiLogger.debug({ toolName, params }, "Tool parameters extracted");

    return params;
  } catch (error) {
    apiLogger.warn(
      { error, toolName },
      "Error extracting parameters, using defaults"
    );

    // Return sensible defaults if extraction fails
    return getDefaultParams(toolName);
  }
}

/**
 * Get default parameters for a tool
 */
function getDefaultParams(toolName: string): Record<string, unknown> {
  const defaults: Record<string, Record<string, unknown>> = {
    analyzeSpendingPattern: {
      category: "all",
      period: "current_month",
      groupBy: "day",
    },
    getBudgetStatus: {
      category: "all",
    },
    detectAnomalies: {
      days: 7,
      sensitivity: "medium",
    },
    predictMonthlySpending: {
      category: "all",
      months: 1,
    },
    getSpendingTrends: {
      category: "all",
      months: 6,
    },
  };

  return defaults[toolName] || {};
}

/**
 * Execute a single analysis tool
 */
async function executeAnalysisTool(
  toolName: ToolName,
  params: Record<string, unknown>,
  supabase: SupabaseClient,
  userId: string
): Promise<unknown> {
  const tool = ANALYSIS_TOOLS[toolName];

  if (!tool) {
    throw new Error(`Unknown tool: ${toolName}`);
  }

  // Type casting for specific tools (each has different param types)
  let result: unknown;

  switch (toolName) {
    case "analyzeSpendingPattern":
      result = await analyzeSpendingPattern(supabase, userId, params as any);
      break;
    case "getBudgetStatus":
      result = await getBudgetStatus(supabase, userId, params as any);
      break;
    case "detectAnomalies":
      result = await detectAnomalies(supabase, userId, params as any);
      break;
    case "predictMonthlySpending":
      result = await predictMonthlySpending(supabase, userId, params as any);
      break;
    case "getSpendingTrends":
      result = await getSpendingTrends(supabase, userId, params as any);
      break;
    default:
      const _exhaustive: never = toolName;
      throw new Error(`Unhandled tool: ${_exhaustive}`);
  }

  return result;
}

/**
 * Tool Executor node: run selected analysis tools
 * Part of the LangGraph workflow
 *
 * @param state Current agent state
 * @param supabase Supabase client
 * @returns Partial state with tool results
 */
export async function toolExecutorNode(
  state: AgentState,
  supabase: SupabaseClient
): Promise<Partial<AgentState>> {
  apiLogger.debug(
    { tools: state.toolsToCall },
    "Tool executor node processing"
  );

  const toolResults: Record<string, ToolResult> = {};

  // Execute each tool
  for (const toolName of state.toolsToCall) {
    try {
      // Extract parameters for this tool
      const params = await extractToolParams(toolName, state.userMessage);

      apiLogger.debug({ toolName, params }, "Executing tool");

      // Execute the tool
      const result = await executeAnalysisTool(
        toolName as ToolName,
        params,
        supabase,
        state.userId
      );

      toolResults[toolName] = {
        success: true,
        data: result,
      };

      apiLogger.debug({ toolName }, "Tool executed successfully");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      apiLogger.error(
        { toolName, error: errorMessage },
        "Tool execution failed"
      );

      toolResults[toolName] = {
        success: false,
        error: errorMessage,
      };
    }
  }

  return {
    toolResults,
  };
}
