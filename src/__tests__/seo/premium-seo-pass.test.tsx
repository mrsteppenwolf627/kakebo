import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import fs from "node:fs";
import path from "node:path";

vi.mock("@/lib/analytics", () => ({ analytics: { track: vi.fn() } }));

vi.mock("@/i18n/routing", () => ({
  Link: ({ href, children, onClick, className }: { href: string; children: React.ReactNode; onClick?: () => void; className?: string }) => (
    <a href={href} onClick={onClick} className={className}>
      {children}
    </a>
  ),
  usePathname: () => "/",
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("next/image", () => ({
  default: ({ src, alt, width, height }: { src: string; alt: string; width: number; height: number }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} width={width} height={height} />
  ),
}));

let mockLocale = "es";
vi.mock("next-intl", () => ({ useLocale: () => mockLocale }));

import PremiumTemplatePage, { generateMetadata } from "@/app/[locale]/(public)/herramientas/plantilla-kakebo-excel-premium/page";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { PREMIUM_PATH } from "@/components/premium/PremiumTracking";

const root = process.cwd();
const read = (rel: string) => fs.readFileSync(path.join(root, rel), "utf8");
const frontmatter = (rel: string) => read(rel).split(/\r?\n---\r?\n/)[0];
const fm = (rel: string, key: string) => {
  const m = frontmatter(rel).match(new RegExp(`^${key}:\\s*["']?(.*?)["']?\\s*$`, "m"));
  return m ? m[1] : undefined;
};

const es = JSON.parse(read("messages/es.json"));
const en = JSON.parse(read("messages/en.json"));

const STALE = /próximamente|coming soon|aún no (está )?disponible|todavía no (está )?disponible|not available yet|cannot be bought yet|nothing is charged yet/i;

const BLOG = {
  plantillaEs: "src/content/blog/plantilla-kakebo-excel.es.mdx",
  plantillaEn: "src/content/blog/plantilla-kakebo-excel.en.mdx",
  metodoEs: "src/content/blog/metodo-kakebo-guia-definitiva.es.mdx",
  metodoEn: "src/content/blog/metodo-kakebo-guia-definitiva.en.mdx",
  onlineEs: "src/content/blog/kakebo-online-guia-completa.es.mdx",
  onlineEn: "src/content/blog/kakebo-online-guia-completa.en.mdx",
};

function flatten(o: unknown, prefix = ""): string[] {
  if (o && typeof o === "object") {
    return Object.entries(o as Record<string, unknown>).flatMap(([k, v]) => flatten(v, prefix ? `${prefix}.${k}` : k));
  }
  return [prefix];
}

async function renderLanding(locale: "es" | "en") {
  const ui = await PremiumTemplatePage({ params: Promise.resolve({ locale }) });
  return render(ui);
}

beforeEach(() => {
  vi.stubEnv("PREMIUM_COMMERCE_ENABLED", "true");
});
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  mockLocale = "es";
});

describe("1-2. No stale availability copy where the product is on sale", () => {
  it.each(Object.entries(BLOG).filter(([k]) => /plantilla|metodo|online/.test(k)))("%s has no 'coming soon / not available yet' wording", (_k, file) => {
    expect(read(file)).not.toMatch(STALE);
  });

  it("the tools index page source no longer says coming soon", () => {
    expect(read("src/app/[locale]/(public)/herramientas/page.tsx")).not.toMatch(STALE);
  });

  it.each(["es", "en"] as const)("the live premium landing (%s) has no stale wording in its visible text or structured data", async (locale) => {
    const { container } = await renderLanding(locale);
    expect(container.textContent ?? "").not.toMatch(STALE);
    const ld = [...container.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent).join(" ");
    expect(ld).not.toMatch(STALE);
    const meta = await generateMetadata({ params: Promise.resolve({ locale }) });
    expect(String(meta.description)).not.toMatch(STALE);
  });

  it("the premium block of /herramientas states it is available now, with price, one-time purchase and digital delivery", () => {
    const src = read("src/app/[locale]/(public)/herramientas/page.tsx");
    expect(src).toContain("Disponible ahora");
    expect(src).toContain("Available now");
    expect(src).toMatch(/9,90 € IVA incluido, compra única y entrega digital/);
    expect(src).toMatch(/€9\.90 VAT included, one-time purchase, delivered digitally/);
  });

  it("the blog CTAs keep the decided 'IVA incluido / VAT included' wording and mention the digital delivery", () => {
    expect(read(BLOG.plantillaEs)).toMatch(/9,90 € IVA incluido, compra única, entrega digital/);
    expect(read(BLOG.plantillaEn)).toMatch(/€9\.90 VAT included, one-time purchase, delivered digitally/);
  });
});

