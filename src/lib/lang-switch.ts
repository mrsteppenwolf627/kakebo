/**
 * Selector de idioma como enlace real (<a href="/en/…">): solo se emite cuando existe la versión EN equivalente Y es indexable.
 * Así el HTML estático enlaza /en/* desde las páginas ES sin crear enlaces a 404 ni a páginas noindex.
 * Si no hay equivalente enlazable, LanguageSwitcher conserva el botón anterior (sin href).
 *
 * `src/__tests__/lib/lang-switch.test.ts` comprueba esta lista contra los .mdx del blog.
 */

/** Secciones solo en español: su /en/… da 404 (ver src/middleware.ts). */
const SPANISH_ONLY_PREFIXES = ["/plantillas", "/ahorro-entrada-vivienda"] as const;

/** Artículos sin versión EN (404 bajo /en) o con la versión EN en noindex (fuera del sitemap). */
export const BLOG_SLUGS_WITHOUT_LINKABLE_EN: ReadonlySet<string> = new Set([
  // sin versión EN
  "cuentas-remuneradas",
  "fondo-de-emergencia",
  "regla-50-30-20-ejemplo",
  // versión EN con noindex
  "ahorro-pareja",
  "alternativas-a-app-bancarias",
  "kakebo-online-gratis",
  "kakebo-online-guia-completa",
  "kakebo-sueldo-minimo",
  "kakebo-vs-ynab",
  "libro-kakebo-pdf",
  "metodo-kakebo-para-autonomos",
  "peligros-apps-ahorro-automatico",
  "regla-30-dias",
]);

/** `pathname` sin prefijo de idioma (como lo devuelve usePathname de next-intl). */
export function englishEquivalentLinkable(pathname: string): boolean {
  const path = pathname.split("?")[0].replace(/\/+$/, "") || "/";
  if (SPANISH_ONLY_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) return false;
  const blog = /^\/blog\/([^/]+)$/.exec(path);
  if (blog && BLOG_SLUGS_WITHOUT_LINKABLE_EN.has(blog[1])) return false;
  return true;
}
