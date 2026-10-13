/**
 * Utilidades de cliente para las rutas de suscripción Plus. Solo envían el intervalo, el idioma o el session_id de
 * retorno de Checkout: nunca precios, customers ni user_id. Sin dependencias de React ni de next-intl (testeables).
 */
export type PlusInterval = "month" | "year";
export type PlusErrorKind = "unauthorized" | "forbidden" | "conflict" | "validation" | "unavailable" | "network" | "unknown";

export interface ApiFailure {
  status: number;
  code: string | null;
  message: string | null;
}

/** Lee un error de la API (`{error:{code,message}}` o `{error:"texto"}`) sin lanzar nunca. */
export async function readApiFailure(res: Response): Promise<ApiFailure> {
  let code: string | null = null;
  let message: string | null = null;
  try {
    const body = (await res.json()) as { error?: { code?: unknown; message?: unknown } | string };
    if (typeof body?.error === "string") message = body.error;
    else if (body?.error && typeof body.error === "object") {
      if (typeof body.error.code === "string") code = body.error.code;
      if (typeof body.error.message === "string") message = body.error.message;
    }
  } catch {
    /* cuerpo no JSON */
  }
  return { status: res.status, code, message };
}

/** Se lanza cuando una función de IA responde 403 PLUS_REQUIRED (la UI muestra el aviso Plus, no un error técnico). */
export class PlusRequiredError extends Error {
  constructor() {
    super("PLUS_REQUIRED");
    this.name = "PlusRequiredError";
  }
}

export const isPlusRequired = (f: Pick<ApiFailure, "status" | "code">): boolean => f.status === 403 && f.code === "PLUS_REQUIRED";

export function kindFromStatus(status: number): PlusErrorKind {
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 409) return "conflict";
  if (status === 422) return "validation";
  if (status === 503) return "unavailable";
  return "unknown";
}

/** Solo se redirige a páginas https de stripe.com (checkout / billing). */
export function isSafeStripeUrl(url: unknown): url is string {
  if (typeof url !== "string") return false;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && (u.hostname === "stripe.com" || u.hostname.endsWith(".stripe.com"));
  } catch {
    return false;
  }
}

type Fetch = typeof fetch;
export type RedirectResult = { ok: true; url: string } | { ok: false; kind: PlusErrorKind };

async function postForUrl(path: string, body: unknown, f: Fetch): Promise<RedirectResult> {
  let res: Response;
  try {
    res = await f(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, kind: "network" };
  }
  if (!res.ok) return { ok: false, kind: kindFromStatus(res.status) };
  try {
    const data = (await res.json()) as { data?: { url?: unknown } };
    if (isSafeStripeUrl(data?.data?.url)) return { ok: true, url: data.data!.url as string };
  } catch {
    /* cae al error genérico */
  }
  return { ok: false, kind: "unknown" };
}

export const startCheckout = (interval: PlusInterval, locale: "es" | "en", f: Fetch = fetch) =>
  postForUrl("/api/stripe/checkout", { interval, locale }, f);

export const openPortal = (locale: "es" | "en", f: Fetch = fetch) => postForUrl("/api/stripe/portal", { locale }, f);

export type SyncResult = { kind: "confirmed"; access: string } | { kind: "pending" } | { kind: "error"; error: PlusErrorKind };

const PLUS_PAID_STATES = new Set(["plus_active", "plus_canceled_pending"]);

/** Sincroniza tras volver de Checkout. "confirmed" SOLO si el servidor confirma una suscripción Plus. */
export async function syncCheckout(sessionId: string, f: Fetch = fetch): Promise<SyncResult> {
  let res: Response;
  try {
    res = await f("/api/stripe/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ session_id: sessionId }),
    });
  } catch {
    return { kind: "error", error: "network" };
  }
  if (res.status === 409) return { kind: "pending" }; // pago/suscripción todavía no disponibles
  if (!res.ok) return { kind: "error", error: kindFromStatus(res.status) };
  try {
    const data = (await res.json()) as { data?: { access?: unknown } };
    const access = data?.data?.access;
    if (typeof access === "string" && PLUS_PAID_STATES.has(access)) return { kind: "confirmed", access };
  } catch {
    /* sin confirmación */
  }
  return { kind: "pending" };
}
