import { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { SavingsCalculator } from "@/components/landing/tools/SavingsCalculator";
import { getTranslations } from 'next-intl/server';
import { Link } from "@/i18n/routing";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Tools.Savings.meta' });

    return {
        title: t('title'),
        description: t('description'),
        alternates: {
            canonical: `https://www.metodokakebo.com${locale === 'es' ? '' : `/${locale}`}/herramientas/calculadora-ahorro`,
            languages: {
                "es": "https://www.metodokakebo.com/herramientas/calculadora-ahorro",
                "en": "https://www.metodokakebo.com/en/herramientas/calculadora-ahorro",
                "x-default": "https://www.metodokakebo.com/herramientas/calculadora-ahorro"
            }
        },
        openGraph: {
            type: "website",
            title: t('ogTitle'),
            description: t('ogDescription'),
        }
    };
}

// JSON-LD Schema
const SCHEMA = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Calculadora de Ahorro Mensual",
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "Web",
    "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "EUR"
    },
    "description": "Herramienta web gratuita de MetodoKakebo.com para calcular cuánto dinero puedes ahorrar al mes según tus ingresos y los porcentajes del método Kakebo.",
    "publisher": { "@id": "https://www.metodokakebo.com/#organization" }
};

const FAQ_SCHEMA = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
        {
            "@type": "Question",
            "name": "¿Cómo saber cuánto debo ahorrar cada mes?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "La regla general (50/30/20) y el método Kakebo recomiendan guardar un mínimo del 20% de tus ingresos netos mensuales como ahorro para imprevistos e inversiones."
            }
        },
        {
            "@type": "Question",
            "name": "¿Cuáles son las 4 categorías del Kakebo?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Al aplicar el método Kakebo divides tus gastos en: Supervivencia (alquiler, luz, comida básica), Ocio/Vicio (restaurantes, ropa, caprichos), Cultura (libros, cursos, museos) y Extras (reparaciones, regalos)."
            }
        },
        {
            "@type": "Question",
            "name": "¿Para qué sirve esta calculadora de ahorro?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Sirve para darte una cifra exacta en euros de cuánto deberías gastar como máximo en cada una de las grandes áreas de tu vida, según tu sueldo y asegurando tu ahorro."
            }
        }
    ]
};

export default function SavingsCalculatorPage() {
    return (
        <main className="min-h-screen bg-background">
            <Navbar />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify([SCHEMA, FAQ_SCHEMA]) }}
            />

            <div className="pt-32 pb-12 px-6 max-w-4xl mx-auto text-center">
                <h1 className="text-4xl md:text-5xl font-bold font-serif text-foreground mb-6">
                    Calculadora de Ahorro Mensual
                </h1>
                <p className="text-lg text-muted-foreground">
                    ¿Cuánto deberías ahorrar cada mes? Planifica tu ahorro mensual y obtén tu distribución ideal con el método Kakebo.
                </p>
            </div>

            <SavingsCalculator />

            <section className="py-16 px-6 max-w-3xl mx-auto space-y-12">
                <div>
                    <h2 className="text-2xl font-bold font-serif mb-4">¿Cómo usar esta calculadora de ahorro?</h2>
                    <div className="space-y-4 text-muted-foreground">
                        <p>
                            El método Kakebo no trata solo de apuntar en qué te gastas el dinero, sino de ser consciente del presupuesto que tienes antes de gastarlo. La <strong>calculadora de ahorro mensual</strong> de MetodoKakebo.com te ayuda a dar el primer paso: la planificación mensual.
                        </p>
                        <p>
                            Para empezar, introduce tu ingreso mensual neto (lo que llega a tu cuenta bancaria después de impuestos). La calculadora distribuirá ese monto en las cuatro categorías del método Kakebo: Supervivencia, Ocio/Vicio, Cultura y Extras.
                        </p>
                        <p>
                            El objetivo de esta herramienta es mostrarte al instante cuánto podrías destinar al ahorro cada mes, tomando como referencia el objetivo del 20% del método Kakebo, sin sacrificar tu calidad de vida.
                        </p>
                    </div>
                </div>

                <div>
                    <h2 className="text-2xl font-bold font-serif mb-4">¿Qué te dice el resultado?</h2>
                    <div className="space-y-4 text-muted-foreground">
                        <p>
                            Los resultados que ves en pantalla no son reglas estrictas, sino un mapa de ruta ideal. Si observas que tus gastos actuales de &quot;Supervivencia&quot; superan con creces el presupuesto sugerido por la calculadora, acabas de localizar tu primer punto de fuga financiero.
                        </p>
                        <p>
                            El resultado te permite revisar tus gastos de &quot;Ocio/Vicio&quot; mensuales. Al saber cuál es el margen disponible para salir a cenar o comprar ropa, puedes tomar decisiones más conscientes, sabiendo que el objetivo del 20% de ahorro ya está planificado.
                        </p>
                    </div>
                </div>

                <div>
                    <h2 className="text-2xl font-bold font-serif mb-4">Preguntas frecuentes sobre ahorro con Kakebo</h2>
                    <div className="space-y-6">
                        {FAQ_SCHEMA.mainEntity.map((faq, index) => (
                            <div key={index}>
                                <h3 className="text-lg font-bold text-foreground">{faq.name}</h3>
                                <p className="text-muted-foreground mt-2">{faq.acceptedAnswer.text}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="text-center pt-8 border-t border-border">
                    <h3 className="text-2xl font-bold mb-4">¿Listo para aplicar esta teoría a la realidad?</h3>
                    <p className="text-muted-foreground mb-6">
                        Kakebo AI, la app gratuita de MetodoKakebo.com, te ayuda a registrar gastos y hacer seguimiento de tu ahorro mensual con el método Kakebo.
                    </p>
                    <Link href="/login" className="bg-primary text-primary-foreground font-semibold px-8 py-3 rounded-full hover:bg-primary/90 transition-colors inline-block">
                        Empezar a usar la App
                    </Link>
                </div>
            </section>

            <Footer />
        </main>
    );
}
