import { z } from "zod";
import { categorySchema } from "./common";

/**
 * Schema for expense classification request
 */
export const classifyExpenseSchema = z.object({
  /** The expense text to classify (e.g., "Mercadona 45€") */
  text: z
    .string()
    .min(1, { message: "El texto no puede estar vacío" })
    .max(500, { message: "El texto no puede exceder 500 caracteres" }),
  /** Optional: specific prompt version to use */
  promptVersion: z.string().optional(),
  /** Optional: specific model to use */
  model: z.enum(["gpt-4o-mini", "gpt-4o"]).optional(),
});

export type ClassifyExpenseInput = z.infer<typeof classifyExpenseSchema>;

/**
 * Schema for batch classification request
 */
export const classifyExpensesBatchSchema = z.object({
  /** Array of expense texts to classify */
  texts: z
    .array(
      z
        .string()
        .min(1)
        .max(500)
    )
    .min(1, { message: "Debes proporcionar al menos un texto" })
    .max(20, { message: "Máximo 20 textos por petición" }),
  /** Optional: specific prompt version to use */
  promptVersion: z.string().optional(),
  /** Optional: specific model to use */
  model: z.enum(["gpt-4o-mini", "gpt-4o"]).optional(),
});

export type ClassifyExpensesBatchInput = z.infer<typeof classifyExpensesBatchSchema>;

/**
 * Schema for classification result
 */
export const classificationResultSchema = z.object({
  category: categorySchema,
  note: z.string(),
  confidence: z.number().min(0).max(1),
  metrics: z.object({
    model: z.string(),
    promptVersion: z.string(),
    latencyMs: z.number(),
    inputTokens: z.number(),
    outputTokens: z.number(),
    costUsd: z.number(),
  }),
});

export type ClassificationResult = z.infer<typeof classificationResultSchema>;
