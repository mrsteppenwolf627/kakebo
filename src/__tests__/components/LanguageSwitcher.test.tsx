import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

/**
 * El selector de idioma debe ser un <a href> real (aparece en el HTML estático y lo siguen los rastreadores).
 * Se usa el Link real de next-intl; solo se simula la ruta actual de next/navigation.
 */
const nav = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), prefetch: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
  permanentRedirect: vi.fn(),
  notFound: vi.fn(),
}));

import LanguageSwitcher from "@/components/LanguageSwitcher";

afterEach(cleanup);

const show = (locale: "es" | "en", pathname: string) => {
  nav.pathname = pathname;
  render(
    <NextIntlClientProvider locale={locale} messages={{}}>
      <LanguageSwitcher />
    </NextIntlClientProvider>,
  );
};

describe("LanguageSwitcher: enlace real a la versión equivalente", () => {
  it.each([
    ["es", "/", "/en"],
    ["es", "/blog", "/en/blog"],
    ["es", "/herramientas/calculadora-ahorro", "/en/herramientas/calculadora-ahorro"],
    ["es", "/blog/metodo-kakebo-guia-definitiva", "/en/blog/metodo-kakebo-guia-definitiva"],
    ["en", "/en", "/"],
    ["en", "/en/blog", "/blog"],
    ["en", "/en/herramientas/calculadora-ahorro", "/herramientas/calculadora-ahorro"],
  ] as const)("%s %s → <a href=%s>", (locale, pathname, href) => {
    show(locale, pathname);
    const link = screen.getByRole("link");
    expect(link.tagName).toBe("A");
    expect(link.getAttribute("href")).toBe(href);
    expect(link.getAttribute("hreflang")).toBe(locale === "es" ? "en" : "es");
    expect(link.getAttribute("aria-label")).toBe(locale === "es" ? "ES - Cambiar a inglés" : "EN - Switch to Spanish");
    expect(link.textContent).toBe(locale === "es" ? "ES" : "EN");
  });

  it.each(["/plantillas/kakebo-2027", "/ahorro-entrada-vivienda/madrid", "/blog/cuentas-remuneradas", "/blog/kakebo-vs-ynab"])(
    "%s (sin EN enlazable) conserva el botón, sin enlaces a /en",
    (pathname) => {
      show("es", pathname);
      expect(screen.queryByRole("link")).toBeNull();
      const btn = screen.getByRole("button");
      expect(btn.getAttribute("aria-label")).toBe("ES - Cambiar a inglés");
    },
  );

  it("desde EN siempre enlaza a la versión ES", () => {
    show("en", "/en/blog/kakebo-vs-ynab");
    expect(screen.getByRole("link").getAttribute("href")).toBe("/blog/kakebo-vs-ynab");
  });
});
