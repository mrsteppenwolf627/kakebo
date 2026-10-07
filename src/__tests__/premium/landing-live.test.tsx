import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

vi.mock("@/lib/analytics", () => ({ analytics: { track: vi.fn() } }));
vi.mock("@/i18n/routing", () => ({
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

import PremiumTemplatePage, { generateMetadata } from "@/app/[locale]/(public)/herramientas/plantilla-kakebo-excel-premium/page";

async function renderLanding(locale: "es" | "en") {
  return render(await PremiumTemplatePage({ params: Promise.resolve({ locale }) }));
}

function jsonLd(container: HTMLElement) {
  return [...container.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent ?? "{}"));
}

const COPY = {
  es: {
    label: "Disponible ahora",
    button: "Comprar Kakebo Master System",
    price: "Pago único de 9,90 € · descarga digital inmediata",
    status: "Compra disponible ahora. Recibirás acceso a los tres archivos tras confirmar el pago.",
    faq: "Sí. Kakebo Master System está disponible como compra única y no requiere cuenta.",
    banned: [/próximamente/i, /todavía no está disponible/i, /todavía no se puede comprar/i, /IVA incluido/i, /con el IVA/i],
  },
  en: {
    label: "Available now",
    button: "Buy Kakebo Master System",
    price: "€9.90 one-time payment · instant digital download",
    status: "Available now. You will receive access to all three files after payment confirmation.",
    faq: "Yes. Kakebo Master System is available as a one-time purchase and does not require an account.",
    banned: [/coming soon/i, /not available yet/i, /cannot be bought yet/i, /VAT included/i, /not yet/i],
  },
} as const;

beforeEach(() => {
  delete process.env.PREMIUM_COMMERCE_ENABLED;
});
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe.each(["es", "en"] as const)("premium landing — commerce ON (%s)", (locale) => {
  const copy = COPY[locale];
  beforeEach(() => vi.stubEnv("PREMIUM_COMMERCE_ENABLED", "true"));

  it("shows the agreed label, button, price, status and FAQ copy", async () => {
    const { container } = await renderLanding(locale);
    const text = container.textContent ?? "";
    expect(text).toContain(copy.label);
    expect(text).toContain(copy.price);
    expect(text).toContain(copy.status);
    expect(text).toContain(copy.faq);
    const buttons = [...container.querySelectorAll("button")].map((b) => b.textContent);
    expect(buttons).toContain(copy.button);
  });

  it("contains none of the 'not available' or fiscal phrases anywhere in the page", async () => {
    const { container } = await renderLanding(locale);
    const text = container.textContent ?? "";
    for (const re of copy.banned) expect(text).not.toMatch(re);
  });

  it("metadata no longer says coming soon nor claims VAT included", async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ locale }) });
    const description = String(meta.description);
    for (const re of copy.banned) expect(description).not.toMatch(re);
  });

  it("JSON-LD: Product with an Offer of 9.90 EUR, in stock", async () => {
    const { container } = await renderLanding(locale);
    const product = jsonLd(container).find((s) => s["@type"] === "Product");
    expect(product.offers).toMatchObject({
      "@type": "Offer",
      price: "9.90",
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
    });
    for (const re of copy.banned) expect(JSON.stringify(jsonLd(container))).not.toMatch(re);
  });
});

describe.each(["es", "en"] as const)("premium landing — commerce OFF (%s)", (locale) => {
  it("keeps the 'coming soon' copy and a Product without Offer", async () => {
    const { container } = await renderLanding(locale);
    const text = container.textContent ?? "";
    expect(text).toContain(locale === "es" ? "Próximamente" : "Coming soon");
    expect(text).toMatch(locale === "es" ? /todavía no está disponible/i : /not available yet/i);
    expect(text).not.toContain(COPY[locale].label);
    const product = jsonLd(container).find((s) => s["@type"] === "Product");
    expect(product).not.toHaveProperty("offers");
  });

  it("falls back to the same copy for any flag value other than 'true'", async () => {
    vi.stubEnv("PREMIUM_COMMERCE_ENABLED", "TRUE");
    const { container } = await renderLanding(locale);
    expect(container.textContent).toContain(locale === "es" ? "Próximamente" : "Coming soon");
  });
});
