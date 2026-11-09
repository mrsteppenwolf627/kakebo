// @vitest-environment node
import { describe, it, expect, vi } from "vitest";

vi.mock("@/i18n/routing", () => ({
  routing: { locales: ["en", "es"], defaultLocale: "es" },
  Link: () => null,
  usePathname: () => "/",
  useRouter: () => ({ replace: vi.fn() }),
}));
vi.mock("@/components/landing", () => ({ Footer: () => null, Navbar: () => null }));
vi.mock("next-intl/server", () => ({ setRequestLocale: vi.fn() }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

import { getProvinciasPiloto } from "@/lib/vivienda";
import sitemap from "@/app/sitemap";
import { ldDocumentsFromTree } from "@/__tests__/helpers/jsonld";

const PAGE = "@/app/[locale]/(public)/ahorro-entrada-vivienda/[provincia]/page";
const HUB = "@/app/[locale]/(public)/ahorro-entrada-vivienda/page";
const slugs = getProvinciasPiloto().map((p) => p.slug);

function jsonLd(page: unknown): Array<Record<string, unknown>> {
  const docs = ldDocumentsFromTree(page);
  if (docs.length !== 1) throw new Error(`se esperaba un único JSON-LD y hay ${docs.length}`);
  return docs[0]["@graph"];
}

describe("páginas de provincia: elementos completos", () => {
  it.each(slugs)("%s lleva WebPage, FAQPage y BreadcrumbList, migas visibles, gráfico y calculadora", async (slug) => {
    const { default: Page } = await import(PAGE);
    const page = await Page({ params: Promise.resolve({ provincia: slug, locale: "es" }) });
    const types = jsonLd(page).map((x) => x["@type"]);
    for (const type of ["WebPage", "Dataset", "FAQPage", "BreadcrumbList"]) expect(types).toContain(type);
    const faq = jsonLd(page).find((x) => x["@type"] === "FAQPage") as { mainEntity: unknown[] };
    expect(faq.mainEntity).toHaveLength(4);
    const crumbs = jsonLd(page).find((x) => x["@type"] === "BreadcrumbList") as {
      itemListElement: Array<{ item: string }>;
    };
    expect(crumbs.itemListElement[1].item).toBe("https://www.metodokakebo.com/ahorro-entrada-vivienda");
    expect(crumbs.itemListElement[2].item).toBe(`https://www.metodokakebo.com/ahorro-entrada-vivienda/${slug}`);
    const html = JSON.stringify(page);
    expect(html).toContain("Migas de pan");
    expect(html).toContain("Ajusta el cálculo a tu caso");
    expect(html).toContain("Última consulta de la fuente");
  });

  it.each(slugs)("%s tiene imagen social propia y twitter card", async (slug) => {
    const { generateMetadata } = await import(PAGE);
    const meta = await generateMetadata({ params: Promise.resolve({ provincia: slug, locale: "es" }) });
    const image = (meta.openGraph as { images: Array<{ url: string }> }).images[0].url;
    expect(image.startsWith("/api/og?title=")).toBe(true);
    expect((meta.twitter as { card: string }).card).toBe("summary_large_image");
  });

  it("las imágenes sociales son distintas entre provincias", async () => {
    const { generateMetadata } = await import(PAGE);
    const urls = new Set<string>();
    for (const slug of slugs) {
      const meta = await generateMetadata({ params: Promise.resolve({ provincia: slug, locale: "es" }) });
      urls.add((meta.openGraph as { images: Array<{ url: string }> }).images[0].url);
    }
    expect(urls.size).toBe(slugs.length);
  });
});

describe("página índice de la sección", () => {
  it("solo se prerenderiza en español y rechaza otros locales", async () => {
    const { generateStaticParams, dynamicParams, default: Hub } = await import(HUB);
    expect(dynamicParams).toBe(false);
    expect(generateStaticParams()).toEqual([{ locale: "es" }]);
    await expect(Hub({ params: Promise.resolve({ locale: "en" }) })).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("tiene canonical propia sin /es/ y lista las 12 provincias con su ahorro", async () => {
    const { generateMetadata, default: Hub } = await import(HUB);
    const meta = await generateMetadata({ params: Promise.resolve({ locale: "es" }) });
    expect(meta.alternates?.canonical).toBe("https://www.metodokakebo.com/ahorro-entrada-vivienda");
    const page = await Hub({ params: Promise.resolve({ locale: "es" }) });
    const html = JSON.stringify(page);
    expect(html).toContain("Origen de los datos: Ministerio de Transportes y Movilidad Sostenible");
    const ld = jsonLd(page);
    const list = (ld.find((x) => x["@type"] === "ItemList") as { itemListElement: unknown[] }).itemListElement;
    expect(list).toHaveLength(12);
    expect(ld.some((x) => x["@type"] === "BreadcrumbList")).toBe(true);
  });

  it("está en el sitemap sin prefijo /es/", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain("https://www.metodokakebo.com/ahorro-entrada-vivienda");
    expect(urls.some((u) => u.includes("/es/ahorro-entrada-vivienda"))).toBe(false);
  });
});
