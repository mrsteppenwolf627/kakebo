/**
 * Comprobación ESTRICTA de visibilidad del JSON-LD: por tipo de nodo y por ubicación en el DOM, no por subcadena global.
 * Funciones puras (sin I/O) para poder probarlas con fixtures. SOLO LECTURA: nunca modifica el sitio.
 *
 * Qué se excluye siempre de la búsqueda: <script>, <style>, <noscript>, <template>, <svg>, comentarios, la cabecera global
 * (<header> con clase "fixed"), el pie global (<footer> con clase "border-t") y los nodos aria-hidden="true". El banner de
 * cookies es solo de cliente y no está en el HTML servido; si apareciera con role="dialog" o aria-modal también se excluye.
 */

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const RAW = new Set(['script', 'style', 'noscript', 'template', 'svg']);
const BLOCK = new Set(['div', 'p', 'li', 'ul', 'ol', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'section', 'article', 'header', 'footer', 'nav', 'main', 'br', 'details', 'summary', 'table', 'tr', 'td', 'th', 'dd', 'dt', 'dl', 'blockquote', 'figure', 'aside', 'form']);
const NAMED = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ' };

export const decodeEntities = (s) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') {
      const cp = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(cp) ? String.fromCodePoint(cp) : m;
    }
    return NAMED[e.toLowerCase()] ?? m;
  });

/** Espacios colapsados y recortados; entidades ya decodificadas. Conserva mayúsculas y puntuación. */
export const collapse = (s) => s.replace(/\s+/g, ' ').trim();
/** Para comparar prosa: sin espacios en absoluto (un enlace o <strong> no separa palabras en el HTML pero sí en el texto plano). */
export const compact = (s) => s.replace(/\s+/g, '');

