"use client";

import { useState } from "react";
import Link from "next/link";

export function SavingsSimulator() {
    const [income, setIncome] = useState<number>(2000);
    const [expenses, setExpenses] = useState<number>(1800);
    const [showResult, setShowResult] = useState(false);

    const potentialSaving = Math.max(0, (income * 0.2)); // Target 20% savings

    return (
        <section className="py-16 bg-primary/5 border-y border-primary/10">
            <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
                <h2 className="text-3xl font-serif font-medium text-foreground mb-4">
                    ¿Cuánto podrías ahorrar con Kakebo?
                </h2>
                <p className="text-muted-foreground mb-10 max-w-2xl mx-auto">
                    El método Kakebo te ayuda a reducir hasta un 20% tus gastos hormiga y variables.
                    Compruébalo tú mismo.
                </p>

                <div className="bg-card border border-border rounded-2xl p-8 shadow-sm max-w-2xl mx-auto">
                    <div className="grid sm:grid-cols-2 gap-6 mb-8">
                        <div className="text-left space-y-2">
                            <label className="text-sm font-medium text-foreground">Ingresos Mensuales</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                                <input
                                    type="number"
                                    value={income}
                                    onChange={(e) => setIncome(Number(e.target.value))}
                                    className="w-full rounded-md border border-input bg-background pl-8 py-2 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                />
                            </div>
                        </div>
                        <div className="text-left space-y-2">
                            <label className="text-sm font-medium text-foreground">Gastos Actuales</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                                <input
                                    type="number"
                                    value={expenses}
                                    onChange={(e) => setExpenses(Number(e.target.value))}
                                    className="w-full rounded-md border border-input bg-background pl-8 py-2 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-background rounded-xl border border-border mb-8">
                        <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wider font-medium">Potencial de Ahorro Mensual</p>
                        <p className="text-4xl font-serif font-bold text-primary">
                            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(potentialSaving)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                            *Basado en el objetivo del 20% del método Kakebo
                        </p>
                    </div>

                    <Link
                        href="/login?mode=signup"
                        className="inline-flex w-full sm:w-auto items-center justify-center rounded-lg bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                        Empezar a ahorrar hoy
                    </Link>
                    <p className="mt-4 text-xs text-muted-foreground">
                        Prueba gratuita de 14 días. Sin tarjeta.
                    </p>
                </div>
            </div>
        </section>
    );
}
