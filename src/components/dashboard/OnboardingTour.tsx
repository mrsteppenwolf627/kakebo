"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { useTranslations } from "next-intl";

type Step = "welcome" | "income" | "savings" | "done";

export default function OnboardingTour() {
    const t = useTranslations("Dashboard.Onboarding");
    const [step, setStep] = useState<Step | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [income, setIncome] = useState<string>("");
    const [savingsGoal, setSavingsGoal] = useState<string>("");

    const supabase = createClient();

    useEffect(() => {
        async function checkTour() {
            try {
                const { data: session } = await supabase.auth.getSession();
                if (!session.session?.user) return;

                const { data, error } = await supabase
                    .from("user_settings")
                    .select("monthly_income, monthly_saving_goal")
                    .eq("user_id", session.session.user.id)
                    .single();

                if (error && error.code !== "PGRST116") {
                    console.error("Onboarding check error:", error);
                    return;
                }

                const currentIncome = data?.monthly_income;
                const currentGoal = data?.monthly_saving_goal;

                // Treat as new user if both are null or 0
                if (!currentIncome && !currentGoal) {
                    setStep("welcome");
                }
            } catch (err) {
                console.error("Failed to fetch user settings for onboarding", err);
            } finally {
                setLoading(false);
            }
        }
        checkTour();
    }, [supabase]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const { data: session } = await supabase.auth.getSession();
            if (!session.session?.user) return;

            const finalIncome = Number(income) || 0;
            const finalGoal = Number(savingsGoal) || 0;

            const { error } = await supabase
                .from("user_settings")
                .upsert({
                    user_id: session.session.user.id,
                    monthly_income: finalIncome,
                    monthly_saving_goal: finalGoal,
                }, { onConflict: "user_id" });

            if (error) throw error;

            // Re-fetch data in other components
            window.dispatchEvent(new Event('kakebo:incomes-changed'));

            setStep("done");
        } catch (err) {
            console.error("Failed to save onboarding settings", err);
        } finally {
            setSaving(false);
        }
    };

    const handleSkip = () => {
        setStep(null);
    };

    if (loading || step === null) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg p-6 sm:p-8 animate-in slide-in-from-bottom-4 zoom-in-95 relative overflow-hidden">

                {/* Decorative background circle */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />

                <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                    {step === "welcome" && (
                        <>
                            <div className="w-16 h-16 bg-primary/20 text-primary flex items-center justify-center rounded-full text-3xl mb-2">
                                🏮
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-serif text-foreground font-bold tracking-tight">
                                {t("welcome.title", { fallback: "¡Bienvenido a Kakebo!" })}
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">
                                {t("welcome.desc", { fallback: "El método Kakebo te ayudará a tomar consciencia de tus gastos y a ahorrar de forma efectiva. Para empezar a usar tu Dashboard, necesitamos un par de datos básicos." })}
                            </p>
                            <div className="w-full flex flex-col gap-3 pt-4">
                                <button
                                    onClick={() => setStep("income")}
                                    className="w-full bg-primary text-primary-foreground font-medium py-3 rounded-xl hover:opacity-90 transition-opacity"
                                >
                                    {t("welcome.next", { fallback: "Comenzar configuración" })}
                                </button>
                                <button
                                    onClick={handleSkip}
                                    className="w-full bg-transparent text-muted-foreground font-medium py-2 rounded-xl hover:bg-muted/50 transition-colors"
                                >
                                    {t("common.skip", { fallback: "Saltar por ahora" })}
                                </button>
                            </div>
                        </>
                    )}

                    {step === "income" && (
                        <>
                            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-600 flex items-center justify-center rounded-full text-3xl mb-2">
                                💰
                            </div>
                            <h2 className="text-2xl font-serif text-foreground font-bold tracking-tight">
                                {t("income.title", { fallback: "¿Cuáles son tus ingresos mensuales?" })}
                            </h2>
                            <p className="text-muted-foreground text-sm">
                                {t("income.desc", { fallback: "Introduce tu sueldo base o promedio mensual. Podrás añadir ingresos extra más adelante." })}
                            </p>

                            <div className="w-full relative mt-4">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                                <input
                                    type="number"
                                    value={income}
                                    onChange={(e) => setIncome(e.target.value)}
                                    placeholder="2000"
                                    className="w-full bg-background border border-border rounded-xl py-3 pl-8 pr-4 text-xl font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                                    autoFocus
                                />
                            </div>

                            <div className="w-full flex gap-3 pt-4">
                                <button
                                    onClick={() => setStep("welcome")}
                                    className="w-1/3 bg-muted text-foreground font-medium py-3 rounded-xl hover:bg-muted/80 transition-colors"
                                >
                                    {t("common.back", { fallback: "Atrás" })}
                                </button>
                                <button
                                    onClick={() => setStep("savings")}
                                    disabled={!income || Number(income) <= 0}
                                    className="w-2/3 bg-primary text-primary-foreground font-medium py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                    {t("common.next", { fallback: "Siguiente" })}
                                </button>
                            </div>
                        </>
                    )}

                    {step === "savings" && (
                        <>
                            <div className="w-16 h-16 bg-blue-500/20 text-blue-600 flex items-center justify-center rounded-full text-3xl mb-2">
                                🎯
                            </div>
                            <h2 className="text-2xl font-serif text-foreground font-bold tracking-tight">
                                {t("savings.title", { fallback: "¿Cuánto quieres ahorrar?" })}
                            </h2>
                            <p className="text-muted-foreground text-sm">
                                {t("savings.desc", { fallback: "El método Kakebo separa tu ahorro al principio, no al final del mes. 'Págate a ti mismo' primero." })}
                            </p>

                            <div className="w-full relative mt-4">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                                <input
                                    type="number"
                                    value={savingsGoal}
                                    onChange={(e) => setSavingsGoal(e.target.value)}
                                    placeholder="400"
                                    className="w-full bg-background border border-border rounded-xl py-3 pl-8 pr-4 text-xl font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                                    autoFocus
                                />
                            </div>

                            <div className="w-full flex gap-3 pt-4">
                                <button
                                    onClick={() => setStep("income")}
                                    className="w-1/3 bg-muted text-foreground font-medium py-3 rounded-xl hover:bg-muted/80 transition-colors"
                                    disabled={saving}
                                >
                                    {t("common.back", { fallback: "Atrás" })}
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving || !savingsGoal || Number(savingsGoal) < 0}
                                    className="w-2/3 bg-primary text-primary-foreground font-medium py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                    {saving ? "..." : t("savings.finish", { fallback: "Guardar y Empezar" })}
                                </button>
                            </div>
                        </>
                    )}

                    {step === "done" && (
                        <>
                            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 flex items-center justify-center rounded-full text-4xl mb-2 animate-bounce">
                                ✨
                            </div>
                            <h2 className="text-3xl font-serif text-foreground font-bold tracking-tight">
                                {t("done.title", { fallback: "¡Todo Listo!" })}
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">
                                {t("done.desc", { fallback: "Tus ajustes básicos están guardados. Recuerda registrar cada céntimo que gastes para tomar control absoluto de tu dinero." })}
                            </p>

                            <button
                                onClick={() => setStep(null)}
                                className="w-full mt-6 bg-primary text-primary-foreground font-medium py-4 rounded-xl hover:opacity-90 transition-opacity text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 duration-200"
                            >
                                {t("done.start", { fallback: "Ir a mi Dashboard" })}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
