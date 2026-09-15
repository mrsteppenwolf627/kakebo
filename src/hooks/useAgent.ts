"use client";

import { useState, useCallback, useRef } from 'react';

// Tipos basados en la respuesta de la API (src/app/api/ai/agent/route.ts)
export interface AgentMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    // Metadatos opcionales del asistente
    intent?: string;
    toolsUsed?: string[];
    metrics?: {
        latencyMs: number;
        costUsd: number;
        inputTokens: number;
        outputTokens: number;
    };
}

interface UseAgentReturn {
    messages: AgentMessage[];
    isLoading: boolean;
    error: string | null;
    sendMessage: (content: string) => Promise<void>;
    clearHistory: () => void;
}

export function useAgent(): UseAgentReturn {
    const [messages, setMessages] = useState<AgentMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim()) return;

        setIsLoading(true);
        setError(null);

        // Añadir mensaje del usuario inmediatamente
        const userMsg: AgentMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            content,
            timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, userMsg]);

        try {
            // Preparar historial para la API (excluyendo el mensaje actual que enviamos en 'message')
            // La API espera: { message: string, history: Array<{role, content}> }
            const historyPayload = messages.map(m => ({
                role: m.role,
                content: m.content
            }));

            const response = await fetch('/api/ai/agent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Ensure cookies are sent for authentication
                body: JSON.stringify({
                    message: content,
                    history: historyPayload,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al comunicarse con el agente');
            }

            const data = await response.json();

            // La respuesta exitosa tiene la estructura: { success: true, data: { message, intent, toolsUsed, metrics } }
            if (data.success && data.data) {
                const agentMsg: AgentMessage = {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    content: data.data.message,
                    timestamp: Date.now(),
                    intent: data.data.intent,
                    toolsUsed: data.data.toolsUsed,
                    metrics: data.data.metrics,
                };
                setMessages((prev) => [...prev, agentMsg]);
            } else {
                throw new Error('Respuesta inválida del servidor');
            }

        } catch (err) {
            console.error('Error sending message:', err);
            setError(err instanceof Error ? err.message : 'Error desconocido');
            // Opcional: Podríamos añadir un mensaje de error visual al chat
        } finally {
            setIsLoading(false);
        }
    }, [messages]);

    const clearHistory = useCallback(() => {
        setMessages([]);
        setError(null);
    }, []);

    return {
        messages,
        isLoading,
        error,
        sendMessage,
        clearHistory,
    };
}

// ─── Streaming hook ───────────────────────────────────────────────────────────

/**
 * Status labels shown while the stream is in progress.
 */
const STATUS_LABELS: Record<string, string> = {
    thinking: "Pensando...",
    executing: "Analizando tus datos...",
};

/** Callbacks invoked for each SSE event while consuming an agent-v2 stream response. */
interface AgentStreamCallbacks {
    onThinking: () => void;
    onTools: (names: string[]) => void;
    onExecuting: () => void;
    onChunk: (text: string) => void;
    onDone: (toolsUsed: string[], metrics: AgentMessage['metrics']) => void;
    onError: (message: string) => void;
    /**
     * Fase 2.E (corrección de seguridad): el servidor envía únicamente un
     * mensaje humano + un `confirmationId` opaco — nunca la acción
     * ejecutable. Ver src/lib/agents-v2/pending-actions.ts.
     */
    onConfirmation: (request: { message: string; confirmationId: string }) => void;
}

/**
 * Reads and parses the SSE body of an agent-v2 streaming response, invoking
 * the matching callback for each event. Framework-agnostic (no React state
 * here) so it can be reused by both a fresh message and a confirmed action,
 * and unit-tested in isolation from React.
 */
