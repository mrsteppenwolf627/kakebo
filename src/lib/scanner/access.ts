/**
 * Decisión de acceso al escáner a partir del `AccessState` EXISTENTE (solo lectura).
 *
 * No añade permisos ni columnas al sistema de entitlements: el escáner forma
 * parte del único plan de pago (Plus), así que solo los estados de suscripción
 * de pago lo permiten. Denegar por defecto (F2-1): estado desconocido o ausente
 * → `unavailable`. Los estados `founder` y `legacy_full` tienen acceso total en
 * otras funciones, pero si incluyen el escáner es una decisión PENDIENTE (F3-1):
 * hasta entonces `undecided` y NO se permite.
 */
import type { AccessState } from "@/lib/auth/access-state";

export type ScannerAccessReason = "allowed" | "plan_required" | "undecided" | "unavailable";

export interface ScannerAccessDecision {
  allowed: boolean;
  reason: ScannerAccessReason;
}

export function resolveScannerAccess(state: AccessState | null | undefined): ScannerAccessDecision {
  switch (state) {
    case "plus_active":
    case "plus_canceled_pending":
      return { allowed: true, reason: "allowed" };
    case "free_under_limit":
    case "free_readonly":
      return { allowed: false, reason: "plan_required" };
    case "founder":
    case "legacy_full":
      return { allowed: false, reason: "undecided" };
    default:
      return { allowed: false, reason: "unavailable" };
  }
}
