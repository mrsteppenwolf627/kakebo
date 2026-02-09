"use client";

import { createClient } from "@/lib/supabase/browser";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function HeroCTA() {
    const supabase = createClient();
    const router = useRouter();
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        async function checkSession() {
            try {
                const { data } = await supabase.auth.getSession();
                if (mounted) {
                    setSession(data.session);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        }

        checkSession();

        const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
            if (mounted) setSession(session);
        });

        return () => {
            mounted = false;
            sub.subscription.unsubscribe();
        };
    }, [supabase]);

    const handleDashboardClick = (e: React.MouseEvent) => {
        e.preventDefault();
        router.push("/app");
    };

    if (loading) {
        return (
            <div className="w-[140px] h-[58px] bg-stone-900/5 dark:bg-stone-100/5 animate-pulse rounded-sm" />
        );
    }

    if (session) {
        return (
            <Link
                href="/app"
                onClick={handleDashboardClick}
                className="inline-flex items-center justify-center border border-stone-900 bg-stone-900 dark:bg-stone-100 dark:text-stone-900 dark:border-stone-100 px-8 py-4 text-base font-normal text-white transition-opacity hover:opacity-90"
            >
                Ir al Dashboard
            </Link>
        );
    }

    return (
        <Link
            href="/login"
            className="inline-flex items-center justify-center border border-stone-900 bg-stone-900 dark:bg-stone-100 dark:text-stone-900 dark:border-stone-100 px-8 py-4 text-base font-normal text-white transition-opacity hover:opacity-90"
        >
            Empezar
        </Link>
    );
}
