"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { canUseAI, Profile } from "@/lib/auth/access-control";

export default function SubscriptionGuard({ children }: { children: React.ReactNode }) {
    const [hasAccess, setHasAccess] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);

    const supabase = createClient();

    useEffect(() => {
        async function check() {
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

            if (data) {
                setHasAccess(canUseAI(data));
            } else {
                // Fallback safe
                setHasAccess(false);
            }
            setLoading(false);
        }
        check();
    }, []);

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

    if (loading) {
        return <div className="p-8 text-center text-sm text-black/40">Verificando suscripción...</div>;
    }

    if (hasAccess) {
        return <>{children}</>;
    }

    // Payload UI
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center space-y-6">
            <div className="max-w-md space-y-4">
                <h2 className="text-2xl font-bold">Kakebo AI Premium</h2>
                <p className="text-black/60">
                    Tu periodo de prueba ha finalizado. Para continuar chateando con tu asistente financiero impulsado por IA, actualiza a Pro.
                </p>

                <div className="bg-black/5 p-4 rounded-xl text-left text-sm space-y-2">
                    <div>✅ Chat ilimitado con el Agente</div>
                    <div>✅ Análisis de tendencias</div>
                    <div>✅ Previsiones a futuro</div>
                    <div>✅ Soporte prioritario</div>
                </div>

                <button
                    onClick={handleUpgrade}
                    className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
                >
                    Desbloquear por {process.env.NEXT_PUBLIC_PRICE_DISPLAY || "9.99€"}/mes
                </button>

                <p className="text-xs text-black/40">
                    Cancela cuando quieras. Gestionado de forma segura por Stripe.
                </p>
            </div>
        </div>
    );
}
