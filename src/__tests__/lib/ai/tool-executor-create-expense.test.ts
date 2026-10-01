import { describe, it, expect, vi, beforeEach } from "vitest";
import { executeTool } from "@/lib/ai/tool-executor";

// Fase 3.B: la creación de gastos desde el asistente legado (POST /api/ai/assistant)
// debe pasar por la misma RPC fn_create_expense que el flujo manual y agent-v2 --
// ver docs/planning/fase-3-monetizacion.md §3.B.2 y §5 (rutas migradas).
//
// Nota: a diferencia de la ruta manual (POST /api/expenses) y de
// src/lib/agents/tools/create-transaction.ts (agent-v2), este canal legado
// todavía resuelve el ciclo por MES NATURAL de la fecha del gasto (no por
// "ciclo libre" abierto, ver src/lib/months.ts) -- comportamiento preexistente,
// sin cambios en esta migración; solo se sustituye el INSERT final por la RPC.

vi.mock("@/lib/logger", () => ({
  apiLogger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

describe("tool-executor (asistente legado) — create_expense usa fn_create_expense", () => {
  let mockSupabase: {
    from: ReturnType<typeof vi.fn>;
    select: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    single: ReturnType<typeof vi.fn>;
    insert: ReturnType<typeof vi.fn>;
    rpc: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn(() => mockSupabase),
      select: vi.fn(() => mockSupabase),
      eq: vi.fn(() => mockSupabase),
      single: vi.fn(),
      insert: vi.fn(() => mockSupabase),
      rpc: vi.fn(),
    };
  });

  it("resuelve el mes y crea el gasto vía la RPC, no vía INSERT directo", async () => {
    mockSupabase.single
      // getOrCreateMonth (interno de executeCreateExpense) -- mes ya existe
      .mockResolvedValueOnce({ data: { id: "month-abc", status: "open" }, error: null });
    mockSupabase.rpc.mockResolvedValueOnce({
      data: { id: "expense-1", amount: 20, category: "survival" },
      error: null,
    });

    const result = await executeTool(
      "create_expense",
      { amount: 20, category: "survival", note: "Test", date: "2026-05-10" },
      mockSupabase as any,
      "user-legado-1"
    );

    expect(result.success).toBe(true);
    expect(mockSupabase.rpc).toHaveBeenCalledWith(
      "fn_create_expense",
      expect.objectContaining({
        p_month_id: "month-abc",
        p_amount: 20,
        p_category: "survival",
      })
    );
    // Nunca debe haber un INSERT directo sobre expenses en este canal.
    expect(mockSupabase.insert).not.toHaveBeenCalledWith(
      expect.objectContaining({ amount: 20 })
    );
  });

  it("mapea el error de límite (KB001) a un mensaje claro sin lanzar excepción cruda", async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: { id: "month-abc", status: "open" },
      error: null,
    });
    mockSupabase.rpc.mockResolvedValueOnce({
      data: null,
      error: { code: "KB001", message: "Límite mensual de gastos alcanzado" },
    });

    const result = await executeTool(
      "create_expense",
      { amount: 5, category: "optional", note: "Café", date: "2026-05-10" },
      mockSupabase as any,
      "user-legado-1"
    );

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/límite de 30 gastos/i);
  });

  it("bloquea la creación si el mes está cerrado (comportamiento preexistente, sin cambios)", async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: { id: "month-closed", status: "closed" },
      error: null,
    });

    const result = await executeTool(
      "create_expense",
      { amount: 5, category: "optional", note: "Café", date: "2026-05-10" },
      mockSupabase as any,
      "user-legado-1"
    );

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/cerrado/i);
    // Ni siquiera debe intentar llamar a la RPC si el mes ya está cerrado.
    expect(mockSupabase.rpc).not.toHaveBeenCalled();
  });
});
