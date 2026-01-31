import { z } from "zod";

/**
 * Kakebo expense categories
 * - survival: Essential expenses (food, transport, health)
 * - optional: Non-essential expenses (clothing, restaurants)
 * - culture: Leisure and development (books, courses, cinema)
 * - extra: Unexpected and exceptional expenses
 */
export const categorySchema = z.enum(["survival", "optional", "culture", "extra"], {
  error: "Categoría inválida. Usa: survival, optional, culture, extra",
});

export type CategoryKey = z.infer<typeof categorySchema>;

/**
 * Category labels in Spanish for UI display
 */
export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  survival: "Supervivencia",
  optional: "Opcional",
  culture: "Cultura",
  extra: "Extra",
};

/**
 * Year-month format: YYYY-MM (e.g., "2025-01")
 */
export const ymSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: "Formato inválido. Usa YYYY-MM (ej: 2025-01)",
  });

/**
 * ISO date format: YYYY-MM-DD
 */
export const dateSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, {
    message: "Formato de fecha inválido. Usa YYYY-MM-DD",
  });

/**
 * UUID v4 format
 */
export const uuidSchema = z.string().uuid({
  message: "ID inválido",
});

/**
 * Positive amount (greater than 0)
 */
export const amountSchema = z
  .number()
  .positive({ message: "El importe debe ser mayor que 0" })
  .finite({ message: "El importe debe ser un número finito" });

/**
 * Non-negative amount (0 or greater)
 */
export const nonNegativeAmountSchema = z
  .number()
  .nonnegative({ message: "El importe no puede ser negativo" })
  .finite({ message: "El importe debe ser un número finito" });

/**
 * Month status
 */
export const monthStatusSchema = z.enum(["open", "closed"], {
  error: "Estado inválido. Usa: open, closed",
});

export type MonthStatus = z.infer<typeof monthStatusSchema>;

/**
 * Day of month (1-31)
 */
export const dayOfMonthSchema = z
  .number()
  .int()
  .min(1, { message: "El día debe ser entre 1 y 31" })
  .max(31, { message: "El día debe ser entre 1 y 31" });

/**
 * Pagination params
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type PaginationParams = z.infer<typeof paginationSchema>;
