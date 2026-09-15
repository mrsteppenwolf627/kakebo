import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Hotfix 2.1: protección contra adivinanzas de "ciclo anterior" en el flujo
 * REALMENTE activo (processFunctionCallingStream). Bug real: al pedir
 * "ciclo anterior", el modelo podía traducirlo a un cycle_scope/cycle_ym
 * arbitrario (p. ej. enero) en vez de cycle_scope: "previous". Verifica:
 * - "ciclo anterior" + cycle_scope != "previous" → se bloquea, nunca ejecuta.
 * - "ciclo anterior" + cycle_scope: "previous" → se ejecuta tal cual.
 * - Comparación explícita con el ciclo anterior vía compare_cycle_scope
 *   también cuenta como correcta.
 * - Sin la expresión "ciclo anterior" en el mensaje, el resto de ámbitos
 *   (current/specific/all_history) siguen funcionando sin bloqueo (regresión).
 */

vi.mock("@/lib/ai/client", () => ({
  openai: {
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  },
  DEFAULT_MODEL: "gpt-5-nano",
  calculateCost: vi.fn(() => 0.0001),
}));

vi.mock("@/lib/logger", () => ({
  apiLogger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/agents-v2/context-analyzer", () => ({
  getUserContextCached: vi.fn(async () => ({
    isNewUser: false,
    hasLimitedHistory: false,
    totalTransactions: 50,
    dataQuality: "good",
  })),
  generateContextDisclaimer: vi.fn(() => ""),
}));

vi.mock("@/lib/agents/tools/utils/example-retriever", () => ({
  getRelevantExamples: vi.fn(async () => []),
  formatExamplesForPrompt: vi.fn(() => ""),
}));

vi.mock("@/lib/agents/tools/analyze-habits", () => ({
  analyzeSpendingHabits: vi.fn(async () => ({
    resolvedScope: { scope: "previous", cycleYm: "2026-08", status: "closed", description: "ciclo anterior (2026-08, cerrado)" },
    category: "all",
    totalAmount: 90,
    count: 3,
    averageAmount: 30,
    byCategory: [],
    bySubcategory: [],
    mostFrequent: [],
    topExpenses: [],
    coverage: { classified: 3, unclassified: 0 },
    limited: true,
    observations: [],
    possiblePatterns: [],
    recommendations: [],
    insights: [],
  })),
}));

vi.mock("@/lib/agents/tools/search-expenses", () => ({
  searchExpenses: vi.fn(async () => ({
    query: "x",
    period: "all",
    totalAmount: 0,
    count: 0,
    expenses: [],
    insights: [],
  })),
}));

import { openai } from "@/lib/ai/client";
import { analyzeSpendingHabits } from "@/lib/agents/tools/analyze-habits";
import { searchExpenses } from "@/lib/agents/tools/search-expenses";
import { processFunctionCallingStream, type StreamEvent } from "@/lib/agents-v2/stream-caller";

const mockCreate = vi.mocked(openai.chat.completions.create);
const mockAnalyzeSpendingHabits = vi.mocked(analyzeSpendingHabits);
const mockSearchExpenses = vi.mocked(searchExpenses);

const mockSupabase = {} as SupabaseClient;
const userId = "user-123";

async function* toolCallStream(toolName: string, args: Record<string, unknown>) {
  yield {
    choices: [
      { delta: { tool_calls: [{ index: 0, id: "call_1", function: { name: toolName, arguments: "" } }] } },
    ],
  };
  yield {
    choices: [
      { delta: { tool_calls: [{ index: 0, function: { arguments: JSON.stringify(args) } }] } },
    ],
  };
  yield { choices: [{ delta: {} }], usage: { prompt_tokens: 20, completion_tokens: 5 } };
}

async function* textStream(text: string) {
  yield { choices: [{ delta: { content: text } }] };
  yield { choices: [{ delta: {} }], usage: { prompt_tokens: 10, completion_tokens: 8 } };
}

async function run(toolName: string, userMessage: string, args: Record<string, unknown>) {
  mockCreate
    .mockReturnValueOnce(toolCallStream(toolName, args) as never)
    .mockReturnValueOnce(textStream("Respuesta sintetizada.") as never);

  const events: StreamEvent[] = [];
  await processFunctionCallingStream(userMessage, [], mockSupabase, userId, (event) => events.push(event));
  return events;
}

