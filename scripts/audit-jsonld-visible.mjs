#!/usr/bin/env node
/**
 * Auditoría del JSON-LD frente al texto visible del HTML prerenderizado. SOLO LECTURA. Ejecutar DESPUÉS de `next build`.
 *
 *  1. Páginas auditadas = TODAS las URL del sitemap (con HTML) ∪ las páginas con JSON-LD que no están en el sitemap (noindex).
 *     Si alguna URL del sitemap no tiene HTML auditable, se lista y el script sale con código 1.
 *  2. Estructura: un único <script type="application/ld+json">, un único @graph, sin @id colgantes y, si se pasa
 *     --vocab=<schemaorg.jsonld>, tipos y propiedades válidos según el vocabulario de schema.org.
 *  3. Visibilidad: name, headline, description, featureList, fechas, Question.name, Answer.text, HowTo… deben figurar en el texto
 *     visible. Los que no, se INFORMAN (no se corrigen aquí). Las entidades globales (Organization, WebSite, Person, DefinedTerm…)
 *     se informan aparte: su nombre/descripción solo es visible en algunas páginas por diseño.
 *
 * Uso: node scripts/audit-jsonld-visible.mjs [directorio] [--vocab=ruta] [--out=informe.json] [--json] [--tabla]
 * Comprobación ESTRICTA (scripts/lib/visible-estricto.mjs): BreadcrumbList contra el <nav> de miga, FAQ contra el bloque de FAQ,
 * HowTo/ItemList/WebApplication contra encabezados y listas. Las comprobaciones antiguas por subcadena global se conservan
 * como INFORMATIVAS (sección noVisibles*), pero dan falsos «visible». Script manual: no forma parte de validate ni de CI.
 * Salida: resumen en consola (con la lista exacta de URL auditadas) y, con --out, el detalle en JSON.
 */
import { readdirSync, readFileSync, statSync, existsSync, writeFileSync } from 'node:fs';
import { join, relative, sep, resolve } from 'node:path';
import { parseHtml, cleanDom, strictChecks } from './lib/visible-estricto.mjs';

const args = process.argv.slice(2);
const opt = (name) => args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const ROOT = resolve(args.find((a) => !a.startsWith('--')) ?? join('.next', 'server', 'app'));
const vocabPath = opt('vocab');
const outPath = opt('out');

const asArr = (x) => (x === undefined ? [] : Array.isArray(x) ? x : [x]);

/* ---------------- vocabulario schema.org (opcional) ---------------- */
let byId = null;
if (vocabPath) byId = new Map(JSON.parse(readFileSync(vocabPath, 'utf8'))['@graph'].map((x) => [x['@id'], x]));
const idsOf = (x) => asArr(x).map((y) => y['@id']);
const supers = (cls, seen = new Set()) => {
  if (seen.has(cls)) return seen;
  seen.add(cls);
  const n = byId.get(cls);
  if (n) for (const s of idsOf(n['rdfs:subClassOf'])) supers(s, seen);
  return seen;
};
const typeOk = (t) => { const n = byId.get(`schema:${t}`); return !!n && asArr(n['@type']).some((x) => /Class/.test(x)); };
const propDomains = (p) => { const n = byId.get(`schema:${p}`); return n ? idsOf(n['schema:domainIncludes']) : null; };
function propValidFor(types, prop) {
  const dom = propDomains(prop);
  if (dom === null) return 'no-existe';
  for (const t of types) if (dom.some((d) => supers(`schema:${t}`).has(d))) return 'ok';
  return 'dominio';
}

