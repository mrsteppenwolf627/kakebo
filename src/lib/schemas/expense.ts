import { z } from "zod";
import {
  categorySchema,
  dateSchema,
  amountSchema,
  uuidSchema,
  ymSchema,
} from "./common";

/**
 * Schema for creating a new expense
 */
export const createExpenseSchema = z.object({
  date: dateSchema,
  amount: amountSchema,
  category: categorySchema,
  note: z
    .string()
    .max(500, { message: "La nota no puede exceder 500 caracteres" })
    .optional()
    .default(""),
  month_id: uuidSchema.optional(), // If not provided, will be resolved from date
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

/**
 * Schema for updating an existing expense
 */
export const updateExpenseSchema = z
  .object({
    date: dateSchema.optional(),
    amount: amountSchema.optional(),
    category: categorySchema.optional(),
    note: z
      .string()
      .max(500, { message: "La nota no puede exceder 500 caracteres" })
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debes proporcionar al menos un campo para actualizar",
  });

export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

/**
 * Schema for expense query params
 */
export const expenseQuerySchema = z.object({
  ym: ymSchema.optional(), // Filter by year-month
  month_id: uuidSchema.optional(), // Filter by month_id
  category: categorySchema.optional(), // Filter by category
  from_date: dateSchema.optional(), // Filter from date
  to_date: dateSchema.optional(), // Filter to date
});

export type ExpenseQueryParams = z.infer<typeof expenseQuerySchema>;

/**
 * Full expense object (as returned from DB)
 */
export const expenseSchema = z.object({
  id: uuidSchema,
  user_id: uuidSchema,
  month_id: uuidSchema,
  date: dateSchema,
  amount: z.number(),
  category: categorySchema,
  note: z.string().nullable(),
  created_at: z.string(),
});

export type Expense = z.infer<typeof expenseSchema>;
