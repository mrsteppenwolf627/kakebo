/**
 * Example retrieval for few-shot learning (P1-2)
 *
 * Retrieves relevant correction examples to improve GPT classification accuracy.
 * When users have corrected similar transactions before, show those examples
 * in the GPT prompt to guide better classification.
 *
 * Strategy:
 * 1. Get user-specific examples (high priority)
 * 2. Supplement with global examples if needed
 * 3. Filter by category, confidence, and relevance
 * 4. Track usage to identify most helpful examples
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { apiLogger } from "@/lib/logger";

/**
 * Correction example structure
 */
export interface CorrectionExample {
  concept: string; // "mercadona compra semanal"
  oldCategory: string; // "opcional" (what GPT got wrong)
  newCategory: string; // "supervivencia" (correct answer)
  merchant: string | null; // "mercadona"
  confidence: number; // 1.0 = high quality example
}

/**
 * Example retrieval options
 */
export interface RetrievalOptions {
  limit?: number; // Max examples to return (default: 3)
  minConfidence?: number; // Min confidence threshold (default: 0.8)
  preferRecent?: boolean; // Prioritize recent examples (default: false)
  categoryFilter?: string; // Filter by target category (default: none)
}

/**
 * Get relevant examples for few-shot prompting
 *
 * Retrieves correction examples that can help GPT classify transactions more accurately.
 * Prioritizes user-specific examples over global examples.
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param options - Retrieval options
 * @returns Array of correction examples
 *
 * @example
 * const examples = await getRelevantExamples(supabase, userId, {
 *   limit: 3,
 *   categoryFilter: "supervivencia",
 * });
 *
 * // Use in GPT prompt:
 * // "Here are similar transactions you've corrected before:
 * //  - 'mercadona compra' → survival (was: optional)
 * //  - 'lidl productos' → survival (was: optional)"
 */
export async function getRelevantExamples(
  supabase: SupabaseClient,
  userId: string,
  options: RetrievalOptions = {}
): Promise<CorrectionExample[]> {
  const {
    limit = 3,
    minConfidence = 0.8,
    preferRecent = false,
    categoryFilter,
  } = options;

  try {
    // If category filter provided, use RPC function for optimized query
    if (categoryFilter) {
      const { data, error } = await supabase.rpc("get_relevant_examples", {
        p_user_id: userId,
        p_category: categoryFilter,
        p_limit: limit,
      });

      if (error) {
        apiLogger.error(
          { error, userId, categoryFilter },
          "Error getting relevant examples via RPC"
        );
        return [];
      }

      if (!data || data.length === 0) {
        apiLogger.debug(
          { userId, categoryFilter },
          "No relevant examples found"
        );
        return [];
      }

      const examples: CorrectionExample[] = data.map((row: any) => ({
        concept: row.concept,
        oldCategory: row.old_category,
        newCategory: row.new_category,
        merchant: row.merchant,
        confidence: row.confidence,
      }));

      apiLogger.info(
        { userId, categoryFilter, count: examples.length },
        "Retrieved relevant examples via RPC"
      );

      return examples;
    }

    // Otherwise, use direct query (more flexible)
    let query = supabase
      .from("correction_examples")
      .select("concept, old_category, new_category, merchant, confidence")
      .or(`user_id.eq.${userId},user_id.is.null`) // User-specific OR global
      .gte("confidence", minConfidence);

    if (preferRecent) {
      query = query.order("created_at", { ascending: false });
    } else {
      query = query.order("confidence", { ascending: false });
    }

    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      apiLogger.error({ error, userId }, "Error getting relevant examples");
      return [];
    }

    if (!data || data.length === 0) {
      apiLogger.debug({ userId }, "No relevant examples found");
      return [];
    }

    const examples: CorrectionExample[] = data.map((row) => ({
      concept: row.concept,
      oldCategory: row.old_category,
      newCategory: row.new_category,
      merchant: row.merchant,
      confidence: row.confidence,
    }));

    apiLogger.info(
      { userId, count: examples.length },
      "Retrieved relevant examples"
    );

    return examples;
  } catch (err) {
    apiLogger.error({ err, userId }, "Error in getRelevantExamples");
    return [];
  }
}

/**
 * Format examples for GPT prompt
 *
 * Converts correction examples into a human-readable format for few-shot prompting.
 *
 * @param examples - Correction examples
 * @param language - Language for formatting (default: "es")
 * @returns Formatted string for GPT prompt
 *
 * @example
 * const formatted = formatExamplesForPrompt(examples);
 * // → "Aquí hay transacciones similares que has corregido antes:
 * //    - 'mercadona compra semanal' → supervivencia (antes: opcional)
 * //    - 'netflix suscripción' → opcional (antes: supervivencia)"
 */
export function formatExamplesForPrompt(
  examples: CorrectionExample[],
  language: "es" | "en" = "es"
): string {
  if (examples.length === 0) {
    return "";
  }

  const header =
    language === "es"
      ? "Aquí hay transacciones similares que has corregido antes:"
      : "Here are similar transactions you've corrected before:";

  const formattedExamples = examples.map((ex) => {
    const before = language === "es" ? "antes" : "was";
    return `  - "${ex.concept}" → ${ex.newCategory} (${before}: ${ex.oldCategory})`;
  });

  return [header, ...formattedExamples].join("\n");
}

