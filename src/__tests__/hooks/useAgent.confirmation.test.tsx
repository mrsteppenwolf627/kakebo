import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAgentStream } from "@/hooks/useAgent";

/**
 * Fase 2.E (corrección de seguridad): pruebas del flujo real de
 * confirmación de escrituras de IA en el hook que consume el streaming del
 * chat activo (agent-v2). El cliente solo envía/recibe un `confirmationId`
 * opaco — nunca la acción ejecutable — y "Cancelar" ahora llama al
 * servidor (POST /api/ai/agent-v2/cancel-confirmation) en vez de ser
 * puramente local.
 */

function sseResponse(events: Array<Record<string, unknown>>): Response {
  const body = events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join("");
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(body));
      controller.close();
    },
  });
  return new Response(stream, { status: 200, headers: { "Content-Type": "text/event-stream" } });
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const CONFIRMATION_ID = "11111111-1111-4111-8111-111111111111";
const CONFIRMATION_MESSAGE = '¿Confirmas que quieres registrar un gasto de 50€ en survival: "comida"?';

const CONFIRMATION_EVENTS = [
  { type: "thinking" },
  { type: "tools", names: ["createTransaction"] },
  {
    type: "confirmation",
    request: {
      message: CONFIRMATION_MESSAGE,
      confirmationId: CONFIRMATION_ID,
      requiresConfirmation: true,
    },
  },
  { type: "done", toolsUsed: [], metrics: { latencyMs: 10, costUsd: 0, inputTokens: 1, outputTokens: 1 } },
];

function doneEvents(text: string, toolsUsed: string[] = ["createTransaction"]) {
  return [
    { type: "thinking" },
    { type: "chunk", text },
    { type: "done", toolsUsed, metrics: { latencyMs: 10, costUsd: 0, inputTokens: 1, outputTokens: 1 } },
  ];
}

