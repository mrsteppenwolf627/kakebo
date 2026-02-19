/**
 * Category suggestion utilities (P1-1)
 *
 * Suggests categories based on learned merchant rules before falling back to GPT.
 * This improves accuracy and consistency by learning from user corrections.
 *
 * Strategy:
 * 1. Extract merchant from transaction concept
 * 2. Query merchant_rules table (user-specific first, then global)
 * 3. Return category suggestion with confidence and source
 * 4. If no rule found, return null (GPT will classify)
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { apiLogger } from "@/lib/logger";
import { extractMerchant, getMerchantConfidence } from "./merchant-extractor";

/**
 * Category suggestion result
 */
export interface CategorySuggestion {
  category: "supervivencia" | "opcional" | "cultura" | "extra";
  confidence: number; // 0.0 to 1.0
  source: "user_rule" | "global_rule"; // Where the rule came from
  merchant: string; // Extracted merchant name
}

/**
 * Suggest category based on learned merchant rules
 *
 * Queries the merchant_rules table to find a matching rule.
 * Priority: user-specific rules > global rules (min 3 votes)
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param concept - Transaction concept (e.g., "Mercadona compra semanal")
 * @returns Category suggestion or null if no rule found
 *
 * @example
 * const suggestion = await suggestCategory(supabase, userId, "Mercadona compra");
 * // → { category: "supervivencia", confidence: 1.0, source: "global_rule", merchant: "mercadona" }
 *
 * const suggestion2 = await suggestCategory(supabase, userId, "Unknown merchant");
 * // → null (GPT will classify)
 */
export async function suggestCategory(
  supabase: SupabaseClient,
  userId: string,
  concept: string
): Promise<CategorySuggestion | null> {
  try {
    // Step 1: Extract merchant from concept
    const merchant = extractMerchant(concept);

    if (!merchant) {
      apiLogger.debug(
        { concept, userId },
        "No merchant extracted - will use GPT classification"
      );
      return null;
    }

    apiLogger.debug(
      { concept, merchant, userId },
      "Merchant extracted - looking up rules"
    );

    // Step 2: Query merchant rules using helper function
    const { data, error } = await supabase.rpc("get_merchant_rule", {
      p_user_id: userId,
      p_merchant: merchant,
    });

    if (error) {
      apiLogger.warn(
        { error, merchant, userId },
        "Error querying merchant rules - falling back to GPT"
      );
      return null;
    }

    // No rule found
    if (!data || data.length === 0) {
      apiLogger.debug(
        { merchant, userId },
        "No merchant rule found - will use GPT classification"
      );
      return null;
    }

    // Rule found
    const rule = data[0];
    const suggestion: CategorySuggestion = {
      category: rule.category,
      confidence: rule.confidence,
      source: rule.source,
      merchant,
    };

    apiLogger.info(
      {
        merchant,
        category: rule.category,
        confidence: rule.confidence,
        source: rule.source,
        userId,
      },
      "Category suggested from merchant rule"
    );

    return suggestion;
  } catch (err) {
    apiLogger.error(
      { err, concept, userId },
      "Error in suggestCategory - falling back to GPT"
    );
    return null;
  }
}

/**
 * Suggest categories for multiple transactions in batch
 *
 * More efficient than calling suggestCategory() multiple times.
 * Queries merchant_rules table once for all merchants.
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param concepts - Array of transaction concepts
 * @returns Map of concept → category suggestion (null if no rule)
 *
 * @example
 * const suggestions = await suggestCategoriesBatch(supabase, userId, [
 *   "Mercadona compra",
 *   "Netflix suscripción",
 *   "Unknown merchant",
 * ]);
 * // → {
 * //   "Mercadona compra": { category: "supervivencia", ... },
 * //   "Netflix suscripción": { category: "opcional", ... },
 * //   "Unknown merchant": null
 * // }
 */
