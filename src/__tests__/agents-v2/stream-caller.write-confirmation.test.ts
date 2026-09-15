import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Fase 2.E (corrección de seguridad): confirmación de escrituras de IA en
 * el flujo REALMENTE activo (processFunctionCallingStream), ahora de un
 * solo uso y validada en servidor mediante un `confirmationId` opaco
 * (public.ai_pending_actions, ver src/lib/agents-v2/pending-actions.ts).
 * Verifica que:
 * - la preferencia PERSISTENTE por usuario decide si se pide confirmación;
 * - con la preferencia activada, una propuesta de escritura NUNCA ejecuta
 *   la tool en el mismo turno — solo persiste la acción en servidor y
 *   emite {message, confirmationId} (nunca la acción ejecutable);
 * - con la preferencia desactivada, la escritura se ejecuta directamente;
 * - el interruptor global ENABLE_WRITE_CONFIRMATION="false" desactiva la
 *   confirmación para todos, pase lo que pase con la preferencia individual;
 * - un confirmationId válido consume la fila en servidor y ejecuta la tool
 *   EXACTAMENTE una vez;
 * - un confirmationId ya usado/cancelado/caducado/ajeno falla sin ejecutar
 *   nada, y el servidor NUNCA acepta una acción arbitraria del cliente.
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

