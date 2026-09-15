import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Hotfix 2.2: reproduce el flujo conversacional real de DOS turnos que causó
 * un fallo en producción, en el flujo REALMENTE activo
 * (processFunctionCallingStream):
 *
 *   1. Usuario: "Cuanto gasté en comida en el ciclo anterior?"
 *   2. [El chat pregunta si se refiere a alimentación básica, comer fuera o
 *      ambas — ya cubierto por search-scope-gate.ts, sin cambios aquí]
 *   3. Usuario: "A ambas pero por separado e indicando el importe de todo"
 *   4. El agente llama a analyzeSpendingPattern con cycle_scope: "previous"
 *      (el hotfix 2.1 ya lo resuelve a 2026-08, correctamente) y category:
 *      "all". La herramienta devuelve datos reales deterministas
 *      (bySubcategory + coverage). El bug real: la síntesis final ignoraba
 *      esos datos y emitía una plantilla con placeholders sin sustituir, y
 *      ofrecía "reasignar automáticamente" gastos — una capacidad
 *      inexistente.
 *
 * Verifica: el ciclo usado es "previous" (nunca un mes inventado); una
 * síntesis con placeholders NUNCA llega al usuario (se sustituye por un
 * mensaje seguro); una síntesis legítima con cifras reales y aviso de
 * cobertura incompleta SÍ llega intacta (no se bloquea texto legítimo); no
 * se ofrece reclasificación automática.
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

// Resultado real y determinista, tal y como lo devolvería
// analyzeSpendingHabits para el ciclo anterior (2026-08) del bug reportado:
// food_basic y dining_out con datos reales, y 4 gastos del ciclo sin
// subcategoría asignada (coverage.unclassified).
const REALISTIC_HABIT_RESULT = {
  resolvedScope: {
    scope: "previous",
    cycleYm: "2026-08",
    status: "closed",
    description: "ciclo anterior (2026-08, cerrado)",
  },
  category: "all",
  totalAmount: 220.5,
  count: 12,
  averageAmount: 18.38,
  byCategory: [],
  bySubcategory: [
    { subcategory: "food_basic", label: "Alimentación básica", amount: 62.3, count: 5, percentage: 28.3 },
    { subcategory: "dining_out", label: "Comer fuera", amount: 41.0, count: 3, percentage: 18.6 },
  ],
  mostFrequent: [],
  topExpenses: [],
  comparison: undefined,
  coverage: { classified: 8, unclassified: 4 },
  limited: false,
  observations: ["Ámbito consultado: ciclo anterior (2026-08, cerrado)."],
  possiblePatterns: [],
  recommendations: [],
  insights: ["Ámbito consultado: ciclo anterior (2026-08, cerrado)."],
};

vi.mock("@/lib/agents/tools/analyze-habits", () => ({
  analyzeSpendingHabits: vi.fn(async () => REALISTIC_HABIT_RESULT),
}));

import { openai } from "@/lib/ai/client";
import { analyzeSpendingHabits } from "@/lib/agents/tools/analyze-habits";
import { processFunctionCallingStream, type StreamEvent } from "@/lib/agents-v2/stream-caller";
import { containsSynthesisPlaceholder, SYNTHESIS_SAFETY_FALLBACK_MESSAGE } from "@/lib/agents-v2/synthesis-guard";

const mockCreate = vi.mocked(openai.chat.completions.create);
const mockAnalyzeSpendingHabits = vi.mocked(analyzeSpendingHabits);

const mockSupabase = {} as SupabaseClient;
const userId = "user-123";

const FORBIDDEN_PATTERNS = ["€X", "X,XX", "N gastos", "[Concepto]", "€importe", "xxx-xxx"];

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

// Simula la síntesis en varios chunks (como llegaría realmente en streaming
// token a token), para verificar que el buffering del guard reconstruye el
// texto completo antes de decidir — un placeholder partido entre chunks
// nunca debe "colarse" solo porque un chunk aislado parezca inocuo.
async function* chunkedTextStream(parts: string[]) {
  for (const part of parts) {
    yield { choices: [{ delta: { content: part } }] };
  }
  yield { choices: [{ delta: {} }], usage: { prompt_tokens: 10, completion_tokens: 8 } };
}

function fullChunkText(events: StreamEvent[]): string {
  return (events.filter((e) => e.type === "chunk") as Extract<StreamEvent, { type: "chunk" }>[])
    .map((e) => e.text)
    .join("");
}

