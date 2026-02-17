"use client";

import { Suspense } from 'react';
import { AIChat } from '@/components/AIChat/AIChat';
import SubscriptionGuard from '@/components/saas/SubscriptionGuard';
import TrialBanner from '@/components/saas/TrialBanner';

export default function AgentPage() {
    return (
        <SubscriptionGuard>
            <div className="h-[calc(100vh-64px)] w-full flex flex-col bg-background">
                {/* <TrialBanner /> - Optional in full screen, maybe minimal? */}
                <Suspense fallback={<div className="h-full w-full bg-muted/10 animate-pulse" />}>
                    <AIChat mode="full" />
                </Suspense>
            </div>
        </SubscriptionGuard>
    );
}
