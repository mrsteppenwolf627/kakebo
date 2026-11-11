#!/usr/bin/env node
/**
 * scripts/audit-access-logs.mjs
 * Auditoría forense de logs de acceso: Googlebot verificado, redirecciones, Crawl Gap y latencia.
 *
 * USO
 *   node scripts/audit-access-logs.mjs <access.log> [opciones]
 *
 * OPCIONES
 *   --format auto|nginx|json     Formato del log (por defecto auto; admite NDJSON de Vercel Log Drain y Cloudflare Logpush)
 *   --sitemap <ruta|url>         sitemap.xml canónico (archivo local o URL). Alternativa: --static-dir <dir de build con .html>
 *   --host <url>                 Origen del sitio (def. https://www.metodokakebo.com)
 *   --src <dir>                  Código fuente a escanear en la fase 2 (def. ./src)
 *   --out <dir>                  Carpeta de salida (def. ./audit-output)
 *   --days <n>                   Ventana de la fase 3 en días, contada hacia atrás desde la última línea del log (def. 30)
 *   --crawl                      Rastrea el sitio en vivo para calcular Click Depth (opcional; necesita red)
 *   --links <graph.json>         Grafo de enlaces precalculado { "/ruta": ["/otra", ...] } (alternativa a --crawl)
 *   --max-pages <n>              Límite del rastreo propio (def. 3000)
 *   --dns-cache <archivo.json>   Caché de resultados DNS/ASN (se lee y se actualiza)
 *   --offline                    No hace consultas de red: solo usa la caché DNS
 *   --no-asn                     Omite la comprobación de ASN (Paso C)
 *   --time-unit s|ms             Fuerza la unidad del campo de tiempo de respuesta
 *   --slow-ms <n>                Umbral de petición lenta (def. 1000)
 *   --redirect-threshold <pct>   Umbral de redirecciones para el desglose (def. 5)
 *   --concurrency <n>            Consultas DNS en paralelo (def. 20)
 *   --no-ip                      El log no trae IP (p. ej. panel de Vercel Hobby): se omite la Fase 1 y las fases 2-4
 *                                se calculan sobre tráfico con UA Googlebot SIN verificar (el informe lo advierte)
 *   --google-ranges <json>       googlebot.json oficial (developers.google.com/search/apis/ipranges/googlebot.json):
 *                                verifica por rango de IP sin consultas DNS (Google admite ambos métodos)
 *   --allow-special-crawlers     Acepta también PTR en .googleusercontent.com (rastreadores especiales de Google)
 *   --crawled-urls <archivo>     Lista de URLs rastreadas con 200 (una por línea; admite CSV con la URL en la 1.ª columna).
 *                                Sin --log ejecuta solo la Fase 3 (p. ej. con ejemplos de Estadísticas de rastreo de GSC)
 *
 * FORMATO NGINX RECOMENDADO (añade tiempo de respuesta y Location):
 *   log_format seo '$remote_addr - - [$time_local] "$request" $status $body_bytes_sent '
 *                  '"$http_referer" "$http_user_agent" rt=$request_time loc="$sent_http_location"';
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import dns from 'node:dns/promises';
import net from 'node:net';

// ───────────────────────── utilidades ─────────────────────────
function parseArgs(argv) {
  const a = { _: [] };
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    if (!k.startsWith('--')) { a._.push(k); continue; }
    const key = k.slice(2);
    const nxt = argv[i + 1];
    if (nxt === undefined || nxt.startsWith('--')) a[key] = true;
    else { a[key] = nxt; i++; }
  }
  return a;
}
const args = parseArgs(process.argv);
const CFG = {
  log: args.log || args._[0],
  format: args.format || 'auto',
  sitemap: args.sitemap || null,
  staticDir: args['static-dir'] || null,
  host: (args.host || 'https://www.metodokakebo.com').replace(/\/$/, ''),
  src: args.src || './src',
  out: args.out || './audit-output',
  days: Number(args.days || 30),
  crawl: !!args.crawl,
  links: args.links || null,
  maxPages: Number(args['max-pages'] || 3000),
  dnsCache: args['dns-cache'] || null,
  offline: !!args.offline,
  noAsn: !!args['no-asn'],
  timeUnit: args['time-unit'] || null,
  slowMs: Number(args['slow-ms'] || 1000),
  redirectThreshold: Number(args['redirect-threshold'] || 5),
  concurrency: Number(args.concurrency || 20),
  noIp: !!args['no-ip'],
  googleRanges: args['google-ranges'] || null,
  specialCrawlers: !!args['allow-special-crawlers'],
  crawledUrls: args['crawled-urls'] || null,
};
const LOGLESS = !CFG.log && !!CFG.crawledUrls; // modo solo Fase 3 (p. ej. con datos de Search Console)
if (!CFG.log && !LOGLESS) {
  console.error('Uso: node scripts/audit-access-logs.mjs <access.log> [opciones]  (ver cabecera del script)');
  console.error('     o bien: --crawled-urls <archivo> --sitemap <ruta|url> para ejecutar solo la Fase 3');
  process.exit(1);
}
fs.mkdirSync(CFG.out, { recursive: true });

const GOOGLE_UA = /(googlebot|google-inspectiontool)/i;
const pct = (n, d) => (d ? (100 * n) / d : 0);
const f1 = (n) => (Math.round(n * 10) / 10).toFixed(1);
const f2 = (n) => (Math.round(n * 100) / 100).toFixed(2);

function percentile(sorted, p) {
  if (!sorted.length) return null;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx]; // percentil por rango más cercano
}
const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
function parseTs(v) {
  if (v == null) return null;
  if (typeof v === 'number') {
    if (v > 1e17) return Math.round(v / 1e6); // ns
    if (v > 1e14) return Math.round(v / 1e3); // µs
    if (v > 1e11) return v;                   // ms
    return v * 1000;                          // s
  }
  const s = String(v);
  const m = s.match(/^(\d{2})\/(\w{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2}) ([+-]\d{4})$/);
  if (m) {
    const t = Date.UTC(+m[3], MONTHS[m[2]], +m[1], +m[4], +m[5], +m[6]);
    const off = (m[7][0] === '-' ? -1 : 1) * (Number(m[7].slice(1, 3)) * 60 + Number(m[7].slice(3, 5)));
    return t - off * 60000;
  }
  if (/^\d+(\.\d+)?$/.test(s)) return parseTs(Number(s));
  const d = Date.parse(s);
  return Number.isNaN(d) ? null : d;
}
const dayKey = (ms) => new Date(ms).toISOString().slice(0, 10);

// ───────────────────────── parseo de logs ─────────────────────────
const NGINX_RE = /^(\S+) \S+ \S+ \[([^\]]+)\] "(\S+) (\S+)(?: [^"]*)?" (\d{3}) (?:\d+|-) "[^"]*" "([^"]*)"(.*)$/;

function get(obj, dotted) {
  return dotted.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}
function firstOf(obj, keys) {
  for (const k of keys) { const v = get(obj, k); if (v !== undefined && v !== null && v !== '') return [v, k]; }
  return [undefined, null];
}
const RT_KEYS = [
  ['request_time', 's'], ['upstream_response_time', 's'], ['rt', 's'], ['urt', 's'],
  ['EdgeTimeToFirstByteMs', 'ms'], ['OriginResponseDurationMs', 'ms'], ['responseTime', 'ms'],
  ['response_time', 'ms'], ['latency_ms', 'ms'], ['time_taken', 'ms'], ['duration', 'ms'], ['proxy.duration', 'ms'],
];

function parseNginx(line) {
  const m = NGINX_RE.exec(line);
  if (!m) return null;
  const rest = m[7] || '';
  let rt = null;
  const rm = rest.match(/(?:\brt|request_time|\burt)=([\d.]+)/);
  if (rm) rt = parseFloat(rm[1]) * 1000;
  else {
    const tail = rest.trim().split(/\s+/).pop();
    if (tail && /^\d+(\.\d+)?$/.test(tail)) rt = parseFloat(tail) * 1000;
  }
  const lm = rest.match(/loc="([^"]*)"/);
  return { ip: m[1], ts: parseTs(m[2]), method: m[3], uri: m[4], status: +m[5], ua: m[6], rt, loc: lm && lm[1] && lm[1] !== '-' ? lm[1] : null };
}

function parseJson(line) {
  let o;
  try { o = JSON.parse(line); } catch { return null; }
  let [ip] = firstOf(o, ['proxy.clientIp', 'clientIp', 'client_ip', 'remote_addr', 'ClientIP', 'ip', 'httpRequest.remoteIp']);
  let [ua] = firstOf(o, ['proxy.userAgent', 'userAgent', 'user_agent', 'http_user_agent', 'ClientRequestUserAgent', 'httpRequest.userAgent']);
  if (Array.isArray(ua)) ua = ua.join(' ');
  const [uri] = firstOf(o, ['proxy.path', 'path', 'uri', 'request_uri', 'ClientRequestURI', 'url', 'httpRequest.requestUrl']);
  const [status] = firstOf(o, ['proxy.statusCode', 'status', 'statusCode', 'EdgeResponseStatus', 'OriginResponseStatus', 'httpRequest.status']);
  const [tsv] = firstOf(o, ['proxy.timestamp', 'timestamp', 'time', '@timestamp', 'EdgeStartTimestamp']);
  const [loc] = firstOf(o, ['location', 'sent_http_location', 'proxy.location', 'ResponseHeaders.location']);
  let rt = null;
  for (const [k, unit] of RT_KEYS) {
    const v = get(o, k);
    if (v !== undefined && v !== null && v !== '' && !Number.isNaN(Number(v))) {
      const u = CFG.timeUnit || unit;
      rt = Number(v) * (u === 's' ? 1000 : 1);
      break;
    }
  }
  if (!ip && CFG.noIp) ip = '(sin-ip)';
  if (!ip || !uri || !ua) return null;
  let u = String(uri);
  if (/^https?:\/\//i.test(u)) { try { const p = new URL(u); u = p.pathname + p.search; } catch { /* se deja tal cual */ } }
  return { ip: String(ip), ts: parseTs(tsv), method: 'GET', uri: u, status: Number(status) || 0, ua: String(ua), rt, loc: loc ? String(loc) : null };
}

