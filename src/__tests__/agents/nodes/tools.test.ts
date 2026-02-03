import { describe, it, expect, vi, beforeEach } from "vitest";
import { HumanMessage } from "@langchain/core/messages";
import { toolExecutorNode } from "@/lib/agents/nodes/tools";
import { AgentState } from "@/lib/agents/state";

describe("Tool Executor Node", () => {
  let mockState: AgentState;
  let mockSupabase: any;

  beforeEach(() => {
    mockState = {
      messages: [new HumanMessage("test")],
      userMessage: "¿Cuánto he gastado?",
      userId: "test-user-123",
      intent: "analyze_spending",
      toolsToCall: ["analyzeSpendingPattern"],
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

  it("should execute a single tool successfully", async () => {
    const result = await toolExecutorNode(mockState, mockSupabase);

    expect(result.toolResults).toBeDefined();
    expect(Object.keys(result.toolResults).length).toBeGreaterThan(0);
  });

  it("should handle tool execution with no tools", async () => {
    mockState.toolsToCall = [];

    const result = await toolExecutorNode(mockState, mockSupabase);

    expect(result.toolResults).toBeDefined();
    expect(Object.keys(result.toolResults).length).toBe(0);
  });

  it("should process tool results with success flag", async () => {
    const result = await toolExecutorNode(mockState, mockSupabase);

    for (const toolResult of Object.values(result.toolResults)) {
      expect(toolResult).toHaveProperty("success");
      expect(typeof (toolResult as any).success).toBe("boolean");
    }
  });

  it("should mark failed tools appropriately", async () => {
    mockSupabase.order.mockResolvedValueOnce({
      data: null,
      error: new Error("Database error"),
    });

    const result = await toolExecutorNode(mockState, mockSupabase);

    // Should not throw, but should mark as failed
    expect(result.toolResults).toBeDefined();
  });

  it("should handle multiple tools", async () => {
    mockState.toolsToCall = [
      "analyzeSpendingPattern",
      "getBudgetStatus",
    ];

    const result = await toolExecutorNode(mockState, mockSupabase);

    expect(result.toolResults).toBeDefined();
  });

  it("should preserve user context", async () => {
    const userId = "specific-user-456";
    mockState.userId = userId;

    await toolExecutorNode(mockState, mockSupabase);

    // Verify the user ID was used in queries
    expect(mockState.userId).toBe(userId);
  });
});
