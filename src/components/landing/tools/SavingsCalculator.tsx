"use client";

import { useState, useEffect, useRef } from "react";
import NextLink from "next/link";
import { Link } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { analytics } from "@/lib/analytics";

const CTA_HREF = "/login?mode=signup&source=calculadora_ahorro";
// `source` del CTA: constante fija, nunca derivada del resultado ni de lo que escribe la persona.
const CTA_SOURCE = "calculadora_ahorro";
// Un segundo clic dentro de esta ventana (doble clic) no genera otro evento.
const CTA_CLICK_DEDUPE_MS = 2000;

const NUMBER_LOCALES: Record<string, string> = { es: "es-ES", en: "en-IE" };

const formatEuro = (n: number, locale: string) =>
    new Intl.NumberFormat(NUMBER_LOCALES[locale] ?? "es-ES", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
    }).format(n);

// Contexto de página no sensible, común a todos los eventos de la calculadora.
// Solo ruta (sin query ni hash) y título del documento. Los eventos de esta herramienta
// no llevan importes, porcentajes, plazos ni rangos derivados de lo que escribe el usuario.
const pageContext = () => ({
    page_path: typeof window !== "undefined" ? window.location.pathname : "",
    page_title: typeof document !== "undefined" ? document.title : "",
});

const INTERPRETATION_ITEMS = [
    { key: "deficit", border: "border-l-red-500 dark:border-l-red-400", label: "text-red-700 dark:text-red-400" },
    { key: "zero", border: "border-l-amber-500 dark:border-l-amber-400", label: "text-amber-700 dark:text-amber-400" },
    { key: "tight", border: "border-l-amber-400 dark:border-l-amber-300", label: "text-amber-700 dark:text-amber-300" },
    { key: "belowTarget", border: "border-l-primary", label: "text-[#9a5a3a] dark:text-primary" },
    { key: "good", border: "border-l-emerald-500 dark:border-l-emerald-400", label: "text-emerald-700 dark:text-emerald-400" },
] as const;

type Status = "deficit" | "zero" | "tight" | "below_target" | "good";

