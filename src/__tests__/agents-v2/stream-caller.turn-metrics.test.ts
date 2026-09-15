import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Fase 2.I: métricas persistentes MÍNIMAS y privacy-safe del chat activo
 * (agent-v2 streaming, src/lib/agents-v2/stream-caller.ts), vía
 * logAgentTurnMetrics (src/lib/ai/metrics.ts) → tabla ai_logs reutilizada.
 *
 * Verifica, sobre el flujo REAL (processFunctionCallingStream):
 * - exactamente UNA métrica terminal por petición, por cada tipo de turno
 *   (respuesta directa, consulta con herramientas, bloqueo de ámbito,
 *   propuesta de confirmación, confirmación ejecutada, error);
 * - los payloads persistidos nunca contienen claves/valores prohibidos
 *   (mensaje, historial, nota, importe, fecha, argumentos de herramientas,
 *   confirmationId, IDs de gasto, email);
 * - un fallo de la capa de métricas nunca rompe el streaming ni añade un
 *   segundo evento al cliente.
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

vi.mock("@/lib/agents/tools/get-current-cycle", () => ({
  getCurrentCycle: vi.fn(async () => ({
    monthId: "month-1",
    ym: "2026-10",
    status: "open",
    description: "ciclo abierto actual (2026-10)",
  })),
}));

vi.mock("@/lib/agents/tools/create-transaction", () => ({
  createTransaction: vi.fn(async () => ({
    success: true,
    transactionId: "expense-created-1",
    type: "expense",
    amount: 50,
    concept: "comida secreta con importe 50.75€ y email test@example.com",
    category: "survival",
    date: "2026-10-05",
    message: "✅ Gasto de 50€ registrado en survival",
  })),
}));

vi.mock("@/lib/agents-v2/user-write-confirmation", () => ({
  getAiConfirmWritesPreference: vi.fn(async () => true),
}));

const mockCreatePendingAction = vi.fn();
const mockConsumePendingAction = vi.fn();
vi.mock("@/lib/agents-v2/pending-actions", async () => {
  const actual = await vi.importActual<typeof import("@/lib/agents-v2/pending-actions")>(
    "@/lib/agents-v2/pending-actions"
  );
  return {
    ...actual,
    createPendingAction: (...args: unknown[]) => mockCreatePendingAction(...args),
    consumePendingAction: (...args: unknown[]) => mockConsumePendingAction(...args),
  };
});

const mockLogAgentTurnMetrics = vi.fn();
vi.mock("@/lib/ai/metrics", () => ({
  logAgentTurnMetrics: (...args: unknown[]) => mockLogAgentTurnMetrics(...args),
}));

import { openai } from "@/lib/ai/client";
import { getCurrentCycle } from "@/lib/agents/tools/get-current-cycle";
import { createTransaction } from "@/lib/agents/tools/create-transaction";
import { getAiConfirmWritesPreference } from "@/lib/agents-v2/user-write-confirmation";
import { processFunctionCallingStream, type StreamEvent } from "@/lib/agents-v2/stream-caller";
import type { PendingAction } from "@/lib/agents-v2/types";

const mockCreate = vi.mocked(openai.chat.completions.create);
const mockGetCurrentCycle = vi.mocked(getCurrentCycle);
const mockCreateTransaction = vi.mocked(createTransaction);
const mockGetPreference = vi.mocked(getAiConfirmWritesPreference);

const mockSupabase = {} as SupabaseClient;
const userId = "user-123";

async function* toolCallStream(toolName: string, args: Record<string, unknown>, id = "call_1") {
  yield {
    choices: [{ delta: { tool_calls: [{ index: 0, id, function: { name: toolName, arguments: "" } }] } }],
  };
  yield {
    choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: JSON.stringify(args) } }] } }],
  };
  yield { choices: [{ delta: {} }], usage: { prompt_tokens: 20, completion_tokens: 5 } };
}

async function* textStream(text: string) {
  yield { choices: [{ delta: { content: text } }] };
  yield { choices: [{ delta: {} }], usage: { prompt_tokens: 10, completion_tokens: 8 } };
}

async function run(
  userMessage: string,
  confirmationId?: string
): Promise<StreamEvent[]> {
  const events: StreamEvent[] = [];
  await processFunctionCallingStream(userMessage, [], mockSupabase, userId, (event) => events.push(event), confirmationId);
  return events;
}

const ALLOWED_KEYS = new Set([
  "user_id",
  "model",
  "turn_type",
  "input_tokens",
  "output_tokens",
  "cost_usd_estimated",
  "latency_ms",
  "tools_used",
  "success",
  "error_message",
]);