describe("processFunctionCallingStream — flujo real de dos turnos, síntesis con datos reales (Hotfix 2.2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockReset();
  });

  // Historial simulando el turno 1 ya completado: el usuario preguntó por
  // "comida" en su ciclo anterior y el chat pidió aclaración sobre el tipo
  // de alimentación (comportamiento ya cubierto por search-scope-gate.ts,
  // sin cambios en este hotfix).
  const conversationHistoryAfterTurn1 = [
    { role: "user" as const, content: "Cuanto gasté en comida en el ciclo anterior?" },
    {
      role: "assistant" as const,
      content: "¿Te refieres a alimentación básica, a comer fuera o a ambas?",
    },
  ];

  const turn2Message = "A ambas pero por separado e indicando el importe de todo";

  it("BUG REAL: una síntesis con placeholders NUNCA llega al usuario — se sustituye por el mensaje seguro", async () => {
    const args = { cycle_scope: "previous", category: "all" };
    mockCreate
      .mockReturnValueOnce(toolCallStream("analyzeSpendingPattern", args) as never)
      .mockReturnValueOnce(
        chunkedTextStream([
          "Basado en N gastos, gastaste ",
          "€X,XX en alimentación básica y €X,XX en comer fuera. ",
          "1. [Concepto] - €importe (ID: xxx-xxx-xxx). ",
          "¿Quieres que reasigne automáticamente los gastos sin clasificar?",
        ]) as never
      );

    const events: StreamEvent[] = [];
    await processFunctionCallingStream(
      turn2Message,
      conversationHistoryAfterTurn1,
      mockSupabase,
      userId,
      (event) => events.push(event)
    );

    // El ciclo usado es "previous" — nunca un mes inventado (Hotfix 2.1 intacto).
    expect(mockAnalyzeSpendingHabits).toHaveBeenCalledTimes(1);
    expect(mockAnalyzeSpendingHabits.mock.calls[0][2]).toMatchObject({
      cycle_scope: "previous",
      category: "all",
    });

    const text = fullChunkText(events);
    expect(text).toBe(SYNTHESIS_SAFETY_FALLBACK_MESSAGE);
    for (const pattern of FORBIDDEN_PATTERNS) {
      expect(text).not.toContain(pattern);
    }
    expect(text.toLowerCase()).not.toMatch(/reasign\w*\s+autom[aá]ticamente/);
    expect(containsSynthesisPlaceholder(text)).toBe(false);
  });

  it("RESPUESTA LEGÍTIMA: cifras reales + aviso de cobertura incompleta llega intacta al usuario (no se bloquea texto legítimo)", async () => {
    const args = { cycle_scope: "previous", category: "all" };
    const honestResponse =
      "En tu ciclo anterior (2026-08): alimentación básica 62.30€ (5 gastos), comer fuera 41.00€ (3 gastos) — total clasificado 103.30€. Aviso: 4 gastos de ese ciclo no tienen subcategoría asignada, así que esta cifra no incluye absolutamente todo el gasto en comida de ese ciclo, solo lo ya clasificado.";

    mockCreate
      .mockReturnValueOnce(toolCallStream("analyzeSpendingPattern", args) as never)
      .mockReturnValueOnce(textStream(honestResponse) as never);

    const events: StreamEvent[] = [];
    await processFunctionCallingStream(
      turn2Message,
      conversationHistoryAfterTurn1,
      mockSupabase,
      userId,
      (event) => events.push(event)
    );

    const text = fullChunkText(events);
    expect(text).toBe(honestResponse);
    // Comunica cobertura incompleta sin inventar un reparto.
    expect(text).toContain("4 gastos");
    expect(text).toMatch(/no (tienen|incluye)/i);
    for (const pattern of FORBIDDEN_PATTERNS) {
      expect(text).not.toContain(pattern);
    }
    expect(text.toLowerCase()).not.toContain("reasignar automáticamente");
  });

  it("un placeholder repartido entre varios chunks de streaming se detecta igualmente (se reconstruye el texto completo antes de decidir)", async () => {
    const args = { cycle_scope: "previous", category: "all" };
    mockCreate
      .mockReturnValueOnce(toolCallStream("analyzeSpendingPattern", args) as never)
      .mockReturnValueOnce(chunkedTextStream(["Gastaste €", "X", ",XX en total."]) as never);

    const events: StreamEvent[] = [];
    await processFunctionCallingStream(
      turn2Message,
      conversationHistoryAfterTurn1,
      mockSupabase,
      userId,
      (event) => events.push(event)
    );

    const text = fullChunkText(events);
    expect(text).toBe(SYNTHESIS_SAFETY_FALLBACK_MESSAGE);
  });

  it("regresión: sin placeholders ni oferta de reasignación, exactamente un chunk 'done' se emite y toolsUsed es correcto", async () => {
    const args = { cycle_scope: "previous", category: "all" };
    mockCreate
      .mockReturnValueOnce(toolCallStream("analyzeSpendingPattern", args) as never)
      .mockReturnValueOnce(textStream("Respuesta limpia con datos reales: 103.30€.") as never);

    const events: StreamEvent[] = [];
    await processFunctionCallingStream(
      turn2Message,
      conversationHistoryAfterTurn1,
      mockSupabase,
      userId,
      (event) => events.push(event)
    );

    const doneEvent = events.find((e) => e.type === "done") as Extract<StreamEvent, { type: "done" }>;
    expect(doneEvent).toBeDefined();
    expect(doneEvent.toolsUsed).toEqual(["analyzeSpendingPattern"]);
  });
});
