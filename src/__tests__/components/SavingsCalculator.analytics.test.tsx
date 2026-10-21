import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import esMessages from "../../../messages/es.json";

const trackMock = vi.fn();
vi.mock("@/lib/analytics", () => ({
  analytics: { track: (...args: unknown[]) => trackMock(...args) },
}));

vi.mock("@/i18n/routing", () => ({
  Link: ({ href, children, onClick, ...rest }: { href: string; children: React.ReactNode; onClick?: () => void; [key: string]: unknown }) => (
    <a href={href} onClick={onClick} {...rest}>
      {children}
    </a>
  ),
}));

import { SavingsCalculator } from "@/components/landing/tools/SavingsCalculator";

const renderCalculator = () =>
  render(
    <NextIntlClientProvider locale="es" messages={esMessages}>
      <SavingsCalculator />
    </NextIntlClientProvider>
  );

const callsOf = (name: string) => trackMock.mock.calls.filter((c) => c[0] === name);
const setValue = (id: string, value: string) =>
  fireEvent.change(document.getElementById(id) as HTMLInputElement, { target: { value } });

const PAGE_CONTEXT = {
  tool_name: "calculadora_ahorro",
  page_path: "/herramientas/calculadora-ahorro",
  page_title: "Calculadora de ahorro",
};

beforeEach(() => {
  trackMock.mockClear();
  document.title = "Calculadora de ahorro";
  window.history.pushState({}, "", "/herramientas/calculadora-ahorro?utm=x#hash");
});

afterEach(() => cleanup());

describe("SavingsCalculator analytics (sin datos financieros)", () => {
  it("tool_viewed se dispara una sola vez con contexto de página", () => {
    renderCalculator();
    expect(callsOf("tool_viewed")).toEqual([["tool_viewed", PAGE_CONTEXT]]);
  });

  it("use_savings_calculator una vez y savings_calculator_calculate una vez por interacción, solo con contexto de página", () => {
    renderCalculator();
    const income = document.getElementById("sc-income") as HTMLInputElement;

    setValue("sc-income", "2345");
    setValue("sc-income", "2346");
    expect(callsOf("use_savings_calculator")).toEqual([["use_savings_calculator", PAGE_CONTEXT]]);
    expect(callsOf("savings_calculator_calculate")).toHaveLength(0);

    fireEvent.blur(income);
    fireEvent.blur(income);
    expect(callsOf("savings_calculator_calculate")).toEqual([["savings_calculator_calculate", PAGE_CONTEXT]]);
  });

  it("savings_calculator_goal_result una vez, sin meses ni rangos", () => {
    renderCalculator();
    fireEvent.click(screen.getByRole("button", { name: esMessages.Tools.Savings.inputs.goalToggle }));
    setValue("sc-goal", "3000");
    setValue("sc-goal", "3500");
    expect(callsOf("savings_calculator_goal_result")).toEqual([["savings_calculator_goal_result", PAGE_CONTEXT]]);
  });

  it("click_tool_to_app una vez por clic, con source y sin cta_location", () => {
    renderCalculator();
    fireEvent.click(screen.getByRole("link", { name: esMessages.Tools.Savings.results.ctaButton }));
    expect(callsOf("click_tool_to_app")).toEqual([
      ["click_tool_to_app", { ...PAGE_CONTEXT, source: "calculadora_ahorro" }],
    ]);
  });

  it("ningún payload contiene importes, porcentajes, plazos ni rangos derivados", () => {
    renderCalculator();
    setValue("sc-income", "2100");
    setValue("sc-fixed", "901");
    setValue("sc-variable", "433");
    fireEvent.click(screen.getByRole("button", { name: esMessages.Tools.Savings.inputs.goalToggle }));
    setValue("sc-goal", "7777");
    setValue("sc-months", "17");
    fireEvent.blur(document.getElementById("sc-goal") as HTMLInputElement);
    fireEvent.click(screen.getByRole("link", { name: esMessages.Tools.Savings.results.ctaButton }));

    const forbiddenKeys = [
      "income_range",
      "real_margin_range",
      "savings_rate_range",
      "months_to_goal",
      "has_goal",
      "has_deadline",
      "result_status",
      "cta_location",
    ];
    const allowedKeys = new Set(["tool_name", "page_path", "page_title", "source"]);
    for (const [, payload] of trackMock.mock.calls) {
      for (const key of Object.keys(payload as object)) {
        expect(allowedKeys.has(key)).toBe(true);
        expect(forbiddenKeys).not.toContain(key);
      }
    }
    const serialized = JSON.stringify(trackMock.mock.calls);
    for (const value of ["2100", "901", "433", "7777", "17"]) {
      expect(serialized).not.toContain(value);
    }
    expect(callsOf("savings_calculator_calculate").length).toBeGreaterThan(0);
    expect(callsOf("savings_calculator_goal_result").length).toBeGreaterThan(0);
  });
});
