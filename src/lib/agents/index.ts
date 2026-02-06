import { SupabaseClient } from "@supabase/supabase-js";
import { HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { DEFAULT_MODEL, calculateCost } from "@/lib/ai/client";
import { apiLogger } from "@/lib/logger";
import { createAgentGraph } from "./graph";
import { AgentState, ExecutionMetrics, IntentType } from "./state";

/**
 * Conversation message in history
 */
export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Agent response returned to API
 */
export interface AgentResponse {
  message: string;
  intent: IntentType | null;
  toolsUsed: string[];
  metrics: ExecutionMetrics;
}

/**
 * Process a user message through the agent graph
 *
 * Orchestrates the full workflow:
 * 1. Initialize state
 * 2. Create graph
 * 3. Invoke graph
 * 4. Calculate metrics
 * 5. Return response
 *
 * @param userMessage The user's query
 * @param conversationHistory Previous messages for context
 * @param supabase Supabase client for data access
 * @param userId User ID from authentication
 * @returns Agent response with message, intent, tools used, and metrics
 */
export async function processAgentMessage(
  userMessage: string,
  conversationHistory: ConversationMessage[],
  supabase: SupabaseClient,
  userId: string
): Promise<AgentResponse> {
  const startTime = Date.now();

  try {
    apiLogger.debug(
      { userId, messageLength: userMessage.length },
      "Processing agent message"
    );

    // DEBUG: Verificar API key
    console.log("🔑 OpenAI API Key present:", !!process.env.OPENAI_API_KEY);
    console.log("📝 User message:", userMessage);

    // Convert conversation history to LangChain messages
    const messages: BaseMessage[] = conversationHistory.map((msg) =>
      msg.role === "user" ? new HumanMessage(msg.content) : new AIMessage(msg.content)
    );

    // Create agent graph
    const graph = createAgentGraph(supabase);

    // Initialize state
    const initialState: AgentState = {
      messages,
      userMessage,
      userId,
      intent: null,
      toolsToCall: [],
      toolResults: {},
      finalResponse: null,
      metrics: {
        model: DEFAULT_MODEL,
        latencyMs: 0,
        inputTokens: 0,
        outputTokens: 0,
        costUsd: 0,
        toolCalls: 0,
      },
    };

    apiLogger.debug("Invoking agent graph");
    console.log("🚀 About to invoke agent graph with state:", {
      userMessage: initialState.userMessage,
      userId: initialState.userId,
      messagesCount: initialState.messages.length
    });

    // Invoke the graph
    const result = await (graph as any).invoke(initialState, {
      recursionLimit: 25,
    });

    console.log("✅ Graph invocation completed. Result:", {
      intent: result.intent,
      toolsToCall: result.toolsToCall,
      finalResponse: result.finalResponse,
      hasToolResults: Object.keys(result.toolResults || {}).length > 0
    });

    // Calculate latency
    const latencyMs = Date.now() - startTime;

    // Count successful tool calls
    const toolCalls = Object.values(result.toolResults).filter(
      (r: any) => r.success === true
    ).length;

    // Estimate tokens (rough approximation)
    // OpenAI typically uses ~4 chars per token
    const inputTokens = Math.ceil(userMessage.length / 4);
    const outputTokens = Math.ceil(
      (result.finalResponse?.length || 0) / 4
    );

    // Calculate cost
    const costUsd = calculateCost(DEFAULT_MODEL, inputTokens, outputTokens);

    // Build final response
    const agentResponse: AgentResponse = {
      message: result.finalResponse || "Unable to generate response",
      intent: result.intent,
      toolsUsed: result.toolsToCall,
      metrics: {
        model: DEFAULT_MODEL,
        latencyMs,
        inputTokens,
        outputTokens,
        costUsd,
        toolCalls,
      },
    };

    console.log("📦 Final agent response:", {
      messageLength: agentResponse.message.length,
      messagePreview: agentResponse.message.substring(0, 100),
      intent: agentResponse.intent,
      toolsUsed: agentResponse.toolsUsed
    });

    apiLogger.debug(
      {
        intent: agentResponse.intent,
        tools: agentResponse.toolsUsed,
        latencyMs,
        costUsd,
      },
      "Agent message processed successfully"
    );

    return agentResponse;
  } catch (error) {
    const latencyMs = Date.now() - startTime;

    apiLogger.error(
      { error, userId, latencyMs },
      "Error processing agent message"
    );

    // Return error response
    return {
      message: "Lo siento, ocurrió un error procesando tu solicitud.",
      intent: null,
      toolsUsed: [],
      metrics: {
        model: DEFAULT_MODEL,
        latencyMs,
        inputTokens: 0,
        outputTokens: 0,
        costUsd: 0,
        toolCalls: 0,
      },
    };
  }
}

// Export types for API layer
export type { AgentState, IntentType, ExecutionMetrics } from "./state";
export type { AgentGraph } from "./graph";
