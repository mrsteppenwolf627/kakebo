import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CalculatorInflationHistorical } from "@/components/landing/tools/CalculatorInflationHistorical";

const trackMock = vi.fn();

vi.mock("@/lib/analytics", () => ({
  analytics: {
    track: (...args: unknown[]) => trackMock(...args),
  },
}));

const labels = {
  amountLabel: "Cantidad inicial",
  amountPlaceholder: "Introduce una cantidad",
  startPeriodLabel: "Mes inicial",
  endPeriodLabel: "Mes final",
  calculateButton: "Calcular inflación histórica",
  resultHeading: "Resultado de la inflación histórica",
  initialAmountLabel: "Cantidad inicial",
  equivalentAmountLabel: "Cantidad equivalente en el mes final",
  accumulatedInflationLabel: "Inflación acumulada",
  purchasingPowerChangeLabel: "Variación del valor",
  periodSummaryLabel: "Periodo analizado",
  startIndexLabel: "Índice IPC inicial",
  endIndexLabel: "Índice IPC final",
  sourceLabel: "Fuente",
  sourceName: "Instituto Nacional de Estadística (INE)",
  resetButton: "Restablecer",
  invalidAmountError: "Introduce una cantidad válida igual o superior a cero.",
  invalidPeriodFormatError: "El formato del periodo seleccionado no es válido.",
  periodNotAvailableError: "No hay datos disponibles para uno de los periodos seleccionados.",
  invalidPeriodOrderError: "El mes inicial no puede ser posterior al mes final.",
  genericError: "No se ha podido realizar el cálculo. Inténtalo de nuevo.",
  emptyStateMessage: "Introduce una cantidad y selecciona dos meses para calcular la inflación acumulada.",
};

function setPeriods(startPeriod: string, endPeriod: string) {
  fireEvent.change(screen.getByLabelText(labels.startPeriodLabel), {
    target: { value: startPeriod },
  });
  fireEvent.change(screen.getByLabelText(labels.endPeriodLabel), {
    target: { value: endPeriod },
  });
}

function setAmount(value: string) {
  fireEvent.change(screen.getByLabelText(labels.amountLabel), {
    target: { value },
  });
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: labels.calculateButton }));
}

describe("CalculatorInflationHistorical analytics", () => {
  beforeEach(() => {
    trackMock.mockClear();
  });

  it("fires historical_inflation_calculation with period and interval on a valid submit", () => {
    render(<CalculatorInflationHistorical labels={labels} locale="es" />);

    setAmount("1000");
    setPeriods("2002-01", "2025-01");
    submit();

    expect(trackMock).toHaveBeenCalledWith(
      "historical_inflation_calculation",
      expect.objectContaining({
        start_period: "2002-01",
        end_period: "2025-01",
        interval_months: 276,
        result_type: "inflation",
        source_page: "/herramientas/calculadora-inflacion",
      })
    );
  });

  it("classifies a deflation period as result_type deflation", () => {
    render(<CalculatorInflationHistorical labels={labels} locale="es" />);

    setAmount("1000");
    setPeriods("2002-06", "2002-07");
    submit();

    expect(trackMock).toHaveBeenCalledWith(
      "historical_inflation_calculation",
      expect.objectContaining({ result_type: "deflation", interval_months: 1 })
    );
  });

  it("classifies the same period as result_type no_change", () => {
    render(<CalculatorInflationHistorical labels={labels} locale="es" />);

    setAmount("1000");
    setPeriods("2025-01", "2025-01");
    submit();

    expect(trackMock).toHaveBeenCalledWith(
      "historical_inflation_calculation",
      expect.objectContaining({ result_type: "no_change", interval_months: 0 })
    );
  });

  it("fires historical_inflation_error with INVALID_AMOUNT for an invalid amount", () => {
    render(<CalculatorInflationHistorical labels={labels} locale="es" />);

    setAmount("-1");
    submit();

    expect(trackMock).toHaveBeenCalledWith("historical_inflation_error", {
      error_code: "INVALID_AMOUNT",
      source_page: "/herramientas/calculadora-inflacion",
    });
  });

  it("fires historical_inflation_error with INVALID_PERIOD_ORDER when start is after end", () => {
    render(<CalculatorInflationHistorical labels={labels} locale="es" />);

    setAmount("1000");
    setPeriods("2025-01", "2002-01");
    submit();

    expect(trackMock).toHaveBeenCalledWith("historical_inflation_error", {
      error_code: "INVALID_PERIOD_ORDER",
      source_page: "/herramientas/calculadora-inflacion",
    });
  });

  it("never includes the entered amount in any tracked payload", () => {
    render(<CalculatorInflationHistorical labels={labels} locale="es" />);

    setAmount("123456.78");
    setPeriods("2002-01", "2025-01");
    submit();

    for (const call of trackMock.mock.calls) {
      const payload = JSON.stringify(call[1]);
      expect(payload).not.toContain("123456.78");
    }
  });

  it("does not fire any tracking call on initial render", () => {
    render(<CalculatorInflationHistorical labels={labels} locale="es" />);

    expect(trackMock).not.toHaveBeenCalled();
  });

  it("does not throw when analytics.track is a no-op (GA4 unavailable)", () => {
    trackMock.mockImplementationOnce(() => undefined);

    render(<CalculatorInflationHistorical labels={labels} locale="es" />);

    setAmount("1000");
    setPeriods("2002-01", "2025-01");

    expect(() => submit()).not.toThrow();
    expect(screen.getByText(labels.resultHeading)).toBeInTheDocument();
  });
});
