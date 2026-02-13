"use client";

import React, { useRef, useEffect, useState } from 'react';
import { useAgent } from '@/hooks/useAgent';
import { ChatMessage } from './ChatMessage';

export function AIChat({ mode = "default", onClose }: { mode?: "default" | "full" | "widget"; onClose?: () => void }) {
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

    // Estilos base según el modo
    const containerClasses = {
        default: "flex flex-col h-[calc(100dvh-120px)] sm:h-[600px] w-full max-w-4xl mx-auto bg-card rounded-xl border border-border shadow-sm overflow-hidden transition-colors",
        full: "flex flex-col h-full w-full bg-background",
        widget: "flex flex-col h-full w-full bg-card rounded-xl border border-border shadow-2xl overflow-hidden"
    };

    const headerClasses = {
        default: "px-6 py-4 bg-card border-b border-border flex justify-between items-center",
        full: "px-4 py-3 bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-10 flex justify-between items-center",
        widget: "px-4 py-3 bg-primary text-primary-foreground flex justify-between items-center"
    };

    return (
        <div className={containerClasses[mode]}>
            {/* Header */}
            <div className={headerClasses[mode]}>
                <div className="flex items-center gap-3">
                    {mode === 'full' && (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-lg">🤖</span>
                        </div>
                    )}
                    <div>
                        <h2 className={`font-serif font-medium ${mode === 'widget' ? 'text-sm' : 'text-lg'} text-foreground`}>
                            {mode === 'widget' ? 'Asistente Kakebo' : 'Asistente Financiero'}
                        </h2>
                        {mode !== 'widget' && (
                            <p className="text-xs text-muted-foreground">GPT-4o-mini & Agentes</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {mode !== 'widget' && (
                        <button
                            onClick={clearHistory}
                            className="text-xs text-muted-foreground hover:text-destructive transition-colors px-3 py-1 rounded-md hover:bg-muted"
                        >
                            Borrar chat
                        </button>
                    )}
                    {mode === 'widget' && onClose && (
                        <button
                            onClick={onClose}
                            className="text-primary-foreground/80 hover:text-primary-foreground transition-colors p-1"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Área de mensajes */}
            <div className={`flex-1 overflow-y-auto p-4 ${mode === 'widget' ? 'space-y-3' : 'sm:p-6 space-y-4'} bg-muted/20 scroll-smooth`}>
                {messages.length === 0 && (
                    <div className="flex flex-col h-full items-center justify-center text-muted-foreground space-y-4 p-8 mx-auto max-w-2xl opacity-70">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                            <span className="text-2xl">👋</span>
                        </div>
                        <p className="font-medium text-foreground text-center">
                            {mode === 'widget' ? '¿En qué te ayudo?' : '¡Hola! Soy tu asistente Kakebo.'}
                        </p>
                        {mode !== 'widget' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full max-w-md mt-4">
                                <button
                                    onClick={() => sendMessage("¿Cuánto he gastado este mes en total?")}
                                    className="p-3 text-xs bg-muted/50 hover:bg-card hover:shadow-sm border border-border rounded-lg transition-all text-left text-foreground"
                                >
                                    "¿Gasto total del mes?"
                                </button>
                                <button
                                    onClick={() => sendMessage("Analiza mis patrones de gasto en comida")}
                                    className="p-3 text-xs bg-muted/50 hover:bg-card hover:shadow-sm border border-border rounded-lg transition-all text-left text-foreground"
                                >
                                    "Analiza gastos en comida"
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {messages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} />
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-card border border-border rounded-2xl p-3 rounded-bl-none shadow-sm flex items-center gap-2">
                            <div className="flex space-x-1">
                                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="flex justify-center my-4">
                        <div className="bg-destructive/10 text-destructive px-3 py-2 rounded-lg text-xs flex items-center gap-2 shadow-sm border border-destructive/20">
                            <span className="font-bold">Error:</span> {error}
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input área */}
            <div className={`p-3 ${mode === 'widget' ? 'bg-card' : 'bg-background'} border-t border-border`}>
                <form onSubmit={handleSubmit} className="flex gap-2 max-w-4xl mx-auto items-center">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={mode === 'widget' ? "Escribe aquí..." : "Pregunta algo sobre tus finanzas..."}
                        disabled={isLoading}
                        className={`flex-1 ${mode === 'widget' ? 'p-2 text-sm' : 'p-3 px-4'} rounded-xl border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-shadow disabled:bg-muted disabled:text-muted-foreground placeholder:text-muted-foreground/60`}
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim() || isLoading}
                        className={`bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 ${mode === 'widget' ? 'p-2 rounded-lg' : 'p-3 px-6 rounded-xl'} font-medium transition-all shadow-sm flex items-center justify-center`}
                    >
                        {mode === 'widget' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        ) : (
                            <span className="flex items-center gap-2">
                                <span>Enviar</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="22" y1="2" x2="11" y2="13"></line>
                                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                </svg>
                            </span>
                        )}
                    </button>
                </form>
                {mode !== 'widget' && (
                    <div className="text-center mt-2">
                        <p className="text-[10px] text-muted-foreground">Los agentes de IA pueden cometer errores.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
