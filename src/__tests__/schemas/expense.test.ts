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

    describe("Fase 2.B: subcategoría opcional", () => {
      it("accepts a valid subcategory", () => {
        const expense = {
          date: "2025-01-15",
          amount: 25.5,
          category: "survival",
          subcategory: "food_basic",
        };

        const result = createExpenseSchema.safeParse(expense);
        expect(result.success).toBe(true);
      });

      it("still accepts an expense without subcategory (manual user not forced to choose)", () => {
        const expense = {
          date: "2025-01-15",
          amount: 25.5,
          category: "survival",
        };

        const result = createExpenseSchema.safeParse(expense);
        expect(result.success).toBe(true);
      });

      it("accepts explicit null for subcategory", () => {
        const expense = {
          date: "2025-01-15",
          amount: 25.5,
          category: "survival",
          subcategory: null,
        };

        const result = createExpenseSchema.safeParse(expense);
        expect(result.success).toBe(true);
      });

      it("rejects an invalid subcategory value", () => {
        const expense = {
          date: "2025-01-15",
          amount: 25.5,
          category: "survival",
          subcategory: "comida", // not a real catalog id
        };

        const result = createExpenseSchema.safeParse(expense);
        expect(result.success).toBe(false);
      });

      it("keeps food_basic and dining_out as distinct, non-interchangeable values", () => {
        const foodBasic = createExpenseSchema.safeParse({
          date: "2025-01-15",
          amount: 40,
          category: "survival",
          subcategory: "food_basic",
        });
        const diningOut = createExpenseSchema.safeParse({
          date: "2025-01-15",
          amount: 40,
          category: "optional",
          subcategory: "dining_out",
        });

        expect(foodBasic.success).toBe(true);
        expect(diningOut.success).toBe(true);
        if (foodBasic.success && diningOut.success) {
          expect(foodBasic.data.subcategory).toBe("food_basic");
          expect(foodBasic.data.subcategory).not.toBe("dining_out");
          expect(diningOut.data.subcategory).toBe("dining_out");
          expect(diningOut.data.subcategory).not.toBe("food_basic");
        }
      });
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

    describe("Fase 2.B: subcategoría opcional", () => {
      it("allows updating only the subcategory of an existing expense", () => {
        const result = updateExpenseSchema.safeParse({ subcategory: "dining_out" });
        expect(result.success).toBe(true);
      });

      it("allows clearing a previously set subcategory with null", () => {
        const result = updateExpenseSchema.safeParse({ subcategory: null });
        expect(result.success).toBe(true);
      });

      it("rejects an invalid subcategory value on update", () => {
        const result = updateExpenseSchema.safeParse({ subcategory: "no-existe" });
        expect(result.success).toBe(false);
      });
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

    it("Fase 2.B: a historical expense without a subcategory field still validates (backward compatibility)", () => {
      const historicalExpense = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        user_id: "123e4567-e89b-12d3-a456-426614174001",
        month_id: "123e4567-e89b-12d3-a456-426614174002",
        date: "2024-03-10",
        amount: 12,
        category: "optional",
        note: "Gasto anterior a la Fase 2.B",
        created_at: "2024-03-10T10:30:00Z",
        // subcategory field intentionally absent, as in any pre-existing row
      };

      const result = expenseSchema.safeParse(historicalExpense);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.subcategory).toBeUndefined();
      }
    });

    it("Fase 2.B: validates a full expense that does carry a subcategory", () => {
      const expense = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        user_id: "123e4567-e89b-12d3-a456-426614174001",
        month_id: "123e4567-e89b-12d3-a456-426614174002",
        date: "2025-01-15",
        amount: 25.5,
        category: "survival",
        note: "Mercadona",
        subcategory: "food_basic",
        created_at: "2025-01-15T10:30:00Z",
      };

      const result = expenseSchema.safeParse(expense);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.subcategory).toBe("food_basic");
      }
    });

    it("Fase 2.B: rejects a subcategory value outside the approved catalog", () => {
      const expense = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        user_id: "123e4567-e89b-12d3-a456-426614174001",
        month_id: "123e4567-e89b-12d3-a456-426614174002",
        date: "2025-01-15",
        amount: 25.5,
        category: "survival",
        note: "Test",
        subcategory: "invalid_value",
        created_at: "2025-01-15T10:30:00Z",
      };

      const result = expenseSchema.safeParse(expense);
      expect(result.success).toBe(false);
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
