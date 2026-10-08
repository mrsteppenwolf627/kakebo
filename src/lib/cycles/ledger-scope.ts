/**
 * October 2026 was already being managed manually by calendar date before
 * cycle assignment became the source of truth. Keep that one cycle stable
 * during the transition; new cycles use their month_id assignments.
 */
export const CYCLE_LEDGER_START_YM = "2026-11";

export function usesCycleLedger(ym: string) {
  return ym >= CYCLE_LEDGER_START_YM;
}
