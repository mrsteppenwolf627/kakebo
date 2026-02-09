import Link from "next/link";

export function SeoContent() {
    return (
        <section className="mx-auto max-w-5xl px-4 py-12 border-t border-border mt-12">
            <div className="prose prose-sm prose-stone dark:prose-invert max-w-none text-muted-foreground">
                <h3 className="text-lg font-serif font-medium text-foreground mb-4">
                    Controla tus finanzas en España con Kakebo AI
                </h3>

                <div className="grid gap-8 md:grid-cols-2">
                    <article>
                        <h4 className="text-sm font-semibold text-foreground mb-2">¿Qué es el método Kakebo?</h4>
                        <p className="text-sm font-light leading-relaxed">
                            El <strong>Kakebo</strong> (pronunciado "kah-keh-boh") es el arte japonés de ahorrar dinero.
                            No es solo una app de control de gastos; es una filosofía que te invita a reflexionar sobre
                            tus hábitos de consumo. Kakebo AI adapta este método centenario a la era digital para
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

                <div className="mt-6 flex flex-wrap gap-4 text-xs opacity-60">
                    <span>Kakebo App España</span> •
                    <span>Control de gastos mensual</span> •
                    <span>Ahorro doméstico</span> •
                    <span>Finanzas personales</span>
                </div>
            </div>
        </section>
    );
}
