"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export default function SubscriptionClient() {
    const supabase = createClient();
    const tGen = useTranslations("Navigation");

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [tier, setTier] = useState<string>("free");

    useEffect(() => {
        async function load() {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data: profile } = await supabase
                    .from("profiles")
                    .select("tier")
                    .eq("id", user.id)
                    .single();

                if (profile) setTier(profile.tier || "free");
            } catch (err) {
                console.error("Error loading profile", err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [supabase]);

    const handleSubscribe = async () => {
        setActionLoading(true);
        try {
            const res = await fetch('/api/stripe/checkout', { method: 'POST' });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert("Error al iniciar el pago");
            }
        } catch (error) {
            console.error("Error redirecting to checkout", error);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen px-4 sm:px-6 py-6 sm:py-10 max-w-xl mx-auto">
                <div className="text-sm text-muted-foreground animate-pulse">Cargando...</div>
            </main>
        );
    }

    return (
        <main className="min-h-screen px-4 sm:px-6 py-6 sm:py-10 max-w-xl mx-auto space-y-4 sm:space-y-6">
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-foreground">
                Kakebo Pro
            </h1>

            <div className={`border rounded-lg p-6 space-y-6 ${tier === 'pro' ? 'border-primary/50 bg-primary/5' : 'border-border bg-card'}`}>
                <div>
                    <h2 className="text-lg font-semibold text-foreground mb-2">
                        {tier === 'pro' ? 'Tu Suscripción Activa' : 'Pásate a Pro'}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {tier === 'pro'
                            ? 'Estás disfrutando de todas las ventajas de Kakebo Pro. Gracias por tu apoyo.'
                            : 'Obtén acceso ilimitado al Agente IA, análisis avanzados y soporte prioritario.'}
                    </p>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <span className="text-green-500">✓</span>
                        <span className="text-sm text-foreground">Agente Financiero IA 24/7</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-green-500">✓</span>
                        <span className="text-sm text-foreground">Control ilimitado de gastos fijos</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-green-500">✓</span>
                        <span className="text-sm text-foreground">Soporte técnico prioritario</span>
                    </div>
                </div>

                <div className="flex flex-col items-center pt-6 border-t border-border/50">
                    {tier === 'free' && (
                        <>
                            <span className="text-3xl font-serif text-foreground">3.99€<span className="text-sm text-muted-foreground font-sans">/mes</span></span>
                            <span className="text-xs text-green-500 mt-1 mb-6 font-medium">15 días de prueba gratis</span>

                            <button
                                onClick={handleSubscribe}
                                disabled={actionLoading}
                                className="w-full bg-primary text-primary-foreground font-medium rounded-md px-4 py-3 hover:opacity-90 disabled:opacity-50 transition-colors shadow-sm"
                            >
                                {actionLoading ? "Redirigiendo..." : "Suscribirse ahora"}
                            </button>
                        </>
                    )}

                    {tier === 'pro' && (
                        <>
                            <div className="mb-6 px-4 py-2 bg-primary/10 text-primary font-medium rounded-full text-sm">
                                Estado: Premium Local
                            </div>
                            <Link
                                href="/app/cancel-subscription"
                                className="flex w-full border border-primary text-primary font-medium rounded-md px-4 py-3 hover:bg-primary/5 transition-colors justify-center items-center"
                            >
                                Gestionar Suscripción
                            </Link>
                            <p className="text-xs text-muted-foreground mt-3 text-center">
                                Tienes acceso a todas las funcionalidades Kakebo Pro.
                            </p>
                        </>
                    )}
                </div>
            </div>
        </main>
    );
}
