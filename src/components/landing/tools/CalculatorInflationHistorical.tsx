"use client";

import { useState } from "react";
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
  sourceLabel: string;
  sourceName: string;
  resetButton: string;
  invalidAmountError: string;
  invalidPeriodFormatError: string;
  periodNotAvailableError: string;
  invalidPeriodOrderError: string;
  genericError: string;
}

export interface CalculatorInflationHistoricalProps {
  labels: CalculatorInflationHistoricalLabels;
  locale: string;
}

const formatPeriod = (period: string, locale: string): string => {
  try {
    const [yearStr, monthStr] = period.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const date = new Date(Date.UTC(year, month - 1, 1));
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      timeZone: "UTC",
    }).format(date);
  } catch {
    return period;
  }
};

export function CalculatorInflationHistorical({
  labels,
  locale,
}: CalculatorInflationHistoricalProps) {
  const availablePeriods = getAvailablePeriods();
  const lastPeriod = getLastAvailablePeriod();

  // Starting period is recommended to be 12 months before the last available period
  const startPeriodIndex = Math.max(0, availablePeriods.length - 1 - 12);
  const defaultStartPeriod = availablePeriods[startPeriodIndex];

  const [amountInput, setAmountInput] = useState("1000");
  const [startPeriod, setStartPeriod] = useState(defaultStartPeriod);
  const [endPeriod, setEndPeriod] = useState(lastPeriod);
  const [error, setError] = useState<string | null>(null);

  // Initial calculation with safe defaults so the user sees results immediately
  const initialResult = (() => {
    try {
      return calculateHistoricalInflation({
        amount: 1000,
        startPeriod: defaultStartPeriod,
        endPeriod: lastPeriod,
      });
    } catch {
      return null;
    }
  })();

  const [result, setResult] = useState<HistoricalInflationResult | null>(initialResult);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    const parsedAmount = parseFloat(amountInput);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      setError(labels.invalidAmountError);
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
            break;
          case "INVALID_PERIOD_FORMAT":
            setError(labels.invalidPeriodFormatError);
            break;
          case "PERIOD_NOT_AVAILABLE":
            setError(labels.periodNotAvailableError);
            break;
          case "INVALID_PERIOD_ORDER":
            setError(labels.invalidPeriodOrderError);
            break;
          default:
            setError(labels.genericError);
        }
      } else {
        setError(labels.genericError);
      }
    }
  };

  const handleReset = () => {
    setAmountInput("1000");
    setStartPeriod(defaultStartPeriod);
    setEndPeriod(lastPeriod);
    setError(null);

    try {
      const calculation = calculateHistoricalInflation({
        amount: 1000,
        startPeriod: defaultStartPeriod,
        endPeriod: lastPeriod,
      });
      setResult(calculation);
    } catch {
      setResult(null);
    }
  };

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "EUR",
    }).format(amount);

  const formatPercentage = (percentage: number) =>
    new Intl.NumberFormat(locale, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(percentage) + "%";

  const formatIndex = (indexValue: number) =>
    new Intl.NumberFormat(locale, {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(indexValue);

  return (
    <div className="max-w-6xl mx-auto space-y-16">
      {/* Calculator Layout Grid */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Sidebar: Form block */}
        <aside className="lg:col-span-4 bg-card border border-border p-8 rounded-2xl shadow-sm space-y-8 sticky top-24">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Amount input */}
            <div className="space-y-4">
              <label
                htmlFor="amount-input"
                className="text-xs font-bold text-muted-foreground uppercase tracking-widest block"
              >
                {labels.amountLabel}
              </label>
              <div className="relative">
                <input
                  id="amount-input"
                  type="number"
                  min="0"
                  step="any"
                  placeholder={labels.amountPlaceholder}
                  value={amountInput}
                  onChange={(e) => {
                    setAmountInput(e.target.value);
                  }}
                  aria-invalid={!!error}
                  aria-describedby={error ? "inflation-error" : undefined}
                  className="w-full text-3xl font-serif border-b-2 border-stone-200 dark:border-stone-800 focus:border-stone-900 dark:focus:border-stone-400 outline-none py-2 bg-transparent transition-colors text-foreground"
                />
                <span className="absolute right-0 top-3 text-muted-foreground font-serif">€</span>
              </div>
            </div>

            {/* Start Period select */}
            <div className="space-y-4">
              <label
                htmlFor="start-period-select"
                className="text-xs font-bold text-muted-foreground uppercase tracking-widest block"
              >
                {labels.startPeriodLabel}
              </label>
              <select
                id="start-period-select"
                value={startPeriod}
                onChange={(e) => setStartPeriod(e.target.value)}
                className="w-full text-base font-serif border-b-2 border-stone-200 dark:border-stone-800 focus:border-stone-900 dark:focus:border-stone-400 outline-none py-2 bg-transparent transition-colors text-foreground cursor-pointer"
              >
                {availablePeriods.map((period) => (
                  <option key={period} value={period} className="text-foreground bg-card">
                    {formatPeriod(period, locale)}
                  </option>
                ))}
              </select>
            </div>

            {/* End Period select */}
            <div className="space-y-4">
              <label
                htmlFor="end-period-select"
                className="text-xs font-bold text-muted-foreground uppercase tracking-widest block"
              >
                {labels.endPeriodLabel}
              </label>
              <select
                id="end-period-select"
                value={endPeriod}
                onChange={(e) => setEndPeriod(e.target.value)}
                className="w-full text-base font-serif border-b-2 border-stone-200 dark:border-stone-800 focus:border-stone-900 dark:focus:border-stone-400 outline-none py-2 bg-transparent transition-colors text-foreground cursor-pointer"
              >
                {availablePeriods.map((period) => (
                  <option key={period} value={period} className="text-foreground bg-card">
                    {formatPeriod(period, locale)}
                  </option>
                ))}
              </select>
            </div>

            {/* Error block with role alert */}
            {error && (
              <div
                id="inflation-error"
                role="alert"
                className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium"
              >
                {error}
              </div>
            )}

            {/* Action buttons */}
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

        {/* Right Main Content: Results card */}
        <div className="lg:col-span-8 space-y-8" aria-live="polite">
          {result ? (
            <div className="bg-card border border-border p-8 md:p-12 rounded-2xl shadow-sm space-y-12 relative overflow-hidden">
              {/* Aesthetic gradient top-bar */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-stone-200 dark:from-stone-800 via-red-400 dark:via-red-500 to-stone-200 dark:to-stone-800"></div>

              {/* Main Result Panels */}
              <div className="grid md:grid-cols-2 gap-8 items-stretch">
                {/* Equivalent Amount at End Period */}
                <div className="bg-stone-950 dark:bg-stone-900 text-white p-8 rounded-xl flex flex-col justify-center text-center space-y-2">
                  <span className="text-xs text-stone-400 font-bold uppercase tracking-widest">
                    {labels.equivalentAmountLabel}
                  </span>
                  <span className="sr-only">: </span>
                  <span className="text-3xl md:text-4xl lg:text-5xl font-serif">
                    {formatMoney(result.equivalentAmountAtEnd)}
                  </span>
                  <span className="sr-only">. </span>
                  <span className="text-stone-400 font-light text-xs">
                    {labels.periodSummaryLabel}: {formatPeriod(result.endPeriod, locale)}
                  </span>
                </div>

                {/* Accumulated Inflation percentage */}
                <div
                  className={`p-8 rounded-xl border flex flex-col justify-center text-center space-y-2 ${
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
                    className={`text-3xl md:text-4xl lg:text-5xl font-serif ${
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

              {/* Detailed Breakdown Section */}
              <div className="border-t border-border pt-8 space-y-6">
                <h3 className="text-lg font-bold text-foreground">{labels.resultHeading}</h3>

                <div className="grid sm:grid-cols-2 gap-6 text-sm">
                  {/* Initial amount & period */}
                  <div className="space-y-1">
                    <span className="text-muted-foreground block">{labels.initialAmountLabel}</span>
                    <span className="font-serif text-lg text-foreground">
                      {formatMoney(result.amount)}{" "}
                      <span className="text-sm text-muted-foreground font-sans">
                        ({formatPeriod(result.startPeriod, locale)})
                      </span>
                    </span>
                  </div>

                  {/* Nominal difference (purchasing power change) */}
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

                  {/* Initial IPC Index */}
                  <div className="space-y-1">
                    <span className="text-muted-foreground block">
                      Índice IPC Inicial ({formatPeriod(result.startPeriod, locale)})
                    </span>
                    <span className="font-serif text-lg text-foreground">
                      {formatIndex(result.startIndex)}
                    </span>
                  </div>

                  {/* Final IPC Index */}
                  <div className="space-y-1">
                    <span className="text-muted-foreground block">
                      Índice IPC Final ({formatPeriod(result.endPeriod, locale)})
                    </span>
                    <span className="font-serif text-lg text-foreground">
                      {formatIndex(result.endIndex)}
                    </span>
                  </div>
                </div>

                {/* Data source metadata note */}
                <div className="pt-6 border-t border-border text-xs text-muted-foreground">
                  <span>{labels.sourceLabel} </span>
                  <span className="font-semibold text-foreground">{labels.sourceName}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border p-8 md:p-12 rounded-2xl shadow-sm text-center text-muted-foreground font-light py-16">
              Introduzca los parámetros para calcular la inflación histórica.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
