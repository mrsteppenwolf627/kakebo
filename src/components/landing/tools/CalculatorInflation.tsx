"use client";

import { useState, useEffect } from "react";
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

export function CalculatorInflation() {
    const t = useTranslations("Tools.Inflation");
    const [savings, setSavings] = useState(10000);
    const [inflationRate, setInflationRate] = useState(3);
    const [years, setYears] = useState(10);

    useEffect(() => {
        analytics.track("tool_viewed", { tool: "inflation_calculator" });
    }, []);

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
        <div className="max-w-4xl mx-auto space-y-16">

            {/* Header */}
            <div className="text-center space-y-6">
                <h1 className="text-5xl md:text-6xl font-serif text-stone-900 leading-[1.1]">
                    {t.rich('header.title', {
                        italic: (chunks) => <span className="italic text-red-500">{chunks}</span>
                    })}
                </h1>
                <p className="text-xl text-stone-600 font-light max-w-2xl mx-auto">
                    {t('header.subtitle')}
                </p>
            </div>

            {/* Calculator Card */}
            <div className="bg-white border border-stone-200 p-8 md:p-12 rounded-2xl shadow-sm space-y-12 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-stone-200 via-red-400 to-stone-200"></div>

                {/* Input Section */}
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="space-y-4">
                        <label htmlFor="savings-input" className="text-sm font-medium text-stone-500 uppercase tracking-wider block">
                            {t('inputs.savings')}
                        </label>
                        <div className="relative">
                            <input
                                id="savings-input"
                                type="number"
                                min="0"
                                step="1000"
                                value={savings}
                                onChange={(e) => setSavings(Number(e.target.value))}
                                className="w-full text-2xl font-serif border-b-2 border-stone-200 focus:border-stone-900 outline-none py-2 bg-transparent transition-colors"
                            />
                            <span className="absolute right-0 top-3 text-stone-400">€</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label htmlFor="inflation-input" className="text-sm font-medium text-stone-500 uppercase tracking-wider block">
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
                                onChange={(e) => setInflationRate(Number(e.target.value))}
                                className="w-full text-2xl font-serif border-b-2 border-stone-200 focus:border-stone-900 outline-none py-2 bg-transparent transition-colors text-red-500"
                            />
                            <span className="absolute right-0 top-3 text-stone-400">%</span>
                        </div>
                        <p className="text-xs text-stone-400">
                            {t('inputs.inflationDisclaimer')}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <label htmlFor="years-input" className="text-sm font-medium text-stone-500 uppercase tracking-wider block">
                            {t('inputs.years')}
                        </label>
                        <div className="flex items-center gap-4">
                            <span className="text-2xl font-serif w-12">{years}</span>
                            <input
                                id="years-input"
                                type="range"
                                min="1"
                                max="40"
                                step="1"
                                value={years}
                                onChange={(e) => setYears(Number(e.target.value))}
                                className="w-full h-2 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-stone-900"
                            />
                        </div>
                    </div>
                </div>

                {/* Results Overview */}
                <div className="grid md:grid-cols-2 gap-8 items-stretch">

                    {/* Main Stat: Loss */}
                    <div className="bg-red-50 p-6 rounded-xl border border-red-100 flex flex-col justify-center text-center space-y-2">
                        <span className="text-sm text-red-600 font-medium uppercase tracking-wider">
                            {t('results.lossLabel')}
                        </span>
                        <span className="text-4xl md:text-5xl font-serif text-red-600">
                            -{formatMoney(totalLost)}
                        </span>
                        <span className="text-red-400 font-light">
                            {t.rich('results.lossText', {
                                percentage: lostPercentage,
                                strong: (chunks) => <strong>{chunks}</strong>
                            })}
                        </span>
                    </div>

                    {/* Secondary Stat: Real Value */}
                    <div className="bg-stone-50 p-6 rounded-xl border border-stone-100 flex flex-col justify-center text-center space-y-2">
                        <span className="text-sm text-stone-500 font-medium uppercase tracking-wider">
                            {t('results.realLabel')}
                        </span>
                        <span className="text-4xl md:text-5xl font-serif text-stone-900">
                            {formatMoney(finalRealValue)}
                        </span>
                        <span className="text-stone-400 font-light">
                            {t('results.realText')}
                        </span>
                    </div>

                </div>

                {/* Chart */}
                <div className="h-[350px] w-full">
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

                {/* CTA */}
                <div className="bg-stone-900 text-white p-8 rounded-xl text-center space-y-6">
                    <h3 className="text-2xl font-serif">
                        {t('cta.title')}
                    </h3>
                    <p className="text-stone-300 font-light max-w-lg mx-auto">
                        {t('cta.text')}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/login?source=calculator_inflation"
                            onClick={() => analytics.track("signup_click", { source: "calculator_inflation", type: "primary" })}
                            className="inline-block bg-white text-stone-900 px-8 py-3 rounded-full font-medium hover:bg-stone-100 transition-colors"
                        >
                            {t('cta.buttonPrimary')}
                        </Link>
                        <Link
                            href="/herramientas/regla-50-30-20"
                            onClick={() => analytics.track("tool_interaction", { tool: "inflation_calculator", action: "cross_sell" })}
                            className="inline-block border border-stone-700 text-stone-300 px-8 py-3 rounded-full font-medium hover:bg-stone-800 transition-colors"
                        >
                            {t('cta.buttonSecondary')}
                        </Link>
                    </div>
                </div>

            </div>

            {/* SEO & GEO Semantic Content Section */}
            <div className="prose prose-stone max-w-none prose-headings:font-serif prose-p:font-light prose-p:text-lg text-stone-600">

                {/* Definition Block for LLMs */}
                <div className="bg-stone-50 p-6 rounded-lg border-l-4 border-stone-900 my-8">
                    <h2 className="mt-0 text-2xl text-stone-900">{t('content.whatTitle')}</h2>
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

                <h3>{t('content.tableTitle')}</h3>
                <div className="overflow-x-auto my-8">
                    <table className="min-w-full text-left text-sm whitespace-nowrap">
                        <thead className="uppercase tracking-wider border-b-2 border-stone-200 bg-stone-50">
                            <tr>
                                <th scope="col" className="px-6 py-4 font-serif text-stone-900">{t('content.tableHeaders.strategy')}</th>
                                <th scope="col" className="px-6 py-4 font-serif text-stone-900">{t('content.tableHeaders.return')}</th>
                                <th scope="col" className="px-6 py-4 font-serif text-stone-900">{t('content.tableHeaders.realResult')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            <tr className="bg-white hover:bg-stone-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-stone-900">{t('content.tableRows.mattress.name')}</td>
                                <td className="px-6 py-4">{t('content.tableRows.mattress.return')}</td>
                                <td className="px-6 py-4 text-red-600">{t('content.tableRows.mattress.result')}</td>
                            </tr>
                            <tr className="bg-white hover:bg-stone-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-stone-900">{t('content.tableRows.savings.name')}</td>
                                <td className="px-6 py-4">{t('content.tableRows.savings.return')}</td>
                                <td className="px-6 py-4 text-orange-500">{t('content.tableRows.savings.result')}</td>
                            </tr>
                            <tr className="bg-white hover:bg-stone-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-stone-900">{t('content.tableRows.investment.name')}</td>
                                <td className="px-6 py-4">{t('content.tableRows.investment.return')}</td>
                                <td className="px-6 py-4 text-emerald-600">{t('content.tableRows.investment.result')}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <h2>{t('content.faqTitle')}</h2>

                <div className="space-y-8">
                    <div>
                        <h3 className="text-xl font-bold text-stone-900 mt-6">{t('content.faq.q1')}</h3>
                        <p>
                            {t.rich('content.faq.a1', { bold: (chunks) => <strong>{chunks}</strong> })}
                        </p>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-stone-900 mt-6">{t('content.faq.q2')}</h3>
                        <p>
                            {t('content.faq.a2')}
                        </p>
                        <code className="block bg-stone-100 p-4 rounded text-sm font-mono text-stone-800 my-4">
                            Tasa Variación = ((IPC Final - IPC Inicial) / IPC Inicial) x 100
                        </code>
                        <p>
                            {t.rich('content.faq.a2b', { bold: (chunks) => <strong>{chunks}</strong> })}
                        </p>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-stone-900 mt-6">{t('content.faq.q3')}</h3>
                        <p>
                            {t.rich('content.faq.a3', { bold: (chunks) => <strong>{chunks}</strong> })}
                        </p>
                    </div>
                </div>

            </div>

        </div>
    );
}
