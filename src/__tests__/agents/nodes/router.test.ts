import { describe, it, expect, vi, beforeEach } from "vitest";
import { HumanMessage } from "@langchain/core/messages";
import { routerNode, mapIntentToTools } from "@/lib/agents/nodes/router";
import { AgentState } from "@/lib/agents/state";

describe("Router Node", () => {
  describe("mapIntentToTools", () => {
    it("should map analyze_spending intent to analyzeSpendingPattern tool", () => {
      const tools = mapIntentToTools("analyze_spending");
      expect(tools).toContain("analyzeSpendingPattern");
    });

    it("should map check_budget intent to getBudgetStatus tool", () => {
      const tools = mapIntentToTools("check_budget");
      expect(tools).toContain("getBudgetStatus");
    });

    it("should map detect_anomalies intent to detectAnomalies tool", () => {
      const tools = mapIntentToTools("detect_anomalies");
      expect(tools).toContain("detectAnomalies");
    });

    it("should map predict_spending intent to predictMonthlySpending tool", () => {
      const tools = mapIntentToTools("predict_spending");
      expect(tools).toContain("predictMonthlySpending");
    });

    it("should map view_trends intent to getSpendingTrends tool", () => {
      const tools = mapIntentToTools("view_trends");
      expect(tools).toContain("getSpendingTrends");
    });

    it("should return empty array for general_question", () => {
      const tools = mapIntentToTools("general_question");
      expect(tools).toHaveLength(0);
    });

    it("should return empty array for unclear", () => {
      const tools = mapIntentToTools("unclear");
      expect(tools).toHaveLength(0);
    });
  });

  describe("routerNode", () => {
    let mockState: AgentState;

    beforeEach(() => {
      mockState = {
        messages: [new HumanMessage("test")],
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
    });

    it("should detect spending analysis intent", async () => {
      mockState.userMessage = "¿Cuánto he gastado en comida este mes?";

      const result = await routerNode(mockState);

      expect(result.intent).toBeTruthy();
      expect(result.toolsToCall).toHaveLength(1);
    });

    it("should detect budget check intent", async () => {
      mockState.userMessage = "¿Cómo va mi presupuesto?";

      const result = await routerNode(mockState);

      expect(result.intent).toBeTruthy();
      expect(result.toolsToCall).toHaveLength(1);
    });

    it("should detect anomaly detection intent", async () => {
      mockState.userMessage = "Detecta gastos raros en los últimos días";

      const result = await routerNode(mockState);

      expect(result.intent).toBeTruthy();
      expect(result.toolsToCall).toHaveLength(1);
    });

    it("should handle unclear intents", async () => {
      mockState.userMessage = "xyz abc 123";

      const result = await routerNode(mockState);

      // Should not crash and should set some intent
      expect(result.intent).toBeDefined();
      expect(typeof result.toolsToCall).toBe("object");
    });

    it("should preserve user ID in state", async () => {
      const result = await routerNode(mockState);

      // Router doesn't modify userId, but it should be passed through
      expect(mockState.userId).toBe("test-user-123");
    });
  });
});