async function consumeAgentSSEStream(
    response: Response,
    callbacks: AgentStreamCallbacks
): Promise<void> {
    if (!response.body) {
        throw new Error('La respuesta del servidor no incluye un stream');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Accumulate raw bytes into buffer
        buffer += decoder.decode(value, { stream: true });

        // Split on double-newline (SSE event boundary)
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? ''; // Keep trailing incomplete event

        for (const part of parts) {
            for (const line of part.split('\n')) {
                if (!line.startsWith('data: ')) continue;
                const jsonStr = line.slice(6).trim();
                if (!jsonStr) continue;

                let event: Record<string, unknown>;
                try {
                    event = JSON.parse(jsonStr);
                } catch {
                    continue; // Ignore malformed events
                }

                switch (event.type) {
                    case 'thinking':
                        callbacks.onThinking();
                        break;

                    case 'tools':
                        callbacks.onTools((event.names as string[]) ?? []);
                        break;

                    case 'executing':
                        callbacks.onExecuting();
                        break;

                    case 'chunk':
                        callbacks.onChunk((event.text as string) ?? '');
                        break;

                    case 'done':
                        callbacks.onDone(
                            (event.toolsUsed as string[]) ?? [],
                            event.metrics as AgentMessage['metrics']
                        );
                        break;

                    case 'error':
                        callbacks.onError((event.message as string) ?? 'Error desconocido');
                        break;

                    case 'confirmation': {
                        const req = event.request as
                            | { message: string; confirmationId: string }
                            | undefined;
                        if (req?.message && req.confirmationId) {
                            callbacks.onConfirmation(req);
                        }
                        break;
                    }
                }
            }
        }
    }
}

export interface UseAgentStreamReturn {
    messages: AgentMessage[];
    isLoading: boolean;
    /** Partial text being streamed in real-time (empty when not streaming). */
    streamingContent: string;
    /** Current status label ("Pensando...", "Consultando herramientas...", etc.) */
    streamingStatus: string;
    error: string | null;
    sendMessage: (content: string) => Promise<void>;
    clearHistory: () => void;
    /**
     * Fase 2.E (corrección de seguridad): identificador OPACO de la
     * escritura de IA propuesta y pendiente de confirmación del usuario
     * (popup). `null` cuando no hay ninguna confirmación pendiente. Nunca
     * es la acción ejecutable — esa queda solo en servidor
     * (public.ai_pending_actions) y se resuelve una única vez al confirmar
     * con este mismo id. Nunca se muestra en texto visible del chat.
     */
    pendingConfirmationId: string | null;
    /** Mensaje explicativo asociado a `pendingConfirmationId` (para el popup). */
    pendingActionMessage: string | null;
    /**
     * Reenvía ÚNICAMENTE `pendingConfirmationId` al servidor, que lo
     * consume de forma atómica y ejecuta la acción asociada UNA sola vez.
     * Limpia `pendingConfirmationId` de forma síncrona (antes de cualquier
     * `await`) para que un doble clic no dispare un segundo fetch — pero la
     * ejecución de un solo uso ya está garantizada en servidor
     * independientemente de esto. No hace nada si no hay ninguna
     * confirmación pendiente o si ya hay una acción en curso.
     */
    confirmAction: () => Promise<void>;
    /**
     * Cancela la confirmación pendiente EN SERVIDOR (invalida la fila antes
     * de poder ejecutarse). Solo se limpia `pendingConfirmationId` — y se
     * informa al usuario de que se canceló — si el servidor confirma la
     * cancelación. Si la petición falla (red u otro motivo), el popup se
     * mantiene y `cancelError` se rellena: la interfaz nunca debe dar la
     * acción por cancelada sin que el servidor lo haya confirmado.
     */
    cancelAction: () => Promise<void>;
    /** Error de la última cancelación fallida (`null` si no hay ninguno). */
    cancelError: string | null;
    /** `true` mientras `confirmAction`/`cancelAction` tienen una petición en curso. */
    isActionPending: boolean;
}

/**
 * Like useAgent but uses the streaming endpoint (/api/ai/agent-v2/stream).
 *
 * Reads SSE events and updates state incrementally:
 *   - During processing: streamingStatus shows current phase
 *   - During synthesis: streamingContent grows token by token
 *   - On done: full message added to messages, streaming state cleared
 *   - On confirmation (Fase 2.E): pendingAction is stored (not shown as a
 *     plain chat bubble) so the UI can render a real confirm/cancel popup
 *     and reliably resend the exact same tool call if the user confirms.
 */
