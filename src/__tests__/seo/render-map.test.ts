// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep, dirname } from "node:path";

// Mismo mock que el resto de tests de sitemap: sitemap.ts solo lee `routing.locales`.
vi.mock("@/i18n/routing", () => ({
  routing: { locales: ["en", "es"] },
}));

import sitemap from "@/app/sitemap";

/**
 * Mapa de renderizado e indexación. Documentado en docs/seo/RENDER_MAP_01.md.
 *
 * - SSG: público, contenido independiente de la petición (setRequestLocale, sin cookies/headers/searchParams/createClient).
 * - SSG_ISLAND: igual que SSG pero con componentes "use client" (calculadoras, botones de compra, formularios).
 *   `clientPage: true` = el propio page.tsx es cliente; el HTML estático sale del layout/shell.
 * - SSR: depende del usuario o de la petición. Debe ser noindex.
 * - CSR: página mínima que monta un componente cliente; los datos se cargan en el navegador. Debe ser noindex.
 * - REDIRECT: la página solo hace redirect(); no emite HTML propio, así que no hay metadata que indexar.
 */
type Mode = "SSG" | "SSG_ISLAND" | "SSR" | "CSR" | "REDIRECT";
interface Entry {
  mode: Mode;
  index: boolean;
  clientPage?: boolean;
  pseo?: boolean;
}

export const ROUTE_RENDER_MAP: Record<string, Entry> = {
  // --- Públicas indexables ---
  "/": { mode: "SSG", index: true },
  "/blog": { mode: "SSG", index: true },
  "/blog/[slug]": { mode: "SSG", index: true },
  "/tutorial": { mode: "SSG", index: true },
  "/sobre-nosotros": { mode: "SSG", index: true },
  "/herramientas": { mode: "SSG", index: true },
  "/privacy": { mode: "SSG", index: true },
  "/terms": { mode: "SSG", index: true },
  "/cookies": { mode: "SSG", index: true },
  "/plantillas/[slug]": { mode: "SSG", index: true, pseo: true },
  "/ahorro-entrada-vivienda": { mode: "SSG", index: true, pseo: true },
  "/ahorro-entrada-vivienda/[provincia]": { mode: "SSG", index: true, pseo: true },
  "/herramientas/calculadora-ahorro": { mode: "SSG_ISLAND", index: true },
  "/herramientas/calculadora-inflacion": { mode: "SSG_ISLAND", index: true },
  "/herramientas/regla-50-30-20": { mode: "SSG_ISLAND", index: true },
  "/herramientas/plantilla-kakebo-excel-premium": { mode: "SSG_ISLAND", index: true },
  // --- Públicas noindex ---
  "/login": { mode: "SSG_ISLAND", index: false, clientPage: true },
  "/auth/callback": { mode: "CSR", index: false, clientPage: true },
  // --- /app/* (noindex por app/layout.tsx) ---
  "/app": { mode: "SSR", index: false },
  "/app/agent": { mode: "SSR", index: false },
  "/app/scanner": { mode: "SSR", index: false },
  "/app/subscription": { mode: "SSR", index: false },
  "/app/admin": { mode: "CSR", index: false },
  "/app/ai-metrics": { mode: "CSR", index: false },
  "/app/cancel-subscription": { mode: "CSR", index: false },
  "/app/fixed": { mode: "CSR", index: false, clientPage: true },
  "/app/history": { mode: "CSR", index: false, clientPage: true },
  "/app/history/[ym]": { mode: "CSR", index: false, clientPage: true },
  "/app/new": { mode: "CSR", index: false },
  "/app/new-income": { mode: "CSR", index: false },
  "/app/settings": { mode: "CSR", index: false },
  "/app/fixed-expenses": { mode: "REDIRECT", index: false },
  // Heredadas (/history, /history/[ym], /settings, /new): ya no hay page.tsx; las resuelve next.config.ts con redirecciones 307 a /app/*.
};

const root = process.cwd();
const appDir = join(root, "src", "app");
const read = (abs: string) => readFileSync(abs, "utf-8");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const allFiles = walk(appDir);
const pageFiles = allFiles.filter((f) => f.endsWith(`${sep}page.tsx`));

function routeOf(pageFile: string): string {
  const parts = relative(appDir, dirname(pageFile))
    .split(sep)
    .filter((s) => s && s !== "[locale]" && !/^\(.*\)$/.test(s));
  return "/" + parts.join("/");
}

/** page.tsx + todos los layout.tsx desde su carpeta hasta src/app. */
function chainOf(pageFile: string): string[] {
  const files = [pageFile];
  let dir = dirname(pageFile);
  while (dir.startsWith(appDir)) {
    const layout = join(dir, "layout.tsx");
    if (existsSync(layout)) files.push(layout);
    if (dir === appDir) break;
    dir = dirname(dir);
  }
  return files;
}

const FORBIDDEN: [string, RegExp][] = [
  ["cookies()", /\bcookies\(\)/],
  ["headers()", /\bheaders\(\)/],
  ["searchParams", /\bsearchParams\b/],
  ["createClient", /\bcreateClient\b/],
  ["force-dynamic", /force-dynamic/],
];

