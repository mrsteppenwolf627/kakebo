import { describe, it, expect } from "vitest";
import {
  calculateHistoricalInflation,
  getDatasetCoverage,
  getFirstAvailablePeriod,
  getLastAvailablePeriod,
  getTotalPeriods,
  getAvailablePeriods,
  getIndexForPeriod,
  InflationError,
  inflationErrors,
} from "@/lib/inflation";

// Valores reales del dataset versionado (src/lib/inflation/data/ipc-nacional-es.json),
// leídos aquí solo para fijar los fixtures esperados por los tests, no para reimplementar
// las validaciones internas del módulo (ya cubiertas por historical.ts al cargar el módulo).
const KNOWN_INDEX = {
  "2002-01": 58.717,
  "2025-01": 98.579,
  "2002-06": 60.277,
  "2002-07": 59.858,
} as const;

describe("inflation domain (src/lib/inflation)", () => {
  // ─── Bloque 1 — Cobertura del dataset ──────────────────────────────────────
  describe("dataset coverage", () => {
    it("reports the expected first period", () => {
      expect(getFirstAvailablePeriod()).toBe("2002-01");
    });

    it("reports the expected last period", () => {
      expect(getLastAvailablePeriod()).toBe("2026-06");
    });

    it("reports exactly 294 total periods", () => {
      expect(getTotalPeriods()).toBe(294);
    });

    it("returns a periods list with matching length", () => {
      expect(getAvailablePeriods().length).toBe(294);
    });

    it("returns periods in chronological order", () => {
      const periods = getAvailablePeriods();
      for (let i = 1; i < periods.length; i++) {
        expect(periods[i] > periods[i - 1]).toBe(true);
      }
    });

    it("has '2002-01' as the first element and '2026-06' as the last", () => {
      const periods = getAvailablePeriods();
      expect(periods[0]).toBe("2002-01");
      expect(periods[periods.length - 1]).toBe("2026-06");
    });

    it("has one period per consecutive month, without gaps", () => {
      const periods = getAvailablePeriods();
      for (let i = 1; i < periods.length; i++) {
        const [prevYear, prevMonth] = periods[i - 1].split("-").map(Number);
        const [year, month] = periods[i].split("-").map(Number);
        const expectedNext =
          prevMonth === 12
            ? { year: prevYear + 1, month: 1 }
            : { year: prevYear, month: prevMonth + 1 };
        expect({ year, month }).toEqual(expectedNext);
      }
    });

    it("getDatasetCoverage() matches the individual accessor helpers", () => {
      const coverage = getDatasetCoverage();
      expect(coverage.firstPeriod).toBe(getFirstAvailablePeriod());
      expect(coverage.lastPeriod).toBe(getLastAvailablePeriod());
      expect(coverage.totalPeriods).toBe(getTotalPeriods());
      expect(coverage.periods).toEqual(getAvailablePeriods());
    });
  });

  // ─── Bloque 2 — Consulta de índices ────────────────────────────────────────
  describe("getIndexForPeriod", () => {
    it("returns the exact stored index for 2002-01", () => {
      expect(getIndexForPeriod("2002-01")).toBe(KNOWN_INDEX["2002-01"]);
    });

    it("returns the exact stored index for 2025-01", () => {
      expect(getIndexForPeriod("2025-01")).toBe(KNOWN_INDEX["2025-01"]);
    });

    it("returns a finite positive number for an intermediate period", () => {
      const value = getIndexForPeriod("2015-06");
      expect(typeof value).toBe("number");
      expect(Number.isFinite(value)).toBe(true);
      expect((value as number) > 0).toBe(true);
    });

    it("is stable across repeated calls for the same period", () => {
      const first = getIndexForPeriod("2010-01");
      const second = getIndexForPeriod("2010-01");
      const third = getIndexForPeriod("2010-01");
      expect(first).toBe(second);
      expect(second).toBe(third);
    });

    it("returns undefined for a well-formed period outside coverage (no nearest-month fallback)", () => {
      expect(getIndexForPeriod("1990-01")).toBeUndefined();
      expect(getIndexForPeriod("2099-01")).toBeUndefined();
    });

    it("does not interpolate between neighboring periods", () => {
      // 2002-02 no está en el dataset (el primer registro es 2002-01);
      // comprobamos que un periodo interior real no coincide por promedio de vecinos.
      const jan = getIndexForPeriod("2002-01") as number;
      const feb = getIndexForPeriod("2002-02") as number;
      const mar = getIndexForPeriod("2002-03") as number;
      // Si hubiera interpolación lineal, feb sería exactamente el promedio de jan/mar;
      // el dataset real no garantiza esa relación, lo cual confirma ausencia de interpolación.
      expect(feb).not.toBe((jan + mar) / 2);
    });
  });

  // ─── Bloque 3 — Caso oficial de referencia (2002-01 -> 2025-01) ────────────
  describe("official reference case: 2002-01 -> 2025-01, 1000", () => {
    const startIndex = KNOWN_INDEX["2002-01"];
    const endIndex = KNOWN_INDEX["2025-01"];
    const result = calculateHistoricalInflation({
      amount: 1000,
      startPeriod: "2002-01",
      endPeriod: "2025-01",
    });

    it("resolves the exact start and end indices", () => {
      expect(result.startIndex).toBe(startIndex);
      expect(result.endIndex).toBe(endIndex);
    });

    it("computes adjustmentFactor = endIndex / startIndex", () => {
      expect(result.adjustmentFactor).toBeCloseTo(endIndex / startIndex, 12);
    });

    it("computes cumulativeInflationRate = adjustmentFactor - 1", () => {
      expect(result.cumulativeInflationRate).toBeCloseTo(endIndex / startIndex - 1, 12);
    });

    it("computes cumulativeInflationPercentage = (endIndex/startIndex - 1) * 100", () => {
      expect(result.cumulativeInflationPercentage).toBeCloseTo(
        (endIndex / startIndex - 1) * 100,
        10
      );
    });

    it("computes equivalentAmountAtEnd = amount * adjustmentFactor", () => {
      expect(result.equivalentAmountAtEnd).toBeCloseTo(1000 * (endIndex / startIndex), 10);
    });

    it("computes requiredNominalIncrease = equivalentAmountAtEnd - amount", () => {
      expect(result.requiredNominalIncrease).toBeCloseTo(
        1000 * (endIndex / startIndex) - 1000,
        10
      );
    });

    it("is approximately 67.9% (official INE figure), verified on the full unrounded value", () => {
      // El INE presenta 67,9% redondeado a 1 decimal; aquí se comprueba la cifra completa,
      // sin redondear prematuramente el valor devuelto por el dominio.
      expect(result.cumulativeInflationPercentage).toBeCloseTo(67.888345794233, 6);
      expect(Number(result.cumulativeInflationPercentage.toFixed(1))).toBe(67.9);
    });
  });

  // ─── Bloque 4 — Mismo periodo ───────────────────────────────────────────────
  describe("same start and end period", () => {
    it("returns exact neutral values for 2025-01 -> 2025-01, amount 1000", () => {
      const result = calculateHistoricalInflation({
        amount: 1000,
        startPeriod: "2025-01",
        endPeriod: "2025-01",
      });
      expect(result.adjustmentFactor).toBe(1);
      expect(result.cumulativeInflationRate).toBe(0);
      expect(result.cumulativeInflationPercentage).toBe(0);
      expect(result.equivalentAmountAtEnd).toBe(1000);
      expect(result.requiredNominalIncrease).toBe(0);
    });

    it("returns exact neutral values at a coverage boundary (2002-01 -> 2002-01)", () => {
      const result = calculateHistoricalInflation({
        amount: 500,
        startPeriod: "2002-01",
        endPeriod: "2002-01",
      });
      expect(result.adjustmentFactor).toBe(1);
      expect(result.cumulativeInflationRate).toBe(0);
      expect(result.cumulativeInflationPercentage).toBe(0);
      expect(result.equivalentAmountAtEnd).toBe(500);
      expect(result.requiredNominalIncrease).toBe(0);
    });

    it("returns amount 0 without error when amount is 0", () => {
      const result = calculateHistoricalInflation({
        amount: 0,
        startPeriod: "2025-01",
        endPeriod: "2025-01",
      });
      expect(result.equivalentAmountAtEnd).toBe(0);
      expect(result.requiredNominalIncrease).toBe(0);
    });
  });

  // ─── Bloque 5 — Deflación (caso real: 2002-06 -> 2002-07) ──────────────────
  describe("deflation: real case 2002-06 -> 2002-07", () => {
    const result = calculateHistoricalInflation({
      amount: 1000,
      startPeriod: "2002-06",
      endPeriod: "2002-07",
    });

    it("has a lower end index than start index", () => {
      expect(result.endIndex).toBeLessThan(result.startIndex);
      expect(result.endIndex).toBe(KNOWN_INDEX["2002-07"]);
      expect(result.startIndex).toBe(KNOWN_INDEX["2002-06"]);
    });

    it("has an adjustment factor below 1", () => {
      expect(result.adjustmentFactor).toBeLessThan(1);
    });

    it("has a negative cumulative inflation rate and percentage", () => {
      expect(result.cumulativeInflationRate).toBeLessThan(0);
      expect(result.cumulativeInflationPercentage).toBeLessThan(0);
    });

    it("has an equivalent amount lower than the initial amount", () => {
      expect(result.equivalentAmountAtEnd).toBeLessThan(1000);
    });

    it("has a negative required nominal increase, not clamped to zero", () => {
      expect(result.requiredNominalIncrease).toBeLessThan(0);
      expect(result.requiredNominalIncrease).not.toBe(0);
    });
  });

  // ─── Bloque 6 — Validación de cantidades ───────────────────────────────────
  describe("amount validation", () => {
    it("accepts a positive integer amount", () => {
      const result = calculateHistoricalInflation({
        amount: 2000,
        startPeriod: "2002-01",
        endPeriod: "2025-01",
      });
      expect(result.amount).toBe(2000);
    });

    it("accepts a positive decimal amount without internal rounding", () => {
      const result = calculateHistoricalInflation({
        amount: 1234.5678,
        startPeriod: "2002-01",
        endPeriod: "2025-01",
      });
      const factor = KNOWN_INDEX["2025-01"] / KNOWN_INDEX["2002-01"];
      expect(result.equivalentAmountAtEnd).toBeCloseTo(1234.5678 * factor, 10);
    });

    it("accepts amount 0", () => {
      expect(() =>
        calculateHistoricalInflation({ amount: 0, startPeriod: "2002-01", endPeriod: "2025-01" })
      ).not.toThrow();
    });

    it("accepts a very small positive amount", () => {
      const result = calculateHistoricalInflation({
        amount: 0.01,
        startPeriod: "2002-01",
        endPeriod: "2025-01",
      });
      expect(result.equivalentAmountAtEnd).toBeGreaterThan(0);
    });

    it("accepts a large but finite amount", () => {
      const result = calculateHistoricalInflation({
        amount: 50_000_000,
        startPeriod: "2002-01",
        endPeriod: "2025-01",
      });
      expect(Number.isFinite(result.equivalentAmountAtEnd)).toBe(true);
    });

    it("rejects a negative amount with INVALID_AMOUNT", () => {
      expect(() =>
        calculateHistoricalInflation({ amount: -100, startPeriod: "2002-01", endPeriod: "2025-01" })
      ).toThrowError(InflationError);
      try {
        calculateHistoricalInflation({ amount: -100, startPeriod: "2002-01", endPeriod: "2025-01" });
      } catch (e) {
        expect((e as InflationError).code).toBe("INVALID_AMOUNT");
      }
    });

    it("rejects NaN with INVALID_AMOUNT", () => {
      try {
        calculateHistoricalInflation({ amount: NaN, startPeriod: "2002-01", endPeriod: "2025-01" });
        expect.unreachable("should have thrown");
      } catch (e) {
        expect((e as InflationError).code).toBe("INVALID_AMOUNT");
      }
    });

    it("rejects Infinity with INVALID_AMOUNT", () => {
      try {
        calculateHistoricalInflation({
          amount: Infinity,
          startPeriod: "2002-01",
          endPeriod: "2025-01",
        });
        expect.unreachable("should have thrown");
      } catch (e) {
        expect((e as InflationError).code).toBe("INVALID_AMOUNT");
      }
    });

    it("rejects -Infinity with INVALID_AMOUNT", () => {
      try {
        calculateHistoricalInflation({
          amount: -Infinity,
          startPeriod: "2002-01",
          endPeriod: "2025-01",
        });
        expect.unreachable("should have thrown");
      } catch (e) {
        expect((e as InflationError).code).toBe("INVALID_AMOUNT");
      }
    });

    it("rejects a non-number amount forced at runtime with INVALID_AMOUNT", () => {
      try {
        calculateHistoricalInflation({
          amount: "1000" as unknown as number,
          startPeriod: "2002-01",
          endPeriod: "2025-01",
        });
        expect.unreachable("should have thrown");
      } catch (e) {
        expect((e as InflationError).code).toBe("INVALID_AMOUNT");
      }
    });
  });

  // ─── Bloque 7 — Formatos de periodo inválidos ──────────────────────────────
  describe("invalid period formats", () => {
    const invalidFormats = [
      "",
      " ",
      "2025",
      "2025-1",
      "25-01",
      "2025-00",
      "2025-13",
      "2025-01-01",
      "2025/01",
      "2025-01 ",
      " 2025-01",
      "abcd-ef",
      "202501",
    ];

    for (const period of invalidFormats) {
      it(`rejects '${period}' as startPeriod with INVALID_PERIOD_FORMAT`, () => {
        try {
          calculateHistoricalInflation({ amount: 100, startPeriod: period, endPeriod: "2025-01" });
          expect.unreachable("should have thrown");
        } catch (e) {
          expect((e as InflationError).code).toBe("INVALID_PERIOD_FORMAT");
        }
      });
    }

    it("rejects a period before dataset coverage with PERIOD_NOT_AVAILABLE (well-formed, not a format error)", () => {
      try {
        calculateHistoricalInflation({ amount: 100, startPeriod: "1990-01", endPeriod: "2025-01" });
        expect.unreachable("should have thrown");
      } catch (e) {
        expect((e as InflationError).code).toBe("PERIOD_NOT_AVAILABLE");
      }
    });

    it("rejects a period after dataset coverage with PERIOD_NOT_AVAILABLE (well-formed, not a format error)", () => {
      try {
        calculateHistoricalInflation({ amount: 100, startPeriod: "2002-01", endPeriod: "2099-01" });
        expect.unreachable("should have thrown");
      } catch (e) {
        expect((e as InflationError).code).toBe("PERIOD_NOT_AVAILABLE");
      }
    });
  });

  // ─── Bloque 8 — Orden cronológico ──────────────────────────────────────────
  describe("chronological order", () => {
    it("accepts startPeriod before endPeriod", () => {
      expect(() =>
        calculateHistoricalInflation({ amount: 100, startPeriod: "2002-01", endPeriod: "2025-01" })
      ).not.toThrow();
    });

    it("accepts startPeriod equal to endPeriod", () => {
      expect(() =>
        calculateHistoricalInflation({ amount: 100, startPeriod: "2010-05", endPeriod: "2010-05" })
      ).not.toThrow();
    });

    it("rejects startPeriod after endPeriod, both valid and available, with INVALID_PERIOD_ORDER", () => {
      try {
        calculateHistoricalInflation({ amount: 100, startPeriod: "2025-01", endPeriod: "2002-01" });
        expect.unreachable("should have thrown");
      } catch (e) {
        expect((e as InflationError).code).toBe("INVALID_PERIOD_ORDER");
      }
    });
  });

  // ─── Bloque 9 — Contrato de errores ────────────────────────────────────────
  describe("error contract", () => {
    it("throws instances of InflationError with name 'InflationError'", () => {
      try {
        calculateHistoricalInflation({ amount: -1, startPeriod: "2002-01", endPeriod: "2025-01" });
        expect.unreachable("should have thrown");
      } catch (e) {
        expect(e).toBeInstanceOf(InflationError);
        expect(e).toBeInstanceOf(Error);
        expect((e as InflationError).name).toBe("InflationError");
      }
    });

    it("distinguishes at least the 5 documented error codes", () => {
      expect(inflationErrors.invalidAmount().code).toBe("INVALID_AMOUNT");
      expect(inflationErrors.invalidPeriodFormat("x").code).toBe("INVALID_PERIOD_FORMAT");
      expect(inflationErrors.periodNotAvailable("2099-01").code).toBe("PERIOD_NOT_AVAILABLE");
      expect(inflationErrors.invalidPeriodOrder("2025-01", "2002-01").code).toBe(
        "INVALID_PERIOD_ORDER"
      );
      expect(inflationErrors.datasetIntegrityError("x").code).toBe("DATASET_INTEGRITY_ERROR");
    });

    it("attaches relevant details to period-related errors", () => {
      const formatError = inflationErrors.invalidPeriodFormat("2025-1");
      expect(formatError.details).toEqual({ period: "2025-1" });

      const orderError = inflationErrors.invalidPeriodOrder("2025-01", "2002-01");
      expect(orderError.details).toEqual({ startPeriod: "2025-01", endPeriod: "2002-01" });
    });

    it("does not embed end-user-facing translation keys (technical Spanish messages only)", () => {
      // Decisión documentada en HISTORICAL-LOGIC-01: los mensajes de InflationError son
      // técnicos (para logs/desarrollo), no claves de traducción ni copy final de UI.
      const error = inflationErrors.periodNotAvailable("2099-01");
      expect(error.message).not.toMatch(/^Tools\.Inflation\./);
      expect(typeof error.message).toBe("string");
      expect(error.message.length).toBeGreaterThan(0);
    });
  });

  // ─── Bloque 10 — Inmutabilidad y encapsulación ─────────────────────────────
  describe("immutability and encapsulation", () => {
    it("does not let external mutation of the returned periods array affect subsequent calls", () => {
      const periods = getAvailablePeriods() as string[];
      const originalLength = periods.length;
      const originalFirst = periods[0];

      expect(() => {
        (periods as unknown as string[]).push("9999-99");
      }).toThrow();

      const periodsAgain = getAvailablePeriods();
      expect(periodsAgain.length).toBe(originalLength);
      expect(periodsAgain[0]).toBe(originalFirst);
    });

    it("does not let external mutation of coverage.periods affect getDatasetCoverage() on a later call", () => {
      const coverage = getDatasetCoverage();
      expect(() => {
        (coverage.periods as unknown as string[])[0] = "9999-99";
      }).toThrow();

      const coverageAgain = getDatasetCoverage();
      expect(coverageAgain.periods[0]).toBe("2002-01");
    });

    it("returns the same coverage snapshot content across repeated calls", () => {
      const first = getDatasetCoverage();
      const second = getDatasetCoverage();
      expect(first).toEqual(second);
    });
  });

  // ─── Bloque 11 — Determinismo ──────────────────────────────────────────────
  describe("determinism", () => {
    it("returns an equivalent result for the same input across repeated calls", () => {
      const input = { amount: 1000, startPeriod: "2002-01", endPeriod: "2025-01" } as const;
      const first = calculateHistoricalInflation(input);
      const second = calculateHistoricalInflation(input);
      const third = calculateHistoricalInflation(input);
      expect(first).toEqual(second);
      expect(second).toEqual(third);
    });

    it("does not mutate the input object passed in", () => {
      const input = { amount: 1000, startPeriod: "2002-01", endPeriod: "2025-01" };
      const snapshot = { ...input };
      calculateHistoricalInflation(input);
      expect(input).toEqual(snapshot);
    });
  });

  // ─── Bloque 12 — Exportaciones públicas ────────────────────────────────────
  describe("public exports from src/lib/inflation", () => {
    it("exposes all documented public functions from the barrel module", () => {
      expect(typeof calculateHistoricalInflation).toBe("function");
      expect(typeof getDatasetCoverage).toBe("function");
      expect(typeof getFirstAvailablePeriod).toBe("function");
      expect(typeof getLastAvailablePeriod).toBe("function");
      expect(typeof getTotalPeriods).toBe("function");
      expect(typeof getAvailablePeriods).toBe("function");
      expect(typeof getIndexForPeriod).toBe("function");
      expect(typeof InflationError).toBe("function");
      expect(typeof inflationErrors).toBe("object");
    });
  });
});
