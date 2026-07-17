/**
 * Tipos de dominio del cálculo histórico de inflación.
 * Puros, sin dependencias de React/Next.js.
 */

export interface HistoricalInflationInput {
  amount: number;
  startPeriod: string; // "YYYY-MM"
  endPeriod: string; // "YYYY-MM"
}

export interface HistoricalInflationResult {
  amount: number;
  startPeriod: string;
  endPeriod: string;
  startIndex: number;
  endIndex: number;
  /** índice final / índice inicial */
  adjustmentFactor: number;
  /** adjustmentFactor - 1 (valor decimal, sin redondear) */
  cumulativeInflationRate: number;
  /** cumulativeInflationRate * 100 (valor decimal completo, sin redondear) */
  cumulativeInflationPercentage: number;
  /** amount * adjustmentFactor */
  equivalentAmountAtEnd: number;
  /** equivalentAmountAtEnd - amount */
  requiredNominalIncrease: number;
}

export interface InflationDatasetCoverage {
  firstPeriod: string;
  lastPeriod: string;
  totalPeriods: number;
  /** Lista cronológica de periodos disponibles ("YYYY-MM"), inmutable para el consumidor */
  periods: readonly string[];
}
