import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCurrentCycle } from "@/lib/agents/tools/get-current-cycle";

describe("getCurrentCycle", () => {
  let mockSupabase: any;
  const userId = "test-user-123";

  beforeEach(() => {
    mockSupabase = {
      rpc: vi.fn(),
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    };
  });

  it("should return current cycle information for calendar cycle", async () => {
    const mockCycleData = {
      cycle_start: "2026-02-01",
      cycle_end: "2026-02-28",
      days_remaining: 16,
      days_elapsed: 12,
      days_total: 28,
      cycle_type: "calendar",
    };

    mockSupabase.rpc.mockResolvedValueOnce({
      data: [mockCycleData],
      error: null,
    });

    // Mock payment_cycles query
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        cycle_type: "calendar",
        payroll_day: null,
      },
      error: null,
    });

    const result = await getCurrentCycle(mockSupabase, userId, {});

    expect(result.cycleStart).toBe("2026-02-01");
    expect(result.cycleEnd).toBe("2026-02-28");
    expect(result.daysRemaining).toBe(16);
    expect(result.daysElapsed).toBe(12);
    expect(result.daysTotal).toBe(28);
    expect(result.cycleType).toBe("calendar");
    expect(result.progressPercentage).toBe(43); // 12/28 ≈ 43%
    expect(mockSupabase.rpc).toHaveBeenCalledWith("get_current_cycle", {
      p_user_id: userId,
    });
  });

  it("should return current cycle information for payroll cycle", async () => {
    const mockCycleData = {
      cycle_start: "2026-01-25",
      cycle_end: "2026-02-24",
      days_remaining: 10,
      days_elapsed: 20,
      days_total: 30,
      cycle_type: "payroll",
    };

    mockSupabase.rpc.mockResolvedValueOnce({
      data: [mockCycleData],
      error: null,
    });

    // Mock payment_cycles query with payroll_day
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        cycle_type: "payroll",
        payroll_day: 25,
      },
      error: null,
    });

    const result = await getCurrentCycle(mockSupabase, userId, {});

    expect(result.cycleType).toBe("payroll");
    expect(result.payrollDay).toBe(25);
    expect(result.daysTotal).toBe(30);
    expect(result.progressPercentage).toBe(67); // 20/30 ≈ 67%
  });

  it("should calculate progress percentage correctly", async () => {
    const testCases = [
      { elapsed: 0, total: 30, expected: 0 },
      { elapsed: 15, total: 30, expected: 50 },
      { elapsed: 30, total: 30, expected: 100 },
      { elapsed: 7, total: 28, expected: 25 },
      { elapsed: 21, total: 28, expected: 75 },
    ];

    for (const testCase of testCases) {
      const mockCycleData = {
        cycle_start: "2026-02-01",
        cycle_end: "2026-02-28",
        days_remaining: testCase.total - testCase.elapsed,
        days_elapsed: testCase.elapsed,
        days_total: testCase.total,
        cycle_type: "calendar",
      };

      mockSupabase.rpc.mockResolvedValueOnce({
        data: [mockCycleData],
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { cycle_type: "calendar", payroll_day: null },
        error: null,
      });

      const result = await getCurrentCycle(mockSupabase, userId, {});

      expect(result.progressPercentage).toBe(testCase.expected);
    }
  });

  it("should handle zero days total gracefully", async () => {
    const mockCycleData = {
      cycle_start: "2026-02-01",
      cycle_end: "2026-02-01",
      days_remaining: 0,
      days_elapsed: 0,
      days_total: 0,
      cycle_type: "calendar",
    };

    mockSupabase.rpc.mockResolvedValueOnce({
      data: [mockCycleData],
      error: null,
    });

    mockSupabase.single.mockResolvedValueOnce({
      data: { cycle_type: "calendar", payroll_day: null },
      error: null,
    });

    const result = await getCurrentCycle(mockSupabase, userId, {});

    expect(result.progressPercentage).toBe(0);
  });

  it("should handle error when RPC call fails", async () => {
    mockSupabase.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: "Database error" },
    });

    await expect(
      getCurrentCycle(mockSupabase, userId, {})
    ).rejects.toThrow();
  });

  it("should handle error when RPC returns empty data", async () => {
    mockSupabase.rpc.mockResolvedValueOnce({
      data: [],
      error: null,
    });

    await expect(
      getCurrentCycle(mockSupabase, userId, {})
    ).rejects.toThrow("No se encontró información del ciclo");
  });

  it("should handle error when RPC returns null data", async () => {
    mockSupabase.rpc.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    await expect(
      getCurrentCycle(mockSupabase, userId, {})
    ).rejects.toThrow("No se encontró información del ciclo");
  });

  it("should work even if payment_cycles query fails", async () => {
    const mockCycleData = {
      cycle_start: "2026-02-01",
      cycle_end: "2026-02-28",
      days_remaining: 16,
      days_elapsed: 12,
      days_total: 28,
      cycle_type: "calendar",
    };

    mockSupabase.rpc.mockResolvedValueOnce({
      data: [mockCycleData],
      error: null,
    });

    // Mock payment_cycles query error (should not crash)
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: { message: "Could not fetch payment cycle" },
    });

    const result = await getCurrentCycle(mockSupabase, userId, {});

    // Should still return result without payrollDay
    expect(result.cycleStart).toBe("2026-02-01");
    expect(result.cycleEnd).toBe("2026-02-28");
    expect(result.cycleType).toBe("calendar");
    expect(result.payrollDay).toBeUndefined();
  });

  it("should return payrollDay as undefined for calendar cycles", async () => {
    const mockCycleData = {
      cycle_start: "2026-02-01",
      cycle_end: "2026-02-28",
      days_remaining: 16,
      days_elapsed: 12,
      days_total: 28,
      cycle_type: "calendar",
    };

    mockSupabase.rpc.mockResolvedValueOnce({
      data: [mockCycleData],
      error: null,
    });

    mockSupabase.single.mockResolvedValueOnce({
      data: {
        cycle_type: "calendar",
        payroll_day: null,
      },
      error: null,
    });

    const result = await getCurrentCycle(mockSupabase, userId, {});

    expect(result.cycleType).toBe("calendar");
    expect(result.payrollDay).toBeUndefined();
  });

  it("should include payrollDay for payroll cycles", async () => {
    const mockCycleData = {
      cycle_start: "2026-01-15",
      cycle_end: "2026-02-14",
      days_remaining: 20,
      days_elapsed: 10,
      days_total: 30,
      cycle_type: "payroll",
    };

    mockSupabase.rpc.mockResolvedValueOnce({
      data: [mockCycleData],
      error: null,
    });

    mockSupabase.single.mockResolvedValueOnce({
      data: {
        cycle_type: "payroll",
        payroll_day: 15,
      },
      error: null,
    });

    const result = await getCurrentCycle(mockSupabase, userId, {});

    expect(result.cycleType).toBe("payroll");
    expect(result.payrollDay).toBe(15);
  });

  it("should return all required fields", async () => {
    const mockCycleData = {
      cycle_start: "2026-02-01",
      cycle_end: "2026-02-28",
      days_remaining: 16,
      days_elapsed: 12,
      days_total: 28,
      cycle_type: "calendar",
    };

    mockSupabase.rpc.mockResolvedValueOnce({
      data: [mockCycleData],
      error: null,
    });

    mockSupabase.single.mockResolvedValueOnce({
      data: { cycle_type: "calendar", payroll_day: null },
      error: null,
    });

    const result = await getCurrentCycle(mockSupabase, userId, {});

    // Verify all required fields are present
    expect(result).toHaveProperty("cycleStart");
    expect(result).toHaveProperty("cycleEnd");
    expect(result).toHaveProperty("daysRemaining");
    expect(result).toHaveProperty("daysElapsed");
    expect(result).toHaveProperty("daysTotal");
    expect(result).toHaveProperty("cycleType");
    expect(result).toHaveProperty("progressPercentage");

    // Verify types
    expect(typeof result.cycleStart).toBe("string");
    expect(typeof result.cycleEnd).toBe("string");
    expect(typeof result.daysRemaining).toBe("number");
    expect(typeof result.daysElapsed).toBe("number");
    expect(typeof result.daysTotal).toBe("number");
    expect(typeof result.cycleType).toBe("string");
    expect(typeof result.progressPercentage).toBe("number");
  });
});
