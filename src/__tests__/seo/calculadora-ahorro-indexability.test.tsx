import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { NextIntlClientProvider, createTranslator } from "next-intl";
import esMessages from "../../../messages/es.json";
import enMessages from "../../../messages/en.json";

vi.mock("next-intl/server", () => ({
  getTranslations: async ({ locale, namespace }: { locale: string; namespace: string }) =>
    createTranslator({ locale, namespace: namespace as never, messages: (locale === "en" ? enMessages : esMessages) as never }),
  getMessages: async ({ locale }: { locale: string }) => (locale === "en" ? enMessages : esMessages),
}));
vi.mock("@/i18n/routing", () => ({
  routing: { locales: ["en", "es"] },
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("@/components/landing/Navbar", () => ({ Navbar: () => null }));
vi.mock("@/components/landing/tools/SavingsCalculator", () => ({ SavingsCalculator: () => <div data-testid="calculator" /> }));
vi.mock("@/components/i18n/ToolMessages", () => ({
  ToolMessages: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { generateMetadata } from "@/app/[locale]/(public)/herramientas/calculadora-ahorro/page";
import SavingsCalculatorPage from "@/app/[locale]/(public)/herramientas/calculadora-ahorro/page";
import sitemap from "@/app/sitemap";

afterEach(() => cleanup());

const BASE = "https://www.metodokakebo.com";
const ES_URL = `${BASE}/herramientas/calculadora-ahorro`;
const EN_URL = `${BASE}/en/herramientas/calculadora-ahorro`;

const metadataFor = (locale: "es" | "en") => generateMetadata({ params: Promise.resolve({ locale }) });

describe("calculadora de ahorro: indexabilidad verificable desde código", () => {
  it.each([
    ["es", ES_URL],
    ["en", EN_URL],
  ] as const)("canonical propio (autorreferente) en %s", async (locale, url) => {
    const meta = await metadataFor(locale);
    expect(meta.alternates?.canonical).toBe(url);
  });

  it("hreflang recíproco: ambas variantes declaran es, en y x-default con las mismas URLs", async () => {
    const es = await metadataFor("es");
    const en = await metadataFor("en");
    const expected = { es: ES_URL, en: EN_URL, "x-default": ES_URL };
    expect(es.alternates?.languages).toEqual(expected);
    expect(en.alternates?.languages).toEqual(expected);
  });

  it("no declara robots restrictivos a nivel de página (el robots global solo es noindex fuera de producción)", async () => {
    for (const locale of ["es", "en"] as const) {
      const meta = await metadataFor(locale);
      expect(meta.robots).toBeUndefined();
    }
  });

  it("sitemap incluye ES y EN con alternates idénticos y sin duplicados", () => {
    const entries = sitemap().filter((e) => e.url === ES_URL || e.url === EN_URL);
    expect(entries.map((e) => e.url).sort()).toEqual([EN_URL, ES_URL].sort());
    for (const entry of entries) {
      expect(entry.alternates?.languages).toEqual({ "x-default": ES_URL, en: EN_URL, es: ES_URL });
    }
    const all = sitemap().map((e) => e.url);
    expect(new Set(all).size).toBe(all.length);
  });

  it.each(["es", "en"] as const)("los enlaces internos de la página son <a href> rastreables en %s", async (locale) => {
    const ui = await SavingsCalculatorPage({ params: Promise.resolve({ locale }) });
    const { container } = render(
      <NextIntlClientProvider locale={locale} messages={locale === "en" ? enMessages : esMessages}>
        {ui}
      </NextIntlClientProvider>
    );
    const anchors = Array.from(container.querySelectorAll("a"));
    expect(anchors.length).toBeGreaterThan(0);
    for (const a of anchors) {
      const href = a.getAttribute("href") ?? "";
      expect(href, "enlace sin href").not.toBe("");
      expect(href).not.toMatch(/^(javascript:|#$)/);
      expect(a.textContent?.trim().length, `enlace sin texto: ${href}`).toBeGreaterThan(0);
    }
    expect(anchors.map((a) => a.getAttribute("href"))).toContain("/sobre-nosotros");
  });
});

describe("calculadora de ahorro: metadatos SEO por idioma", () => {
  it("EN: title y description describen la calculadora de margen real", async () => {
    const meta = await metadataFor("en");
    expect(meta.title).toBe("Monthly Savings Calculator: Real Savings Margin | Kakebo");
    expect(meta.description).toBe(
      "Calculate your real monthly savings margin from net income and fixed and variable expenses. Set a savings goal and estimate the time needed. Free."
    );
  });

  it("ES: title y description originales sin cambios", async () => {
    const meta = await metadataFor("es");
    expect(meta.title).toBe("Calculadora de Ahorro Mensual Gratis");
    expect(meta.description).toBe(
      "Calcula tu margen de ahorro real: ingresos menos gastos fijos y variables. También cuánto tiempo necesitas para tu objetivo. Gratis, sin registro."
    );
  });

  it("canonical y hreflang no cambian", async () => {
    const en = await metadataFor("en");
    const es = await metadataFor("es");
    expect(en.alternates?.canonical).toBe(EN_URL);
    expect(es.alternates?.canonical).toBe(ES_URL);
    const expected = { es: ES_URL, en: EN_URL, "x-default": ES_URL };
    expect(en.alternates?.languages).toEqual(expected);
    expect(es.alternates?.languages).toEqual(expected);
  });
});
