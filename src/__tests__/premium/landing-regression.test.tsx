import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, cleanup, fireEvent, screen } from "@testing-library/react";
import fs from "node:fs";
import path from "node:path";

const trackMock = vi.fn();
vi.mock("@/lib/analytics", () => ({
  analytics: { track: (...args: unknown[]) => trackMock(...args) },
}));

vi.mock("@/i18n/routing", () => ({
  Link: ({ href, children, onClick, className }: { href: string; children: React.ReactNode; onClick?: () => void; className?: string }) => (
    <a href={href} onClick={onClick} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("next/image", () => ({
  default: ({ src, alt, width, height }: { src: string; alt: string; width: number; height: number }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} width={width} height={height} />
  ),
}));

import PremiumTemplatePage, { generateMetadata } from "@/app/[locale]/(public)/herramientas/plantilla-kakebo-excel-premium/page";
import { PremiumLink } from "@/components/premium/PremiumTracking";
import { PREMIUM_PACK_FILES } from "@/lib/premium/manifest";

const FREE_PATH = "/blog/plantilla-kakebo-excel";

async function renderLanding(locale: "es" | "en") {
  const ui = await PremiumTemplatePage({ params: Promise.resolve({ locale }) });
  return render(ui);
}

beforeEach(() => {
  trackMock.mockClear();
  delete process.env.PREMIUM_COMMERCE_ENABLED;
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe.each(["es", "en"] as const)("premium landing (%s)", (locale) => {
  it("renders with exactly one H1", async () => {
    await renderLanding(locale);
    expect(document.querySelectorAll("h1")).toHaveLength(1);
  });

  it("H1 carries the main search intent without stuffing", async () => {
    await renderLanding(locale);
    const h1 = document.querySelector("h1")!.textContent ?? "";
    expect(h1).toMatch(locale === "es" ? /plantilla Kakebo Excel premium/i : /premium Kakebo Excel template/i);
    expect(h1.match(/kakebo/gi)).toHaveLength(1);
  });

  it("links only to the free template and to the tools hub, never directly to .xlsx or .pdf files", async () => {
    const { container } = await renderLanding(locale);
    const hrefs = [...container.querySelectorAll("a")].map((a) => a.getAttribute("href") ?? "");
    expect(hrefs.length).toBeGreaterThan(0);
    expect(hrefs).toContain(FREE_PATH);
    expect(hrefs).toContain("/herramientas");
    for (const href of hrefs) {
      expect([FREE_PATH, "/herramientas"]).toContain(href);
      expect(href).not.toMatch(/\.(xlsx|xlsm|xls|pdf)/i);
    }
    // The formats may be named in text (".xlsx", "PDF"), but no attribute may point to a file.
    expect(container.innerHTML).not.toMatch(/(href|src|action|data)="[^"]*\.(xlsx|xlsm|xls|pdf)/i);
  });

  it("never mentions any pack file name, storage key or private path in the HTML", async () => {
    const { container } = await renderLanding(locale);
    const html = container.innerHTML.toLowerCase();
    for (const f of PREMIUM_PACK_FILES) {
      for (const needle of [f.internalName, f.downloadFileName, f.storageKey, f.sha256]) {
        expect(html).not.toContain(needle.toLowerCase());
      }
    }
    expect(html).not.toContain("private/premium");
    expect(html).not.toContain("supabase.co");
    expect(html).not.toContain("/storage/v1");
    // (the public preview images live under /images/products/kakebo-premium/, which is expected)
    expect(html).not.toContain("kakebo-premium/kakebo-master-system-pack");
    expect(html).not.toMatch(/token=|signedurl|service_role/i);
    expect(html).not.toContain("/api/premium/download");
  });

  it("shows the disabled 'coming soon' CTA while commerce is off", async () => {
    const { container } = await renderLanding(locale);
    const disabled = container.querySelectorAll('button[aria-disabled="true"]');
    expect(disabled.length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /^(Comprar|Buy)/ })).toBeNull();
    for (const b of disabled) {
      expect(b.textContent).toBe(locale === "es" ? "Próximamente" : "Coming soon");
    }
  });

  it("shows the purchase CTA only when the flag is on", async () => {
    vi.stubEnv("PREMIUM_COMMERCE_ENABLED", "true");
    await renderLanding(locale);
    expect(screen.getAllByRole("button", { name: /^(Comprar|Buy) Kakebo Master System/ }).length).toBeGreaterThan(0);
  });

  it("emits premium_product_viewed once on mount, and nothing about purchases", async () => {
    await renderLanding(locale);
    const names = trackMock.mock.calls.map((c) => c[0]);
    expect(names.filter((n) => n === "premium_product_viewed")).toHaveLength(1);
    expect(names).not.toContain("purchase");
    expect(names).not.toContain("checkout_started");
    expect(names).not.toContain("digital_product_downloaded");
    expect(trackMock.mock.calls[0][1]).toMatchObject({
      product_name: "Kakebo Master System",
      product_price: 9.9,
    });
  });

  it("keeps the product name unified", async () => {
    const { container } = await renderLanding(locale);
    expect(container.textContent).toContain("Kakebo Master System");
    expect(container.textContent).not.toMatch(/Excel Plus/);
  });
});

describe("premium landing metadata", () => {
  it.each([
    ["es", "https://www.metodokakebo.com/herramientas/plantilla-kakebo-excel-premium"],
    ["en", "https://www.metodokakebo.com/en/herramientas/plantilla-kakebo-excel-premium"],
  ])("(%s) is public and indexable (no robots override) with correct canonical, hreflang and social metadata", async (locale, canonical) => {
    const meta = await generateMetadata({ params: Promise.resolve({ locale }) });
    // No noindex: indexing is controlled site-wide by the locale layout (production domain only).
    expect(meta.robots).toBeUndefined();
    expect(String(meta.title)).toMatch(/Kakebo Master System/);
    expect(String(meta.description)).toMatch(/9[,.]90/);
    expect((meta.openGraph as { url?: string }).url).toBe(canonical);
    expect((meta.twitter as { card?: string }).card).toBe("summary_large_image");
    expect(meta.alternates?.canonical).toBe(canonical);
    expect(meta.alternates?.languages).toEqual({
      es: "https://www.metodokakebo.com/herramientas/plantilla-kakebo-excel-premium",
      en: "https://www.metodokakebo.com/en/herramientas/plantilla-kakebo-excel-premium",
      "x-default": "https://www.metodokakebo.com/herramientas/plantilla-kakebo-excel-premium",
    });
  });
});

describe("premium analytics events", () => {
  it("premium_product_cta_clicked carries the full payload", () => {
    render(<PremiumLink ctaLocation="unit_test_location">go</PremiumLink>);
    fireEvent.click(screen.getByText("go"));

    expect(trackMock).toHaveBeenCalledTimes(1);
    expect(trackMock).toHaveBeenCalledWith("premium_product_cta_clicked", {
      source_page: window.location.pathname,
      cta_location: "unit_test_location",
      destination_path: "/herramientas/plantilla-kakebo-excel-premium",
      product_name: "Kakebo Master System",
      product_price: 9.9,
    });
  });
});

describe("free template regression", () => {
  const root = process.cwd();

  it.each(["es", "en"])("the %s article keeps the free download link and a single premium CTA after it", (loc) => {
    const mdx = fs.readFileSync(path.join(root, `src/content/blog/plantilla-kakebo-excel.${loc}.mdx`), "utf8");
    const download = mdx.indexOf("/docs/Plantilla_Kakebo_Simplificada.xlsx");
    const cta = mdx.indexOf("<PremiumCTA");
    expect(download).toBeGreaterThan(-1);
    expect(cta).toBeGreaterThan(download);
    expect(mdx.match(/<PremiumCTA/g)).toHaveLength(1);
  });

  it("the free Excel download still exists in public/docs", () => {
    const file = path.join(root, "public/docs/Plantilla_Kakebo_Simplificada.xlsx");
    expect(fs.existsSync(file)).toBe(true);
    expect(fs.statSync(file).size).toBeGreaterThan(1000);
  });
});

describe.each(["es", "en"] as const)("premium landing — pack, price and honest availability (%s)", (locale) => {
  const text = async () => {
    const { container } = await renderLanding(locale);
    return container.textContent ?? "";
  };

  it("presents the three pieces of the pack, including the ebook", async () => {
    const t = await text();
    expect(t).toMatch(/Kakebo Master System/);
    expect(t).toMatch(/El arte de mirar tu dinero/);
    expect(t).toMatch(locale === "es" ? /unas 20 páginas/ : /about 20 pages/);
    expect(t).toMatch(locale === "es" ? /Tutorial en PDF/ : /PDF tutorial/);
    expect(t).toMatch(locale === "es" ? /Plantilla Excel premium/ : /Premium Excel template/);
  });

  it("states price with VAT included, one-time purchase, permanent access and no account", async () => {
    const t = await text();
    expect(t).toMatch(locale === "es" ? /9,90 € IVA incluido/ : /€9\.90 VAT included/);
    expect(t).toMatch(locale === "es" ? /compra única/i : /one-time purchase/i);
    expect(t).toMatch(locale === "es" ? /acceso permanente/i : /permanent access/i);
    expect(t).toMatch(locale === "es" ? /No hace falta crear una cuenta|no hace falta registrarse/i : /do not need to create an account|do not need to sign up/i);
  });

  it("says clearly that purchase is not available yet and never offers an active buy button", async () => {
    const { container } = await renderLanding(locale);
    expect(container.textContent).toMatch(locale === "es" ? /todavía no (está disponible|se puede comprar)/i : /(not available yet|cannot be bought yet)/i);
    expect(screen.queryByRole("button", { name: /^(Comprar|Buy)/ })).toBeNull();
    for (const b of container.querySelectorAll("button")) expect(b.getAttribute("aria-disabled")).toBe("true");
  });

  it("does not expose internal implementation details or payment-provider names to the public", async () => {
    const t = await text();
    expect(t).not.toMatch(/Stripe|checkout|webhook|entitlement|Supabase|signed URL|URL firmada|PREMIUM_COMMERCE|private\/premium/i);
    expect(t).not.toMatch(/\btrial\b|prueba gratuita|prueba de \d+ d/i);
  });

  it("keeps the pack separate from the app: buying it grants no app features", async () => {
    const t = await text();
    expect(t).toMatch(locale === "es" ? /no concede funciones de la aplicación/i : /does not grant (app features|Kakebo app features)/i);
  });

  it("structured data: Breadcrumb + Product + FAQPage, and NO offer/availability while it cannot be bought", async () => {
    const { container } = await renderLanding(locale);
    const schemas = [...container.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent ?? "{}"));
    expect(schemas.map((s) => s["@type"]).sort()).toEqual(["BreadcrumbList", "FAQPage", "Product"]);
    const product = schemas.find((s) => s["@type"] === "Product");
    expect(product.name).toBe("Kakebo Master System");
    expect(product).not.toHaveProperty("offers");
    expect(JSON.stringify(schemas)).not.toMatch(/availability|InStock|PreOrder|"price"|priceCurrency|AggregateRating|"review"/i);
    const faq = schemas.find((s) => s["@type"] === "FAQPage");
    const visible = container.textContent ?? "";
    for (const q of faq.mainEntity) expect(visible).toContain(q.name);
  });

  it("links back to the free template (first) and to the tools hub", async () => {
    const { container } = await renderLanding(locale);
    const hrefs = [...container.querySelectorAll("main a")].map((a) => a.getAttribute("href"));
    expect(hrefs[0]).toBe(FREE_PATH);
    expect(hrefs).toContain("/herramientas");
  });
});

describe("free template article links to the premium landing without displacing the free download", () => {
  const root = process.cwd();
  it.each(["es", "en"])("(%s) keeps the free download first and links contextually to the landing", (loc) => {
    const mdx = fs.readFileSync(path.join(root, `src/content/blog/plantilla-kakebo-excel.${loc}.mdx`), "utf8");
    const download = mdx.indexOf("/docs/Plantilla_Kakebo_Simplificada.xlsx");
    const firstPremiumLink = mdx.search(/herramientas\/plantilla-kakebo-excel-premium|<PremiumCTA/);
    expect(download).toBeGreaterThan(-1);
    expect(firstPremiumLink).toBeGreaterThan(download);
    // CTA card + at least one inline markdown link in the body.
    expect(mdx.match(/<PremiumCTA/g)).toHaveLength(1);
    expect(mdx).toMatch(/\]\((\/en)?\/herramientas\/plantilla-kakebo-excel-premium\)/);
    // The pack is described as a different, paid, not-yet-available product.
    expect(mdx).toMatch(/9,90 € IVA incluido|€9\.90 VAT included/);
  });

  it.each(["es", "en"])("(%s) frontmatter/SEO of the free article is untouched (title, FAQ and download still there)", (loc) => {
    const mdx = fs.readFileSync(path.join(root, `src/content/blog/plantilla-kakebo-excel.${loc}.mdx`), "utf8");
    expect(mdx).toMatch(/^---\r?\ntitle:/);
    expect(mdx).toMatch(/\nfaq:/);
    expect(mdx).not.toMatch(/noindex:\s*true/);
  });
});
