// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/i18n/routing", () => ({
  Link: ({ href, className, children }: { href: string; className?: string; children: ReactNode }) =>
    createElement("a", { href, className }, children),
}));

import Breadcrumbs from "@/components/seo/Breadcrumbs";
import * as S from "@/lib/seo/jsonld";

const text = (html: string) => html.replace(/<[^>]+>/g, "|").split("|").filter(Boolean);

describe("<Breadcrumbs/>", () => {
  const es = S.crumbs("es", [
    { name: "Herramientas", path: "/herramientas" },
    { name: "Calculadora de ahorro", path: "/herramientas/calculadora-ahorro" },
  ]);

  it("pinta exactamente los nombres de los items, separados por «/», con aria-label localizado", () => {
    const html = renderToStaticMarkup(createElement(Breadcrumbs, { items: es, locale: "es" }));
    expect(html).toContain('aria-label="Migas de pan"');
    expect(text(html)).toEqual(["Inicio", "/", "Herramientas", "/", "Calculadora de ahorro"]);
  });

  it("la última miga no es enlace y lleva aria-current=page; el resto enlazan sin duplicar el prefijo de idioma", () => {
    const en = S.crumbs("en", [{ name: "Tools", path: "/herramientas" }, { name: "Savings calculator", path: "/herramientas/calculadora-ahorro" }]);
    const html = renderToStaticMarkup(createElement(Breadcrumbs, { items: en, locale: "en" }));
    expect(html).toContain('aria-label="Breadcrumb"');
    expect(html).toContain('<li aria-current="page">Savings calculator</li>');
    expect(html).toContain('<a href="/" class="hover:text-primary hover:underline">Home</a>');
    expect(html).toContain('href="/herramientas"');
    expect(html).not.toContain("/en/");
    expect(html.match(/<a /g)).toHaveLength(2);
  });

  it("acepta URLs absolutas de la raíz (Inicio → «/») y de /blog", () => {
    const html = renderToStaticMarkup(
      createElement(Breadcrumbs, {
        items: [
          { name: "Inicio", url: "https://www.metodokakebo.com" },
          { name: "Plantillas Kakebo", url: "https://www.metodokakebo.com/blog/plantilla-kakebo-excel" },
          { name: "Kakebo para imprimir", url: "https://www.metodokakebo.com/plantillas/kakebo-para-imprimir" },
        ],
        locale: "es",
      }),
    );
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/blog/plantilla-kakebo-excel"');
  });
});
