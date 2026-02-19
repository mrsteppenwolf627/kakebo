/**
 * Learning from corrections (P1-1)
 *
 * Learns merchant → category rules when users correct GPT classifications.
 * This creates a feedback loop that improves accuracy over time.
 *
 * Strategy:
 * 1. When user corrects category, extract merchant from concept
 * 2. Save user-specific rule (upsert_merchant_rule)
 * 3. If correction matches global consensus, increment global vote count
 * 4. User rules have confidence = 1.0 (explicit correction)
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { apiLogger } from "@/lib/logger";
import { extractMerchant } from "./merchant-extractor";

/**
 * Learning result
 */
export interface LearningResult {
  success: boolean;
  merchant: string | null; // Extracted merchant (null if couldn't extract)
  ruleCreated: boolean; // true if new rule created
  ruleUpdated: boolean; // true if existing rule updated
  globalVoteIncremented: boolean; // true if global rule vote incremented
  message: string; // User-friendly message
}

/**
 * Learn from user correction
 *
 * Saves a merchant → category rule when user corrects a transaction category.
 * Creates user-specific rule with confidence = 1.0 (explicit correction).
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param concept - Transaction concept (e.g., "Mercadona compra semanal")
 * @param oldCategory - Category before correction (Spanish DB format)
 * @param newCategory - Category after correction (Spanish DB format)
 * @returns Learning result
 *
 * @example
 * const result = await learnFromCorrection(
 *   supabase,
 *   userId,
 *   "Mercadona compra",
 *   "opcional",
 *   "supervivencia"
 * );
 * // → { success: true, merchant: "mercadona", ruleCreated: true, ... }
 */
export async function learnFromCorrection(
  supabase: SupabaseClient,
  userId: string,
  concept: string,
  oldCategory: string,
  newCategory: string
): Promise<LearningResult> {
  try {
    // Step 1: Extract merchant from concept
    const merchant = extractMerchant(concept);

    if (!merchant) {
      apiLogger.debug(
        { concept, userId },
        "Could not extract merchant - no rule created"
      );

      return {
        success: true, // Not an error, just no merchant
        merchant: null,
        ruleCreated: false,
        ruleUpdated: false,
        globalVoteIncremented: false,
        message:
          "No se pudo identificar un comerciante en el concepto. No se creó regla.",
      };
    }

    apiLogger.info(
      {
        merchant,
        concept,
        oldCategory,
        newCategory,
        userId,
      },
      "Learning from correction - creating merchant rule"
    );

    // Step 2: Check if rule exists BEFORE upsert (to determine create vs update)
    const { data: existingRule, error: checkError } = await supabase
      .from("merchant_rules")
      .select("id")
      .eq("user_id", userId)
      .eq("merchant", merchant)
      .limit(1)
      .single();

    const ruleExistedBefore = !!existingRule && !checkError;

    // Step 3: Upsert user-specific rule
    const { data: ruleId, error: upsertError } = await supabase.rpc(
      "upsert_merchant_rule",
      {
        p_user_id: userId,
        p_merchant: merchant,
        p_category: newCategory,
        p_confidence: 1.0, // User explicit correction = max confidence
      }
    );

    if (upsertError) {
      apiLogger.error(
        { error: upsertError, merchant, userId },
        "Error upserting merchant rule"
      );

      return {
        success: false,
        merchant,
        ruleCreated: false,
        ruleUpdated: false,
        globalVoteIncremented: false,
        message: `Error al crear regla: ${upsertError.message}`,
      };
    }

    const ruleCreated = !ruleExistedBefore;
    const ruleUpdated = ruleExistedBefore;

    apiLogger.info(
      {
        merchant,
        category: newCategory,
        ruleId,
        ruleCreated,
        ruleUpdated,
        userId,
      },
      "Merchant rule saved successfully"
    );

    // Step 4: Increment global rule vote count (if correction matches global consensus)
    let globalVoteIncremented = false;

    try {
      await incrementGlobalRuleVoteIfMatches(
        supabase,
        merchant,
        newCategory,
        userId
      );
      globalVoteIncremented = true;

      apiLogger.debug(
        { merchant, category: newCategory, userId },
        "Global rule vote incremented"
      );
    } catch (voteError) {
      // Don't fail the entire operation if vote increment fails
      apiLogger.warn(
        { error: voteError, merchant, userId },
        "Failed to increment global rule vote - continuing"
      );
    }

    const message = ruleCreated
      ? `✅ Regla aprendida: "${merchant}" → ${newCategory}`
      : `✅ Regla actualizada: "${merchant}" → ${newCategory}`;

    return {
      success: true,
      merchant,
      ruleCreated,
      ruleUpdated,
      globalVoteIncremented,
      message,
    };
  } catch (err) {
    apiLogger.error(
      { err, concept, userId },
      "Error in learnFromCorrection"
    );

    return {
      success: false,
      merchant: null,
      ruleCreated: false,
      ruleUpdated: false,
      globalVoteIncremented: false,
      message: `Error al aprender de la corrección: ${err instanceof Error ? err.message : "Unknown error"}`,
    };
  }
}