async function readLog() {
  const stream = fs.createReadStream(CFG.log, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  const stats = { totalLines: 0, parsed: 0, unparsed: 0, claimed: 0, format: CFG.format, minTs: null, maxTs: null };
  const recs = [];
  for await (const raw of rl) {
    const line = raw.trim();
    if (!line) continue;
    stats.totalLines++;
    if (stats.format === 'auto') stats.format = line.startsWith('{') ? 'json' : 'nginx';
    const r = stats.format === 'json' ? parseJson(line) : parseNginx(line);
    if (!r) { stats.unparsed++; continue; }
    stats.parsed++;
    if (r.ts != null) {
      if (stats.minTs == null || r.ts < stats.minTs) stats.minTs = r.ts;
      if (stats.maxTs == null || r.ts > stats.maxTs) stats.maxTs = r.ts;
    }
    if (GOOGLE_UA.test(r.ua)) { stats.claimed++; recs.push(r); }
  }
  return { recs, stats };
}

// ───────────────────────── Fase 1: DNS inverso doble + ASN ─────────────────────────
function expandV6(ip) {
  if (!net.isIPv6(ip)) return ip;
  let [head, tail] = ip.split('::');
  const h = head ? head.split(':') : [];
  const t = tail !== undefined && tail ? tail.split(':') : [];
  const fill = tail === undefined ? [] : Array(8 - h.length - t.length).fill('0');
  return [...h, ...fill, ...t].map((x) => x.padStart(4, '0')).join(':');
}
const sameIp = (a, b) => (net.isIPv6(a) || net.isIPv6(b) ? expandV6(a).toLowerCase() === expandV6(b).toLowerCase() : a === b);
const withTimeout = (p, ms = 6000) =>
  Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(Object.assign(new Error('timeout'), { code: 'ETIMEOUT' })), ms))]);
const DEFINITIVE_NEG = new Set(['ENOTFOUND', 'ENODATA', 'NXDOMAIN']);

async function asnOf(ip) {
  let name;
  if (net.isIPv4(ip)) name = `${ip.split('.').reverse().join('.')}.origin.asn.cymru.com`;
  else name = `${expandV6(ip).replace(/:/g, '').split('').reverse().join('.')}.origin6.asn.cymru.com`;
  const txt = await withTimeout(dns.resolveTxt(name));
  const first = (txt[0] || []).join('');
  const asns = first.split('|')[0].trim().split(/\s+/).map(Number).filter(Boolean);
  return asns;
}

async function verifyIp(ip) {
  const r = { ip, ptr: [], ptrOk: false, fwdOk: false, asn: null, asnOk: null, status: 'indeterminado', reason: '' };
  try {
    r.ptr = await withTimeout(dns.reverse(ip));
  } catch (e) {
    if (DEFINITIVE_NEG.has(e.code)) { r.status = 'fake'; r.reason = `Sin registro PTR (${e.code})`; }
    else r.reason = `Error DNS inverso (${e.code || e.message})`;
    return r;
  }
  const ptrRe = CFG.specialCrawlers ? /\.(googlebot\.com|google\.com|googleusercontent\.com)\.?$/i : /\.(googlebot\.com|google\.com)\.?$/i;
  const good = r.ptr.filter((h) => ptrRe.test(h));
  r.ptrOk = good.length > 0;
  if (!r.ptrOk) { r.status = 'fake'; r.reason = `PTR no pertenece a Google: ${r.ptr.join(', ') || '—'}`; return r; }
  let resolvedErr = null;
  for (const h of good) {
    try {
      const ips = [];
      try { ips.push(...(await withTimeout(dns.resolve4(h)))); } catch (e) { if (!DEFINITIVE_NEG.has(e.code)) resolvedErr = e; }
      try { ips.push(...(await withTimeout(dns.resolve6(h)))); } catch (e) { if (!DEFINITIVE_NEG.has(e.code)) resolvedErr = e; }
      if (ips.some((x) => sameIp(x, ip))) { r.fwdOk = true; break; }
    } catch (e) { resolvedErr = e; }
  }
  if (!r.fwdOk) {
    if (resolvedErr) { r.reason = `Error DNS directo (${resolvedErr.code || resolvedErr.message})`; return r; }
    r.status = 'fake'; r.reason = 'La resolución directa del PTR no devuelve la IP del log'; return r;
  }
  if (!CFG.noAsn) {
    try {
      const asns = await asnOf(ip);
      r.asn = asns;
      r.asnOk = asns.includes(15169);
    } catch { r.asnOk = null; }
  }
  if (r.asnOk === false) { r.status = 'fake'; r.reason = `ASN ${r.asn.join(',')} distinto de AS15169`; return r; }
  r.status = 'verificado';
  r.reason = r.asnOk === null ? 'PTR + directo OK (ASN no comprobado)' : 'PTR + directo + AS15169 OK';
  return r;
}

