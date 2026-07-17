"use client";

import { useId, useState } from "react";
import {
  calculateHistoricalInflation,
  getAvailablePeriods,
  getLastAvailablePeriod,
  InflationError,
} from "@/lib/inflation";
import type { HistoricalInflationResult } from "@/lib/inflation/types";

export interface CalculatorInflationHistoricalLabels {
  amountLabel: string;
  amountPlaceholder: string;
  startPeriodLabel: string;
  endPeriodLabel: string;
  calculateButton: string;
  resultHeading: string;
  initialAmountLabel: string;
  equivalentAmountLabel: string;
  accumulatedInflationLabel: string;
  purchasingPowerChangeLabel: string;
  periodSummaryLabel: string;
  startIndexLabel: string;
  endIndexLabel: string;
  sourceLabel: string;
  sourceName: string;
  resetButton: string;
  invalidAmountError: string;
  invalidPeriodFormatError: string;
  periodNotAvailableError: string;
  invalidPeriodOrderError: string;
  genericError: string;
  emptyStateMessage: string;
}

export interface CalculatorInflationHistoricalProps {
  labels: CalculatorInflationHistoricalLabels;
  locale: string;
}

type ErrorTarget = "amount" | "periods" | "form";

const DEFAULT_AMOUNT = 1000;
const DEFAULT_AMOUNT_INPUT = String(DEFAULT_AMOUNT);
const STRICT_AMOUNT_PATTERN = /^(?:\d+(?:\.\d+)?|\.\d+)$/;

const createDateFormatter = (locale: string) => {
  try {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      timeZone: "UTC",
    });
  } catch {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "long",
      timeZone: "UTC",
    });
  }
};

const createNumberFormatter = (
  locale: string,
  options: Intl.NumberFormatOptions
) => {
  try {
    return new Intl.NumberFormat(locale, options);
  } catch {
    return new Intl.NumberFormat(undefined, options);
  }
};

const formatPeriod = (period: string, formatter: Intl.DateTimeFormat): string => {
  try {
    const [yearStr, monthStr] = period.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const date = new Date(Date.UTC(year, month - 1, 1));

    return formatter.format(date);
  } catch {
    return period;
  }
};

const parseStrictAmount = (input: string): number | null => {
  const normalizedInput = input.trim();

  if (normalizedInput.length === 0 || !STRICT_AMOUNT_PATTERN.test(normalizedInput)) {
    return null;
  }

  const parsedAmount = Number(normalizedInput);

  if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
    return null;
  }

  return parsedAmount;
};