/**
 * Get examples similar to a specific concept
 *
 * Finds correction examples similar to the given concept.
 * Uses simple keyword matching (can be enhanced with embeddings later).
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param concept - Transaction concept to match
 * @param limit - Max examples to return
 * @returns Array of similar correction examples
 *
 * @example
 * const similar = await getSimilarExamples(
 *   supabase,
 *   userId,
 *   "Mercadona compra",
 *   3
 * );
 * // Returns examples with "mercadona" in the concept
 */
export async function getSimilarExamples(
  supabase: SupabaseClient,
  userId: string,
  concept: string,
  limit: number = 3
): Promise<CorrectionExample[]> {
  try {
    // Normalize concept for matching
    const normalized = concept.toLowerCase().trim();

    // Extract keywords (words >= 4 chars)
    const keywords = normalized.split(/\s+/).filter((w) => w.length >= 4);

    if (keywords.length === 0) {
      apiLogger.debug({ concept }, "No keywords extracted for similarity");
      return [];
    }

    // Build query to match any keyword
    const keywordPattern = keywords.join("|");

    const { data, error } = await supabase
      .from("correction_examples")
      .select("concept, old_category, new_category, merchant, confidence")
      .or(`user_id.eq.${userId},user_id.is.null`)
      .or(
        keywords.map((kw) => `concept.ilike.%${kw}%`).join(",")
      )
      .gte("confidence", 0.8)
      .order("confidence", { ascending: false })
      .limit(limit);

    if (error) {
      apiLogger.error(
        { error, userId, concept },
        "Error getting similar examples"
      );
      return [];
    }

    if (!data || data.length === 0) {
      apiLogger.debug({ userId, concept }, "No similar examples found");
      return [];
    }

    const examples: CorrectionExample[] = data.map((row) => ({
      concept: row.concept,
      oldCategory: row.old_category,
      newCategory: row.new_category,
      merchant: row.merchant,
      confidence: row.confidence,
    }));

    apiLogger.info(
      { userId, concept, count: examples.length },
      "Retrieved similar examples"
    );

    return examples;
  } catch (err) {
    apiLogger.error({ err, userId, concept }, "Error in getSimilarExamples");
    return [];
  }
}

/**
 * Track example usage
 *
 * Increments usage counter when an example is used in a GPT prompt.
 * Helps identify most useful examples over time.
 *
 * @param supabase - Supabase client
 * @param exampleIds - Array of example IDs that were used
 * @returns Number of examples updated
 *
 * @example
 * // After using examples in GPT prompt
 * await trackExampleUsage(supabase, ["uuid1", "uuid2"]);
 */
export async function trackExampleUsage(
  supabase: SupabaseClient,
  exampleIds: string[]
): Promise<number> {
  if (exampleIds.length === 0) {
    return 0;
  }

  try {
    let updated = 0;

    // Increment usage for each example
    for (const exampleId of exampleIds) {
      const { error } = await supabase.rpc("increment_example_usage", {
        p_example_id: exampleId,
      });

      if (error) {
        apiLogger.warn(
          { error, exampleId },
          "Error incrementing example usage"
        );
      } else {
        updated++;
      }
    }

    if (updated > 0) {
      apiLogger.info(
        { count: updated, total: exampleIds.length },
        "Tracked example usage"
      );
    }

    return updated;
  } catch (err) {
    apiLogger.error({ err, exampleIds }, "Error in trackExampleUsage");
    return 0;
  }
}

/**
 * Get example statistics for user
 *
 * Returns stats about saved correction examples.
 * Useful for displaying learning progress in UI.
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @returns Example statistics
 *
 * @example
 * const stats = await getExampleStats(supabase, userId);
 * // → {
 * //   totalExamples: 25,
 * //   examplesByCategory: { supervivencia: 10, opcional: 12, cultura: 3 },
 * //   mostCorrected: "opcional",
 * //   correctionCount: 12
 * // }
 */
export async function getExampleStats(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  totalExamples: number;
  examplesByCategory: Record<string, number>;
  mostCorrected: string | null;
  correctionCount: number;
}> {
  try {
    const { data, error } = await supabase.rpc("get_example_stats", {
      p_user_id: userId,
    });

    if (error) {
      apiLogger.error({ error, userId }, "Error getting example stats");
      return {
        totalExamples: 0,
        examplesByCategory: {},
        mostCorrected: null,
        correctionCount: 0,
      };
    }

    if (!data || data.length === 0) {
      return {
        totalExamples: 0,
        examplesByCategory: {},
        mostCorrected: null,
        correctionCount: 0,
      };
    }

    const stats = data[0];

    return {
      totalExamples: stats.total_examples || 0,
      examplesByCategory: stats.examples_by_category || {},
      mostCorrected: stats.most_corrected || null,
      correctionCount: stats.correction_count || 0,
    };
  } catch (err) {
    apiLogger.error({ err, userId }, "Error in getExampleStats");
    return {
      totalExamples: 0,
      examplesByCategory: {},
      mostCorrected: null,
      correctionCount: 0,
    };
  }
}