// Verificación por rangos oficiales (googlebot.json): sin DNS, útil si el resolvedor falla o para acelerar.
let RANGES = null;
function loadRanges(file) {
  const j = JSON.parse(fs.readFileSync(file, 'utf8'));
  RANGES = (j.prefixes || []).map((p) => {
    const cidr = p.ipv4Prefix || p.ipv6Prefix;
    const [addr, len] = cidr.split('/');
    const [v, n] = ipToBig(addr);
    return { v, n, len: Number(len) };
  });
}
function ipToBig(ip) {
  if (net.isIPv4(ip)) return [4, ip.split('.').reduce((a, b) => (a << 8n) + BigInt(b), 0n)];
  return [6, expandV6(ip).split(':').reduce((a, b) => (a << 16n) + BigInt(parseInt(b, 16)), 0n)];
}
function inRanges(ip) {
  if (!RANGES || !net.isIP(ip)) return false;
  const [v, n] = ipToBig(ip);
  const bits = v === 4 ? 32n : 128n;
  return RANGES.some((r) => r.v === v && n >> (bits - BigInt(r.len)) === r.n >> (bits - BigInt(r.len)));
}

async function phase1(recs) {
  if (CFG.noIp) {
    console.error('  --no-ip: Fase 1 omitida; el tráfico con UA Googlebot se analiza SIN verificar.');
    return { results: new Map(), verified: recs, fake: [], unknown: [], ipsVerified: [], ipsFake: [], ipsUnknown: [], uaOnly: true };
  }
  if (CFG.googleRanges) loadRanges(CFG.googleRanges);
  let cache = {};
  if (CFG.dnsCache && fs.existsSync(CFG.dnsCache)) { try { cache = JSON.parse(fs.readFileSync(CFG.dnsCache, 'utf8')); } catch { /* caché corrupta */ } }
  const ips = [...new Set(recs.map((r) => r.ip))];
  const results = new Map();
  const todo = [];
  for (const ip of ips) {
    if (inRanges(ip)) results.set(ip, { ip, ptr: [], status: 'verificado', reason: 'IP dentro de googlebot.json (rangos oficiales)', asn: [15169], asnOk: true });
    else if (cache[ip] && cache[ip].status !== 'indeterminado') results.set(ip, cache[ip]);
    else todo.push(ip);
  }
  if (CFG.offline) {
    for (const ip of todo) results.set(ip, { ip, ptr: [], status: 'indeterminado', reason: 'Modo offline sin dato en caché', asn: null });
  } else if (todo.length) {
    // Control de sanidad: si el resolvedor no funciona, TODA IP daría "sin PTR" y se marcaría como impostora a Googlebot legítimo.
    try {
      await withTimeout(dns.resolve4('www.google.com'));
      const ctl = await withTimeout(dns.reverse('8.8.8.8'));
      if (!ctl.some((h) => /dns\.google/i.test(h))) throw new Error('el DNS inverso de control no devuelve dns.google');
    } catch (e) {
      console.error(`✖ El resolvedor DNS no es fiable (${e.code || e.message}). Abortado para no etiquetar como impostor a Googlebot legítimo.`);
      console.error('  Ejecuta el script desde una máquina con DNS público, o usa --offline con --dns-cache.');
      process.exit(3);
    }
    let i = 0;
    const worker = async () => {
      while (i < todo.length) {
        const ip = todo[i++];
        const r = await verifyIp(ip);
        results.set(ip, r);
        cache[ip] = r;
      }
    };
    await Promise.all(Array.from({ length: Math.min(CFG.concurrency, todo.length || 1) }, worker));
    if (CFG.dnsCache) fs.writeFileSync(CFG.dnsCache, JSON.stringify(cache, null, 2));
  }
  const verified = [], fake = [], unknown = [];
  for (const r of recs) {
    const v = results.get(r.ip);
    (v.status === 'verificado' ? verified : v.status === 'fake' ? fake : unknown).push(r);
  }
  const byStatus = (s) => [...results.values()].filter((v) => v.status === s);
  return { results, verified, fake, unknown, ipsVerified: byStatus('verificado'), ipsFake: byStatus('fake'), ipsUnknown: byStatus('indeterminado') };
}

function buildWafRules(fakeIps, out) {
  const ips = fakeIps.map((v) => v.ip);
  const uaExpr = '(http.user_agent contains "Googlebot" or http.user_agent contains "Google-InspectionTool")';
  let cf = '# ── Cloudflare WAF · Custom rules (Security → WAF → Custom rules) ──\n';
  cf += '# REGLA 1 (general, recomendada): bloquea cualquier UA que diga ser Googlebot y no sea un bot verificado por Cloudflare.\n';
  cf += `# Action: Block (403)\n${uaExpr} and not cf.client.bot\n\n`;
  if (ips.length) {
    cf += '# REGLA 2..n (IPs impostoras detectadas en este log). Action: Block (403). Cada expresión < 4.000 caracteres.\n';
    let chunk = [], len = 0, n = 2;
    const flush = () => {
      if (!chunk.length) return;
      cf += `# Regla ${n++}\n${uaExpr} and ip.src in {${chunk.join(' ')}}\n\n`;
      chunk = []; len = 0;
    };
    for (const ip of ips) { if (len + ip.length + 1 > 3300) flush(); chunk.push(ip); len += ip.length + 1; }
    flush();
  } else cf += '# No se detectaron IPs impostoras en este log: solo la REGLA 1 es necesaria.\n\n';
  cf += '# Nota: IPs de bloqueo en Cloudflare = Block. No uses "Allow/Skip" para UA de Googlebot sin verificación.\n';

  let ng = '# ── Nginx (http {} y server {}) ──\n';
  ng += `geo $fake_googlebot_ip {\n    default 0;\n${ips.map((i) => `    ${i} 1;`).join('\n') || '    # (sin IPs impostoras detectadas)'}\n}\n`;
  ng += 'map $http_user_agent $claims_googlebot {\n    default 0;\n    "~*(googlebot|google-inspectiontool)" 1;\n}\n';
  ng += 'map "$fake_googlebot_ip:$claims_googlebot" $block_fake_googlebot {\n    default 0;\n    "1:1" 1;\n}\n';
  ng += '# Dentro de server {}\nif ($block_fake_googlebot) { return 403; }\n';
  ng += '# Defensa completa (opcional): genera un include con los rangos oficiales de\n';
  ng += '# https://developers.google.com/search/apis/ipranges/googlebot.json y devuelve 403 cuando\n';
  ng += '# $claims_googlebot=1 y la IP NO está en esos rangos (lista blanca en lugar de lista negra).\n';

  let vc = '# ── Vercel Firewall (Project → Firewall → Custom Rules) ──\n';
  vc += '# El sitio se sirve desde Vercel (no Nginx): usa esta regla en el Edge de Vercel.\n';
  vc += '# Condición: User Agent  contains  "Googlebot"  OR  contains  "Google-InspectionTool"\n';
  vc += '#       AND  IP Address  is any of  [lista siguiente]\n# Acción: Deny (403)\n';
  vc += ips.length ? ips.join('\n') + '\n' : '# (sin IPs impostoras detectadas)\n';
  vc += '# Añade además el Bot Protection / Verified bots de Vercel para no depender solo de la lista.\n';

  fs.writeFileSync(path.join(out, 'waf-cloudflare.txt'), cf);
  fs.writeFileSync(path.join(out, 'waf-nginx.conf'), ng);
  fs.writeFileSync(path.join(out, 'waf-vercel.txt'), vc);
}

