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

  it("links only to the free template and never directly to .xlsx or .pdf files", async () => {
    const { container } = await renderLanding(locale);
    const hrefs = [...container.querySelectorAll("a")].map((a) => a.getAttribute("href") ?? "");
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      expect(href).toBe(FREE_PATH);
      expect(href).not.toMatch(/\.(xlsx|xlsm|xls|pdf)/i);
    }
    expect(container.innerHTML).not.toMatch(/\.(xlsx|xlsm|pdf)\b/i);
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
  ])("(%s) is noindex,follow with correct canonical and hreflang", async (locale, canonical) => {
    const meta = await generateMetadata({ params: Promise.resolve({ locale }) });
    expect(meta.robots).toEqual({ index: false, follow: true });
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
