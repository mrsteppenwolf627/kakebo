/**
 * Tool Output Validator
 *
 * Validates tool outputs before passing to LLM to prevent:
 * - Numerical inconsistencies
 * - Missing critical data
 * - Invalid ranges
 * - Contradictory results
 *
 * VERSION: 1.0
 * Created: 2026-02-09
 */

import { apiLogger } from "@/lib/logger";

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedData?: unknown;
}

/**
 * Validate spending pattern analysis output
 */
export function validateSpendingPattern(data: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Required fields present
  if (typeof data.totalAmount !== "number") {
    errors.push("Missing or invalid totalAmount");
  }

  if (typeof data.averagePerPeriod !== "number") {
    errors.push("Missing or invalid averagePerPeriod");
  }

  // 2. Numerical consistency
  if (data.totalAmount < 0) {
    errors.push("totalAmount cannot be negative");
  }

  if (data.averagePerPeriod < 0) {
    errors.push("averagePerPeriod cannot be negative");
  }

  // 3. Logical consistency
  if (
    data.topExpenses &&
    Array.isArray(data.topExpenses) &&
    data.topExpenses.length > 0
  ) {
    const topExpensesTotal = data.topExpenses.reduce(
      (sum: number, exp: any) => sum + (exp.amount || 0),
      0
    );

    // Top expenses shouldn't exceed total (with 5% tolerance for rounding)
    if (topExpensesTotal > data.totalAmount * 1.05) {
      errors.push(
        `Top expenses total (${topExpensesTotal.toFixed(
          2
        )}) exceeds totalAmount (${data.totalAmount.toFixed(2)})`
      );
    }
  }

  // 4. Data availability warnings
  if (
    data.totalAmount === 0 &&
    (!data.insights || data.insights.length === 0)
  ) {
    warnings.push(
      "No spending data available - ensure LLM acknowledges this explicitly"
    );
  }

  // 5. Trend validation
  if (
    data.trend &&
    !["increasing", "decreasing", "stable"].includes(data.trend)
  ) {
    errors.push(`Invalid trend value: ${data.trend}`);
  }

  if (data.trendPercentage && typeof data.trendPercentage === "number") {
    if (data.trendPercentage < 0 || data.trendPercentage > 1000) {
      warnings.push(
        `Unusual trend percentage: ${data.trendPercentage}% - verify calculation`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    sanitizedData: data,
  };
}

/**
 * Validate budget status output
 */
export function validateBudgetStatus(data: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Required fields
  if (typeof data.totalBudget !== "number") {
    errors.push("Missing or invalid totalBudget");
  }

  if (typeof data.totalSpent !== "number") {
    errors.push("Missing or invalid totalSpent");
  }

  // 2. Numerical consistency
  if (data.totalBudget < 0) {
    errors.push("totalBudget cannot be negative");
  }

  if (data.totalSpent < 0) {
    errors.push("totalSpent cannot be negative");
  }

  // 3. Category consistency
  if (data.categories && Array.isArray(data.categories)) {
    const categoriesTotal = data.categories.reduce(
      (sum: number, cat: any) => sum + (cat.spent || 0),
      0
    );

    // Categories should sum to total (5% tolerance)
    const discrepancy = Math.abs(categoriesTotal - data.totalSpent);
    const tolerance = data.totalSpent * 0.05;

    if (discrepancy > tolerance && data.totalSpent > 0) {
      errors.push(
        `Categories spent (${categoriesTotal.toFixed(
          2
        )}) doesn't match totalSpent (${data.totalSpent.toFixed(
          2
        )}) - discrepancy: ${discrepancy.toFixed(2)}`
      );
    }

    // Validate each category
    for (const category of data.categories) {
      if (category.percentage < 0 || category.percentage > 500) {
        warnings.push(
          `Unusual percentage for ${category.category}: ${category.percentage}%`
        );
      }

      if (category.spent > category.budget * 3 && category.budget > 0) {
        warnings.push(
          `${
            category.category
          } spent (${category.spent.toFixed(
            2
          )}) is >3x budget (${category.budget.toFixed(2)})`
        );
      }
    }
  }

  // 4. Status validation
  if (
    data.overallStatus &&
    !["safe", "warning", "exceeded"].includes(data.overallStatus)
  ) {
    errors.push(`Invalid status: ${data.overallStatus}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    sanitizedData: data,
  };
}

/**
 * Validate anomalies detection output
 */
export function validateAnomalies(data: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Required structure
  if (!Array.isArray(data.anomalies)) {
    errors.push("anomalies must be an array");
  }

  // 2. Validate each anomaly
  if (data.anomalies && Array.isArray(data.anomalies)) {
    for (const anomaly of data.anomalies) {
      if (typeof anomaly.amount !== "number" || anomaly.amount <= 0) {
        errors.push(`Invalid anomaly amount: ${anomaly.amount}`);
      }

      if (!["low", "medium", "high"].includes(anomaly.severity)) {
        errors.push(`Invalid severity: ${anomaly.severity}`);
      }

      if (
        anomaly.deviationPercentage &&
        (anomaly.deviationPercentage < 0 ||
          anomaly.deviationPercentage > 10000)
      ) {
        warnings.push(
          `Extreme deviation percentage: ${anomaly.deviationPercentage}%`
        );
      }
    }

    // 3. Too many anomalies?
    if (data.anomalies.length > 20) {
      warnings.push(
        `High anomaly count (${data.anomalies.length}) - may indicate detection issue or very abnormal spending pattern`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    sanitizedData: data,
  };
}

/**
 * Validate prediction output
 */
export function validatePrediction(data: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Required fields
  if (
    typeof data.predictedTotal !== "number" &&
    typeof data.projectedSpending !== "number" &&
    typeof data.projectedTotal !== "number"
  ) {
    errors.push("Missing predicted/projected spending amount");
  }

  const predictedAmount =
    data.predictedTotal || data.projectedSpending || data.projectedTotal || 0;

  // 2. Numerical consistency
  if (predictedAmount < 0) {
    errors.push("Predicted amount cannot be negative");
  }

  // 3. Confidence level validation
  if (
    data.confidence &&
    !["low", "medium", "high"].includes(data.confidence)
  ) {
    warnings.push(`Invalid confidence level: ${data.confidence}`);
  }

  // 4. Unreasonable predictions
  if (predictedAmount > 1000000) {
    warnings.push(
      `Very high predicted amount (${predictedAmount}) - verify calculation`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    sanitizedData: data,
  };
}

/**
 * Validate trends output
 */
export function validateTrends(data: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Required structure
  if (!Array.isArray(data.dataPoints) && !Array.isArray(data.trends)) {
    errors.push("Missing data points or trends array");
  }

  // 2. Trend direction validation
  if (
    data.trendDirection &&
    !["increasing", "decreasing", "stable"].includes(data.trendDirection)
  ) {
    errors.push(`Invalid trend direction: ${data.trendDirection}`);
  }

  // 3. Check for empty data
  const dataArray = data.dataPoints || data.trends || [];
  if (dataArray.length === 0) {
    warnings.push("Empty trends data - ensure LLM acknowledges insufficient historical data");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    sanitizedData: data,
  };
}

/**
 * Master validator - routes to specific validators
 */
export function validateToolOutput(
  toolName: string,
  data: any
): ValidationResult {
  apiLogger.debug({ toolName }, "Validating tool output");

  let result: ValidationResult;

  switch (toolName) {
    case "analyzeSpendingPattern":
      result = validateSpendingPattern(data);
      break;

    case "getBudgetStatus":
      result = validateBudgetStatus(data);
      break;

    case "detectAnomalies":
      result = validateAnomalies(data);
      break;

    case "predictMonthlySpending":
      result = validatePrediction(data);
      break;

    case "getSpendingTrends":
      result = validateTrends(data);
      break;

    default:
      // Unknown tool - allow by default but log
      apiLogger.warn({ toolName }, "No validator defined for tool");
      result = { valid: true, errors: [], warnings: [] };
  }

  // Log validation results
  if (!result.valid) {
    apiLogger.error(
      {
        toolName,
        errors: result.errors,
        data,
      },
      "Tool output validation FAILED"
    );
  }

  if (result.warnings.length > 0) {
    apiLogger.warn(
      {
        toolName,
        warnings: result.warnings,
      },
      "Tool output validation warnings"
    );
  }

  return result;
}

/**
 * Enhance tool result with validation metadata
 *
 * Adds validation info to tool result so LLM knows about data quality issues
 */
export function enhanceToolResult(
  toolName: string,
  result: any,
  validation: ValidationResult
): any {
  // If validation failed, return error structure
  if (!validation.valid) {
    return {
      _error: true,
      _errorType: "validation",
      _userMessage: `Los datos de ${toolName} no pasaron la validación. Esto puede indicar un problema técnico.`,
      _technicalDetails: validation.errors.join("; "),
      _instruction:
        "CRITICAL: Inform user about validation failure. DO NOT use this data.",
    };
  }

  // If warnings present, add metadata
  if (validation.warnings.length > 0) {
    return {
      ...result,
      _metadata: {
        dataQuality: "partial",
        warnings: validation.warnings,
        note: "LLM should acknowledge data limitations in response",
      },
    };
  }

  // No issues
  return result;
}
