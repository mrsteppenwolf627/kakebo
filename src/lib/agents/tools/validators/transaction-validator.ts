/**
 * Transaction validation (P0-2)
 *
 * Validates transactions before writing to database to prevent:
 * - Duplicates (same concept + amount + date in last 24h)
 * - Suspicious amounts (> €1000)
 * - Invalid dates (future > 7 days)
 * - Ambiguous concepts ("compra", "gasto", "pago")
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { apiLogger } from "@/lib/logger";

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean; // true if no blocking errors
  errors: string[]; // Blocking errors (prevent creation)
  warnings: string[]; // Non-blocking warnings (inform user but allow creation)
}

/**
 * Transaction parameters to validate
 */
export interface TransactionToValidate {
  type: "expense" | "income";
  amount: number;
  concept: string;
  category: string;
  date: string; // YYYY-MM-DD
  userId: string;
}

/**
 * Configuration for validation rules
 */
const VALIDATION_CONFIG = {
  // Duplicate detection window (24 hours)
  duplicateWindowMs: 24 * 60 * 60 * 1000,

  // Amount thresholds
  suspiciousAmountThreshold: 1000, // €1000+
  maxReasonableAmount: 10000, // €10000+ (hard limit)

  // Date limits
  maxFutureDays: 7, // Max 7 days in future
  maxPastDays: 365, // Max 1 year in past (soft warning)

  // Ambiguous concept keywords
  ambiguousKeywords: [
    "compra",
    "gasto",
    "pago",
    "cosa",
    "varios",
    "misc",
    "other",
  ],

  // Minimum concept length
  minConceptLength: 3,
};

/**
 * Validate transaction before writing to database
 *
 * @param supabase - Supabase client
 * @param transaction - Transaction to validate
 * @returns Validation result with errors and warnings
 */
export async function validateTransactionBeforeWrite(
  supabase: SupabaseClient,
  transaction: TransactionToValidate
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  apiLogger.debug(
    {
      userId: transaction.userId,
      type: transaction.type,
      amount: transaction.amount,
      concept: transaction.concept,
    },
    "Validating transaction before write"
  );

  // ========== 1. VALIDATE AMOUNT ==========
  const amountValidation = validateAmount(transaction.amount);
  errors.push(...amountValidation.errors);
  warnings.push(...amountValidation.warnings);

  // ========== 2. VALIDATE DATE ==========
  const dateValidation = validateDate(transaction.date);
  errors.push(...dateValidation.errors);
  warnings.push(...dateValidation.warnings);

  // ========== 3. VALIDATE CONCEPT ==========
  const conceptValidation = validateConcept(transaction.concept);
  errors.push(...conceptValidation.errors);
  warnings.push(...conceptValidation.warnings);

  // ========== 4. DETECT DUPLICATES ==========
  // Only check duplicates if no blocking errors so far
  if (errors.length === 0) {
    const duplicateValidation = await detectDuplicates(supabase, transaction);
    warnings.push(...duplicateValidation.warnings);
  }

  const valid = errors.length === 0;

  if (!valid) {
    apiLogger.warn(
      {
        userId: transaction.userId,
        errors,
        warnings,
      },
      "Transaction validation failed"
    );
  } else if (warnings.length > 0) {
    apiLogger.info(
      {
        userId: transaction.userId,
        warnings,
      },
      "Transaction validation passed with warnings"
    );
  } else {
    apiLogger.debug(
      {
        userId: transaction.userId,
      },
      "Transaction validation passed"
    );
  }

  return { valid, errors, warnings };
}

/**
 * Validate amount
 */
function validateAmount(amount: number): {
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Must be positive
  if (amount <= 0) {
    errors.push(`El importe debe ser mayor que 0 (recibido: ${amount}€)`);
  }

  // Hard limit: > €10000 is suspicious (likely input error)
  if (amount > VALIDATION_CONFIG.maxReasonableAmount) {
    errors.push(
      `El importe ${amount}€ es extremadamente alto. Máximo razonable: ${VALIDATION_CONFIG.maxReasonableAmount}€. ¿Es correcto?`
    );
  }
  // Soft warning: > €1000 is unusual
  else if (amount > VALIDATION_CONFIG.suspiciousAmountThreshold) {
    warnings.push(
      `Importe alto: ${amount}€. Verifica que sea correcto antes de confirmar.`
    );
  }

  // Warning for very precise amounts (likely not manual entry)
  if (amount % 1 !== 0 && amount.toString().split(".")[1]?.length > 2) {
    warnings.push(
      `Importe muy preciso: ${amount}€. Normalmente los gastos son cantidades redondas.`
    );
  }

  return { errors, warnings };
}

/**
 * Validate date
 */
