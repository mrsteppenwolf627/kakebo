import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent, act } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import esMessages from "../../../messages/es.json";
import enMessages from "../../../messages/en.json";
import { CONSENT_KEY } from "@/lib/consent";
import { analytics, sanitizeSavingsCalculatorProperties } from "@/lib/analytics";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { CookieBanner } from "@/components/landing/CookieBanner";
import { SavingsCalculator } from "@/components/landing/tools/SavingsCalculator";

// Cadena real: banner → consentimiento → GoogleAnalytics → analytics.track → gtag/dataLayer, con la calculadora real.
vi.mock("next/script", () => ({
  default: ({ src, id }: { src?: string; id?: string }) => <span data-testid="ga-script" data-src={src ?? ""} data-id={id ?? ""} />,
}));
vi.mock("@/i18n/routing", () => ({
  Link: ({ href, children, onClick, ...rest }: { href: string; children: React.ReactNode; onClick?: () => void; [key: string]: unknown }) => (
    <a href={href} onClick={onClick} {...rest}>
      {children}
    </a>
  ),
}));

type Locale = "es" | "en";
const GA_ID = "G-TEST123";
const messagesFor = (l: Locale) => (l === "en" ? enMessages : esMessages);
const App = ({ locale }: { locale: Locale }) => (
  <NextIntlClientProvider locale={locale} messages={messagesFor(locale)}>
    <GoogleAnalytics />
    <CookieBanner />
    <SavingsCalculator />
  </NextIntlClientProvider>
);
const setValue = (id: string, value: string) => fireEvent.change(document.getElementById(id) as HTMLInputElement, { target: { value } });
const events = () =>
  ((window.dataLayer ?? []) as unknown[])
    .map((entry) => Array.from(entry as ArrayLike<unknown>))
    .filter((args) => args[0] === "event")
    .map((args) => ({ name: args[1] as string, params: args[2] as Record<string, unknown> }));
const scripts = () => document.querySelectorAll('[data-testid="ga-script"]').length;

function use(locale: Locale) {
  setValue("sc-income", "2468");
  setValue("sc-fixed", "731");
  fireEvent.blur(document.getElementById("sc-fixed") as HTMLInputElement);
  fireEvent.click(screen.getByRole("link", { name: messagesFor(locale).Tools.Savings.results.ctaButton }));
}

beforeEach(() => {
  window.localStorage.clear();
  delete window.gtag;
  delete window.dataLayer;
  vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", GA_ID);
  window.history.pushState({}, "", "/herramientas/calculadora-ahorro");
});
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe.each(["es", "en"] as const)("embudo de la calculadora y consentimiento (%s)", (locale) => {
  const m = messagesFor(locale).CookieBanner;

  it("primera visita: sin script de Analytics, sin gtag y sin eventos, aunque se use la calculadora", () => {
    render(<App locale={locale} />);
    use(locale);
    expect(scripts()).toBe(0);
    expect(window.gtag).toBeUndefined();
    expect(window.dataLayer).toBeUndefined();
  });

  it("rechazo y recarga tras rechazo: cero scripts, cero gtag, cero eventos", () => {
    render(<App locale={locale} />);
    fireEvent.click(screen.getByRole("button", { name: m.reject }));
    use(locale);
    cleanup();
    render(<App locale={locale} />); // recarga
    use(locale);
    expect(window.localStorage.getItem(CONSENT_KEY)).toBe("false");
    expect(scripts()).toBe(0);
    expect(window.gtag).toBeUndefined();
    expect(window.dataLayer).toBeUndefined();
  });

  it("aceptación: el script de Analytics aparece solo después de aceptar y solo salen eventos permitidos, uno de cada", () => {
    render(<App locale={locale} />);
    expect(scripts()).toBe(0);
    fireEvent.click(screen.getByRole("button", { name: m.accept }));
    expect(scripts()).toBeGreaterThan(0);
    use(locale);
    fireEvent.click(screen.getByRole("link", { name: messagesFor(locale).Tools.Savings.results.ctaButton })); // doble clic
    const sent = events();
    expect(sent.map((e) => e.name)).toEqual(["use_savings_calculator", "savings_calculator_calculate", "click_tool_to_app"]);
    for (const e of sent) {
      expect(Object.keys(e.params).sort()).toEqual(e.name === "click_tool_to_app" ? ["page_path", "page_title", "source", "tool_name"] : ["page_path", "page_title", "tool_name"]);
    }
    expect(JSON.stringify([window.dataLayer, { ...window.localStorage }, document.cookie, location.href])).not.toMatch(/2468|731/);
  });

  it("recarga tras aceptación: se carga Analytics y se emite tool_viewed una sola vez", () => {
    window.localStorage.setItem(CONSENT_KEY, "true");
    render(<App locale={locale} />);
    expect(scripts()).toBeGreaterThan(0);
    expect(events().map((e) => e.name)).toEqual(["tool_viewed"]);
  });

  it("aceptar con la calculadora ya abierta no reenvía la visualización ni los usos anteriores", () => {
    render(<App locale={locale} />);
    setValue("sc-income", "2200"); // antes de aceptar: no se envía ni se guarda nada
    fireEvent.blur(document.getElementById("sc-income") as HTMLInputElement);
    expect(window.dataLayer).toBeUndefined();
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: m.accept }));
    });
    expect(events()).toEqual([]);
  });
});

describe("el módulo de analítica protege el contrato de la calculadora de ahorro", () => {
  it("descarta cualquier parámetro que no sea tool_name, page_path o page_title (y source solo en el CTA)", () => {
    const dirty = { tool_name: "calculadora_ahorro", page_path: "/x", page_title: "t", income: 1, margin_range: "a", has_goal: true, source: "calculadora_ahorro" };
    expect(sanitizeSavingsCalculatorProperties("savings_calculator_calculate", dirty)).toEqual({ tool_name: "calculadora_ahorro", page_path: "/x", page_title: "t" });
    expect(sanitizeSavingsCalculatorProperties("click_tool_to_app", dirty)).toEqual({ tool_name: "calculadora_ahorro", page_path: "/x", page_title: "t", source: "calculadora_ahorro" });
    expect(sanitizeSavingsCalculatorProperties("tool_viewed", dirty)).toEqual({ tool_name: "calculadora_ahorro", page_path: "/x", page_title: "t" });
  });

  it("no toca los eventos de otras herramientas", () => {
    const other = { tool_name: "regla_50_30_20", mode: "x", income_bucket: 3 };
    expect(sanitizeSavingsCalculatorProperties("use_503020_calculator", other)).toBe(other);
  });

  it("track devuelve false sin consentimiento y true con consentimiento, y aplica el filtro al enviar", () => {
    expect(analytics.track("use_savings_calculator", { tool_name: "calculadora_ahorro", page_path: "/", page_title: "t" })).toBe(false);
    expect(window.gtag).toBeUndefined();
    window.localStorage.setItem(CONSENT_KEY, "true");
    expect(analytics.track("savings_calculator_calculate", { tool_name: "calculadora_ahorro", page_path: "/", page_title: "t", margin: 5 })).toBe(true);
    expect(events()[0].params).toEqual({ tool_name: "calculadora_ahorro", page_path: "/", page_title: "t" });
  });
});
