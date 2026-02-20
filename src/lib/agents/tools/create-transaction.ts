import { SupabaseClient } from "@supabase/supabase-js";
import { apiLogger } from "@/lib/logger";
import {
  validateTransactionBeforeWrite,
  formatValidationResult,
} from "./validators/transaction-validator";
import {
  suggestCategory,
  shouldUseSuggestion,
} from "./utils/category-suggester";

/**
 * Parameters for creating a new transaction (expense or income)
 */
export interface CreateTransactionParams {
  type: "expense" | "income";
  amount: number;
  concept: string;
  category: "survival" | "optional" | "culture" | "extra";
  date?: string; // YYYY-MM-DD format, defaults to today
  notes?: string; // Optional additional notes
}

/**
 * Result of creating a transaction
 */
export interface CreateTransactionResult {
  success: boolean;
  transactionId: string;
  type: "expense" | "income";
  amount: number;
  concept: string;
  category: string;
  date: string;
  message: string;
  warnings?: string[]; // Validation warnings (if any)
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
 * Get current date in YYYY-MM-DD format
 */
function getCurrentDate(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Get category color (same as used in manual expense creation)
 */
function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    supervivencia: "#fca5a5", // Red-300
    opcional: "#93c5fd",      // Blue-300
    cultura: "#86efac",        // Green-300
    extra: "#d8b4fe",          // Purple-300
  };
  return colors[category] || "#d1d5db"; // Gray-300 fallback
}

/**
 * Get or create month record for given date
 * This ensures expenses are properly linked to months (same as manual creation)
 */
async function getOrCreateMonth(
  supabase: SupabaseClient,
  userId: string,
  date: string
): Promise<string> {
  // Extract year and month from date (YYYY-MM-DD → year, month)
  const [yearStr, monthStr] = date.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  // Check if month record exists
  const { data: existing, error: fetchError } = await supabase
    .from("months")
    .select("id,status")
    .eq("user_id", userId)
    .eq("year", year)
    .eq("month", month)
    .limit(1);

  if (fetchError) {
    throw new Error(`Error fetching month: ${fetchError.message}`);
  }

  // If exists, return its ID
  if (existing && existing.length > 0) {
    return existing[0].id;
  }

  // Create new month record
  const { data: created, error: createError } = await supabase
    .from("months")
    .insert({
      user_id: userId,
      year,
      month,
      status: "open",
    })
    .select("id")
    .single();

  if (createError) {
    throw new Error(`Error creating month: ${createError.message}`);
  }

  return created.id;
}

/**
 * Create a new transaction (expense or income)
 *
 * This tool allows the agent to create transactions on behalf of the user
 * when they request it naturally (e.g., "registra un gasto de 50€ en comida")
 */
export async function createTransaction(
  supabase: SupabaseClient,
  userId: string,
  params: CreateTransactionParams
): Promise<CreateTransactionResult> {
  try {
    // Prepare data for validation
    let dbCategory = getSpanishCategoryName(params.category);
    const date = params.date || getCurrentDate();

    // ========== P1-1: MERCHANT RULE OVERRIDE ==========
    // If there's a learned rule for this merchant, use it instead of GPT's category
    try {
      const merchantSuggestion = await suggestCategory(supabase, userId, params.concept);
      if (merchantSuggestion && shouldUseSuggestion(merchantSuggestion)) {
        if (merchantSuggestion.category !== dbCategory) {
          apiLogger.info(
            {
              concept: params.concept,
              gptCategory: dbCategory,
              learnedCategory: merchantSuggestion.category,
              merchant: merchantSuggestion.merchant,
              source: merchantSuggestion.source,
              userId,
            },
            "P1-1: Overriding GPT category with learned merchant rule"
          );
          dbCategory = merchantSuggestion.category;
        }
      }
    } catch (err) {
      // Non-blocking: if merchant lookup fails, use GPT's category
      apiLogger.warn({ err, concept: params.concept }, "P1-1: Merchant rule lookup failed - using GPT category");
    }
    // ==================================================

    // ========== VALIDATE TRANSACTION BEFORE WRITE (P0-2) ==========
    const validationResult = await validateTransactionBeforeWrite(supabase, {
      type: params.type,
      amount: params.amount,
      concept: params.concept,
      category: dbCategory,
      date,
      userId,
    });

    // If validation failed (errors present), throw error
    if (!validationResult.valid) {
      const errorMessage = formatValidationResult(validationResult);
      apiLogger.warn(
        {
          userId,
          validationErrors: validationResult.errors,
          validationWarnings: validationResult.warnings,
        },
        "Transaction validation failed - blocking creation"
      );
      throw new Error(errorMessage);
    }

    // Log warnings (but continue with creation)
    if (validationResult.warnings.length > 0) {
      apiLogger.info(
        {
          userId,
          validationWarnings: validationResult.warnings,
        },
        "Transaction validation passed with warnings"
      );
    }
    // ==============================================================

    // Determine which table to insert into
    const tableName = params.type === "expense" ? "expenses" : "incomes";

    // ========== GET/CREATE MONTH RECORD ==========
    // This ensures expenses are linked to months (same as manual creation)
    // so they appear in the dashboard properly
    let monthId: string | null = null;

    if (params.type === "expense") {
      try {
        monthId = await getOrCreateMonth(supabase, userId, date);
        apiLogger.debug(
          { userId, date, monthId },
          "Month record obtained for expense"
        );
      } catch (monthError) {
        apiLogger.warn(
          { error: monthError, userId, date },
          "Failed to get/create month record - proceeding without month_id"
        );
        // Continue without month_id rather than failing the entire operation
        // The expense will still be created, just won't show in month-filtered views
      }
    }
    // ===========================================

    // Build insert payload
    const insertPayload: Record<string, unknown> = {
      user_id: userId,
      amount: params.amount,
      note: params.concept,
      category: dbCategory,
      date: date,
    };

    // Add month_id and color for expenses (required for dashboard display)
    if (params.type === "expense" && monthId) {
      insertPayload.month_id = monthId;
      insertPayload.color = getCategoryColor(dbCategory);
    }

    const { data, error } = await supabase
      .from(tableName)
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      apiLogger.error({ error, params }, `Error creating ${params.type}`);
      throw error;
    }

    const message = params.type === "expense"
      ? `✅ Gasto de ${params.amount}€ registrado en ${params.category}: "${params.concept}"`
      : `✅ Ingreso de ${params.amount}€ registrado: "${params.concept}"`;

    apiLogger.info(
      {
        userId,
        transactionId: data.id,
        type: params.type,
        amount: params.amount,
        category: params.category,
      },
      `Transaction created successfully`
    );

    return {
      success: true,
      transactionId: data.id,
      type: params.type,
      amount: params.amount,
      concept: params.concept,
      category: params.category,
      date: date,
      message,
      warnings: validationResult.warnings.length > 0 ? validationResult.warnings : undefined,
    };
  } catch (error) {
    apiLogger.error({ error, params }, "Error in createTransaction");
    throw error;
  }
}
