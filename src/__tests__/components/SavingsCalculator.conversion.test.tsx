import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import esMessages from "../../../messages/es.json";
import enMessages from "../../../messages/en.json";

const trackMock = vi.fn();
vi.mock("@/lib/analytics", () => ({ analytics: { track: (...args: unknown[]) => (trackMock(...args), true) } }));
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
const renderCalculator = (locale: Locale) =>
  render(
    <NextIntlClientProvider locale={locale} messages={messagesFor(locale)}>
      <SavingsCalculator />
    </NextIntlClientProvider>
  );
const setValue = (id: string, value: string) => fireEvent.change(document.getElementById(id) as HTMLInputElement, { target: { value } });
const field = (id: string) => document.getElementById(id) as HTMLInputElement;
const callsOf = (name: string) => trackMock.mock.calls.filter((c) => c[0] === name);
const text = () => document.body.textContent ?? "";
const strip = (s: string) => s.replace(/ /g, " ");

beforeEach(() => trackMock.mockClear());
afterEach(() => cleanup());

describe.each(["es", "en"] as const)("calculadora de ahorro: flujo de conversión (%s)", (locale) => {
  const m = messagesFor(locale).Tools.Savings;

  it("explica que los valores iniciales son un ejemplo y que los importes no se guardan ni se envían", () => {
    renderCalculator(locale);
    expect(screen.getByText(m.inputs.exampleNote)).toBeTruthy();
    expect(screen.getByText(m.inputs.privacyNote)).toBeTruthy();
  });

  it("cálculo normal: resume el margen y la tasa en una frase y conserva 700 € / 35 %", () => {
    renderCalculator(locale);
    const summary = m.results.summary.replace("{margin}", locale === "es" ? "700 €" : "€700").replace("{rate}", "35");
    expect(strip(text())).toContain(summary);
  });

  it("déficit: la frase y el CTA son específicos del déficit", () => {
    renderCalculator(locale);
    setValue("sc-variable", "1500");
    const summary = m.results.summaryDeficit.replace("{deficit}", locale === "es" ? "300 €" : "€300");
    expect(strip(text())).toContain(summary);
    expect(screen.getByText(m.results.ctaDeficit)).toBeTruthy();
    expect(screen.queryByText(m.results.ctaGood)).toBeNull();
  });

  it.each([
    ["good", "sc-variable", "500", "ctaGood"],
    ["below_target", "sc-variable", "1000", "ctaBelowTarget"],
    ["tight", "sc-variable", "1100", "ctaTight"],
    ["zero", "sc-variable", "1200", "ctaZero"],
  ] as const)("el CTA contextual para el estado %s", (_state, id, value, key) => {
    renderCalculator(locale);
    setValue(id, value);
    expect(screen.getByText(m.results[key])).toBeTruthy();
  });

  it("el CTA sigue visible tras calcular, indica que el resultado no exige registro y mantiene su nombre accesible", () => {
    renderCalculator(locale);
    setValue("sc-income", "2500");
    const cta = screen.getByRole("link", { name: m.results.ctaButton });
    expect(cta.getAttribute("href")).toBe("/login?mode=signup&source=calculadora_ahorro");
    expect(screen.getByText(m.results.ctaNote)).toBeTruthy();
  });

  it("objetivo con plazo: muestra el ahorro mensual necesario y la ayuda del objetivo", () => {
    renderCalculator(locale);
    fireEvent.click(screen.getByRole("button", { name: m.inputs.goalToggle }));
    expect(screen.getByText(m.inputs.goalHint)).toBeTruthy();
    setValue("sc-goal", "3000");
    setValue("sc-months", "6");
    expect(strip(text())).toContain(locale === "es" ? "500 €" : "€500");
    expect(text()).toContain(m.results.goalNeeded);
    expect(document.getElementById("sc-months-error")).toBeNull();
  });

  it("objetivo sin plazo: calcula solo el tiempo estimado y avisa de cómo ver el ahorro mensual", () => {
    renderCalculator(locale);
    fireEvent.click(screen.getByRole("button", { name: m.inputs.goalToggle }));
    setValue("sc-goal", "3500");
    setValue("sc-months", "");
    expect(text()).toContain(m.results.goalMonths);
    expect(text()).not.toContain(m.results.goalNeeded);
    const error = document.getElementById("sc-months-error") as HTMLElement;
    expect(error.textContent).toBe(m.inputs.errorMonths);
    expect(field("sc-months").getAttribute("aria-invalid")).toBe("true");
    expect(field("sc-months").getAttribute("aria-describedby")).toContain("sc-months-error");
  });

  it("validación: importes negativos muestran un error accesible sin cambiar el cálculo", () => {
    renderCalculator(locale);
    setValue("sc-fixed", "-100");
    const error = document.getElementById("sc-fixed-error") as HTMLElement;
    expect(error.getAttribute("role")).toBe("alert");
    expect(error.textContent).toBe(m.inputs.errorNegative);
    expect(field("sc-fixed").getAttribute("aria-invalid")).toBe("true");
    expect(field("sc-fixed").getAttribute("aria-describedby")).toBe("sc-fixed-desc sc-fixed-error");
    // misma fórmula: 2000 − (−100) − 500
    expect(strip(text())).toContain(locale === "es" ? "1600 €" : "€1,600");
    expect(strip(text())).not.toContain("-5%");
    setValue("sc-fixed", "800");
    expect(document.getElementById("sc-fixed-error")).toBeNull();
    expect(field("sc-fixed").getAttribute("aria-invalid")).toBe("false");
  });

  it("todos los campos tienen label asociado y hay un único H1", () => {
    renderCalculator(locale);
    for (const id of ["sc-income", "sc-fixed", "sc-variable"]) {
      expect(document.querySelector(`label[for="${id}"]`)).toBeTruthy();
    }
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("el botón «ver resultado» mueve el foco a la región de resultados (con nombre accesible)", () => {
    renderCalculator(locale);
    const region = screen.getByRole("region", { name: m.results.regionLabel });
    fireEvent.click(screen.getByRole("button", { name: m.inputs.seeResult }));
    expect(document.activeElement).toBe(region);
  });

  it("analítica: los eventos se disparan una sola vez por interacción y sin datos financieros", () => {
    renderCalculator(locale);
    setValue("sc-income", "2468");
    setValue("sc-fixed", "731");
    fireEvent.blur(field("sc-fixed"));
    fireEvent.blur(field("sc-fixed"));
    fireEvent.click(screen.getByRole("button", { name: m.inputs.seeResult }));
    fireEvent.click(screen.getByRole("link", { name: m.results.ctaButton }));
    expect(callsOf("tool_viewed")).toHaveLength(1);
    expect(callsOf("use_savings_calculator")).toHaveLength(1);
    expect(callsOf("savings_calculator_calculate")).toHaveLength(1);
    expect(callsOf("click_tool_to_app")).toHaveLength(1);
    const allowed = new Set(["tool_name", "page_path", "page_title", "source"]);
    for (const [, params] of trackMock.mock.calls) {
      for (const key of Object.keys(params as object)) expect(allowed.has(key)).toBe(true);
      expect(JSON.stringify(params)).not.toMatch(/2468|731|\b35\b/);
    }
  });
});

describe("la versión inglesa no muestra los textos nuevos en español", () => {
  it("ninguna cadena nueva de es.json aparece en la vista EN", () => {
    renderCalculator("en");
    fireEvent.click(screen.getByRole("button", { name: enMessages.Tools.Savings.inputs.goalToggle }));
    setValue("sc-goal", "3000");
    setValue("sc-months", "");
    setValue("sc-fixed", "-5");
    const es = esMessages.Tools.Savings;
    for (const s of [es.inputs.exampleNote, es.inputs.privacyNote, es.inputs.goalHint, es.inputs.errorMonths, es.inputs.errorNegative, es.results.ctaNote]) {
      expect(text()).not.toContain(s);
    }
    expect(text()).not.toMatch(/[áéíóúñ¿¡]/i);
  });
});
