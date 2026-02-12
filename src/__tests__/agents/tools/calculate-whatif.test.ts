import { describe, it, expect, vi, beforeEach } from "vitest";
import { calculateWhatIf } from "@/lib/agents/tools/calculate-whatif";

describe("calculateWhatIf", () => {
  let mockSupabase: any;
  const userId = "test-user-123";

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    };
  });

  it("should create a scenario with monthly savings calculation", async () => {
    const mockScenario = {
      id: "scenario-uuid-123",
      user_id: userId,
      name: "Vacaciones Agosto 2026",
      description: "Viaje a la playa",
      estimated_cost: 1200,
      category: "opcional",
      target_date: "2026-08-01",
      status: "planned",
      monthly_savings_needed: 200, // Auto-calculated by trigger
    };

    mockSupabase.single.mockResolvedValue({
      data: mockScenario,
      error: null,
    });

    const result = await calculateWhatIf(mockSupabase, userId, {
      name: "Vacaciones Agosto 2026",
      estimatedCost: 1200,
      category: "optional",
      targetDate: "2026-08-01",
      description: "Viaje a la playa",
    });

    expect(result.success).toBe(true);
    expect(result.scenarioId).toBe("scenario-uuid-123");
    expect(result.name).toBe("Vacaciones Agosto 2026");
    expect(result.estimatedCost).toBe(1200);
    expect(result.monthlySavingsNeeded).toBe(200);
    expect(result.advice).toContain("200€ al mes");
    expect(result.advice).toContain("meses");
  });

  it("should handle scenario without target date", async () => {
    const mockScenario = {
      id: "scenario-uuid-456",
      user_id: userId,
      name: "Emergencia futura",
      estimated_cost: 500,
      category: "extra",
      target_date: null,
      status: "planned",
      monthly_savings_needed: null,
    };

    mockSupabase.single.mockResolvedValue({
      data: mockScenario,
      error: null,
    });

    const result = await calculateWhatIf(mockSupabase, userId, {
      name: "Emergencia futura",
      estimatedCost: 500,
      category: "extra",
      // No targetDate provided
    });

    expect(result.success).toBe(true);
    expect(result.targetDate).toBeNull();
    expect(result.monthlySavingsNeeded).toBeNull();
    expect(result.advice).toContain("Define una fecha objetivo");
  });

  it("should map English categories to Spanish correctly", async () => {
    const mockScenario = {
      id: "scenario-uuid-789",
      user_id: userId,
      name: "Curso React",
      estimated_cost: 300,
      category: "cultura",
      target_date: "2026-06-01",
      status: "planned",
      monthly_savings_needed: 75,
    };

    mockSupabase.single.mockResolvedValue({
      data: mockScenario,
      error: null,
    });

    await calculateWhatIf(mockSupabase, userId, {
      name: "Curso React",
      estimatedCost: 300,
      category: "culture",
      targetDate: "2026-06-01",
    });

    // Verify insert was called with Spanish category
    expect(mockSupabase.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "cultura",
      })
    );
  });

  it("should provide urgent advice when target date is very close", async () => {
    const mockScenario = {
      id: "scenario-urgent",
      user_id: userId,
      name: "Gasto urgente",
      estimated_cost: 200,
      category: "extra",
      target_date: "2026-02-13", // Tomorrow (assuming test runs on 2026-02-12)
      status: "planned",
      monthly_savings_needed: 200,
    };

    mockSupabase.single.mockResolvedValue({
      data: mockScenario,
      error: null,
    });

    const result = await calculateWhatIf(mockSupabase, userId, {
      name: "Gasto urgente",
      estimatedCost: 200,
      category: "extra",
      targetDate: "2026-02-13",
    });

    expect(result.success).toBe(true);
    // Should have advice (content varies based on calculation)
    expect(result.advice).toBeTruthy();
    expect(result.advice.length).toBeGreaterThan(0);
    // Should have low months remaining
    expect(result.monthsRemaining).toBeLessThanOrEqual(1);
  });

  it("should calculate months remaining correctly", async () => {
    const mockScenario = {
      id: "scenario-6months",
      user_id: userId,
      name: "Laptop nueva",
      estimated_cost: 1200,
      category: "extra",
      target_date: "2026-08-12", // 6 months from now
      status: "planned",
      monthly_savings_needed: 200,
    };

    mockSupabase.single.mockResolvedValue({
      data: mockScenario,
      error: null,
    });

    const result = await calculateWhatIf(mockSupabase, userId, {
      name: "Laptop nueva",
      estimatedCost: 1200,
      category: "extra",
      targetDate: "2026-08-12",
    });

    expect(result.success).toBe(true);
    expect(result.monthsRemaining).toBe(6);
    expect(result.monthlySavingsNeeded).toBe(200);
  });

  it("should reject negative estimated cost", async () => {
    await expect(
      calculateWhatIf(mockSupabase, userId, {
        name: "Invalid scenario",
        estimatedCost: -500,
        category: "optional",
      })
    ).rejects.toThrow("El coste estimado debe ser mayor que 0");
  });

  it("should reject zero estimated cost", async () => {
    await expect(
      calculateWhatIf(mockSupabase, userId, {
        name: "Invalid scenario",
        estimatedCost: 0,
        category: "optional",
      })
    ).rejects.toThrow("El coste estimado debe ser mayor que 0");
  });

  it("should reject empty name", async () => {
    await expect(
      calculateWhatIf(mockSupabase, userId, {
        name: "",
        estimatedCost: 500,
        category: "optional",
      })
    ).rejects.toThrow("El nombre del escenario no puede estar vacío");
  });

  it("should reject whitespace-only name", async () => {
    await expect(
      calculateWhatIf(mockSupabase, userId, {
        name: "   ",
        estimatedCost: 500,
        category: "optional",
      })
    ).rejects.toThrow("El nombre del escenario no puede estar vacío");
  });

  it("should handle database errors gracefully", async () => {
    mockSupabase.single.mockResolvedValue({
      data: null,
      error: { message: "Database connection failed" },
    });

    await expect(
      calculateWhatIf(mockSupabase, userId, {
        name: "Test scenario",
        estimatedCost: 500,
        category: "optional",
      })
    ).rejects.toThrow();
  });

  it("should set status as planned by default", async () => {
    const mockScenario = {
      id: "scenario-planned",
      user_id: userId,
      name: "Future expense",
      estimated_cost: 400,
      category: "opcional",
      target_date: "2026-12-01",
      status: "planned",
      monthly_savings_needed: 40,
    };

    mockSupabase.single.mockResolvedValue({
      data: mockScenario,
      error: null,
    });

    await calculateWhatIf(mockSupabase, userId, {
      name: "Future expense",
      estimatedCost: 400,
      category: "optional",
      targetDate: "2026-12-01",
    });

    // Verify insert was called with status: "planned"
    expect(mockSupabase.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "planned",
      })
    );
  });

  it("should correctly map all Kakebo categories", async () => {
    const categories = [
      { english: "survival", spanish: "supervivencia" },
      { english: "optional", spanish: "opcional" },
      { english: "culture", spanish: "cultura" },
      { english: "extra", spanish: "extra" },
    ] as const;

    for (const { english, spanish } of categories) {
      const mockData = {
        id: `scenario-${english}`,
        user_id: userId,
        name: "Test",
        estimated_cost: 100,
        category: spanish,
        target_date: null,
        status: "planned",
        monthly_savings_needed: null,
      };

      mockSupabase.single.mockResolvedValue({
        data: mockData,
        error: null,
      });

      await calculateWhatIf(mockSupabase, userId, {
        name: "Test",
        estimatedCost: 100,
        category: english,
      });

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          category: spanish,
        })
      );
    }
  });
});
