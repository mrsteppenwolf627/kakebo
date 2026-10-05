// @vitest-environment node
import { describe, it, expect, vi } from "vitest";

// The real routing module pulls next-intl/navigation (client-only); only `locales` is needed here.
vi.mock("@/i18n/routing", () => ({ routing: { locales: ["en", "es"] } }));

import sitemap from "@/app/sitemap";

describe("sitemap regression", () => {
  // Update this expectation on purpose when the premium landing goes live (noindex removed).
  it("does not list the noindex premium landing", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls.some((u) => u.includes("plantilla-kakebo-excel-premium"))).toBe(false);
  });

  it("still lists the free template article in Spanish and English", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls.some((u) => u.endsWith("/blog/plantilla-kakebo-excel"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/en/blog/plantilla-kakebo-excel"))).toBe(true);
  });
});
