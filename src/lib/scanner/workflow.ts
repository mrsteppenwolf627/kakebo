/**
 * Une cuota y estados: el consumo ocurre exactamente al aceptar el ticket
 * (`uploaded → processing`) y solo si ambas cosas son posibles; si una falla,
 * no se aplica ninguna (equivalente puro de la transacción propuesta en
 * data-model.md §2.8). Un reintento (`failed → processing`) no consume cuota.
 */
import { consumeQuota, refundQuota, type QuotaErrorCode, type QuotaLedger } from "./quota";
import { transitionTicket, type TicketState, type TransitionErrorCode, type TransitionOptions } from "./ticket-state";

export type StartProcessingResult =
  | { ok: true; ticket: TicketState; ledger: QuotaLedger }
  | { ok: false; code: TransitionErrorCode | QuotaErrorCode };

export function startProcessing(
  ticket: TicketState,
  ledger: QuotaLedger,
  cycleId: string,
  opts: Pick<TransitionOptions, "maxRetries"> = {}
): StartProcessingResult {
  const moved = transitionTicket(ticket, "processing", opts);
  if (!moved.ok) return moved;
  if (ticket.status === "failed") return { ok: true, ticket: moved.ticket, ledger };

  const quota = consumeQuota(ledger, ticket.id, cycleId);
  if (!quota.ok) return quota;
  return { ok: true, ticket: moved.ticket, ledger: quota.ledger };
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
