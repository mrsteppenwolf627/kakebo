/**
 * Une cuota y estados: el consumo ocurre exactamente al aceptar el ticket
 * (`uploaded → processing`) y solo si ambas cosas son posibles; si una falla,
 * no se aplica ninguna (equivalente puro de la transacción propuesta en
 * data-model.md §2.8). Un reintento (`failed → processing`) no consume cuota.
 */
import type { CycleId } from "./cycle";
import type { OcrErrorKind } from "./ocr-contract";
import { consumeQuota, refundQuota, type QuotaErrorCode, type QuotaLedger } from "./quota";
import { transitionTicket, type TicketState, type TransitionErrorCode, type TransitionOptions } from "./ticket-state";

export type StartProcessingResult =
  | { ok: true; ticket: TicketState; ledger: QuotaLedger }
  | { ok: false; code: TransitionErrorCode | QuotaErrorCode };

export function startProcessing(
  ticket: TicketState,
  ledger: QuotaLedger,
  cycleId: CycleId,
  opts: Pick<TransitionOptions, "maxRetries"> = {}
): StartProcessingResult {
  const moved = transitionTicket(ticket, "processing", opts);
  if (!moved.ok) return moved;
  if (ticket.status === "failed") return { ok: true, ticket: moved.ticket, ledger };

  const quota = consumeQuota(ledger, ticket.id, cycleId);
  if (!quota.ok) return quota;
  return { ok: true, ticket: moved.ticket, ledger: quota.ledger };
}

/**
 * Fallo técnico (se devuelve el ticket) frente a fallo atribuible al archivo
 * del usuario (queda consumido). Decisión del propietario: un error técnico de
 * subida u OCR devuelve el ticket consumido.
 */
export function isTechnicalFailure(kind: OcrErrorKind): boolean {
  return kind === "transient" || kind === "quota" || kind === "config";
}

/** Subida fallida por error técnico: devuelve el ticket si ya estaba consumido; si no, no hace nada. */
export function refundOnUploadFailure(ledger: QuotaLedger, ticketId: string): QuotaLedger {
  const refund = refundQuota(ledger, ticketId);
  return refund.ok ? refund.ledger : ledger;
}

export interface FailProcessingOptions {
  /** `true` solo si el fallo es del sistema (no del archivo del usuario): se reembolsa la cuota. */
  systemFault: boolean;
}

export function failProcessing(
  ticket: TicketState,
  ledger: QuotaLedger,
  opts: FailProcessingOptions
): { ok: true; ticket: TicketState; ledger: QuotaLedger } | { ok: false; code: TransitionErrorCode } {
  const moved = transitionTicket(ticket, "failed", { reason: "provider_failed" });
  if (!moved.ok) return moved;
  if (!opts.systemFault) return { ok: true, ticket: moved.ticket, ledger };
  const refund = refundQuota(ledger, ticket.id);
  return { ok: true, ticket: moved.ticket, ledger: refund.ok ? refund.ledger : ledger };
}
