import { z } from "zod";
import {
    categorySchema,
    dateSchema,
    amountSchema,
    uuidSchema,
    ymSchema,
} from "./common";

/**
 * Schema for creating a new income
 */
export const createIncomeSchema = z.object({
    date: dateSchema,
    amount: amountSchema,
    category: z.string().min(1, "Categoría requerida"), // generic string for now, or enum if we want to restrict
    description: z
        .string()
        .max(500, { message: "La descripción no puede exceder 500 caracteres" })
        .optional()
        .default(""),
    month_id: uuidSchema.optional(), // If not provided, will be resolved from date
});

export type CreateIncomeInput = z.infer<typeof createIncomeSchema>;

/**
 * Schema for updating an existing income
 */
export const updateIncomeSchema = z
    .object({
        date: dateSchema.optional(),
        amount: amountSchema.optional(),
        category: z.string().min(1).optional(),
        description: z
            .string()
            .max(500, { message: "La descripción no puede exceder 500 caracteres" })
            .optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "Debes proporcionar al menos un campo para actualizar",
    });

export type UpdateIncomeInput = z.infer<typeof updateIncomeSchema>;

/**
 * Schema for income query params
 */
export const incomeQuerySchema = z.object({
    ym: ymSchema.optional(), // Filter by year-month
    month_id: uuidSchema.optional(), // Filter by month_id
    category: z.string().optional(), // Filter by category
    from_date: dateSchema.optional(), // Filter from date
    to_date: dateSchema.optional(), // Filter to date
});

export type IncomeQueryParams = z.infer<typeof incomeQuerySchema>;

/**
 * Full income object (as returned from DB)
 */
export const incomeSchema = z.object({
    id: uuidSchema,
    user_id: uuidSchema,
    month_id: uuidSchema.nullable(),
    date: dateSchema,
    amount: z.number(),
    category: z.string(),
    description: z.string().nullable(),
    created_at: z.string(),
});

export type Income = z.infer<typeof incomeSchema>;
