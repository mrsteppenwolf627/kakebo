/**
 * Fixed Expense Validation Logic
 *
 * Shared validation functions for fixed expenses.
 * Used by both the React component and test suites.
 */

/**
 * Validates YYYY-MM format (e.g., 2026-10, 2026-01)
 * Flexible: accepts YYYY-M (e.g., 2026-1) and validates month range 1-12
 */
export function isYm(s: string): boolean {
  const trimmed = s.trim();
  if (!trimmed) return false;

  const match = trimmed.match(/^(\d{4})-(\d{1,2})$/);
  if (!match) return false;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);

  // Validate month range (1-12)
  return month >= 1 && month <= 12;
}

/**
 * Normalizes YYYY-M or YYYY-MM to YYYY-MM format
 * Examples:
 *   "2026-1" → "2026-01"
 *   "2026-10" → "2026-10"
 *   " 2026-1 " → "2026-01"
 */
export function normalizeYm(s: string): string {
  const trimmed = s.trim();
  const match = trimmed.match(/^(\d{4})-(\d{1,2})$/);
  if (!match) return trimmed; // fallback to original if format is unexpected

  const year = match[1];
  const month = match[2].padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Parses due day from user input (1-31)
 */
export function parseDueDay(v: string): number | null {
  const t = v.trim();
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  const i = Math.trunc(n);
  if (i < 1 || i > 31) return null;
  return i;
}
