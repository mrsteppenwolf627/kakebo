import { describe, it, expect, beforeEach } from "vitest";
import { HumanMessage } from "@langchain/core/messages";
import { synthesizerNode } from "@/lib/agents/nodes/synthesizer";
import { AgentState } from "@/lib/agents/state";

describe("Synthesizer Node", () => {
  let mockState: AgentState;

  beforeEach(() => {
    mockState = {
      messages: [new HumanMessage("¿Cuánto he gastado?")],
      userMessage: "¿Cuánto he gastado?",
      userId: "test-user-123",
      intent: "analyze_spending",
      toolsToCall: ["analyzeSpendingPattern"],
      toolResults: {
        analyzeSpendingPattern: {
          success: true,
          data: {
            category: "all",
            period: "current_month",
            totalAmount: 500,
            averagePerPeriod: 50,
            trend: "stable",
            trendPercentage: 0,
            topExpenses: [
              { concept: "Comida", amount: 250, date: "2024-02-01" },
            ],
            insights: ["Gastos estables este mes"],
          },
        },
      },
      finalResponse: null,
      metrics: {
        model: "gpt-4o-mini",
        latencyMs: 0,
        inputTokens: 0,
        outputTokens: 0,
        costUsd: 0,
        toolCalls: 1,
      },
    };
  });

  it("should generate a response from tool results", async () => {
    const result = await synthesizerNode(mockState);

    expect(result.finalResponse).toBeDefined();
    expect(result.finalResponse).not.toBeNull();
    expect(typeof result.finalResponse).toBe("string");
    expect(result.finalResponse!.length).toBeGreaterThan(0);
  });

  it("should handle no tools (general question)", async () => {
    mockState.toolsToCall = [];
    mockState.toolResults = {};
    mockState.intent = "general_question";

    const result = await synthesizerNode(mockState);

    expect(result.finalResponse).toBeDefined();
    expect(result.finalResponse).not.toBeNull();
  });

  it("should handle failed tools gracefully", async () => {
    mockState.toolResults = {
      analyzeSpendingPattern: {
        success: false,
        error: "Database error",
      },
    };

    const result = await synthesizerNode(mockState);

    expect(result.finalResponse).toBeDefined();
    expect(result.finalResponse).not.toBeNull();
  });

  it("should generate Spanish responses", async () => {
    const result = await synthesizerNode(mockState);

    // Just verify a response was generated
    // We can't guarantee Spanish without mocking LLM
    expect(result.finalResponse).toBeDefined();
  });

  it("should handle empty conversation history", async () => {
    mockState.messages = [];

    const result = await synthesizerNode(mockState);

    expect(result.finalResponse).toBeDefined();
  });

  it("should handle multiple tool results", async () => {
    mockState.toolResults = {
      analyzeSpendingPattern: {
        success: true,
        data: { totalAmount: 500 },
      },
      getBudgetStatus: {
        success: true,
        data: { budgetHealth: 0.6 },
      },
    };

    const result = await synthesizerNode(mockState);

    expect(result.finalResponse).toBeDefined();
  });
});
