/**
 * Control de acceso server-side del plan Plus (Bloque 2).
 *
 * `requireAccess(feature, supabase)` consulta `fn_my_access()` con la sesión del propio usuario. La función SQL
 * no recibe ningún identificador: siempre responde sobre `auth.uid()`, de modo que ni el cuerpo de la petición,
 * ni la query, ni las cabeceras pueden apuntar a otro usuario.
 *
 * Interruptor PLUS_SUBSCRIPTIONS_ENABLED: solo el valor exacto "true" activa las restricciones. Con cualquier
 * otro valor (o sin definir) `requireAccess` no hace nada y la aplicación conserva el comportamiento actual.
 * Es una variable de entorno de servidor (sin prefijo NEXT_PUBLIC_): nunca llega al navegador.
 *
 * Fail-closed: con el interruptor encendido, cualquier error o respuesta inesperada de `fn_my_access` deniega
 * (503 ACCESS_UNAVAILABLE) sin revelar detalles.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiError, apiErrors } from "@/lib/api/errors";
import type { AccessState } from "./access-state";

export type AccessFeature = "ai" | "ai_search" | "export_reports" | "plus_features" | "billing";

const FEATURE_PERMISSION: Record<AccessFeature, string> = {
  ai: "can_use_ai",
  ai_search: "can_use_ai",
  export_reports: "can_export_reports",
  plus_features: "can_use_plus_features",
  billing: "can_manage_billing",
};

const FEATURE_LABEL: Record<AccessFeature, string> = {
  ai: "el asistente IA",
  ai_search: "la búsqueda inteligente",
  export_reports: "los informes PDF",
  plus_features: "las funciones Plus",
  billing: "la gestión de la suscripción",
};

const KNOWN_STATES: readonly AccessState[] = [
  "founder",
  "legacy_full",
  "plus_active",
  "plus_canceled_pending",
  "trialing",
  "free_under_limit",
  "free_readonly",
];

export interface MyAccess {
  state: AccessState;
  is_premium: boolean;
  trial_ends_at: string | null;
  trial_days_left: number | null;
  plus_access_until: string | null;
  cancel_at_period_end: boolean;
  free_expenses_used: number | null;
  free_expenses_limit: number;
  permissions: Record<string, boolean>;
}

export interface AccessResult {
  /** `false` con el interruptor apagado: no se ha comprobado nada. */
  enforced: boolean;
  access: MyAccess | null;
}

/** Solo el valor exacto "true" activa las restricciones. */
export function isPlusSubscriptionsEnabled(
  env: Record<string, string | undefined> = process.env
): boolean {
  return env.PLUS_SUBSCRIPTIONS_ENABLED === "true";
}

function parseMyAccess(data: unknown): MyAccess | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  if (typeof d.state !== "string" || !KNOWN_STATES.includes(d.state as AccessState)) return null;
  if (!d.permissions || typeof d.permissions !== "object") return null;
  const perms: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(d.permissions as Record<string, unknown>)) {
    if (typeof v !== "boolean") return null;
    perms[k] = v;
  }
  return { ...(d as unknown as MyAccess), permissions: perms };
}

export async function requireAccess(
  feature: AccessFeature,
  supabase: SupabaseClient
): Promise<AccessResult> {
  if (!isPlusSubscriptionsEnabled()) {
    return { enforced: false, access: null };
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    throw apiErrors.unauthorized();
  }

  // Sin argumentos: la función responde siempre sobre auth.uid() de esta sesión.
  const { data, error } = await supabase.rpc("fn_my_access");
  const access = error ? null : parseMyAccess(data);
  if (!access) {
    throw apiErrors.accessUnavailable();
  }

  if (access.permissions[FEATURE_PERMISSION[feature]] !== true) {
    throw apiErrors.plusRequired(
      `Necesitas Plus para usar ${FEATURE_LABEL[feature]}. Tu plan gratuito no lo incluye.`,
      { feature, state: access.state, upgrade: true }
    );
  }

  return { enforced: true, access };
}

/** Respuesta JSON equivalente para rutas que no usan handleApiError (p. ej. streaming SSE). */
export function accessErrorResponse(error: unknown): Response | null {
  if (!(error instanceof ApiError)) return null;
  if (error.code !== "PLUS_REQUIRED" && error.code !== "ACCESS_UNAVAILABLE" && error.code !== "UNAUTHORIZED") {
    return null;
  }
  return new Response(
    JSON.stringify({
      success: false,
      error: { code: error.code, message: error.message, details: error.details },
    }),
    { status: error.status, headers: { "Content-Type": "application/json" } }
  );
}
