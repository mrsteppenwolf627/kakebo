import { Link } from "@/i18n/routing";
import { ArrowRight, PieChart, TrendingUp } from "lucide-react";

export function ToolsSection() {
    return (
        <section id="tools" className="py-24 bg-muted/20 border-t border-border">
            <div className="max-w-6xl mx-auto px-4 md:px-6">

                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-3xl md:text-4xl font-serif font-normal tracking-tight text-foreground">
                        Herramientas Gratuitas
                    </h2>
                    <p className="text-lg text-muted-foreground font-light max-w-2xl mx-auto">
                        Calculadoras financieras diseñadas para darte claridad instantánea.
                        Sin registro, sin coste, 100% privadas.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">

                    {/* 50/30/20 Calculator Card */}
                    <Link
                        href="/herramientas/regla-50-30-20"
                        className="group relative bg-card border border-border rounded-2xl p-8 hover:border-primary/50 hover:shadow-md transition-all duration-300"
                    >
                        <div className="absolute top-8 right-8 bg-muted p-3 rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            <PieChart className="w-6 h-6" />
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-2xl font-serif text-foreground group-hover:text-primary transition-colors">
                                Regla 50/30/20
                            </h3>
                            <p className="text-muted-foreground font-light leading-relaxed">
                                Divide tu sueldo neto idealmente: 50% necesidades, 30% caprichos y 20% ahorro.
                                Descubre si estás gastando de más en cosas que no importan.
                            </p>

                            <div className="pt-4 flex items-center text-sm font-medium text-primary">
                                Calcular mi distribución <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </Link>

                    {/* Inflation Calculator Card */}
                    <Link
                        href="/herramientas/calculadora-inflacion"
                        className="group relative bg-card border border-border rounded-2xl p-8 hover:border-destructive/50 hover:shadow-md transition-all duration-300"
                    >
                        <div className="absolute top-8 right-8 bg-muted p-3 rounded-full group-hover:bg-destructive group-hover:text-destructive-foreground transition-colors">
                            <TrendingUp className="w-6 h-6" />
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-2xl font-serif text-foreground group-hover:text-destructive transition-colors">
                                Calculadora de Inflación
                            </h3>
                            <p className="text-muted-foreground font-light leading-relaxed">
                                El enemigo silencioso. Calcula cuánto valor real perderán tus ahorros si los dejas
                                parados &quot;bajo el colchón&quot; debido al IPC.
                            </p>

                            <div className="pt-4 flex items-center text-sm font-medium text-destructive group-hover:text-destructive transition-colors">
                                Ver pérdida de valor <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </Link>

                </div>
            </div>
        </section>
    );
}