/* ---------------- texto visible ---------------- */
const dec = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
const norm = (s) => dec(String(s)).toLowerCase().replace(/<[^>]+>/g, '').replace(/(\*\*|__)/g, '').replace(/[“”«»"']/g, '').replace(/\s+/g, ' ').trim();
const INLINE = /<\/?(?:a|abbr|b|code|em|i|mark|small|span|strong|sub|sup|time|u|cite|q|s)(?:\s[^>]*)?>/gi;
// Las etiquetas en línea se eliminan SIN espacio (el texto de un enlace no separa la puntuación); el resto separa palabras.
const visibleOf = (h) => norm(h.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(INLINE, '').replace(/<[^>]+>/g, ' '));
const monthName = (loc, d) => new Date(`${d}T00:00:00Z`).toLocaleDateString(loc === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

/* ---------------- páginas y sitemap ---------------- */
function normalizePath(p) {
  let path = p.split('#')[0].split('?')[0];
  try { path = decodeURI(path); } catch { /* tal cual */ }
  if (!path.startsWith('/')) path = `/${path}`;
  const m = path.match(/^\/es(\/|$)/);
  if (m) path = path.slice(3) || '/';
  if (path.length > 1) path = path.replace(/\/+$/, '');
  return path || '/';
}
function fileToUrl(file) {
  let rel = relative(ROOT, file).split(sep).join('/').replace(/\.html$/, '');
  if (rel.split('/').some((seg) => /^_/.test(seg) || seg === '404' || seg === '500')) return null;
  return normalizePath(`/${rel.replace(/(^|\/)index$/, '')}`);
}
function walkHtml(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walkHtml(full, acc);
    else if (name.endsWith('.html')) acc.push(full);
  }
  return acc;
}
function readSitemapUrls() {
  for (const name of ['sitemap.xml', 'sitemap.xml.body']) {
    const f = join(ROOT, name);
    if (existsSync(f) && statSync(f).isFile()) {
      return [...readFileSync(f, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => normalizePath(new URL(m[1].trim()).pathname));
    }
  }
  return null;
}

const files = new Map();
for (const f of walkHtml(ROOT)) { const u = fileToUrl(f); if (u) files.set(u, f); }
const sitemap = readSitemapUrls();
if (!sitemap) { console.error('No se encontró el sitemap en', ROOT); process.exit(1); }
const sitemapSet = new Set(sitemap);

const LD = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
const audited = [];
const noLd = [];
for (const [url, file] of [...files].sort(([a], [b]) => a.localeCompare(b))) {
  const html = readFileSync(file, 'utf8');
  const scripts = [...html.matchAll(LD)];
  if (!scripts.length && !sitemapSet.has(url)) { noLd.push(url); continue; }
  audited.push({ url, html, scripts, inSitemap: sitemapSet.has(url) });
}
const sitemapWithoutHtml = sitemap.filter((u) => !files.has(u));

const decodeTitle = (s) => dec(s);
/* ---------------- auditoría ---------------- */
const ENTITY_TYPES = new Set(['Organization', 'WebSite', 'Person', 'DefinedTerm', 'ImageObject', 'SoftwareApplication', 'Country']);
const structural = [], dangling = [], invisible = [], noJsonLd = [];
const strictRows = []; // comprobación estricta por tipo de nodo y ubicación (ver scripts/lib/visible-estricto.mjs)

for (const { url, html, scripts } of audited) {
  const loc = url === '/en' || url.startsWith('/en/') ? 'en' : 'es';
  if (scripts.length === 0) { noJsonLd.push(url); continue; }
  if (scripts.length !== 1) structural.push({ url, issue: `scripts=${scripts.length}` });
  const doc = JSON.parse(scripts[0][1]);
  if (!Array.isArray(doc['@graph'])) { structural.push({ url, issue: 'sin @graph' }); continue; }
  const vis = visibleOf(html);
  const defs = new Set(), refs = new Set();
  const visit = (node) => {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!node || typeof node !== 'object') return;
    const keys = Object.keys(node);
    if (typeof node['@id'] === 'string') (keys.length === 1 ? refs : defs).add(node['@id']);
    const types = asArr(node['@type']);
    if (byId && types.length) {
      for (const t of types) if (!typeOk(t)) structural.push({ url, issue: `tipo inexistente: ${t}` });
      for (const k of keys) {
        if (k.startsWith('@')) continue;
        const r = propValidFor(types, k);
        if (r !== 'ok') structural.push({ url, issue: `propiedad ${r === 'no-existe' ? 'inexistente' : 'no válida para el tipo'}: ${types.join('/')}.${k}` });
      }
    }
    for (const k of keys) if (k !== '@id') visit(node[k]);
  };
  visit(doc['@graph']);
  for (const r of refs) if (!defs.has(r)) dangling.push({ url, id: r });

  const chk = (node, prop, val, kind) => {
    if (val === undefined || val === null || val === '') return;
    for (const v of asArr(val).filter((x) => typeof x === 'string' || typeof x === 'number')) {
      const s = String(v);
      let ok;
      if (prop === 'price') ok = vis.includes(norm(s.replace('.', ','))) || vis.includes(norm(s));
      else if (prop === 'datePublished' || prop === 'dateModified') { const d = s.slice(0, 10); ok = vis.includes(norm(monthName(loc, d))) || new RegExp(`datetime="${d}`, 'i').test(html); }
      else if (prop === 'headline') ok = vis.includes(norm(s).slice(0, 80));
      else ok = vis.includes(norm(s));
      if (!ok) invisible.push({ url, kind, type: asArr(node['@type']).join('/'), prop, value: s });
    }
  };
  const handleNode = (node) => {
    const t0 = asArr(node['@type'])[0];
    const k = ENTITY_TYPES.has(t0) ? 'entidad-global' : 'pagina';
    for (const p of ['name', 'headline', 'description', 'alternateName', 'telephone', 'email', 'featureList', 'datePublished', 'dateModified', 'priceCurrency']) {
      if (node[p] !== undefined) chk(node, p, node[p], k);
    }
    if (t0 === 'Offer') chk(node, 'price', node.price, 'pagina');
    if (node.acceptedAnswer) chk(node.acceptedAnswer, 'text', node.acceptedAnswer.text, 'pagina');
    if (t0 === 'HowToStep') { chk(node, 'text', node.text, 'pagina'); chk(node, 'name', node.name, 'pagina'); }
    if (t0 === 'BlogPosting' && node.author?.['@id']) {
      const a = doc['@graph'].find((n) => n['@id'] === node.author['@id']);
      if (a) chk(a, 'name (autor)', a.name, 'pagina');
    }
  };
  const walk = (n) => {
    if (Array.isArray(n)) return n.forEach(walk);
    if (!n || typeof n !== 'object') return;
    if (n['@type'] && Object.keys(n).length > 1) handleNode(n);
    for (const k of Object.keys(n)) if (k !== '@id') walk(n[k]);
  };
  walk(doc['@graph']);

  // Comprobación estricta: DOM sin cabecera/pie globales ni script/style/noscript; cada tipo de nodo contra su bloque.
  const dom = cleanDom(parseHtml(html));
  const isHome = url === '/' || url === '/en';
  const homeTitle = isHome ? decodeTitle(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '') : '';
  for (const r of strictChecks(doc['@graph'], dom, { homeTitle })) strictRows.push({ url, ...r, subcadenaGlobal: vis.includes(norm(r.value)) });
}

/* ---------------- informe ---------------- */
const group = (rows, keyOf) => {
  const m = new Map();
  for (const r of rows) { const k = keyOf(r); if (!m.has(k)) m.set(k, { ...r, urls: new Set() }); m.get(k).urls.add(r.url); }
  return [...m.values()].map((g) => ({ ...g, url: undefined, urls: [...g.urls].sort() }));
};
const withLd = audited.filter((p) => p.scripts.length > 0);
const report = {
  sitemapUrls: sitemap.length,
  auditadas: audited.map((p) => p.url),
  auditadasEnSitemap: audited.filter((p) => p.inSitemap).map((p) => p.url),
  auditadasFueraDeSitemap: audited.filter((p) => !p.inSitemap).map((p) => p.url),
  sitemapSinHtml: sitemapWithoutHtml,
  sinJsonLd: [...noJsonLd],
  paginasSinJsonLdFueraDelSitemap: noLd,
  conJsonLd: withLd.length,
  estructurales: group(structural, (a) => a.issue),
  colgantes: dangling,
  noVisiblesPagina: group(invisible.filter((x) => x.kind === 'pagina'), (a) => `${a.type}.${a.prop}|${a.value}`),
  noVisiblesEntidad: group(invisible.filter((x) => x.kind === 'entidad-global'), (a) => `${a.type}.${a.prop}|${a.value}`),
};
report.estricto = strictRows;
if (outPath) writeFileSync(outPath, JSON.stringify(report, null, 1));

const byType = {};
for (const r of invisible.filter((x) => x.kind === 'pagina')) byType[`${r.type}.${r.prop}`] = (byType[`${r.type}.${r.prop}`] ?? 0) + 1;
const summary = {
  sitemapUrls: report.sitemapUrls,
  paginasAuditadas: report.auditadas.length,
  auditadasEnSitemap: report.auditadasEnSitemap.length,
  auditadasFueraDeSitemapConJsonLd: report.auditadasFueraDeSitemap.length,
  sitemapSinHtml: report.sitemapSinHtml.length,
  paginasConJsonLd: report.conJsonLd,
  sinJsonLd: report.sinJsonLd.length,
  estructurales: report.estructurales.length,
  colgantes: report.colgantes.length,
  noVisiblesPagina: invisible.filter((x) => x.kind === 'pagina').length,
  noVisiblesPaginaPorTipo: byType,
  noVisiblesEntidad: invisible.filter((x) => x.kind === 'entidad-global').length,
  vocabulario: byId ? 'verificado' : 'no verificado (sin --vocab)',
};
if (args.includes('--json')) console.log(JSON.stringify({ summary, ...report }, null, 1));
else {
  console.log(JSON.stringify(summary, null, 1));
  console.log(`\nURL auditadas (${report.auditadas.length}):`);
  for (const p of audited) console.log(`  ${p.inSitemap ? 'sitemap ' : 'noindex '}${p.scripts.length ? 'ld ' : 'sin-ld'} ${p.url}`);
  if (sitemapWithoutHtml.length) console.log(`\nURL del sitemap sin HTML auditable (${sitemapWithoutHtml.length}):\n  ${sitemapWithoutHtml.join('\n  ')}`);
}
/* ---------------- resumen estricto ---------------- */
{
  const bad = strictRows.filter((r) => !r.visible);
  const falsos = strictRows.filter((r) => !r.visible && r.subcadenaGlobal);
  const uniq = (rows) => new Set(rows.map((r) => `${r.type}.${r.prop}|${r.value}`)).size;
  const pages = (rows) => new Set(rows.map((r) => r.url)).size;
  const porTipo = {};
  for (const r of strictRows) {
    const k = `${r.type}.${r.prop}`;
    porTipo[k] ??= { filas: 0, noVisibles: 0, falsosVisibles: 0 };
    porTipo[k].filas++;
    if (!r.visible) porTipo[k].noVisibles++;
    if (!r.visible && r.subcadenaGlobal) porTipo[k].falsosVisibles++;
  }
  const est = {
    filasComprobadas: strictRows.length,
    paginasConComprobacion: pages(strictRows),
    noVisibles: { filas: bad.length, paginasAfectadas: pages(bad), nombresUnicos: uniq(bad) },
    falsosVisiblesDeLaSubcadena: { filas: falsos.length, paginasAfectadas: pages(falsos), nombresUnicos: uniq(falsos) },
    porTipo,
  };
  if (!args.includes('--json')) console.log(`\nCOMPROBACIÓN ESTRICTA (filas = una por página y nodo; nombres únicos = tipo.propiedad|valor distintos):\n${JSON.stringify(est, null, 1)}`);
  if (args.includes('--tabla')) {
    console.log('\nTABLA ESTRICTA (url | tipo.prop | visible | subcadena global | valor | dónde):');
    for (const r of strictRows) console.log(`${r.url} | ${r.type}.${r.prop} | ${r.visible ? 'sí' : 'NO'} | ${r.subcadenaGlobal ? 'sí' : 'no'} | ${r.value.slice(0, 70).replace(/\|/g, '/')} | ${r.where}`);
  }
}
process.exit(sitemapWithoutHtml.length || structural.length || dangling.length ? 1 : 0);