const pageByRoute = new Map(pageFiles.map((f) => [routeOf(f), f]));
const entries = Object.entries(ROUTE_RENDER_MAP);
const staticEntries = entries.filter(([, e]) => e.mode === "SSG" || e.mode === "SSG_ISLAND");

describe("mapa de renderizado e indexación", () => {
  it("toda ruta con page.tsx está clasificada en ROUTE_RENDER_MAP (y viceversa)", () => {
    const found = [...pageByRoute.keys()].sort();
    const mapped = Object.keys(ROUTE_RENDER_MAP).sort();
    expect(found.filter((r) => !(r in ROUTE_RENDER_MAP)), "rutas nuevas sin clasificar").toEqual([]);
    expect(mapped.filter((r) => !pageByRoute.has(r)), "entradas del mapa sin page.tsx").toEqual([]);
  });

  it("no hay dos page.tsx que resuelvan a la misma ruta", () => {
    expect(pageByRoute.size).toBe(pageFiles.length);
  });

  it("todo route.ts cuelga de src/app/api (handlers dinámicos, no indexables)", () => {
    const routeFiles = allFiles.filter((f) => /[\\/]route\.tsx?$/.test(f));
    expect(routeFiles.length).toBeGreaterThan(0);
    for (const f of routeFiles) {
      expect(relative(appDir, f).startsWith(`api${sep}`), f).toBe(true);
    }
  });

  describe.each(staticEntries)("%s (SSG)", (route, entry) => {
    const page = pageByRoute.get(route)!;
    const layoutOfRoute = join(dirname(page), "layout.tsx");
    const sources = [page, ...(existsSync(layoutOfRoute) ? [layoutOfRoute] : [])];

    it("no usa APIs dependientes de la petición ni force-dynamic", () => {
      for (const f of sources) {
        // Una page cliente (login) usa createClient/searchParams del navegador: no cuenta como dependencia de servidor.
        if (entry.clientPage && f === page) continue;
        const src = read(f);
        for (const [label, re] of FORBIDDEN) {
          expect(re.test(src), `${relative(root, f)} contiene ${label}`).toBe(false);
        }
      }
    });

    if (!entry.clientPage) {
      it("fija el locale con setRequestLocale(locale)", () => {
        expect(read(page)).toContain("setRequestLocale(locale)");
      });
    }

    if (route.includes("[")) {
      it("segmento dinámico con generateStaticParams", () => {
        expect(read(page)).toMatch(/export (async )?function generateStaticParams\(/);
      });
    }

    if (entry.pseo) {
      it("pSEO con dynamicParams = false", () => {
        expect(read(page)).toMatch(/export const dynamicParams = false/);
      });
    }
  });

  describe("indexación", () => {
    const noindex = entries.filter(([, e]) => !e.index && e.mode !== "REDIRECT");

    it.each(noindex)("%s declara robots index:false en su página o layout", (route) => {
      const chain = chainOf(pageByRoute.get(route)!)
        // El layout raíz de [locale] decide por entorno (index: isProduction); no cuenta.
        .filter((f) => relative(appDir, f) !== join("[locale]", "layout.tsx"));
      const hit = chain.some((f) => /robots:\s*{\s*index:\s*false/.test(read(f)));
      expect(hit, `ninguno de ${chain.map((f) => relative(root, f)).join(", ")} declara index:false`).toBe(true);
    });

    it("las rutas noindex de servidor no dependen de metadata inyectada por JS cliente", () => {
      // La metadata (export metadata / generateMetadata) vive en archivos de servidor.
      for (const [route] of noindex) {
        for (const f of chainOf(pageByRoute.get(route)!)) {
          const src = read(f);
          if (/robots:\s*{\s*index:\s*false/.test(src)) {
            expect(/^\s*["']use client["']/.test(src), `${relative(root, f)} declara robots en un archivo "use client"`).toBe(false);
          }
        }
      }
    });

    it("las rutas indexables no declaran index:false en página ni layout propios", () => {
      for (const [route] of entries.filter(([, x]) => x.index)) {
        const page = pageByRoute.get(route)!;
        const own = [page, join(dirname(page), "layout.tsx")].filter(existsSync);
        for (const f of own) {
          // blog/[slug] marca noindex solo para posts concretos (frontmatter), de forma condicional.
          if (route === "/blog/[slug]") continue;
          expect(/robots:\s*{\s*index:\s*false/.test(read(f)), `${relative(root, f)} (${route})`).toBe(false);
        }
      }
    });

    it("/login no está en el sitemap (ES ni EN)", () => {
      const urls = sitemap().map((s) => s.url);
      expect(urls.some((u) => u.endsWith("/login"))).toBe(false);
    });

    it("ninguna ruta noindex del mapa aparece en el sitemap", () => {
      const urls = sitemap().map((s) => new URL(s.url).pathname);
      for (const [route] of noindex) {
        if (route.includes("[")) continue;
        expect(urls, route).not.toContain(route);
        expect(urls, `/en${route}`).not.toContain(`/en${route}`);
      }
    });
  });
});
