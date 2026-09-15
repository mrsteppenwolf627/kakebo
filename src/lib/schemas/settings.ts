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
    // Fase 2.E: "Pedir confirmación antes de que la IA cambie mis datos".
    ai_confirm_writes: z.boolean().optional(),
    // Fase 2.G: consentimiento explícito para aprendizaje colectivo anónimo.
    allow_collective_learning: z.boolean().optional(),
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
  // Fase 2.E: nullable/optional para tolerar filas creadas antes de aplicar
  // la migración que añade esta columna (ver
  // supabase/migrations/20260914_add_ai_confirm_writes_setting.sql).
  ai_confirm_writes: z.boolean().nullable().optional(),
  // Fase 2.G: nullable/optional por el mismo motivo (migración
  // 20260914_add_allow_collective_learning_setting.sql aún no aplicada).
  allow_collective_learning: z.boolean().nullable().optional(),
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
  // Fase 2.E: activado por defecto tanto para usuarios nuevos como para las
  // filas que este endpoint cree como fallback.
  ai_confirm_writes: true,
  // Fase 2.G: desactivado por defecto — ningún usuario participa en
  // aprendizaje colectivo salvo que lo active explícitamente.
  allow_collective_learning: false,
};