export function useAgentStream(): UseAgentStreamReturn {
    const [messages, setMessages] = useState<AgentMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [streamingContent, setStreamingContent] = useState('');
    const [streamingStatus, setStreamingStatus] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [pendingConfirmationId, setPendingConfirmationIdState] = useState<string | null>(null);
    const [pendingActionMessage, setPendingActionMessage] = useState<string | null>(null);
    const [cancelError, setCancelError] = useState<string | null>(null);
    const [isActionPending, setIsActionPending] = useState(false);

    // Use refs to accumulate content / track the pending confirmation id
    // without stale closure issues, and to guarantee confirm/cancel can
    // only fire one request even if invoked twice synchronously (double
    // click) before React has a chance to re-render.
    const accumulatedRef = useRef('');
    const pendingConfirmationIdRef = useRef<string | null>(null);
    const actionInFlightRef = useRef(false);

    const setPendingConfirmation = useCallback(
        (confirmationId: string | null, message: string | null) => {
            pendingConfirmationIdRef.current = confirmationId;
            setPendingConfirmationIdState(confirmationId);
            setPendingActionMessage(message);
        },
        []
    );

    const runStream = useCallback(
        async (
            requestBody: {
                message: string;
                history: Array<{ role: 'user' | 'assistant'; content: string }>;
                confirmationId?: string;
            }
        ) => {
            setIsLoading(true);
            setError(null);
            setStreamingContent('');
            setStreamingStatus('');
            accumulatedRef.current = '';
            // Fase 2.E: cuando el servidor propone una escritura, emite
            // "confirmation" seguido siempre de un "done" vacío (sin chunk,
            // toolsUsed: []) para cerrar el turno de streaming. Ese "done" no
            // debe añadir una burbuja de chat — la UI ya muestra el popup de
            // confirmación con el mensaje real. Sin esta bandera, cada
            // propuesta de escritura iría acompañada de un falso mensaje de
            // error ("No pude generar una respuesta.").
            let confirmationRequestedThisTurn = false;

            try {
                const response = await fetch('/api/ai/agent-v2/stream', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(requestBody),
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.error || 'Error al comunicarse con el agente');
                }

                await consumeAgentSSEStream(response, {
                    onThinking: () => setStreamingStatus(STATUS_LABELS.thinking),
                    onTools: (names) =>
                        setStreamingStatus(
                            names.length > 0
                                ? `Consultando: ${names.join(', ')}`
                                : 'Consultando herramientas...'
                        ),
                    onExecuting: () => setStreamingStatus(STATUS_LABELS.executing),
                    onChunk: (text) => {
                        accumulatedRef.current += text;
                        setStreamingContent(accumulatedRef.current);
                        setStreamingStatus(''); // Hide status when text starts flowing
                    },
                    onDone: (toolsUsed, metrics) => {
                        setStreamingContent('');
                        setStreamingStatus('');
                        setIsLoading(false);

                        if (confirmationRequestedThisTurn) {
                            // El popup de confirmación ya muestra el mensaje
                            // real; este "done" solo cierra el turno.
                            accumulatedRef.current = '';
                            return;
                        }

                        const finalContent = accumulatedRef.current;
                        const assistantMsg: AgentMessage = {
                            id: crypto.randomUUID(),
                            role: 'assistant',
                            content: finalContent || 'No pude generar una respuesta.',
                            timestamp: Date.now(),
                            toolsUsed,
                            metrics,
                        };
                        setMessages((prev) => [...prev, assistantMsg]);
                        accumulatedRef.current = '';
                    },
                    onError: (message) => {
                        setError(message);
                        setStreamingContent('');
                        setStreamingStatus('');
                        accumulatedRef.current = '';
                        setIsLoading(false);
                    },
                    onConfirmation: (req) => {
                        // Fase 2.E (corrección de seguridad): se conserva
                        // SOLO el confirmationId opaco (no la acción
                        // ejecutable) para poder reenviarlo tal cual si el
                        // usuario confirma. No se añade como mensaje de
                        // chat — la UI muestra un popup dedicado.
                        confirmationRequestedThisTurn = true;
                        setPendingConfirmation(req.confirmationId, req.message);
                    },
                });
            } catch (err) {
                console.error('Stream error:', err);
                setError(err instanceof Error ? err.message : 'Error desconocido');
                setStreamingContent('');
                setStreamingStatus('');
                accumulatedRef.current = '';
            } finally {
                setIsLoading(false);
            }
        },
        [setPendingConfirmation]
    );

    const sendMessage = useCallback(
        async (content: string) => {
            if (!content.trim()) return;

            const userMsg: AgentMessage = {
                id: crypto.randomUUID(),
                role: 'user',
                content,
                timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, userMsg]);

            const historySnapshot = messages.map((m) => ({
                role: m.role,
                content: m.content,
            }));

            await runStream({ message: content, history: historySnapshot });
        },
        [messages, runStream]
    );

    const confirmAction = useCallback(async () => {
        // Guard against a double click (or any re-invocation) firing a
        // second fetch: check-and-set synchronously, before any `await`,
        // using a ref (not React state, which only updates on the next
        // render). The actual one-shot guarantee lives server-side (atomic
        // consume of confirmationId) — this only avoids a redundant request
        // from this tab.
        if (actionInFlightRef.current) return;
        const confirmationId = pendingConfirmationIdRef.current;
        if (!confirmationId) return;

        actionInFlightRef.current = true;
        setIsActionPending(true);
        setCancelError(null);
        setPendingConfirmation(null, null); // Popup disappears immediately.

        const confirmText = 'Sí, confirmo.';
        const userMsg: AgentMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            content: confirmText,
            timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, userMsg]);

        const historySnapshot = messages.map((m) => ({
            role: m.role,
            content: m.content,
        }));

        try {
            await runStream({
                message: confirmText,
                history: historySnapshot,
                confirmationId,
            });
        } finally {
            actionInFlightRef.current = false;
            setIsActionPending(false);
        }
    }, [messages, runStream, setPendingConfirmation]);

    const cancelAction = useCallback(async () => {
        if (actionInFlightRef.current) return;
        const confirmationId = pendingConfirmationIdRef.current;
        if (!confirmationId) return;

        actionInFlightRef.current = true;
        setIsActionPending(true);
        setCancelError(null);

        try {
            const response = await fetch('/api/ai/agent-v2/cancel-confirmation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ confirmationId }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(
                    errData?.error?.message || 'No se ha podido cancelar. Inténtalo de nuevo.'
                );
            }

            // Solo ahora, con la confirmación del servidor de que la fila
            // quedó invalidada, es seguro decir que se canceló.
            setPendingConfirmation(null, null);
            setMessages((prev) => [
                ...prev,
                {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    content: 'De acuerdo, no he realizado ningún cambio.',
                    timestamp: Date.now(),
                    toolsUsed: [],
                },
            ]);
        } catch (err) {
            // Fase 2.E: si la cancelación falla (red u otro motivo), NO se
            // presenta como cancelada con éxito — el popup se mantiene y se
            // informa del problema para que el usuario pueda reintentar.
            console.error('Cancel confirmation error:', err);
            setCancelError(
                err instanceof Error ? err.message : 'No se ha podido cancelar. Inténtalo de nuevo.'
            );
        } finally {
            actionInFlightRef.current = false;
            setIsActionPending(false);
        }
    }, [setPendingConfirmation]);

    const clearHistory = useCallback(() => {
        setMessages([]);
        setStreamingContent('');
        setStreamingStatus('');
        setError(null);
        setCancelError(null);
        accumulatedRef.current = '';
        setPendingConfirmation(null, null);
    }, [setPendingConfirmation]);

    return {
        messages,
        isLoading,
        streamingContent,
        streamingStatus,
        error,
        sendMessage,
        clearHistory,
        pendingConfirmationId,
        pendingActionMessage,
        confirmAction,
        cancelAction,
        cancelError,
        isActionPending,
    };
}
