import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { logAgentTurnMetrics, getAIMetrics, type AgentTurnMetricsEntry } from "@/lib/ai/metrics";

vi.mock("@/lib/logger", () => ({
  apiLogger: { warn: vi.fn(), info: vi.fn(), debug: vi.fn(), error: vi.fn() },
}));

function makeEntry(overrides: Partial<AgentTurnMetricsEntry> = {}): AgentTurnMetricsEntry {
  return {
    user_id: "user-1",
    model: "gpt-5-nano",
    turn_type: "direct_response",
    input_tokens: 100,
    output_tokens: 20,
    cost_usd_estimated: 0.0001,
    latency_ms: 250,
    tools_used: [],
    success: true,
    ...overrides,
  };
}

describe("logAgentTurnMetrics (Fase 2.I)", () => {
  it("inserta en ai_logs con type: 'agent_v2' y nunca escribe input/output", async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      from: vi.fn(() => ({ insert: insertMock })),
    } as unknown as SupabaseClient;

    await logAgentTurnMetrics(supabase, makeEntry({ tools_used: ["searchExpenses"] }));

    expect(supabase.from).toHaveBeenCalledWith("ai_logs");
    const inserted = insertMock.mock.calls[0][0] as Record<string, unknown>;

    expect(inserted.type).toBe("agent_v2");
    expect(inserted.turn_type).toBe("direct_response");
    expect(inserted.tools_used).toEqual(["searchExpenses"]);
    expect(inserted.user_id).toBe("user-1");
    // Campos de contenido/coste real, deliberadamente ausentes u opcionales
    // y nunca rellenados con datos de conversación.
    expect(inserted).not.toHaveProperty("input");
    expect(inserted).not.toHaveProperty("output");
    expect(inserted).not.toHaveProperty("prompt_version");
    expect(inserted).not.toHaveProperty("was_corrected");
  });

  it("el coste se persiste en cost_usd como estimación, tomada de cost_usd_estimated", async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    const supabase = { from: vi.fn(() => ({ insert: insertMock })) } as unknown as SupabaseClient;

    await logAgentTurnMetrics(supabase, makeEntry({ cost_usd_estimated: 0.0042 }));

    const inserted = insertMock.mock.calls[0][0] as Record<string, unknown>;
    expect(inserted.cost_usd).toBe(0.0042);
  });

  it("no lanza si Supabase devuelve un error — se registra un aviso y se resuelve", async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: { message: "insert failed" } });
    const supabase = { from: vi.fn(() => ({ insert: insertMock })) } as unknown as SupabaseClient;

    await expect(logAgentTurnMetrics(supabase, makeEntry())).resolves.toBeUndefined();
  });

  it("no lanza si la llamada a Supabase lanza una excepción", async () => {
    const supabase = {
      from: vi.fn(() => {
        throw new Error("network error");
      }),
    } as unknown as SupabaseClient;

    await expect(logAgentTurnMetrics(supabase, makeEntry())).resolves.toBeUndefined();
  });
});

/** Chainable query builder mock: cada modificador devuelve el propio chain; el `await` final lo resuelve. */
function makeLogsQuery(rows: Array<Record<string, unknown>>) {
  const chain: Record<string, unknown> = {
    eq: vi.fn(() => chain),
    gte: vi.fn(() => chain),
    lte: vi.fn(() => Promise.resolve({ data: rows, error: null })),
  };
  return chain;
}

describe("getAIMetrics — reconoce filas agent_v2 (Fase 2.I, corrección)", () => {
  it("una fila agent_v2 se cuenta en byType.agent_v2 y en los totales agregados", async () => {
    const rows = [
      {
        type: "agent_v2",
        success: true,
        cost_usd: 0.001,
        input_tokens: 50,
        output_tokens: 10,
        latency_ms: 300,
        model: "gpt-5-nano",
      },
    ];
    const query = makeLogsQuery(rows);
    const supabase = { from: vi.fn(() => ({ select: () => query })) } as unknown as SupabaseClient;

    const metrics = await getAIMetrics(supabase, "user-1");

    expect(metrics.byType).toEqual({ classification: 0, assistant: 0, agent_v2: 1 });
    expect(metrics.totalRequests).toBe(1);
    expect(metrics.successfulRequests).toBe(1);
    expect(metrics.totalInputTokens).toBe(50);
    expect(metrics.totalOutputTokens).toBe(10);
    expect(metrics.totalCostUsd).toBeCloseTo(0.001, 6);
    expect(metrics.byModel).toEqual({ "gpt-5-nano": 1 });
  });

  it("filas antiguas de classification/assistant mantienen el mismo resultado que antes (byType y precisión de clasificación)", async () => {
    const rows = [
      {
        type: "classification",
        success: true,
        cost_usd: 0.0005,
        input_tokens: 20,
        output_tokens: 5,
        latency_ms: 100,
        model: "gpt-5-nano",
        was_corrected: false,
      },
      {
        type: "classification",
        success: true,
        cost_usd: 0.0005,
        input_tokens: 20,
        output_tokens: 5,
        latency_ms: 100,
        model: "gpt-5-nano",
        was_corrected: true,
      },
      {
        type: "assistant",
        success: true,
        cost_usd: 0.002,
        input_tokens: 80,
        output_tokens: 40,
        latency_ms: 500,
        model: "gpt-4o-mini",
      },
    ];
    const query = makeLogsQuery(rows);
    const supabase = { from: vi.fn(() => ({ select: () => query })) } as unknown as SupabaseClient;

    const metrics = await getAIMetrics(supabase, "user-1");

    expect(metrics.byType).toEqual({ classification: 2, assistant: 1, agent_v2: 0 });
    expect(metrics.classificationsTotal).toBe(2);
    expect(metrics.classificationsCorrected).toBe(1);
    expect(metrics.classificationAccuracy).toBe(50); // 1 de 2 sin corregir... (2-1)/2*100
    expect(metrics.totalRequests).toBe(3);
  });

  it("una mezcla de los tres tipos reparte correctamente byType sin perder ninguna fila", async () => {
    const rows = [
      { type: "classification", success: true, cost_usd: 0, input_tokens: 0, output_tokens: 0, latency_ms: 0, model: "m" },
      { type: "assistant", success: true, cost_usd: 0, input_tokens: 0, output_tokens: 0, latency_ms: 0, model: "m" },
      { type: "agent_v2", success: true, cost_usd: 0, input_tokens: 0, output_tokens: 0, latency_ms: 0, model: "m" },
      { type: "agent_v2", success: false, cost_usd: 0, input_tokens: 0, output_tokens: 0, latency_ms: 0, model: "m" },
    ];
    const query = makeLogsQuery(rows);
    const supabase = { from: vi.fn(() => ({ select: () => query })) } as unknown as SupabaseClient;

    const metrics = await getAIMetrics(supabase, "user-1");

    expect(metrics.byType).toEqual({ classification: 1, assistant: 1, agent_v2: 2 });
    expect(metrics.totalRequests).toBe(4);
    expect(metrics.successfulRequests).toBe(3);
    expect(metrics.failedRequests).toBe(1);
  });

  it("sin filas, byType incluye agent_v2: 0 (métricas vacías)", async () => {
    const query = makeLogsQuery([]);
    const supabase = { from: vi.fn(() => ({ select: () => query })) } as unknown as SupabaseClient;

    const metrics = await getAIMetrics(supabase, "user-1");

    expect(metrics.byType).toEqual({ classification: 0, assistant: 0, agent_v2: 0 });
    expect(metrics.totalRequests).toBe(0);
  });
});
