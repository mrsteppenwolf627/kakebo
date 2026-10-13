/**
 * October 2026 was already being managed manually by calendar date before
 * cycle assignment became the source of truth. Keep that one cycle stable
 * during the transition; every other cycle can use its month_id assignment.
 */
export const MANUAL_CALENDAR_CYCLE_YM = "2026-10";

export function usesCycleLedger(ym: string) {
  return ym !== MANUAL_CALENDAR_CYCLE_YM;
}
