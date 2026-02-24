import { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { SavingsCalculator } from "@/components/landing/tools/SavingsCalculator";
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Tools.Savings.meta' });

    return {
        title: t('title'),
        description: t('description'),
        alternates: {
            canonical: `https://www.metodokakebo.com/${locale}/herramientas/calculadora-ahorro`,
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
    "name": "Calculadora de Ahorro Kakebo",
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "Web",
    "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "EUR"
    },
    "description": "Calculadora gratuita para distribuir tu nómina mensual basada en el método japonés Kakebo: Supervivencia, Ocio, Cultura y Ahorro."
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
                "text": "Al aplicar el método Kakebo divides tus gastos en: Supervivencia (alquiler, luz, comida básica), Opcional o Vicio (restaurantes, ropa, caprichos), Cultura (libros, cursos, museos) y Extra (reparaciones, regalos)."
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
                    Calculadora de Ahorro Kakebo
                </h1>
                <p className="text-lg text-muted-foreground">
                    Descubre tu potencial de ahorro mensual aplicando el método japonés.
                </p>
            </div>

            <SavingsCalculator />

            <section className="py-16 px-6 max-w-3xl mx-auto space-y-12">
                <div>
                    <h2 className="text-2xl font-bold font-serif mb-4">¿Cómo usar esta calculadora de ahorro?</h2>
                    <div className="space-y-4 text-muted-foreground">
                        <p>
                            El método Kakebo no trata solo de apuntar en qué te gastas el dinero, sino de ser consciente del presupuesto que tienes antes de gastarlo. Nuestra <strong>calculadora de ahorro mensual</strong> te ayuda a dar el primer paso crucial: la planificación técnica.
                        </p>
                        <p>
                            Para empezar, simplemente introduce tu ingreso mensual neto (lo que llega a tu cuenta bancaria después de impuestos). La calculadora automáticamente distribuirá ese monto en las cuatro grandes categorías del Kakebo: Supervivencia, Opcional, Cultura y Extras.
                        </p>
                        <p>
                            El objetivo principal de esta herramienta es mostrarte al instante cuánto deberías guardar para poder alcanzar al menos un 20% de ahorro sólido cada mes, sin sacrificar tu calidad de vida.
                        </p>
                    </div>
                </div>

                <div>
                    <h2 className="text-2xl font-bold font-serif mb-4">¿Qué te dice el resultado?</h2>
                    <div className="space-y-4 text-muted-foreground">
                        <p>
                            Los resultados que ves en pantalla no son reglas estrictas, sino un mapa de ruta ideal. Si observas que tus gastos actuales de "Supervivencia" superan con creces el presupuesto sugerido por la calculadora, acabas de localizar tu primer punto de fuga financiero.
                        </p>
                        <p>
                            El resultado te permite cuestionar tus compras de "Opcional" o "Vicio" mensuales. Al saber exactamente cuál es tu límite sano para salir a cenar o comprar ropa, reduces la ansiedad financiera y el sentimiento de culpa, porque sabes que tu ahorro del 20% ya está asegurado.
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
                        Sustituye el papel y el Excel por Kakebo AI. Nuestro agente registrará tus gastos y vigilará tu ahorro por ti.
                    </p>
                    <a href="/login" className="bg-primary text-primary-foreground font-semibold px-8 py-3 rounded-full hover:bg-primary/90 transition-colors inline-block">
                        Empezar a usar la App
                    </a>
                </div>
            </section>

            <Footer />
        </main>
    );
}
