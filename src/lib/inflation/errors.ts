/**
 * Errores de dominio del cálculo histórico de inflación.
 * Independientes de Next.js/HTTP (no usar ApiError aquí, ver src/lib/api/errors.ts).
 * Se mantienen mensajes en español siguiendo la convención ya adoptada en
 * src/lib/schemas/common.ts y src/lib/api/errors.ts.
 */

export type InflationErrorCode =
  | "INVALID_AMOUNT"
  | "INVALID_PERIOD_FORMAT"
  | "PERIOD_NOT_AVAILABLE"
  | "INVALID_PERIOD_ORDER"
  | "DATASET_INTEGRITY_ERROR";

export class InflationError extends Error {
  constructor(
    public code: InflationErrorCode,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "InflationError";
  }
}

export const inflationErrors = {
  invalidAmount: (message = "La cantidad debe ser un número finito y no negativo") =>
    new InflationError("INVALID_AMOUNT", message),
  invalidPeriodFormat: (period: string) =>
    new InflationError(
      "INVALID_PERIOD_FORMAT",
      `El periodo '${period}' no tiene el formato válido YYYY-MM`,
      { period }
    ),
  periodNotAvailable: (period: string) =>
    new InflationError(
      "PERIOD_NOT_AVAILABLE",
      `No hay datos disponibles del IPC para el periodo '${period}'`,
      { period }
    ),
  invalidPeriodOrder: (startPeriod: string, endPeriod: string) =>
    new InflationError(
      "INVALID_PERIOD_ORDER",
      `El periodo inicial '${startPeriod}' es posterior al periodo final '${endPeriod}'`,
      { startPeriod, endPeriod }
    ),
  datasetIntegrityError: (message: string) =>
    new InflationError("DATASET_INTEGRITY_ERROR", message),
};