function validateDate(dateStr: string): {
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Parse date
  const date = new Date(dateStr);
  const now = new Date();

  // Check if valid date
  if (isNaN(date.getTime())) {
    errors.push(`Fecha inválida: ${dateStr}`);
    return { errors, warnings };
  }

  // Check future dates
  const daysDiff = Math.ceil((date.getTime() - now.getTime()) / 86400000);

  if (daysDiff > VALIDATION_CONFIG.maxFutureDays) {
    errors.push(
      `La fecha ${dateStr} está demasiado en el futuro (máximo ${VALIDATION_CONFIG.maxFutureDays} días)`
    );
  } else if (daysDiff > 0) {
    warnings.push(
      `Fecha futura: ${dateStr}. Verifica que sea correcto (gastos normalmente son del pasado).`
    );
  }

  // Check past dates (soft warning)
  const daysPast = Math.abs(daysDiff);
  if (daysPast > VALIDATION_CONFIG.maxPastDays) {
    warnings.push(
      `Fecha muy antigua: ${dateStr} (hace ${daysPast} días). ¿Es correcto?`
    );
  }

  return { errors, warnings };
}

/**
 * Validate concept
 */
function validateConcept(concept: string): {
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check minimum length
  if (concept.trim().length < VALIDATION_CONFIG.minConceptLength) {
    errors.push(
      `El concepto debe tener al menos ${VALIDATION_CONFIG.minConceptLength} caracteres (recibido: "${concept}")`
    );
  }

  // Check for ambiguous keywords
  const conceptLower = concept.toLowerCase().trim();

  // Exact match with ambiguous keywords
  if (VALIDATION_CONFIG.ambiguousKeywords.includes(conceptLower)) {
    warnings.push(
      `El concepto "${concept}" es muy genérico. ¿Podrías ser más específico? Ejemplo: "Compra en Mercadona" en lugar de solo "compra".`
    );
  }

  // Only whitespace
  if (concept.trim().length === 0) {
    errors.push("El concepto no puede estar vacío");
  }

  // Only numbers (suspicious)
  if (/^\d+$/.test(concept.trim())) {
    warnings.push(
      `El concepto "${concept}" parece ser solo un número. ¿Falta descripción?`
    );
  }

  return { errors, warnings };
}

/**
 * Detect duplicate transactions
 */
async function detectDuplicates(
  supabase: SupabaseClient,
  transaction: TransactionToValidate
): Promise<{ warnings: string[] }> {
  const warnings: string[] = [];

  try {
    // Calculate time window (last 24 hours)
    const windowStart = new Date(
      Date.now() - VALIDATION_CONFIG.duplicateWindowMs
    ).toISOString();

    // Query for potential duplicates
    const tableName = transaction.type === "expense" ? "expenses" : "incomes";

    const { data: potentialDuplicates, error } = await supabase
      .from(tableName)
      .select("id, note, amount, date, created_at")
      .eq("user_id", transaction.userId)
      .eq("amount", transaction.amount)
      .gte("created_at", windowStart)
      .limit(5); // Limit to avoid performance issues

    if (error) {
      apiLogger.warn(
        { error, userId: transaction.userId },
        "Failed to check for duplicates"
      );
      // Don't block creation on duplicate check failure
      return { warnings };
    }

    if (!potentialDuplicates || potentialDuplicates.length === 0) {
      return { warnings };
    }

    // Check for exact duplicates (same concept + amount + similar date)
    const exactDuplicates = potentialDuplicates.filter((dup) => {
      const conceptMatch =
        dup.note?.toLowerCase().trim() ===
        transaction.concept.toLowerCase().trim();
      const dateMatch = dup.date === transaction.date;

      return conceptMatch && dateMatch;
    });

    if (exactDuplicates.length > 0) {
      const duplicate = exactDuplicates[0];
      const createdAt = new Date(duplicate.created_at);
      const minutesAgo = Math.floor((Date.now() - createdAt.getTime()) / 60000);

      warnings.push(
        `Ya tienes un ${transaction.type === "expense" ? "gasto" : "ingreso"} idéntico: "${duplicate.note}" (${duplicate.amount}€) el ${duplicate.date}, creado hace ${minutesAgo} minutos. ¿Es un duplicado?`
      );
    }
    // Check for similar amounts (within 10% and same date)
    else {
      const similarDuplicates = potentialDuplicates.filter((dup) => {
        const amountDiff = Math.abs(dup.amount - transaction.amount);
        const amountDiffPercent = amountDiff / transaction.amount;
        const dateMatch = dup.date === transaction.date;

        return amountDiffPercent < 0.1 && dateMatch; // Within 10% and same date
      });

      if (similarDuplicates.length > 0) {
        const similar = similarDuplicates[0];
        warnings.push(
          `Ya tienes un ${transaction.type === "expense" ? "gasto" : "ingreso"} similar: "${similar.note}" (${similar.amount}€) el ${similar.date}. ¿Es diferente del actual?`
        );
      }
    }

    return { warnings };
  } catch (err) {
    apiLogger.error(
      { err, userId: transaction.userId },
      "Error detecting duplicates"
    );
    // Don't block creation on error
    return { warnings };
  }
}

/**
 * Format validation result for user display
 *
 * Converts errors and warnings into a user-friendly message
 */
export function formatValidationResult(result: ValidationResult): string {
  const parts: string[] = [];

  if (result.errors.length > 0) {
    parts.push("❌ Errores:");
    parts.push(...result.errors.map((e) => `  - ${e}`));
  }

  if (result.warnings.length > 0) {
    parts.push("⚠️ Advertencias:");
    parts.push(...result.warnings.map((w) => `  - ${w}`));
  }

  return parts.join("\n");
}
