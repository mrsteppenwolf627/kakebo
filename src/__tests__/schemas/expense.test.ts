import { describe, it, expect } from "vitest";
import {
  createExpenseSchema,
  updateExpenseSchema,
  expenseSchema,
} from "@/lib/schemas/expense";

describe("Expense Schemas", () => {
  describe("createExpenseSchema", () => {
    it("should validate a valid expense", () => {
      const validExpense = {
        date: "2025-01-15",
        amount: 25.5,
        category: "survival",
        note: "Compra supermercado",
      };

      const result = createExpenseSchema.safeParse(validExpense);
      expect(result.success).toBe(true);
    });

    it("should accept expense without optional fields", () => {
      const minimalExpense = {
        date: "2025-01-15",
        amount: 10,
        category: "optional",
      };

      const result = createExpenseSchema.safeParse(minimalExpense);
      expect(result.success).toBe(true);
    });

    it("should reject invalid date format", () => {
      const invalidExpense = {
        date: "15/01/2025",
        amount: 25.5,
        category: "survival",
      };

      const result = createExpenseSchema.safeParse(invalidExpense);
      expect(result.success).toBe(false);
    });

    it("should reject negative amount", () => {
      const invalidExpense = {
        date: "2025-01-15",
        amount: -10,
        category: "survival",
      };

      const result = createExpenseSchema.safeParse(invalidExpense);
      expect(result.success).toBe(false);
    });

    it("should reject invalid category", () => {
      const invalidExpense = {
        date: "2025-01-15",
        amount: 25.5,
        category: "invalid_category",
      };

      const result = createExpenseSchema.safeParse(invalidExpense);
      expect(result.success).toBe(false);
    });

    it("should accept all valid categories", () => {
      const categories = ["survival", "optional", "culture", "extra"];

      categories.forEach((category) => {
        const expense = {
          date: "2025-01-15",
          amount: 10,
          category,
        };
        const result = createExpenseSchema.safeParse(expense);
        expect(result.success).toBe(true);
      });
    });

    it("should reject note longer than 500 characters", () => {
      const invalidExpense = {
        date: "2025-01-15",
        amount: 10,
        category: "survival",
        note: "a".repeat(501),
      };

      const result = createExpenseSchema.safeParse(invalidExpense);
      expect(result.success).toBe(false);
    });
  });

  describe("updateExpenseSchema", () => {
    it("should allow partial updates", () => {
      const partialUpdate = {
        amount: 50,
      };

      const result = updateExpenseSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it("should allow updating only note", () => {
      const partialUpdate = {
        note: "Updated note",
      };

      const result = updateExpenseSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it("should reject empty update", () => {
      const emptyUpdate = {};

      const result = updateExpenseSchema.safeParse(emptyUpdate);
      expect(result.success).toBe(false);
    });

    it("should allow updating multiple fields", () => {
      const update = {
        amount: 100,
        category: "culture",
        note: "New note",
      };

      const result = updateExpenseSchema.safeParse(update);
      expect(result.success).toBe(true);
    });
  });

  describe("expenseSchema (full object)", () => {
    it("should validate a complete expense", () => {
      const expense = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        user_id: "123e4567-e89b-12d3-a456-426614174001",
        month_id: "123e4567-e89b-12d3-a456-426614174002",
        date: "2025-01-15",
        amount: 25.5,
        category: "survival",
        note: "Test note",
        created_at: "2025-01-15T10:30:00Z",
      };

      const result = expenseSchema.safeParse(expense);
      expect(result.success).toBe(true);
    });

    it("should allow null note", () => {
      const expense = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        user_id: "123e4567-e89b-12d3-a456-426614174001",
        month_id: "123e4567-e89b-12d3-a456-426614174002",
        date: "2025-01-15",
        amount: 25.5,
        category: "survival",
        note: null,
        created_at: "2025-01-15T10:30:00Z",
      };

      const result = expenseSchema.safeParse(expense);
      expect(result.success).toBe(true);
    });
  });
});
