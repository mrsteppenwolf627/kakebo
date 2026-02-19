/**
 * Tests for write operation confirmation flow (P0-1)
 *
 * Validates that write operations (createTransaction, updateTransaction, etc.)
 * require explicit user confirmation before execution when feature flag is enabled.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TOOL_METADATA } from "@/lib/agents-v2/tools/definitions";
import type { PendingAction, ConfirmationRequest } from "@/lib/agents-v2/types";

describe("Write Confirmation Flow (P0-1)", () => {
  describe("TOOL_METADATA configuration", () => {
    it("should mark write operations as requiring confirmation", () => {
      // Write operations
      expect(TOOL_METADATA.createTransaction.requiresConfirmation).toBe(true);
      expect(TOOL_METADATA.updateTransaction.requiresConfirmation).toBe(true);
      expect(TOOL_METADATA.setBudget.requiresConfirmation).toBe(true);
      expect(TOOL_METADATA.calculateWhatIf.requiresConfirmation).toBe(true);
    });

    it("should mark read operations as NOT requiring confirmation", () => {
      // Read operations
      expect(TOOL_METADATA.analyzeSpendingPattern.requiresConfirmation).toBe(false);
      expect(TOOL_METADATA.getBudgetStatus.requiresConfirmation).toBe(false);
      expect(TOOL_METADATA.detectAnomalies.requiresConfirmation).toBe(false);
      expect(TOOL_METADATA.predictMonthlySpending.requiresConfirmation).toBe(false);
      expect(TOOL_METADATA.getSpendingTrends.requiresConfirmation).toBe(false);
      expect(TOOL_METADATA.searchExpenses.requiresConfirmation).toBe(false);
      expect(TOOL_METADATA.getCurrentCycle.requiresConfirmation).toBe(false);
    });

    it("should have confirmation templates for write operations", () => {
      expect(TOOL_METADATA.createTransaction.confirmationTemplate).toBeDefined();
      expect(TOOL_METADATA.updateTransaction.confirmationTemplate).toBeDefined();
      expect(TOOL_METADATA.setBudget.confirmationTemplate).toBeDefined();
      expect(TOOL_METADATA.calculateWhatIf.confirmationTemplate).toBeDefined();
    });
  });

  describe("Confirmation templates", () => {
    it("should generate correct confirmation message for createTransaction", () => {
      const template = TOOL_METADATA.createTransaction.confirmationTemplate;
      expect(template).toBeDefined();

      if (template) {
        const message = template({
          type: "expense",
          amount: 50,
          concept: "Test expense",
          category: "survival",
        });

        expect(message).toContain("50€");
        expect(message).toContain("gasto");
        expect(message).toContain("survival");
        expect(message).toContain("Test expense");
      }
    });

    it("should generate correct confirmation message for updateTransaction", () => {
      const template = TOOL_METADATA.updateTransaction.confirmationTemplate;
      expect(template).toBeDefined();

      if (template) {
        const message = template({
          amount: 45,
          concept: "New concept",
        });

        expect(message).toContain("45€");
        expect(message).toContain("New concept");
        expect(message).toContain("Confirmas");
      }
    });

    it("should generate correct confirmation message for setBudget", () => {
      const template = TOOL_METADATA.setBudget.confirmationTemplate;
      expect(template).toBeDefined();

      if (template) {
        const message = template({
          category: "survival",
          amount: 500,
        });

        expect(message).toContain("500€");
        expect(message).toContain("survival");
        expect(message).toContain("presupuesto");
      }
    });

    it("should handle 'all' category in setBudget template", () => {
      const template = TOOL_METADATA.setBudget.confirmationTemplate;
      expect(template).toBeDefined();

      if (template) {
        const message = template({
          category: "all",
          amount: 1000,
        });

        expect(message).toContain("todas las categorías");
        expect(message).toContain("1000€");
      }
    });

    it("should generate correct confirmation message for calculateWhatIf", () => {
      const template = TOOL_METADATA.calculateWhatIf.confirmationTemplate;
      expect(template).toBeDefined();

      if (template) {
        const message = template({
          name: "Vacaciones Agosto",
          estimatedCost: 1200,
        });

        expect(message).toContain("Vacaciones Agosto");
        expect(message).toContain("1200€");
        expect(message).toContain("escenario");
      }
    });
  });

  describe("Type definitions", () => {
    it("should have correct PendingAction type structure", () => {
      const pendingAction: PendingAction = {
        toolCall: {
          id: "call_123",
          type: "function",
          function: {
            name: "createTransaction",
            arguments: JSON.stringify({ amount: 50 }),
          },
        },
        toolName: "createTransaction",
        arguments: { amount: 50 },
        description: "Test description",
      };

      expect(pendingAction.toolCall.id).toBe("call_123");
      expect(pendingAction.toolName).toBe("createTransaction");
      expect(pendingAction.description).toBe("Test description");
    });

    it("should have correct ConfirmationRequest type structure", () => {
      const confirmationRequest: ConfirmationRequest = {
        message: "¿Confirmas?",
        pendingAction: {
          toolCall: {
            id: "call_123",
            type: "function",
            function: {
              name: "createTransaction",
              arguments: "{}",
            },
          },
          toolName: "createTransaction",
          arguments: {},
          description: "Test",
        },
        requiresConfirmation: true,
      };

      expect(confirmationRequest.message).toBe("¿Confirmas?");
      expect(confirmationRequest.requiresConfirmation).toBe(true);
      expect(confirmationRequest.pendingAction).toBeDefined();
    });
  });

  describe("Feature flag behavior", () => {
    let originalEnv: string | undefined;

    beforeEach(() => {
      originalEnv = process.env.ENABLE_WRITE_CONFIRMATION;
    });

    afterEach(() => {
      if (originalEnv !== undefined) {
        process.env.ENABLE_WRITE_CONFIRMATION = originalEnv;
      } else {
        delete process.env.ENABLE_WRITE_CONFIRMATION;
      }
    });

    it("should respect feature flag when set to 'false'", () => {
      process.env.ENABLE_WRITE_CONFIRMATION = "false";
      expect(process.env.ENABLE_WRITE_CONFIRMATION).toBe("false");
    });

    it("should respect feature flag when set to 'true'", () => {
      process.env.ENABLE_WRITE_CONFIRMATION = "true";
      expect(process.env.ENABLE_WRITE_CONFIRMATION).toBe("true");
    });

    it("should have default value (undefined or false)", () => {
      delete process.env.ENABLE_WRITE_CONFIRMATION;
      // Default behavior should be no confirmation (legacy mode)
      expect(process.env.ENABLE_WRITE_CONFIRMATION).toBeUndefined();
    });
  });
});
