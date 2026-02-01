import { describe, it, expect } from "vitest";
import {
  createFixedExpenseSchema,
  updateFixedExpenseSchema,
  fixedExpenseSchema,
} from "@/lib/schemas/fixed-expense";

describe("Fixed Expense Schemas", () => {
  describe("createFixedExpenseSchema", () => {
    it("should validate a valid fixed expense", () => {
      const validExpense = {
        name: "Alquiler",
        amount: 850,
        category: "survival",
        start_ym: "2025-01",
      };

      const result = createFixedExpenseSchema.safeParse(validExpense);
      expect(result.success).toBe(true);
    });

    it("should accept expense with all optional fields", () => {
      const fullExpense = {
        name: "Netflix",
        amount: 15.99,
        category: "culture",
        start_ym: "2025-01",
        end_ym: "2025-12",
        due_day: 15,
        active: true,
      };

      const result = createFixedExpenseSchema.safeParse(fullExpense);
      expect(result.success).toBe(true);
    });

    it("should reject empty name", () => {
      const invalidExpense = {
        name: "",
        amount: 100,
        category: "survival",
        start_ym: "2025-01",
      };

      const result = createFixedExpenseSchema.safeParse(invalidExpense);
      expect(result.success).toBe(false);
    });

    it("should reject negative amount", () => {
      const invalidExpense = {
        name: "Test",
        amount: -50,
        category: "survival",
        start_ym: "2025-01",
      };

      const result = createFixedExpenseSchema.safeParse(invalidExpense);
      expect(result.success).toBe(false);
    });

    it("should reject invalid start_ym format", () => {
      const invalidExpense = {
        name: "Test",
        amount: 100,
        category: "survival",
        start_ym: "2025/01",
      };

      const result = createFixedExpenseSchema.safeParse(invalidExpense);
      expect(result.success).toBe(false);
    });

    it("should reject invalid due_day (0)", () => {
      const invalidExpense = {
        name: "Test",
        amount: 100,
        category: "survival",
        start_ym: "2025-01",
        due_day: 0,
      };

      const result = createFixedExpenseSchema.safeParse(invalidExpense);
      expect(result.success).toBe(false);
    });

    it("should reject invalid due_day (32)", () => {
      const invalidExpense = {
        name: "Test",
        amount: 100,
        category: "survival",
        start_ym: "2025-01",
        due_day: 32,
      };

      const result = createFixedExpenseSchema.safeParse(invalidExpense);
      expect(result.success).toBe(false);
    });

    it("should accept valid due_day range (1-31)", () => {
      [1, 15, 28, 31].forEach((due_day) => {
        const expense = {
          name: "Test",
          amount: 100,
          category: "survival",
          start_ym: "2025-01",
          due_day,
        };
        const result = createFixedExpenseSchema.safeParse(expense);
        expect(result.success).toBe(true);
      });
    });

    it("should reject end_ym before start_ym", () => {
      const invalidExpense = {
        name: "Test",
        amount: 100,
        category: "survival",
        start_ym: "2025-06",
        end_ym: "2025-01",
      };

      const result = createFixedExpenseSchema.safeParse(invalidExpense);
      expect(result.success).toBe(false);
    });

    it("should accept all valid categories", () => {
      const categories = ["survival", "optional", "culture", "extra"];

      categories.forEach((category) => {
        const expense = {
          name: "Test",
          amount: 100,
          category,
          start_ym: "2025-01",
        };
        const result = createFixedExpenseSchema.safeParse(expense);
        expect(result.success).toBe(true);
      });
    });
  });

  describe("updateFixedExpenseSchema", () => {
    it("should allow partial updates", () => {
      const partialUpdate = {
        amount: 900,
      };

      const result = updateFixedExpenseSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it("should allow updating active status", () => {
      const update = {
        active: false,
      };

      const result = updateFixedExpenseSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it("should allow updating end_ym", () => {
      const update = {
        end_ym: "2025-06",
      };

      const result = updateFixedExpenseSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it("should allow setting end_ym to null", () => {
      const update = {
        end_ym: null,
      };

      const result = updateFixedExpenseSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it("should reject empty update", () => {
      const emptyUpdate = {};

      const result = updateFixedExpenseSchema.safeParse(emptyUpdate);
      expect(result.success).toBe(false);
    });
  });

  describe("fixedExpenseSchema (full object)", () => {
    it("should validate a complete fixed expense", () => {
      const expense = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        user_id: "123e4567-e89b-12d3-a456-426614174001",
        name: "Alquiler",
        amount: 850,
        category: "survival",
        start_ym: "2025-01",
        end_ym: null,
        due_day: 1,
        active: true,
        created_at: "2025-01-01T00:00:00Z",
      };

      const result = fixedExpenseSchema.safeParse(expense);
      expect(result.success).toBe(true);
    });

    it("should validate expense with end_ym", () => {
      const expense = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        user_id: "123e4567-e89b-12d3-a456-426614174001",
        name: "Suscripción anual",
        amount: 120,
        category: "culture",
        start_ym: "2025-01",
        end_ym: "2025-12",
        due_day: 15,
        active: true,
        created_at: "2025-01-01T00:00:00Z",
      };

      const result = fixedExpenseSchema.safeParse(expense);
      expect(result.success).toBe(true);
    });

    it("should validate inactive expense", () => {
      const expense = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        user_id: "123e4567-e89b-12d3-a456-426614174001",
        name: "Gym cancelado",
        amount: 30,
        category: "extra",
        start_ym: "2024-01",
        end_ym: "2024-12",
        due_day: 5,
        active: false,
        created_at: "2024-01-01T00:00:00Z",
      };

      const result = fixedExpenseSchema.safeParse(expense);
      expect(result.success).toBe(true);
    });
  });
});
