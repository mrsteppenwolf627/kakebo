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

  it("savings_calculator_calculate: primer cálculo válido, un evento; blur repetidos, re-render y salir sin cambios no añaden", () => {
    const { rerender } = renderCalculator(locale);
    setValue("sc-income", "2100");
    leavePanel();
    expect(callsOf("savings_calculator_calculate")).toEqual([["savings_calculator_calculate", context(locale)]]);
    leavePanel();
    leavePanel("sc-fixed");
    rerender(tree(locale));
    rerender(tree(locale));
    leavePanel();
    expect(callsOf("savings_calculator_calculate")).toHaveLength(1);
  });

  it("savings_calculator_calculate: modificar un campo y volver a completar emite un segundo evento", () => {
    renderCalculator(locale);
    setValue("sc-income", "2100");
    leavePanel();
    setValue("sc-fixed", "901");
    expect(callsOf("savings_calculator_calculate")).toHaveLength(1); // aún editando
    fireEvent.blur(document.getElementById("sc-fixed") as HTMLInputElement, { relatedTarget: document.getElementById("sc-variable") });
    expect(callsOf("savings_calculator_calculate")).toHaveLength(1); // blur entre campos
    leavePanel("sc-variable");
    expect(callsOf("savings_calculator_calculate")).toHaveLength(2);
  });

  it("savings_calculator_calculate: tres ciclos de modificación y cálculo emiten tres eventos (con varias pulsaciones por ciclo)", () => {
    renderCalculator(locale);
    for (const [id, values] of [
      ["sc-income", ["2", "21", "210", "2100"]],
      ["sc-fixed", ["9", "90", "901"]],
      ["sc-variable", ["4", "43", "433"]],
    ] as const) {
      for (const v of values) setValue(id, v);
      leavePanel(id);
      leavePanel(id);
    }
    expect(callsOf("savings_calculator_calculate")).toHaveLength(3);
    expect(callsOf("use_savings_calculator")).toHaveLength(1);
  });

  it("savings_calculator_calculate: «Ver mi resultado» completa el ciclo y el blur posterior no lo repite", () => {
    renderCalculator(locale);
    setValue("sc-income", "2100");
    fireEvent.click(screen.getByRole("button", { name: labels(locale).inputs.seeResult }));
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

  it("savings_calculator_goal_result: cero eventos con el objetivo a medio escribir; uno al completarlo", () => {
    renderCalculator(locale);
    openGoal(locale);
    setValue("sc-goal", "3");
    setValue("sc-goal", "30");
    expect(callsOf("savings_calculator_goal_result")).toHaveLength(0);
    setValue("sc-goal", "3000");
    expect(callsOf("savings_calculator_goal_result")).toHaveLength(0);
    leavePanel("sc-goal");
    leavePanel("sc-goal");
    expect(callsOf("savings_calculator_goal_result")).toEqual([["savings_calculator_goal_result", context(locale)]]);
  });

  it("savings_calculator_goal_result: cambiar el objetivo o el plazo y completar otro resultado emite otro evento; cambiar solo ingresos no", () => {
    renderCalculator(locale);
    openGoal(locale);
    setValue("sc-goal", "3000");
    leavePanel("sc-goal");
    expect(callsOf("savings_calculator_goal_result")).toHaveLength(1);
    setValue("sc-income", "2200"); // modifica el cálculo, no el objetivo
    leavePanel();
    expect(callsOf("savings_calculator_goal_result")).toHaveLength(1);
    expect(callsOf("savings_calculator_calculate")).toHaveLength(2);
    setValue("sc-goal", "3500");
    leavePanel("sc-goal");
    expect(callsOf("savings_calculator_goal_result")).toHaveLength(2);
    setValue("sc-months", "18");
    leavePanel("sc-months");
    expect(callsOf("savings_calculator_goal_result")).toHaveLength(3);
  });

  it("savings_calculator_goal_result: objetivo con plazo válido, un evento", () => {
    renderCalculator(locale);
    openGoal(locale);
    setValue("sc-goal", "3000");
    setValue("sc-months", "12");
    leavePanel("sc-months");
    expect(callsOf("savings_calculator_goal_result")).toEqual([["savings_calculator_goal_result", context(locale)]]);
  });

  it("savings_calculator_goal_result: objetivo sin plazo con meses estimados, un evento (y sin repetir)", () => {
    const { rerender } = renderCalculator(locale);
    openGoal(locale);
    setValue("sc-goal", "3500");
    setValue("sc-months", "");
    leavePanel("sc-months");
    leavePanel("sc-months");
    rerender(tree(locale));
    leavePanel("sc-goal");
    expect(callsOf("savings_calculator_goal_result")).toEqual([["savings_calculator_goal_result", context(locale)]]);
  });

  it("savings_calculator_goal_result: objetivo sin plazo vacío, parcial, cero o negativo: cero eventos", () => {
    renderCalculator(locale);
    openGoal(locale);
    setValue("sc-months", "");
    leavePanel("sc-months"); // objetivo vacío
    setValue("sc-goal", "0");
    leavePanel("sc-goal");
    setValue("sc-goal", "-3000");
    leavePanel("sc-goal");
    expect(callsOf("savings_calculator_goal_result")).toHaveLength(0);
  });

  it("savings_calculator_goal_result: sin plazo, cambiar el objetivo y recalcular emite un segundo evento", () => {
    renderCalculator(locale);
    openGoal(locale);
    setValue("sc-months", "");
    setValue("sc-goal", "3000");
    leavePanel("sc-goal");
    setValue("sc-goal", "6000");
    leavePanel("sc-goal");
    expect(callsOf("savings_calculator_goal_result")).toHaveLength(2);
  });

  it("savings_calculator_goal_result: pasar de sin plazo a un plazo (y cambiarlo) emite un evento por cambio", () => {
    renderCalculator(locale);
    openGoal(locale);
    setValue("sc-months", "");
    setValue("sc-goal", "3000");
    leavePanel("sc-goal");
    setValue("sc-months", "12");
    leavePanel("sc-months");
    setValue("sc-months", "18");
    leavePanel("sc-months");
    expect(callsOf("savings_calculator_goal_result")).toHaveLength(3);
  });

  it("savings_calculator_goal_result: un plazo escrito e inválido (fuera de rango, decimal, negativo) no emite; uno válido después sí", () => {
    renderCalculator(locale);
    openGoal(locale);
    setValue("sc-goal", "3000");
    for (const bad of ["0", "300", "241", "2.5", "-4"]) {
      setValue("sc-months", bad);
      leavePanel("sc-months");
      leavePanel("sc-months");
    }
    expect(callsOf("savings_calculator_goal_result")).toHaveLength(0);
    setValue("sc-months", "12");
    leavePanel("sc-months");
    leavePanel("sc-months");
    expect(callsOf("savings_calculator_goal_result")).toHaveLength(1);
  });

  it.each(["1", "240"])("savings_calculator_goal_result: los límites del plazo (%s) son válidos", (limit) => {
    renderCalculator(locale);
    openGoal(locale);
    setValue("sc-goal", "3000");
    setValue("sc-months", limit);
    leavePanel("sc-months");
    expect(callsOf("savings_calculator_goal_result")).toHaveLength(1);
  });

  it("el plazo 0 se distingue del vacío: 0 muestra el error de plazo y no emite; vaciar el campo (sin plazo) sí emite", () => {
    renderCalculator(locale);
    openGoal(locale);
    setValue("sc-goal", "3000");
    setValue("sc-months", "0");
    leavePanel("sc-months");
    expect((document.getElementById("sc-months") as HTMLInputElement).value).toBe("0");
    expect(callsOf("savings_calculator_goal_result")).toHaveLength(0);
    setValue("sc-months", "");
    leavePanel("sc-months");
    expect((document.getElementById("sc-months") as HTMLInputElement).value).toBe("");
    expect(callsOf("savings_calculator_goal_result")).toHaveLength(1);
    expect(JSON.stringify(trackMock.mock.calls)).not.toMatch(/3000|"0"/);
  });

  it("savings_calculator_goal_result: sin plazo en déficit o sin ingresos, cero eventos", () => {
    renderCalculator(locale);
    openGoal(locale);
    setValue("sc-months", "");
    setValue("sc-goal", "3000");
    setValue("sc-variable", "2500");
    leavePanel("sc-variable");
    expect(callsOf("savings_calculator_goal_result")).toHaveLength(0);
    setValue("sc-variable", "500");
    setValue("sc-income", "0");
    leavePanel();
    expect(callsOf("savings_calculator_goal_result")).toHaveLength(0);
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
  it("no se envía nada y no se cierra el ciclo: tras aceptar, el siguiente cálculo completado se registra una sola vez", () => {
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
