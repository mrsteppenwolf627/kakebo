"use client";

import { useState, useEffect, useRef } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { EmbedModal } from "./EmbedModal";
import { analytics } from "@/lib/analytics";

const fmt = (n: number) =>
    new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
    }).format(n);

const incomeRange = (n: number) =>
    n < 1000 ? "<1000" : n < 2000 ? "1000-2000" : n < 3000 ? "2000-3000" : "3000+";

const marginRange = (n: number) =>
    n < 0 ? "deficit" : n < 200 ? "0-200" : n < 500 ? "200-500" : "500+";

const rateRange = (n: number) =>
    n < 0 ? "deficit" : n < 10 ? "0-10" : n < 20 ? "10-20" : "20+";

type Status = "deficit" | "zero" | "tight" | "below_target" | "good";

export function SavingsCalculator() {
    const t = useTranslations("Tools.Savings");
    const tEmbed = useTranslations("Tools.Common.embed");

    const [isEmbedOpen, setIsEmbedOpen] = useState(false);
    const [income, setIncome] = useState<number>(2000);
    const [fixedExpenses, setFixedExpenses] = useState<number>(800);
    const [variableExpenses, setVariableExpenses] = useState<number>(500);
    const [showGoal, setShowGoal] = useState(false);
    const [totalGoal, setTotalGoal] = useState<number>(0);
    const [months, setMonths] = useState<number>(12);

    const hasTrackedUse = useRef(false);
    const hasTrackedCalculate = useRef(false);
    const hasTrackedGoal = useRef(false);

    useEffect(() => {
        analytics.track("tool_viewed", { tool_name: "calculadora_ahorro" });
    }, []);

    // Core calculations
    const margenReal = income - fixedExpenses - variableExpenses;
    const savingsRate = income > 0 ? (margenReal / income) * 100 : 0;

    const status: Status =
        margenReal < 0
            ? "deficit"
            : margenReal === 0
            ? "zero"
            : savingsRate < 10
            ? "tight"
            : savingsRate < 20
            ? "below_target"
            : "good";

    // Bar widths (capped so fixed + variable ≤ 100%)
    const fixedPct = income > 0 ? Math.min(100, (fixedExpenses / income) * 100) : 0;
    const varPct = income > 0 ? Math.min(100 - fixedPct, (variableExpenses / income) * 100) : 0;
    const marginBarPct = Math.max(0, 100 - fixedPct - varPct);

    // Goal calculations
    const mesesParaObjetivo =
        margenReal > 0 && totalGoal > 0 ? Math.ceil(totalGoal / margenReal) : null;
    const ahorroNecesario =
        months > 0 && totalGoal > 0 ? Math.ceil(totalGoal / months) : null;
    const diferenciaConPlazo =
        ahorroNecesario !== null ? margenReal - ahorroNecesario : null;

    const trackInteraction = () => {
        if (!hasTrackedUse.current) {
            hasTrackedUse.current = true;
            analytics.track("use_savings_calculator", { tool_name: "calculadora_ahorro" });
        }
        hasTrackedCalculate.current = false;
    };

    const trackCalculate = () => {
        if (!hasTrackedCalculate.current && income > 0) {
            hasTrackedCalculate.current = true;
            analytics.track("savings_calculator_calculate", {
                tool_name: "calculadora_ahorro",
                income_range: incomeRange(income),
                real_margin_range: marginRange(margenReal),
                savings_rate_range: rateRange(savingsRate),
                has_goal: showGoal && totalGoal > 0,
                has_deadline: showGoal && totalGoal > 0 && months > 0,
                result_status: status,
            });
        }
    };

    const trackGoalResult = () => {
        if (!hasTrackedGoal.current && mesesParaObjetivo !== null) {
            hasTrackedGoal.current = true;
            analytics.track("savings_calculator_goal_result", {
                tool_name: "calculadora_ahorro",
                months_to_goal: mesesParaObjetivo > 120 ? "120+" : String(mesesParaObjetivo),
                savings_rate_range: rateRange(savingsRate),
                result_status: status,
            });
        }
    };

    const handleInput =
        (setter: (v: number) => void) =>
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setter(Number(e.target.value));
            trackInteraction();
        };

    const handleInputBlur = () => {
        trackCalculate();
    };

    const handleGoalToggle = () => {
        const next = !showGoal;
        setShowGoal(next);
        if (next) trackInteraction();
    };

    useEffect(() => {
        if (showGoal && totalGoal > 0 && margenReal > 0) {
            trackGoalResult();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showGoal, totalGoal, margenReal]);

    // Status display config
    const statusConfig: Record<
        Status,
        { color: string; bg: string; icon: string; label: string }
    > = {
        deficit: {
            color: "text-red-600 dark:text-red-400",
            bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
            icon: "↓",
            label: t("results.statusDeficit"),
        },
        zero: {
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
            icon: "—",
            label: t("results.statusZero"),
        },
        tight: {
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
            icon: "↗",
            label: t("results.statusTight"),
        },
        below_target: {
            color: "text-primary",
            bg: "bg-primary/5 border-primary/20",
            icon: "↑",
            label: t("results.statusBelowTarget"),
        },
        good: {
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
            icon: "✓",
            label: t("results.statusGood"),
        },
    };
    const sc = statusConfig[status];

    const inputClass =
        "w-full rounded-lg border border-input bg-background py-2.5 text-foreground text-base focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all";

    return (
        <div className="max-w-5xl mx-auto space-y-16">
            {/* Header */}
            <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground leading-tight">
                    {t("header.title")}
                </h1>
                <p className="text-lg text-muted-foreground font-light max-w-2xl mx-auto">
                    {t("header.subtitle")}
                </p>
            </div>

            {/* Intro block — definition, formula, GEO context */}
            <div className="max-w-3xl mx-auto space-y-4 text-center">
                <p className="text-muted-foreground font-light leading-relaxed text-base">
                    {t("intro.lead")}
                </p>
                <div className="rounded-xl border border-border bg-muted/30 p-5 text-left">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
                        {t("intro.formulaLabel")}
                    </p>
                    <p className="text-lg font-mono font-medium text-foreground">
                        {t("intro.formulaText")}
                    </p>
                </div>
                <p className="text-sm text-muted-foreground font-light leading-relaxed max-w-2xl mx-auto">
                    {t("intro.vs5030")}
                </p>
            </div>

            {/* Calculator grid */}
            <div className="grid lg:grid-cols-12 gap-8 items-start">
                {/* Inputs sidebar */}
                <aside className="lg:col-span-4 bg-card border border-border rounded-2xl p-8 shadow-sm space-y-6 lg:sticky lg:top-24">
                    <h2 className="text-base font-semibold text-foreground font-serif">
                        {t("inputs.title")}
                    </h2>

                    {/* Income */}
                    <div className="space-y-2">
                        <label
                            htmlFor="sc-income"
                            className="text-xs font-bold text-muted-foreground uppercase tracking-widest block"
                        >
                            {t("inputs.income")}
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
                                €
                            </span>
                            <input
                                id="sc-income"
                                type="number"
                                min="0"
                                step="100"
                                value={income}
                                onChange={handleInput(setIncome)}
                                onBlur={handleInputBlur}
                                className={`${inputClass} pl-8 pr-3`}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">{t("inputs.incomeDesc")}</p>
                    </div>

                    {/* Fixed expenses */}
                    <div className="space-y-2">
                        <label
                            htmlFor="sc-fixed"
                            className="text-xs font-bold text-muted-foreground uppercase tracking-widest block"
                        >
                            {t("inputs.fixed")}
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
                                €
                            </span>
                            <input
                                id="sc-fixed"
                                type="number"
                                min="0"
                                step="50"
                                value={fixedExpenses}
                                onChange={handleInput(setFixedExpenses)}
                                onBlur={handleInputBlur}
                                className={`${inputClass} pl-8 pr-3`}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">{t("inputs.fixedDesc")}</p>
                    </div>

                    {/* Variable expenses */}
                    <div className="space-y-2">
                        <label
                            htmlFor="sc-variable"
                            className="text-xs font-bold text-muted-foreground uppercase tracking-widest block"
                        >
                            {t("inputs.variable")}
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
                                €
                            </span>
                            <input
                                id="sc-variable"
                                type="number"
                                min="0"
                                step="50"
                                value={variableExpenses}
                                onChange={handleInput(setVariableExpenses)}
                                onBlur={handleInputBlur}
                                className={`${inputClass} pl-8 pr-3`}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">{t("inputs.variableDesc")}</p>
                    </div>

                    {/* Goal toggle section */}
                    <div className="border-t border-border pt-6 space-y-4">
                        <button
                            onClick={handleGoalToggle}
                            className="flex items-center gap-2 text-sm text-primary font-medium hover:text-primary/80 transition-colors"
                            aria-expanded={showGoal}
                        >
                            <span
                                className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center text-xs leading-none flex-shrink-0"
                                aria-hidden="true"
                            >
                                {showGoal ? "−" : "+"}
                            </span>
                            {showGoal ? t("inputs.goalHide") : t("inputs.goalToggle")}
                        </button>

                        {showGoal && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label
                                        htmlFor="sc-goal"
                                        className="text-xs font-bold text-muted-foreground uppercase tracking-widest block"
                                    >
                                        {t("inputs.totalGoal")}
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
                                            €
                                        </span>
                                        <input
                                            id="sc-goal"
                                            type="number"
                                            min="0"
                                            step="500"
                                            value={totalGoal || ""}
                                            placeholder="0"
                                            onChange={handleInput(setTotalGoal)}
                                            onBlur={handleInputBlur}
                                            className={`${inputClass} pl-8 pr-3`}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {t("inputs.totalGoalDesc")}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label
                                        htmlFor="sc-months"
                                        className="text-xs font-bold text-muted-foreground uppercase tracking-widest block"
                                    >
                                        {t("inputs.months")}
                                    </label>
                                    <input
                                        id="sc-months"
                                        type="number"
                                        min="1"
                                        max="240"
                                        step="1"
                                        value={months || ""}
                                        placeholder="12"
                                        onChange={handleInput(setMonths)}
                                        onBlur={handleInputBlur}
                                        className={`${inputClass} px-3`}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        {t("inputs.monthsDesc")}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Embed button */}
                    <div className="border-t border-border pt-4">
                        <button
                            onClick={() => setIsEmbedOpen(true)}
                            className="w-full inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors p-3 border border-dashed border-border rounded-lg"
                        >
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                                />
                            </svg>
                            {tEmbed("button")}
                        </button>
                    </div>
                </aside>

                {/* Results area */}
                <div className="lg:col-span-8 space-y-6">
                    {income === 0 ? (
                        <div className="bg-card border border-border rounded-2xl p-12 text-center">
                            <p className="text-muted-foreground font-light text-lg">
                                {t("results.empty")}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Main result card */}
                            <div className="bg-card border border-border rounded-2xl p-8 md:p-10 shadow-sm space-y-8 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />

                                {/* Margin + rate */}
                                <div className="grid sm:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                            {t("results.margin")}
                                        </p>
                                        <p
                                            className={`text-5xl font-serif ${
                                                margenReal >= 0
                                                    ? "text-foreground"
                                                    : "text-red-600 dark:text-red-400"
                                            }`}
                                        >
                                            {fmt(margenReal)}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {t("results.marginDesc")}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                            {t("results.savingsRate")}
                                        </p>
                                        <p
                                            className={`text-5xl font-serif ${
                                                savingsRate >= 20
                                                    ? "text-emerald-600 dark:text-emerald-400"
                                                    : savingsRate >= 10
                                                    ? "text-primary"
                                                    : "text-amber-600 dark:text-amber-400"
                                            }`}
                                        >
                                            {savingsRate > 0 ? `${Math.round(savingsRate)}%` : "0%"}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {t("results.savingsRateDesc")}
                                        </p>
                                    </div>
                                </div>

                                {/* Stacked distribution bar */}
                                <div className="space-y-3">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                        {t("results.breakdown.title")}
                                    </p>
                                    <div
                                        role="img"
                                        aria-label={`Distribución: gastos fijos ${Math.round(fixedPct)}%, gastos variables ${Math.round(varPct)}%, margen ${Math.round(marginBarPct)}%`}
                                        className="h-5 w-full rounded-full overflow-hidden flex bg-border"
                                    >
                                        <div
                                            className="h-full bg-stone-400 dark:bg-stone-600 transition-all duration-300"
                                            style={{ width: `${fixedPct}%` }}
                                        />
                                        <div
                                            className="h-full bg-primary/50 transition-all duration-300"
                                            style={{ width: `${varPct}%` }}
                                        />
                                        <div
                                            className={`h-full transition-all duration-300 ${
                                                marginBarPct > 0
                                                    ? "bg-emerald-500 dark:bg-emerald-600"
                                                    : ""
                                            }`}
                                            style={{ width: `${marginBarPct}%` }}
                                        />
                                    </div>
                                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-3 h-3 rounded-sm bg-stone-400 dark:bg-stone-600 inline-block flex-shrink-0" />
                                            {t("results.breakdown.fixed")} ({Math.round(fixedPct)}%)
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-3 h-3 rounded-sm bg-primary/50 inline-block flex-shrink-0" />
                                            {t("results.breakdown.variable")} ({Math.round(varPct)}%)
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-3 h-3 rounded-sm bg-emerald-500 dark:bg-emerald-600 inline-block flex-shrink-0" />
                                            {t("results.breakdown.margin")} ({Math.round(marginBarPct)}%)
                                        </span>
                                    </div>
                                </div>

                                {/* Status alert */}
                                <div
                                    className={`rounded-xl border p-4 flex items-start gap-3 ${sc.bg}`}
                                    role="status"
                                >
                                    <span
                                        className={`text-base leading-none mt-0.5 flex-shrink-0 ${sc.color}`}
                                        aria-hidden="true"
                                    >
                                        {sc.icon}
                                    </span>
                                    <p className={`text-sm font-medium ${sc.color}`}>{sc.label}</p>
                                </div>

                                {/* Kakebo 20% reference (only when not in deficit) */}
                                {margenReal > 0 && (
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="rounded-lg bg-muted/40 border border-border p-4 space-y-1">
                                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">
                                                {t("results.kakebo20")}
                                            </p>
                                            <p className="text-2xl font-serif text-foreground">
                                                {fmt(income * 0.2)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {t("results.kakebo20Desc")}
                                            </p>
                                        </div>
                                        <div className="rounded-lg bg-muted/40 border border-border p-4 space-y-1">
                                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">
                                                {t("results.difference")}
                                            </p>
                                            <p
                                                className={`text-2xl font-serif ${
                                                    margenReal >= income * 0.2
                                                        ? "text-emerald-600 dark:text-emerald-400"
                                                        : "text-amber-600 dark:text-amber-400"
                                                }`}
                                            >
                                                {margenReal >= income * 0.2 ? "+" : ""}
                                                {fmt(margenReal - income * 0.2)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {t("results.differenceDesc")}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Goal card */}
                            {showGoal && totalGoal > 0 && (
                                <div className="bg-card border border-border rounded-2xl p-8 shadow-sm space-y-6">
                                    <h3 className="text-lg font-serif font-semibold text-foreground">
                                        {t("results.goalTitle")}
                                    </h3>

                                    {margenReal <= 0 ? (
                                        <p className="text-sm text-muted-foreground">
                                            {t("results.goalNeedsMargin")}
                                        </p>
                                    ) : (
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            {mesesParaObjetivo !== null && (
                                                <div className="rounded-xl bg-muted/40 border border-border p-5 space-y-1">
                                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">
                                                        {t("results.goalMonths")}
                                                    </p>
                                                    <p className="text-4xl font-serif text-foreground">
                                                        {mesesParaObjetivo}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {t("results.goalMonthsDesc")}
                                                    </p>
                                                </div>
                                            )}

                                            {ahorroNecesario !== null && months > 0 && (
                                                <div
                                                    className={`rounded-xl border p-5 space-y-1 ${
                                                        diferenciaConPlazo !== null &&
                                                        diferenciaConPlazo >= 0
                                                            ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
                                                            : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                                                    }`}
                                                >
                                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">
                                                        {t("results.goalNeeded")} {months}{" "}
                                                        {t("inputs.monthsUnit")}
                                                    </p>
                                                    <p className="text-4xl font-serif text-foreground">
                                                        {fmt(ahorroNecesario)}
                                                    </p>
                                                    {diferenciaConPlazo !== null && (
                                                        <p
                                                            className={`text-xs font-medium ${
                                                                diferenciaConPlazo >= 0
                                                                    ? "text-emerald-600 dark:text-emerald-400"
                                                                    : "text-amber-600 dark:text-amber-400"
                                                            }`}
                                                        >
                                                            {diferenciaConPlazo >= 0
                                                                ? t("results.goalViable")
                                                                : t("results.goalNotViable", {
                                                                      extra: fmt(
                                                                          Math.abs(diferenciaConPlazo)
                                                                      ),
                                                                  })}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <p className="text-xs text-muted-foreground">
                                        {t("results.disclaimer")}
                                    </p>
                                </div>
                            )}

                            {/* CTA */}
                            <div className="bg-foreground text-background rounded-2xl p-8 text-center space-y-4">
                                <p className="text-sm font-light text-background/70">
                                    {t("results.ctaTitle")}
                                </p>
                                <Link
                                    href="/login?mode=signup&source=calculadora_ahorro"
                                    onClick={() =>
                                        analytics.track("click_tool_to_app", {
                                            tool_name: "calculadora_ahorro",
                                            cta_location: "calculator_results",
                                        })
                                    }
                                    className="inline-block bg-background text-foreground font-semibold px-8 py-3 rounded-full hover:opacity-90 transition-opacity text-sm"
                                >
                                    {t("results.ctaButton")}
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Interpretation section */}
            <div className="max-w-3xl mx-auto space-y-4">
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
                    ¿Cómo interpretar el resultado?
                </h2>
                <div className="space-y-3">
                    <div className="border-l-4 border-l-red-500 dark:border-l-red-400 bg-card border border-border rounded-r-xl p-4 space-y-1">
                        <p className="text-sm font-semibold text-red-700 dark:text-red-400">Déficit</p>
                        <p className="text-sm text-muted-foreground">Tus gastos superan tus ingresos. No queda margen para el ahorro.</p>
                        <p className="text-xs text-muted-foreground/70">→ Revisa primero los gastos fijos; si son inamovibles, busca vías de ingreso adicional.</p>
                    </div>
                    <div className="border-l-4 border-l-amber-500 dark:border-l-amber-400 bg-card border border-border rounded-r-xl p-4 space-y-1">
                        <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Margen cero</p>
                        <p className="text-sm text-muted-foreground">Los gastos consumen exactamente tus ingresos. Un imprevisto provocaría deuda.</p>
                        <p className="text-xs text-muted-foreground/70">→ Identifica el gasto variable más prescindible. Reducir 50-100 € ya crea margen.</p>
                    </div>
                    <div className="border-l-4 border-l-amber-400 dark:border-l-amber-300 bg-card border border-border rounded-r-xl p-4 space-y-1">
                        <p className="text-sm font-semibold text-amber-600 dark:text-amber-300">Margen ajustado (menos del 10%)</p>
                        <p className="text-sm text-muted-foreground">Ahorras algo, pero cualquier imprevisto lo elimina.</p>
                        <p className="text-xs text-muted-foreground/70">→ Construye primero un fondo de seguridad de 1-2 meses de gastos fijos.</p>
                    </div>
                    <div className="border-l-4 border-l-primary bg-card border border-border rounded-r-xl p-4 space-y-1">
                        <p className="text-sm font-semibold text-primary">Por debajo del objetivo Kakebo (10-19%)</p>
                        <p className="text-sm text-muted-foreground">Ahorras, pero por debajo del 20% recomendado por el método Kakebo.</p>
                        <p className="text-xs text-muted-foreground/70">→ Revisa si hay gastos variables reducibles sin afectar tu calidad de vida.</p>
                    </div>
                    <div className="border-l-4 border-l-emerald-500 dark:border-l-emerald-400 bg-card border border-border rounded-r-xl p-4 space-y-1">
                        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Margen saludable (20% o más)</p>
                        <p className="text-sm text-muted-foreground">Alcanzas o superas el objetivo mínimo del método Kakebo.</p>
                        <p className="text-xs text-muted-foreground/70">→ Asigna el exceso a un objetivo concreto: fondo de emergencia, viaje, inversión.</p>
                    </div>
                </div>
            </div>

            {/* SEO prose */}
            <div className="prose prose-stone dark:prose-invert max-w-3xl mx-auto prose-headings:font-serif prose-p:font-light">
                <h2>{t("content.whyTitle")}</h2>
                <p>{t("content.whyText1")}</p>
                <p>
                    {t.rich("content.whyText2", {
                        bold: (chunks) => <strong>{chunks}</strong>,
                    })}
                </p>

                <h3>{t("content.interlinkingTitle")}</h3>
                <ul>
                    <li>
                        <Link
                            href="/blog/como-hacer-un-presupuesto-personal"
                            className="text-primary hover:underline"
                        >
                            {t("content.link0")}
                        </Link>
                    </li>
                    <li>
                        <Link
                            href="/blog/metodo-kakebo-para-autonomos"
                            className="text-primary hover:underline"
                        >
                            {t("content.link1")}
                        </Link>
                    </li>
                    <li>
                        <Link
                            href="/blog/ahorro-pareja"
                            className="text-primary hover:underline"
                        >
                            {t("content.link2")}
                        </Link>
                    </li>
                    <li>
                        <Link
                            href="/herramientas/calculadora-inflacion"
                            className="text-primary hover:underline"
                        >
                            {t("content.link3")}
                        </Link>
                    </li>
                    <li>
                        <Link
                            href="/blog/como-ahorrar-dinero-cada-mes"
                            className="text-primary hover:underline"
                        >
                            {t("content.link4")}
                        </Link>
                    </li>
                    <li>
                        <Link
                            href="/blog/cuentas-remuneradas"
                            className="text-primary hover:underline"
                        >
                            {t("content.link5")}
                        </Link>
                    </li>
                    <li>
                        <Link
                            href="/blog/eliminar-gastos-hormiga"
                            className="text-primary hover:underline"
                        >
                            {t("content.link6")}
                        </Link>
                    </li>
                </ul>
            </div>

            <EmbedModal
                isOpen={isEmbedOpen}
                onClose={() => setIsEmbedOpen(false)}
                toolPath="/herramientas/calculadora-ahorro"
            />
        </div>
    );
}
