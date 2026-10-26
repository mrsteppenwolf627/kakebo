import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent, act } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import esMessages from "../../../messages/es.json";
import enMessages from "../../../messages/en.json";

// El mock devuelve lo mismo que el módulo real: true solo si el evento se entregó (hay consentimiento).
let delivered = true;
const trackMock = vi.fn<(...args: unknown[]) => boolean>(() => delivered);
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

type Locale = "es" | "en";
const messagesFor = (locale: Locale) => (locale === "en" ? enMessages : esMessages);
const tree = (locale: Locale) => (
  <NextIntlClientProvider locale={locale} messages={messagesFor(locale)}>
    <SavingsCalculator />
  </NextIntlClientProvider>
);
const renderCalculator = (locale: Locale = "es") => render(tree(locale));

const callsOf = (name: string) => trackMock.mock.calls.filter((c) => c[0] === name);
const names = () => trackMock.mock.calls.map((c) => c[0]);
const setValue = (id: string, value: string) => fireEvent.change(document.getElementById(id) as HTMLInputElement, { target: { value } });
const leavePanel = (id = "sc-income") => fireEvent.blur(document.getElementById(id) as HTMLInputElement);
const labels = (locale: Locale) => messagesFor(locale).Tools.Savings;
const openGoal = (locale: Locale) => fireEvent.click(screen.getByRole("button", { name: labels(locale).inputs.goalToggle }));
const cta = (locale: Locale) => screen.getByRole("link", { name: labels(locale).results.ctaButton });

const PATHS: Record<Locale, string> = { es: "/herramientas/calculadora-ahorro", en: "/en/herramientas/calculadora-ahorro" };
const context = (locale: Locale) => ({ tool_name: "calculadora_ahorro", page_path: PATHS[locale], page_title: "Calculadora de ahorro" });

beforeEach(() => {
  delivered = true;
  trackMock.mockClear();
  document.title = "Calculadora de ahorro";
});
afterEach(() => cleanup());

