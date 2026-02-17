import { useState, useEffect } from "react";
import Link from "next/link";
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
                    <h2 className="mt-0 text-2xl text-stone-900">¿Qué es la Inflación?</h2>
                    <p className="mb-0">
                        La <strong>inflación</strong> es el aumento generalizado y sostenido de los precios de bienes y servicios en una economía a lo largo del tiempo.
                        En España, se mide principalmente a través del <strong>IPC (Índice de Precios de Consumo)</strong>.
                        Cuando hay inflación, cada euro que tienes compra menos productos que antes; es decir, pierdes <em>poder adquisitivo</em>.
                    </p>
                </div>

                <h2>Entendiendo el Impacto de la Inflación en tus Ahorros</h2>
                <p>
                    Imagina que guardas 10.000€ en una caja fuerte hoy. Con una inflación media del 3% anual:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Hoy:</strong> Puedes comprar un coche pequeño por 10.000€.</li>
                    <li><strong>En 10 años:</strong> Ese mismo coche costará aproximadamente 13.439€.</li>
                    <li><strong>El problema:</strong> Tú sigues teniendo solo 10.000€ en la caja. Tu dinero "existe", pero vale mucho menos.</li>
                </ul>

                <h3>Comparativa: Ahorro vs Inversión vs Inflación</h3>
                <div className="overflow-x-auto my-8">
                    <table className="min-w-full text-left text-sm whitespace-nowrap">
                        <thead className="uppercase tracking-wider border-b-2 border-stone-200 bg-stone-50">
                            <tr>
                                <th scope="col" className="px-6 py-4 font-serif text-stone-900">Estrategia</th>
                                <th scope="col" className="px-6 py-4 font-serif text-stone-900">Rentabilidad Típica</th>
                                <th scope="col" className="px-6 py-4 font-serif text-stone-900">Resultado Real (con IPC 3%)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            <tr className="bg-white hover:bg-stone-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-stone-900">Bajo el colchón</td>
                                <td className="px-6 py-4">0%</td>
                                <td className="px-6 py-4 text-red-600">-3% anual (Pérdida)</td>
                            </tr>
                            <tr className="bg-white hover:bg-stone-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-stone-900">Cuenta de Ahorro</td>
                                <td className="px-6 py-4">1% - 2%</td>
                                <td className="px-6 py-4 text-orange-500">-1% a -2% (Pérdida leve)</td>
                            </tr>
                            <tr className="bg-white hover:bg-stone-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-stone-900">Inversión Indexada (S&P500)</td>
                                <td className="px-6 py-4">7% - 10%</td>
                                <td className="px-6 py-4 text-emerald-600">+4% a +7% (Ganancia Real)</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <h2>Preguntas Frecuentes sobre el IPC en España</h2>

                <div className="space-y-8">
                    <div>
                        <h3 className="text-xl font-bold text-stone-900 mt-6">¿Cuál es la diferencia entre IPC e Inflación?</h3>
                        <p>
                            Aunque se usan indistintamente, la <strong>inflación</strong> es el fenómeno económico (subida de precios), mientras que el <strong>IPC</strong> es la herramienta estadística que usa el INE para medirla.
                            El IPC se basa en una "cesta de la compra" representativa (alimentos, energía, transporte) de las familias españolas.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-stone-900 mt-6">¿Cómo calcular el IPC acumulado entre dos años?</h3>
                        <p>
                            La fórmula oficial para calcular la variación del IPC es:
                        </p>
                        <code className="block bg-stone-100 p-4 rounded text-sm font-mono text-stone-800 my-4">
                            Tasa Variación = ((IPC Final - IPC Inicial) / IPC Inicial) x 100
                        </code>
                        <p>
                            Esta fórmula es la que se utiliza legalmente para <strong>actualizar rentas de alquiler</strong> o revisiones salariales en convenios.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-stone-900 mt-6">¿Cuánto vale mi dinero de 2000 hoy en España?</h3>
                        <p>
                            Debido a la inflación acumulada en España desde el año 2000 (aproximadamente un 60-70% acumulado), para comprar lo mismo que comprabas con 1.000€ en el año 2000,
                            hoy necesitarías cerca de <strong>1.700€</strong>.
                        </p>
                    </div>
                </div>

            </div>

        </div>
    );
}
