import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveCycleScope } from "@/lib/agents/tools/utils/cycle-scope";
import { getOpenMonth, getMonthByYm } from "@/lib/months";

vi.mock("@/lib/months", () => ({
  getOpenMonth: vi.fn(),
  getMonthByYm: vi.fn(),
}));

const mockGetOpenMonth = vi.mocked(getOpenMonth);
const mockGetMonthByYm = vi.mocked(getMonthByYm);

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
});
