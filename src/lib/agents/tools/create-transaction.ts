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
import { getOpenMonth, getOrCreateMonth } from "@/lib/months";
import { isValidSubcategory, type SubcategoryId } from "@/lib/subcategories";

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
  // Fase 2.B: segunda capa de clasificación opcional (solo aplica a gastos).
  // Debe ser uno de los identificadores del catálogo en src/lib/subcategories.ts.
  subcategory?: SubcategoryId | null;
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
  subcategory?: SubcategoryId | null; // Fase 2.B
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
 * Ciclos libres (Fase 1 / Fase 2.A): resuelve el ciclo (month_id) al que debe
 * imputarse un gasto creado por IA, con el mismo criterio que ya usa
 * `POST /api/expenses` — el gasto se imputa al ciclo actualmente ABIERTO del
 * usuario, conservando su fecha real sin alterarla nunca. Si el usuario no
 * tiene ningún ciclo todavía, se hace bootstrap con el mes natural de la
 * fecha del gasto (igual que la API REST).
 *
 * Si el ciclo resuelto está cerrado, o si la resolución falla por cualquier
 * motivo, lanza un error claro — nunca debe crearse el gasto sin `month_id`.
 */
async function resolveExpenseCycle(
  supabase: SupabaseClient,
  userId: string,
  date: string
): Promise<string> {
  const openMonth = await getOpenMonth(supabase, userId);

  if (openMonth) {
    // getOpenMonth ya filtra por status = 'open', pero se comprueba de
    // forma explícita por seguridad ante cualquier cambio futuro del helper.
    if (openMonth.status === "closed") {
      throw new Error(
        "El ciclo actual está cerrado. No se puede registrar el gasto."
      );
    }
    return openMonth.id;
  }

  // Bootstrap: el usuario no tiene ningún ciclo todavía -> se abre uno para
  // el mes natural de la fecha del gasto.
  const [yearStr, monthStr] = date.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const { row: monthRow } = await getOrCreateMonth(supabase, userId, year, month);

  if (monthRow.status === "closed") {
    throw new Error(
      `El ciclo ${yearStr}-${monthStr} está cerrado. No se puede registrar el gasto.`
    );
  }

  return monthRow.id;
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

    // ========== VALIDATE SUBCATEGORY (Fase 2.B) ==========
    // Segunda capa de clasificación, opcional. Si se proporciona, debe ser
    // uno de los identificadores del catálogo aprobado — un valor inválido
    // se rechaza explícitamente en vez de guardarse tal cual o ignorarse en
    // silencio.
    if (
      params.subcategory !== undefined &&
      params.subcategory !== null &&
      !isValidSubcategory(params.subcategory)
    ) {
      throw new Error(
        `Subcategoría inválida: "${params.subcategory}". No se ha creado la transacción.`
      );
    }
    const subcategory: SubcategoryId | null = isValidSubcategory(params.subcategory)
      ? params.subcategory
      : null;
    // =======================================================

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

    // ========== RESOLVE CYCLE (ciclos libres, Fase 2.A) ==========
    // A diferencia del comportamiento anterior, si la resolución del ciclo
    // falla o el ciclo está cerrado, se aborta la creación por completo:
    // nunca se crea un gasto sin `month_id`.
    let monthId: string | null = null;

    if (params.type === "expense") {
      monthId = await resolveExpenseCycle(supabase, userId, date);
      apiLogger.debug(
        { userId, date, monthId },
        "Cycle resolved for expense"
      );
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
      // Fase 2.B: subcategoría opcional, solo aplica a gastos.
      insertPayload.subcategory = subcategory;
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
      subcategory: params.type === "expense" ? subcategory : undefined,
    };
  } catch (error) {
    apiLogger.error({ error, params }, "Error in createTransaction");
    throw error;
  }
}