export async function suggestCategoriesBatch(
  supabase: SupabaseClient,
  userId: string,
  concepts: string[]
): Promise<Map<string, CategorySuggestion | null>> {
  const results = new Map<string, CategorySuggestion | null>();

  try {
    // Step 1: Extract merchants from all concepts
    const conceptToMerchant = new Map<string, string | null>();
    const merchants: string[] = [];

    for (const concept of concepts) {
      const merchant = extractMerchant(concept);
      conceptToMerchant.set(concept, merchant);
      if (merchant) {
        merchants.push(merchant);
      }
    }

    // If no merchants found, return all nulls
    if (merchants.length === 0) {
      for (const concept of concepts) {
        results.set(concept, null);
      }
      return results;
    }

    // Step 2: Query merchant rules for all merchants (single query)
    const { data: userRules, error: userError } = await supabase
      .from("merchant_rules")
      .select("merchant, category, confidence")
      .eq("user_id", userId)
      .in("merchant", merchants);

    if (userError) {
      apiLogger.warn(
        { error: userError, userId },
        "Error querying user merchant rules"
      );
    }

    const { data: globalRules, error: globalError } = await supabase
      .from("merchant_rules")
      .select("merchant, category, confidence, vote_count")
      .is("user_id", null)
      .in("merchant", merchants)
      .gte("vote_count", 3); // Min 3 votes for consensus

    if (globalError) {
      apiLogger.warn(
        { error: globalError, userId },
        "Error querying global merchant rules"
      );
    }

    // Step 3: Build merchant → rule map
    const merchantToRule = new Map<
      string,
      { category: string; confidence: number; source: string }
    >();

    // Add global rules first (lower priority)
    if (globalRules) {
      for (const rule of globalRules) {
        merchantToRule.set(rule.merchant, {
          category: rule.category,
          confidence: rule.confidence * 0.8, // Discount global vs personal
          source: "global_rule",
        });
      }
    }

    // Add user rules (override global rules)
    if (userRules) {
      for (const rule of userRules) {
        merchantToRule.set(rule.merchant, {
          category: rule.category,
          confidence: rule.confidence,
          source: "user_rule",
        });
      }
    }

    // Step 4: Map concepts to suggestions
    for (const concept of concepts) {
      const merchant = conceptToMerchant.get(concept);

      if (!merchant) {
        results.set(concept, null);
        continue;
      }

      const rule = merchantToRule.get(merchant);

      if (!rule) {
        results.set(concept, null);
        continue;
      }

      results.set(concept, {
        category: rule.category as
          | "supervivencia"
          | "opcional"
          | "cultura"
          | "extra",
        confidence: rule.confidence,
        source: rule.source as "user_rule" | "global_rule",
        merchant,
      });
    }

    apiLogger.info(
      {
        totalConcepts: concepts.length,
        suggestionsFound: Array.from(results.values()).filter((r) => r !== null)
          .length,
        userId,
      },
      "Category suggestions batch completed"
    );

    return results;
  } catch (err) {
    apiLogger.error(
      { err, userId },
      "Error in suggestCategoriesBatch - returning all nulls"
    );

    // Fallback: return all nulls
    for (const concept of concepts) {
      results.set(concept, null);
    }

    return results;
  }
}

/**
 * Check if category suggestion should be used
 *
 * Helper to determine if a suggestion is confident enough to skip GPT.
 * Uses a threshold approach: user rules always used, global rules only if high confidence.
 *
 * @param suggestion - Category suggestion (or null)
 * @param confidenceThreshold - Minimum confidence to use suggestion (default: 0.7)
 * @returns true if suggestion should be used instead of GPT
 *
 * @example
 * const suggestion = await suggestCategory(...);
 * if (shouldUseSuggestion(suggestion, 0.8)) {
 *   // Use suggestion.category directly
 * } else {
 *   // Fall back to GPT classification
 * }
 */
export function shouldUseSuggestion(
  suggestion: CategorySuggestion | null,
  confidenceThreshold: number = 0.7
): boolean {
  if (!suggestion) {
    return false;
  }

  // User rules: always use (confidence = 1.0)
  if (suggestion.source === "user_rule") {
    return true;
  }

  // Global rules: use only if confident enough
  // (Global rules have 0.8x discount, so effective confidence is lower)
  return suggestion.confidence >= confidenceThreshold;
}