const FORBIDDEN_VALUE_PATTERNS = [
  /50\.75/, // importe
  /test@example\.com/, // email
  /comida secreta/, // nota/concepto
  /2026-10-05/, // fecha exacta de un gasto
  /confirmation-id/i,
  /expense-created-1/, // id de gasto
];

function expectSafePayload(payload: Record<string, unknown>) {
  const keys = Object.keys(payload);
  for (const key of keys) {
    expect(ALLOWED_KEYS.has(key)).toBe(true);
  }
  const serialized = JSON.stringify(payload);
  for (const pattern of FORBIDDEN_VALUE_PATTERNS) {
    expect(serialized).not.toMatch(pattern);
  }
  // tools_used, si está presente, debe ser una lista de strings simples
  // (nombres), nunca objetos con argumentos.
  if (Array.isArray(payload.tools_used)) {
    for (const t of payload.tools_used) {
      expect(typeof t).toBe("string");
    }
  }
}

describe("processFunctionCallingStream — métricas persistentes por turno (Fase 2.I)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockReset();
    mockGetPreference.mockResolvedValue(true);
    mockCreatePendingAction.mockResolvedValue("confirmation-id-1");
    mockLogAgentTurnMetrics.mockResolvedValue(undefined);
  });

  it("respuesta directa (sin herramientas): persiste exactamente UNA métrica, turn_type direct_response", async () => {
    mockCreate.mockReturnValueOnce(textStream("Hola, ¿en qué puedo ayudarte?") as never);

    await run("hola");

    expect(mockLogAgentTurnMetrics).toHaveBeenCalledTimes(1);
    const payload = mockLogAgentTurnMetrics.mock.calls[0][1] as Record<string, unknown>;
    expect(payload.turn_type).toBe("direct_response");
    expect(payload.success).toBe(true);
    expect(payload.tools_used).toEqual([]);
    expect(payload.user_id).toBe(userId);
    expectSafePayload(payload);
  });

  it("consulta con herramientas: persiste exactamente UNA métrica, turn_type tool_query, solo nombres de herramientas", async () => {
    mockCreate
      .mockReturnValueOnce(toolCallStream("getCurrentCycle", {}) as never)
      .mockReturnValueOnce(textStream("Tu ciclo actual es octubre.") as never);

    await run("¿cuándo termina mi ciclo?");

    expect(mockGetCurrentCycle).toHaveBeenCalledTimes(1);
    expect(mockLogAgentTurnMetrics).toHaveBeenCalledTimes(1);
    const payload = mockLogAgentTurnMetrics.mock.calls[0][1] as Record<string, unknown>;
    expect(payload.turn_type).toBe("tool_query");
    expect(payload.success).toBe(true);
    expect(payload.tools_used).toEqual(["getCurrentCycle"]);
    expectSafePayload(payload);
  });

  it("bloqueo por ámbito (2.D/2.F): persiste exactamente UNA métrica, turn_type scope_blocked", async () => {
    mockCreate.mockReturnValueOnce(
      toolCallStream("searchExpenses", { query: "cuánto he gastado", search_intent: "analysis" }) as never
    );

    await run("¿cuánto he gastado?");

    expect(mockLogAgentTurnMetrics).toHaveBeenCalledTimes(1);
    const payload = mockLogAgentTurnMetrics.mock.calls[0][1] as Record<string, unknown>;
    expect(payload.turn_type).toBe("scope_blocked");
    expect(payload.success).toBe(true);
    expect(payload.tools_used).toEqual(["searchExpenses"]);
    expectSafePayload(payload);
  });

  it("propuesta de confirmación: persiste exactamente UNA métrica, turn_type confirmation_proposed, sin argumentos ni importe", async () => {
    mockCreate.mockReturnValueOnce(
      toolCallStream("createTransaction", {
        type: "expense",
        amount: 50.75,
        concept: "comida secreta con importe 50.75€ y email test@example.com",
        category: "survival",
        date: "2026-10-05",
      }) as never
    );

    await run("registra 50.75€ de comida secreta");

    expect(mockCreateTransaction).not.toHaveBeenCalled();
    expect(mockLogAgentTurnMetrics).toHaveBeenCalledTimes(1);
    const payload = mockLogAgentTurnMetrics.mock.calls[0][1] as Record<string, unknown>;
    expect(payload.turn_type).toBe("confirmation_proposed");
    expect(payload.success).toBe(true);
    expect(payload.tools_used).toEqual(["createTransaction"]);
    expectSafePayload(payload);
  });

  it("confirmación ejecutada: persiste exactamente UNA métrica, en la petición de confirmación (no en la de propuesta)", async () => {
    const pendingAction: PendingAction = {
      toolCall: {
        id: "call_1",
        type: "function",
        function: {
          name: "createTransaction",
          arguments: JSON.stringify({ type: "expense", amount: 50, concept: "comida", category: "survival" }),
        },
      },
      toolName: "createTransaction",
      arguments: { type: "expense", amount: 50, concept: "comida", category: "survival" },
      description: '¿Confirmas que quieres registrar un gasto de 50€ en survival: "comida"?',
    };
    mockConsumePendingAction.mockResolvedValue({ success: true, action: pendingAction });
    mockCreate.mockReturnValueOnce(textStream("Listo, gasto registrado.") as never);

    await run("Sí, confirmo.", "confirmation-id-1");

    expect(mockCreateTransaction).toHaveBeenCalledTimes(1);
    expect(mockLogAgentTurnMetrics).toHaveBeenCalledTimes(1);
    const payload = mockLogAgentTurnMetrics.mock.calls[0][1] as Record<string, unknown>;
    expect(payload.turn_type).toBe("confirmation_executed");
    expect(payload.success).toBe(true);
    expect(payload.tools_used).toEqual(["createTransaction"]);
    expectSafePayload(payload);
  });

  it("confirmación inválida/caducada/usada: persiste una métrica de error segura, sin ejecutar nada", async () => {
    mockConsumePendingAction.mockResolvedValue({ success: false, reason: "expired" });

    const events = await run("Sí, confirmo.", "confirmation-id-1");

    expect(mockCreateTransaction).not.toHaveBeenCalled();
    expect(events.some((e) => e.type === "error")).toBe(true);
    expect(mockLogAgentTurnMetrics).toHaveBeenCalledTimes(1);
    const payload = mockLogAgentTurnMetrics.mock.calls[0][1] as Record<string, unknown>;
    expect(payload.turn_type).toBe("error");
    expect(payload.success).toBe(false);
    expect(payload.error_message).toBe("confirmation_consume_failed:expired");
    expectSafePayload(payload);
  });

  it("error no controlado (excepción en la llamada al modelo): persiste una métrica de error segura, sin filtrar el mensaje interno", async () => {
    mockCreate.mockImplementationOnce(() => {
      throw new Error("boom: leaked secret token abc123");
    });

    const events = await run("hola");

    expect(events.some((e) => e.type === "error")).toBe(true);
    expect(mockLogAgentTurnMetrics).toHaveBeenCalledTimes(1);
    const payload = mockLogAgentTurnMetrics.mock.calls[0][1] as Record<string, unknown>;
    expect(payload.turn_type).toBe("error");
    expect(payload.success).toBe(false);
    // Nunca el mensaje de la excepción real (podría filtrar datos internos)
    // — solo el nombre/tipo de la excepción.
    expect(payload.error_message).toBe("Error");
    expect(JSON.stringify(payload)).not.toContain("leaked secret token");
    expectSafePayload(payload);
  });

  it("un fallo de la capa de métricas nunca rompe el streaming ni añade un segundo evento al cliente", async () => {
    mockLogAgentTurnMetrics.mockRejectedValueOnce(new Error("db unreachable"));
    mockCreate.mockReturnValueOnce(textStream("Hola de nuevo.") as never);

    const events = await run("hola");

    // El chat sigue funcionando con normalidad: un único "done", sin error añadido.
    expect(events.filter((e) => e.type === "done")).toHaveLength(1);
    expect(events.some((e) => e.type === "error")).toBe(false);
    expect(mockLogAgentTurnMetrics).toHaveBeenCalledTimes(1); // Se intentó, una vez.
  });

  it("un fallo de la capa de métricas nunca impide una escritura ya autorizada (confirmación ejecutada)", async () => {
    const pendingAction: PendingAction = {
      toolCall: {
        id: "call_1",
        type: "function",
        function: { name: "createTransaction", arguments: JSON.stringify({ amount: 50 }) },
      },
      toolName: "createTransaction",
      arguments: { amount: 50 },
      description: "¿Confirmas?",
    };
    mockConsumePendingAction.mockResolvedValue({ success: true, action: pendingAction });
    mockLogAgentTurnMetrics.mockRejectedValueOnce(new Error("db unreachable"));
    mockCreate.mockReturnValueOnce(textStream("Listo.") as never);

    await run("Sí, confirmo.", "confirmation-id-1");

    // La escritura ya se ejecutó ANTES de que se intentara registrar la
    // métrica — un fallo ahí no la deshace ni la repite.
    expect(mockCreateTransaction).toHaveBeenCalledTimes(1);
  });
});
