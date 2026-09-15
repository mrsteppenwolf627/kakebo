import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Fase 2.F: ámbito obligatorio antes de analizar hábitos, en el flujo
 * REALMENTE activo (processFunctionCallingStream). Verifica:
 * - analyzeSpendingPattern sin cycle_scope NUNCA se ejecuta (se pide ámbito).
 * - compare: true sin compare_cycle_scope se bloquea (se pide el ciclo de
 *   comparación), sin llamar dos preguntas a la vez.
 * - Con cycle_scope ya resuelto, se ejecuta y usa exactamente esos
 *   argumentos — nunca se sustituye por fecha de calendario.
 * - analyzeSpendingPattern sigue sin requerir confirmación (solo lectura):
 *   no se muestra popup, tal y como confirma TOOL_METADATA (Fase 2.E, sin
 *   cambios en esta tarea).
 * - Regresión: la puerta de searchExpenses (Fase 2.D) sigue intacta (no se
 *   toca en este archivo; se re-ejecuta el suite completo de
 *   stream-caller.test.ts como parte de la validación, no aquí).
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
    resolvedScope: { scope: "current", cycleYm: "2026-10", status: "open", description: "ciclo abierto actual (2026-10)" },
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
    observations: ["Ámbito consultado: ciclo abierto actual (2026-10)."],
    possiblePatterns: [],
    recommendations: [],
    insights: ["Ámbito consultado: ciclo abierto actual (2026-10)."],
  })),
}));

import { openai } from "@/lib/ai/client";
import { analyzeSpendingHabits } from "@/lib/agents/tools/analyze-habits";
import { processFunctionCallingStream, type StreamEvent } from "@/lib/agents-v2/stream-caller";

const mockCreate = vi.mocked(openai.chat.completions.create);
const mockAnalyzeSpendingHabits = vi.mocked(analyzeSpendingHabits);

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

async function run(userMessage: string, args: Record<string, unknown>) {
  mockCreate
    .mockReturnValueOnce(toolCallStream("analyzeSpendingPattern", args) as never)
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

function doneEventOf(events: StreamEvent[]) {
  return events.find((e) => e.type === "done") as Extract<StreamEvent, { type: "done" }>;
}

function confirmationEventOf(events: StreamEvent[]) {
  return events.find((e) => e.type === "confirmation");
}

describe("processFunctionCallingStream — ámbito obligatorio para análisis de hábitos (Fase 2.F)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockReset();
  });

  it("sin cycle_scope → NUNCA ejecuta analyzeSpendingPattern, pregunta el ámbito", async () => {
    const events = await run("analiza mis hábitos", { category: "all" });

    expect(mockAnalyzeSpendingHabits).not.toHaveBeenCalled();
    expect(mockCreate).toHaveBeenCalledTimes(1); // nunca hay síntesis
    expect(fullChunkText(events)).toContain(
      "¿Quieres que analice el ciclo actual, un ciclo concreto o todo tu historial?"
    );
    expect(doneEventOf(events).toolsUsed).toEqual([]);
  });

  it("con cycle_scope: 'current' → ejecuta la herramienta con esos argumentos exactos", async () => {
    const args = { cycle_scope: "current", category: "all" };
    const events = await run("analiza mis hábitos de este ciclo", args);

    expect(mockAnalyzeSpendingHabits).toHaveBeenCalledTimes(1);
    const calledArgs = mockAnalyzeSpendingHabits.mock.calls[0][2];
    expect(calledArgs).toMatchObject({ cycle_scope: "current", category: "all" });
    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(doneEventOf(events).toolsUsed).toEqual(["analyzeSpendingPattern"]);
  });

  it("con cycle_scope: 'specific' y cycle_ym → ejecuta permitiendo lectura de un ciclo cerrado", async () => {
    const args = { cycle_scope: "specific", cycle_ym: "2026-08", category: "survival" };
    await run("resumen de supervivencia del ciclo de agosto", args);

    expect(mockAnalyzeSpendingHabits).toHaveBeenCalledTimes(1);
    const calledArgs = mockAnalyzeSpendingHabits.mock.calls[0][2];
    expect(calledArgs).toMatchObject({ cycle_scope: "specific", cycle_ym: "2026-08" });
  });

  it("compare: true SIN compare_cycle_scope → se bloquea y pregunta con qué ciclo comparar (nunca ejecuta)", async () => {
    const events = await run("¿he gastado más que el ciclo pasado?", {
      cycle_scope: "current",
      compare: true,
    });

    expect(mockAnalyzeSpendingHabits).not.toHaveBeenCalled();
    expect(fullChunkText(events)).toContain("¿Con qué quieres comparar?");
  });

  it("compare: true CON compare_cycle_scope → ejecuta, comparación incluida en los argumentos", async () => {
    const args = {
      cycle_scope: "current",
      compare: true,
      compare_cycle_scope: "specific",
      compare_cycle_ym: "2026-09",
    };
    await run("¿he gastado más que en septiembre?", args);

    expect(mockAnalyzeSpendingHabits).toHaveBeenCalledTimes(1);
    const calledArgs = mockAnalyzeSpendingHabits.mock.calls[0][2];
    expect(calledArgs).toMatchObject({
      compare: true,
      compare_cycle_scope: "specific",
      compare_cycle_ym: "2026-09",
    });
  });

  it("sin compare (ausente) → nunca se pide ni se exige compare_cycle_scope", async () => {
    await run("¿cuánto he gastado este ciclo?", { cycle_scope: "current" });

    expect(mockAnalyzeSpendingHabits).toHaveBeenCalledTimes(1);
  });

  it("análisis de hábitos NUNCA muestra popup de confirmación (solo lectura, sin cambios de la Fase 2.E)", async () => {
    const events = await run("analiza mis hábitos de este ciclo", { cycle_scope: "current" });

    expect(confirmationEventOf(events)).toBeUndefined();
    expect(mockAnalyzeSpendingHabits).toHaveBeenCalledTimes(1);
  });

  it("cycle_scope ausente y compare: true a la vez → prioriza pedir el ámbito (nunca dos preguntas en el mismo turno)", async () => {
    const events = await run("compara mis hábitos", { compare: true, compare_cycle_scope: "current" });

    expect(mockAnalyzeSpendingHabits).not.toHaveBeenCalled();
    const text = fullChunkText(events);
    expect(text).toContain("¿Quieres que analice el ciclo actual, un ciclo concreto o todo tu historial?");
    expect(text).not.toContain("¿Con qué quieres comparar?");
  });
});
