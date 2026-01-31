import { z } from "zod";
import { uuidSchema, ymSchema, monthStatusSchema } from "./common";

/**
 * Schema for creating/getting a month
 * Uses year-month format (YYYY-MM)
 */
export const createMonthSchema = z.object({
  ym: ymSchema,
});

export type CreateMonthInput = z.infer<typeof createMonthSchema>;

/**
 * Schema for updating a month (closing, etc.)
 */
export const updateMonthSchema = z
  .object({
    status: monthStatusSchema.optional(),
    savings_done: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debes proporcionar al menos un campo para actualizar",
  });

export type UpdateMonthInput = z.infer<typeof updateMonthSchema>;

/**
 * Schema for month query params
 */
export const monthQuerySchema = z.object({
  status: monthStatusSchema.optional(),
  year: z.coerce.number().int().min(2020).max(2100).optional(),
});

export type MonthQueryParams = z.infer<typeof monthQuerySchema>;

/**
 * Full month object (as returned from DB)
 */
export const monthSchema = z.object({
  id: uuidSchema,
  user_id: uuidSchema,
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  status: monthStatusSchema,
  savings_done: z.boolean(),
  created_at: z.string(),
});

export type Month = z.infer<typeof monthSchema>;

/**
 * Helper to convert year-month string to year and month numbers
 */
export function parseYm(ym: string): { year: number; month: number } {
  const [yearStr, monthStr] = ym.split("-");
  return {
    year: parseInt(yearStr, 10),
    month: parseInt(monthStr, 10),
  };
}

/**
 * Helper to format year and month to YYYY-MM string
 */
export function formatYm(year: number, month: number): string {
  return `${year}-${month.toString().padStart(2, "0")}`;
}
