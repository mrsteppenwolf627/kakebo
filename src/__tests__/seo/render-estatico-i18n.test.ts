// @vitest-environment node
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf-8");

describe("render estático con next-intl y viewport", () => {
  const layout = read("src/app/[locale]/layout.tsx");

  it("el layout declara generateStaticParams para todos los locales y fija el locale con setRequestLocale", () => {
    expect(layout).toMatch(/export function generateStaticParams\(\)\s*{\s*return routing\.locales\.map/);
    expect(layout).toContain("setRequestLocale(locale)");
    // setRequestLocale debe ir antes de leer los mensajes (getMessages).
    expect(layout.indexOf("setRequestLocale(locale)")).toBeLessThan(layout.indexOf("await getMessages()"));
  });

  it("themeColor está en viewport y no en metadata", () => {
    expect(layout).toMatch(/export const viewport: Viewport = {\s*themeColor: "#fafaf9"/);
    const metadataBlock = layout.slice(layout.indexOf("export async function generateMetadata"), layout.indexOf("export default async function"));
    expect(metadataBlock).not.toContain("themeColor");
  });

  it.each([
    "src/app/[locale]/(public)/ahorro-entrada-vivienda/page.tsx",
    "src/app/[locale]/(public)/ahorro-entrada-vivienda/[provincia]/page.tsx",
  ])("%s fija el locale con setRequestLocale", (rel) => {
    expect(read(rel)).toContain("setRequestLocale(locale)");
  });
});
