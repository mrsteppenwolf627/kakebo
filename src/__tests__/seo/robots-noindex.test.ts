// @vitest-environment node
import { describe, it, expect, afterEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import robots from "@/app/robots";

/**
 * Regla de oro: una ruta que sirve `noindex` NUNCA puede estar en `Disallow`. Si Googlebot no puede descargar el
 * documento no ve el noindex y puede indexar la URL (sin snippet). Este test impide reintroducir ese conflicto.
 */

/**
 * Rutas que sirven noindex, y dónde se declara (la lista es explícita a propósito; si se añade una ruta noindex, se añade aquí):
 *  - /app/*, /en/app/*  → metadata `robots` de src/app/[locale]/app/layout.tsx
 *  - /auth/callback     → metadata `robots` de src/app/[locale]/auth/callback/layout.tsx
 *  - /login (+ ?mode=)  → metadata `robots` de src/app/[locale]/login/layout.tsx
 *  - /docs/*, /manifest.webmanifest → cabecera X-Robots-Tag de next.config.ts
 */
const NOINDEX_PATHS = [
  "/app",
  "/app/settings",
  "/app/history/2026-11",
  "/app?ym=2026-11",
  "/app/new?ym=2026-11",
  "/en/app",
  "/en/app/settings",
  "/auth/callback",
  "/en/auth/callback",
  "/login",
  "/login?mode=signup",
  "/login?mode=login",
  "/en/login",
  "/en/login?mode=signup",
  "/docs/x",
  "/manifest.webmanifest",
] as const;

/** Rutas que SÍ deben seguir bloqueadas (sin página propia o sin valor de búsqueda): sirven también para validar el matcher. */
const BLOCKED_PATHS = ["/api/health", "/history", "/history/2026-11", "/settings", "/new", "/new?ym=2026-11", "/en/history", "/en/new"] as const;

/** Rutas públicas indexables que nunca deben bloquearse. */
const INDEXABLE_PATHS = ["/", "/blog", "/blog/plantilla-kakebo-excel", "/herramientas/calculadora-ahorro", "/ahorro-entrada-vivienda/madrid", "/plantillas/kakebo-2027", "/newsletter", "/en", "/en/blog", "/?ref=producthunt", "/?utm_source=test", "/blog?utm_source=x", "/blog?a=1&utm_medium=y", "/en?utm_campaign=z"] as const;

/** Semántica de robots.txt (Google): el patrón se compara con ruta+query desde el inicio; `*` = cualquier secuencia; `$` final = fin de URL. */
function matches(pattern: string, urlPath: string): boolean {
  const anchored = pattern.endsWith("$");
  const body = anchored ? pattern.slice(0, -1) : pattern;
  const source = body
    .split("*")
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*");
  return new RegExp(`^${source}${anchored ? "$" : ""}`).test(urlPath);
}

function disallowRules(): string[] {
  const { rules } = robots();
  const list = Array.isArray(rules) ? rules : [rules];
  return list.flatMap((rule) => (rule.disallow === undefined ? [] : Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow]));
}

afterEach(() => vi.unstubAllEnvs());

describe("robots.txt vs noindex", () => {
  it("el matcher implementa `*`, `$` y prefijos como robots.txt", () => {
    expect(matches("/new$", "/new")).toBe(true);
    expect(matches("/new$", "/newsletter")).toBe(false);
    expect(matches("/new?", "/new?ym=1")).toBe(true);
    expect(matches("/*?utm_", "/blog?utm_source=x")).toBe(true);
    expect(matches("/*?utm_", "/blog?a=1&utm_x=1")).toBe(false);
    expect(matches("/*&utm_", "/blog?a=1&utm_x=1")).toBe(true);
    expect(matches("/history", "/history/2026-11")).toBe(true);
  });

  it.each(NOINDEX_PATHS)("ninguna regla Disallow cubre la ruta noindex %s", (urlPath) => {
    const hit = disallowRules().filter((rule) => matches(rule, urlPath));
    expect(hit, `${urlPath} está bloqueada por: ${hit.join(", ")}`).toEqual([]);
  });

  it.each(BLOCKED_PATHS)("sigue bloqueada %s", (urlPath) => {
    expect(disallowRules().some((rule) => matches(rule, urlPath))).toBe(true);
  });

  it.each(INDEXABLE_PATHS)("no se bloquea la ruta pública %s", (urlPath) => {
    expect(disallowRules().filter((rule) => matches(rule, urlPath))).toEqual([]);
  });

  it("las rutas de la lista noindex declaran de verdad noindex en el código", () => {
    const read = (rel: string) => readFileSync(join(process.cwd(), rel), "utf-8");
    expect(read("src/app/[locale]/app/layout.tsx")).toMatch(/index:\s*false/);
    expect(read("src/app/[locale]/auth/callback/layout.tsx")).toMatch(/index:\s*false/);
    expect(read("src/app/[locale]/login/layout.tsx")).toMatch(/index:\s*false/);
    const nextConfig = read("next.config.ts");
    expect(nextConfig).toMatch(/source:\s*"\/docs\/:path\*",\s*headers:\s*\[\{\s*key:\s*"X-Robots-Tag",\s*value:\s*"noindex"/);
    expect(nextConfig).toMatch(/source:\s*"\/manifest\.webmanifest",\s*headers:\s*\[\{\s*key:\s*"X-Robots-Tag",\s*value:\s*"noindex"/);
  });

  it("incluye el sitemap con la URL canónica fija", () => {
    expect(robots().sitemap).toBe("https://www.metodokakebo.com/sitemap.xml");
  });
});

describe("robots.txt en despliegues de preview", () => {
  it("VERCEL_ENV=preview devuelve Disallow: / para todos los agentes", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(robots().rules).toEqual({ userAgent: "*", disallow: "/" });
  });

  it("en producción no bloquea la raíz", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    expect(disallowRules()).not.toContain("/");
  });
});
