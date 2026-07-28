import { describe, it, expect, vi } from "vitest";

// Avoids pulling in next-intl's client navigation (and transitively next/navigation,
// unresolvable in this Vitest environment) — sitemap.ts only reads `routing.locales`.
// getBlogPosts itself is left unmocked so this test reads the real content directory.
vi.mock("@/i18n/routing", () => ({
    routing: { locales: ["en", "es"] },
}));

import sitemap from "@/app/sitemap";

// Integration test against the real src/content/blog directory (no mocks).
// Regression coverage for SEO-TECH-SITEMAP-FIX-BLOG-EN-01: three ES posts
// with no .en.mdx counterpart were being listed as /en/blog/{slug} in the
// sitemap despite returning HTTP 404 (confirmed in
// docs/seo/SEO_TECH_SITEMAP_VALIDATION_01.md).
describe("sitemap - real blog content (no mocks)", () => {
    const urls = sitemap().map((e) => e.url);

    it("does not list the three confirmed 404 English blog URLs", () => {
        expect(urls).not.toContain("https://www.metodokakebo.com/en/blog/cuentas-remuneradas");
        expect(urls).not.toContain("https://www.metodokakebo.com/en/blog/fondo-de-emergencia");
        expect(urls).not.toContain("https://www.metodokakebo.com/en/blog/regla-50-30-20-ejemplo");
    });

    it("still lists the Spanish URLs for those same posts", () => {
        expect(urls).toContain("https://www.metodokakebo.com/blog/cuentas-remuneradas");
        expect(urls).toContain("https://www.metodokakebo.com/blog/fondo-de-emergencia");
        expect(urls).toContain("https://www.metodokakebo.com/blog/regla-50-30-20-ejemplo");
    });

    it("still lists a known real, indexable EN blog post", () => {
        // como-ahorrar-dinero-cada-mes has a real .en.mdx file without noindex.
        expect(urls).toContain("https://www.metodokakebo.com/en/blog/como-ahorrar-dinero-cada-mes");
    });

    it("still excludes a known EN post explicitly marked noindex", () => {
        // ahorro-pareja.en.mdx exists but is marked noindex: true.
        expect(urls).not.toContain("https://www.metodokakebo.com/en/blog/ahorro-pareja");
        expect(urls).toContain("https://www.metodokakebo.com/blog/ahorro-pareja");
    });

    it("leaves /login and /en/login untouched (out of scope for this fix)", () => {
        expect(urls).toContain("https://www.metodokakebo.com/login");
        expect(urls).toContain("https://www.metodokakebo.com/en/login");
    });
});
