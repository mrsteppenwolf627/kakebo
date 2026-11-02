import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Provider clients. The active chat provider is selected with AI_PROVIDER.
 *
 * Uses provider credentials from environment variables.
 * In development, add the selected provider's key to .env.local.
 */

export const AI_PROVIDER = process.env.AI_PROVIDER === "anthropic" ? "anthropic" : "openai";
export const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-5-5";

if (AI_PROVIDER === "openai" && !process.env.OPENAI_API_KEY) {
  console.warn(
    "⚠️ OPENAI_API_KEY not found. AI features will not work. Add it to .env.local"
  );
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
  dangerouslyAllowBrowser: true,
});

if (AI_PROVIDER === "anthropic" && !process.env.ANTHROPIC_API_KEY) {
  console.warn(
    "⚠️ ANTHROPIC_API_KEY not found. Anthropic AI features will not work. Add it to .env.local"
  );
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
  dangerouslyAllowBrowser: process.env.NODE_ENV === "test",
});

/**
 * Default model for expense classification
 * GPT-5-nano: Fast, cheap, good enough for classification tasks
 */
export const DEFAULT_MODEL = "gpt-5-nano";

/**
 * Model configuration
 */
export const MODEL_CONFIG = {
  "gpt-5-nano": {
    name: "GPT-5 Nano",
    inputCostPer1M: 0.05,
    outputCostPer1M: 0.4,
    maxTokens: 400000,
    description: "Fast and cheap, good for classification",
  },
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
  "claude-haiku-5-5": {
    name: "Claude Haiku 5.5",
    inputCostPer1M: 0.1,
    outputCostPer1M: 0.5,
    maxTokens: 1000000,
    description: "Fast and economical Anthropic model for high-volume agent work",
  },
  "claude-sonnet-5-5": {
    name: "Claude Sonnet 5.5",
    inputCostPer1M: 2,
    outputCostPer1M: 10,
    maxTokens: 1000000,
    description: "Higher-capability Anthropic model for complex reasoning",
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
