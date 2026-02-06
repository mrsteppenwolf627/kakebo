import { StateGraph, END } from "@langchain/langgraph";
import { SupabaseClient } from "@supabase/supabase-js";
import { AgentState } from "./state";
import { routerNode } from "./nodes/router";
import { toolExecutorNode } from "./nodes/tools";
import { synthesizerNode } from "./nodes/synthesizer";
import { apiLogger } from "@/lib/logger";

type NodeName = "router" | "tools" | "synthesizer";

/**
 * Create and compile the agent graph
 *
 * Workflow:
 * START → ROUTER → [decision] → TOOLS (optional) → SYNTHESIZER → END
 *
 * @param supabase Supabase client for data access
 * @returns Compiled graph callable
 */
export function createAgentGraph(supabase: SupabaseClient) {
  const workflow = new StateGraph<AgentState>({
    channels: {
      // Messages: accumulate all messages in conversation
      messages: {
        value: (x: any, y: any) => y ?? x,
        default: () => [],
      },
      // Tool results: merge results from each tool call
      toolResults: {
        value: (x: any, y: any) => y ?? x,
        default: () => ({}),
      },
      // Other fields: keep previous value if new value is undefined
      userMessage: {
        value: (x: any, y: any) => y ?? x,
        default: () => "",
      },
      userId: {
        value: (x: any, y: any) => y ?? x,
        default: () => "",
      },
      intent: {
        value: (x: any, y: any) => y ?? x,
        default: () => null,
      },
      toolsToCall: {
        value: (x: any, y: any) => y ?? x,
        default: () => [],
      },
      finalResponse: {
        value: (x: any, y: any) => y ?? x,
        default: () => null,
      },
      metrics: {
        value: (x: any, y: any) => y ?? x,
        default: () => ({
          model: "gpt-4o-mini",
          latencyMs: 0,
          inputTokens: 0,
          outputTokens: 0,
          costUsd: 0,
          toolCalls: 0,
        }),
      },
    },
  });

  // Add nodes
  workflow.addNode("router" as NodeName, routerNode);
  workflow.addNode("tools" as NodeName, (state: AgentState) =>
    toolExecutorNode(state, supabase)
  );
  workflow.addNode("synthesizer" as NodeName, synthesizerNode);

  // Add edges
  (workflow as any).addEdge("__start__", "router");

  // Conditional edge from router:
  // - If no tools needed (general_question, unclear), go directly to synthesizer
  // - If tools needed, go to tool executor
  (workflow as any).addConditionalEdges("router", (state: AgentState) => {
    if (state.toolsToCall.length === 0) {
      apiLogger.debug("Router: No tools needed, going to synthesizer");
      return "synthesizer";
    }
    apiLogger.debug(
      { tools: state.toolsToCall },
      "Router: Tools needed, going to executor"
    );
    return "tools";
  });

  // Tools always go to synthesizer
  (workflow as any).addEdge("tools", "synthesizer");

  // Synthesizer is the final node
  (workflow as any).addEdge("synthesizer", END);

  // Compile the graph
  const compiled = workflow.compile();

  apiLogger.debug("Agent graph created and compiled");

  return compiled;
}

/**
 * Type for the compiled graph
 */
export type AgentGraph = ReturnType<typeof createAgentGraph>;
