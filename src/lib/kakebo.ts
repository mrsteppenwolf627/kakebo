import type { Category, Transaction } from "./types";

export function sumAmount(txs: Transaction[]): number {
  return txs.reduce((acc, t) => acc + (Number.isFinite(t.amount) ? t.amount : 0), 0);
}

export function sumByCategory(txs: Transaction[]): Record<Category, number> {
  return txs.reduce(
    (acc, t) => {
      acc[t.category] += Number.isFinite(t.amount) ? t.amount : 0;
      return acc;
    },
    { general: 0, wants: 0, culture: 0, extras: 0 }
  );
}

export function monthKey(dateISO: string): string {
  // "2026-01-16" -> "2026-01"
  return dateISO.slice(0, 7);
}

export function filterByMonth(txs: Transaction[], month: string): Transaction[] {
  return txs.filter((t) => monthKey(t.date) === month);
}
