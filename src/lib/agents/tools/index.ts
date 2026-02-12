/**
 * Agent tools for advanced analysis
 */

// Day 1 tools
export {
  analyzeSpendingPattern,
  type AnalyzeSpendingPatternParams,
  type SpendingPatternResult,
} from "./spending-analysis";

export {
  getBudgetStatus,
  type GetBudgetStatusParams,
  type BudgetStatusResult,
  type CategoryBudgetStatus,
  type BudgetStatusLevel,
} from "./budget-status";

// Day 2 tools
export {
  detectAnomalies,
  type DetectAnomaliesParams,
  type AnomaliesResult,
  type Anomaly,
  type AnomalyReason,
  type AnomalySeverity,
} from "./anomalies";

export {
  predictMonthlySpending,
  type PredictMonthlySpendingParams,
  type MonthlyPredictionResult,
  type CategoryPrediction,
} from "./predictions";

export {
  getSpendingTrends,
  type GetSpendingTrendsParams,
  type SpendingTrendsResult,
  type TrendDataPoint,
  type ExtremePoint,
} from "./trends";

// NEW: Copilot CRUD tools (v3 - post-migration)
export {
  createTransaction,
  type CreateTransactionParams,
  type CreateTransactionResult,
} from "./create-transaction";

export {
  updateTransaction,
  type UpdateTransactionParams,
  type UpdateTransactionResult,
} from "./update-transaction";

export {
  calculateWhatIf,
  type CalculateWhatIfParams,
  type CalculateWhatIfResult,
} from "./calculate-whatif";

export {
  setBudget,
  type SetBudgetParams,
  type SetBudgetResult,
} from "./set-budget";

export {
  getCurrentCycle,
  type GetCurrentCycleParams,
  type GetCurrentCycleResult,
} from "./get-current-cycle";
