import { z } from "zod";
import {
  categorySchema,
  amountSchema,
  uuidSchema,
  ymSchema,
  dayOfMonthSchema,
} from "./common";

/**
 * Schema for creating a new fixed expense
 */
export const createFixedExpenseSchema = z
  .object({
    name: z
      .string()
      .min(1, { message: "El nombre es requerido" })
      .max(100, { message: "El nombre no puede exceder 100 caracteres" }),
    amount: amountSchema,
    category: categorySchema,
    start_ym: ymSchema,
    end_ym: ymSchema.optional().nullable(),
    due_day: dayOfMonthSchema.optional().default(1),
    active: z.boolean().optional().default(true),
  })
  .refine(
    (data) => {
      if (!data.end_ym) return true;
      return data.start_ym <= data.end_ym;
    },
    {
      message: "La fecha de fin debe ser posterior a la fecha de inicio",
      path: ["end_ym"],
    }
  );

export type CreateFixedExpenseInput = z.infer<typeof createFixedExpenseSchema>;

/**
 * Schema for updating a fixed expense
 */
export const updateFixedExpenseSchema = z
  .object({
    name: z
      .string()
      .min(1, { message: "El nombre es requerido" })
      .max(100, { message: "El nombre no puede exceder 100 caracteres" })
      .optional(),
    amount: amountSchema.optional(),
    category: categorySchema.optional(),
    start_ym: ymSchema.optional(),
    end_ym: ymSchema.optional().nullable(),
    due_day: dayOfMonthSchema.optional(),
    active: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debes proporcionar al menos un campo para actualizar",
  });

export type UpdateFixedExpenseInput = z.infer<typeof updateFixedExpenseSchema>;

/**
 * Schema for fixed expense query params
 */
export const fixedExpenseQuerySchema = z.object({
  active: z
    .string()
    .transform((v) => v === "true")
    .optional(),
  category: categorySchema.optional(),
});

export type FixedExpenseQueryParams = z.infer<typeof fixedExpenseQuerySchema>;

/**
 * Full fixed expense object (as returned from DB)
 */
export const fixedExpenseSchema = z.object({
  id: uuidSchema,
  user_id: uuidSchema,
  name: z.string(),
  amount: z.number(),
  category: categorySchema,
  start_ym: z.string(),
  end_ym: z.string().nullable(),
  due_day: z.number().int(),
  active: z.boolean(),
  created_at: z.string(),
});

export type FixedExpense = z.infer<typeof fixedExpenseSchema>;
