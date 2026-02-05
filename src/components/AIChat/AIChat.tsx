"use client";

import React, { useRef, useEffect, useState } from 'react';
import { useAgent } from '@/hooks/useAgent';
import { ChatMessage } from './ChatMessage';

export function AIChat() {
    const { messages, isLoading, error, sendMessage, clearHistory } = useAgent();
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll al fondo cuando llegan nuevos mensajes
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const text = inputValue;
        setInputValue(''); // Limpiar input inmediatamente
        await sendMessage(text);
    };

    return (
        <div className="flex flex-col h-[600px] w-full max-w-4xl mx-auto bg-gray-50 rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-white border-b border-gray-200 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800">Asistente Financiero Kakebo</h2>
                    <p className="text-xs text-gray-500">Potenciado por OpenAI GPT-4o-mini & Agentes</p>
                </div>
                <button
                    onClick={clearHistory}
                    className="text-xs text-gray-500 hover:text-red-500 transition-colors px-3 py-1 rounded-md hover:bg-gray-100"
                >
                    Borrar chat
                </button>
            </div>

            {/* Área de mensajes */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 && (
                    <div className="flex bg-white flex-col h-full items-center justify-center text-gray-400 space-y-4 p-8 rounded-lg border border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-2">
                            <span className="text-3xl">🤖</span>
                        </div>
                        <p className="font-medium text-gray-600">¡Hola! Soy tu asistente Kakebo.</p>
                        <p className="text-sm text-center max-w-md">
                            Puedo ayudarte a analizar tus gastos, revisar tu presupuesto
                            o responder preguntas sobre tus finanzas.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full max-w-md mt-4">
                            <button
                                onClick={() => sendMessage("¿Cuánto he gastado este mes en total?")}
                                className="p-3 text-xs bg-gray-50 hover:bg-white hover:shadow-md border border-gray-100 rounded-lg transition-all text-left"
                            >
                                "¿Cuánto he gastado este mes?"
                            </button>
                            <button
                                onClick={() => sendMessage("Analiza mis patrones de gasto en comida")}
                                className="p-3 text-xs bg-gray-50 hover:bg-white hover:shadow-md border border-gray-100 rounded-lg transition-all text-left"
                            >
                                "Analiza mis gastos en comida"
                            </button>
                            <button
                                onClick={() => sendMessage("¿Tengo alguna anomalía reciente?")}
                                className="p-3 text-xs bg-gray-50 hover:bg-white hover:shadow-md border border-gray-100 rounded-lg transition-all text-left"
                            >
                                "¿Hay anomalías recientes?"
                            </button>
                            <button
                                onClick={() => sendMessage("¿Cómo va mi presupuesto de Ocio?")}
                                className="p-3 text-xs bg-gray-50 hover:bg-white hover:shadow-md border border-gray-100 rounded-lg transition-all text-left"
                            >
                                "Estado presupuesto Ocio"
                            </button>
                        </div>
                    </div>
                )}

                {messages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} />
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-gray-100 rounded-2xl p-4 rounded-bl-none shadow-sm flex items-center gap-3">
                            <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                            <span className="text-xs text-gray-500 font-medium">Pensando...</span>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="flex justify-center my-4">
                        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2 shadow-sm border border-red-100">
                            <span className="font-bold">Error:</span> {error}
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input área */}
            <div className="p-4 bg-white border-t border-gray-200">
                <form onSubmit={handleSubmit} className="flex gap-3 max-w-4xl mx-auto">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Pregunta algo sobre tus finanzas..."
                        disabled={isLoading}
                        className="flex-1 p-3 px-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow disabled:bg-gray-50 disabled:text-gray-400"
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim() || isLoading}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white p-3 px-6 rounded-xl font-medium transition-colors shadow-sm flex items-center gap-2"
                    >
                        <span>Enviar</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    </button>
                </form>
                <div className="text-center mt-2">
                    <p className="text-[10px] text-gray-400">Los agentes de IA pueden cometer errores. Verifica la información importante.</p>
                </div>
            </div>
        </div>
    );
}
