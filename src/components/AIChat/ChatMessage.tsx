import React from 'react';
import { AgentMessage } from '@/hooks/useAgent';
// Usaremos iconos de lucide-react si están disponibles, o texto simple por ahora
// import { Bot, User, Cpu, AlertCircle } from 'lucide-react'; 

interface ChatMessageProps {
    message: AgentMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
    const isUser = message.role === 'user';

    return (
        <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${isUser
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none'
                    }`}
            >
                <div className="flex items-start gap-3">
                    {/* Avatar (opcional) */}
                    {!isUser && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
                            AI
                        </div>
                    )}

                    <div className="flex-1 overflow-hidden">
                        {/* Header del mensaje (opcional para mostrar herramientas) */}
                        {!isUser && message.toolsUsed && message.toolsUsed.length > 0 && (
                            <div className="mb-2 flex flex-wrap gap-1">
                                {message.toolsUsed.map((tool) => (
                                    <span
                                        key={tool}
                                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
                                    >
                                        🛠️ {tool}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Contenido (soporte básico para saltos de línea) */}
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                            {message.content}
                        </div>

                        {/* Footer con métricas (solo para dev/debug o si el usuario quiere ver detalles) */}
                        {!isUser && message.metrics && (
                            <div className="mt-3 pt-2 border-t border-gray-100 flex items-center gap-3 text-[10px] text-gray-400">
                                <span>⏱️ {message.metrics.latencyMs}ms</span>
                                <span>💰 ${message.metrics.costUsd?.toFixed(5)}</span>
                                {message.intent && <span>🎯 {message.intent}</span>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
