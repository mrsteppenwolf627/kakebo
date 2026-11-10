#!/usr/bin/env node
/**
 * Auditoría de integridad del grafo de enlaces internos (páginas huérfanas).
 * Ejecutar DESPUÉS de `next build` (npm run test:graph).
 *
 * A) Lista los HTML generados: `out/` (output: "export") o, si no existe, `.next/server/app` (prerenderizado).
 *    Lee también las URL del sitemap (`sitemap.xml` en out/ o `sitemap.xml.body` en .next/server/app): las rutas del
 *    sitemap sin HTML (páginas dinámicas) no se pueden leer como origen de enlaces, pero SÍ se evalúan como destino.
 * B) Extrae los <a href> internos de cada HTML.
 * C) Calcula enlaces entrantes por URL (los autoenlaces no cuentan; los enlaces desde rutas privadas /app y /auth tampoco,
 *    porque no forman parte del grafo público). 0 entrantes = huérfana. Candidatas: páginas con HTML ∪ URL del sitemap.
 * D) Filtra contra ALLOWLIST.
 * E) Si queda alguna huérfana: lista en consola y process.exit(1).
 *
 * Solo Node nativo (fs, path). Uso: node scripts/check-graph-integrity.mjs [directorio] [--base=https://www.metodokakebo.com]
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep, resolve } from 'node:path';

const ALLOWLIST = [
  '/aviso-legal',
  '/politica-privacidad',
  '/politica-cookies',
  '/gracias',
  '/checkout',
  '/login',
  // Rutas legales reales del sitio (privacy/terms/cookies) y entradas del panel privado (noindex, fuera del grafo público).
  '/privacy',
  '/terms',
  '/cookies',
  '/auth/callback',
];
// Prefijos privados (noindex): nunca forman parte del grafo público.
const PRIVATE_PREFIXES = ['/app', '/auth'];
const LOCALES = ['es', 'en'];
const DEFAULT_LOCALE = 'es';

const args = process.argv.slice(2);
const baseArg = args.find((a) => a.startsWith('--base='));
const BASE_ORIGIN = new URL(baseArg ? baseArg.slice(7) : 'https://www.metodokakebo.com').origin;
const dirArg = args.find((a) => !a.startsWith('--'));
const ROOT = resolve(dirArg ?? (existsSync('out') ? 'out' : join('.next', 'server', 'app')));

const red = (s) => `\x1b[31m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;

/** Quita el prefijo del idioma por defecto (/es/x → /x) y la barra final; /en/x se conserva. */
function normalizePath(p) {
  let path = p.split('#')[0].split('?')[0];
  try { path = decodeURI(path); } catch { /* se deja tal cual */ }
  if (!path.startsWith('/')) path = `/${path}`;
  path = path.replace(/\/{2,}/g, '/');
  const m = path.match(new RegExp(`^/${DEFAULT_LOCALE}(/|$)`));
  if (m) path = path.slice(DEFAULT_LOCALE.length + 1) || '/';
  if (path.length > 1) path = path.replace(/\/+$/, '');
  return path || '/';
}

/** Ruta del archivo HTML → URL pública normalizada (null si no es una página). */
function fileToUrl(root, file) {
  let rel = relative(root, file).split(sep).join('/');
  rel = rel.replace(/\.html$/, '');
  // Segmentos técnicos completos (_not-found, _global-error, 404, 500): coincidencia exacta, no por prefijo (p. ej. "/blog/500-euros" sí es página).
  if (rel.split('/').some((seg) => /^_/.test(seg) || seg === '404' || seg === '500')) return null;
  rel = rel.replace(/(^|\/)index$/, '');
  return normalizePath(`/${rel}`);
}

function walkHtml(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walkHtml(full, acc);
    else if (name.endsWith('.html')) acc.push(full);
  }
  return acc;
}

/** href internos de un HTML: relativos a la raíz o absolutos hacia BASE_ORIGIN. Ignora mailto:, tel:, #, recursos y /api. */
function extractInternalLinks(html) {
  const out = [];
  const re = /<a\s[^>]*?href\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
  let m;
  while ((m = re.exec(html))) {
    const href = (m[1] ?? m[2] ?? '').trim().replace(/&amp;/g, '&');
    if (!href || href.startsWith('#') || /^(mailto:|tel:|javascript:|data:)/i.test(href)) continue;
    let path;
    if (href.startsWith('//')) continue;
    if (/^https?:\/\//i.test(href)) {
      let u;
      try { u = new URL(href); } catch { continue; }
      if (u.origin !== BASE_ORIGIN) continue;
      path = u.pathname;
    } else if (href.startsWith('/')) path = href;
    else continue; // enlaces relativos sin barra: Next siempre emite rutas absolutas
    if (/^\/(api|_next|_vercel)(\/|$)/.test(path) || /\.[a-z0-9]{2,5}$/i.test(path)) continue;
    out.push(normalizePath(path));
  }
  return out;
}

