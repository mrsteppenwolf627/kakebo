"use client";

import { Link } from "@/i18n/routing";

export default function SubscriptionClient() {
    return (
        <main className="min-h-screen px-4 sm:px-6 py-6 sm:py-10 max-w-xl mx-auto space-y-4 sm:space-y-6">
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-foreground">
                Tu Plan
            </h1>

            <div className="border rounded-lg p-6 space-y-6 border-primary/50 bg-primary/5">
                <div>
                    <h2 className="text-lg font-semibold text-foreground mb-2">
                        Acceso Completo Gratuito
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Kakebo es ahora completamente gratuito. Tienes acceso a todas las funcionalidades sin límites.
                    </p>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <span className="text-green-500">✓</span>
                        <span className="text-sm text-foreground">Registro ilimitado de gastos e ingresos</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-green-500">✓</span>
                        <span className="text-sm text-foreground">Agente Financiero IA</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-green-500">✓</span>
                        <span className="text-sm text-foreground">Informes PDF</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-green-500">✓</span>
                        <span className="text-sm text-foreground">Control de gastos fijos</span>
                    </div>
                </div>

                <div className="flex flex-col items-center pt-6 border-t border-border/50">
                    <div className="mb-6 px-4 py-2 bg-primary/10 text-primary font-medium rounded-full text-sm">
                        Plan Gratuito · Sin límites
                    </div>
                    <Link
                        href="/app"
                        className="flex w-full border border-primary text-primary font-medium rounded-md px-4 py-3 hover:bg-primary/5 transition-colors justify-center items-center"
                    >
                        Volver al Dashboard
                    </Link>
                </div>
            </div>
        </main>
    );
}
