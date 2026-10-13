"use client";

import { Suspense } from 'react';
import { AIChat } from '@/components/AIChat/AIChat';
import SubscriptionGuard from '@/components/saas/SubscriptionGuard';

/**
 * `blocked` lo calcula el servidor (solo true con PLUS_SUBSCRIPTIONS_ENABLED="true" y sin permiso de IA).
 * Con el interruptor apagado siempre es false y la pantalla se comporta como antes.
 */
export default function AgentPageClient({ blocked = false }: { blocked?: boolean }) {
    return (
        <SubscriptionGuard allowed={!blocked} title="ai">
            <div className="h-[calc(100vh-64px)] w-full flex flex-col bg-background">
                <Suspense fallback={<div className="h-full w-full bg-muted/10 animate-pulse" />}>
                    <AIChat mode="full" />
                </Suspense>
            </div>
        </SubscriptionGuard>
    );
}
