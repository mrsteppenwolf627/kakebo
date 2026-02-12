import { SupabaseClient } from "@supabase/supabase-js";
import { apiLogger } from "@/lib/logger";

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
    };
  } catch (error) {
    apiLogger.error({ error, params }, "Error in updateTransaction");
    throw error;
  }
}
