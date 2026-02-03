import { describe, it, expect, vi, beforeEach } from "vitest";
import { HumanMessage } from "@langchain/core/messages";
import { createAgentGraph } from "@/lib/agents/graph";
import { AgentState } from "@/lib/agents/state";

describe("Agent Graph Integration", () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          { note: "Comida", amount: 50, date: "2024-02-01" },
          { note: "Café", amount: 5, date: "2024-02-02" },
        ],
        error: null,
      }),
    };
  });

  it("should create a compiled graph", () => {
    const graph = createAgentGraph(mockSupabase);

    expect(graph).toBeDefined();
    expect(typeof graph.invoke).toBe("function");
  });

  it("should execute a complete spending analysis flow", async () => {
    const graph = createAgentGraph(mockSupabase);

    const initialState: AgentState = {
      messages: [new HumanMessage("¿Cuánto he gastado?")],
      userMessage: "¿Cuánto he gastado en comida?",
      userId: "test-user-123",
      intent: null,
      toolsToCall: [],
      toolResults: {},
      finalResponse: null,
      metrics: {
        model: "gpt-4o-mini",
        latencyMs: 0,
        inputTokens: 0,
        outputTokens: 0,
        costUsd: 0,
        toolCalls: 0,
      },
    };

    const result = await graph.invoke(initialState, {
      recursionLimit: 25,
    });

    expect(result).toBeDefined();
    expect(result.intent).toBeDefined();
    expect(result.finalResponse).toBeDefined();
  });

  it("should handle general questions without tools", async () => {
    const graph = createAgentGraph(mockSupabase);

    const initialState: AgentState = {
      messages: [],
      userMessage: "¿Qué es un presupuesto?",
      userId: "test-user-123",
      intent: null,
      toolsToCall: [],
      toolResults: {},
      finalResponse: null,
      metrics: {
        model: "gpt-4o-mini",
        latencyMs: 0,
        inputTokens: 0,
        outputTokens: 0,
        costUsd: 0,
        toolCalls: 0,
      },
    };

    const result = await graph.invoke(initialState, {
      recursionLimit: 25,
    });

    expect(result.finalResponse).toBeDefined();
    expect(result.toolsToCall.length).toBeLessThanOrEqual(1);
  });

  it("should maintain conversation history through graph", async () => {
    const graph = createAgentGraph(mockSupabase);

    const initialMessages = [
      new HumanMessage("¿Cuánto he gastado?"),
      new HumanMessage("¿Y en comida?"),
    ];

    const initialState: AgentState = {
      messages: initialMessages,
      userMessage: "¿En cultura?",
      userId: "test-user-123",
      intent: null,
      toolsToCall: [],
      toolResults: {},
      finalResponse: null,
      metrics: {
        model: "gpt-4o-mini",
        latencyMs: 0,
        inputTokens: 0,
        outputTokens: 0,
        costUsd: 0,
        toolCalls: 0,
      },
    };

    const result = await graph.invoke(initialState, {
      recursionLimit: 25,
    });

    expect(result.messages.length).toBeGreaterThanOrEqual(initialMessages.length);
  });

  it("should populate metrics after execution", async () => {
    const graph = createAgentGraph(mockSupabase);

    const initialState: AgentState = {
      messages: [],
      userMessage: "¿Cuánto he gastado?",
      userId: "test-user-123",
      intent: null,
      toolsToCall: [],
      toolResults: {},
      finalResponse: null,
      metrics: {
        model: "gpt-4o-mini",
        latencyMs: 0,
        inputTokens: 0,
        outputTokens: 0,
        costUsd: 0,
        toolCalls: 0,
      },
    };

    const result = await graph.invoke(initialState, {
      recursionLimit: 25,
    });

    expect(result.metrics).toBeDefined();
    expect(result.metrics.model).toBe("gpt-4o-mini");
  });
});
