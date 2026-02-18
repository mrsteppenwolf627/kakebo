"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { useTranslations } from "next-intl";

function isYm(s: string | null) {
    return !!s && /^\d{4}-\d{2}$/.test(s);
}

function parseYm(ym: string) {
    const [y, m] = ym.split("-");
    return { year: Number(y), month: Number(m) };
}

function pad2(n: number) {
    return String(n).padStart(2, "0");
}

export default function NewIncomeClient() {
    const supabase = useMemo(() => createClient(), []);
    const router = useRouter();
    const searchParams = useSearchParams();
    const t = useTranslations("Transaction");
    const tCommon = useTranslations("Transaction.Common");
    const tIncome = useTranslations("Transaction.NewIncome");

    const ym = searchParams?.get("ym");
    const ymValid = isYm(ym);

    const defaultDate = useMemo(() => {
        if (ymValid && ym) return `${ym}-01`;
        return new Date().toISOString().slice(0, 10);
    }, [ymValid, ym]);

    const [date, setDate] = useState(defaultDate);
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [category, setCategory] = useState("general");
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setDate(defaultDate);
    }, [defaultDate]);

    function clampDateToYm(d: string) {
        if (!ymValid || !ym) return d;
        if (d.startsWith(`${ym}-`)) return d;
        return `${ym}-01`;
    }

    async function saveIncome() {
        setError(null);
        if (!amount || !date) {
            setError(tIncome("errors.required"));
            return;
        }

        setSaving(true);

        try {
            const { data: sessionRes } = await supabase.auth.getSession();
            const session = sessionRes.session;
            if (!session?.user) throw new Error("Auth session missing");

            const safeDate = clampDateToYm(date);
            const targetYear =
                ymValid && ym ? parseYm(ym).year : Number(safeDate.slice(0, 4));
            const targetMonth =
                ymValid && ym ? parseYm(ym).month : Number(safeDate.slice(5, 7));

            // Create income via API to handle month creation/validation automatically if needed, 
            // or direct DB insert. API /api/incomes handles creating Month if not exists.
            // Let's use the API for consistency with ManageIncomesModal.

            const response = await fetch("/api/incomes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    date: safeDate,
                    amount: Number(amount),
                    category: "general",
                    description: description || "Ingreso",
                }),
            });

            if (!response.ok) {
                const json = await response.json();
                throw new Error(json.error || tIncome("errors.saveFailed"));
            }

            // Dispatch event for UI updates (DashboardMoneyPanel, ExpenseCalendar)
            // Note: This relies on the page not fully reloading, but router.push might trigger a soft navigation.
            // If we are navigating to dashboard, the dashboard will mount and fetch fresh data anyway.
            // But adding the event doesn't hurt.
            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("kakebo:incomes-changed"));
            }

            router.push(`/app?ym=${targetYear}-${pad2(targetMonth)}`);
            router.refresh();
        } catch (e: any) {
            setError(e?.message ?? tIncome("errors.saveFailed"));
        } finally {
            setSaving(false);
        }
    }

    const badge = ymValid && ym ? tCommon("monthActivity", { month: ym }) : tCommon("currentMonth");
    const backHref = ymValid && ym ? `/app?ym=${ym}` : "/app";

    return (
        <main className="min-h-screen px-4 sm:px-6 pt-6 sm:pt-10 flex items-start justify-center">
            <div className="w-full max-w-2xl mx-auto space-y-6">

                {/* Header with Back Button */}
                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => router.push(backHref)}
                        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    >
                        ← {tCommon("back")}
                    </button>
                    <div className="text-xs uppercase tracking-wide font-medium text-muted-foreground bg-muted px-2 py-1 rounded-sm">
                        {badge}
                    </div>
                </div>

                {/* Main Card */}
                <div className="bg-card border border-border rounded-xl shadow-sm p-6 sm:p-8">
                    <div className="mb-8">
                        <h1 className="text-2xl sm:text-3xl font-serif text-foreground font-medium mb-2">{tIncome("title")}</h1>
                        <p className="text-sm text-muted-foreground">{tIncome("subtitle")}</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-md">
                            {error}
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Date Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">{tCommon("date")}</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(clampDateToYm(e.target.value))}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            {ymValid && ym && (
                                <p className="text-xs text-muted-foreground">
                                    {tCommon("dateHint")}
                                </p>
                            )}
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">{tCommon("concept")}</label>
                            <input
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder={tCommon("placeholders.conceptIncome")}
                                autoFocus
                            />
                        </div>

                        {/* Amount */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">{tCommon("amount")}</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">€</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full rounded-md border border-input bg-background pl-7 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="button"
                                onClick={saveIncome}
                                disabled={saving || !amount}
                                className="w-full inline-flex items-center justify-center rounded-md bg-stone-900 dark:bg-stone-50 px-8 py-3 text-sm font-medium text-stone-50 dark:text-stone-900 shadow transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                            >
                                {saving ? tIncome("saving") : tIncome("submit")}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
