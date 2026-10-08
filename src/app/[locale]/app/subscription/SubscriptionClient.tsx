"use client";

import { Link } from "@/i18n/routing";

export default function SubscriptionClient() {
    return (
        <main className="min-h-screen px-4 sm:px-6 py-6 sm:py-10 max-w-2xl mx-auto space-y-4 sm:space-y-6">
            <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Cuenta</p>
                <h1 className="text-xl sm:text-2xl font-bold font-serif text-foreground">Tu Plan</h1>
                <p className="text-sm text-muted-foreground">Consulta de un vistazo qué tienes disponible en Kakebo.</p>
            </div>

            <div className="border rounded-2xl p-5 sm:p-7 space-y-6 border-primary/30 bg-primary/5 shadow-sm">
                <div className="space-y-2">
                    <h2 className="text-lg font-semibold text-foreground mb-2">
                        Acceso Completo Gratuito
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Kakebo es ahora completamente gratuito. Tienes acceso a todas las funcionalidades sin límites.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-background/60 p-3">
                        <span className="text-green-600 font-semibold">✓</span>
                        <span className="text-sm text-foreground">Registro ilimitado de gastos e ingresos</span>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-background/60 p-3">
                        <span className="text-green-600 font-semibold">✓</span>
                        <span className="text-sm text-foreground">Agente Financiero IA</span>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-background/60 p-3">
                        <span className="text-green-600 font-semibold">✓</span>
                        <span className="text-sm text-foreground">Informes PDF</span>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-background/60 p-3">
                        <span className="text-green-600 font-semibold">✓</span>
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