export function SavingsCalculator() {
    const t = useTranslations("Tools.Savings");
    const locale = useLocale();
    const fmt = (n: number) => formatEuro(n, locale);

    const [income, setIncome] = useState<number>(2000);
    const [fixedExpenses, setFixedExpenses] = useState<number>(800);
    const [variableExpenses, setVariableExpenses] = useState<number>(500);
    const [showGoal, setShowGoal] = useState(false);
    const [totalGoal, setTotalGoal] = useState<number>(0);
    const [months, setMonths] = useState<number>(12);

    const hasTrackedUse = useRef(false);
    const calcDirty = useRef(false);
    const goalDirty = useRef(false);
    const hasTrackedView = useRef(false);
    const lastCtaClick = useRef(0);

    useEffect(() => {
        if (hasTrackedView.current) return;
        hasTrackedView.current = true;
        analytics.track("tool_viewed", { tool_name: "calculadora_ahorro", ...pageContext() });
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
    const fixedPct = income > 0 ? Math.max(0, Math.min(100, (fixedExpenses / income) * 100)) : 0;
    const varPct = income > 0 ? Math.max(0, Math.min(100 - fixedPct, (variableExpenses / income) * 100)) : 0;
    const marginBarPct = Math.max(0, 100 - fixedPct - varPct);

    // Goal calculations
    const mesesParaObjetivo =
        margenReal > 0 && totalGoal > 0 ? Math.ceil(totalGoal / margenReal) : null;
    const ahorroNecesario =
        months > 0 && totalGoal > 0 ? Math.ceil(totalGoal / months) : null;
    const diferenciaConPlazo =
        ahorroNecesario !== null ? margenReal - ahorroNecesario : null;

    // Unidad de cada evento (los payloads no llevan datos del cálculo; la deduplicación usa solo el estado del ciclo
    // de interacción, nunca los valores ni un hash de ellos):
    // - use_savings_calculator: primera interacción real (cambiar un campo o abrir el objetivo), una vez por carga.
    // - savings_calculator_calculate: una vez por ciclo «modificación → cálculo completado». Un campo modificado marca
    //   el ciclo como pendiente (dirty); "completado" = el foco sale del formulario (no al pasar de un campo a otro) o
    //   se pulsa «Ver mi resultado», con ingresos y sin importes negativos. Al enviarse, el ciclo queda cerrado y una
    //   nueva modificación abre otro. Pulsaciones, blur intermedios, re-render e hidratación no emiten nada.
    // - savings_calculator_goal_result: mismo ciclo, pero marcado solo al modificar el objetivo o el plazo, y solo con
    //   un resultado de objetivo válido (margen positivo y plazo válido) dentro de un cálculo completado.
    // El ciclo solo se cierra si el evento se entregó (hay consentimiento): sin consentimiento no se envía nada, y lo
    // pendiente no se reenvía al aceptar; la siguiente modificación completada sí cuenta.
    const sendEvent = (name: Parameters<typeof analytics.track>[0]) =>
        analytics.track(name, { tool_name: "calculadora_ahorro", ...pageContext() });

    const trackInteraction = () => {
        if (hasTrackedUse.current) return;
        if (sendEvent("use_savings_calculator")) hasTrackedUse.current = true;
    };

    const trackCompletedCalculation = () => {
        const valid = income > 0 && fixedExpenses >= 0 && variableExpenses >= 0 && totalGoal >= 0;
        if (!valid) return;
        if (calcDirty.current && sendEvent("savings_calculator_calculate")) calcDirty.current = false;
        if (goalDirty.current && showGoal && mesesParaObjetivo !== null && !monthsInvalid) {
            if (sendEvent("savings_calculator_goal_result")) goalDirty.current = false;
        }
    };

    const handlePanelBlur = (e: React.FocusEvent<HTMLElement>) => {
        // Solo cuenta cuando el foco sale del formulario, no al pasar de un campo a otro.
        if (e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget)) return;
        trackCompletedCalculation();
    };

    const handleCtaClick = () => {
        const now = Date.now();
        if (now - lastCtaClick.current < CTA_CLICK_DEDUPE_MS) return;
        if (analytics.track("click_tool_to_app", { tool_name: "calculadora_ahorro", ...pageContext(), source: CTA_SOURCE })) {
            lastCtaClick.current = now;
        }
    };

    const handleInput =
        (setter: (v: number) => void, goalField = false) =>
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setter(Number(e.target.value));
            calcDirty.current = true;
            if (goalField) goalDirty.current = true;
            trackInteraction();
        };

    const handleGoalToggle = () => {
        const next = !showGoal;
        setShowGoal(next);
        if (next) trackInteraction();
    };

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
            color: "text-amber-700 dark:text-amber-400",
            bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
            icon: "—",
            label: t("results.statusZero"),
        },
        tight: {
            color: "text-amber-700 dark:text-amber-400",
            bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
            icon: "↗",
            label: t("results.statusTight"),
        },
        below_target: {
            color: "text-[#9a5a3a] dark:text-primary",
            bg: "bg-primary/5 border-primary/20",
            icon: "↑",
            label: t("results.statusBelowTarget"),
        },
        good: {
            color: "text-emerald-700 dark:text-emerald-400",
            bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
            icon: "✓",
            label: t("results.statusGood"),
        },
    };
    const sc = statusConfig[status];

    // Validación solo informativa: no altera el cálculo, que sigue exactamente igual.
    const negative = { income: income < 0, fixed: fixedExpenses < 0, variable: variableExpenses < 0, goal: totalGoal < 0 };
    const monthsInvalid = showGoal && totalGoal > 0 && (!Number.isInteger(months) || months < 1 || months > 240);
    const resultsRef = useRef<HTMLDivElement>(null);
    const focusResults = () => {
        trackCompletedCalculation();
        resultsRef.current?.focus();
        const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        resultsRef.current?.scrollIntoView?.({ block: "start", behavior: reduceMotion ? "auto" : "smooth" });
    };
    const ctaByStatus: Record<Status, string> = {
        deficit: t("results.ctaDeficit"),
        zero: t("results.ctaZero"),
        tight: t("results.ctaTight"),
        below_target: t("results.ctaBelowTarget"),
        good: t("results.ctaGood"),
    };

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
                <aside onBlur={handlePanelBlur} className="lg:col-span-4 bg-card border border-border rounded-2xl p-8 shadow-sm space-y-6 lg:sticky lg:top-24">
                    <h2 className="text-base font-semibold text-foreground font-serif">
                        {t("inputs.title")}
                    </h2>
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">{t("inputs.exampleNote")}</p>
                        <p className="text-xs text-muted-foreground">{t("inputs.privacyNote")}</p>
                    </div>

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
                                aria-describedby={negative.income ? "sc-income-desc sc-income-error" : "sc-income-desc"}
                                aria-invalid={negative.income}
                                type="number"
                                min="0"
                                step="100"
                                value={income}
                                onChange={handleInput(setIncome)}
                                className={`${inputClass} pl-8 pr-3`}
                            />
                        </div>
                        <p id="sc-income-desc" className="text-xs text-muted-foreground">{t("inputs.incomeDesc")}</p>
                        {negative.income && (
                            <p id="sc-income-error" role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">
                                {t("inputs.errorNegative")}
                            </p>
                        )}
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
                                aria-describedby={negative.fixed ? "sc-fixed-desc sc-fixed-error" : "sc-fixed-desc"}
                                aria-invalid={negative.fixed}
                                type="number"
                                min="0"
                                step="50"
                                value={fixedExpenses}
                                onChange={handleInput(setFixedExpenses)}
                                className={`${inputClass} pl-8 pr-3`}
                            />
                        </div>
                        <p id="sc-fixed-desc" className="text-xs text-muted-foreground">{t("inputs.fixedDesc")}</p>
                        {negative.fixed && (
                            <p id="sc-fixed-error" role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">
                                {t("inputs.errorNegative")}
                            </p>
                        )}
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
                                aria-describedby={negative.variable ? "sc-variable-desc sc-variable-error" : "sc-variable-desc"}
                                aria-invalid={negative.variable}
                                type="number"
                                min="0"
                                step="50"
                                value={variableExpenses}
                                onChange={handleInput(setVariableExpenses)}
                                className={`${inputClass} pl-8 pr-3`}
                            />
                        </div>
                        <p id="sc-variable-desc" className="text-xs text-muted-foreground">{t("inputs.variableDesc")}</p>
                        {negative.variable && (
                            <p id="sc-variable-error" role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">
                                {t("inputs.errorNegative")}
                            </p>
                        )}
                    </div>

                    {/* Goal toggle section */}
                    <div className="border-t border-border pt-6 space-y-4">
                        <button
                            onClick={handleGoalToggle}
                            className="flex items-center gap-2 text-sm text-[#9a5a3a] dark:text-primary font-medium hover:opacity-80 transition-colors"
                            aria-expanded={showGoal}
                            aria-controls="sc-goal-fields"
                            aria-describedby="sc-goal-hint"
                        >
                            <span
                                className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center text-xs leading-none flex-shrink-0"
                                aria-hidden="true"
                            >
                                {showGoal ? "−" : "+"}
                            </span>
                            {showGoal ? t("inputs.goalHide") : t("inputs.goalToggle")}
                        </button>
                        <p id="sc-goal-hint" className="text-xs text-muted-foreground">{t("inputs.goalHint")}</p>

                        {showGoal && (
                            <div id="sc-goal-fields" className="space-y-4">
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
                                            aria-describedby={negative.goal ? "sc-goal-desc sc-goal-error" : "sc-goal-desc"}
                                            aria-invalid={negative.goal}
                                            type="number"
                                            min="0"
                                            step="500"
                                            value={totalGoal || ""}
                                            placeholder="0"
                                            onChange={handleInput(setTotalGoal, true)}
                                            className={`${inputClass} pl-8 pr-3`}
                                        />
                                    </div>
                                    <p id="sc-goal-desc" className="text-xs text-muted-foreground">
                                        {t("inputs.totalGoalDesc")}
                                    </p>
                                    {negative.goal && (
                                        <p id="sc-goal-error" role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">
                                            {t("inputs.errorNegative")}
                                        </p>
                                    )}
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
                                        aria-describedby={monthsInvalid ? "sc-months-desc sc-months-error" : "sc-months-desc"}
                                        aria-invalid={monthsInvalid}
                                        type="number"
                                        min="1"
                                        max="240"
                                        step="1"
                                        value={months || ""}
                                        placeholder="12"
                                        onChange={handleInput(setMonths, true)}
                                        className={`${inputClass} px-3`}
                                    />
                                    <p id="sc-months-desc" className="text-xs text-muted-foreground">
                                        {t("inputs.monthsDesc")}
                                    </p>
                                    {monthsInvalid && (
                                        <p id="sc-months-error" role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">
                                            {t("inputs.errorMonths")}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* En móvil el resultado queda debajo del formulario: acceso directo con teclado y táctil */}
                    {income > 0 && (
                        <button
                            type="button"
                            onClick={focusResults}
                            className="lg:hidden w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ring-offset-background"
                        >
                            {t("inputs.seeResult")}
                        </button>
                    )}
                </aside>

                {/* Results area */}
                <div
                    ref={resultsRef}
                    tabIndex={-1}
                    role="region"
                    aria-label={t("results.regionLabel")}
                    className="lg:col-span-8 space-y-6 scroll-mt-24 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ring-offset-background rounded-2xl"
                >
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

                                <p className="text-base md:text-lg font-medium text-foreground">
                                    {margenReal < 0
                                        ? t("results.summaryDeficit", { deficit: fmt(-margenReal) })
                                        : t("results.summary", { margin: fmt(margenReal), rate: Math.round(savingsRate) })}
                                </p>

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
                                                    ? "text-emerald-700 dark:text-emerald-400"
                                                    : savingsRate >= 10
                                                    ? "text-[#9a5a3a] dark:text-primary"
                                                    : "text-amber-700 dark:text-amber-400"
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
                                        aria-label={t("results.breakdown.aria", {
                                            fixed: Math.round(fixedPct),
                                            variable: Math.round(varPct),
                                            margin: Math.round(marginBarPct),
                                        })}
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
                                                        ? "text-emerald-700 dark:text-emerald-400"
                                                        : "text-amber-700 dark:text-amber-400"
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
                                                                    ? "text-emerald-700 dark:text-emerald-400"
                                                                    : "text-amber-700 dark:text-amber-400"
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
                                <p className="text-sm text-background/90 max-w-md mx-auto">{ctaByStatus[status]}</p>
                                <Link
                                    href={CTA_HREF}
                                    onClick={handleCtaClick}
                                    className="inline-block bg-background text-foreground font-semibold px-8 py-3 rounded-full hover:opacity-90 transition-opacity text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background focus-visible:ring-offset-2 focus-visible:ring-offset-foreground"
                                >
                                    {t("results.ctaButton")}
                                </Link>
                                <p className="text-xs text-background/70">{t("results.ctaNote")}</p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Interpretation section */}
            <div className="max-w-3xl mx-auto space-y-4">
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
                    {t("interpretation.title")}
                </h2>
                <div className="space-y-3">
                    {INTERPRETATION_ITEMS.map(({ key, border, label }) => (
                        <div
                            key={key}
                            className={`border-l-4 ${border} bg-card border border-border rounded-r-xl p-4 space-y-1`}
                        >
                            <p className={`text-sm font-semibold ${label}`}>
                                {t(`interpretation.${key}.label`)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {t(`interpretation.${key}.text`)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {t(`interpretation.${key}.action`)}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Why this calculator */}
            <div className="max-w-3xl mx-auto space-y-4">
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
                    {t("content.whyTitle")}
                </h2>
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground font-light leading-relaxed">
                        {t("content.whyText1")}
                    </p>
                    <p className="text-sm text-muted-foreground font-light leading-relaxed">
                        {t.rich("content.whyText2", {
                            bold: (chunks) => <strong className="font-semibold text-foreground">{chunks}</strong>,
                        })}
                    </p>
                </div>
            </div>

            {/* Related resources */}
            <div className="max-w-3xl mx-auto mt-10 pt-8 border-t border-border space-y-4">
                <h3 className="text-lg md:text-xl font-serif font-semibold text-foreground">
                    {t("content.interlinkingTitle")}
                </h3>
                <ul className="space-y-2">
                    <li>
                        <Link
                            href="/blog/como-hacer-un-presupuesto-personal"
                            className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ring-offset-background"
                        >
                            <span>{t("content.link0")}</span>
                            <ArrowRight className="w-4 h-4 flex-none text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary" />
                        </Link>
                    </li>
                    <li>
                        <Link
                            href="/blog/metodo-kakebo-para-autonomos"
                            className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ring-offset-background"
                        >
                            <span>{t("content.link1")}</span>
                            <ArrowRight className="w-4 h-4 flex-none text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary" />
                        </Link>
                    </li>
                    <li>
                        <Link
                            href="/blog/ahorro-pareja"
                            className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ring-offset-background"
                        >
                            <span>{t("content.link2")}</span>
                            <ArrowRight className="w-4 h-4 flex-none text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary" />
                        </Link>
                    </li>
                    <li>
                        <Link
                            href="/herramientas/calculadora-inflacion"
                            className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ring-offset-background"
                        >
                            <span>{t("content.link3")}</span>
                            <ArrowRight className="w-4 h-4 flex-none text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary" />
                        </Link>
                    </li>
                    <li>
                        <Link
                            href="/blog/como-ahorrar-dinero-cada-mes"
                            className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ring-offset-background"
                        >
                            <span>{t("content.link4")}</span>
                            <ArrowRight className="w-4 h-4 flex-none text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary" />
                        </Link>
                    </li>
                    {/* Este artículo solo existe en español (no hay cuentas-remuneradas.en.mdx): no se enlaza desde la
                        versión inglesa. En español se usa un enlace sin prefijo de idioma (URL canónica). */}
                    {locale === "es" && (
                        <li>
                        <NextLink
                            href="/blog/cuentas-remuneradas"
                            className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ring-offset-background"
                        >
                            <span>{t("content.link5")}</span>
                            <ArrowRight className="w-4 h-4 flex-none text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary" />
                        </NextLink>
                    </li>
                    )}
                    <li>
                        <Link
                            href="/blog/eliminar-gastos-hormiga"
                            className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ring-offset-background"
                        >
                            <span>{t("content.link6")}</span>
                            <ArrowRight className="w-4 h-4 flex-none text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary" />
                        </Link>
                    </li>
                </ul>
            </div>
        </div>
    );
}
