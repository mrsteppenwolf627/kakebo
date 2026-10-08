// @vitest-environment node
import { describe, it, expect, vi } from "vitest";

// The real routing module pulls next-intl/navigation (client-only); only `locales` is needed here.
vi.mock("@/i18n/routing", () => ({ routing: { locales: ["en", "es"] } }));

import sitemap from "@/app/sitemap";

describe("sitemap regression", () => {
  it("lists the public premium landing in Spanish and English with reciprocal alternates", () => {
    const entries = sitemap().filter((e) => e.url.includes("plantilla-kakebo-excel-premium"));
    expect(entries.map((e) => e.url).sort()).toEqual([
      "https://www.metodokakebo.com/en/herramientas/plantilla-kakebo-excel-premium",
      "https://www.metodokakebo.com/herramientas/plantilla-kakebo-excel-premium",
    ]);
    for (const e of entries) {
      expect(e.alternates?.languages).toEqual({
        en: "https://www.metodokakebo.com/en/herramientas/plantilla-kakebo-excel-premium",
        es: "https://www.metodokakebo.com/herramientas/plantilla-kakebo-excel-premium",
        "x-default": "https://www.metodokakebo.com/herramientas/plantilla-kakebo-excel-premium",
      });
    }
  });

  it("gives the pages whose content changed in the SEO pass their own lastModified without touching other core routes", () => {
    const all = sitemap();
    const day = (e: { lastModified?: string | Date }) => new Date(e.lastModified as Date).toISOString().slice(0, 10);
    const premium = all.filter((e) => e.url.includes("plantilla-kakebo-excel-premium"));
    for (const e of premium) {
      expect(day(e)).toBe("2026-10-08");
      expect(e.priority).toBe(0.8);
    }
    const tools = all.find((e) => e.url === "https://www.metodokakebo.com/herramientas");
    expect(day(tools!)).toBe("2026-10-08");
    // Core routes that were not edited keep the shared date.
    const about = all.find((e) => e.url === "https://www.metodokakebo.com/sobre-nosotros");
    expect(day(about!)).toBe("2026-07-07");
  });

  it("declares x-default (the Spanish URL) on every alternates block that has languages", () => {
    for (const e of sitemap()) {
      const langs = e.alternates?.languages as Record<string, string> | undefined;
      if (!langs) continue;
      expect(langs["x-default"]).toBeDefined();
      expect(langs["x-default"]).toBe(langs.es);
    }
  });

  it("still lists the free template article in Spanish and English", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls.some((u) => u.endsWith("/blog/plantilla-kakebo-excel"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/en/blog/plantilla-kakebo-excel"))).toBe(true);
  });
});
