import { SupabaseClient } from "@supabase/supabase-js";
import { apiLogger } from "@/lib/logger";
import {
  learnFromCorrection,
  type LearningResult,
} from "./utils/learn-from-correction";

/**
 * Parameters for updating an existing transaction
 */
export interface UpdateTransactionParams {
  transactionId: string; // UUID of the expense to update
  type?: "expense" | "income"; // Specify which table (defaults to expense)
  amount?: number; // New amount (optional)
  concept?: string; // New concept/note (optional)
  category?: "survival" | "optional" | "culture" | "extra"; // New category (optional)
  date?: string; // New date in YYYY-MM-DD format (optional)
}

/**
 * Result of updating a transaction
 */
export interface UpdateTransactionResult {
  success: boolean;
  transactionId: string;
  updatedFields: string[];
  message: string;
  learningResult?: LearningResult; // Learning result if category was corrected (P1-1)
}

/**
 * Map English category name to Spanish (as stored in database)
 */
function getSpanishCategoryName(category: string): string {
  const mapping: Record<string, string> = {
    survival: "supervivencia",
    optional: "opcional",
    culture: "cultura",
    extra: "extra",
  };
  return mapping[category] || category;
}

/**
 * Update an existing transaction
 *
 * Allows the agent to modify transactions when user requests changes
 * (e.g., "cambia el gasto de ayer a 45€", "reclasifica el último gasto a opcional")
 */
export async function updateTransaction(
  supabase: SupabaseClient,
  userId: string,
  params: UpdateTransactionParams
): Promise<UpdateTransactionResult> {
  try {
    // Validate that at least one field is being updated
    if (
      params.amount === undefined &&
      params.concept === undefined &&
      params.category === undefined &&
      params.date === undefined
    ) {
      throw new Error(
        "Debes especificar al menos un campo a actualizar (amount, concept, category o date)"
      );
    }

    // Build update object
    const updates: Record<string, unknown> = {};
    const updatedFields: string[] = [];

    if (params.amount !== undefined) {
      if (params.amount <= 0) {
        throw new Error("El importe debe ser mayor que 0");
      }
      updates.amount = params.amount;
      updatedFields.push("importe");
    }

    if (params.concept !== undefined) {
      if (params.concept.trim().length === 0) {
        throw new Error("El concepto no puede estar vacío");
      }
      updates.note = params.concept;
      updatedFields.push("concepto");
    }

    if (params.category !== undefined) {
      updates.category = getSpanishCategoryName(params.category);
      updatedFields.push("categoría");
    }

    if (params.date !== undefined) {
      updates.date = params.date;
      updatedFields.push("fecha");
    }

    // Determine which table to update
    const tableName = params.type === "income" ? "incomes" : "expenses";

    const { data: existing, error: checkError } = await supabase
      .from(tableName)
      .select("id,user_id,amount,note,category,date")
      .eq("id", params.transactionId)
      .maybeSingle();

    if (checkError) {
      apiLogger.error(
        { error: checkError, table: tableName, transactionId: params.transactionId },
        "Error checking transaction existence"
      );
    }

    if (!existing) {
      apiLogger.warn(
        { table: tableName, transactionId: params.transactionId, userId },
        "Transaction not found in table"
      );
      throw new Error(
        `No se encontró la transacción con ID ${params.transactionId} en la tabla ${tableName}`
      );
    }

    if (existing.user_id !== userId) {
      apiLogger.error(
        {
          transactionId: params.transactionId,
          expectedUserId: userId,
          actualUserId: existing.user_id
        },
        "User ID mismatch - security violation"
      );
      throw new Error("No tienes permiso para modificar esta transacción");
    }
    // ===========================================================================

    // Update transaction
    const { data, error } = await supabase
      .from(tableName)
      .update(updates)
      .eq("id", params.transactionId)
      .eq("user_id", userId) // Ensure user owns this transaction
      .select()
      .single();

    if (error) {
      apiLogger.error({ error, params }, "Error updating transaction");
      throw error;
    }

    if (!data) {
      throw new Error(
        "No se encontró la transacción o no tienes permiso para modificarla"
      );
    }

    // ========== LEARN FROM CATEGORY CORRECTION (P1-1) ==========
    let learningResult: LearningResult | undefined;

    // If category was updated, this is a user correction - learn from it
    if (params.category !== undefined && existing.category) {
      const oldCategory = existing.category; // Spanish format from DB
      const newCategory = getSpanishCategoryName(params.category); // Spanish format
      const concept = existing.note || ""; // Transaction concept

      apiLogger.info(
        {
          transactionId: params.transactionId,
          concept,
          oldCategory,
          newCategory,
          userId,
        },
        "Category correction detected - learning from user correction"
      );

      try {
        learningResult = await learnFromCorrection(
          supabase,
          userId,
          concept,
          oldCategory,
          newCategory
        );

        if (learningResult.success && learningResult.merchant) {
          apiLogger.info(
            {
              merchant: learningResult.merchant,
              category: newCategory,
              ruleCreated: learningResult.ruleCreated,
              ruleUpdated: learningResult.ruleUpdated,
              userId,
            },
            "Successfully learned from category correction"
          );

          // ========== SAVE CORRECTION EXAMPLE (P1-2) ==========
          // Also save full example for few-shot learning
          try {
            const { error: exampleError } = await supabase.rpc(
              "save_correction_example",
              {
                p_user_id: userId,
                p_concept: concept,
                p_amount: existing.amount,
                p_date: existing.date,
                p_old_category: oldCategory,
                p_new_category: newCategory,
                p_merchant: learningResult.merchant,
                p_transaction_id: params.transactionId,
                p_confidence: 1.0, // User explicit correction
              }
            );

            if (exampleError) {
              apiLogger.warn(
                { error: exampleError, transactionId: params.transactionId },
                "Failed to save correction example - continuing"
              );
            } else {
              apiLogger.info(
                { concept, oldCategory, newCategory, userId },
                "Saved correction example for few-shot learning"
              );
            }
          } catch (exampleSaveError) {
            // Don't fail update if example save fails
            apiLogger.warn(
              { error: exampleSaveError },
              "Error saving correction example - continuing"
            );
          }
          // =====================================================
        }
      } catch (learningError) {
        // Don't fail the entire update if learning fails
        apiLogger.warn(
          {
            error: learningError,
            transactionId: params.transactionId,
            userId,
          },
          "Failed to learn from category correction - continuing with update"
        );
      }
    }
    // ============================================================

    const fieldsText = updatedFields.join(", ");
    const message = `✅ Transacción actualizada: ${fieldsText} modificado(s)`;

    apiLogger.info(
      {
        userId,
        transactionId: params.transactionId,
        updatedFields,
      },
      "Transaction updated successfully"
    );

    return {
      success: true,
      transactionId: params.transactionId,
      updatedFields,
      message,
      learningResult,
    };
  } catch (error) {
    apiLogger.error({ error, params }, "Error in updateTransaction");
    throw error;
  }
}
