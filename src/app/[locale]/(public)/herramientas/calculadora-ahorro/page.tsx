"use client";

import { useState, useEffect } from "react";
import { Navbar, Footer } from "@/components/landing";
import { Link } from "@/i18n/routing";

export default function SavingsCalculatorPage() {
    const [income, setIncome] = useState<number>(1500);
    const [fixedExpenses, setFixedExpenses] = useState<number>(600);
    const [goal, setGoal] = useState<number>(0);

    // Kakebo Ratios (Ideal)
    // Survival: 50-60%
    // Optional/Ocio: 20%
    // Culture: 10%
    // Extra/Saving: 10-20%

    const [distribution, setDistribution] = useState({
        survival: 0,
        optional: 0,
        culture: 0,
        extra: 0,
        savingPotential: 0,
    });

    useEffect(() => {
        const disposable = income - fixedExpenses;

        // Simple logic for the calculator
        // 1. Fixed expenses go to "Survival" (partially)
        // But in Kakebo, Survival includes Food, Transport, etc. not just fixed bills.
        // Let's use a standard 50/30/20 rule adapted to Kakebo names for simplicity.

        // Needs (Supervivencia): 50% of Income
        const idealSurvival = income * 0.5;

        // Wants (Ocio + Cultura): 30% of Income
        const idealWants = income * 0.3;

        // Savings (Extra): 20% of Income
        const idealSavings = income * 0.2;

        setDistribution({
            survival: idealSurvival,
            optional: idealWants * 0.66, // Split wants into Ocio
            culture: idealWants * 0.34,  // and Cultura
            extra: 0,
            savingPotential: idealSavings,
        });

    }, [income, fixedExpenses]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("es-ES", {
            style: "currency",
            currency: "EUR",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <main className="min-h-screen bg-background">
            <Navbar />

            <div className="pt-24 pb-16">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-serif font-bold text-foreground sm:text-5xl mb-4">
                            Calculadora de Ahorro Kakebo
                        </h1>
                        <p className="text-lg text-muted-foreground font-light max-w-2xl mx-auto">
                            Descubre cómo deberías distribuir tu sueldo para ahorrar sin esfuerzo usando el método japonés.
                        </p>
                    </div>

                    <div className="grid gap-12 lg:grid-cols-2">
                        {/* INPUTS */}
                        <div className="space-y-8 rounded-2xl border border-border bg-card p-8 shadow-sm">
                            <div>
                                <h3 className="text-xl font-serif font-semibold mb-6">Tus números mensuales</h3>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">
                                            Ingresos Netos Mensuales
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                                            <input
                                                type="number"
                                                value={income}
                                                onChange={(e) => setIncome(Number(e.target.value))}
                                                className="w-full rounded-md border border-input bg-background pl-8 py-2 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">Tu nómina y otros ingresos fijos.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">
                                            Gastos Fijos Actuales (Aprox.)
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                                            <input
                                                type="number"
                                                value={fixedExpenses}
                                                onChange={(e) => setFixedExpenses(Number(e.target.value))}
                                                className="w-full rounded-md border border-input bg-background pl-8 py-2 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">Alquiler, hipoteca, luz, agua, internet...</p>
                                    </div>
                                </div>
                            </div>

                            {/* Tips */}
                            <div className="rounded-lg bg-orange-50 dark:bg-orange-900/10 p-4 border border-orange-100 dark:border-orange-900/20">
                                <div className="flex items-start gap-3">
                                    <span className="text-xl">💡</span>
                                    <div>
                                        <h4 className="font-semibold text-orange-900 dark:text-orange-100 text-sm">El secreto Kakebo</h4>
                                        <p className="text-sm text-orange-800 dark:text-orange-200/80 mt-1">
                                            El método no te dice "no gastes", te dice "gasta con intención". La clave es mover dinero de "Vicio" a "Cultura" o "Ahorro".
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RESULTS */}
                        <div className="space-y-8">
                            <div className="rounded-2xl bg-stone-900 p-8 text-white shadow-xl">
                                <h3 className="text-xl font-serif font-semibold mb-6 text-stone-100">
                                    Tu Distribución Ideal
                                </h3>

                                <div className="space-y-6">
                                    {/* Saving Metric */}
                                    <div className="flex items-center justify-between border-b border-stone-700 pb-4">
                                        <div>
                                            <p className="text-sm text-stone-400 font-medium uppercase tracking-wider">Capacidad de Ahorro</p>
                                            <p className="text-3xl font-bold mt-1 text-green-400">{formatCurrency(distribution.savingPotential)}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="inline-flex items-center rounded-full bg-green-400/10 px-3 py-1 text-xs font-medium text-green-400 ring-1 ring-inset ring-green-400/20">
                                                20% Recomendado
                                            </span>
                                        </div>
                                    </div>

                                    {/* Categories */}
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-[1fr,auto] items-center gap-4">
                                            <div>
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-sm font-medium text-stone-300">Supervivencia (50%)</span>
                                                    <span className="text-sm font-medium text-stone-100">{formatCurrency(distribution.survival)}</span>
                                                </div>
                                                <div className="h-2 rounded-full bg-stone-800 overflow-hidden">
                                                    <div className="h-full bg-blue-500 rounded-full w-[50%]"></div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-[1fr,auto] items-center gap-4">
                                            <div>
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-sm font-medium text-stone-300">Ocio y Vicio (20%)</span>
                                                    <span className="text-sm font-medium text-stone-100">{formatCurrency(distribution.optional)}</span>
                                                </div>
                                                <div className="h-2 rounded-full bg-stone-800 overflow-hidden">
                                                    <div className="h-full bg-purple-500 rounded-full w-[20%]"></div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-[1fr,auto] items-center gap-4">
                                            <div>
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-sm font-medium text-stone-300">Cultura (10%)</span>
                                                    <span className="text-sm font-medium text-stone-100">{formatCurrency(distribution.culture)}</span>
                                                </div>
                                                <div className="h-2 rounded-full bg-stone-800 overflow-hidden">
                                                    <div className="h-full bg-yellow-500 rounded-full w-[10%]"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-stone-700">
                                    <p className="text-sm text-stone-400 mb-4 text-center">
                                        ¿Quieres llevar este control día a día automáticamente?
                                    </p>
                                    <Link
                                        href="/login?mode=signup"
                                        className="block w-full rounded-lg bg-white py-3 text-center text-sm font-bold text-stone-900 hover:bg-stone-100 transition-colors"
                                    >
                                        Crear mi Kakebo Gratis
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SEO Content */}
                    <div className="mt-16 max-w-3xl mx-auto prose prose-stone dark:prose-invert">
                        <h2>¿Por qué usar la regla 50/30/20 con Kakebo?</h2>
                        <p>
                            La calculadora utiliza una adaptación de la popular regla presupuestaria 50/30/20 aplicada al método Kakebo.
                            Esta regla sugiere que el 50% de tus ingresos debe ir a necesidades básicas (Supervivencia), el 30% a deseos (Ocio + Cultura) y el 20% a ahorro (Extra).
                        </p>
                        <p>
                            Sin embargo, Kakebo va más allá de los porcentajes. Te invita a reflexionar: ¿Ese gasto en "Ocio" te hizo feliz? ¿Podrías mover parte del presupuesto de "Supervivencia" a "Cultura"?
                            La <strong>calculadora de ahorro</strong> te da el punto de partida numérico; la App de Kakebo te ayuda a mantener el hábito.
                        </p>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    );
}
