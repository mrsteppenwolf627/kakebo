import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Fase 2.D (+ corrección): diálogo fiable antes de analizar datos, en el
 * flujo REALMENTE activo (processFunctionCallingStream / agent-v2
 * streaming), no solo en el prompt estático. Verifica el contrato completo:
 * - search_intent es obligatorio; su ausencia se trata como "analysis".
 * - "analysis" sin cycle_scope NUNCA ejecuta searchExpenses (se pide ámbito).
 * - subcategories fuerza "analysis" aunque el modelo etiquete mal la llamada.
 * - "individual_lookup" está exento del requisito de ámbito.
 * - alimentación ambigua: el ámbito se pregunta SIEMPRE antes que el tipo de
 *   alimentación (nunca dos preguntas en el mismo turno).
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

vi.mock("@/lib/agents/tools/search-expenses", () => ({
  searchExpenses: vi.fn(async () => ({
    query: "test",
    period: "current_month",
    totalAmount: 42,
    count: 1,
    expenses: [],
    insights: [],
    resolvedScope: { scope: "current", cycleYm: "2026-10", status: "open", description: "ciclo abierto actual (2026-10)" },
    returnedCount: 1,
    totalCount: 1,
  })),
}));

import { openai } from "@/lib/ai/client";
import { searchExpenses } from "@/lib/agents/tools/search-expenses";
import { processFunctionCallingStream, type StreamEvent } from "@/lib/agents-v2/stream-caller";

const mockCreate = vi.mocked(openai.chat.completions.create);
const mockSearchExpenses = vi.mocked(searchExpenses);

const mockSupabase = {} as SupabaseClient;
const userId = "user-123";

/** Simula un stream de OpenAI que decide llamar a una tool concreta. */
async function* toolCallStream(toolName: string, args: Record<string, unknown>) {
  yield {
    choices: [
      { delta: { tool_calls: [{ index: 0, id: "call_1", function: { name: toolName, arguments: "" } }] } },
    ],
  };
  yield {
    choices: [
      { delta: { tool_calls: [{ index: 0, function: { arguments: JSON.stringify(args) } } ] } },
    ],
  };
  yield {
    choices: [{ delta: {} }],
    usage: { prompt_tokens: 20, completion_tokens: 5 },
  };
}

/** Simula un stream de OpenAI que responde directamente en texto (síntesis). */
async function* textStream(text: string) {
  yield { choices: [{ delta: { content: text } }] };
  yield { choices: [{ delta: {} }], usage: { prompt_tokens: 10, completion_tokens: 8 } };
}

