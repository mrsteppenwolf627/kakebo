// @vitest-environment node
import fs from "fs";
import path from "path";
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

import data from "@/content/plantillas/plantillas.es.json";
import { getPlantillas, validatePlantilla } from "@/lib/plantillas";
import { generateStaticParams, dynamicParams } from "@/app/[locale]/(public)/plantillas/[slug]/page";
import sitemap from "@/app/sitemap";

const plantillas = getPlantillas();
const slugs = plantillas.map((p) => p.slug);

describe("plantillas data", () => {
  it("has the 2 pilot pages", () => {
    expect(slugs).toEqual(["kakebo-para-imprimir", "kakebo-2027"]);
  });

  it.each([
    "slug",
    "title",
    "metaDescription",
    "h1",
    "format",
    "intro",
    "updatedDate",
    "asset.path",
    "steps",
    "faq",
  ])("validation fails when %s is missing", (field) => {
    const row = JSON.parse(JSON.stringify(data[0]));
    if (field === "asset.path") delete row.asset.path;
    else delete row[field];
    expect(() => validatePlantilla(row, 0)).toThrow(field);
  });

  it("requires 3 or more FAQ entries", () => {
    const row = JSON.parse(JSON.stringify(data[0]));
    row.faq = row.faq.slice(0, 2);
    expect(() => validatePlantilla(row, 0)).toThrow("faq");
  });

  it("has no duplicated titles, metas, h1s or intros", () => {
    for (const key of ["title", "metaDescription", "h1", "intro"] as const) {
      const values = plantillas.map((p) => p[key]);
      expect(new Set(values).size, key).toBe(values.length);
    }
  });

  it("has no FAQ answer or step copied between pages", () => {
    const answers = plantillas.flatMap((p) => p.faq.map((f) => f.answer));
    const steps = plantillas.flatMap((p) => p.steps);
    expect(new Set(answers).size).toBe(answers.length);
    expect(new Set(steps).size).toBe(steps.length);
  });

  it.each(plantillas.map((p) => [p.slug, p] as const))("asset of %s exists and its size matches sizeKb", (_slug, p) => {
    const file = path.join(process.cwd(), "public", p.asset.path);
    expect(fs.existsSync(file)).toBe(true);
    expect(Math.round(fs.statSync(file).size / 1024)).toBe(p.asset.sizeKb);
  });
});

describe("plantillas route", () => {
  it("only prerenders the slugs in the JSON, in the default locale, and 404s the rest", () => {
    expect(dynamicParams).toBe(false);
    expect(generateStaticParams()).toEqual(slugs.map((slug) => ({ locale: "es", slug })));
  });

  it.each(slugs)("%s resolves with metadata and a self canonical without /es/", async (slug) => {
    const { generateMetadata, default: Page } = await import("@/app/[locale]/(public)/plantillas/[slug]/page");
    const meta = await generateMetadata({ params: Promise.resolve({ slug, locale: "es" }) });
    expect(meta.alternates?.canonical).toBe(`https://www.metodokakebo.com/plantillas/${slug}`);
    expect(String(meta.alternates?.canonical)).not.toContain("/es/");
    expect(Object.keys(meta.alternates?.languages ?? {}).sort()).toEqual(["es", "x-default"]);
    await expect(Page({ params: Promise.resolve({ slug, locale: "es" }) })).resolves.toBeTruthy();
  });

  it("a non-Spanish locale calls notFound()", async () => {
    const { default: Page } = await import("@/app/[locale]/(public)/plantillas/[slug]/page");
    await expect(Page({ params: Promise.resolve({ slug: slugs[0], locale: "en" }) })).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("an unknown slug calls notFound()", async () => {
    const { default: Page } = await import("@/app/[locale]/(public)/plantillas/[slug]/page");
    await expect(Page({ params: Promise.resolve({ slug: "no-existe", locale: "es" }) })).rejects.toThrow("NEXT_NOT_FOUND");
  });
});

describe("sitemap", () => {
  it("lists the template URLs without the /es/ prefix", () => {
    const urls = sitemap().map((e) => e.url);
    for (const slug of slugs) {
      expect(urls).toContain(`https://www.metodokakebo.com/plantillas/${slug}`);
      expect(urls.some((u) => u.includes(`/es/plantillas/${slug}`))).toBe(false);
    }
  });
});
