import { Suspense } from 'react';
import { AIChat } from '@/components/AIChat/AIChat';

export default function AgentPage() {
    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-gray-800">Agente Financiero</h1>
                <p className="text-gray-500">
                    Conversa con tu asistente personal para analizar gastos y gestionar tu presupuesto.
                </p>
            </header>

            <section>
                <Suspense fallback={<div className="h-[600px] w-full bg-gray-50 rounded-xl animate-pulse" />}>
                    <AIChat />
                </Suspense>
            </section>
        </div>
    );
}