describe("3. The free article keeps its free-download intent", () => {
  it.each(["plantillaEs", "plantillaEn"] as const)("%s keeps the free download first, a single premium card and its FAQ", (key) => {
    const mdx = read(BLOG[key]);
    const download = mdx.indexOf("/docs/Plantilla_Kakebo_Simplificada.xlsx");
    expect(download).toBeGreaterThan(-1);
    expect(mdx.indexOf("<PremiumCTA")).toBeGreaterThan(download);
    expect(mdx.match(/<PremiumCTA/g)).toHaveLength(1);
    expect(mdx).toMatch(/\nfaq:/);
    expect(mdx).not.toMatch(/noindex:\s*true/);
    expect(mdx).toMatch(/free|gratuit/i);
  });

  it("the Spanish free article keeps its exact title and meta description (rankings are protected)", () => {
    expect(fm(BLOG.plantillaEs, "title")).toBe("Plantilla Kakebo en Excel Gratis: Cómo empezar y por qué (casi) siempre falla");
    expect(fm(BLOG.plantillaEs, "excerpt")).toBe(
      "Descarga tu primera plantilla Kakebo en Excel gratis y descubre por qué miles de personas acaban abandonando el registro manual para pasarse a la IA."
    );
  });

  it("the English free article is oriented to 'free kakeibo Excel template' and 'kakeibo spreadsheet'", () => {
    expect(fm(BLOG.plantillaEn, "title")).toMatch(/free kakeibo excel template/i);
    expect(fm(BLOG.plantillaEn, "seoTitle")).toMatch(/free kakeibo excel template/i);
    expect(read(BLOG.plantillaEn)).toMatch(/kakeibo spreadsheet/i);
    expect(fm(BLOG.plantillaEn, "excerpt")).toMatch(/free kakeibo excel template/i);
  });
});

describe("4. The premium landings keep their commercial intent", () => {
  it.each(["es", "en"] as const)("(%s) shows an enabled buy button, the price and the one-time purchase", async (locale) => {
    const { container } = await renderLanding(locale);
    const buy = [...container.querySelectorAll("button")].filter((b) => /^(Comprar|Buy) Kakebo Master System/.test(b.textContent ?? ""));
    expect(buy.length).toBeGreaterThan(0);
    for (const b of buy) expect(b.getAttribute("aria-disabled")).toBe("false");
    expect(container.textContent).toMatch(locale === "es" ? /9,90 €/ : /€9\.90/);
    expect(container.textContent).toMatch(locale === "es" ? /compra única|pago único/i : /one-time (purchase|payment)/i);
  });

  it("the live ES description targets pack / compra / ebook / tutorial and the EN one the premium kakeibo template", async () => {
    const esMeta = await generateMetadata({ params: Promise.resolve({ locale: "es" }) });
    const enMeta = await generateMetadata({ params: Promise.resolve({ locale: "en" }) });
    expect(String(esMeta.description)).toMatch(/Compra Kakebo Master System/);
    expect(String(esMeta.description)).toMatch(/pack/i);
    expect(String(esMeta.description)).toMatch(/ebook/i);
    expect(String(esMeta.description)).toMatch(/tutorial/i);
    expect(String(enMeta.description)).toMatch(/premium kakeibo Excel template/);
  });

  it("the premium landings are not reoriented to the generic or free-template keywords", async () => {
    for (const locale of ["es", "en"] as const) {
      const meta = await generateMetadata({ params: Promise.resolve({ locale }) });
      const head = `${meta.title} ${meta.description}`;
      expect(head).not.toMatch(/gratis|gratuit|free|download|descargar|presupuesto excel|control de gastos|budget spreadsheet|expense tracker/i);
    }
  });
});

