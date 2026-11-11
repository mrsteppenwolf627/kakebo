#!/usr/bin/env node
/**
 * Genera la línea base técnica de SEO a partir del build (.next/server/app). SOLO LECTURA sobre el sitio; escribe en <salida>.
 * Uso: npm run build && node scripts/seo-baseline.mjs docs/seo/baselines/AAAA-MM-DD
 * Escribe: audit-estricto.json y audit-estricto-tabla.txt (salida del audit estricto), conteos.json, migas-visibles.txt y jsonld-sha256.txt
 * (huella sha256 del JSON-LD de cada URL: una línea «hash  url»). No incluye datos sensibles: solo HTML público prerenderizado.
 */
import { readdirSync, readFileSync, statSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative, sep, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const out = resolve(process.argv[2] ?? '');
if (!process.argv[2]) { console.error('Uso: node scripts/seo-baseline.mjs <directorio-de-salida>'); process.exit(1); }
const ROOT = resolve('.next', 'server', 'app');
if (!existsSync(ROOT)) { console.error('Falta el build: ejecuta `npm run build` antes.'); process.exit(1); }
mkdirSync(out, { recursive: true });

const walk = (d, acc = []) => { for (const n of readdirSync(d)) { const f = join(d, n); statSync(f).isDirectory() ? walk(f, acc) : n.endsWith('.html') && acc.push(f); } return acc; };
const urlOf = (f) => {
  let rel = relative(ROOT, f).split(sep).join('/').replace(/\.html$/, '').replace(/(^|\/)index$/, '');
  if (rel === 'es') rel = ''; else if (rel.startsWith('es/')) rel = rel.slice(3);
  return `/${rel}`.replace(/\/+$/, '') || '/';
};
const LD = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
const NAV = /<nav aria-label="(?:Migas de pan|Breadcrumb)"/;

const files = walk(ROOT).sort();
const hashes = [], crumbs = [];
let withLd = 0;
for (const f of files) {
  const html = readFileSync(f, 'utf8');
  const url = urlOf(f);
  const ld = [...html.matchAll(LD)].map((m) => m[1]).join('\n');
  if (ld) { withLd++; hashes.push(`${createHash('sha256').update(ld).digest('hex')}  ${url}`); }
  if (NAV.test(html)) crumbs.push(url);
}
const sitemapFile = ['sitemap.xml', 'sitemap.xml.body'].map((n) => join(ROOT, n)).find((p) => existsSync(p) && statSync(p).isFile());
const sitemapUrls = sitemapFile ? (readFileSync(sitemapFile, 'utf8').match(/<loc>/g) ?? []).length : null;

writeFileSync(join(out, 'jsonld-sha256.txt'), `${hashes.sort((a, b) => a.slice(66).localeCompare(b.slice(66))).join('\n')}\n`);
writeFileSync(join(out, 'migas-visibles.txt'), `${crumbs.sort().join('\n')}\n`);
writeFileSync(join(out, 'conteos.json'), `${JSON.stringify({ paginasHtml: files.length, paginasConJsonLd: withLd, urlsSitemap: sitemapUrls, paginasConMigaVisible: crumbs.length }, null, 2)}\n`);

const r = spawnSync(process.execPath, ['scripts/audit-jsonld-visible.mjs', '--tabla', `--out=${join(out, 'audit-estricto.json')}`], { encoding: 'utf8' });
writeFileSync(join(out, 'audit-estricto-tabla.txt'), r.stdout);
console.log(`Línea base escrita en ${out}: ${files.length} HTML, ${withLd} con JSON-LD, sitemap ${sitemapUrls}, ${crumbs.length} con miga visible (audit: código ${r.status}).`);
