import { z } from "zod";
import { nonNegativeAmountSchema, uuidSchema } from "./common";

/**
 * Schema for updating user settings
 */
export const updateSettingsSchema = z
  .object({
    monthly_income: nonNegativeAmountSchema.optional(),
    savings_goal: nonNegativeAmountSchema.optional(),
    budget_survival: nonNegativeAmountSchema.optional(),
    budget_optional: nonNegativeAmountSchema.optional(),
    budget_culture: nonNegativeAmountSchema.optional(),
    budget_extra: nonNegativeAmountSchema.optional(),
    current_balance: z.number().finite().optional(), // Can be negative
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debes proporcionar al menos un campo para actualizar",
  });

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;

/**
 * Full settings object (as returned from DB)
 */
export const settingsSchema = z.object({
  id: uuidSchema,
  user_id: uuidSchema,
  monthly_income: z.number(),
  savings_goal: z.number(),
  budget_survival: z.number(),
  budget_optional: z.number(),
  budget_culture: z.number(),
  budget_extra: z.number(),
  current_balance: z.number(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Settings = z.infer<typeof settingsSchema>;

/**
 * Default settings for new users
 */
export const DEFAULT_SETTINGS: Omit<Settings, "id" | "user_id" | "created_at" | "updated_at"> = {
  monthly_income: 0,
  savings_goal: 0,
  budget_survival: 0,
  budget_optional: 0,
  budget_culture: 0,
  budget_extra: 0,
  current_balance: 0,
};
