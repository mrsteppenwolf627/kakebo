/**
 * Lógica de dominio pura para el cálculo de inflación histórica acumulada
 * a partir del dataset local oficial del IPC (src/lib/inflation/data/ipc-nacional-es.json).
 *
 * Independiente de React/Next.js, sin efectos secundarios, sin red, ejecutable en Node.js.
 * Ver docs/adr/ADR-CALCULADORA-INFLACION-DATOS-HISTORICOS-01.md para el contexto de la fuente de datos.
 */

import rawDataset from "./data/ipc-nacional-es.json";
import { inflationErrors } from "./errors";
import type { HistoricalInflationInput, HistoricalInflationResult, InflationDatasetCoverage } from "./types";

const PERIOD_FORMAT = /^\d{4}-(0[1-9]|1[0-2])$/;

interface RawIpcRecord {
  period: string;
  year: number;
  month: number;
  index: number;
}

interface RawIpcDataset {
  metadata: {
    coverageStart: string;
    coverageEnd: string;
    recordCount: number;
  };
  data: RawIpcRecord[];
}

/**
 * Valida la integridad del dataset una única vez al cargar el módulo, evitando
 * repetir comprobaciones costosas en cada llamada de cálculo.
 */
function buildValidatedIndex(dataset: RawIpcDataset): {
  indexByPeriod: ReadonlyMap<string, number>;
  periods: readonly string[];
} {
  const { metadata, data } = dataset;

  if (!metadata || !Array.isArray(data)) {
    throw inflationErrors.datasetIntegrityError(
      "El dataset del IPC no tiene la estructura esperada (faltan metadata o data)"
    );
  }

  if (metadata.recordCount !== data.length) {
    throw inflationErrors.datasetIntegrityError(
      `recordCount declarado (${metadata.recordCount}) no coincide con la longitud real del dataset (${data.length})`
    );
  }

  const indexByPeriod = new Map<string, number>();
  let previousPeriod: string | null = null;

  for (const record of data) {
    if (
      typeof record.period !== "string" ||
      !PERIOD_FORMAT.test(record.period) ||
      !Number.isFinite(record.index) ||
      record.index <= 0
    ) {
      throw inflationErrors.datasetIntegrityError(
        `Registro inválido en el dataset del IPC: ${JSON.stringify(record)}`
      );
    }

    if (indexByPeriod.has(record.period)) {
      throw inflationErrors.datasetIntegrityError(
        `Periodo duplicado en el dataset del IPC: ${record.period}`
      );
    }

    if (previousPeriod !== null && record.period <= previousPeriod) {
      throw inflationErrors.datasetIntegrityError(
        `El dataset del IPC no está ordenado cronológicamente cerca de '${record.period}'`
      );
    }

    indexByPeriod.set(record.period, record.index);
    previousPeriod = record.period;
  }

  const periods = Object.freeze(Array.from(indexByPeriod.keys()));

  if (periods.length === 0) {
    throw inflationErrors.datasetIntegrityError("El dataset del IPC está vacío");
  }

  const firstPeriod = periods[0];
  const lastPeriod = periods[periods.length - 1];

  if (firstPeriod !== metadata.coverageStart || lastPeriod !== metadata.coverageEnd) {
    throw inflationErrors.datasetIntegrityError(
      `La cobertura declarada (${metadata.coverageStart}–${metadata.coverageEnd}) no coincide con los datos reales (${firstPeriod}–${lastPeriod})`
    );
  }

  return { indexByPeriod, periods };
}

const { indexByPeriod, periods } = buildValidatedIndex(rawDataset as RawIpcDataset);

/** Cobertura disponible del dataset local del IPC (primer/último periodo, total, lista cronológica). */
export function getDatasetCoverage(): InflationDatasetCoverage {
  return {
    firstPeriod: periods[0],
    lastPeriod: periods[periods.length - 1],
    totalPeriods: periods.length,
    periods,
  };
}

/** Primer periodo disponible ("YYYY-MM"). */
export function getFirstAvailablePeriod(): string {
  return periods[0];
}

/** Último periodo disponible ("YYYY-MM"). */
export function getLastAvailablePeriod(): string {
  return periods[periods.length - 1];
}

/** Número total de periodos mensuales disponibles en el dataset. */
export function getTotalPeriods(): number {
  return periods.length;
}

/** Lista cronológica de periodos disponibles ("YYYY-MM"), de solo lectura. */
export function getAvailablePeriods(): readonly string[] {
  return periods;
}

/**
 * Índice del IPC para un periodo exacto, o `undefined` si el periodo no existe en el dataset.
 * No interpola ni busca el mes más cercano.
 */
export function getIndexForPeriod(period: string): number | undefined {
  return indexByPeriod.get(period);
}

function assertValidPeriodFormat(period: string): void {
  if (typeof period !== "string" || !PERIOD_FORMAT.test(period)) {
    throw inflationErrors.invalidPeriodFormat(period);
  }
}

function resolveIndex(period: string): number {
  assertValidPeriodFormat(period);

  const index = indexByPeriod.get(period);
  if (index === undefined) {
    throw inflationErrors.periodNotAvailable(period);
  }
  return index;
}

function assertValidAmount(amount: number): void {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 0) {
    throw inflationErrors.invalidAmount();
  }
}

/**
 * Calcula la inflación acumulada entre dos periodos mensuales exactos usando
 * exclusivamente el dataset local oficial del IPC.
 *
 * Fórmulas:
 *   adjustmentFactor = endIndex / startIndex
 *   cumulativeInflationRate = adjustmentFactor - 1
 *   cumulativeInflationPercentage = (endIndex / startIndex - 1) * 100
 *   equivalentAmountAtEnd = amount * adjustmentFactor
 *   requiredNominalIncrease = equivalentAmountAtEnd - amount
 *
 * No redondea el resultado: el redondeo de presentación es responsabilidad de la UI.
 * Admite deflación (factor < 1, porcentaje/incremento negativos) sin forzarlos a cero.
 */
export function calculateHistoricalInflation(
  input: HistoricalInflationInput
): HistoricalInflationResult {
  const { amount, startPeriod, endPeriod } = input;

  assertValidAmount(amount);

  const startIndex = resolveIndex(startPeriod);
  const endIndex = resolveIndex(endPeriod);

  if (startPeriod > endPeriod) {
    throw inflationErrors.invalidPeriodOrder(startPeriod, endPeriod);
  }

  const adjustmentFactor = endIndex / startIndex;
  const cumulativeInflationRate = adjustmentFactor - 1;
  const cumulativeInflationPercentage = cumulativeInflationRate * 100;
  const equivalentAmountAtEnd = amount * adjustmentFactor;
  const requiredNominalIncrease = equivalentAmountAtEnd - amount;

  return {
    amount,
    startPeriod,
    endPeriod,
    startIndex,
    endIndex,
    adjustmentFactor,
    cumulativeInflationRate,
    cumulativeInflationPercentage,
    equivalentAmountAtEnd,
    requiredNominalIncrease,
  };
}
