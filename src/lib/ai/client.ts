import OpenAI from "openai";

/**
 * OpenAI client singleton
 *
 * Uses OPENAI_API_KEY from environment variables.
 * In development, add to .env.local:
 *   OPENAI_API_KEY=sk-...
 */

if (!process.env.OPENAI_API_KEY) {
  console.warn(
    "⚠️ OPENAI_API_KEY not found. AI features will not work. Add it to .env.local"
  );
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

/**
 * Default model for expense classification
 * GPT-4o-mini: Fast, cheap, good enough for classification tasks
 *
 * Pricing (as of 2026):
 * - Input: $0.15 / 1M tokens
 * - Output: $0.60 / 1M tokens
 */
export const DEFAULT_MODEL = "gpt-4o-mini";

/**
 * Model configuration
 */
export const MODEL_CONFIG = {
  "gpt-4o-mini": {
    name: "GPT-4o Mini",
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.6,
    maxTokens: 128000,
    description: "Fast and cheap, good for classification",
  },
  "gpt-4o": {
    name: "GPT-4o",
    inputCostPer1M: 2.5,
    outputCostPer1M: 10,
    maxTokens: 128000,
    description: "More capable, better for complex reasoning",
  },
} as const;

export type ModelId = keyof typeof MODEL_CONFIG;

/**
 * Calculate cost of a completion
 */
export function calculateCost(
  model: ModelId,
  inputTokens: number,
  outputTokens: number
): number {
  const config = MODEL_CONFIG[model];
  const inputCost = (inputTokens / 1_000_000) * config.inputCostPer1M;
  const outputCost = (outputTokens / 1_000_000) * config.outputCostPer1M;
  return inputCost + outputCost;
}