export function CalculatorInflationHistorical({
  labels,
  locale,
}: CalculatorInflationHistoricalProps) {
  const instanceId = useId();
  const availablePeriods = getAvailablePeriods();
  const lastPeriod = getLastAvailablePeriod();

  // Recommended start period: 12 real periods before the latest available period.
  const startPeriodIndex = Math.max(0, availablePeriods.length - 1 - 12);
  const defaultStartPeriod = availablePeriods[startPeriodIndex];

  const amountInputId = `${instanceId}-amount-input`;
  const startPeriodSelectId = `${instanceId}-start-period-select`;
  const endPeriodSelectId = `${instanceId}-end-period-select`;
  const errorId = `${instanceId}-error`;

  const dateFormatter = createDateFormatter(locale);
  const moneyFormatter = createNumberFormatter(locale, {
    style: "currency",
    currency: "EUR",
  });
  const percentageFormatter = createNumberFormatter(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const indexFormatter = createNumberFormatter(locale, {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
  const currencySymbol =
    moneyFormatter.formatToParts(0).find((part) => part.type === "currency")?.value ?? "EUR";

  const getDefaultResult = (): HistoricalInflationResult | null => {
    try {
      return calculateHistoricalInflation({
        amount: DEFAULT_AMOUNT,
        startPeriod: defaultStartPeriod,
        endPeriod: lastPeriod,
      });
    } catch {
      return null;
    }
  };

  const [amountInput, setAmountInput] = useState(DEFAULT_AMOUNT_INPUT);
  const [startPeriod, setStartPeriod] = useState(defaultStartPeriod);
  const [endPeriod, setEndPeriod] = useState(lastPeriod);
  const [error, setError] = useState<string | null>(null);
  const [errorTarget, setErrorTarget] = useState<ErrorTarget | null>(null);
  const [result, setResult] = useState<HistoricalInflationResult | null>(() => getDefaultResult());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrorTarget(null);
    setResult(null);

    const parsedAmount = parseStrictAmount(amountInput);

    if (parsedAmount === null) {
      setError(labels.invalidAmountError);
      setErrorTarget("amount");
      return;
    }

    try {
      const calculation = calculateHistoricalInflation({
        amount: parsedAmount,
        startPeriod,
        endPeriod,
      });

      setResult(calculation);
    } catch (err) {
      if (err instanceof InflationError) {
        switch (err.code) {
          case "INVALID_AMOUNT":
            setError(labels.invalidAmountError);
            setErrorTarget("amount");
            break;
          case "INVALID_PERIOD_FORMAT":
            setError(labels.invalidPeriodFormatError);
            setErrorTarget("periods");
            break;
          case "PERIOD_NOT_AVAILABLE":
            setError(labels.periodNotAvailableError);
            setErrorTarget("periods");
            break;
          case "INVALID_PERIOD_ORDER":
            setError(labels.invalidPeriodOrderError);
            setErrorTarget("periods");
            break;
          default:
            setError(labels.genericError);
            setErrorTarget("form");
        }
      } else {
        setError(labels.genericError);
        setErrorTarget("form");
      }
    }
  };

  const handleReset = () => {
    setAmountInput(DEFAULT_AMOUNT_INPUT);
    setStartPeriod(defaultStartPeriod);
    setEndPeriod(lastPeriod);
    setError(null);
    setErrorTarget(null);
    setResult(getDefaultResult());
  };

  const formatMoney = (amount: number) => moneyFormatter.format(amount);
  const formatPercentage = (percentage: number) =>
    `${percentageFormatter.format(percentage)}%`;
  const formatIndex = (indexValue: number) => indexFormatter.format(indexValue);

  const amountHasError = errorTarget === "amount";
  const periodsHaveError = errorTarget === "periods";
  const describedBy = error ? errorId : undefined;

  return (
    <div className="max-w-6xl mx-auto space-y-16">
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        <aside className="lg:col-span-4 bg-card border border-border p-8 rounded-2xl shadow-sm space-y-8 sticky top-24">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <label
                htmlFor={amountInputId}
                className="text-xs font-bold text-muted-foreground uppercase tracking-widest block"
              >
                {labels.amountLabel}
              </label>
              <div className="relative">
                <input
                  id={amountInputId}
                  type="number"
                  min="0"
                  step="any"
                  placeholder={labels.amountPlaceholder}
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  aria-invalid={amountHasError}
                  aria-describedby={amountHasError ? describedBy : undefined}
                  className="w-full text-3xl font-serif border-b-2 border-stone-200 dark:border-stone-800 focus:border-stone-900 dark:focus:border-stone-400 outline-none py-2 bg-transparent transition-colors text-foreground"
                />
                <span className="absolute right-0 top-3 text-muted-foreground font-serif">
                  {currencySymbol}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <label
                htmlFor={startPeriodSelectId}
                className="text-xs font-bold text-muted-foreground uppercase tracking-widest block"
              >
                {labels.startPeriodLabel}
              </label>
              <select
                id={startPeriodSelectId}
                value={startPeriod}
                onChange={(e) => setStartPeriod(e.target.value)}
                aria-invalid={periodsHaveError}
                aria-describedby={periodsHaveError ? describedBy : undefined}
                className="w-full text-base font-serif border-b-2 border-stone-200 dark:border-stone-800 focus:border-stone-900 dark:focus:border-stone-400 outline-none py-2 bg-transparent transition-colors text-foreground cursor-pointer"
              >
                {availablePeriods.map((period) => (
                  <option key={period} value={period} className="text-foreground bg-card">
                    {formatPeriod(period, dateFormatter)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              <label
                htmlFor={endPeriodSelectId}
                className="text-xs font-bold text-muted-foreground uppercase tracking-widest block"
              >
                {labels.endPeriodLabel}
              </label>
              <select
                id={endPeriodSelectId}
                value={endPeriod}
                onChange={(e) => setEndPeriod(e.target.value)}
                aria-invalid={periodsHaveError}
                aria-describedby={periodsHaveError ? describedBy : undefined}
                className="w-full text-base font-serif border-b-2 border-stone-200 dark:border-stone-800 focus:border-stone-900 dark:focus:border-stone-400 outline-none py-2 bg-transparent transition-colors text-foreground cursor-pointer"
              >
                {availablePeriods.map((period) => (
                  <option key={period} value={period} className="text-foreground bg-card">
                    {formatPeriod(period, dateFormatter)}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div
                id={errorId}
                role="alert"
                className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium"
              >
                {error}
              </div>
            )}

            <div className="space-y-3 pt-4">
              <button
                type="submit"
                className="w-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 py-4 rounded-xl font-bold hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 dark:focus-visible:outline-stone-100 cursor-pointer"
              >
                {labels.calculateButton}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="w-full border border-stone-200 dark:border-stone-800 text-muted-foreground hover:text-foreground py-4 rounded-xl font-bold hover:bg-stone-50 dark:hover:bg-stone-900/50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-500 cursor-pointer"
              >
                {labels.resetButton}
              </button>
            </div>
          </form>
        </aside>

        <div
          className="lg:col-span-8 space-y-8"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {result ? (
            <div className="bg-card border border-border p-8 md:p-12 rounded-2xl shadow-sm space-y-12 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-stone-200 dark:from-stone-800 via-red-400 dark:via-red-500 to-stone-200 dark:to-stone-800"></div>

              <div className="grid md:grid-cols-2 gap-8 items-stretch">
                <div className="min-w-0 bg-stone-950 dark:bg-stone-900 text-white p-8 rounded-xl flex flex-col justify-center text-center space-y-2">
                  <span className="text-xs text-stone-400 font-bold uppercase tracking-widest">
                    {labels.equivalentAmountLabel}
                  </span>
                  <span className="sr-only">: </span>
                  <span className="text-3xl md:text-4xl lg:text-5xl font-serif break-words">
                    {formatMoney(result.equivalentAmountAtEnd)}
                  </span>
                  <span className="sr-only">. </span>
                  <span className="text-stone-400 font-light text-xs">
                    {labels.periodSummaryLabel}: {formatPeriod(result.endPeriod, dateFormatter)}
                  </span>
                </div>

                <div
                  className={`min-w-0 p-8 rounded-xl border flex flex-col justify-center text-center space-y-2 ${
                    result.cumulativeInflationPercentage >= 0
                      ? "bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30"
                      : "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30"
                  }`}
                >
                  <span
                    className={`text-xs font-bold uppercase tracking-widest ${
                      result.cumulativeInflationPercentage >= 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {labels.accumulatedInflationLabel}
                  </span>
                  <span className="sr-only">: </span>
                  <span
                    className={`text-3xl md:text-4xl lg:text-5xl font-serif break-words ${
                      result.cumulativeInflationPercentage >= 0
                        ? "text-red-600 dark:text-red-300"
                        : "text-emerald-600 dark:text-emerald-300"
                    }`}
                  >
                    {result.cumulativeInflationPercentage >= 0 ? "+" : ""}
                    {formatPercentage(result.cumulativeInflationPercentage)}
                  </span>
                  <span className="sr-only">. </span>
                </div>
              </div>

              <div className="border-t border-border pt-8 space-y-6">
                <h3 className="text-lg font-bold text-foreground">{labels.resultHeading}</h3>

                <div className="grid sm:grid-cols-2 gap-6 text-sm">
                  <div className="space-y-1">
                    <span className="text-muted-foreground block">{labels.initialAmountLabel}</span>
                    <span className="font-serif text-lg text-foreground">
                      {formatMoney(result.amount)}{" "}
                      <span className="text-sm text-muted-foreground font-sans">
                        ({formatPeriod(result.startPeriod, dateFormatter)})
                      </span>
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-muted-foreground block">
                      {labels.purchasingPowerChangeLabel}
                    </span>
                    <span
                      className={`font-serif text-lg ${
                        result.requiredNominalIncrease >= 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {result.requiredNominalIncrease >= 0 ? "+" : ""}
                      {formatMoney(result.requiredNominalIncrease)}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-muted-foreground block">
                      {labels.startIndexLabel} ({formatPeriod(result.startPeriod, dateFormatter)})
                    </span>
                    <span className="font-serif text-lg text-foreground">
                      {formatIndex(result.startIndex)}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-muted-foreground block">
                      {labels.endIndexLabel} ({formatPeriod(result.endPeriod, dateFormatter)})
                    </span>
                    <span className="font-serif text-lg text-foreground">
                      {formatIndex(result.endIndex)}
                    </span>
                  </div>
                </div>

                <div className="pt-6 border-t border-border text-xs text-muted-foreground">
                  <span>{labels.sourceLabel} </span>
                  <span className="font-semibold text-foreground">{labels.sourceName}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border p-8 md:p-12 rounded-2xl shadow-sm text-center text-muted-foreground font-light py-16">
              {labels.emptyStateMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
