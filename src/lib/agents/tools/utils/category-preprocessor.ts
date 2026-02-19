/**
 * Category preprocessing for GPT (P1-1)
 *
 * Pre-processes transaction concepts to suggest categories BEFORE GPT decides.
 * This can be used in the function-caller to enhance the GPT prompt with learned rules.
 *
 * Usage in function-caller:
 * 1. Extract transaction concept from user message
 * 2. Call preprocessCategoryForGPT(concept)
 * 3. If suggestion found, add it to GPT system prompt
 * 4. GPT can use the suggestion or override it
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { suggestCategory, shouldUseSuggestion } from "./category-suggester";
import { apiLogger } from "@/lib/logger";

/**
 * Preprocessing result for GPT
 */
export interface CategoryPreprocessingResult {
  hasSuggestion: boolean;
  suggestedCategory?: string; // English format for GPT
  confidence?: number;
  source?: "user_rule" | "global_rule";
  merchant?: string;
  promptHint?: string; // Text to add to GPT system prompt
}

/**
 * Preprocess category for GPT prompt enhancement
 *
 * Checks if a merchant rule exists for the concept.
 * If found, returns a suggestion that can be added to the GPT system prompt.
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param concept - Transaction concept
 * @returns Preprocessing result with optional suggestion
 *
 * @example
 * const result = await preprocessCategoryForGPT(supabase, userId, "Mercadona compra");
 * // → {
 * //   hasSuggestion: true,
 * //   suggestedCategory: "survival",
 * //   confidence: 1.0,
 * //   source: "global_rule",
 * //   merchant: "mercadona",
 * //   promptHint: "Based on learned rules, this expense is likely 'survival' (merchant: mercadona, confidence: 100%)"
 * // }
 *
 * // Add promptHint to GPT system message to guide classification
 */
export async function preprocessCategoryForGPT(
  supabase: SupabaseClient,
  userId: string,
  concept: string
): Promise<CategoryPreprocessingResult> {
  try {
    // Get category suggestion
    const suggestion = await suggestCategory(supabase, userId, concept);

    if (!suggestion) {
      return { hasSuggestion: false };
    }

    // Map Spanish category to English (for GPT)
    const categoryMapping: Record<string, string> = {
      supervivencia: "survival",
      opcional: "optional",
      cultura: "culture",
      extra: "extra",
    };

    const suggestedCategory = categoryMapping[suggestion.category];

    if (!suggestedCategory) {
      apiLogger.warn(
        { category: suggestion.category },
        "Unknown category in suggestion - ignoring"
      );
      return { hasSuggestion: false };
    }

    // Generate prompt hint for GPT
    const confidencePercent = Math.round(suggestion.confidence * 100);
    const sourceText =
      suggestion.source === "user_rule"
        ? "your explicit preference"
        : "learned patterns from other users";

    const promptHint = `Based on ${sourceText}, this expense is likely '${suggestedCategory}' (merchant: ${suggestion.merchant}, confidence: ${confidencePercent}%). You should strongly prefer this category unless the user explicitly specifies otherwise.`;

    apiLogger.info(
      {
        concept,
        suggestedCategory,
        confidence: suggestion.confidence,
        source: suggestion.source,
        merchant: suggestion.merchant,
        userId,
      },
      "Category preprocessed for GPT"
    );

    return {
      hasSuggestion: true,
      suggestedCategory,
      confidence: suggestion.confidence,
      source: suggestion.source,
      merchant: suggestion.merchant,
      promptHint,
    };
  } catch (err) {
    apiLogger.error(
      { err, concept, userId },
      "Error preprocessing category - continuing without suggestion"
    );

    return { hasSuggestion: false };
  }
}

/**
 * Preprocess categories for multiple concepts in batch
 *
 * More efficient for batch operations.
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param concepts - Array of transaction concepts
 * @returns Map of concept → preprocessing result
 */
export async function preprocessCategoriesForGPTBatch(
  supabase: SupabaseClient,
  userId: string,
  concepts: string[]
): Promise<Map<string, CategoryPreprocessingResult>> {
  const results = new Map<string, CategoryPreprocessingResult>();

  // For now, process sequentially (could be parallelized)
  for (const concept of concepts) {
    const result = await preprocessCategoryForGPT(supabase, userId, concept);
    results.set(concept, result);
  }

  return results;
}

/**
 * Helper: Build enhanced system prompt with category hint
 *
 * Modifies the system prompt to include category suggestion.
 * Can be used in function-caller to guide GPT classification.
 *
 * @param basePrompt - Original system prompt
 * @param preprocessingResult - Preprocessing result
 * @returns Enhanced system prompt
 *
 * @example
 * const basePrompt = "You are a helpful financial assistant...";
 * const preprocessing = await preprocessCategoryForGPT(...);
 * const enhancedPrompt = buildEnhancedPrompt(basePrompt, preprocessing);
 * // GPT will see the original prompt + the category hint
 */
export function buildEnhancedPrompt(
  basePrompt: string,
  preprocessingResult: CategoryPreprocessingResult
): string {
  if (!preprocessingResult.hasSuggestion || !preprocessingResult.promptHint) {
    return basePrompt;
  }

  return `${basePrompt}\n\n**Category Suggestion**: ${preprocessingResult.promptHint}`;
}