// ───────────────────────── Fase 2: códigos y redirecciones ─────────────────────────
const splitUri = (u) => { const i = u.indexOf('?'); return i < 0 ? [u, ''] : [u.slice(0, i), u.slice(i)]; };

function classifyRedirect(uri, loc) {
  const [p, q] = splitUri(uri);
  const causes = [];
  if (/^\/(en\/)?(history|settings|new)(\/|$)/.test(p)) causes.push('legacy');
  if (/^\/es(\/|$)/.test(p)) causes.push('prefijo-es');
  if (p.length > 1 && p.endsWith('/')) causes.push('trailing-slash');
  if (p !== p.toLowerCase()) causes.push('mayusculas');
  if (q) causes.push('query');
  if (!causes.length && loc) {
    try {
      const lp = new URL(loc, CFG.host).pathname;
      if (lp === p + '/') causes.push('trailing-slash(falta barra)');
      else if (lp.toLowerCase() === p.toLowerCase()) causes.push('mayusculas');
    } catch { /* Location no parseable */ }
  }
  return causes.length ? causes : ['indeterminada'];
}
const CAUSE_LABEL = {
  'legacy': 'Ruta heredada (/history, /settings, /new) → /app/* (307 definido en next.config.ts)',
  'prefijo-es': 'Prefijo de idioma /es/ (301 definido en next.config.ts hacia la URL sin prefijo)',
  'trailing-slash': 'Trailing slash (trailingSlash:false en next.config.ts: /slug/ → /slug)',
  'trailing-slash(falta barra)': 'Trailing slash (destino con barra final)',
  'mayusculas': 'Diferencias de mayúsculas/minúsculas',
  'query': 'Parámetros de query innecesarios',
  'indeterminada': 'Indeterminada (el log no incluye cabecera Location; añade loc="$sent_http_location")',
};

function walk(dir, exts, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.next', '.git'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, exts, acc);
    else if (exts.some((x) => e.name.endsWith(x))) acc.push(p);
  }
  return acc;
}

