import { describe, it, expect, vi } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { createTranslator } from "next-intl";
import esMessages from "../../../messages/es.json";
import enMessages from "../../../messages/en.json";

/**
 * URLs con parámetros de seguimiento (/?ref=producthunt, ?utm_*, ?source=…).
 * Decisión: canonical a la URL limpia SIN redirigir y sin leer parámetros en servidor:
 *  - la canonical sale de `generateMetadata({ params })` (nunca recibe searchParams), así que no puede incluir la query;
 *  - leer `searchParams`/`headers()`/`cookies()` en una página pública la volvería dinámica (se rompería el SSG y el caché del CDN);
 *  - el cliente conserva la atribución: GA4 (`gtag('config')`) manda la `page_location` completa, con `?ref=` incluido.
 */

vi.mock("next-intl/server", () => ({
  setRequestLocale: vi.fn(),
  getTranslations: async ({ locale, namespace }: { locale: string; namespace: string }) =>
    createTranslator({ locale, namespace: namespace as never, messages: (locale === "en" ? enMessages : esMessages) as never }),
  getMessages: async ({ locale }: { locale: string }) => (locale === "en" ? enMessages : esMessages),
}));
vi.mock("next/dynamic", () => ({ default: () => () => null }));
vi.mock("@/i18n/routing", () => ({
  routing: { locales: ["en", "es"] },
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));
vi.mock("@/components/landing", () => ({
  Hero: () => null, Features: () => null, HowItWorks: () => null, FAQ: () => null, SeoContent: () => null,
  SavingsSimulator: () => null, AlternativesSection: () => null, ToolsSection: () => null,
}));
vi.mock("@/components/landing/Navbar", () => ({ Navbar: () => null }));
vi.mock("@/components/landing/tools/SavingsCalculator", () => ({ SavingsCalculator: () => null }));
vi.mock("@/components/i18n/ToolMessages", () => ({ ToolMessages: ({ children }: { children: React.ReactNode }) => <>{children}</> }));

import { generateMetadata as homeMeta } from "@/app/[locale]/(public)/page";
import { generateMetadata as savingsMeta } from "@/app/[locale]/(public)/herramientas/calculadora-ahorro/page";
import { generateMetadata as loginMeta } from "@/app/[locale]/login/layout";
import robots from "@/app/robots";

const BASE = "https://www.metodokakebo.com";
const TRACKING = { ref: "producthunt", utm_source: "test", utm_medium: "y", source: "calculator_503020", page: "2" };

type MetaFn = (a: { params: Promise<{ locale: string }>; searchParams?: Promise<Record<string, string>> }) => Promise<{ alternates?: { canonical?: unknown; languages?: unknown } }>;
const withAndWithout = async (fn: MetaFn, locale: "es" | "en") => ({
  clean: await fn({ params: Promise.resolve({ locale }) }),
  tracked: await fn({ params: Promise.resolve({ locale }), searchParams: Promise.resolve(TRACKING) }),
});

describe("canonical de URLs con parámetro de seguimiento", () => {
  it.each([
    ["home", homeMeta as unknown as MetaFn, "es", BASE],
    ["home", homeMeta as unknown as MetaFn, "en", `${BASE}/en`],
    ["calculadora de ahorro", savingsMeta as unknown as MetaFn, "es", `${BASE}/herramientas/calculadora-ahorro`],
    ["calculadora de ahorro", savingsMeta as unknown as MetaFn, "en", `${BASE}/en/herramientas/calculadora-ahorro`],
    ["login (noindex)", loginMeta as unknown as MetaFn, "es", `${BASE}/login`],
  ] as const)("%s (%s): la canonical es la URL limpia con y sin ?ref=, ?utm_*, ?source= o ?page=", async (_n, fn, locale, expected) => {
    const { clean, tracked } = await withAndWithout(fn, locale);
    expect(clean.alternates?.canonical).toBe(expected);
    expect(tracked.alternates?.canonical).toBe(expected);
    expect(String(tracked.alternates?.canonical)).not.toMatch(/[?#]/);
    expect(tracked.alternates?.languages).toEqual(clean.alternates?.languages);
  });

  it("?page=N no cambia la canonical: el sitio no pagina, así que cualquier ?page=N apunta a la URL limpia", async () => {
    const meta = await homeMeta({ params: Promise.resolve({ locale: "es" }) });
    expect(meta.alternates?.canonical).toBe(BASE);
  });
});

describe("las páginas públicas no leen parámetros en servidor (siguen estáticas y cacheables en el CDN)", () => {
  const APP = join(process.cwd(), "src", "app", "[locale]");
  const SKIP = new Set(["app", "auth", "login"]); // zona privada o noindex: pueden ser dinámicas
  const walk = (dir: string, acc: string[] = []): string[] => {
    for (const n of readdirSync(dir)) {
      const f = join(dir, n);
      if (statSync(f).isDirectory()) {
        if (dir === APP && SKIP.has(n)) continue;
        walk(f, acc);
      } else if (/^(page|layout)\.tsx$/.test(n)) acc.push(f);
    }
    return acc;
  };
  const files = [join(process.cwd(), "src", "app", "[locale]", "layout.tsx"), ...walk(APP)];
  const FORBIDDEN = /\bsearchParams\b|useSearchParams|\bheaders\(|\bcookies\(|\bconnection\(|unstable_noStore|noStore\(|force-dynamic/;

  it("hay páginas y layouts públicos que comprobar", () => {
    expect(files.length).toBeGreaterThan(15);
  });

  it.each(files.map((f) => [relative(process.cwd(), f).split(sep).join("/"), f] as const))("%s", (_rel, file) => {
    const src = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    expect(src).not.toMatch(FORBIDDEN);
  });
});

describe("robots.txt y parámetros de seguimiento", () => {
  const rules = () => {
    const r = robots().rules;
    const list = Array.isArray(r) ? r : [r];
    return list.flatMap((x) => (x.disallow === undefined ? [] : Array.isArray(x.disallow) ? x.disallow : [x.disallow]));
  };
  // Semántica de robots.txt: prefijo desde el inicio de ruta+query, `*` = cualquier secuencia.
  const SPECIAL = ".+?^${}()|[]";
  const escape = (s: string) => [...s].map((c) => (SPECIAL.includes(c) ? String.fromCharCode(92) + c : c)).join("");
  const blocked = (path: string) => rules().some((p) => new RegExp(`^${p.split("*").map(escape).join(".*")}`).test(path));

  it("?ref= se deja rastrear (Google debe ver la canonical limpia); ?utm_ sigue bloqueado como antes", () => {
    expect(blocked("/?ref=producthunt")).toBe(false);
    expect(blocked("/blog?ref=producthunt")).toBe(false);
    expect(blocked("/en?ref=producthunt")).toBe(false);
    expect(blocked("/?utm_source=test")).toBe(true);
    expect(blocked("/?ref=x&utm_medium=y")).toBe(true);
  });
});
