/**
 * Máquina de estados del ticket del escáner (Fase 5).
 *
 * Módulo puro y sin almacenamiento: no hay estado "permanente" de imagen. La
 * imagen solo puede estar `present` durante la subida, el procesamiento y la
 * revisión; confirmar o caducar exige su borrado, y `deleted` solo se alcanza
 * cuando el borrado fue VERIFICADO (docs: I16).
 *
 * Estados y transiciones: lista de Fase 4 (technical-architecture.md §B, F4-13),
 * sin `ready_for_review` ni `discarded` (el descarte es `deleted` con motivo).
 * Retención online del original: eliminada por decisión del propietario
 * (decision-log.md §10); el usuario puede descargarlo en su dispositivo.
 */

export const TICKET_STATUSES = [
  "initiated",
  "uploaded",
  "processing",
  "needs_review",
  "confirmed",
  "failed",
  "expired",
  "deleted",
] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_STATUS_REASONS = [
  "user_discarded",
  "ttl_expired",
  "validation_rejected",
  "provider_failed",
] as const;
export type TicketStatusReason = (typeof TICKET_STATUS_REASONS)[number];

/** Estado del archivo en almacenamiento temporal privado. No existe un estado "kept". */
export type OriginalStorage = "none" | "present" | "deletion_pending" | "deleted_verified";

export interface TicketState {
  /** Identificador opaco (UUID aleatorio); no contiene datos del ticket. */
  id: string;
  status: TicketStatus;
  statusReason: TicketStatusReason | null;
  attemptCount: number;
  originalStorage: OriginalStorage;
  hasDraft: boolean;
  /** Clave de idempotencia de la confirmación; se fija al confirmar. */
  confirmKey: string | null;
}

export const ALLOWED_TRANSITIONS: Record<TicketStatus, readonly TicketStatus[]> = {
  initiated: ["uploaded", "expired", "deleted"],
  uploaded: ["processing", "expired", "deleted"],
  processing: ["needs_review", "failed", "deleted"],
  needs_review: ["confirmed", "deleted", "expired"],
  failed: ["processing", "deleted", "expired"],
  confirmed: ["deleted"],
  expired: ["deleted"],
  deleted: [],
};

export type TransitionErrorCode = "ILLEGAL_TRANSITION" | "RETRY_LIMIT" | "ORIGINAL_NOT_DELETED" | "NO_DRAFT";

export type TransitionResult = { ok: true; ticket: TicketState } | { ok: false; code: TransitionErrorCode };

export interface TransitionOptions {
  reason?: TicketStatusReason;
  /** Obligatorio para `failed → processing`; sin valor se deniega (el límite está PENDIENTE). */
  maxRetries?: number;
}

export function createTicket(id: string): TicketState {
  return {
    id,
    status: "initiated",
    statusReason: null,
    attemptCount: 0,
    originalStorage: "none",
    hasDraft: false,
    confirmKey: null,
  };
}

export function canTransition(from: TicketStatus, to: TicketStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

const fail = (code: TransitionErrorCode): TransitionResult => ({ ok: false, code });

/** Devuelve un ticket nuevo; nunca muta el de entrada. */
export function transitionTicket(ticket: TicketState, to: TicketStatus, opts: TransitionOptions = {}): TransitionResult {
  if (!canTransition(ticket.status, to)) return fail("ILLEGAL_TRANSITION");
  const next: TicketState = { ...ticket, status: to, statusReason: opts.reason ?? null };

  switch (to) {
    case "uploaded":
      next.originalStorage = "present";
      break;
    case "processing":
      if (ticket.status === "failed" && (opts.maxRetries === undefined || ticket.attemptCount >= opts.maxRetries)) {
        return fail("RETRY_LIMIT");
      }
      next.attemptCount = ticket.attemptCount + 1;
      break;
    case "needs_review":
      next.hasDraft = true;
      break;
    case "confirmed":
      if (!ticket.hasDraft) return fail("NO_DRAFT");
      if (ticket.originalStorage === "present") next.originalStorage = "deletion_pending";
      break;
    case "expired":
      if (ticket.originalStorage === "present") next.originalStorage = "deletion_pending";
      break;
    case "deleted":
      if (ticket.originalStorage === "present" || ticket.originalStorage === "deletion_pending") {
        return fail("ORIGINAL_NOT_DELETED");
      }
      next.hasDraft = false;
      break;
    default:
      break;
  }
  return { ok: true, ticket: next };
}

/** Pide el borrado del original (descarte/cancelación). Idempotente; no cambia el estado del ticket. */
export function requestOriginalDeletion(ticket: TicketState): TicketState {
  return ticket.originalStorage === "present" ? { ...ticket, originalStorage: "deletion_pending" } : ticket;
}

/**
 * Registra que el objeto se comprobó ausente en el almacenamiento. Solo desde
 * `deletion_pending`: quien lo llame debe haber verificado la ausencia real.
 */
export function recordOriginalDeletionVerified(ticket: TicketState): TicketState {
  return ticket.originalStorage === "deletion_pending" ? { ...ticket, originalStorage: "deleted_verified" } : ticket;
}
