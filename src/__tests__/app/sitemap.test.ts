import { describe, it, expect, vi } from "vitest";
import type { BlogPost } from "@/lib/blog";

const esPosts: BlogPost[] = [
    {
        slug: "post-with-en",
        frontmatter: { title: "Post with EN", date: "2026-01-01", excerpt: "", author: "Test" },
        content: "",
    },
    {
        slug: "post-without-en",
        frontmatter: { title: "Post without EN", date: "2026-01-01", excerpt: "", author: "Test" },
        content: "",
    },
    {
        slug: "post-en-noindex",
        frontmatter: { title: "Post EN noindex", date: "2026-01-01", excerpt: "", author: "Test" },
        content: "",
    },
];

const enPosts: BlogPost[] = [
    {
        slug: "post-with-en",
        frontmatter: { title: "Post with EN (EN)", date: "2026-01-01", excerpt: "", author: "Test" },
        content: "",
    },
    {
        slug: "post-en-noindex",
        frontmatter: {
            title: "Post EN noindex (EN)",
            date: "2026-01-01",
            excerpt: "",
            author: "Test",
            noindex: true,
        },
        content: "",
    },
    // Note: "post-without-en" has no entry here at all, simulating a missing {slug}.en.mdx file.
];

vi.mock("@/lib/blog", () => ({
    getBlogPosts: vi.fn((locale: string = "es") => (locale === "en" ? enPosts : esPosts)),
}));

// Avoids pulling in next-intl's client navigation (and transitively next/navigation,
// unresolvable in this Vitest environment) — sitemap.ts only reads `routing.locales`.
vi.mock("@/i18n/routing", () => ({
    routing: { locales: ["en", "es"] },
}));

import sitemap from "@/app/sitemap";

describe("sitemap - English blog URL inclusion", () => {
    const entries = sitemap();
    const urls = entries.map((e) => e.url);

    it("includes the EN URL when a real, indexable .en.mdx file exists", () => {
        expect(urls).toContain("https://www.metodokakebo.com/en/blog/post-with-en");
    });

    it("excludes the EN URL when no .en.mdx file exists at all", () => {
        expect(urls).not.toContain("https://www.metodokakebo.com/en/blog/post-without-en");
    });

    it("excludes the EN URL when the .en.mdx file exists but is marked noindex", () => {
        expect(urls).not.toContain("https://www.metodokakebo.com/en/blog/post-en-noindex");
    });

    it("keeps the Spanish URL regardless of EN file availability", () => {
        expect(urls).toContain("https://www.metodokakebo.com/blog/post-with-en");
        expect(urls).toContain("https://www.metodokakebo.com/blog/post-without-en");
        expect(urls).toContain("https://www.metodokakebo.com/blog/post-en-noindex");
    });

    it("only lists an 'en' alternate language link when the EN file is real and indexable", () => {
        const withEn = entries.find((e) => e.url === "https://www.metodokakebo.com/blog/post-with-en");
        const withoutEn = entries.find((e) => e.url === "https://www.metodokakebo.com/blog/post-without-en");
        const noindexEn = entries.find((e) => e.url === "https://www.metodokakebo.com/blog/post-en-noindex");

        expect(withEn?.alternates?.languages).toHaveProperty("en");
        expect(withoutEn?.alternates?.languages).not.toHaveProperty("en");
        expect(noindexEn?.alternates?.languages).not.toHaveProperty("en");
    });
});
