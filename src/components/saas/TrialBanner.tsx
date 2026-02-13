"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { canUsePremium, Profile, getTrialDaysLeft } from "@/lib/auth/access-control";
import Link from "next/link";

export default function TrialBanner() {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<Profile | null>(null);

    useEffect(() => {
        async function load() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            const { data } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            setProfile(data as Profile);
            setLoading(false);
        }
        load();
    }, []);

    if (loading || !profile) return null;

    // Si ya es PRO pagado o Admin, no mostramos nada
    if (profile.tier === 'pro' || profile.is_admin || profile.manual_override) {
        return null;
    }

    // Si tiene trial activo
    const daysLeft = getTrialDaysLeft(profile);
    const isTrialActive = canUsePremium(profile);

    if (isTrialActive) {
        return (
            <div className="bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 px-4 py-3 text-sm flex items-center justify-center gap-4 text-center">
                <span className="font-medium">
                    🎁 Tienes <strong>{daysLeft} días</strong> de prueba Premium restantes.
                </span>
                <Link
                    href="/pricing" // O un modal de suscripción
                    className="underline hover:opacity-80 font-bold"
                >
                    Suscribirse ahora
                </Link>
            </div>
        );
    }

    // Si el trial ha expirado
    return (
        <div className="bg-red-600 text-white px-4 py-3 text-sm flex items-center justify-center gap-4 text-center">
            <span className="font-medium">
                ⚠️ Tu periodo de prueba ha finalizado. La IA y los reportes están desactivados.
            </span>
            <Link
                href="/pricing" // O trigger de Stripe
                className="bg-white text-red-600 px-3 py-1 rounded font-bold hover:bg-stone-100 transition-colors"
            >
                Activar Premium
            </Link>
        </div>
    );
}
