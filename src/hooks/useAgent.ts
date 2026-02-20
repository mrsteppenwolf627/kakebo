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
}

/**
 * Like useAgent but uses the streaming endpoint (/api/ai/agent-v2/stream).
 *
 * Reads SSE events and updates state incrementally:
 *   - During processing: streamingStatus shows current phase
 *   - During synthesis: streamingContent grows token by token
 *   - On done: full message added to messages, streaming state cleared
 */
export function useAgentStream(): UseAgentStreamReturn {
    const [messages, setMessages] = useState<AgentMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [streamingContent, setStreamingContent] = useState('');
    const [streamingStatus, setStreamingStatus] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Use a ref to accumulate content without stale closure issues
    const accumulatedRef = useRef('');

    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim()) return;

        setIsLoading(true);
        setError(null);
        setStreamingContent('');
        setStreamingStatus('');
        accumulatedRef.current = '';

        // Add user message immediately
        const userMsg: AgentMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            content,
            timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, userMsg]);

        // Prepare history (excluding the current message)
        const historySnapshot = messages.map((m) => ({
            role: m.role,
            content: m.content,
        }));

        try {
            const response = await fetch('/api/ai/agent-v2/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    message: content,
                    history: historySnapshot,
                }),
            });

            if (!response.ok || !response.body) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || 'Error al comunicarse con el agente');
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
                                setStreamingStatus(STATUS_LABELS.thinking);
                                break;

                            case 'tools': {
                                const names = (event.names as string[]) ?? [];
                                setStreamingStatus(
                                    names.length > 0
                                        ? `Consultando: ${names.join(', ')}`
                                        : 'Consultando herramientas...'
                                );
                                break;
                            }

                            case 'executing':
                                setStreamingStatus(STATUS_LABELS.executing);
                                break;

                            case 'chunk': {
                                const text = (event.text as string) ?? '';
                                accumulatedRef.current += text;
                                setStreamingContent(accumulatedRef.current);
                                setStreamingStatus(''); // Hide status when text starts flowing
                                break;
                            }

                            case 'done': {
                                const toolsUsed = (event.toolsUsed as string[]) ?? [];
                                const metrics = event.metrics as AgentMessage['metrics'];
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
                                setStreamingContent('');
                                setStreamingStatus('');
                                accumulatedRef.current = '';
                                setIsLoading(false);
                                break;
                            }

                            case 'error':
                                setError((event.message as string) ?? 'Error desconocido');
                                setStreamingContent('');
                                setStreamingStatus('');
                                accumulatedRef.current = '';
                                setIsLoading(false);
                                break;

                            // 'confirmation' events are forwarded as a regular message
                            // so the user sees the confirmation question in the chat
                            case 'confirmation': {
                                const req = event.request as { message: string } | undefined;
                                if (req?.message) {
                                    const confirmMsg: AgentMessage = {
                                        id: crypto.randomUUID(),
                                        role: 'assistant',
                                        content: req.message,
                                        timestamp: Date.now(),
                                        toolsUsed: [],
                                    };
                                    setMessages((prev) => [...prev, confirmMsg]);
                                }
                                break;
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Stream error:', err);
            setError(err instanceof Error ? err.message : 'Error desconocido');
            setStreamingContent('');
            setStreamingStatus('');
            accumulatedRef.current = '';
        } finally {
            setIsLoading(false);
        }
    }, [messages]);

    const clearHistory = useCallback(() => {
        setMessages([]);
        setStreamingContent('');
        setStreamingStatus('');
        setError(null);
        accumulatedRef.current = '';
    }, []);

    return {
        messages,
        isLoading,
        streamingContent,
        streamingStatus,
        error,
        sendMessage,
        clearHistory,
    };
}
