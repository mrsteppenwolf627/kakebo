"use client";

import { useState, useCallback } from 'react';

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
