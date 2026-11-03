/**
 * Limpieza idempotente de tickets del escáner (Fase 7). SOLO servidor, con cliente de SERVICIO.
 *
 * Candidatos: pendientes caducados (24 h) o pendientes de un ciclo CERRADO (derivado de `months.status`, no de
 * un hook en el cierre). Reutiliza `deleteWithVerification` (retention.ts): el ticket solo pasa a `deleted` tras
 * comprobar de forma independiente que el objeto ya no existe. Si el borrado no se verifica queda
 * `deletion_pending` y se reintenta en la siguiente ejecución. Ejecutar dos veces es inocuo.
 *
 * Esta función no abre la puerta a nadie: la autenticación de servicio vive en la ruta
 * `/api/scanner/cleanup`. Los resultados devuelven recuentos, nunca rutas, ids ni importes.
 */
import { isCycleId } from "./cycle";
import { deleteWithVerification, type CleanupReason, type PrivateTicketStorage, type RetainedTicket } from "./retention";
import type { OriginalStorage, TicketState, TicketStatus, TicketStatusReason } from "./ticket-state";
import { TICKET_STATUSES } from "./ticket-state";
import type { RpcClientLike } from "./persistence";

export interface CleanupCandidateRow {
  ticket_id: string;
  user_id: string;
  cycle_id: string;
  status: string;
  status_reason: string | null;
  attempt_count: number;
  original_storage: string;
  has_draft: boolean;
  object_path: string | null;
  created_at: string;
  reason: string;
}

export interface CleanupSummary {
  candidates: number;
  deleted: number;
  /** Quedan `deletion_pending`; se reintentan en la siguiente ejecución. */
  retryLater: number;
  /** Filas descartadas por no cumplir el contrato (no se tocan). */
  skipped: number;
}

const ORIGINAL: readonly string[] = ["none", "present", "deletion_pending", "deleted_verified"];
const isReason = (r: string): r is CleanupReason => r === "ttl_expired" || r === "cycle_closed" || r === "post_confirm";

/** Convierte una fila SQL en el modelo de `retention.ts`; `null` si la fila no es válida. */
export function toRetainedTicket(row: CleanupCandidateRow): { item: RetainedTicket; reason: CleanupReason } | null {
  if (!isReason(row.reason) || !isCycleId(row.cycle_id)) return null;
  if (!(TICKET_STATUSES as readonly string[]).includes(row.status) || !ORIGINAL.includes(row.original_storage)) return null;
  const createdAtMs = Date.parse(row.created_at);
  if (Number.isNaN(createdAtMs)) return null;
  const ticket: TicketState = {
    id: row.ticket_id,
    status: row.status as TicketStatus,
    statusReason: row.status_reason as TicketStatusReason | null,
    attemptCount: row.attempt_count,
    originalStorage: row.original_storage as OriginalStorage,
    hasDraft: row.has_draft,
    confirmKey: null,
  };
  return { item: { ticket, cycleId: row.cycle_id, createdAtMs, objectPath: row.object_path }, reason: row.reason };
}

export interface CleanupDeps {
  /** Cliente de servicio (service_role): las funciones de limpieza no son ejecutables por usuarios. */
  admin: RpcClientLike;
  storage: PrivateTicketStorage;
  now?: Date;
  limit?: number;
}

export async function runScannerCleanup(deps: CleanupDeps): Promise<CleanupSummary | { error: "BACKEND_ERROR" }> {
  const now = deps.now ?? new Date();
  const { data, error } = await deps.admin.rpc("fn_scanner_cleanup_candidates", {
    p_now: now.toISOString(),
    p_limit: deps.limit ?? 100,
  });
  if (error || !Array.isArray(data)) return { error: "BACKEND_ERROR" };

  const summary: CleanupSummary = { candidates: data.length, deleted: 0, retryLater: 0, skipped: 0 };
  for (const row of data as CleanupCandidateRow[]) {
    const parsed = toRetainedTicket(row);
    if (!parsed) {
      summary.skipped++;
      continue;
    }
    const outcome = await deleteWithVerification(deps.storage, parsed.item, parsed.reason);
    const fn = outcome.ok
      ? parsed.reason === "post_confirm" ? "fn_scanner_finalize_confirmed_original" : "fn_scanner_finalize_deletion"
      : "fn_scanner_mark_deletion_pending";
    const args = parsed.reason === "post_confirm"
      ? { p_ticket_id: row.ticket_id }
      : { p_ticket_id: row.ticket_id, p_reason: parsed.reason };
    const res = await deps.admin.rpc(fn, args);
    const persisted = !res.error && (res.data as { ok?: boolean } | null)?.ok === true;
    if (outcome.ok && persisted) summary.deleted++;
    else if (!outcome.ok && outcome.code === "DELETION_NOT_VERIFIED") summary.retryLater++;
    else summary.skipped++;
  }
  return summary;
}
