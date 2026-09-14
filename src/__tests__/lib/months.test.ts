import { describe, it, expect } from "vitest";
import { nextYm } from "@/lib/months";

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
