"use client";

import { useState } from "react";
import { Link, useRouter } from "@/i18n/routing";

export default function CancelClient() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleCancel = async () => {
        if (!window.confirm("¿estás seguro??")) {
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/stripe/cancel', { method: 'POST' });
            if (res.ok) {
                alert("Suscripción cancelada correctamente.");
                router.push("/app");
                router.refresh();
            } else {
                alert("Error al cancelar la suscripción.");
                setLoading(false);
            }
        } catch (error) {
            console.error(error);
            alert("Error al cancelar la suscripción.");
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen px-4 sm:px-6 py-12 max-w-xl mx-auto flex flex-col items-center text-center space-y-8">
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-foreground">
                ¿Nos dejas tan pronto?
            </h1>
            <p className="text-muted-foreground">
                Esperamos que hayas disfrutado de Kakebo Pro. Si te quedas, seguirás teniendo acceso ilimitado a tu Coach Financiero IA y el análisis de todos tus gastos fijos.
            </p>

            <div className="w-full max-w-sm space-y-6 pt-6">
                <Link
                    href="/app"
                    className="flex w-full bg-primary text-primary-foreground font-medium rounded-md px-4 py-3 hover:opacity-90 transition-colors shadow-sm justify-center items-center"
                >
                    Seguir con la subscripción
                </Link>

                <div className="pt-4">
                    <button
                        onClick={handleCancel}
                        disabled={loading}
                        className="text-sm text-muted-foreground hover:text-foreground underline decoration-muted-foreground/50 hover:decoration-foreground transition-all"
                    >
                        {loading ? "Cancelando..." : "cancelar subscripción"}
                    </button>
                </div>
            </div>
        </main>
    );
}
