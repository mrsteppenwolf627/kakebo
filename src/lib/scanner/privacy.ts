/**
 * Guardas de privacidad del escáner (Fase 5).
 *
 * Ni la imagen, ni el texto OCR bruto, ni importes, porcentajes o datos de
 * línea pueden llegar a Analytics, a logs propios, a una URL ni a
 * localStorage (decision-log C16, I14, T16–T18). Estas funciones son puras y
 * NO están conectadas todavía a `src/lib/analytics.ts` ni a `logger.ts`
 * (no se tocan en esta fase); sirven de contrato y de punto de enganche.
 *
 * Los resultados nunca incluyen los valores ofensivos, solo rutas de claves.
 */

const FORBIDDEN_KEY_TOKENS = new Set([
  "image", "images", "photo", "bytes", "blob", "file", "filename", "raw", "ocr", "text",
  "amount", "amounts", "cents", "total", "subtotal", "tax", "vat", "iva", "percent", "percentage", "rate", "ratio",
  "price", "currency", "merchant", "vendor", "store", "description", "line", "lines", "item", "items",
  "allocation", "allocations", "split", "category", "categories", "subcategory", "quantity", "payment", "date",
  "draft", "receipt", "signed", "storage", "payload",
]);

function keyTokens(key: string): string[] {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

export function isForbiddenKey(key: string): boolean {
  return keyTokens(key).some((t) => FORBIDDEN_KEY_TOKENS.has(t));
}

const MONEY = /(?:\d[\d.,]*\s?(?:€|eur\b|euros?\b))|(?:(?:€|eur\b)\s?\d)/i;
const PERCENT = /\d\s?%/;
const DATA_URI = /^data:/i;
const LONG_BASE64 = /^[A-Za-z0-9+/_-]{200,}={0,2}$/;
const SIGNED_URL = /[?&](?:token|signature|sig|x-amz-[a-z-]+|x-goog-[a-z-]+)=/i;

function isBinary(value: unknown): boolean {
  return (
    value instanceof ArrayBuffer ||
    ArrayBuffer.isView(value) ||
    (typeof Blob !== "undefined" && value instanceof Blob)
  );
}

function stringViolates(value: string): boolean {
  return DATA_URI.test(value) || LONG_BASE64.test(value) || MONEY.test(value) || PERCENT.test(value) || SIGNED_URL.test(value);
}

/**
 * Devuelve las rutas (`a.b[0].c`) con claves prohibidas, binarios o cadenas con
 * importes/porcentajes/URLs firmadas. Vacío = seguro.
 */
export function findPrivacyViolations(value: unknown, path = "$", seen = new WeakSet<object>()): string[] {
  if (isBinary(value)) return [path];
  if (typeof value === "string") return stringViolates(value) ? [path] : [];
  if (value === null || typeof value !== "object") return [];
  if (seen.has(value)) return [];
  seen.add(value);

  const out: string[] = [];
  if (Array.isArray(value)) {
    value.forEach((item, i) => out.push(...findPrivacyViolations(item, `${path}[${i}]`, seen)));
    return out;
  }
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;
    if (isForbiddenKey(key)) out.push(childPath);
    else out.push(...findPrivacyViolations(child, childPath, seen));
  }
  return out;
}

export class PrivacyViolationError extends Error {
  readonly paths: readonly string[];
  constructor(paths: readonly string[]) {
    super("PRIVACY_VIOLATION");
    this.name = "PrivacyViolationError";
    this.paths = paths;
  }
}

export function assertPrivacySafe(value: unknown): void {
  const paths = findPrivacyViolations(value);
  if (paths.length > 0) throw new PrivacyViolationError(paths);
}

// ── Analytics ────────────────────────────────────────────────────────────────

export const SCANNER_ERROR_CODES = [
  "SCANNER_DISABLED", "QUOTA_EXCEEDED", "UPLOAD_EXPIRED", "FILE_REJECTED", "ILLEGAL_TRANSITION",
  "VERSION_CONFLICT", "CYCLE_CLOSED", "RETRY_LIMIT", "RATE_LIMITED", "PLAN_REQUIRED", "UNAVAILABLE",
] as const;

const SCANNER_SOURCES = ["camera", "image", "pdf"] as const;

type AllowedParams = Record<string, readonly string[]>;

/** Lista blanca de eventos y valores (propuesta en technical-architecture.md §G; sin ids, estados ni cifras). */
export const SCANNER_ANALYTICS_ALLOWLIST: Record<string, AllowedParams> = {
  scanner_opened: {},
  scanner_blocked_viewed: {},
  scanner_source_selected: { source: SCANNER_SOURCES },
  scanner_ticket_submitted: {},
  scanner_ticket_confirmed: {},
  scanner_error: { code: SCANNER_ERROR_CODES },
};

/**
 * Devuelve el evento saneado o `null` si el nombre no está en la lista blanca.
 * Solo sobreviven parámetros listados cuyo valor sea uno de los permitidos.
 * No comprueba consentimiento: eso lo hace `analyticsAllowed()` en el cliente.
 */
export function sanitizeScannerAnalyticsEvent(
  name: string,
  properties: Record<string, unknown> = {}
): { name: string; properties: Record<string, string> } | null {
  if (!Object.prototype.hasOwnProperty.call(SCANNER_ANALYTICS_ALLOWLIST, name)) return null;
  const allowed = SCANNER_ANALYTICS_ALLOWLIST[name];
  const clean: Record<string, string> = {};
  for (const [key, values] of Object.entries(allowed)) {
    const v = properties[key];
    if (typeof v === "string" && values.includes(v)) clean[key] = v;
  }
  return { name, properties: clean };
}

// ── Logs ─────────────────────────────────────────────────────────────────────

const SAFE_LOG_KEYS = new Set(["ticketId", "status", "code", "kind", "durationMs", "attemptCount", "eventType", "requestId"]);
const SAFE_LOG_STRING = /^[A-Za-z0-9_.:-]{1,64}$/;

/** Proyecta un contexto de log a campos permitidos: ids/códigos opacos y números finitos. Descarta el resto. */
export function toSafeLogContext(context: Record<string, unknown>): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(context)) {
    if (!SAFE_LOG_KEYS.has(key)) continue;
    if (typeof value === "number" && Number.isFinite(value)) out[key] = value;
    else if (typeof value === "string" && SAFE_LOG_STRING.test(value) && !stringViolates(value)) out[key] = value;
  }
  return out;
}

// ── URL y almacenamiento del navegador ───────────────────────────────────────

/** `false` si la URL lleva en query/hash claves prohibidas o valores con importes/URLs firmadas. */
export function isUrlPrivacySafe(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url, "https://kakebo.invalid");
  } catch {
    return false;
  }
  const params = [...parsed.searchParams.entries(), ...new URLSearchParams(parsed.hash.replace(/^#/, "")).entries()];
  for (const [key, value] of params) {
    if (isForbiddenKey(key) || stringViolates(value) || stringViolates(`?${key}=${value}`)) return false;
  }
  return !stringViolates(decodeURIComponent(parsed.pathname));
}

/** Minimal para localStorage/sessionStorage. */
export interface BrowserStorageLike {
  setItem(key: string, value: string): void;
}

/** Escribe en el almacenamiento del navegador solo si ni la clave ni el valor llevan datos del ticket. */
export function safeBrowserStorageSet(storage: BrowserStorageLike, key: string, value: unknown): void {
  if (isForbiddenKey(key)) throw new PrivacyViolationError(["$key"]);
  assertPrivacySafe(value);
  storage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
}
