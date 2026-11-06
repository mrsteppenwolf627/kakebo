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

import SavingsCalculatorPage from "@/app/[locale]/(public)/herramientas/calculadora-ahorro/page";
import { getProvinciasPiloto } from "@/lib/vivienda";

afterEach(() => cleanup());

async function hrefsFor(locale: "es" | "en") {
  const ui = await SavingsCalculatorPage({ params: Promise.resolve({ locale }) });
  const { container } = render(
    <NextIntlClientProvider locale={locale} messages={locale === "en" ? enMessages : esMessages}>
      {ui}
    </NextIntlClientProvider>,
  );
  return Array.from(container.querySelectorAll("a")).map((a) => a.getAttribute("href") ?? "");
}

describe("calculadora de ahorro enlaza al piloto de entrada de vivienda", () => {
  it("la versión en español enlaza a las 12 provincias piloto, sin prefijo /es/", async () => {
    const hrefs = await hrefsFor("es");
    const expected = getProvinciasPiloto().map((p) => `/ahorro-entrada-vivienda/${p.slug}`);
    expect(expected).toHaveLength(12);
    for (const href of expected) expect(hrefs).toContain(href);
    expect(hrefs.some((h) => h.startsWith("/es/"))).toBe(false);
  });

  it("la versión en inglés no enlaza al piloto (solo existe en español)", async () => {
    const hrefs = await hrefsFor("en");
    expect(hrefs.some((h) => h.includes("ahorro-entrada-vivienda"))).toBe(false);
  });
});
