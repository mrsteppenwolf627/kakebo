// @vitest-environment node
import { describe, it, expect, vi } from "vitest";

// next-intl's navigation wrapper can't resolve next/navigation under vitest; the page only needs Link/Footer to render.
vi.mock("@/i18n/routing", () => ({
  routing: { locales: ["en", "es"], defaultLocale: "es" },
  Link: () => null,
  usePathname: () => "/",
  useRouter: () => ({ replace: vi.fn() }),
}));
vi.mock("@/components/landing", () => ({ Footer: () => null, Navbar: () => null }));
vi.mock("@/components/premium/PremiumTracking", () => ({ PremiumLink: () => null }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
vi.mock("@/lib/analytics", () => ({ analytics: { track: vi.fn() } }));

import data from "@/content/vivienda/valor-tasado.es.json";
import {
  PLAZOS_ANIOS,
  ahorroMensual,
  calcularEntrada,
  diferenciaConMediaNacional,
  getProvinciasPiloto,
  getTodasProvincias,
  getViviendaMeta,
  puestoPorValor,
  validateMeta,
  validateProvincia,
} from "@/lib/vivienda";
import sitemap from "@/app/sitemap";

const todas = getTodasProvincias();
const piloto = getProvinciasPiloto();
const slugs = piloto.map((p) => p.slug);
const PAGE = "@/app/[locale]/(public)/ahorro-entrada-vivienda/[provincia]/page";

describe("vivienda dataset", () => {
  it("has the 50 provinces and the 12 pilot pages", () => {
    expect(todas).toHaveLength(50);
    expect(slugs.sort()).toEqual(
      ["a-coruna", "alicante", "barcelona", "bizkaia", "illes-balears", "las-palmas", "madrid", "malaga", "murcia", "sevilla", "valencia", "zaragoza"].sort(),
    );
  });

  it("matches the official values read from the Ministerio de Transportes table (2T 2026)", () => {
    const byslug = Object.fromEntries(todas.map((p) => [p.slug, p.valorM2]));
    expect(byslug["madrid"]).toBe(4089.6);
    expect(byslug["illes-balears"]).toBe(3980.8);
    expect(byslug["barcelona"]).toBe(3204.2);
    expect(byslug["jaen"]).toBe(912.7);
    expect(byslug["ciudad-real"]).toBe(854.2);
    expect(getViviendaMeta().mediaNacionalM2).toBe(2355);
  });

  it("carries the mandatory citation and period", () => {
    const meta = getViviendaMeta();
    expect(meta.cita).toBe("Origen de los datos: Ministerio de Transportes y Movilidad Sostenible");
    expect(meta.periodo).toBe("2.º trimestre de 2026");
  });

  it.each(["slug", "nombre", "valorM2", "piloto"])("validation fails when %s is missing", (field) => {
    const row = JSON.parse(JSON.stringify(data.provincias[0]));
    delete row[field];
    expect(() => validateProvincia(row, 0)).toThrow(field);
  });

  it.each([0, -5, Number.NaN, "1500"])("validation fails with valorM2 = %s", (value) => {
    const row = { ...data.provincias[0], valorM2: value };
    expect(() => validateProvincia(row, 0)).toThrow("valorM2");
  });

  it.each(["fuente", "organismo", "cita", "url", "avisoLegalUrl", "periodo", "consultado", "mediaNacionalM2"])(
    "meta validation fails when %s is missing",
    (field) => {
      const meta = JSON.parse(JSON.stringify(data.meta));
      delete meta[field];
      expect(() => validateMeta(meta)).toThrow(field);
    },
  );

  it("fails on duplicated slugs", () => {
    expect(() => getTodasProvincias([data.provincias[0], data.provincias[0]])).toThrow("slugs repetidos");
  });
});

describe("vivienda calculation", () => {
  it("computes Madrid with deterministic rounding", () => {
    const madrid = todas.find((p) => p.slug === "madrid")!;
    const c = calcularEntrada(madrid.valorM2);
    expect(c).toEqual({ superficieM2: 80, valorEstimado: 327168, entrada: 65434 });
    expect(ahorroMensual(c.entrada, 3)).toBe(1818);
    expect(ahorroMensual(c.entrada, 5)).toBe(1091);
    expect(ahorroMensual(c.entrada, 8)).toBe(682);
    expect(ahorroMensual(c.entrada, 10)).toBe(546);
  });

  it("computes Jaén with deterministic rounding", () => {
    const c = calcularEntrada(912.7);
    expect(c).toEqual({ superficieM2: 80, valorEstimado: 73016, entrada: 14603 });
    expect(ahorroMensual(c.entrada, 5)).toBe(244);
  });

  it("is a pure function: the same input gives the same output", () => {
    expect(calcularEntrada(2000)).toEqual(calcularEntrada(2000));
  });

  it("monthly saving rounds up and never undershoots the target", () => {
    for (const p of todas) {
      const { entrada } = calcularEntrada(p.valorM2);
      for (const anios of PLAZOS_ANIOS) {
        expect(ahorroMensual(entrada, anios) * anios * 12).toBeGreaterThanOrEqual(entrada);
        expect(ahorroMensual(entrada, anios) * anios * 12 - entrada).toBeLessThan(anios * 12);
      }
    }
  });

  it("supports other surface and percentage values", () => {
    expect(calcularEntrada(1000, 100, 0.1)).toEqual({ superficieM2: 100, valorEstimado: 100000, entrada: 10000 });
    expect(calcularEntrada(1000, 100, 1).entrada).toBe(100000);
  });

  it.each([
    ["valorM2 0", () => calcularEntrada(0)],
    ["valorM2 negative", () => calcularEntrada(-1)],
    ["valorM2 NaN", () => calcularEntrada(Number.NaN)],
    ["superficie 0", () => calcularEntrada(1000, 0)],
    ["porcentaje 0", () => calcularEntrada(1000, 80, 0)],
    ["porcentaje above 1", () => calcularEntrada(1000, 80, 1.5)],
    ["entrada 0", () => ahorroMensual(0, 5)],
    ["anios 0", () => ahorroMensual(1000, 0)],
    ["anios fractional", () => ahorroMensual(1000, 2.5)],
  ])("rejects invalid input: %s", (_name, fn) => {
    expect(fn).toThrow();
  });

  it("ranks provinces by valor tasado (1 = highest)", () => {
    expect(puestoPorValor("madrid")).toBe(1);
    expect(puestoPorValor("illes-balears")).toBe(2);
    expect(puestoPorValor("ciudad-real")).toBe(50);
    expect(() => puestoPorValor("atlantida")).toThrow("desconocida");
  });

  it("computes the difference against the national average", () => {
    expect(diferenciaConMediaNacional(4089.6, 2355)).toBe(74);
    expect(diferenciaConMediaNacional(912.7, 2355)).toBe(-61);
    expect(diferenciaConMediaNacional(2355, 2355)).toBe(0);
    expect(() => diferenciaConMediaNacional(1000, 0)).toThrow();
  });
});

describe("vivienda route", () => {
  it("only prerenders the pilot slugs, in the default locale, and 404s the rest", async () => {
    const { generateStaticParams, dynamicParams } = await import(PAGE);
    expect(dynamicParams).toBe(false);
    expect(generateStaticParams()).toEqual(piloto.map((p) => ({ locale: "es", provincia: p.slug })));
  });

  it("does not generate pages for non-pilot provinces", async () => {
    const { default: Page } = await import(PAGE);
    await expect(Page({ params: Promise.resolve({ provincia: "jaen", locale: "es" }) })).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it.each(slugs)("%s resolves with metadata and a self canonical without /es/", async (slug) => {
    const { generateMetadata, default: Page } = await import(PAGE);
    const meta = await generateMetadata({ params: Promise.resolve({ provincia: slug, locale: "es" }) });
    expect(meta.alternates?.canonical).toBe(`https://www.metodokakebo.com/ahorro-entrada-vivienda/${slug}`);
    expect(String(meta.alternates?.canonical)).not.toContain("/es/");
    expect(Object.keys(meta.alternates?.languages ?? {}).sort()).toEqual(["es", "x-default"]);
    const page = await Page({ params: Promise.resolve({ provincia: slug, locale: "es" }) });
    const html = JSON.stringify(page);
    expect(html).toContain("Origen de los datos: Ministerio de Transportes y Movilidad Sostenible");
    expect(html).toContain("el valor tasado no es el precio de mercado");
    expect(html.toLowerCase()).not.toContain("whatsapp");
  });

  it("has unique titles, descriptions and FAQ answers across pages", async () => {
    const { generateMetadata, default: Page } = await import(PAGE);
    const titles: string[] = [];
    const descriptions: string[] = [];
    const bodies: string[] = [];
    for (const slug of slugs) {
      const meta = await generateMetadata({ params: Promise.resolve({ provincia: slug, locale: "es" }) });
      titles.push(String(meta.title));
      descriptions.push(String(meta.description));
      bodies.push(JSON.stringify(await Page({ params: Promise.resolve({ provincia: slug, locale: "es" }) })));
    }
    expect(new Set(titles).size).toBe(slugs.length);
    expect(new Set(descriptions).size).toBe(slugs.length);
    expect(new Set(bodies).size).toBe(slugs.length);
  });

  it("a non-Spanish locale calls notFound()", async () => {
    const { default: Page } = await import(PAGE);
    await expect(Page({ params: Promise.resolve({ provincia: slugs[0], locale: "en" }) })).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("an unknown slug calls notFound()", async () => {
    const { default: Page } = await import(PAGE);
    await expect(Page({ params: Promise.resolve({ provincia: "no-existe", locale: "es" }) })).rejects.toThrow("NEXT_NOT_FOUND");
  });
});

describe("vivienda sitemap", () => {
  it("lists the 12 pilot URLs without the /es/ prefix and nothing else of the section", () => {
    const urls = sitemap().map((e) => e.url);
    const section = urls.filter((u) => u.includes("/ahorro-entrada-vivienda/"));
    expect(section.sort()).toEqual(slugs.map((s) => `https://www.metodokakebo.com/ahorro-entrada-vivienda/${s}`).sort());
    expect(urls.some((u) => u.includes("/es/ahorro-entrada-vivienda"))).toBe(false);
  });
});
