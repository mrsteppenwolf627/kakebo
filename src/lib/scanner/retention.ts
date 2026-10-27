/**
 * Retención temporal de originales del escáner (Fase 6).
 *
 * Decisiones del propietario: el ticket abandonado se conserva como máximo 24 h
 * y se borra automáticamente; al cerrar el ciclo se cancelan y borran los
 * tickets pendientes de ese ciclo; Kakebo no conserva la imagen online tras
 * confirmar. Solo almacenamiento PRIVADO: nunca URL pública.
 *
 * Contrato puro. No hay bucket de Supabase Storage ni planificador en el
 * repositorio (NO DEMOSTRADO): `PrivateTicketStorage` es la interfaz que
 * implementará el adaptador real, y `selectExpired`/`selectPendingForCycle`
 * son las decisiones que ejecutará el job. Ruta opaca: sin nombre de archivo.
 */
import type { CycleId } from "./cycle";
import {
  recordOriginalDeletionVerified,
  requestOriginalDeletion,
  transitionTicket,
  type TicketState,
  type TicketStatusReason,
} from "./ticket-state";

export const TICKET_RETENTION_MS = 24 * 60 * 60 * 1000;

/** Estados en los que el ticket sigue «pendiente» (ni confirmado ni terminal). */
export const PENDING_STATUSES = ["initiated", "uploaded", "processing", "needs_review", "failed"] as const;

export interface RetainedTicket {
  ticket: TicketState;
  cycleId: CycleId;
  createdAtMs: number;
  /** Ruta opaca (p. ej. `<userId>/<ticketId>`); `null` si aún no se subió nada. */
  objectPath: string | null;
}

/** Almacenamiento temporal privado. `visibility` fija en tipos que nunca es público. */
export interface PrivateTicketStorage {
  readonly visibility: "private";
  remove(objectPath: string): Promise<{ ok: boolean }>;
  /** Comprobación independiente de la ausencia real del objeto. */
  exists(objectPath: string): Promise<{ ok: true; exists: boolean } | { ok: false }>;
}

export const isPending = (t: RetainedTicket): boolean =>
  (PENDING_STATUSES as readonly string[]).includes(t.ticket.status);

export function expiresAtMs(createdAtMs: number): number {
  return createdAtMs + TICKET_RETENTION_MS;
}

/** Caduca cuando han pasado 24 h completas desde la creación (límite inclusive). */
export function isExpired(t: RetainedTicket, nowMs: number): boolean {
  return isPending(t) && nowMs >= expiresAtMs(t.createdAtMs);
}

export function selectExpired(tickets: readonly RetainedTicket[], nowMs: number): RetainedTicket[] {
  return tickets.filter((t) => isExpired(t, nowMs));
}

/** Pendientes del ciclo que se cierra. No toca otros ciclos ni tickets ya confirmados. */
export function selectPendingForCycle(tickets: readonly RetainedTicket[], cycleId: CycleId): RetainedTicket[] {
  return tickets.filter((t) => t.cycleId === cycleId && isPending(t));
}

export type CleanupReason = Extract<TicketStatusReason, "ttl_expired" | "cycle_closed">;

export type CleanupOutcome =
  | { ok: true; item: RetainedTicket }
  /** Borrado no verificado: el ticket queda `deletion_pending` para reintentar; nunca se da por borrado. */
  | { ok: false; code: "DELETION_NOT_VERIFIED" | "ILLEGAL_TRANSITION"; item: RetainedTicket };

/**
 * Borra el original y solo si su ausencia se comprueba con `exists` marca
 * `deleted_verified` y pasa el ticket a `deleted`. Reintentable.
 */
export async function deleteWithVerification(
  storage: PrivateTicketStorage,
  item: RetainedTicket,
  reason: CleanupReason
): Promise<CleanupOutcome> {
  let ticket = item.ticket;
  // Caducidad: pasa por `expired` donde la máquina lo permite; `processing` va directo a borrado.
  if (reason === "ttl_expired" && ticket.status !== "processing" && ticket.status !== "expired") {
    const moved = transitionTicket(ticket, "expired", { reason });
    if (!moved.ok) return { ok: false, code: "ILLEGAL_TRANSITION", item };
    ticket = moved.ticket;
  }
  ticket = requestOriginalDeletion(ticket);

  if (item.objectPath !== null && ticket.originalStorage === "deletion_pending") {
    const removed = await storage.remove(item.objectPath);
    const check = removed.ok ? await storage.exists(item.objectPath) : ({ ok: false } as const);
    if (!check.ok || check.exists) {
      return { ok: false, code: "DELETION_NOT_VERIFIED", item: { ...item, ticket } };
    }
    ticket = recordOriginalDeletionVerified(ticket);
  } else if (ticket.originalStorage === "deletion_pending") {
    // Sin ruta conocida no se puede verificar nada.
    return { ok: false, code: "DELETION_NOT_VERIFIED", item: { ...item, ticket } };
  }

  const done = transitionTicket(ticket, "deleted", { reason });
  if (!done.ok) return { ok: false, code: "ILLEGAL_TRANSITION", item: { ...item, ticket } };
  return { ok: true, item: { ...item, ticket: done.ticket, objectPath: null } };
}

/** Cancelación al cerrar el ciclo: borra con verificación todos los pendientes de ese ciclo. */
export async function cancelPendingOnCycleClose(
  storage: PrivateTicketStorage,
  tickets: readonly RetainedTicket[],
  cycleId: CycleId
): Promise<CleanupOutcome[]> {
  const out: CleanupOutcome[] = [];
  for (const item of selectPendingForCycle(tickets, cycleId)) {
    out.push(await deleteWithVerification(storage, item, "cycle_closed"));
  }
  return out;
}

/** Limpieza de caducados (la ejecutará el job cuando exista planificador). */
export async function purgeExpired(
  storage: PrivateTicketStorage,
  tickets: readonly RetainedTicket[],
  nowMs: number
): Promise<CleanupOutcome[]> {
  const out: CleanupOutcome[] = [];
  for (const item of selectExpired(tickets, nowMs)) out.push(await deleteWithVerification(storage, item, "ttl_expired"));
  return out;
}
