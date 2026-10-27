/**
 * Cuota del escáner: 5 tickets por ciclo de la aplicación (Fase 5).
 *
 * Decisión del propietario (decision-log.md §10): el límite es POR CICLO y se
 * reinicia exclusivamente al cerrar ciclo, nunca por día ni por reloj. Por eso
 * este módulo no recibe fechas: el uso se calcula contando entradas del libro
 * con el mismo `cycleId`; un `cycleId` nuevo parte de cero.
 *
 * Módulo puro (libro en memoria). La persistencia real (tablas, función
 * atómica) NO existe todavía: ver "Bloqueos" en decision-log.md §10. El libro
 * es idempotente por `(ticketId, kind)`, como en data-model.md §2.8.
 */

export const SCANNER_CYCLE_TICKET_LIMIT = 5;

export type QuotaKind = "consume" | "refund";

export interface QuotaLedgerEntry {
  readonly ticketId: string;
  readonly cycleId: string;
  readonly kind: QuotaKind;
}

export type QuotaLedger = readonly QuotaLedgerEntry[];

export interface QuotaStatus {
  limit: number;
  used: number;
  remaining: number;
}

export type QuotaErrorCode = "QUOTA_EXCEEDED" | "INVALID_CYCLE" | "INVALID_TICKET" | "NOTHING_TO_REFUND";

export type QuotaResult =
  | { ok: true; ledger: QuotaLedger; idempotent: boolean }
  | { ok: false; code: QuotaErrorCode };

const isId = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

export function quotaUsed(ledger: QuotaLedger, cycleId: string): number {
  let used = 0;
  for (const entry of ledger) {
    if (entry.cycleId !== cycleId) continue;
    used += entry.kind === "consume" ? 1 : -1;
  }
  return Math.max(0, used);
}

export function getQuotaStatus(
  ledger: QuotaLedger,
  cycleId: string,
  limit: number = SCANNER_CYCLE_TICKET_LIMIT
): QuotaStatus {
  const used = quotaUsed(ledger, cycleId);
  return { limit, used, remaining: Math.max(0, limit - used) };
}

/**
 * Consume una unidad por ticket aceptado. Repetir con el mismo ticket no
 * consume de nuevo (aunque cambie el ciclo: la entrada original manda).
 */
export function consumeQuota(
  ledger: QuotaLedger,
  ticketId: string,
  cycleId: string,
  limit: number = SCANNER_CYCLE_TICKET_LIMIT
): QuotaResult {
  if (!isId(ticketId)) return { ok: false, code: "INVALID_TICKET" };
  if (!isId(cycleId)) return { ok: false, code: "INVALID_CYCLE" };
  if (ledger.some((e) => e.ticketId === ticketId && e.kind === "consume")) {
    return { ok: true, ledger, idempotent: true };
  }
  if (quotaUsed(ledger, cycleId) >= limit) return { ok: false, code: "QUOTA_EXCEEDED" };
  return { ok: true, ledger: [...ledger, { ticketId, cycleId, kind: "consume" }], idempotent: false };
}

/**
 * Reembolsa el consumo de un ticket (solo fallos del sistema; decisión del
 * llamador). Como máximo un reembolso por ticket, en el ciclo del consumo.
 */
export function refundQuota(ledger: QuotaLedger, ticketId: string): QuotaResult {
  if (!isId(ticketId)) return { ok: false, code: "INVALID_TICKET" };
  if (ledger.some((e) => e.ticketId === ticketId && e.kind === "refund")) {
    return { ok: true, ledger, idempotent: true };
  }
  const consumed = ledger.find((e) => e.ticketId === ticketId && e.kind === "consume");
  if (!consumed) return { ok: false, code: "NOTHING_TO_REFUND" };
  return { ok: true, ledger: [...ledger, { ticketId, cycleId: consumed.cycleId, kind: "refund" }], idempotent: false };
}