describe("5-6. 'kakeibo' in the English pages, never in the Spanish ones", () => {
  it("is present in the selected English content", async () => {
    expect(read(BLOG.plantillaEn)).toMatch(/kakeibo/i);
    expect(read(BLOG.metodoEn)).toMatch(/kakeibo method/i);
    expect(fm(BLOG.metodoEn, "title")).toMatch(/kakeibo/i);
    expect(fm(BLOG.metodoEn, "seoTitle")).toMatch(/kakeibo method/i);
    expect(read(BLOG.metodoEn)).toMatch(/japanese budgeting method/i);
    expect(en.Tools.Index.meta.title).toMatch(/kakeibo/i);
    expect(en.Landing.meta.title).toMatch(/kakeibo/i);
    expect(en.Landing.meta.description).toMatch(/kakeibo/i);
    expect(en.Landing.SEO.whatIs.p1).toMatch(/kakeibo/i);
    expect(en.Tutorial.metaTitle).toMatch(/kakeibo/i);
    const { container } = await renderLanding("en");
    expect(container.textContent).toMatch(/premium kakeibo Excel template/);
    expect(read("src/app/[locale]/(public)/herramientas/page.tsx")).toMatch(/free kakeibo Excel template/);
  });

  it("keeps 'Kakebo' as the product and brand name next to it (no wholesale replacement)", async () => {
    const { container } = await renderLanding("en");
    expect(container.textContent).toContain("Kakebo Master System");
    expect(en.Landing.meta.title).toMatch(/Kakebo AI/);
    expect(read(BLOG.metodoEn).match(/kakebo/gi)!.length).toBeGreaterThan(read(BLOG.metodoEn).match(/kakeibo/gi)!.length);
  });

  it("does not stuff the keyword: a modest share of occurrences", () => {
    for (const file of [BLOG.plantillaEn, BLOG.metodoEn]) {
      const text = read(file);
      const words = text.split(/\s+/).length;
      const k = (text.match(/kakeibo/gi) ?? []).length;
      expect(k).toBeLessThan(words * 0.02);
    }
  });

  it("never appears in the Spanish content, messages or landing", async () => {
    for (const file of [BLOG.plantillaEs, BLOG.metodoEs, BLOG.onlineEs]) expect(read(file)).not.toMatch(/kakeibo/i);
    expect(JSON.stringify(es)).not.toMatch(/kakeibo/i);
    const { container } = await renderLanding("es");
    expect(container.textContent).not.toMatch(/kakeibo/i);
    const meta = await generateMetadata({ params: Promise.resolve({ locale: "es" }) });
    expect(`${meta.title} ${meta.description}`).not.toMatch(/kakeibo/i);
  });
});

describe("7. Titles, descriptions, canonicals and hreflang", () => {
  it.each(["es", "en"] as const)("premium landing (%s) keeps canonical, hreflang and a snippet-safe length", async (locale) => {
    const meta = await generateMetadata({ params: Promise.resolve({ locale }) });
    const canonical = locale === "es"
      ? "https://www.metodokakebo.com/herramientas/plantilla-kakebo-excel-premium"
      : "https://www.metodokakebo.com/en/herramientas/plantilla-kakebo-excel-premium";
    expect(meta.alternates?.canonical).toBe(canonical);
    expect(meta.alternates?.languages).toEqual({
      es: "https://www.metodokakebo.com/herramientas/plantilla-kakebo-excel-premium",
      en: "https://www.metodokakebo.com/en/herramientas/plantilla-kakebo-excel-premium",
      "x-default": "https://www.metodokakebo.com/herramientas/plantilla-kakebo-excel-premium",
    });
    expect(String(meta.title).length).toBeLessThanOrEqual(62);
    expect(String(meta.description).length).toBeLessThanOrEqual(160);
  });

  it("English titles (with the ' | Blog Kakebo' suffix) and descriptions stay within snippet limits", () => {
    for (const file of [BLOG.plantillaEn, BLOG.metodoEn]) {
      expect(`${fm(file, "seoTitle")} | Blog Kakebo`.length).toBeLessThanOrEqual(66);
      expect(fm(file, "excerpt")!.length).toBeLessThanOrEqual(160);
      expect(fm(file, "excerpt")!.length).toBeGreaterThanOrEqual(110);
    }
    for (const v of [en.Landing.meta.description, en.Tools.Index.meta.description, en.Tutorial.metaDescription]) {
      expect(v.length).toBeLessThanOrEqual(160);
    }
    for (const v of [en.Landing.meta.title, en.Tools.Index.meta.title]) expect(v.length).toBeLessThanOrEqual(60);
  });

  it("the blog page template still emits canonical + es/en/x-default alternates", () => {
    const src = read("src/app/[locale]/(public)/blog/[slug]/page.tsx");
    expect(src).toMatch(/canonical:/);
    expect(src).toMatch(/"x-default"/);
    expect(src).toMatch(/seoTitle/);
  });

  it("the English tutorial namespace exists and has exactly the Spanish keys (fixes MISSING_MESSAGE: Tutorial)", () => {
    const esKeys = flatten(es.Tutorial).sort();
    const enKeys = flatten(en.Tutorial).sort();
    expect(enKeys).toEqual(esKeys);
    for (const k of ["content.s3.p3", "content.s4.p3", "content.s4.p4"]) expect(esKeys).toContain(k);
  });
});

describe("8. Product JSON-LD keeps Offer, 9.90 EUR and InStock", () => {
  it.each(["es", "en"] as const)("(%s) Product has a valid Offer while commerce is on", async (locale) => {
    const { container } = await renderLanding(locale);
    const schemas = [...container.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent ?? "{}"));
    const product = schemas.find((s) => s["@type"] === "Product");
    expect(product.offers).toMatchObject({ "@type": "Offer", price: "9.90", priceCurrency: "EUR", availability: "https://schema.org/InStock" });
    expect(product.name).toBe("Kakebo Master System");
    expect(schemas.map((s) => s["@type"]).sort()).toEqual(["BreadcrumbList", "FAQPage", "Product"]);
  });
});

