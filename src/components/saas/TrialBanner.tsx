"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { getTrialDaysLeft, Profile } from "@/lib/auth/access-control";

export default function TrialBanner() {
    const [daysLeft, setDaysLeft] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<Profile | null>(null);

    const supabase = createClient();

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            setProfile(data);
            if (data) {
                setDaysLeft(getTrialDaysLeft(data));
            }
            setLoading(false);
        }
        load();
    }, []);

    if (loading || !profile || profile.tier === 'pro' || profile.manual_override || profile.is_admin) {
        return null;
    }

    // Si no tiene trial_ends_at, asumimos que no ha empezado o es free legacy (no mostramos banner por ahora)
    if (!daysLeft && daysLeft !== 0) return null;

    async function handleUpgrade() {
        try {
            const res = await fetch('/api/stripe/checkout', { method: 'POST' });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
        } catch (e) {
            console.error(e);
            alert("Error al iniciar pago");
        }
    }

    if (daysLeft === 0) {
        // Expired
        return (
            <div className="bg-red-600 text-white text-xs sm:text-sm p-3 text-center flex items-center justify-center gap-4">
                <span>Tu periodo de prueba de IA ha finalizado.</span>
                <button onClick={handleUpgrade} className="underline font-bold hover:text-red-100">
                    Suscribirse ahora
                </button>
            </div>
        );
    }

    if (daysLeft! <= 3) {
        // Warning
        return (
            <div className="bg-orange-500 text-white text-xs sm:text-sm p-2 text-center">
                Quedan {daysLeft} días de tu prueba gratuita de Kakebo AI.{' '}
                <button onClick={handleUpgrade} className="underline hover:text-orange-100 ml-2">
                    Asegurar acceso
                </button>
            </div>
        );
    }

    return null;
}
