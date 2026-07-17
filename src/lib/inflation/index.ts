export type {
  HistoricalInflationInput,
  HistoricalInflationResult,
  InflationDatasetCoverage,
} from "./types";

export {
  calculateHistoricalInflation,
  getDatasetCoverage,
  getFirstAvailablePeriod,
  getLastAvailablePeriod,
  getTotalPeriods,
  getAvailablePeriods,
  getIndexForPeriod,
} from "./historical";

export { InflationError, inflationErrors } from "./errors";
export type { InflationErrorCode } from "./errors";