export function parseHtml(html) {
  const root = { tag: '#root', attrs: {}, children: [], parent: null };
  let cur = root;
  const re = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w:-]*)((?:"[^"]*"|'[^']*'|[^'">])*)>|([^<]+|<)/g;
  let m;
  while ((m = re.exec(html))) {
    if (m[0].startsWith('<!--')) continue;
    if (m[4] !== undefined) {
      cur.children.push({ text: decodeEntities(m[4]) });
      continue;
    }
    const closing = m[1] === '/';
    const tag = m[2].toLowerCase();
    if (closing) {
      let n = cur;
      while (n && n.tag !== tag) n = n.parent;
      if (n && n.parent) cur = n.parent;
      continue;
    }
    const attrs = {};
    for (const a of m[3].matchAll(/([^\s=/"']+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g)) attrs[a[1].toLowerCase()] = decodeEntities(a[2] ?? a[3] ?? a[4] ?? '');
    if (RAW.has(tag)) {
      if (!m[3].endsWith('/')) {
        const end = html.toLowerCase().indexOf(`</${tag}`, re.lastIndex);
        if (end >= 0) re.lastIndex = html.indexOf('>', end) + 1;
      }
      continue;
    }
    const node = { tag, attrs, children: [], parent: cur };
    cur.children.push(node);
    if (!VOID.has(tag) && !m[3].endsWith('/')) cur = node;
  }
  return root;
}

const isGlobalChrome = (n) =>
  (n.tag === 'header' && /(^|\s)fixed(\s|$)/.test(n.attrs.class ?? '')) ||
  (n.tag === 'footer' && /(^|\s)border-t(\s|$)/.test(n.attrs.class ?? '')) ||
  n.attrs.role === 'dialog' ||
  n.attrs['aria-modal'] === 'true';

/** Quita (en sitio) la cabecera global, el pie global, los diálogos y lo aria-hidden. */
export function cleanDom(root) {
  const walk = (n) => {
    n.children = n.children.filter((c) => !c.tag || !(isGlobalChrome(c) || c.attrs['aria-hidden'] === 'true'));
    for (const c of n.children) if (c.tag) walk(c);
  };
  walk(root);
  return root;
}

export function textOf(n) {
  if (n.text !== undefined) return n.text;
  const parts = [];
  for (const c of n.children) {
    const t = textOf(c);
    parts.push(c.tag && BLOCK.has(c.tag) ? ` ${t} ` : t);
  }
  return parts.join('');
}
export const textOfClean = (n) => collapse(textOf(n));

export function findAll(n, pred, acc = []) {
  for (const c of n.children ?? []) {
    if (!c.tag) continue;
    if (pred(c)) acc.push(c);
    findAll(c, pred, acc);
  }
  return acc;
}

/** Selector legible (aproximado) para informar dónde se encontró un texto. */
export function selectorOf(n) {
  const label = (x) => {
    let s = x.tag;
    if (x.attrs.id) s += `#${x.attrs.id}`;
    if (x.attrs['aria-label']) s += `[aria-label="${x.attrs['aria-label']}"]`;
    if (x.attrs['aria-labelledby']) s += `[aria-labelledby="${x.attrs['aria-labelledby']}"]`;
    if (x.tag === 'li' && x.parent) s += `:nth-child(${x.parent.children.filter((k) => k.tag).indexOf(x) + 1})`;
    return s;
  };
  const chain = [];
  for (let x = n; x && x.tag !== '#root'; x = x.parent) chain.unshift(x);
  const keep = chain.filter((x, i) => i === chain.length - 1 || x.attrs.id || x.attrs['aria-label'] || x.attrs['aria-labelledby'] || ['main', 'article', 'section', 'nav', 'details'].includes(x.tag));
  return keep.slice(-3).map(label).join(' > ');
}

const BC_LABELS = new Set(['Migas de pan', 'Breadcrumb']);
const FAQ_HEAD = /preguntas frecuentes|frequently asked|\bfaq\b/i;
const HEADINGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
const ELEMENT_TAGS = new Set([...HEADINGS, 'a', 'li', 'strong', 'span', 'p', 'summary', 'dt', 'dd', 'td', 'b', 'em']);
const BLOCKS_TEXT = new Set([...HEADINGS, 'li', 'p', 'dd', 'td', 'summary', 'blockquote']);

/** Items de las migas: <li> hijos de <nav aria-label="Migas de pan|Breadcrumb"> (sin separadores aria-hidden, ya retirados). */
export function breadcrumbNavs(root) {
  return findAll(root, (n) => n.tag === 'nav' && BC_LABELS.has(n.attrs['aria-label'] ?? '')).map((nav) => ({
    nav,
    items: findAll(nav, (n) => n.tag === 'li').map((li) => ({ li, text: textOfClean(li), current: li.attrs['aria-current'] === 'page' })),
  }));
}

/** Bloques de FAQ visibles: <details>, <section> etiquetada con un encabezado de FAQ, y el contenido entre un encabezado de FAQ y el siguiente de igual o mayor rango. */
export function faqRegions(root) {
  const regions = [];
  for (const d of findAll(root, (n) => n.tag === 'details')) regions.push({ el: d, text: textOfClean(d), how: 'details' });
  const byId = new Map(findAll(root, (n) => n.attrs.id).map((n) => [n.attrs.id, n]));
  for (const s of findAll(root, (n) => n.tag === 'section' && n.attrs['aria-labelledby'])) {
    const h = byId.get(s.attrs['aria-labelledby']);
    if (h && FAQ_HEAD.test(textOfClean(h))) regions.push({ el: s, text: textOfClean(s), how: 'section[aria-labelledby]' });
  }
  // Acordeones sin <details>: contenedor con id "faq" (p. ej. section#faq de la home). Las respuestas están en el DOM aunque colapsadas.
  for (const c of findAll(root, (n) => /(^|[-_])faq($|[-_])/i.test(n.attrs.id ?? '') && n.tag !== 'h2' && n.tag !== 'h3')) regions.push({ el: c, text: textOfClean(c), how: 'contenedor #faq (acordeón)' });
  for (const h of findAll(root, (n) => HEADINGS.includes(n.tag) && FAQ_HEAD.test(textOfClean(n)))) {
    const rank = Number(h.tag[1]);
    const sib = h.parent.children;
    const parts = [textOfClean(h)];
    for (let i = sib.indexOf(h) + 1; i < sib.length; i++) {
      const c = sib[i];
      if (c.tag && HEADINGS.includes(c.tag) && Number(c.tag[1]) <= rank) break;
      parts.push(textOfClean(c));
    }
    regions.push({ el: h, text: collapse(parts.join(' ')), how: `${h.tag} "${collapse(textOfClean(h)).slice(0, 40)}" → siguiente ${h.tag}` });
  }
  return regions;
}

const asArr = (x) => (x === undefined ? [] : Array.isArray(x) ? x : [x]);
const typeOf = (n) => asArr(n['@type'])[0];

/** Primer elemento cuyo texto (colapsado) es EXACTAMENTE el valor. */
function exactElement(root, tags, value) {
  const v = collapse(value);
  return findAll(root, (n) => tags.has(n.tag) && textOfClean(n) === v)[0];
}
function containedIn(root, tags, value) {
  const v = compact(value);
  return findAll(root, (n) => tags.has(n.tag) && compact(textOfClean(n)).includes(v))[0];
}

/**
 * Devuelve filas { type, prop, value, visible, where, rule } para los nodos con regla estricta.
 * `root` ya está limpio (cleanDom). `graph` es el @graph del JSON-LD.
 *
 * Excepción documentada (docs/seo/AUDIT_JSONLD_VISIBLE_ESTRICTO.md): con `opts.homeTitle` (el <title> de la home) un
 * `WebApplication.name` se acepta aunque no sea un encabezado si es el nombre de producto que abre ese <title>
 * (p. ej. «Kakebo AI | App Gratis…»). Solo se pasa `homeTitle` para la home (/ y /en).
 */
export function strictChecks(graph, root, opts = {}) {
  const rows = [];
  const add = (type, prop, value, visible, where, rule) => rows.push({ type, prop, value: String(value), visible: !!visible, where: where ?? '', rule });
  tagCrumbItems(graph);
  const flat = [];
  const collect = (n) => {
    if (Array.isArray(n)) return n.forEach(collect);
    if (!n || typeof n !== 'object') return;
    if (n['@type']) flat.push(n);
    for (const k of Object.keys(n)) if (k !== '@id') collect(n[k]);
  };
  collect(graph);

  const navs = breadcrumbNavs(root);
  const faq = faqRegions(root);

  for (const n of flat) {
    const t = typeOf(n);
    if (t === 'BreadcrumbList') {
      const items = asArr(n.itemListElement);
      items.forEach((li, i) => {
        const name = li.name;
        let found;
        for (const b of navs) {
          const hit = b.items.findIndex((x) => x.text === name);
          if (hit >= 0) { found = { b, hit }; break; }
        }
        add('BreadcrumbList.ListItem', 'name', name, !!found, found ? selectorOf(found.b.items[found.hit].li) : navs.length ? 'no está en la miga visible' : 'la página no tiene <nav> de miga', 'nav de miga');
        if (i === items.length - 1) {
          const last = found && found.b.items[found.hit];
          const ok = !!(last && last.current && found.hit === found.b.items.length - 1);
          add('BreadcrumbList.ListItem', 'aria-current (último)', name, ok, ok ? selectorOf(last.li) : found ? 'el item no es el último de la miga o falta aria-current="page"' : 'sin miga visible', 'nav de miga');
        }
      });
    } else if (t === 'Question') {
      const q = n.name;
      const a = n.acceptedAnswer?.text;
      const qReg = faq.find((r) => compact(r.text).includes(compact(q)));
      add('FAQPage.Question', 'name', q, !!qReg, qReg ? `${qReg.how}: ${selectorOf(qReg.el)}` : faq.length ? 'la pregunta no está en el bloque de FAQ' : 'sin bloque de FAQ visible', 'bloque FAQ');
      if (a !== undefined) {
        const reg = faq.find((r) => {
          const ct = compact(r.text);
          const iq = ct.indexOf(compact(q));
          return iq >= 0 && ct.indexOf(compact(a), iq) >= 0;
        });
        add('FAQPage.Answer', 'text', a, !!reg, reg ? `${reg.how}: ${selectorOf(reg.el)}` : qReg ? 'la respuesta no aparece tras su pregunta en el bloque de FAQ' : 'sin bloque de FAQ visible', 'bloque FAQ');
      }
    } else if (t === 'HowTo') {
      const h = exactElement(root, new Set(HEADINGS), n.name);
      add('HowTo', 'name', n.name, h, h && selectorOf(h), 'encabezado h1-h6');
      for (const s of asArr(n.step)) {
        if (s.name) {
          const e = exactElement(root, ELEMENT_TAGS, s.name);
          add('HowTo.HowToStep', 'name', s.name, e, e && selectorOf(e), 'elemento con ese texto');
        }
        if (s.text) {
          const e = containedIn(root, BLOCKS_TEXT, s.text);
          add('HowTo.HowToStep', 'text', s.text, e, e && selectorOf(e), 'li/p/encabezado');
        }
      }
    } else if (t === 'ListItem' && n.name !== undefined) {
      // ListItem de un ItemList (los de BreadcrumbList se tratan arriba, por eso se excluyen los que viven en una miga)
      if (n.__crumb) continue;
      const e = exactElement(root, ELEMENT_TAGS, n.name);
      const part = e ?? containedIn(root, new Set([...HEADINGS, 'a']), n.name);
      add('ItemList.ListItem', 'name', n.name, part, part && `${e ? 'exacto' : 'parcial'}: ${selectorOf(part)}`, 'enlace/encabezado/li');
    } else if (t === 'WebApplication') {
      const h = exactElement(root, new Set(HEADINGS), n.name);
      const title = opts.homeTitle ? collapse(opts.homeTitle) : '';
      const inTitle = !h && !!title && title.startsWith(n.name) && !/[\p{L}\p{N}]/u.test(title.charAt(n.name.length) || ' ');
      add('WebApplication', 'name', n.name, h || inTitle, h ? selectorOf(h) : inTitle ? `excepción: nombre de producto al inicio del <title> de la home ("${title.slice(0, 50)}")` : '', 'encabezado h1-h6 (o excepción de la home)');
      for (const f of asArr(n.featureList)) {
        const e = exactElement(root, ELEMENT_TAGS, f) ?? containedIn(root, BLOCKS_TEXT, f);
        add('WebApplication', 'featureList', f, e, e && selectorOf(e), 'elemento/li visible');
      }
    }
  }
  return rows;
}

/** Marca los ListItem que cuelgan de un BreadcrumbList para no tratarlos como ItemList (se llama antes de strictChecks). */
export function tagCrumbItems(graph) {
  const visit = (n) => {
    if (Array.isArray(n)) return n.forEach(visit);
    if (!n || typeof n !== 'object') return;
    if (typeOf(n) === 'BreadcrumbList') for (const li of asArr(n.itemListElement)) Object.defineProperty(li, '__crumb', { value: true, enumerable: false });
    for (const k of Object.keys(n)) if (k !== '@id') visit(n[k]);
  };
  visit(graph);
}