describe("9. New premium links point to the right URL, with varied anchors", () => {
  const ES_URL = "/herramientas/plantilla-kakebo-excel-premium";
  const EN_URL = "/en/herramientas/plantilla-kakebo-excel-premium";

  it("PREMIUM_PATH is the canonical landing path", () => {
    expect(PREMIUM_PATH).toBe(ES_URL);
  });

  it("home messages link to the landing in each locale", () => {
    expect(es.Landing.SEO.whatIs.p3).toContain(`href="${ES_URL}"`);
    expect(en.Landing.SEO.whatIs.p3).toContain(`href="${EN_URL}"`);
    expect(en.Landing.SEO.whatIs.p3).not.toContain(`href="${ES_URL}"`);
  });

  it("guides and the free article link to the landing in the right locale", () => {
    for (const file of [BLOG.plantillaEs, BLOG.metodoEs, BLOG.onlineEs]) expect(read(file)).toContain(`](${ES_URL})`);
    for (const file of [BLOG.plantillaEn, BLOG.metodoEn, BLOG.onlineEn]) expect(read(file)).toContain(`](${EN_URL})`);
    for (const file of [BLOG.plantillaEs, BLOG.metodoEs, BLOG.onlineEs]) expect(read(file)).not.toContain(`](${EN_URL})`);
  });

  it("the tutorial and the tools index use the tracked PremiumLink (single source of the URL)", () => {
    expect(read("src/app/[locale]/(public)/tutorial/page.tsx")).toMatch(/<PremiumLink/);
    expect(read("src/app/[locale]/(public)/herramientas/page.tsx")).toMatch(/<PremiumLink/);
  });

  it("anchors are natural and differentiated (no single repeated anchor)", () => {
    const anchors = new Set<string>();
    for (const file of Object.values(BLOG)) {
      for (const m of read(file).matchAll(/\[([^\]]+)\]\((?:\/en)?\/herramientas\/plantilla-kakebo-excel-premium\)/g)) anchors.add(m[1]);
    }
    anchors.add(es.Tutorial.premium.link).add(en.Tutorial.premium.link);
    expect(anchors.size).toBeGreaterThanOrEqual(5);
    expect(anchors.has("pack premium de Kakebo")).toBe(true);
    expect(anchors.has("Kakebo Master System pack")).toBe(true);
    expect(anchors.has("premium Kakebo Excel template")).toBe(true);
    expect(anchors.has("plantilla Kakebo Excel premium")).toBe(true);
  });

  it("the free-template link on the tools index is unchanged", () => {
    expect(read("src/app/[locale]/(public)/herramientas/page.tsx")).toContain('href="/blog/plantilla-kakebo-excel"');
  });
});

describe("11. Small accessibility / anchor fixes", () => {
  it.each([
    ["es", "ES"],
    ["en", "EN"],
  ])("the language switcher accessible name starts with its visible text (%s)", (locale, visible) => {
    mockLocale = locale;
    const { getByRole } = render(<LanguageSwitcher />);
    const btn = getByRole("button");
    expect(btn.textContent).toContain(visible);
    expect(btn.getAttribute("aria-label")!.startsWith(visible)).toBe(true);
  });

  it("generic anchors became descriptive", () => {
    expect(es.CookieBanner.moreInfo).toBe("Política de privacidad");
    expect(en.CookieBanner.moreInfo).toBe("Privacy policy");
    expect(es.Navigation.start).toBe("Empezar gratis");
    expect(en.Navigation.start).toBe("Start for free");
  });

  it("the tools dropdown toggle has a touch target of at least 24x24 px", () => {
    expect(read("src/components/landing/Navbar.tsx")).toMatch(/min-h-6 min-w-6[^"]*p-1\.5/);
  });
});

describe("12. Nothing sensitive in the edited content", () => {
  it("has no keys, tokens, cookies, session ids or private paths", () => {
    const files = [...Object.values(BLOG), "messages/es.json", "messages/en.json", "src/lib/premium/landing-live-copy.ts", "src/app/[locale]/(public)/herramientas/page.tsx", "src/app/[locale]/(public)/tutorial/page.tsx"];
    for (const f of files) {
      const t = read(f);
      expect(t).not.toMatch(/sk_(live|test)_|rk_(live|test)_|whsec_|eyJ[A-Za-z0-9_-]{20,}|session_id=|cs_(live|test)_|kakebo_premium_access|supabase\.co\/storage|private\/premium|service_role/i);
    }
  });
});
