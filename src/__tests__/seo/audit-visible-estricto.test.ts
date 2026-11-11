// @vitest-environment node
import { describe, it, expect } from "vitest";
import { parseHtml, cleanDom, strictChecks } from "../../../scripts/lib/visible-estricto.mjs";

/**
 * Fixtures de la comprobación ESTRICTA del audit (scripts/audit-jsonld-visible.mjs): el JSON-LD se contrasta con el bloque
 * visible de su tipo (miga, FAQ), no con una subcadena de toda la página. Solo prueba el script; no toca el sitio.
 */

const HEADER = `<header class="fixed top-0 left-0 z-[100]"><nav><a href="/">Inicio</a><a href="/blog">Blog</a></nav></header>`;
const FOOTER = `<footer class="relative border-t border-border"><a href="/">Inicio</a></footer>`;
const wrap = (body: string) => `<html><body>${HEADER}<main>${body}</main>${FOOTER}<noscript>Inicio</noscript><script>{"x":"Inicio"}</script></body></html>`;
const rows = (html: string, graph: unknown) => strictChecks(graph, cleanDom(parseHtml(html))) as Array<{ type: string; prop: string; value: string; visible: boolean; where: string }>;
const crumbs = (...names: string[]) => [{ "@type": "BreadcrumbList", itemListElement: names.map((name, i) => ({ "@type": "ListItem", position: i + 1, name })) }];
const faq = (q: string, a: string) => [{ "@type": "FAQPage", mainEntity: [{ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } }] }];

describe("audit estricto: BreadcrumbList", () => {
  it("«Inicio» solo en la cabecera/pie/noscript/script NO cuenta como visible", () => {
    const html = wrap(`<article><h1>Título</h1></article>`);
    const r = rows(html, crumbs("Inicio", "Blog", "Título"));
    const names = r.filter((x) => x.prop === "name");
    expect(names.map((x) => x.visible)).toEqual([false, false, false]);
    expect(names[0].where).toMatch(/no tiene <nav> de miga/);
  });

  it("una miga con el nav correcto pasa, con aria-current en el último", () => {
    const html = wrap(
      `<nav aria-label="Migas de pan"><ol><li><a href="/">Inicio</a></li><li aria-hidden="true">/</li><li><a href="/blog">Blog</a></li><li aria-hidden="true">/</li><li aria-current="page">Título</li></ol></nav><h1>Título</h1>`,
    );
    const r = rows(html, crumbs("Inicio", "Blog", "Título"));
    expect(r.filter((x) => x.prop === "name").map((x) => x.visible)).toEqual([true, true, true]);
    expect(r.find((x) => x.prop === "aria-current (último)")?.visible).toBe(true);
  });

  it("miga de clúster «Blog › pilar» (sin Inicio ni título): Inicio y título NO visibles y sin aria-current", () => {
    const html = wrap(`<nav aria-label="Migas de pan"><ol><li><a href="/blog">Blog</a></li><li>›</li><li><a href="/blog/pilar">Pilar</a></li></ol></nav><h1>Título</h1>`);
    const r = rows(html, crumbs("Inicio", "Blog", "Título"));
    expect(r.filter((x) => x.prop === "name").map((x) => x.visible)).toEqual([false, true, false]);
    expect(r.find((x) => x.prop === "aria-current (último)")?.visible).toBe(false);
  });

  it("el nombre debe coincidir carácter a carácter (mayúsculas incluidas)", () => {
    const html = wrap(`<nav aria-label="Breadcrumb"><ol><li>home</li><li aria-current="page">Tools</li></ol></nav>`);
    const r = rows(html, crumbs("Home", "Tools"));
    expect(r.filter((x) => x.prop === "name").map((x) => x.visible)).toEqual([false, true]);
  });
});