describe.each(["es", "en"] as const)("SavingsCalculator analytics, contrato del embudo (%s)", (locale) => {
  beforeEach(() => window.history.pushState({}, "", `${PATHS[locale]}?utm=x#hash`));

  it("tool_viewed: una vez por montaje, con contexto de página y sin query ni hash", () => {
    const { rerender } = renderCalculator(locale);
    rerender(tree(locale));
    rerender(tree(locale));
    expect(callsOf("tool_viewed")).toEqual([["tool_viewed", context(locale)]]);
  });

  it("use_savings_calculator: una sola vez en la primera interacción, no por cada cambio", () => {
    renderCalculator(locale);
    expect(callsOf("use_savings_calculator")).toHaveLength(0);
    setValue("sc-income", "2345");
    setValue("sc-income", "2346");
    setValue("sc-fixed", "900");
    openGoal(locale);
    expect(callsOf("use_savings_calculator")).toEqual([["use_savings_calculator", context(locale)]]);
  });

  it("savings_calculator_calculate: ni el render, ni las pulsaciones, ni pasar de un campo a otro lo disparan", () => {
    renderCalculator(locale);
    setValue("sc-income", "2100");
    setValue("sc-income", "2101");
    // El foco pasa de un campo al siguiente dentro del formulario: no es un cálculo completado.
    fireEvent.blur(document.getElementById("sc-income") as HTMLInputElement, { relatedTarget: document.getElementById("sc-fixed") });
    expect(callsOf("savings_calculator_calculate")).toHaveLength(0);
  });

  it("savings_calculator_calculate: una vez por cálculo completado, aunque haya varios blur y cambios después", () => {
    renderCalculator(locale);
    setValue("sc-income", "2100");
    leavePanel();
    leavePanel();
    setValue("sc-fixed", "901");
    leavePanel("sc-fixed");
    setValue("sc-variable", "433");
    leavePanel("sc-variable");
    expect(callsOf("savings_calculator_calculate")).toEqual([["savings_calculator_calculate", context(locale)]]);
  });

  it("savings_calculator_calculate: «Ver mi resultado» también completa el cálculo, una sola vez", () => {
    renderCalculator(locale);
    setValue("sc-income", "2100");
    const see = screen.getByRole("button", { name: labels(locale).inputs.seeResult });
    fireEvent.click(see);
    fireEvent.click(see);
    leavePanel();
    expect(callsOf("savings_calculator_calculate")).toHaveLength(1);
  });

  it("no hay cálculo completado sin ingresos, con importes negativos ni sin haber interactuado", () => {
    renderCalculator(locale);
    leavePanel(); // sin interacción
    expect(callsOf("savings_calculator_calculate")).toHaveLength(0);
    setValue("sc-income", "0");
    leavePanel();
    expect(callsOf("savings_calculator_calculate")).toHaveLength(0);
    setValue("sc-income", "2000");
    setValue("sc-fixed", "-5");
    leavePanel("sc-fixed");
    expect(callsOf("savings_calculator_calculate")).toHaveLength(0);
    setValue("sc-fixed", "800");
    leavePanel("sc-fixed");
    expect(callsOf("savings_calculator_calculate")).toHaveLength(1);
  });

  it("savings_calculator_goal_result: una vez, solo con un resultado de objetivo válido y un cálculo completado", () => {
    renderCalculator(locale);
    openGoal(locale);
    setValue("sc-goal", "3");
    setValue("sc-goal", "30");
    setValue("sc-goal", "3000");
    expect(callsOf("savings_calculator_goal_result")).toHaveLength(0); // aún escribiendo
    leavePanel("sc-goal");
    leavePanel("sc-goal");
    setValue("sc-goal", "3500");
    leavePanel("sc-goal");
    expect(callsOf("savings_calculator_goal_result")).toEqual([["savings_calculator_goal_result", context(locale)]]);
  });

  it("savings_calculator_goal_result: no se envía sin margen positivo", () => {
    renderCalculator(locale);
    openGoal(locale);
    setValue("sc-goal", "3000");
    setValue("sc-variable", "2500"); // déficit: no hay resultado de objetivo
    leavePanel("sc-variable");
    expect(callsOf("savings_calculator_goal_result")).toHaveLength(0);
    expect(callsOf("savings_calculator_calculate")).toHaveLength(1);
  });

  it("click_tool_to_app: un solo evento por clic real, con source fijo; el doble clic y los re-render no lo duplican", () => {
    vi.useFakeTimers();
    try {
      const { rerender } = renderCalculator(locale);
      setValue("sc-income", "2500"); // el CTA cambia de texto, el source no
      const link = cta(locale);
      fireEvent.click(link);
      fireEvent.click(link);
      rerender(tree(locale));
      fireEvent.click(cta(locale));
      expect(callsOf("click_tool_to_app")).toEqual([["click_tool_to_app", { ...context(locale), source: "calculadora_ahorro" }]]);
      act(() => {
        vi.advanceTimersByTime(2500);
      });
      fireEvent.click(cta(locale)); // otro clic real, pasado el margen de doble clic
      expect(callsOf("click_tool_to_app")).toHaveLength(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("el source del CTA no depende del resultado (déficit y superávit envían el mismo)", () => {
    renderCalculator(locale);
    setValue("sc-variable", "2500");
    fireEvent.click(cta(locale));
    expect(callsOf("click_tool_to_app")[0][1]).toMatchObject({ source: "calculadora_ahorro" });
  });

  it("ningún payload contiene importes, porcentajes, plazos, estados ni rangos derivados", () => {
    renderCalculator(locale);
    setValue("sc-income", "2100");
    setValue("sc-fixed", "901");
    setValue("sc-variable", "433");
    openGoal(locale);
    setValue("sc-goal", "7777");
    setValue("sc-months", "17");
    leavePanel("sc-months");
    fireEvent.click(cta(locale));

    const allowedKeys = new Set(["tool_name", "page_path", "page_title", "source"]);
    for (const [name, payload] of trackMock.mock.calls) {
      for (const key of Object.keys(payload as object)) {
        expect(allowedKeys.has(key), `${name}.${key}`).toBe(true);
      }
      if (name !== "click_tool_to_app") expect(Object.keys(payload as object)).not.toContain("source");
    }
    const serialized = JSON.stringify(trackMock.mock.calls);
    for (const forbidden of ["2100", "901", "433", "7777", "17", "has_goal", "has_deadline", "result_status", "income_range", "cta_location", "deficit", "surplus"]) {
      expect(serialized).not.toContain(forbidden);
    }
    expect(new Set(names())).toEqual(
      new Set(["tool_viewed", "use_savings_calculator", "savings_calculator_calculate", "savings_calculator_goal_result", "click_tool_to_app"])
    );
  });
});

describe("SavingsCalculator analytics sin consentimiento (el módulo no entrega nada)", () => {
  it("no marca eventos como enviados: tras aceptar, la siguiente interacción sí se registra y solo una vez", () => {
    delivered = false;
    renderCalculator("es");
    setValue("sc-income", "2100");
    leavePanel();
    delivered = true;
    setValue("sc-income", "2200");
    leavePanel();
    leavePanel();
    const sent = trackMock.mock.calls.map((c, i) => ({ name: c[0], ok: trackMock.mock.results[i].value }));
    expect(sent.filter((d) => d.ok && d.name === "use_savings_calculator")).toHaveLength(1);
    expect(sent.filter((d) => d.ok && d.name === "savings_calculator_calculate")).toHaveLength(1);
    expect(sent.filter((d) => d.ok && d.name === "tool_viewed")).toHaveLength(0); // la visualización previa al consentimiento no se reenvía
  });
});