/** URL del sitemap (normalizadas). Devuelve null si el archivo no existe en la salida del build. */
function readSitemapUrls(root) {
  const candidates = [join(root, 'sitemap.xml'), join(root, 'sitemap.xml.body')];
  const file = candidates.find((f) => existsSync(f) && statSync(f).isFile()); // en .next/server/app `sitemap.xml` es un directorio
  if (!file) return null;
  const xml = readFileSync(file, 'utf8');
  const urls = [];
  for (const m of xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)) {
    try { urls.push(normalizePath(new URL(m[1], BASE_ORIGIN).pathname)); } catch { /* loc inválido: se ignora */ }
  }
  return [...new Set(urls)];
}

const matchesAllow = (url) => {
  const bare = url.replace(new RegExp(`^/(${LOCALES.filter((l) => l !== DEFAULT_LOCALE).join('|')})(?=/|$)`), '') || '/';
  return ALLOWLIST.includes(url) || ALLOWLIST.includes(bare);
};
const isPrivate = (url) => {
  const bare = url.replace(/^\/en(?=\/|$)/, '') || '/';
  return PRIVATE_PREFIXES.some((p) => bare === p || bare.startsWith(`${p}/`));
};
/** La home (/ y /en) es punto de entrada: nunca se considera huérfana. */
const isEntry = (url) => url === '/' || url === '/en';

function main() {
  if (!existsSync(ROOT)) {
    console.error(red(`✖ No existe ${ROOT}. Ejecuta "next build" antes de este script.`));
    process.exit(1);
  }
  // Paso A
  const files = walkHtml(ROOT);
  const pages = new Map(); // url → archivo
  for (const f of files) {
    const url = fileToUrl(ROOT, f);
    if (url) pages.set(url, f);
  }
  if (pages.size === 0) {
    console.error(red(`✖ No se encontró ningún HTML en ${ROOT}.`));
    process.exit(1);
  }
  // Sitemap: destinos adicionales (también páginas sin HTML) y rutas que el script no puede leer como origen.
  const sitemapUrls = readSitemapUrls(ROOT);
  const sitemapWithoutHtml = sitemapUrls ? sitemapUrls.filter((u) => !pages.has(u)).sort() : [];
  // Pasos B y C: candidatas = páginas con HTML ∪ URL del sitemap. Solo cuentan enlaces desde páginas públicas distintas de la propia.
  const candidates = new Set([...pages.keys(), ...(sitemapUrls ?? [])]);
  const incoming = new Map([...candidates].map((u) => [u, new Set()]));
  for (const [url, file] of pages) {
    if (isPrivate(url)) continue; // /app y /auth: noindex, fuera del grafo público
    for (const target of new Set(extractInternalLinks(readFileSync(file, 'utf8')))) {
      if (target !== url && incoming.has(target)) incoming.get(target).add(url);
    }
  }
  // Pasos D y E
  const orphans = [...incoming].filter(([u, from]) => from.size === 0 && !isEntry(u) && !isPrivate(u) && !matchesAllow(u)).map(([u]) => u).sort();
  console.log(`Páginas analizadas: ${pages.size} (origen: ${relative(process.cwd(), ROOT) || '.'})`);
  if (sitemapUrls) {
    console.log(`Sitemap: ${sitemapUrls.length} URL; ${sitemapWithoutHtml.length} sin HTML en el build (evaluadas solo como destino)${sitemapWithoutHtml.length ? `: ${sitemapWithoutHtml.join(', ')}` : ''}.`);
  } else {
    console.warn(`⚠ No se encontró sitemap.xml en ${ROOT}: no se cruzan las URL del sitemap (solo se analizan los HTML).`);
  }
  if (orphans.length) {
    console.error(red(`\n✖ ${orphans.length} página(s) huérfana(s) (0 enlaces entrantes públicos) fuera de la ALLOWLIST:`));
    for (const o of orphans) console.error(red(`  - ${o}`));
    console.error(red('\nEnlázalas desde una página rastreable o añádelas a la ALLOWLIST si es intencionado.'));
    process.exit(1);
  }
  console.log(green('✔ Grafo íntegro: no hay páginas huérfanas fuera de la ALLOWLIST.'));
}

main();
