/**
 * Resolvedor central de acceso — Fase 3 (monetización).
 *
 * Módulo puro, sin efectos secundarios ni llamadas a red/BD. Recibe datos ya
 * cargados y devuelve el estado de acceso derivado + la matriz de permisos
 * asociada. No conoce Supabase, no conoce React, no debe importarse desde
 * ningún componente visual.
 *
 * Contrato aprobado en docs/planning/fase-3-monetizacion.md §3.A. El mismo
 * criterio de resolución (orden de evaluación, condiciones de cada estado)
 * está replicado en SQL en `fn_resolve_access_state` (ver la migración
 * supabase/migrations/20260916_phase3b_monetization_foundation.sql) para el
 * enforcement server-side del límite de gastos. Cualquier cambio de reglas
 * aquí debe reflejarse también allí — no hay una única fuente de verdad
 * ejecutable compartida entre TypeScript y PL/pgSQL.
 *
 * Los campos heredados `tier` y `manual_override` se aceptan en el tipo de
 * entrada solo para no romper lecturas existentes de `profiles`, pero
 * deliberadamente NUNCA se leen dentro de `resolveAccessState` ni de
 * `getAccessPermissions` — no conceden ni condicionan ningún permiso.
 */

export type AccessState =
  | "founder"
  | "plus_active"
  | "plus_canceled_pending"
  | "trialing"
  | "free_under_limit"
  | "free_readonly";

/**
 * Subconjunto de columnas de `profiles` relevantes para resolver acceso.
 * `tier` y `manual_override` se incluyen solo como legado documentado — ver
 * la nota de cabecera del módulo. No se leen en ninguna función de aquí.
 */
export interface AccessProfile {
  is_founder: boolean;
  /** ISO 8601. `null` si nunca hubo/hay una suscripción de pago vigente. */
  plus_access_until: string | null;
  /**
   * Solo para distinguir `plus_active` de `plus_canceled_pending` en la UI.
   * No cambia ningún permiso (la matriz es idéntica para ambos estados).
   */
  subscriptionCancelAtPeriodEnd?: boolean;
  /** ISO 8601. `null` si el usuario nunca tuvo periodo de prueba (p. ej. founder capturado antes de que existiera el trial). */
  trial_ends_at: string | null;
  /** Legado — nunca leído para decidir acceso. Presente solo para no romper tipos existentes. */
  tier?: string | null;
  /** Legado — nunca leído para decidir acceso. Presente solo para no romper tipos existentes. */
  manual_override?: boolean | null;
}

export interface AccessContext {
  /**
   * Nº de creaciones de gasto ya registradas este mes natural en zona horaria
   * Europe/Madrid. Debe venir siempre de `expense_monthly_usage` (o de la
   * fuente equivalente server-side) — nunca de un conteo hecho en cliente.
   */
  expensesThisMonth: number;
  /** Instante a evaluar. Inyectable para tests; por defecto `new Date()`. */
  now?: Date;
}

const FREE_MONTHLY_EXPENSE_LIMIT = 30;

/**
 * Resuelve el estado de acceso de un perfil, en el orden de evaluación
 * aprobado: founder siempre corta primero, después Plus (activo o cancelado
 * pero vigente hasta fin de periodo), después prueba, y por último los dos
 * estados gratuitos según el límite mensual de gastos.
 */
export function resolveAccessState(
  profile: AccessProfile,
  context: AccessContext
): AccessState {
  const now = context.now ?? new Date();

  if (profile.is_founder) {
    return "founder";
  }

  if (profile.plus_access_until) {
    const plusUntil = new Date(profile.plus_access_until);
    if (now < plusUntil) {
      return profile.subscriptionCancelAtPeriodEnd
        ? "plus_canceled_pending"
        : "plus_active";
    }
  }

  if (profile.trial_ends_at) {
    const trialEnd = new Date(profile.trial_ends_at);
    if (now < trialEnd) {
      return "trialing";
    }
  }

  return context.expensesThisMonth < FREE_MONTHLY_EXPENSE_LIMIT
    ? "free_under_limit"
    : "free_readonly";
}

export interface AccessPermissions {
  canCreateExpense: boolean;
  canEditOrDeleteExpense: boolean;
  canViewExpenses: boolean;
  canUseAI: boolean;
  canExport: boolean;
  canManageBilling: boolean;
}

/**
 * Matriz de permisos aprobada — docs/planning/fase-3-monetizacion.md §3.A.0.
 * `plus_active` y `plus_canceled_pending` tienen exactamente los mismos
 * permisos (la distinción es puramente informativa para la UI).
 */
export const ACCESS_PERMISSIONS: Record<AccessState, AccessPermissions> = {
  founder: {
    canCreateExpense: true,
    canEditOrDeleteExpense: true,
    canViewExpenses: true,
    canUseAI: true,
    canExport: true,
    canManageBilling: false,
  },
  plus_active: {
    canCreateExpense: true,
    canEditOrDeleteExpense: true,
    canViewExpenses: true,
    canUseAI: true,
    canExport: true,
    canManageBilling: true,
  },
  plus_canceled_pending: {
    canCreateExpense: true,
    canEditOrDeleteExpense: true,
    canViewExpenses: true,
    canUseAI: true,
    canExport: true,
    canManageBilling: true,
  },
  trialing: {
    canCreateExpense: true,
    canEditOrDeleteExpense: true,
    canViewExpenses: true,
    canUseAI: true,
    canExport: false,
    canManageBilling: false,
  },
  free_under_limit: {
    canCreateExpense: true,
    canEditOrDeleteExpense: true,
    canViewExpenses: true,
    canUseAI: false,
    canExport: false,
    canManageBilling: false,
  },
  free_readonly: {
    canCreateExpense: false,
    canEditOrDeleteExpense: false,
    canViewExpenses: true,
    canUseAI: false,
    canExport: false,
    canManageBilling: false,
  },
};

export function getAccessPermissions(state: AccessState): AccessPermissions {
  return ACCESS_PERMISSIONS[state];
}

/**
 * Conveniencia: resuelve estado + permisos en una sola llamada.
 */
export function resolveAccess(
  profile: AccessProfile,
  context: AccessContext
): { state: AccessState; permissions: AccessPermissions } {
  const state = resolveAccessState(profile, context);
  return { state, permissions: getAccessPermissions(state) };
}

/**
 * Clave de periodo mensual en zona horaria Europe/Madrid, formato 'YYYY-MM'.
 * Debe usarse siempre que se necesite calcular a qué "mes natural" pertenece
 * el conteo de gastos gratuito — nunca a partir de la zona horaria del
 * servidor ni del navegador del usuario. Réplica en SQL: `to_char(now() AT
 * TIME ZONE 'Europe/Madrid', 'YYYY-MM')`.
 */
export function getExpensePeriodKey(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;

  if (!year || !month) {
    throw new Error("No se pudo calcular el periodo de gasto (Europe/Madrid)");
  }

  return `${year}-${month}`;
}
