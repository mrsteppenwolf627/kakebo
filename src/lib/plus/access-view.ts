/**
 * Lectura server-side del acceso del usuario actual para la interfaz de suscripción.
 * - Con PLUS_SUBSCRIPTIONS_ENABLED distinto de "true" NO consulta nada y devuelve { status: "disabled" }: la UI no
 *   muestra datos inventados ni bloquea la aplicación.
 * - El estado sale de fn_my_access() con la sesión del propio usuario. El intervalo del plan, la renovación y el
 *   impago salen de SU fila en `subscriptions` (service_role, filtrada por el user.id de la sesión).
 */
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPlusSubscriptionsEnabled, type MyAccess } from "@/lib/auth/require-access";
import type { AccessState } from "@/lib/auth/access-state";

export interface SubscriptionRow {
  status: string;
  plan_interval: "monthly" | "annual";
  current_period_start: string | null;
  current_period_end: string;
  cancel_at_period_end: boolean;
  updated_at?: string | null;
}

export interface PlusViewReady {
  status: "ready";
  state: AccessState;
  isPremium: boolean;
  trialEndsAt: string | null;
  trialDaysLeft: number | null;
  plusAccessUntil: string | null;
  cancelAtPeriodEnd: boolean;
  planInterval: "monthly" | "annual" | null;
  pastDue: boolean;
  graceEndsAt: string | null;
  freeExpensesUsed: number | null;
  freeExpensesLimit: number;
  canUseAi: boolean;
  canExportReports: boolean;
  hasBillingAccount: boolean;
}

export type PlusView = { status: "disabled" } | { status: "unauthenticated" } | { status: "error" } | PlusViewReady;

const GRACE_MS = 3 * 24 * 3600 * 1000;
const PLUS_STATES: AccessState[] = ["plus_active", "plus_canceled_pending"];

export function buildPlusView(access: MyAccess, sub: SubscriptionRow | null, hasBillingAccount: boolean): PlusViewReady {
  const isPlus = PLUS_STATES.includes(access.state);
  const pastDue = isPlus && sub?.status === "past_due";
  let graceEndsAt: string | null = null;
  if (pastDue && sub) {
    const start = new Date(sub.current_period_start ?? sub.updated_at ?? sub.current_period_end).getTime();
    graceEndsAt = new Date(Math.min(new Date(sub.current_period_end).getTime(), start + GRACE_MS)).toISOString();
  }
  return {
    status: "ready",
    state: access.state,
    isPremium: access.is_premium,
    trialEndsAt: access.state === "trialing" ? access.trial_ends_at : null,
    trialDaysLeft: access.state === "trialing" ? access.trial_days_left : null,
    plusAccessUntil: isPlus ? access.plus_access_until : null,
    cancelAtPeriodEnd: access.state === "plus_canceled_pending",
    planInterval: isPlus ? sub?.plan_interval ?? null : null,
    pastDue,
    graceEndsAt,
    freeExpensesUsed: access.free_expenses_used,
    freeExpensesLimit: access.free_expenses_limit,
    canUseAi: access.permissions.can_use_ai === true,
    canExportReports: access.permissions.can_export_reports === true,
    hasBillingAccount,
  };
}

export async function getPlusAccessView(): Promise<PlusView> {
  if (!isPlusSubscriptionsEnabled()) return { status: "disabled" };
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { status: "unauthenticated" };

    const { data, error } = await supabase.rpc("fn_my_access");
    if (error || !data || typeof (data as MyAccess).state !== "string") return { status: "error" };
    const access = data as MyAccess;

    const admin = createAdminClient();
    const [{ data: subs }, { data: billing }] = await Promise.all([
      admin
        .from("subscriptions")
        .select("status,plan_interval,current_period_start,current_period_end,cancel_at_period_end,updated_at")
        .eq("user_id", user.id)
        .in("status", ["active", "trialing", "past_due"])
        .order("current_period_end", { ascending: false })
        .limit(1),
      admin.from("billing_customers").select("user_id").eq("user_id", user.id).maybeSingle(),
    ]);
    return buildPlusView(access, ((subs ?? [])[0] as SubscriptionRow | undefined) ?? null, Boolean(billing));
  } catch {
    return { status: "error" };
  }
}

/** ¿Debe la página de IA mostrar el bloqueo Plus? Solo con el interruptor encendido y permiso explícitamente denegado. */
export function isAiBlocked(view: PlusView): boolean {
  return view.status === "ready" && !view.canUseAi;
}