describe("audit estricto: FAQPage", () => {
  const Q = "¿Cuánto tarda?";
  const A = "Depende del importe y del plazo que elijas.";

  it("FAQ visible en un <details> pasa (pregunta y respuesta)", () => {
    const html = wrap(`<details><summary>${Q}</summary><p>${A}</p></details>`);
    expect(rows(html, faq(Q, A)).map((x) => x.visible)).toEqual([true, true]);
  });

  it("FAQ visible bajo un encabezado «Preguntas frecuentes» pasa", () => {
    const html = wrap(`<section><h2>Preguntas frecuentes</h2><h3>${Q}</h3><p>${A}</p></section><h2>Otra sección</h2>`);
    expect(rows(html, faq(Q, A)).map((x) => x.visible)).toEqual([true, true]);
  });

  it("FAQ NO visible en la página (solo en JSON-LD/cabecera) falla, aunque el texto exista fuera del bloque", () => {
    const html = wrap(`<h1>Guía</h1><p>${Q} ${A}</p>`);
    const r = rows(html, faq(Q, A));
    expect(r.map((x) => x.visible)).toEqual([false, false]);
    expect(r[0].where).toMatch(/sin bloque de FAQ visible/);
  });

  it("pregunta visible pero respuesta distinta a la del JSON-LD: la respuesta falla", () => {
    const html = wrap(`<details><summary>${Q}</summary><p>Otra cosa distinta.</p></details>`);
    expect(rows(html, faq(Q, A)).map((x) => x.visible)).toEqual([true, false]);
  });
});

describe("audit estricto: otros tipos", () => {
  it("WebApplication.name debe ser un encabezado; un nombre solo en la miga no cuenta", () => {
    const html = wrap(`<nav aria-label="Migas de pan"><ol><li aria-current="page">Mi calculadora</li></ol></nav><h1>Otra cosa</h1>`);
    const r = rows(html, [{ "@type": "WebApplication", name: "Mi calculadora" }]);
    expect(r[0].visible).toBe(false);
  });

  it("ItemList.ListItem.name se busca en enlaces/encabezados y HowTo.name en encabezados", () => {
    const html = wrap(`<h2>Cómo hacerlo</h2><ul><li><a href="/a">Entrada A</a></li></ul>`);
    const r = rows(html, [
      { "@type": "ItemList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Entrada A" }, { "@type": "ListItem", position: 2, name: "Entrada B" }] },
      { "@type": "HowTo", name: "Cómo hacerlo", step: [] },
      { "@type": "HowTo", name: "Cómo NO hacerlo", step: [] },
    ]);
    expect(r.map((x) => `${x.type}:${x.visible}`)).toEqual(["ItemList.ListItem:true", "ItemList.ListItem:false", "HowTo:true", "HowTo:false"]);
  });
});

describe("audit estricto: excepción de la home (WebApplication.name = nombre de producto del <title>)", () => {
  const html = wrap(`<h1>Kakebo Online: App de Control de Gastos</h1>`);
  const graph = [{ "@type": "WebApplication", name: "Kakebo AI" }];
  const run = (opts: { homeTitle?: string }) =>
    strictChecks(graph, cleanDom(parseHtml(html)), opts) as Array<{ visible: boolean; where: string }>;

  it("sin <title> de la home (resto de páginas) el nombre no visible falla", () => {
    expect(run({})[0].visible).toBe(false);
  });

  it("con el <title> de la home que abre con ese nombre, se acepta y la fila lo documenta", () => {
    const r = run({ homeTitle: "Kakebo AI | App Gratis del Método Kakebo" });
    expect(r[0].visible).toBe(true);
    expect(r[0].where).toMatch(/excepción/);
  });

  it("no se acepta si el nombre solo es el comienzo de otra palabra o no abre el <title>", () => {
    expect(run({ homeTitle: "Kakebo AIRE | otra cosa" })[0].visible).toBe(false);
    expect(run({ homeTitle: "App Gratis | Kakebo AI" })[0].visible).toBe(false);
  });
});
