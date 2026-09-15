import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveCycleScope } from "@/lib/agents/tools/utils/cycle-scope";
import { getOpenMonth, getMonthByYm, getPreviousMonth } from "@/lib/months";

vi.mock("@/lib/months", () => ({
  getOpenMonth: vi.fn(),
  getMonthByYm: vi.fn(),
  getPreviousMonth: vi.fn(),
}));

const mockGetOpenMonth = vi.mocked(getOpenMonth);
const mockGetMonthByYm = vi.mocked(getMonthByYm);
const mockGetPreviousMonth = vi.mocked(getPreviousMonth);

describe("resolveCycleScope (Fase 2.C) — resolución compartida y testeable de cycle_scope", () => {
  const supabase = {} as never;
  const userId = "user-123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("current", () => {
    it("resolves the user's currently OPEN cycle via getOpenMonth (centralized helper), not by calendar date", async () => {
      mockGetOpenMonth.mockResolvedValue({
        id: "october-cycle",
        user_id: userId,
        year: 2026,
        month: 10,
        status: "open",
        savings_done: false,
      });

      const result = await resolveCycleScope(supabase, userId, "current");

      expect(result.scope).toBe("current");
      expect(result.monthId).toBe("october-cycle");
      expect(result.cycleYm).toBe("2026-10");
      expect(result.status).toBe("open");
      expect(mockGetOpenMonth).toHaveBeenCalledWith(supabase, userId);
      expect(mockGetMonthByYm).not.toHaveBeenCalled();
    });

    it("fails with a clear error when the user has no open cycle yet", async () => {
      mockGetOpenMonth.mockResolvedValue(null);

      await expect(resolveCycleScope(supabase, userId, "current")).rejects.toThrow(
        /ciclo abierto/i
      );
    });
  });

  describe("specific", () => {
    it("resolves an existing cycle (open or closed) by cycle_ym, allowing read access to a closed one", async () => {
      mockGetMonthByYm.mockResolvedValue({
        id: "sept-cycle",
        user_id: userId,
        year: 2026,
        month: 9,
        status: "closed",
        savings_done: false,
      });

      const result = await resolveCycleScope(supabase, userId, "specific", "2026-09");

      expect(result.monthId).toBe("sept-cycle");
      expect(result.status).toBe("closed");
      expect(result.cycleYm).toBe("2026-09");
      expect(mockGetMonthByYm).toHaveBeenCalledWith(supabase, userId, 2026, 9);
    });

    it("rejects a nonexistent or foreign cycle_ym without filtering or exposing any data", async () => {
      // getMonthByYm already scopes by user_id — returns null both when the
      // cycle doesn't exist and when it belongs to another user.
      mockGetMonthByYm.mockResolvedValue(null);

      await expect(
        resolveCycleScope(supabase, userId, "specific", "2026-09")
      ).rejects.toThrow(/no existe/i);
    });

    it("requires a well-formed cycle_ym (YYYY-MM) and never calls getMonthByYm otherwise", async () => {
      await expect(
        resolveCycleScope(supabase, userId, "specific", "2026/09")
      ).rejects.toThrow(/YYYY-MM/);
      await expect(resolveCycleScope(supabase, userId, "specific")).rejects.toThrow(
        /YYYY-MM/
      );
      await expect(
        resolveCycleScope(supabase, userId, "specific", "not-a-date")
      ).rejects.toThrow(/YYYY-MM/);

      expect(mockGetMonthByYm).not.toHaveBeenCalled();
    });
  });

  describe("all_history", () => {
    it("resolves to no cycle filter (monthId null) without querying months at all", async () => {
      const result = await resolveCycleScope(supabase, userId, "all_history");

      expect(result.scope).toBe("all_history");
      expect(result.monthId).toBeNull();
      expect(mockGetOpenMonth).not.toHaveBeenCalled();
      expect(mockGetMonthByYm).not.toHaveBeenCalled();
    });
  });

  describe("previous (Hotfix 2.1)", () => {
    it("resolves the cycle immediately before the currently open one, via months table (open September, previous August)", async () => {
      mockGetOpenMonth.mockResolvedValue({
        id: "sept-cycle",
        user_id: userId,
        year: 2026,
        month: 9,
        status: "open",
        savings_done: false,
      });
      mockGetPreviousMonth.mockResolvedValue({
        id: "august-cycle",
        user_id: userId,
        year: 2026,
        month: 8,
        status: "closed",
        savings_done: false,
      });

      const result = await resolveCycleScope(supabase, userId, "previous");

      expect(result.scope).toBe("previous");
      expect(result.monthId).toBe("august-cycle");
      expect(result.cycleYm).toBe("2026-08");
      expect(result.status).toBe("closed");
      expect(mockGetOpenMonth).toHaveBeenCalledWith(supabase, userId);
      expect(mockGetPreviousMonth).toHaveBeenCalledWith(supabase, userId, 2026, 9);
    });

    it("allows reading a CLOSED previous cycle (read access to closed cycles is permitted)", async () => {
      mockGetOpenMonth.mockResolvedValue({
        id: "oct-cycle",
        user_id: userId,
        year: 2026,
        month: 10,
        status: "open",
        savings_done: false,
      });
      mockGetPreviousMonth.mockResolvedValue({
        id: "sept-cycle-closed",
        user_id: userId,
        year: 2026,
        month: 9,
        status: "closed",
        savings_done: false,
      });

      const result = await resolveCycleScope(supabase, userId, "previous");

      expect(result.status).toBe("closed");
      expect(result.description).toContain("cerrado");
    });

    it("fails with a clear error and never queries a previous cycle when the user has no open cycle", async () => {
      mockGetOpenMonth.mockResolvedValue(null);

      await expect(resolveCycleScope(supabase, userId, "previous")).rejects.toThrow(
        /ciclo abierto/i
      );
      expect(mockGetPreviousMonth).not.toHaveBeenCalled();
    });

    it("fails with a clear error when there is no previous cycle available (user's very first cycle)", async () => {
      mockGetOpenMonth.mockResolvedValue({
        id: "first-cycle",
        user_id: userId,
        year: 2026,
        month: 1,
        status: "open",
        savings_done: false,
      });
      mockGetPreviousMonth.mockResolvedValue(null);

      await expect(resolveCycleScope(supabase, userId, "previous")).rejects.toThrow(
        /ciclo anterior/i
      );
    });
  });
});
