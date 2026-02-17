import { useState, useEffect } from "react";
import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import { analytics } from "@/lib/analytics";
import { useTranslations } from "next-intl";

export function Calculator503020() {
    const t = useTranslations("Tools.Rule503020");
    const [income, setIncome] = useState(2000);

    useEffect(() => {
        analytics.track("tool_viewed", { tool: "503020_calculator" });
    }, []);

    const needs = income * 0.5;
    const wants = income * 0.3;
    const savings = income * 0.2;

    const data = [
        { name: t('chart.needs'), value: needs, color: "#1c1917" }, // stone-900
        { name: t('chart.savings'), value: savings, color: "#10b981" },    // emerald-500
        { name: t('chart.wants'), value: wants, color: "#f59e0b" },      // amber-500
    ];

    const formatMoney = (amount: number) =>
        new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(amount);

    return (
        <div className="max-w-4xl mx-auto space-y-16">

            {/* Header */}
            <div className="text-center space-y-6">
                <h1 className="text-5xl md:text-6xl font-serif text-stone-900 leading-[1.1]">
                    {t.rich('header.title', {
                        italic: (chunks) => <span className="italic text-stone-500">{chunks}</span>
                    })}
                </h1>
                <p className="text-xl text-stone-600 font-light max-w-2xl mx-auto">
                    {t('header.subtitle')}
                </p>
            </div>

            {/* Calculator Card */}
            <div className="bg-white border border-stone-200 p-8 md:p-12 rounded-2xl shadow-sm space-y-12">

                {/* Input Section */}
                <div className="space-y-8 max-w-xl mx-auto text-center">
                    <div className="space-y-4">
                        <label className="text-sm font-medium text-stone-500 uppercase tracking-wider">
                            {t('inputs.income')}
                        </label>
                        <div className="flex items-center justify-center gap-4">
                            <span className="text-4xl md:text-5xl font-serif text-stone-900">
                                {formatMoney(income)}
                            </span>
                        </div>
                        <input
                            type="range"
                            min="500"
                            max="10000"
                            step="50"
                            value={income}
                            onChange={(e) => setIncome(Number(e.target.value))}
                            className="w-full h-2 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-stone-900"
                            aria-label="Selector de ingresos mensuales netos"
                        />
                    </div>
                </div>

                {/* Results Grid */}
                <div className="grid md:grid-cols-2 gap-12 items-center">

                    {/* Chart */}
                    <div className="h-[300px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number | string | Array<number | string> | undefined) => [formatMoney(Number(value || 0)), ""]}
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e7e5e4' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center text on donut */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-stone-400 text-sm font-light">{t('chart.center')}</span>
                        </div>
                    </div>

                    {/* Legend / Breakdown */}
                    <div className="space-y-6">
                        <div className="p-4 bg-stone-50 rounded-xl border border-stone-100">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-stone-900" />
                                    <span className="font-medium text-stone-900">{t('legend.needs.label')}</span>
                                </div>
                                <span className="text-xl font-serif text-stone-900">{formatMoney(needs)}</span>
                            </div>
                            <p className="text-xs text-stone-500 pl-5">
                                {t('legend.needs.desc')}
                            </p>
                        </div>

                        <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100/50">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                                    <span className="font-medium text-stone-900">{t('legend.wants.label')}</span>
                                </div>
                                <span className="text-xl font-serif text-stone-900">{formatMoney(wants)}</span>
                            </div>
                            <p className="text-xs text-stone-500 pl-5">
                                {t('legend.wants.desc')}
                            </p>
                        </div>

                        <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100/50">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                    <span className="font-medium text-stone-900">{t('legend.savings.label')}</span>
                                </div>
                                <span className="text-xl font-serif text-stone-900">{formatMoney(savings)}</span>
                            </div>
                            <p className="text-xs text-stone-500 pl-5">
                                {t('legend.savings.desc')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="bg-stone-900 text-white p-8 rounded-xl text-center space-y-6">
                    <h3 className="text-2xl font-serif">
                        {t('cta.title')}
                    </h3>
                    <p className="text-stone-300 font-light max-w-lg mx-auto">
                        {t('cta.text')}
                    </p>
                    <Link
                        href="/login?source=calculator_503020"
                        onClick={() => analytics.track("signup_click", { source: "calculator_503020", type: "primary" })}
                        className="inline-block bg-white text-stone-900 px-8 py-3 rounded-full font-medium hover:bg-stone-100 transition-colors"
                    >
                        {t('cta.button')}
                    </Link>
                </div>

            </div>

            {/* SEO Content Section - Keeping it in Client Component for simplicity of layout, but could be passed as children */}
            <div className="prose prose-stone max-w-none prose-headings:font-serif prose-p:font-light prose-p:text-lg text-stone-600">
                <h2>¿Qué es la regla 50/30/20?</h2>
                <p>
                    Popularizada por la senadora estadounidense Elizabeth Warren en su libro <em>"All Your Worth: The Ultimate Lifetime Money Plan"</em>,
                    la regla 50/30/20 es el método más sencillo y eficaz para gestionar tus finanzas personales si odias los presupuestos complicados.
                </p>
                <p>
                    La premisa es simple: no necesitas trackear cada céntimo obsesivamente (aunque <strong>Kakebo</strong> te ayuda a hacerlo fácil),
                    sino dividir tu ingreso neto mensual en tres grandes cubos:
                </p>

                <div className="grid md:grid-cols-3 gap-8 my-12 not-prose">
                    <div className="space-y-2">
                        <span className="text-4xl font-serif text-stone-900 block">50%</span>
                        <h3 className="font-bold text-stone-900 text-lg">Necesidades</h3>
                        <p className="text-sm">Gastos fijos y esenciales. Si perrieras tu trabajo, estos son los gastos que seguirías teniendo que pagar.</p>
                    </div>
                    <div className="space-y-2">
                        <span className="text-4xl font-serif text-amber-500 block">30%</span>
                        <h3 className="font-bold text-stone-900 text-lg">Deseos</h3>
                        <p className="text-sm">Gastos variables que mejoran tu calidad de vida. Son flexibles y los primeros en cortarse en tiempos difíciles.</p>
                    </div>
                    <div className="space-y-2">
                        <span className="text-4xl font-serif text-emerald-500 block">20%</span>
                        <h3 className="font-bold text-stone-900 text-lg">Ahorro</h3>
                        <p className="text-sm">Tu pasaporte a la libertad financiera. Fondo de emergencia, inversión a largo plazo y pago de deudas.</p>
                    </div>
                </div>

                <h2>¿Cómo usar esta calculadora de ahorro?</h2>
                <ol>
                    <li><strong>Introduce tus ingresos netos:</strong> Es la cantidad final que llega a tu banco cada mes (después de impuestos).</li>
                    <li><strong>Ajusta tus gastos fijos:</strong> Intenta que tu alquiler/hipoteca + facturas no supere la mitad de ese número.</li>
                    <li><strong>Automatiza tu ahorro:</strong> Configura una transferencia automática del 20% a otra cuenta (o a Kakebo) nada más cobrar.</li>
                </ol>
            </div>

        </div>
    );
}
