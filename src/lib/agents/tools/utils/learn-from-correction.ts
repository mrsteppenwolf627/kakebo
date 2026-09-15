/**
 * Learning from corrections (P1-1)
 *
 * Learns merchant → category rules when users correct GPT classifications.
 * This creates a feedback loop that improves accuracy over time.
 *
 * Strategy:
 * 1. When user corrects category, extract merchant from concept
 * 2. Save user-specific rule (upsert_merchant_rule)
 * 3. User rules have confidence = 1.0 (explicit correction)
 *
 * Fase 2.G (corrección de privacidad): la contribución al voto GLOBAL de
 * `merchant_rules` (user_id IS NULL) está DESACTIVADA POR COMPLETO — falla
 * cerrado, sin excepción, incluso con `allow_collective_learning`
 * activado. Motivo: `merchant` es texto extraído del concepto que
 * introduce el propio usuario (puede contener información no minimizada,
 * no es una simple etiqueta/categoría cerrada), y las filas globales
 * históricas de `merchant_rules` no guardan qué usuario ni si tenía
 * consentimiento en el momento del voto — no hay forma de demostrar que
 * una fila global proceda solo de usuarios consintientes. Hasta que exista
 * un diseño nuevo que registre procedencia y consentimiento verificable
 * por contribución (fuera de alcance de esta tarea, requiere rediseñar el
 * esquema), NINGUNA función de este archivo escribe en una fila global de
 * `merchant_rules`. El aprendizaje PERSONAL (regla propia, `user_id =
 * userId`, aislada por RLS) no se ve afectado — sigue funcionando igual.
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

    // Fase 2.G (corrección de privacidad): el voto GLOBAL de merchant_rules
    // está desactivado por completo, sin excepción — ver el comentario de
    // cabecera del archivo. `globalVoteIncremented` se mantiene en el tipo
    // de retorno por compatibilidad, pero es SIEMPRE false: no existe
    // ningún camino en este archivo que escriba en una fila global.
    const globalVoteIncremented = false;

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
