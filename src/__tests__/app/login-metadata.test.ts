import { describe, it, expect, vi } from "vitest";

// Deterministic translation stub, decoupled from the real messages/*.json content —
// this test asserts on URL structure and locale-branching, not on exact copy.
const dict: Record<string, Record<string, string>> = {
    es: { title: "Iniciar Sesión | Kakebo", description: "Accede a tu cuenta de Kakebo." },
    en: { title: "Log In | Kakebo", description: "Access your Kakebo account." },
};

vi.mock("next-intl/server", () => ({
    getTranslations: vi.fn(async ({ locale }: { locale: string }) => {
        return (key: string) => dict[locale][key];
    }),
}));

import { generateMetadata } from "@/app/[locale]/login/layout";

describe("login layout metadata", () => {
    it("declares the clean /login URL as canonical for the Spanish locale", async () => {
        const meta = await generateMetadata({ params: Promise.resolve({ locale: "es" }) });
        expect(meta.alternates?.canonical).toBe("https://www.metodokakebo.com/login");
    });

    it("declares the clean /en/login URL as canonical for the English locale", async () => {
        const meta = await generateMetadata({ params: Promise.resolve({ locale: "en" }) });
        expect(meta.alternates?.canonical).toBe("https://www.metodokakebo.com/en/login");
    });

    it("never references /es/login in canonical or hreflang, for either locale", async () => {
        const metaEs = await generateMetadata({ params: Promise.resolve({ locale: "es" }) });
        const metaEn = await generateMetadata({ params: Promise.resolve({ locale: "en" }) });
        expect(JSON.stringify(metaEs)).not.toContain("/es/login");
        expect(JSON.stringify(metaEn)).not.toContain("/es/login");
    });

    it("localizes title and description per locale", async () => {
        const metaEs = await generateMetadata({ params: Promise.resolve({ locale: "es" }) });
        const metaEn = await generateMetadata({ params: Promise.resolve({ locale: "en" }) });
        expect(metaEs.title).toBe("Iniciar Sesión | Kakebo");
        expect(metaEs.description).toBe("Accede a tu cuenta de Kakebo.");
        expect(metaEn.title).toBe("Log In | Kakebo");
        expect(metaEn.description).toBe("Access your Kakebo account.");
    });

    it("declares hreflang for es/en/x-default pointing only to canonical, 200-serving URLs", async () => {
        const meta = await generateMetadata({ params: Promise.resolve({ locale: "es" }) });
        expect(meta.alternates?.languages).toEqual({
            es: "https://www.metodokakebo.com/login",
            en: "https://www.metodokakebo.com/en/login",
            "x-default": "https://www.metodokakebo.com/login",
        });
    });

    it("x-default points to the Spanish canonical (site default locale)", async () => {
        const metaEn = await generateMetadata({ params: Promise.resolve({ locale: "en" }) });
        expect(metaEn.alternates?.languages?.["x-default"]).toBe("https://www.metodokakebo.com/login");
    });

    it("canonical is built only from the locale segment, never from a query string (no '?')", async () => {
        // generateMetadata in a layout never receives `searchParams` in Next.js — this
        // guarantees /login?mode=signup&source=... always resolves the same clean
        // canonical as /login, since the function has no access to query params at all.
        const metaEs = await generateMetadata({ params: Promise.resolve({ locale: "es" }) });
        const metaEn = await generateMetadata({ params: Promise.resolve({ locale: "en" }) });
        expect(metaEs.alternates?.canonical).not.toContain("?");
        expect(metaEn.alternates?.canonical).not.toContain("?");
    });
});