async function run(userMessage: string, toolName: string, args: Record<string, unknown>) {
  // 1ª llamada: decide la tool call. 2ª llamada (si se ejecuta): síntesis.
  mockCreate
    .mockReturnValueOnce(toolCallStream(toolName, args) as never)
    .mockReturnValueOnce(textStream("Respuesta sintetizada.") as never);

  const events: StreamEvent[] = [];
  await processFunctionCallingStream(
    userMessage,
    [],
    mockSupabase,
    userId,
    (event) => events.push(event)
  );
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

describe("processFunctionCallingStream (agent-v2 streaming activo) — Fase 2.D + corrección", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // mockReset (no solo clearAllMocks) para vaciar también las
    // implementaciones "once" en cola entre tests — cada test encola sus
    // propias respuestas de OpenAI y algunos las consumen parcialmente
    // (cuando la puerta de ámbito corta el turno antes de la 2ª llamada).
    mockCreate.mockReset();
  });

  it("'¿Cuánto he gastado?' sin ámbito → no ejecuta searchExpenses, pregunta por ciclo", async () => {
    const events = await run(
      "¿cuánto he gastado?",
      "searchExpenses",
      { query: "cuánto he gastado", search_intent: "analysis" } // sin cycle_scope
    );

    expect(mockSearchExpenses).not.toHaveBeenCalled();
    expect(mockCreate).toHaveBeenCalledTimes(1); // nunca hay 2ª llamada (síntesis)
    expect(fullChunkText(events)).toContain(
      "¿Quieres que analice el ciclo actual, un ciclo concreto o todo tu historial?"
    );
    expect(doneEventOf(events).toolsUsed).toEqual([]);
  });

  it("'Analiza mis hábitos' sin ámbito → no ejecuta searchExpenses, pregunta por ciclo", async () => {
    const events = await run(
      "analiza mis hábitos",
      "searchExpenses",
      { query: "hábitos", search_intent: "analysis" } // sin cycle_scope
    );

    expect(mockSearchExpenses).not.toHaveBeenCalled();
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(fullChunkText(events)).toContain(
      "¿Quieres que analice el ciclo actual, un ciclo concreto o todo tu historial?"
    );
  });

  it("'¿Cuánto he gastado este ciclo?' con search_intent: 'analysis' y cycle_scope: 'current' → ejecuta la herramienta", async () => {
    const args = { query: "cuánto he gastado", search_intent: "analysis", cycle_scope: "current" };
    const events = await run("¿cuánto he gastado este ciclo?", "searchExpenses", args);

    expect(mockSearchExpenses).toHaveBeenCalledTimes(1);
    const calledArgs = mockSearchExpenses.mock.calls[0][2];
    expect(calledArgs).toMatchObject({ search_intent: "analysis", cycle_scope: "current" });
    expect(mockCreate).toHaveBeenCalledTimes(2); // sí hay síntesis
    expect(doneEventOf(events).toolsUsed).toEqual(["searchExpenses"]);
  });

  it("'Busca mi último gasto de Netflix' con search_intent: 'individual_lookup' y sin ciclo → se permite", async () => {
    const args = { query: "Netflix", search_intent: "individual_lookup" }; // sin cycle_scope
    await run("busca mi último gasto de Netflix", "searchExpenses", args);

    expect(mockSearchExpenses).toHaveBeenCalledTimes(1);
    const calledArgs = mockSearchExpenses.mock.calls[0][2];
    expect(calledArgs).toMatchObject({ query: "Netflix", search_intent: "individual_lookup" });
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it("una llamada SIN search_intent → se bloquea y pregunta ámbito (nunca se trata como búsqueda individual)", async () => {
    const events = await run("último gasto", "searchExpenses", { query: "último" }); // sin search_intent, sin cycle_scope

    expect(mockSearchExpenses).not.toHaveBeenCalled();
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(fullChunkText(events)).toContain(
      "¿Quieres que analice el ciclo actual, un ciclo concreto o todo tu historial?"
    );
  });

  it("una llamada con subcategories pero search_intent: 'individual_lookup' y sin ciclo → se bloquea", async () => {
    const events = await run(
      "gastos de restaurantes",
      "searchExpenses",
      { query: "restaurantes", subcategories: ["dining_out"], search_intent: "individual_lookup" } // mal etiquetado, sin cycle_scope
    );

    expect(mockSearchExpenses).not.toHaveBeenCalled();
    expect(fullChunkText(events)).toContain(
      "¿Quieres que analice el ciclo actual, un ciclo concreto o todo tu historial?"
    );
  });

  it("alimentación ambigua SIN ámbito → pregunta primero por el ámbito (no por el tipo de alimentación)", async () => {
    const events = await run(
      "gastos de alimentación",
      "searchExpenses",
      { query: "alimentación", search_intent: "analysis" } // sin cycle_scope, sin subcategories
    );

    expect(mockSearchExpenses).not.toHaveBeenCalled();
    const text = fullChunkText(events);
    expect(text).toContain("¿Quieres que analice el ciclo actual, un ciclo concreto o todo tu historial?");
    expect(text).not.toContain("¿Te refieres a alimentación básica");
  });

  it("alimentación ambigua CON ámbito pero sin tipo → pregunta alimentación básica / comer fuera / ambas", async () => {
    const events = await run(
      "gastos de alimentación en mi ciclo actual",
      "searchExpenses",
      { query: "alimentación", search_intent: "analysis", cycle_scope: "current" } // ámbito ya resuelto, sin subcategories
    );

    expect(mockSearchExpenses).not.toHaveBeenCalled();
    expect(fullChunkText(events)).toContain(
      "¿Te refieres a alimentación básica, a comer fuera o a ambas?"
    );
  });

  it("EJECUTA searchExpenses con dining_out cuando cycle_scope y subcategories ya vienen resueltos", async () => {
    const args = {
      query: "restaurantes",
      subcategories: ["dining_out"],
      search_intent: "analysis",
      cycle_scope: "all_history",
    };
    await run("¿cuánto gasto en comer fuera en total?", "searchExpenses", args);

    expect(mockSearchExpenses).toHaveBeenCalledTimes(1);
    const calledArgs = mockSearchExpenses.mock.calls[0][2];
    expect(calledArgs).toMatchObject({ subcategories: ["dining_out"], cycle_scope: "all_history" });
  });
});
