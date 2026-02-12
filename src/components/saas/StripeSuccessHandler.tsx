"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export default function StripeSuccessHandler() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const supabase = createClient();
    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
        const success = searchParams.get('success');
        if (success === 'true') {
            setVerifying(true);
            const interval = setInterval(async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('tier')
                    .eq('id', user.id)
                    .single();

                if (profile?.tier === 'pro') {
                    clearInterval(interval);
                    setVerifying(false);
                    // Force full reload to ensure Auth/SubscriptionGuard re-fetches data
                    window.location.href = '/app';
                    // We don't need alert, the UI update is enough feedback, but let's keep it brief if needed or remove it for smoother ux

                }
            }, 2000); // Check every 2s

            // Timeout after 30s
            setTimeout(() => {
                clearInterval(interval);
                setVerifying(false);
            }, 30000);

            return () => clearInterval(interval);
        }
    }, [searchParams, router, supabase]);

    if (!verifying) return null;

    return (
        <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
            <div className="h-full bg-green-500 animate-pulse w-full"></div>
            <div className="absolute top-2 right-2 bg-white p-2 rounded shadow text-xs font-medium">
                Verificando pago...
            </div>
        </div>
    );
}
