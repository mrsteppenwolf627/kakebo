import Link from "next/link";

export function SeoContent() {
    return (
        <section className="mx-auto max-w-5xl px-4 py-12 border-t border-border mt-12">
            <div className="prose prose-sm prose-stone dark:prose-invert max-w-none text-muted-foreground">
                <h3 className="text-lg font-serif font-medium text-foreground mb-4">
                    Controla tus finanzas en España con Kakebo
                </h3>

                <div className="grid gap-8 md:grid-cols-2 mb-12">
                    <article>
                        <h4 className="text-sm font-semibold text-foreground mb-2">¿Qué es el método Kakebo?</h4>
                        <p className="text-sm font-light leading-relaxed">
                            El <strong>Kakebo</strong> (pronunciado "kah-keh-boh") es el arte japonés de ahorrar dinero.
                            No es solo una app de control de gastos; es una filosofía que te invita a reflexionar sobre
                            tus hábitos de consumo. Kakebo adapta este método centenario a la era digital para
                            usuarios en <strong>España</strong> y la zona euro.
                        </p>
                    </article>

                    <article>
                        <h4 className="text-sm font-semibold text-foreground mb-2">Ahorro inteligente en Euros</h4>
                        <p className="text-sm font-light leading-relaxed">
                            Diseñada específicamente para la gestión económica en <strong>euros (€)</strong>, nuestra
                            plataforma te permite categorizar gastos vitales (Supervivencia), disfrutar de la vida
                            (Ocio y Vicio), cultivar tu mente (Cultura) y prever imprevistos (Extra).
                            Es la herramienta ideal para quienes buscan una <strong>app de finanzas personales gratuita</strong>
                            y efectiva.
                        </p>
                    </article>
                </div>

                {/* Comparison Table for SEO */}
                <div className="mb-12 overflow-x-auto">
                    <h4 className="text-sm font-semibold text-foreground mb-4">¿Por qué usar Kakebo vs Excel?</h4>
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="py-2 font-medium text-foreground">Característica</th>
                                <th className="py-2 font-medium text-primary">Kakebo</th>
                                <th className="py-2 font-medium text-muted-foreground">Excel / Hojas de cálculo</th>
                                <th className="py-2 font-medium text-muted-foreground">Apps de Bancos</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-border/50">
                                <td className="py-2 text-foreground">Automatización</td>
                                <td className="py-2">✅ Agente IA Inteligente</td>
                                <td className="py-2">❌ Manual y tedioso</td>
                                <td className="py-2">⚠️ Solo sus propias cuentas</td>
                            </tr>
                            <tr className="border-b border-border/50">
                                <td className="py-2 text-foreground">Método de Ahorro</td>
                                <td className="py-2">✅ Filosofía Kakebo integrada</td>
                                <td className="py-2">❌ Solo números, sin método</td>
                                <td className="py-2">❌ Solo historial de transacciones</td>
                            </tr>
                            <tr className="border-b border-border/50">
                                <td className="py-2 text-foreground">Privacidad</td>
                                <td className="py-2">✅ 100% Privado (Tú controlas los datos)</td>
                                <td className="py-2">✅ Privado (Local)</td>
                                <td className="py-2">❌ Venden perfiles comerciales</td>
                            </tr>
                            <tr>
                                <td className="py-2 text-foreground">Soporte Móvil</td>
                                <td className="py-2">✅ Web App Optimizada (PWA)</td>
                                <td className="py-2">❌ Incómodo en pantallas pequeñas</td>
                                <td className="py-2">✅ Buena App Nativa</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="mt-6 flex flex-wrap gap-4 text-xs opacity-60">
                    <span>Kakebo App España</span> •
                    <span>Control de gastos mensual</span> •
                    <span>Ahorro doméstico</span> •
                    <span>Finanzas personales</span> •
                    <span>Alternativa a Fintonic</span> •
                    <span>Plantilla Kakebo Excel</span>
                </div>
            </div>
        </section>
    );
}