function fullChunkText(events: StreamEvent[]): string {
  return (events.filter((e) => e.type === "chunk") as Extract<StreamEvent, { type: "chunk" }>[])
    .map((e) => e.text)
    .join("");
}

describe("processFunctionCallingStream — protección contra adivinanzas de 'ciclo anterior' (Hotfix 2.1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockReset();
  });

  it("analyzeSpendingPattern: 'ciclo anterior' + cycle_scope: 'specific' inventado → se bloquea, nunca ejecuta ni consulta enero ni ningún otro mes", async () => {
    const events = await run("analyzeSpendingPattern", "analiza mi ciclo anterior", {
      cycle_scope: "specific",
      cycle_ym: "2026-01", // el mes "inventado" del bug real (enero)
    });

    expect(mockAnalyzeSpendingHabits).not.toHaveBeenCalled();
    expect(mockCreate).toHaveBeenCalledTimes(1); // nunca hay síntesis
    expect(fullChunkText(events)).toContain("ciclo anterior");
  });

  it("analyzeSpendingPattern: 'ciclo anterior' + cycle_scope: 'current' → se bloquea (nunca sustituye por el ciclo actual)", async () => {
    const events = await run("analyzeSpendingPattern", "¿cuánto gasté en mi ciclo anterior?", {
      cycle_scope: "current",
    });

    expect(mockAnalyzeSpendingHabits).not.toHaveBeenCalled();
    expect(fullChunkText(events).length).toBeGreaterThan(0);
  });

  it("analyzeSpendingPattern: 'ciclo anterior' + cycle_scope: 'previous' → SE EJECUTA con esos argumentos exactos", async () => {
    await run("analyzeSpendingPattern", "analiza mi ciclo anterior", {
      cycle_scope: "previous",
    });

    expect(mockAnalyzeSpendingHabits).toHaveBeenCalledTimes(1);
    const calledArgs = mockAnalyzeSpendingHabits.mock.calls[0][2];
    expect(calledArgs).toMatchObject({ cycle_scope: "previous" });
  });

  it("analyzeSpendingPattern: comparación explícita con el ciclo anterior vía compare_cycle_scope: 'previous' → SE EJECUTA", async () => {
    await run("analyzeSpendingPattern", "compara este ciclo con el ciclo anterior", {
      cycle_scope: "current",
      compare: true,
      compare_cycle_scope: "previous",
    });

    expect(mockAnalyzeSpendingHabits).toHaveBeenCalledTimes(1);
  });

  it("searchExpenses: 'ciclo anterior' + cycle_scope: 'specific' inventado → se bloquea, nunca ejecuta la búsqueda", async () => {
    const events = await run("searchExpenses", "busca mis gastos de mi ciclo anterior", {
      search_intent: "analysis",
      cycle_scope: "specific",
      cycle_ym: "2026-01",
    });

    expect(mockSearchExpenses).not.toHaveBeenCalled();
    expect(fullChunkText(events)).toContain("ciclo anterior");
  });

  it("searchExpenses: 'ciclo anterior' + cycle_scope: 'previous' → SE EJECUTA la búsqueda", async () => {
    await run("searchExpenses", "busca mis gastos de mi ciclo anterior", {
      search_intent: "analysis",
      cycle_scope: "previous",
    });

    expect(mockSearchExpenses).toHaveBeenCalledTimes(1);
  });

  it("regresión: sin la expresión 'ciclo anterior' en el mensaje, cycle_scope: 'current' sigue ejecutando sin bloqueo", async () => {
    await run("analyzeSpendingPattern", "analiza mis hábitos de este ciclo", {
      cycle_scope: "current",
    });

    expect(mockAnalyzeSpendingHabits).toHaveBeenCalledTimes(1);
  });

  it("regresión: sin la expresión 'ciclo anterior', cycle_scope: 'specific' con un cycle_ym real sigue ejecutando sin bloqueo", async () => {
    await run("analyzeSpendingPattern", "resumen del ciclo de agosto", {
      cycle_scope: "specific",
      cycle_ym: "2026-08",
    });

    expect(mockAnalyzeSpendingHabits).toHaveBeenCalledTimes(1);
  });

  it("regresión: sin la expresión 'ciclo anterior', cycle_scope: 'all_history' sigue ejecutando sin bloqueo", async () => {
    await run("analyzeSpendingPattern", "analiza todo mi histórico", {
      cycle_scope: "all_history",
    });

    expect(mockAnalyzeSpendingHabits).toHaveBeenCalledTimes(1);
  });
});
