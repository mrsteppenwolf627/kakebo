"use client";

import { useState, useEffect, useRef } from "react";
import { Link } from "@/i18n/routing";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { analytics } from "@/lib/analytics";
import { useTranslations } from "next-intl";
import { EmbedModal } from "./EmbedModal";

const INE_LINKS = {
    ipc: "https://www.ine.es/ipc/",
    irav: "https://www.ine.es/jaxiT3/Tabla.htm?t=72975",
    rentTool: "https://www.ine.es/dyngs/IPC/es/index.htm?cid=1436",
    varipc: "https://www.ine.es/varipc/",
};

function externalLink(href: string) {
    return function ExternalLink(chunks: React.ReactNode) {
        return (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-dotted underline-offset-2 hover:text-foreground transition-colors"
            >
                {chunks}
            </a>
        );
    };
}

export function CalculatorInflation() {
    const t = useTranslations("Tools.Inflation");
    const tCommon = useTranslations("Tools.Common.embed");
    const [isEmbedOpen, setIsEmbedOpen] = useState(false);
    const [savings, setSavings] = useState(10000);
    const [inflationRate, setInflationRate] = useState(3);
    const [years, setYears] = useState(10);
    const hasTrackedUse = useRef(false);

    useEffect(() => {
        analytics.track("tool_viewed", { tool_name: "calculadora_inflacion" });
    }, []);

    const trackFirstUse = () => {
        if (!hasTrackedUse.current) {
            hasTrackedUse.current = true;
            analytics.track("use_inflation_calculator", { tool_name: "calculadora_inflacion" });
        }
    };

    // Generate data for the chart
    const data = Array.from({ length: years + 1 }, (_, i) => {
        const nominalValue = savings;
        // Formula: Real Value = Nominal Value / (1 + inflation_rate)^year
        const realValue = savings / Math.pow(1 + inflationRate / 100, i);

        return {
            year: i,
            name: `${t('chart.year')} ${i}`,
            nominal: nominalValue,
            real: Math.round(realValue),
            lost: Math.round(nominalValue - realValue),
        };
    });

    const finalRealValue = data[data.length - 1].real;
    const totalLost = savings - finalRealValue;
    const lostPercentage = ((totalLost / savings) * 100).toFixed(1);

    const formatMoney = (amount: number) =>
        new Intl.NumberFormat("es-ES", {
            style: "currency",
            currency: "EUR",
            maximumFractionDigits: 0,
        }).format(amount);

    return (
        <div className="max-w-6xl mx-auto space-y-16">

            {/* Header */}
            <div className="text-center space-y-6">
                <h1 className="text-5xl md:text-7xl font-serif text-foreground leading-[1.1]">
                    {t.rich('header.title', {
                        italic: (chunks) => <span className="italic text-red-500 dark:text-red-400">{chunks}</span>
                    })}
                </h1>
                <p className="text-xl text-muted-foreground font-light max-w-2xl mx-auto">
                    {t('header.subtitle')}
                </p>
            </div>

            {/* Calculator Layout: Grid on Desktop */}
            <div className="grid lg:grid-cols-12 gap-8 items-start">

                {/* Left Sidebar: Inputs */}
                <aside className="lg:col-span-4 bg-card border border-border p-8 rounded-2xl shadow-sm space-y-8 sticky top-24">
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <label htmlFor="savings-input" className="text-xs font-bold text-muted-foreground uppercase tracking-widest block">
                                {t('inputs.savings')}
                            </label>
                            <div className="relative">
                                <input
                                    id="savings-input"
                                    type="number"
                                    min="0"
                                    step="1000"
                                    value={savings}
                                    onChange={(e) => { setSavings(Number(e.target.value)); trackFirstUse(); }}
                                    className="w-full text-3xl font-serif border-b-2 border-stone-200 dark:border-stone-800 focus:border-stone-900 dark:focus:border-stone-400 outline-none py-2 bg-transparent transition-colors text-foreground"
                                />
                                <span className="absolute right-0 top-3 text-muted-foreground font-serif">€</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label htmlFor="inflation-input" className="text-xs font-bold text-muted-foreground uppercase tracking-widest block">
                                {t('inputs.inflation')}
                            </label>
                            <div className="relative">
                                <input
                                    id="inflation-input"
                                    type="number"
                                    min="0"
                                    max="50"
                                    step="0.1"
                                    value={inflationRate}
                                    onChange={(e) => { setInflationRate(Number(e.target.value)); trackFirstUse(); }}
                                    className="w-full text-3xl font-serif border-b-2 border-stone-200 dark:border-stone-800 focus:border-stone-900 dark:focus:border-stone-400 outline-none py-2 bg-transparent transition-colors text-red-500 dark:text-red-400"
                                />
                                <span className="absolute right-0 top-3 text-muted-foreground font-serif">%</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {t.rich('inputs.inflationDisclaimer', { ipcLink: externalLink(INE_LINKS.ipc) })}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <label htmlFor="years-input" className="text-xs font-bold text-muted-foreground uppercase tracking-widest block">
                                {t('inputs.years')}
                            </label>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-3xl font-serif text-foreground">{years} <small className="text-sm font-light text-muted-foreground uppercase">Años</small></span>
                                </div>
                                <input
                                    id="years-input"
                                    type="range"
                                    min="1"
                                    max="40"
                                    step="1"
                                    value={years}
                                    onChange={(e) => { setYears(Number(e.target.value)); trackFirstUse(); }}
                                    className="w-full h-2 bg-stone-100 dark:bg-stone-800 rounded-lg appearance-none cursor-pointer accent-stone-900 dark:accent-stone-100"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-border">
                        <button
                            onClick={() => setIsEmbedOpen(true)}
                            className="w-full inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors p-3 border border-dashed border-border rounded-lg"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                            {tCommon('button')}
                        </button>
                    </div>
                </aside>

                {/* Main Content: Results + Chart */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Calculator Card */}
                    <div className="bg-card border border-border p-8 md:p-12 rounded-2xl shadow-sm space-y-12 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-stone-200 dark:from-stone-800 via-red-400 dark:via-red-500 to-stone-200 dark:to-stone-800"></div>

                        {/* Results Overview */}
                        <div className="grid md:grid-cols-2 gap-8 items-stretch">
                            {/* Main Stat: Loss */}
                            <div className="bg-red-50 dark:bg-red-900/10 p-8 rounded-xl border border-red-100 dark:border-red-900/30 flex flex-col justify-center text-center space-y-2">
                                <span className="text-xs text-red-600 dark:text-red-400 font-bold uppercase tracking-widest">
                                    {t('results.lossLabel')}
                                </span>
                                <span className="text-5xl font-serif text-red-600 dark:text-red-300">
                                    -{formatMoney(totalLost)}
                                </span>
                                <span className="text-red-400 font-light text-lg">
                                    {t.rich('results.lossText', {
                                        percentage: lostPercentage,
                                        strong: (chunks) => <strong className="font-bold">{chunks}</strong>
                                    })}
                                </span>
                            </div>

                            {/* Secondary Stat: Real Value */}
                            <div className="bg-stone-50 dark:bg-stone-900/50 p-8 rounded-xl border border-stone-100 dark:border-stone-800 flex flex-col justify-center text-center space-y-2">
                                <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                                    {t('results.realLabel')}
                                </span>
                                <span className="text-5xl font-serif text-foreground">
                                    {formatMoney(finalRealValue)}
                                </span>
                                <span className="text-muted-foreground font-light text-lg">
                                    {t('results.realText')}
                                </span>
                            </div>
                        </div>

                        {/* Chart */}
                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={data}
                                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                >
                                    <defs>
                                        <linearGradient id="colorNominal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#e7e5e4" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#e7e5e4" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#1c1917" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#1c1917" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                                    <XAxis
                                        dataKey="year"
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fill: '#a8a29e', fontSize: 12 }}
                                        interval={Math.floor(years / 5)}
                                    />
                                    <YAxis
                                        tickFormatter={(value) => `${value / 1000}k`}
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fill: '#a8a29e', fontSize: 12 }}
                                    />
                                    <Tooltip
                                        formatter={(value: number | string | Array<number | string> | undefined) => [formatMoney(Number(value || 0)), ""]}
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e7e5e4' }}
                                        labelFormatter={(label) => `${t('chart.year')} ${label}`}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="nominal"
                                        name={t('chart.nominal')}
                                        stroke="#a8a29e"
                                        fillOpacity={1}
                                        fill="url(#colorNominal)"
                                        strokeDasharray="5 5"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="real"
                                        name={t('chart.real')}
                                        stroke="#1c1917"
                                        fillOpacity={1}
                                        fill="url(#colorReal)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* CTA Internal */}
                        <div className="bg-stone-900 dark:bg-stone-800 text-white p-10 rounded-xl text-center space-y-8">
                            <p className="text-3xl font-serif">
                                {t('cta.title')}
                            </p>
                            <p className="text-stone-300 font-light max-w-lg mx-auto text-lg leading-relaxed">
                                {t('cta.text')}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-6 justify-center">
                                <Link
                                    href="/login?source=calculator_inflation"
                                    onClick={() => analytics.track("click_tool_to_app", { tool_name: "calculadora_inflacion", cta_location: "calculator_cta" })}
                                    className="inline-block bg-white text-stone-900 px-10 py-4 rounded-full font-bold hover:bg-stone-100 dark:hover:bg-stone-200 transition-all hover:scale-105"
                                >
                                    {t('cta.buttonPrimary')}
                                </Link>
                                <Link
                                    href="/herramientas/regla-50-30-20"
                                    onClick={() => analytics.track("tool_interaction", { tool_name: "calculadora_inflacion", action: "cross_sell" })}
                                    className="inline-block border border-stone-700 text-stone-300 px-10 py-4 rounded-full font-bold hover:bg-stone-800 transition-all"
                                >
                                    {t('cta.buttonSecondary')}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SEO & GEO Semantic Content Section */}
            <div className="prose prose-stone dark:prose-invert max-w-4xl mx-auto prose-headings:font-serif prose-p:font-light prose-p:text-xl text-muted-foreground leading-relaxed">

                {/* Definition Block for LLMs */}
                <div className="bg-stone-50 dark:bg-stone-900/50 p-6 rounded-lg border-l-4 border-stone-900 dark:border-stone-100 my-8">
                    <h2 className="mt-0 text-2xl text-foreground">{t('content.whatTitle')}</h2>
                    <p className="mb-0">
                        {t.rich('content.whatText', {
                            bold: (chunks) => <strong>{chunks}</strong>,
                            italic: (chunks) => <em>{chunks}</em>
                        })}
                    </p>
                </div>

                <h2>{t('content.impactTitle')}</h2>
                <p>
                    {t('content.impactText')}
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li>{t.rich('content.impactList.today', { bold: (chunks) => <strong>{chunks}</strong> })}</li>
                    <li>{t.rich('content.impactList.future', { bold: (chunks) => <strong>{chunks}</strong> })}</li>
                    <li>{t.rich('content.impactList.problem', { bold: (chunks) => <strong>{chunks}</strong> })}</li>
                </ul>

                <h2>{t('content.rentTitle')}</h2>
                <p>
                    {t.rich('content.rentText', {
                        iravLink: externalLink(INE_LINKS.irav),
                        rentToolLink: externalLink(INE_LINKS.rentTool)
                    })}
                </p>

                <h2>{t('content.accumulatedTitle')}</h2>
                <p>
                    {t('content.accumulatedText')}
                </p>

                <h3>{t('content.tableTitle')}</h3>
                <div className="overflow-x-auto my-8">
                    <table className="min-w-full text-left text-sm whitespace-nowrap">
                        <thead className="uppercase tracking-wider border-b-2 border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50">
                            <tr>
                                <th scope="col" className="px-6 py-4 font-serif text-foreground">{t('content.tableHeaders.strategy')}</th>
                                <th scope="col" className="px-6 py-4 font-serif text-foreground">{t('content.tableHeaders.return')}</th>
                                <th scope="col" className="px-6 py-4 font-serif text-foreground">{t('content.tableHeaders.realResult')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 dark:divide-stone-800/50">
                            <tr className="bg-white dark:bg-transparent hover:bg-stone-50 dark:hover:bg-stone-900/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-foreground">{t('content.tableRows.mattress.name')}</td>
                                <td className="px-6 py-4">{t('content.tableRows.mattress.return')}</td>
                                <td className="px-6 py-4 text-red-600 dark:text-red-400">{t('content.tableRows.mattress.result')}</td>
                            </tr>
                            <tr className="bg-white dark:bg-transparent hover:bg-stone-50 dark:hover:bg-stone-900/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-foreground">{t('content.tableRows.savings.name')}</td>
                                <td className="px-6 py-4">{t('content.tableRows.savings.return')}</td>
                                <td className="px-6 py-4 text-orange-500 dark:text-orange-400">{t('content.tableRows.savings.result')}</td>
                            </tr>
                            <tr className="bg-white dark:bg-transparent hover:bg-stone-50 dark:hover:bg-stone-900/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-foreground">{t('content.tableRows.investment.name')}</td>
                                <td className="px-6 py-4">{t('content.tableRows.investment.return')}</td>
                                <td className="px-6 py-4 text-emerald-600 dark:text-emerald-400">{t('content.tableRows.investment.result')}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <p className="text-sm text-muted-foreground italic">
                    {t('content.tableNote')}
                </p>

                <h2>{t('content.methodologyTitle')}</h2>
                <p>
                    {t.rich('content.methodologyIntro', { bold: (chunks) => <strong>{chunks}</strong> })}
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li>{t('content.methodologyList.manualRate')}</li>
                    <li>{t('content.methodologyList.formula')}</li>
                    <li>{t('content.methodologyList.noHistorical')}</li>
                    <li>{t.rich('content.methodologyList.orientative', { ipcLink: externalLink(INE_LINKS.ipc) })}</li>
                </ul>

                <h3>{t('content.limitationsTitle')}</h3>
                <ul className="list-disc pl-5 space-y-2">
                    <li>{t('content.limitationsList.realRate')}</li>
                    <li>{t('content.limitationsList.average')}</li>
                    <li>{t('content.limitationsList.noFees')}</li>
                    <li>{t('content.limitationsList.noAdvice')}</li>
                </ul>

                <h2>{t('content.faqTitle')}</h2>

                <div className="space-y-8">
                    <div>
                        <h3 className="text-xl font-bold text-foreground mt-6">{t('content.faq.q1')}</h3>
                        <p>
                            {t.rich('content.faq.a1', {
                                bold: (chunks) => <strong>{chunks}</strong>,
                                ipcLink: externalLink(INE_LINKS.ipc)
                            })}
                        </p>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-foreground mt-6">{t('content.faq.q2')}</h3>
                        <p>
                            {t('content.faq.a2')}
                        </p>
                        <code className="block bg-stone-100 dark:bg-stone-800 p-4 rounded text-sm font-mono text-stone-800 dark:text-stone-200 my-4">
                            Tasa Variación = ((IPC Final - IPC Inicial) / IPC Inicial) x 100
                        </code>
                        <p>
                            {t.rich('content.faq.a2b', {
                                bold: (chunks) => <strong>{chunks}</strong>,
                                rentToolLink: externalLink(INE_LINKS.rentTool),
                                varipcLink: externalLink(INE_LINKS.varipc)
                            })}
                        </p>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-foreground mt-6">{t('content.faq.q3')}</h3>
                        <p>
                            {t.rich('content.faq.a3', { varipcLink: externalLink(INE_LINKS.varipc) })}
                        </p>
                    </div>
                </div>

                <h3 className="mt-12 text-2xl mb-4 font-serif text-foreground">{t('content.interlinkingTitle')}</h3>
                <ul>
                    <li>
                        <Link href="/blog/alternativas-a-app-bancarias" className="text-primary hover:underline">
                            {t('content.link1')}
                        </Link>
                    </li>
                    <li>
                        <Link href="/blog/kakebo-vs-ynab" className="text-primary hover:underline">
                            {t('content.link2')}
                        </Link>
                    </li>
                </ul>

                <p className="text-sm text-muted-foreground mt-8 not-prose">
                    {t('content.revisionNote')}
                </p>

            </div>

            <EmbedModal
                isOpen={isEmbedOpen}
                onClose={() => setIsEmbedOpen(false)}
                toolPath="/herramientas/calculadora-inflacion"
            />
        </div>
    );
}
