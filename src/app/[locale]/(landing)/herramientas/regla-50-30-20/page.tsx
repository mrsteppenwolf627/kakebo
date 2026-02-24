import { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Calculator503020 } from "@/components/landing/tools/Calculator503020";
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Tools.Rule503020.meta' });

    return {
        title: t('title'),
        description: t('description'),
        alternates: {
            canonical: `https://www.metodokakebo.com/${locale}/herramientas/regla-50-30-20`,
            languages: {
                "es": "https://www.metodokakebo.com/es/herramientas/regla-50-30-20",
                "en": "https://www.metodokakebo.com/en/herramientas/regla-50-30-20",
                "x-default": "https://www.metodokakebo.com/es/herramientas/regla-50-30-20"
            }
        },
        openGraph: {
            title: t('ogTitle'),
            description: t('ogDescription'),
            images: [
                {
                    url: "/api/og?title=Regla 50/30/20&description=Tu sueldo ideal en 1 clic: 50% Necesidades, 30% Caprichos, 20% Ahorro.",
                    width: 1200,
                    height: 630,
                    alt: "Kakebo 50/30/20 Calculator",
                }
            ]
        }
    };
}

// JSON-LD Schema
const SCHEMA = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Calculadora Regla 50/30/20 Kakebo",
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "Web",
    "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "EUR"
    },
    "description": "Calculadora gratuita para distribuir tu sueldo mensual según la regla 50/30/20: 50% necesidades, 30% caprichos y 20% ahorro."
};

const HOW_TO_SCHEMA = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "Cómo aplicar la regla 50/30/20 a tu sueldo",
    "step": [
        {
            "@type": "HowToStep",
            "text": "Calcula tus ingresos netos mensuales (lo que recibes en el banco)."
        },
        {
            "@type": "HowToStep",
            "text": "Destina el 50% a gastos imprescindibles (alquiler, comida, facturas)."
        },
        {
            "@type": "HowToStep",
            "text": "Reserva un 20% para ahorro e inversión (fondo de emergencia, jubilación)."
        },
        {
            "@type": "HowToStep",
            "text": "Utiliza el 30% restante para caprichos y estilo de vida (cenas, ocio, viajes)."
        }
    ]
};

export default function Calculator503020Page() {
    return (
        <div className="min-h-screen bg-background dark:bg-background selection:bg-stone-200 dark:selection:bg-stone-800">
            <Navbar />

            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify([SCHEMA, HOW_TO_SCHEMA]) }}
            />

            <main className="pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold font-serif text-foreground mb-6">
                        Calculadora Regla 50/30/20
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        Descubre tu sueldo ideal distribuyéndolo entre necesidades, caprichos y ahorro.
                    </p>
                </div>

                <Calculator503020 />

                <section className="py-16 max-w-3xl mx-auto space-y-12">
                    <div>
                        <h2 className="text-2xl font-bold font-serif mb-4">¿Cómo usar esta calculadora de la Regla 50/30/20?</h2>
                        <div className="space-y-4 text-muted-foreground">
                            <p>
                                La <strong>regla 50/30/20</strong> es uno de los métodos de gestión financiera más populares del mundo por su tremenda simplicidad. Esta calculadora está diseñada para traducir tu sueldo neto a esos porcentajes de manera automática.
                            </p>
                            <p>
                                Solo tienes que introducir tu salario mensual exacto. La herramienta dividirá ese monto en tres bloques (50% necesidades básicas, 30% estilo de vida, 20% ahorro e inversión). Esta visión macro es el paso fundamental antes de descender al micro y registrar gastos individuales diarios con el método Kakebo.
                            </p>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold font-serif mb-4">¿Qué te dice el resultado?</h2>
                        <div className="space-y-4 text-muted-foreground">
                            <p>
                                El bloque del <strong>50% (Necesidades)</strong> te indica el límite de dinero que debería ir destinado a sobrevivir: vivienda, facturas de luz y agua, comida del supermercado y transporte básico. Si tus gastos vitales superan ese 50%, tu economía está en alerta y deberías enfocarte en reducirlos.
                            </p>
                            <p>
                                El bloque del <strong>30% (Caprichos)</strong> engloba tus restaurantes, compras no esenciales, Netflix y salidas. Es el presupuesto para disfrutar tu vida sin remordimientos.
                            </p>
                            <p>
                                El bloque del <strong>20% (Ahorro)</strong> no es opcional. Es la porción de tu sueldo que debe ir directamente a un fondo de emergencia o inversiones a final de mes (o idealmente, a principio de mes).
                            </p>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold font-serif mb-4">Pasos para aplicar la regla 50/30/20 en tu día a día</h2>
                        <div className="space-y-6">
                            {HOW_TO_SCHEMA.step.map((step, index) => (
                                <div key={index} className="flex gap-4">
                                    <div className="flex-none w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                                        {index + 1}
                                    </div>
                                    <p className="text-muted-foreground mt-1">{step.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="text-center pt-8 border-t border-border">
                        <h3 className="text-2xl font-bold mb-4">Lleva esta regla a un nivel superior</h3>
                        <p className="text-muted-foreground mb-6">
                            Saber los porcentajes es solo el principio. Únete a Kakebo AI para que nuestro asistente inteligente clasifique tus gastos diarios en estas áreas automáticamente.
                        </p>
                        <a href="/login" className="bg-primary text-primary-foreground font-semibold px-8 py-3 rounded-full hover:bg-primary/90 transition-colors inline-block">
                            Crear cuenta en Kakebo
                        </a>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