/**
 * Increment global rule vote count if user correction matches global consensus
 *
 * This helps build global consensus over time.
 * Only increments if global rule exists AND user correction matches it.
 *
 * @param supabase - Supabase client
 * @param merchant - Merchant name
 * @param category - Category (Spanish DB format)
 * @param userId - User ID (for logging)
 */
async function incrementGlobalRuleVoteIfMatches(
  supabase: SupabaseClient,
  merchant: string,
  category: string,
  userId: string
): Promise<void> {
  try {
    // Check if global rule exists and matches category
    const { data: globalRule, error: fetchError } = await supabase
      .from("merchant_rules")
      .select("category, vote_count")
      .is("user_id", null)
      .eq("merchant", merchant)
      .limit(1)
      .single();

    if (fetchError || !globalRule) {
      // No global rule exists - don't create one (only increment existing)
      apiLogger.debug(
        { merchant, userId },
        "No global rule found - not incrementing"
      );
      return;
    }

    // Check if user correction matches global consensus
    if (globalRule.category !== category) {
      apiLogger.debug(
        {
          merchant,
          userCategory: category,
          globalCategory: globalRule.category,
          userId,
        },
        "User correction differs from global rule - not incrementing"
      );
      return;
    }

    // User correction matches global consensus - increment vote
    const { error: incrementError } = await supabase.rpc(
      "increment_global_rule_vote",
      {
        p_merchant: merchant,
        p_category: category,
      }
    );

    if (incrementError) {
      throw incrementError;
    }

    apiLogger.info(
      {
        merchant,
        category,
        previousVoteCount: globalRule.vote_count,
        userId,
      },
      "Global rule vote incremented (user correction matches consensus)"
    );
  } catch (err) {
    apiLogger.warn(
      { err, merchant, userId },
      "Error incrementing global rule vote"
    );
    throw err;
  }
}

/**
 * Learn from multiple corrections in batch
 *
 * More efficient than calling learnFromCorrection() multiple times.
 * Useful for batch imports or historical data analysis.
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param corrections - Array of corrections (concept, oldCategory, newCategory)
 * @returns Array of learning results
 *
 * @example
 * const results = await learnFromCorrectionsBatch(supabase, userId, [
 *   { concept: "Mercadona compra", oldCategory: "opcional", newCategory: "supervivencia" },
 *   { concept: "Netflix", oldCategory: "supervivencia", newCategory: "opcional" },
 * ]);
 */
export async function learnFromCorrectionsBatch(
  supabase: SupabaseClient,
  userId: string,
  corrections: Array<{
    concept: string;
    oldCategory: string;
    newCategory: string;
  }>
): Promise<LearningResult[]> {
  const results: LearningResult[] = [];

  apiLogger.info(
    { count: corrections.length, userId },
    "Learning from corrections batch"
  );

  // Process sequentially to avoid race conditions on upsert
  for (const correction of corrections) {
    const result = await learnFromCorrection(
      supabase,
      userId,
      correction.concept,
      correction.oldCategory,
      correction.newCategory
    );

    results.push(result);
  }

  const successCount = results.filter((r) => r.success).length;
  const rulesCreated = results.filter((r) => r.ruleCreated).length;
  const rulesUpdated = results.filter((r) => r.ruleUpdated).length;

  apiLogger.info(
    {
      total: corrections.length,
      success: successCount,
      rulesCreated,
      rulesUpdated,
      userId,
    },
    "Batch learning completed"
  );

  return results;
}

/**
 * Get learning statistics for user
 *
 * Returns stats about learned merchant rules for the user.
 * Useful for displaying "you've taught me X rules" in UI.
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @returns Learning statistics
 *
 * @example
 * const stats = await getLearningStats(supabase, userId);
 * // → { totalRules: 15, rulesByCategory: { supervivencia: 8, opcional: 5, ... } }
 */
export async function getLearningStats(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  totalRules: number;
  rulesByCategory: Record<string, number>;
  topMerchants: Array<{ merchant: string; category: string; confidence: number }>;
}> {
  try {
    const { data: rules, error } = await supabase
      .from("merchant_rules")
      .select("merchant, category, confidence")
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    const totalRules = rules?.length || 0;
    const rulesByCategory: Record<string, number> = {};
    const topMerchants = rules?.slice(0, 10) || [];

    // Count rules by category
    if (rules) {
      for (const rule of rules) {
        rulesByCategory[rule.category] =
          (rulesByCategory[rule.category] || 0) + 1;
      }
    }

    return {
      totalRules,
      rulesByCategory,
      topMerchants,
    };
  } catch (err) {
    apiLogger.error({ err, userId }, "Error getting learning stats");

    return {
      totalRules: 0,
      rulesByCategory: {},
      topMerchants: [],
    };
  }
}