function scanSource(topPaths, causesFound) {
  const files = walk(CFG.src, ['.ts', '.tsx', '.js', '.jsx', '.mdx', '.md', '.json']);
  const hits = [];
  const patterns = [];
  if (causesFound.has('prefijo-es')) patterns.push(['prefijo-es', /["'`]\/es(\/[^"'`]*)?["'`]|href=\{?["'`]\/es\b/]);
  if (causesFound.has('trailing-slash') || causesFound.has('trailing-slash(falta barra)'))
    patterns.push(['trailing-slash', /(href|to|url|path|slug)\s*[:=]\s*\{?["'`]\/[^"'`?#\s]+\/["'`]/]);
  if (causesFound.has('legacy')) patterns.push(['legacy', /["'`]\/(en\/)?(history|settings|new)(\/[^"'`]*)?["'`]/]);
  if (causesFound.has('mayusculas')) patterns.push(['mayusculas', /href=\{?["'`]\/[^"'`]*[A-Z][^"'`]*["'`]/]);
  const literal = topPaths.map((p) => [`literal:${p}`, new RegExp(`["'\`]${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'\`]`)]);
  for (const f of files) {
    let txt;
    try { txt = fs.readFileSync(f, 'utf8'); } catch { continue; }
    if (txt.length > 2_000_000) continue;
    const lines = txt.split(/\r?\n/);
    lines.forEach((ln, i) => {
      const tags = [];
      for (const [tag, re] of [...patterns, ...literal]) if (re.test(ln)) tags.push(tag);
      if (tags.length) hits.push({ cause: tags.join(' + '), file: path.relative(process.cwd(), f), line: i + 1, text: ln.trim().slice(0, 160) });
    });
  }
  return { filesScanned: files.length, hits: hits.slice(0, 300), total: hits.length };
}

function phase2(verified) {
  const total = verified.length;
  const dist = {};
  for (const r of verified) {
    const k = r.status >= 500 ? '5xx' : String(r.status);
    dist[k] = (dist[k] || 0) + 1;
  }
  // Next.js emite 308 (permanent:true) y 307 (permanent:false); equivalen a 301/302 para Googlebot. Se cuentan todos.
  const REDIR = [301, 302, 303, 307, 308];
  const redirectTotal = verified.filter((r) => REDIR.includes(r.status)).length;
  const redirPct = pct(redirectTotal, total);
  const res = { total, dist, redirectTotal, redirPct, over: false, list: [], causes: {}, source: null };
  res.pct301302 = redirPct; // nombre histórico: porcentaje de redirecciones 301/302/307/308
  if (redirPct > CFG.redirectThreshold) {
    res.over = true;
    const agg = new Map();
    for (const r of verified.filter((x) => REDIR.includes(x.status))) {
      const key = `${r.status}\t${r.uri}\t${r.loc || ''}`;
      agg.set(key, (agg.get(key) || 0) + 1);
    }
    res.list = [...agg.entries()].map(([k, hits]) => {
      const [status, uri, loc] = k.split('\t');
      return { status: +status, uri, location: loc || null, hits, causes: classifyRedirect(uri, loc || null) };
    }).sort((a, b) => b.hits - a.hits);
    for (const e of res.list) for (const c of e.causes) res.causes[c] = (res.causes[c] || 0) + e.hits;
    const top = [...new Set(res.list.slice(0, 20).map((e) => splitUri(e.uri)[0]))];
    res.source = scanSource(top, new Set(Object.keys(res.causes)));
    const csv = ['status,uri,location,hits,causas', ...res.list.map((e) => `${e.status},"${e.uri}","${e.location || ''}",${e.hits},"${e.causes.join('|')}"`)];
    fs.writeFileSync(path.join(CFG.out, 'redirects-301-302.csv'), csv.join('\n'));
  }
  return res;
}

// ───────────────────────── Fase 3: Crawl Gap y profundidad ─────────────────────────
function normPath(u) {
  let p;
  try { p = new URL(u, CFG.host).pathname; } catch { p = String(u).split(/[?#]/)[0]; }
  try { p = decodeURI(p); } catch { /* sin decodificar */ }
  if (p.length > 1) p = p.replace(/\/+$/, '');
  return p || '/';
}
// Clave de nodo del grafo: ruta normalizada + (solo) el parámetro ?page=N, necesario para detectar paginación.
function nodeNorm(u) {
  const base = normPath(u);
  try { const pg = new URL(u, CFG.host).searchParams.get('page'); return pg ? `${base}?page=${pg}` : base; }
  catch { const m = String(u).match(/[?&]page=(\d+)/); return m ? `${base}?page=${m[1]}` : base; }
}
async function loadText(src) {
  if (/^https?:\/\//i.test(src)) { const r = await fetch(src); if (!r.ok) throw new Error(`${src} → HTTP ${r.status}`); return r.text(); }
  return fs.readFileSync(src, 'utf8');
}
async function loadInventory() {
  const set = new Set();
  let origin = null;
  if (CFG.sitemap) {
    const xml = await loadText(CFG.sitemap);
    const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
    if (/<sitemapindex/i.test(xml)) {
      for (const child of locs) {
        const cx = /^https?:\/\//i.test(child) && !CFG.offline ? await loadText(child) : '';
        for (const m of cx.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)) set.add(normPath(m[1]));
      }
    } else for (const l of locs) set.add(normPath(l));
    origin = `sitemap: ${CFG.sitemap}`;
  } else if (CFG.staticDir) {
    const base = path.resolve(CFG.staticDir);
    for (const f of walk(base, ['.html'])) {
      let rel = '/' + path.relative(base, f).replace(/\\/g, '/').replace(/\.html$/, '').replace(/\/index$/, '');
      if (rel === '/') rel = '/';
      if (/\/(404|500|_not-found|_global-error)$/.test(rel)) continue;
      set.add(rel === '' ? '/' : rel);
    }
    origin = `build estático: ${CFG.staticDir}`;
  }
  return { set, origin };
}

async function crawlSite() {
  const graph = new Map();
  const queue = ['/'];
  const seen = new Set(['/']);
  const nodeKey = (href, base) => {
    try {
      const u = new URL(href, base);
      if (u.origin !== new URL(CFG.host).origin) return null;
      if (/\.(png|jpe?g|webp|svg|gif|ico|css|js|json|xml|pdf|zip|woff2?|txt|webmanifest)$/i.test(u.pathname)) return null;
      return nodeNorm(u.pathname + u.search);
    } catch { return null; }
  };
  let idx = 0;
  const worker = async () => {
    while (idx < queue.length && graph.size < CFG.maxPages) {
      const cur = queue[idx++];
      try {
        const res = await withTimeout(fetch(CFG.host + cur, { redirect: 'manual', headers: { 'User-Agent': 'audit-access-logs/1.0' } }), 15000);
        const ct = res.headers.get('content-type') || '';
        if (res.status !== 200 || !ct.includes('text/html')) { graph.set(cur, new Set()); continue; }
        const html = await res.text();
        const out = new Set();
        for (const m of html.matchAll(/<a\s[^>]*?href=["']([^"'#]+)["']/gi)) {
          const k = nodeKey(m[1], CFG.host + cur);
          if (k && k !== cur) { out.add(k); if (!seen.has(k)) { seen.add(k); queue.push(k); } }
        }
        graph.set(cur, out);
      } catch { graph.set(cur, new Set()); }
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  return graph;
}

function bfsDepth(graph) {
  const depth = new Map([['/', 0]]);
  const q = ['/'];
  for (let i = 0; i < q.length; i++) {
    for (const n of graph.get(q[i]) || []) if (!depth.has(n)) { depth.set(n, depth.get(q[i]) + 1); q.push(n); }
  }
  return depth;
}

function phi(depths, flags) {
  const n = depths.length;
  if (n < 3) return null;
  const mx = depths.reduce((a, b) => a + b, 0) / n, my = flags.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { sxy += (depths[i] - mx) * (flags[i] - my); sxx += (depths[i] - mx) ** 2; syy += (flags[i] - my) ** 2; }
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : null;
}

async function phase3(verified, stats) {
  const inv = await loadInventory();
  if (!inv.set.size) return { skipped: 'Sin inventario: indica --sitemap <ruta|url> o --static-dir <dir>.' };
  const end = stats?.maxTs ?? Date.now();
  const since = end - CFG.days * 86400000;
  const crawled = new Set();
  const outside = new Map(); // ruta normalizada fuera del inventario → peticiones
  const paramHits = new Map(); // URI con query string (≠ ?page=) → peticiones
  const consider = (uri) => {
    const [, q] = splitUri(uri);
    if (q && !/^\?page=\d+$/.test(q)) paramHits.set(uri, (paramHits.get(uri) || 0) + 1);
    const p = normPath(uri);
    if (inv.set.has(p)) crawled.add(p);
    else outside.set(p, (outside.get(p) || 0) + 1);
  };
  if (CFG.crawledUrls) {
    for (const line of fs.readFileSync(CFG.crawledUrls, 'utf8').split(/\r?\n/)) {
      const u = line.split(',')[0].trim().replace(/^"|"$/g, '');
      if (!u || u.toLowerCase() === 'url') continue;
      consider(/^https?:\/\//i.test(u) ? (() => { try { const x = new URL(u); return x.pathname + x.search; } catch { return u; } })() : u);
    }
  } else {
    for (const r of verified) {
      if (r.status !== 200) continue;
      if (r.ts != null && r.ts < since) continue;
      consider(r.uri);
    }
  }
  const total = inv.set.size;
  const gap = total - crawled.size;
  const uncrawled = [...inv.set].filter((p) => !crawled.has(p)).sort();
  const outsideList = [...outside.entries()].sort((a, b) => b[1] - a[1]);
  const paramList = [...paramHits.entries()].sort((a, b) => b[1] - a[1]);
  const res = { inventory: inv.origin, total, crawled: crawled.size, gap, gapPct: pct(gap, total), outside: outside.size, outsideList: outsideList.slice(0, 30), paramList: paramList.slice(0, 30), windowDays: CFG.days, source: CFG.crawledUrls ? `archivo ${CFG.crawledUrls}` : 'log', uncrawled, depth: null };
  fs.writeFileSync(path.join(CFG.out, 'crawl-gap-uncrawled.csv'), ['url', ...uncrawled].join('\n'));
  fs.writeFileSync(path.join(CFG.out, 'crawled-outside-inventory.csv'), ['url,peticiones', ...outsideList.map(([u, n]) => `"${u}",${n}`)].join('\n'));

  let graph = null;
  if (CFG.links) {
    const raw = JSON.parse(fs.readFileSync(CFG.links, 'utf8'));
    graph = new Map(Object.entries(raw).map(([k, v]) => [nodeNorm(k), new Set(v.map(nodeNorm))]));
  } else if (CFG.crawl && !CFG.offline) graph = await crawlSite();
  if (!graph) { res.depth = { skipped: 'Sin grafo de enlaces: usa --crawl o --links para calcular Click Depth.' }; return res; }

  const depth = bfsDepth(graph);
  const rows = [...inv.set].map((p) => ({ p, d: depth.has(p) ? depth.get(p) : null, c: crawled.has(p) ? 1 : 0 }));
  const orphans = rows.filter((r) => r.d == null);
  const reach = rows.filter((r) => r.d != null);
  const byDepth = {};
  for (const r of reach) { (byDepth[r.d] ||= { n: 0, crawled: 0 }).n++; byDepth[r.d].crawled += r.c; }
  const corr = phi(reach.map((r) => r.d), reach.map((r) => r.c));

  // paginación lineal: ?page=N o /page/N
  const series = {};
  for (const [node, d] of depth) {
    const m = node.match(/^(.*?)(?:\?page=|\/(?:page|pagina|p)\/)(\d+)$/);
    if (m) (series[m[1] || '/'] ||= []).push([+m[2], d]);
  }
  const pagination = Object.entries(series).filter(([, v]) => v.length >= 3).map(([base, v]) => {
    v.sort((a, b) => a[0] - b[0]);
    const lastN = v[v.length - 1][0], lastD = v[v.length - 1][1], firstD = v[0][1];
    const linear = lastD - firstD >= Math.floor((lastN - v[0][0]) * 0.8);
    return { base, pages: v.length, maxPage: lastN, maxDepth: lastD, linear, logN: Math.ceil(Math.log2(lastN + 1)) };
  });

  // malla horizontal (spoke-to-spoke) por clúster de primer segmento
  const clusters = {};
  for (const p of inv.set) {
    const segs = p.split('/').filter(Boolean);
    if (segs.length >= 2) (clusters[segs[0]] ||= []).push(p);
  }
  const mesh = Object.entries(clusters).filter(([, v]) => v.length >= 5).map(([seg, spokes]) => {
    const set = new Set(spokes);
    let withSibling = 0, sib = 0;
    for (const s of spokes) {
      const n = [...(graph.get(s) || [])].filter((x) => set.has(x) && x !== s).length;
      if (n > 0) withSibling++;
      sib += n;
    }
    return { cluster: '/' + seg, spokes: spokes.length, pctWithSibling: pct(withSibling, spokes.length), avgSiblings: sib / spokes.length };
  }).sort((a, b) => a.pctWithSibling - b.pctWithSibling);

  res.depth = { reachable: reach.length, orphans: orphans.length, orphanList: orphans.slice(0, 50).map((o) => o.p), byDepth, phi: corr, pagination, mesh,
    orphanCrawledPct: pct(orphans.filter((o) => o.c).length, orphans.length) };
  return res;
}

// ───────────────────────── Fase 4: latencia y Host Load Limit ─────────────────────────
const TEMPLATES = [
  ['Home', /^\/(en)?$/],
  ['Blog · índice', /^\/(en\/)?blog$/],
  ['Blog · artículo', /^\/(en\/)?blog\/.+/],
  ['Herramientas', /^\/(en\/)?herramientas(\/.*)?$/],
  ['Plantillas', /^\/plantillas(\/.*)?$/],
  ['pSEO vivienda', /^\/ahorro-entrada-vivienda(\/.*)?$/],
  ['Panel /app', /^\/(en\/)?app(\/.*)?$/],
  ['API', /^\/api(\/.*)?$/],
  ['Estáticos/metadatos', /^\/(_next|robots\.txt|sitemap\.xml|manifest\.webmanifest|icon|favicon)/],
  ['Legal y resto', /.*/],
];
const templateOf = (uri) => { const p = normPath(uri); return TEMPLATES.find(([, re]) => re.test(p))[0]; };

function latencyStats(arr) {
  const s = [...arr].sort((a, b) => a - b);
  return { n: s.length, p50: percentile(s, 50), p90: percentile(s, 90), p99: percentile(s, 99), slow: s.filter((x) => x > CFG.slowMs).length };
}

function phase4(verified) {
  const withRt = verified.filter((r) => r.rt != null);
  const res = { totalVerified: verified.length, withRt: withRt.length, perTemplate: [], overall: null, errors: {}, verdict: null, daily: [] };
  const n503 = verified.filter((r) => r.status === 503).length;
  const n5xx = verified.filter((r) => r.status >= 500).length;
  const n429 = verified.filter((r) => r.status === 429).length;
  res.errors = { n503, n5xx, n429, pct5xx: pct(n5xx, verified.length), pct503: pct(n503, verified.length) };

  const days = {};
  for (const r of verified) if (r.ts != null) days[dayKey(r.ts)] = (days[dayKey(r.ts)] || 0) + 1;
  res.daily = Object.entries(days).sort();

  if (!withRt.length) {
    res.verdict = { level: 'NO EVALUABLE', reasons: ['El log no contiene tiempo de respuesta. Añade rt=$request_time al log_format (ver cabecera del script).'], score: null };
    return res;
  }
  const all = latencyStats(withRt.map((r) => r.rt));
  res.overall = { ...all, slowPct: pct(all.slow, all.n) };
  const groups = {};
  for (const r of withRt) (groups[templateOf(r.uri)] ||= []).push(r.rt);
  const slowOrErr = (name) => verified.filter((r) => templateOf(r.uri) === name && (r.status === 503 || (r.rt != null && r.rt > CFG.slowMs))).length;
  res.perTemplate = Object.entries(groups).map(([name, arr]) => {
    const st = latencyStats(arr);
    return { name, ...st, slowPct: pct(st.slow, st.n), n503: verified.filter((r) => templateOf(r.uri) === name && r.status === 503).length, riskReqs: slowOrErr(name) };
  }).sort((a, b) => b.p90 - a.p90);

  // Heurística de riesgo (umbral de 1000 ms fijado por la auditoría; el resto son umbrales orientativos).
  let score = 0; const reasons = [];
  const slowPct = res.overall.slowPct;
  if (slowPct >= 10) { score += 2; reasons.push(`${f1(slowPct)} % de peticiones > ${CFG.slowMs} ms (≥10 %)`); }
  else if (slowPct >= 5) { score += 1; reasons.push(`${f1(slowPct)} % de peticiones > ${CFG.slowMs} ms (≥5 %)`); }
  if (res.errors.pct5xx >= 1) { score += 2; reasons.push(`${f2(res.errors.pct5xx)} % de respuestas 5xx (≥1 %)`); }
  else if (res.errors.pct5xx >= 0.2) { score += 1; reasons.push(`${f2(res.errors.pct5xx)} % de respuestas 5xx (≥0,2 %)`); }
  if (all.p90 > CFG.slowMs) { score += 2; reasons.push(`p90 = ${Math.round(all.p90)} ms > ${CFG.slowMs} ms`); }
  if (all.p50 > 500) { score += 1; reasons.push(`p50 = ${Math.round(all.p50)} ms > 500 ms`); }
  if (n429 > 0) { score += 1; reasons.push(`${n429} respuestas 429`); }
  if (res.daily.length >= 6) {
    const half = Math.floor(res.daily.length / 2);
    const a = res.daily.slice(0, half).reduce((s, [, v]) => s + v, 0) / half;
    const b = res.daily.slice(half).reduce((s, [, v]) => s + v, 0) / (res.daily.length - half);
    if (a > 0 && (a - b) / a > 0.3 && score >= 1) { score += 1; reasons.push(`Rastreo diario cae ${f1(100 * (a - b) / a)} % entre mitades del periodo con latencia/errores presentes`); }
  }
  res.verdict = { level: score >= 4 ? 'ALTO' : score >= 2 ? 'MEDIO' : 'BAJO', score, reasons };
  return res;
}

// ───────────────────────── Informe ─────────────────────────
function render(ctx) {
  const { stats, p1, p2, p3, p4 } = ctx;
  const L = [];
  const h = (t) => L.push(`\n## ${t}\n`);
  L.push('# Auditoría forense de logs · Googlebot');
  L.push(`\nArchivo: \`${CFG.log}\` · formato: ${stats.format} · líneas: ${stats.totalLines} · parseadas: ${stats.parsed} · sin parsear: ${stats.unparsed}`);
  if (stats.minTs) L.push(`Periodo: ${new Date(stats.minTs).toISOString()} → ${new Date(stats.maxTs).toISOString()}`);

  h('Fase 1 · Purgado de Fake Googlebots');
  const nIpsClaim = p1.results.size;
  if (p1.uaOnly) L.push(`- Peticiones con UA Googlebot/Google-InspectionTool: **${stats.claimed}**. Verificación omitida (\`--no-ip\`): el log no incluye IP, no es posible distinguir impostores.`);
  else L.push(`- Peticiones con UA Googlebot/Google-InspectionTool: **${stats.claimed}** desde **${nIpsClaim}** IPs únicas`);
  if (p1.uaOnly) {
    L.push(`- Tráfico con UA Googlebot **sin verificar** (usado en las fases 2-4): ${p1.verified.length} peticiones`);
  } else {
    L.push(`- Googlebot **verificado**: ${p1.verified.length} peticiones (${p1.ipsVerified.length} IPs) — ${f1(pct(p1.verified.length, stats.claimed))} %`);
    L.push(`- **Fake Googlebot**: ${p1.fake.length} peticiones (${p1.ipsFake.length} IPs) — ${f1(pct(p1.fake.length, stats.claimed))} %`);
    L.push(`- No concluyentes (fallo/timeout DNS, no entran en ninguno de los dos conjuntos ni en las reglas de bloqueo): ${p1.unknown.length} peticiones (${p1.ipsUnknown.length} IPs)`);
  }
  if (p1.ipsFake.length) {
    L.push('\n| IP impostora | Motivo | PTR |\n|---|---|---|');
    for (const v of p1.ipsFake.slice(0, 50)) L.push(`| ${v.ip} | ${v.reason} | ${(v.ptr || []).join(', ') || '—'} |`);
  }
  L.push('\nReglas generadas: `waf-cloudflare.txt`, `waf-nginx.conf`, `waf-vercel.txt`.');

  h('Fase 2 · Códigos de estado y redirecciones (tráfico verificado)');
  const order = ['200', '301', '302', '304', '307', '308', '404', '410', '429', '5xx'];
  if (p1.uaOnly) L.push('\n> **Aviso:** el log no trae IP; el tráfico con UA Googlebot **no está verificado** y puede incluir impostores.');
  const keys = [...new Set([...order.filter((k) => p2.dist[k]), ...Object.keys(p2.dist)])];
  L.push('| Código | Peticiones | % |\n|---|---|---|');
  for (const k of keys) L.push(`| ${k} | ${p2.dist[k]} | ${f2(pct(p2.dist[k], p2.total))} |`);
  L.push(`\nRedirecciones (301/302/307/308; Next.js usa 308/307 en \`next.config.ts\`): **${f2(p2.redirPct)} %** (umbral ${CFG.redirectThreshold} %).`);
  if (p2.over) {
    L.push('\n**Causa técnica raíz (peticiones por causa):**');
    for (const [c, n] of Object.entries(p2.causes).sort((a, b) => b[1] - a[1])) L.push(`- ${CAUSE_LABEL[c] || c}: ${n}`);
    L.push('\n| Status | Request URI | Location | Hits | Causa |\n|---|---|---|---|---|');
    for (const e of p2.list.slice(0, 40)) L.push(`| ${e.status} | ${e.uri} | ${e.location || '—'} | ${e.hits} | ${e.causes.join(', ')} |`);
    if (p2.list.length > 40) L.push(`\n… ${p2.list.length - 40} más en \`redirects-301-302.csv\``);
    L.push(`\n**Escaneo del código (${p2.source.filesScanned} archivos en \`${CFG.src}\`): ${p2.source.total} coincidencias**`);
    for (const x of p2.source.hits.slice(0, 40)) L.push(`- \`${x.file}:${x.line}\` [${x.cause}] ${x.text}`);
  } else L.push('\nLas redirecciones no superan el umbral: no se genera desglose.');

  h('Fase 3 · Crawl Gap y profundidad');
  if (p3.skipped) L.push(p3.skipped);
  else {
    L.push(`- Inventario (${p3.inventory}): **${p3.total}** URLs publicadas`);
    L.push(`- URLs del inventario rastreadas con 200 por Googlebot verificado en ${p3.windowDays} días: **${p3.crawled}**`);
    L.push(`- **Crawl Gap = ${p3.total} − ${p3.crawled} = ${p3.gap}** (${f1(p3.gapPct)} % del inventario sin rastrear)`);
    L.push(`- Origen de las URLs rastreadas: ${p3.source}`);
    L.push(`- URLs rastreadas con 200 fuera del inventario (no cuentan en el cálculo): ${p3.outside}`);
    if (p3.outsideList.length) L.push(`  - Principales: ${p3.outsideList.slice(0, 10).map(([u, n]) => `${u} (${n})`).join(', ')} — detalle en \`crawled-outside-inventory.csv\``);
    if (p3.paramList.length) {
      L.push(`- **URLs con parámetros rastreadas** (${p3.paramList.length}): ${p3.paramList.slice(0, 8).map(([u, n]) => `${u.replace(/\?/g, '¿')} (${n})`).join(', ')}`);
    }
    L.push('- Listado completo de no rastreadas: `crawl-gap-uncrawled.csv`');
    const d = p3.depth;
    if (d.skipped) L.push(`\n${d.skipped}`);
    else {
      L.push(`\n**Click Depth** (BFS desde la home) — alcanzables: ${d.reachable} · huérfanas del inventario: **${d.orphans}**`);
      L.push('\n| Profundidad | URLs | Rastreadas | % rastreado |\n|---|---|---|---|');
      for (const [k, v] of Object.entries(d.byDepth).sort((a, b) => a[0] - b[0])) L.push(`| ${k} | ${v.n} | ${v.crawled} | ${f1(pct(v.crawled, v.n))} |`);
      L.push(`\nCorrelación (φ de Pearson) profundidad ↔ rastreada: **${d.phi == null ? 'n/d' : f2(d.phi)}** (negativa = más profundo, menos rastreo).`);
      if (d.pagination.length) {
        L.push('\n| Paginación | Páginas | Máx. página | Profundidad máx. | ¿Lineal? | Profundidad con enlaces logarítmicos |\n|---|---|---|---|---|---|');
        for (const p of d.pagination) L.push(`| ${p.base} | ${p.pages} | ${p.maxPage} | ${p.maxDepth} | ${p.linear ? 'SÍ' : 'no'} | ~${p.logN} |`);
      } else L.push('\nNo se detectaron series de paginación (≥3 páginas).');
      if (d.mesh.length) {
        L.push('\n| Clúster | Spokes | % spokes con enlace a otro spoke | Media de enlaces laterales |\n|---|---|---|---|');
        for (const m of d.mesh) L.push(`| ${m.cluster} | ${m.spokes} | ${f1(m.pctWithSibling)} | ${f2(m.avgSiblings)} |`);
      }
      if (d.orphans) L.push(`\nHuérfanas (muestra): ${d.orphanList.slice(0, 15).join(', ')}`);
    }
  }

  h('Fase 4 · Latencia y Host Load Limit');
  if (p4.overall) {
    L.push(`Peticiones verificadas con tiempo de respuesta: ${p4.withRt}/${p4.totalVerified}`);
    L.push(`\n| Plantilla | n | p50 ms | p90 ms | p99 ms | > ${CFG.slowMs} ms (%) | 503 |\n|---|---|---|---|---|---|---|`);
    L.push(`| **Global** | ${p4.overall.n} | ${Math.round(p4.overall.p50)} | ${Math.round(p4.overall.p90)} | ${Math.round(p4.overall.p99)} | ${f1(p4.overall.slowPct)} | ${p4.errors.n503} |`);
    for (const t of p4.perTemplate) L.push(`| ${t.name} | ${t.n} | ${Math.round(t.p50)} | ${Math.round(t.p90)} | ${Math.round(t.p99)} | ${f1(t.slowPct)} | ${t.n503} |`);
  }
  L.push(`\n5xx: ${p4.errors.n5xx} (${f2(p4.errors.pct5xx)} %) · 503: ${p4.errors.n503} (${f2(p4.errors.pct503)} %) · 429: ${p4.errors.n429}`);
  L.push(`\n**Riesgo de freno por Host Load Limit: ${p4.verdict.level}**${p4.verdict.score != null ? ` (puntuación heurística ${p4.verdict.score})` : ''}`);
  for (const r of p4.verdict.reasons) L.push(`- ${r}`);
  L.push('\n_Nota: el score es una heurística de esta auditoría; Google no publica el umbral del Host Load Limit._');
  const slowT = (p4.perTemplate || []).filter((t) => t.p90 > CFG.slowMs || t.slowPct >= 5).map((t) => t.name);
  L.push('\n**Recomendaciones de caché en Edge**');
  L.push(`- Plantillas prioritarias: ${slowT.length ? slowT.join(', ') : 'ninguna supera los umbrales en este log'}.`);
  L.push('- Páginas públicas de contenido (blog, herramientas, plantillas, pSEO): generación estática o ISR con `export const revalidate = N` + `generateStaticParams`, de modo que Googlebot reciba HTML desde caché.');
  L.push('- Cabecera: `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400` (ajusta s-maxage a la frecuencia real de cambio); comprueba `x-vercel-cache: HIT` en las respuestas de Googlebot.');
  L.push('- Evita APIs dinámicas (`cookies()`, `headers()`, `searchParams`) en layouts y páginas públicas: fuerzan renderizado dinámico y anulan la caché.');
  L.push('- Convierte a Server Components estáticos los bloques sin interactividad y mueve a cliente solo lo estrictamente interactivo.');
  L.push('- Si 503/429 persisten tras cachear: revisa límites de concurrencia/funciones del hosting antes de tocar robots.txt.');

  h('Tabla de discrepancias');
  L.push('| Categoría | Métrica detectada | Impacto técnico | Acción correctiva |\n|---|---|---|---|');
  const rows = [];
  rows.push(['Bots impostores', `${p1.ipsFake.length} IPs / ${p1.fake.length} peticiones (${f1(pct(p1.fake.length, stats.claimed))} %)`, 'Distorsionan métricas de rastreo y consumen capacidad del servidor; pueden scrapear contenido.', 'Aplicar reglas de `waf-cloudflare.txt` / `waf-vercel.txt` / `waf-nginx.conf` (403 en Edge).']);
  rows.push(['Redirecciones', `301/302/307/308 = ${f2(p2.redirPct)} % (umbral ${CFG.redirectThreshold} %)`, p2.over ? 'Presupuesto de rastreo gastado en saltos; URLs desactualizadas en enlaces/sitemap.' : 'Dentro del umbral.', p2.over ? 'Corregir las coincidencias listadas en la Fase 2 para enlazar directamente a la URL final.' : 'Sin acción.']);
  const e404 = (p2.dist['404'] || 0) + (p2.dist['410'] || 0);
  rows.push(['Errores cliente', `404/410 = ${f2(pct(e404, p2.total))} %`, 'Rastreo desperdiciado en URLs inexistentes.', e404 ? 'Localizar el origen de enlaces rotos; redirigir o retirar de sitemap.' : 'Sin acción.']);
  if (!p3.skipped) {
    rows.push(['Crawl Gap', `${p3.gap} de ${p3.total} URLs sin rastrear (${f1(p3.gapPct)} %)`, 'Contenido publicado que Googlebot no visita en la ventana: sin indexar ni refrescar.', 'Reducir profundidad, añadir enlaces internos y hubs; ver `crawl-gap-uncrawled.csv`.']);
    if (p3.depth && !p3.depth.skipped) {
      const lin = p3.depth.pagination.filter((x) => x.linear);
      rows.push(['Profundidad / malla', `φ=${p3.depth.phi == null ? 'n/d' : f2(p3.depth.phi)} · huérfanas ${p3.depth.orphans} · paginaciones lineales ${lin.length}`, 'Páginas profundas u huérfanas se rastrean menos.', 'Paginación con saltos logarítmicos (1,2,3,10,100…), enlaces spoke-a-spoke y hubs enlazados desde la home.']);
    }
  }
  rows.push(['Latencia / Host Load', `Riesgo ${p4.verdict.level}${p4.overall ? ` · p90=${Math.round(p4.overall.p90)} ms · >${CFG.slowMs} ms ${f1(p4.overall.slowPct)} %` : ''} · 503=${p4.errors.n503}`, 'Googlebot reduce la tasa de rastreo si el servidor responde lento o con errores.', 'Caché en Edge (s-maxage/ISR/estático) en las plantillas con p90 alto.']);
  for (const r of rows) L.push(`| ${r.join(' | ')} |`);
  return L.join('\n');
}

// ───────────────────────── Ejecución secuencial ─────────────────────────
(async () => {
  if (LOGLESS) {
    console.error('› Modo solo Fase 3 (sin log)…');
    const p3 = await phase3([], null);
    const lines = [];
    const md = render({
      stats: { totalLines: 0, parsed: 0, unparsed: 0, claimed: 0, format: 'n/a', minTs: null, maxTs: null },
      p1: { results: new Map(), verified: [], fake: [], unknown: [], ipsVerified: [], ipsFake: [], ipsUnknown: [] },
      p2: phase2([]), p3, p4: phase4([]),
    });
    const only = '# Auditoría de rastreo (solo Fase 3)\n\n## Fase 3' + md.split('## Fase 3')[1].split('\n## Fase 4')[0];
    lines.push(only);
    fs.writeFileSync(path.join(CFG.out, 'report-fase3.md'), only);
    fs.writeFileSync(path.join(CFG.out, 'report-fase3.json'), JSON.stringify({ ...p3, uncrawled: undefined }, null, 2));
    console.log(only);
    console.error(`\n✔ Salida en ${path.resolve(CFG.out)}`);
    return;
  }
  console.error('› Leyendo log…');
  const { recs, stats } = await readLog();
  console.error(`  ${stats.parsed} líneas parseadas, ${stats.claimed} con UA Googlebot`);
  if (!stats.parsed) { console.error('No se pudo parsear ninguna línea: revisa --format.'); process.exit(2); }

  console.error('› Fase 1: verificación DNS inversa…');
  const p1 = await phase1(recs);
  buildWafRules(p1.ipsFake, CFG.out);

  console.error('› Fase 2: códigos de estado y redirecciones…');
  const p2 = phase2(p1.verified);

  console.error('› Fase 3: Crawl Gap…');
  let p3;
  try { p3 = await phase3(p1.verified, stats); } catch (e) { p3 = { skipped: `Fase 3 no ejecutada: ${e.message}` }; }

  console.error('› Fase 4: latencia…');
  const p4 = phase4(p1.verified);

  const md = render({ stats, p1, p2, p3, p4 });
  fs.writeFileSync(path.join(CFG.out, 'report.md'), md);
  fs.writeFileSync(path.join(CFG.out, 'report.json'), JSON.stringify({ stats, p1: { verifiedReq: p1.verified.length, fakeReq: p1.fake.length, unknownReq: p1.unknown.length, ips: [...p1.results.values()] }, p2, p3: { ...p3, uncrawled: undefined }, p4 }, null, 2));
  console.log(md);
  console.error(`\n✔ Salida en ${path.resolve(CFG.out)}`);
})().catch((e) => { console.error(e); process.exit(1); });
