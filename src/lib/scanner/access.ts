/**
 * Decisión de acceso al escáner a partir del `AccessState` EXISTENTE (solo lectura).
 *
 * No añade permisos ni columnas al sistema de entitlements: el escáner forma
 * parte del único plan de pago (Plus), así que solo los estados de suscripción
 * de pago lo permiten. Denegar por defecto (F2-1): estado desconocido o ausente
 * → `unavailable`. Los estados `founder` y `legacy_full` representan acceso
 * premium completo en el sistema actual y, por tanto, también pueden usar el
 * escáner. Las cuentas gratuitas siguen requiriendo Plus.
 */
import type { AccessState } from "@/lib/auth/access-state";

export type ScannerAccessReason = "allowed" | "plan_required" | "undecided" | "unavailable";

export interface ScannerAccessDecision {
  allowed: boolean;
  reason: ScannerAccessReason;
}

export function resolveScannerAccess(state: AccessState | null | undefined): ScannerAccessDecision {
  switch (state) {
    case "founder":
    case "legacy_full":
    case "plus_active":
    case "plus_canceled_pending":
      return { allowed: true, reason: "allowed" };
    case "free_under_limit":
    case "free_readonly":
      return { allowed: false, reason: "plan_required" };
    default:
      return { allowed: false, reason: "unavailable" };
  }
}