describe("useAgentStream — confirmación de escrituras de un solo uso, validada en servidor (Fase 2.E)", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("una propuesta de escritura guarda solo el confirmationId + mensaje — nunca una acción ejecutable — y no ejecuta nada hasta confirmar", async () => {
    fetchMock.mockResolvedValueOnce(sseResponse(CONFIRMATION_EVENTS));

    const { result } = renderHook(() => useAgentStream());

    await act(async () => {
      await result.current.sendMessage("registra 50€ de comida");
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.pendingConfirmationId).toBe(CONFIRMATION_ID);
    expect(result.current.pendingActionMessage).toBe(CONFIRMATION_MESSAGE);
    expect(result.current.messages.some((m) => m.role === "assistant")).toBe(false);
  });

  it("Confirmar reenvía ÚNICAMENTE el confirmationId (nunca la acción completa) y ejecuta la operación una sola vez", async () => {
    fetchMock
      .mockResolvedValueOnce(sseResponse(CONFIRMATION_EVENTS))
      .mockResolvedValueOnce(sseResponse(doneEvents("✅ Gasto de 50€ registrado.")));

    const { result } = renderHook(() => useAgentStream());

    await act(async () => {
      await result.current.sendMessage("registra 50€ de comida");
    });
    expect(result.current.pendingConfirmationId).not.toBeNull();

    await act(async () => {
      await result.current.confirmAction();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const secondCallBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(secondCallBody.confirmationId).toBe(CONFIRMATION_ID);
    // El cliente nunca envía la acción ejecutable, ni siquiera bajo otro nombre.
    expect(secondCallBody).not.toHaveProperty("confirmedAction");
    expect(secondCallBody).not.toHaveProperty("pendingAction");
    expect(secondCallBody).not.toHaveProperty("toolCall");

    expect(result.current.pendingConfirmationId).toBeNull();
    expect(result.current.messages.some((m) => m.content.includes("registrado"))).toBe(true);
  });

  it("doble confirmación (doble clic) no dispara un segundo fetch desde el cliente", async () => {
    let resolveSecond!: (r: Response) => void;
    fetchMock
      .mockResolvedValueOnce(sseResponse(CONFIRMATION_EVENTS))
      .mockReturnValueOnce(
        new Promise<Response>((resolve) => {
          resolveSecond = resolve;
        })
      );

    const { result } = renderHook(() => useAgentStream());

    await act(async () => {
      await result.current.sendMessage("registra 50€ de comida");
    });

    let firstCall!: Promise<void>;
    let secondCall!: Promise<void>;
    act(() => {
      firstCall = result.current.confirmAction();
      secondCall = result.current.confirmAction();
    });

    resolveSecond(sseResponse(doneEvents("✅ Gasto registrado.")));
    await act(async () => {
      await Promise.all([firstCall, secondCall]);
    });

    // Solo 1 (propuesta) + 1 (confirmación) = 2 llamadas totales, nunca 3.
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("Cancelar llama al servidor; si tiene éxito, limpia el estado y no queda ninguna escritura", async () => {
    fetchMock
      .mockResolvedValueOnce(sseResponse(CONFIRMATION_EVENTS))
      .mockResolvedValueOnce(jsonResponse({ success: true, data: { cancelled: true } }));

    const { result } = renderHook(() => useAgentStream());

    await act(async () => {
      await result.current.sendMessage("registra 50€ de comida");
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.cancelAction();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const cancelCall = fetchMock.mock.calls[1];
    expect(cancelCall[0]).toBe("/api/ai/agent-v2/cancel-confirmation");
    expect(JSON.parse(cancelCall[1].body)).toEqual({ confirmationId: CONFIRMATION_ID });

    expect(result.current.pendingConfirmationId).toBeNull();
    expect(result.current.cancelError).toBeNull();
    expect(
      result.current.messages.some((m) => m.role === "assistant" && m.content.includes("no he realizado"))
    ).toBe(true);
  });

  it("Cancelar: si la petición de red falla, NO se presenta como cancelada con éxito — el popup se mantiene y se informa del error", async () => {
    fetchMock
      .mockResolvedValueOnce(sseResponse(CONFIRMATION_EVENTS))
      .mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useAgentStream());

    await act(async () => {
      await result.current.sendMessage("registra 50€ de comida");
    });

    await act(async () => {
      await result.current.cancelAction();
    });

    // El popup sigue activo: nunca se dio la cancelación por buena.
    expect(result.current.pendingConfirmationId).toBe(CONFIRMATION_ID);
    expect(result.current.cancelError).toBeTruthy();
    expect(
      result.current.messages.some((m) => m.content.includes("no he realizado"))
    ).toBe(false);
  });

  it("Cancelar: si el servidor responde que ya no se puede cancelar (409), tampoco se presenta como cancelada con éxito", async () => {
    fetchMock
      .mockResolvedValueOnce(sseResponse(CONFIRMATION_EVENTS))
      .mockResolvedValueOnce(
        jsonResponse({ success: false, error: { code: "CONFLICT", message: "Ya se confirmó." } }, 409)
      );

    const { result } = renderHook(() => useAgentStream());

    await act(async () => {
      await result.current.sendMessage("registra 50€ de comida");
    });

    await act(async () => {
      await result.current.cancelAction();
    });

    expect(result.current.pendingConfirmationId).toBe(CONFIRMATION_ID);
    expect(result.current.cancelError).toBeTruthy();
  });

  it("cuando el servidor no emite 'confirmation' (ajuste desactivado o análisis), no hay popup y el mensaje llega directo", async () => {
    fetchMock.mockResolvedValueOnce(sseResponse(doneEvents("Has gastado 120€ este ciclo.", [])));

    const { result } = renderHook(() => useAgentStream());

    await act(async () => {
      await result.current.sendMessage("¿cuánto he gastado?");
    });

    expect(result.current.pendingConfirmationId).toBeNull();
    expect(result.current.pendingActionMessage).toBeNull();
    expect(result.current.messages.some((m) => m.content.includes("120€"))).toBe(true);
  });

  it("clearHistory también limpia una confirmación pendiente", async () => {
    fetchMock.mockResolvedValueOnce(sseResponse(CONFIRMATION_EVENTS));

    const { result } = renderHook(() => useAgentStream());

    await act(async () => {
      await result.current.sendMessage("registra 50€ de comida");
    });
    expect(result.current.pendingConfirmationId).not.toBeNull();

    act(() => {
      result.current.clearHistory();
    });

    expect(result.current.pendingConfirmationId).toBeNull();
    expect(result.current.messages).toEqual([]);
  });
});
