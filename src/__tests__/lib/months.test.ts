import { describe, it, expect, vi } from "vitest";
import { nextYm, getPreviousMonth, type MonthRow } from "@/lib/months";

describe("nextYm (ciclos libres)", () => {
  it("advances to the next month within the same year", () => {
    expect(nextYm(2026, 9)).toEqual({ year: 2026, month: 10 });
  });

  it("rolls over to January of the next year after December", () => {
    expect(nextYm(2026, 12)).toEqual({ year: 2027, month: 1 });
  });

  it("does not skip a fixed payday: any month can be followed immediately", () => {
    expect(nextYm(2026, 1)).toEqual({ year: 2026, month: 2 });
    expect(nextYm(2026, 6)).toEqual({ year: 2026, month: 7 });
  });
});

/**
 * Hotfix 2.1: getPreviousMonth debe resolver el ciclo inmediatamente
 * anterior a una etiqueta de referencia usando exclusivamente los ciclos
 * reales de `months` (nunca fecha de calendario ni fecha actual).
 */
describe("getPreviousMonth (Hotfix 2.1) — ciclo inmediatamente anterior vía tabla months", () => {
  function makeMonth(overrides: Partial<MonthRow>): MonthRow {
    return {
      id: `month-${overrides.year}-${overrides.month}`,
      user_id: "user-123",
      status: "closed",
      savings_done: false,
      ...overrides,
    } as MonthRow;
  }

  function mockSupabaseReturning(rows: MonthRow[]) {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: rows, error: null }),
    };
    return { from: vi.fn().mockReturnValue(builder) } as never;
  }

  it("returns the closed cycle immediately before the open one (September open, August closed)", async () => {
    const rows = [
      makeMonth({ year: 2026, month: 9, status: "open" }),
      makeMonth({ year: 2026, month: 8, status: "closed" }),
      makeMonth({ year: 2026, month: 7, status: "closed" }),
    ];
    const supabase = mockSupabaseReturning(rows);

    const result = await getPreviousMonth(supabase, "user-123", 2026, 9);

    expect(result?.year).toBe(2026);
    expect(result?.month).toBe(8);
    expect(result?.status).toBe("closed");
  });

  it("rolls back across a year boundary (open January 2027 → previous December 2026)", async () => {
    const rows = [
      makeMonth({ year: 2027, month: 1, status: "open" }),
      makeMonth({ year: 2026, month: 12, status: "closed" }),
    ];
    const supabase = mockSupabaseReturning(rows);

    const result = await getPreviousMonth(supabase, "user-123", 2027, 1);

    expect(result?.year).toBe(2026);
    expect(result?.month).toBe(12);
  });

  it("returns null when there is no cycle before the reference (user's very first cycle)", async () => {
    const rows = [makeMonth({ year: 2026, month: 1, status: "open" })];
    const supabase = mockSupabaseReturning(rows);

    const result = await getPreviousMonth(supabase, "user-123", 2026, 1);

    expect(result).toBeNull();
  });

  it("never picks a later cycle as 'previous', even if it is closed", async () => {
    // Defensive case: a closed cycle with a LATER label than the reference
    // must never be returned as "previous" — only strictly earlier labels.
    const rows = [
      makeMonth({ year: 2026, month: 10, status: "closed" }),
      makeMonth({ year: 2026, month: 9, status: "open" }),
      makeMonth({ year: 2026, month: 8, status: "closed" }),
    ];
    const supabase = mockSupabaseReturning(rows);

    const result = await getPreviousMonth(supabase, "user-123", 2026, 9);

    expect(result?.month).toBe(8);
  });
});