vi.mock("@/lib/agents/tools/create-transaction", () => ({
  createTransaction: vi.fn(async () => ({
    success: true,
    transactionId: "expense-created-1",
    type: "expense",
    amount: 50,
    concept: "comida",
    category: "survival",
    date: "2026-10-05",
    message: "✅ Gasto de 50€ registrado en survival: \"comida\"",
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

import { openai } from "@/lib/ai/client";
import { createTransaction } from "@/lib/agents/tools/create-transaction";
import { getAiConfirmWritesPreference } from "@/lib/agents-v2/user-write-confirmation";
import { processFunctionCallingStream, type StreamEvent } from "@/lib/agents-v2/stream-caller";
import type { PendingAction } from "@/lib/agents-v2/types";

const mockCreate = vi.mocked(openai.chat.completions.create);
const mockCreateTransaction = vi.mocked(createTransaction);
const mockGetPreference = vi.mocked(getAiConfirmWritesPreference);

const mockSupabase = {} as SupabaseClient;
const userId = "user-123";

const CREATE_TX_ARGS = {
  type: "expense",
  amount: 50,
  concept: "comida",
  category: "survival",
  date: "2026-10-05",
};

const RESOLVED_PENDING_ACTION: PendingAction = {
  toolCall: {
    id: "call_1",
    type: "function",
    function: { name: "createTransaction", arguments: JSON.stringify(CREATE_TX_ARGS) },
  },
  toolName: "createTransaction",
  arguments: CREATE_TX_ARGS,
  description: '¿Confirmas que quieres registrar un gasto de 50€ en survival: "comida"?',
};

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

/** Runs a turn where the model proposes a tool call (no confirmationId). */
async function runProposal(userMessage: string, toolName: string, args: Record<string, unknown>) {
  mockCreate
    .mockReturnValueOnce(toolCallStream(toolName, args) as never)
    .mockReturnValueOnce(textStream("Listo.") as never);

  const events: StreamEvent[] = [];
  await processFunctionCallingStream(userMessage, [], mockSupabase, userId, (event) => events.push(event));
  return events;
}

/** Runs a turn where the client sends back a confirmationId (confirmed-write path). */
async function runConfirmed(confirmationId: string) {
  mockCreate.mockReturnValueOnce(textStream("Listo, gasto registrado.") as never);

  const events: StreamEvent[] = [];
  await processFunctionCallingStream(
    "Sí, confirmo.",
    [],
    mockSupabase,
    userId,
    (event) => events.push(event),
    confirmationId
  );
  return events;
}

function confirmationEventOf(events: StreamEvent[]) {
  return events.find((e) => e.type === "confirmation") as Extract<StreamEvent, { type: "confirmation" }> | undefined;
}

function errorEventOf(events: StreamEvent[]) {
  return events.find((e) => e.type === "error") as Extract<StreamEvent, { type: "error" }> | undefined;
}

describe("processFunctionCallingStream — confirmación de escrituras de un solo uso, validada en servidor (Fase 2.E)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockReset();
    mockGetPreference.mockResolvedValue(true);
    mockCreatePendingAction.mockResolvedValue("confirmation-id-1");
    mockConsumePendingAction.mockResolvedValue({ success: true, action: RESOLVED_PENDING_ACTION });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("preferencia activada: persiste la acción en servidor y solo envía {message, confirmationId} — nunca la acción ejecutable ni ejecuta nada", async () => {
    const events = await runProposal("registra 50€ de comida", "createTransaction", CREATE_TX_ARGS);

    expect(mockCreateTransaction).not.toHaveBeenCalled();
    expect(mockCreatePendingAction).toHaveBeenCalledTimes(1);
    // Fase 2.E (corrección de seguridad): stream-caller NUNCA reenvía su
    // cliente de sesión (`supabase`) a createPendingAction — la firma es
    // (userId, action), sin cliente. El acceso admin-only vive dentro de
    // pending-actions.ts (ver pending-actions.test.ts).
    expect(mockCreatePendingAction).toHaveBeenCalledWith(
      userId,
      expect.objectContaining({ toolName: "createTransaction" })
    );
    expect(mockCreatePendingAction.mock.calls[0]).not.toContain(mockSupabase);

    const confirmation = confirmationEventOf(events);
    expect(confirmation).toBeDefined();
    expect(confirmation?.request.message).toContain("50€");
    expect(confirmation?.request.confirmationId).toBe("confirmation-id-1");
    // Nunca se envía la acción ejecutable ni el tool_call al cliente.
    expect(confirmation?.request).not.toHaveProperty("pendingAction");
    expect(confirmation?.request).not.toHaveProperty("toolCall");
    expect(confirmation?.request).not.toHaveProperty("arguments");

    const doneEvent = events.find((e) => e.type === "done") as Extract<StreamEvent, { type: "done" }>;
    expect(doneEvent.toolsUsed).toEqual([]);
  });

  it("si persistir la confirmación falla, falla cerrado: no ejecuta nada y emite error (no confirmation)", async () => {
    mockCreatePendingAction.mockResolvedValueOnce(null);

    const events = await runProposal("registra 50€ de comida", "createTransaction", CREATE_TX_ARGS);

    expect(mockCreateTransaction).not.toHaveBeenCalled();
    expect(confirmationEventOf(events)).toBeUndefined();
    expect(errorEventOf(events)).toBeDefined();
  });

  it("preferencia desactivada por el usuario: ejecuta la escritura directamente, sin popup ni fila pendiente", async () => {
    mockGetPreference.mockResolvedValue(false);

    const events = await runProposal("registra 50€ de comida", "createTransaction", CREATE_TX_ARGS);

    expect(confirmationEventOf(events)).toBeUndefined();
    expect(mockCreatePendingAction).not.toHaveBeenCalled();
    expect(mockCreateTransaction).toHaveBeenCalledTimes(1);
    const doneEvent = events.find((e) => e.type === "done") as Extract<StreamEvent, { type: "done" }>;
    expect(doneEvent.toolsUsed).toEqual(["createTransaction"]);
  });

  it("interruptor global ENABLE_WRITE_CONFIRMATION=false desactiva la confirmación para todos, aunque la preferencia individual esté activada", async () => {
    vi.stubEnv("ENABLE_WRITE_CONFIRMATION", "false");
    mockGetPreference.mockResolvedValue(true);

    const events = await runProposal("registra 50€ de comida", "createTransaction", CREATE_TX_ARGS);

    expect(confirmationEventOf(events)).toBeUndefined();
    expect(mockCreatePendingAction).not.toHaveBeenCalled();
    expect(mockCreateTransaction).toHaveBeenCalledTimes(1);
    expect(mockGetPreference).not.toHaveBeenCalled();
  });

  it("confirmationId válido: consume la acción en servidor y ejecuta la tool EXACTAMENTE una vez, sin volver a pedir confirmación", async () => {
    const events = await runConfirmed("confirmation-id-1");

    // Idem: consumePendingAction se llama solo con (userId, confirmationId),
    // nunca con el cliente de sesión del stream.
    expect(mockConsumePendingAction).toHaveBeenCalledWith(userId, "confirmation-id-1");
    expect(mockConsumePendingAction.mock.calls[0]).not.toContain(mockSupabase);
    expect(confirmationEventOf(events)).toBeUndefined();
    expect(mockCreateTransaction).toHaveBeenCalledTimes(1);
    const doneEvent = events.find((e) => e.type === "done") as Extract<StreamEvent, { type: "done" }>;
    expect(doneEvent.toolsUsed).toEqual(["createTransaction"]);
  });

  it("dos confirmaciones concurrentes del mismo confirmationId: la atomicidad del consumo real está en pending-actions.ts — aquí se verifica que stream-caller solo ejecuta cuando consumePendingAction devuelve success", async () => {
    // Simula la segunda petición (la que llega después de que la primera ya
    // consumió la fila): consumePendingAction devuelve success:false.
    mockConsumePendingAction.mockResolvedValueOnce({ success: false, reason: "used" });

    const events = await runConfirmed("confirmation-id-1");

    expect(mockCreateTransaction).not.toHaveBeenCalled();
    expect(errorEventOf(events)?.message).toMatch(/ya se confirmó/i);
  });

  it("repetición posterior con el mismo id ya usado: cero ejecuciones adicionales", async () => {
    mockConsumePendingAction.mockResolvedValueOnce({ success: false, reason: "used" });

    const events = await runConfirmed("confirmation-id-1");

    expect(mockCreateTransaction).not.toHaveBeenCalled();
    expect(errorEventOf(events)).toBeDefined();
  });

  it("confirmationId cancelado: falla sin ejecutar nada", async () => {
    mockConsumePendingAction.mockResolvedValueOnce({ success: false, reason: "cancelled" });

    const events = await runConfirmed("confirmation-id-1");

    expect(mockCreateTransaction).not.toHaveBeenCalled();
    expect(errorEventOf(events)?.message).toMatch(/cancelad/i);
  });

  it("confirmationId caducado: falla sin ejecutar nada", async () => {
    mockConsumePendingAction.mockResolvedValueOnce({ success: false, reason: "expired" });

    const events = await runConfirmed("confirmation-id-1");

    expect(mockCreateTransaction).not.toHaveBeenCalled();
    expect(errorEventOf(events)?.message).toMatch(/caducado/i);
  });

  it("confirmationId de otro usuario (o inexistente): falla sin ejecutar nada, sin filtrar el motivo", async () => {
    mockConsumePendingAction.mockResolvedValueOnce({ success: false, reason: "not_found" });

    const events = await runConfirmed("someone-elses-confirmation-id");

    expect(mockCreateTransaction).not.toHaveBeenCalled();
    expect(errorEventOf(events)).toBeDefined();
  });

  it("no consulta la preferencia de confirmación para tools de solo lectura (no aplica a análisis/búsqueda)", async () => {
    await runProposal("¿cuándo termina mi ciclo?", "getCurrentCycle", {});

    expect(mockGetPreference).not.toHaveBeenCalled();
    expect(mockCreatePendingAction).not.toHaveBeenCalled();
  });
});
