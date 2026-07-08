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
            images: [
                {
                    url: "/api/og?title=Calculadora de Ahorro Mensual&description=Calcula tu margen real de ahorro: ingresos menos gastos fijos y variables. Sin registro.",
                    width: 1200,
                    height: 630,
                    alt: "Calculadora de ahorro mensual de MetodoKakebo.com para calcular margen real y objetivos de ahorro.",
                }
            ]
        }
    };
}

const SCHEMA = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Calculadora de Ahorro Mensual",
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "Web",
    "dateModified": "2026-07-08",
    "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "EUR"
    },
    "featureList": [
        "Cálculo de margen real de ahorro mensual",
        "Separación de gastos fijos y variables",
        "Estimación de tiempo para objetivo de ahorro",
        "Visualización de distribución de ingresos",
        "Cálculo de ahorro mensual necesario por plazo"
    ],
    "description": "Herramienta gratuita de MetodoKakebo.com para calcular el margen real de ahorro mensual según ingresos, gastos fijos y gastos variables.",
    "author": {
        "@type": "Organization",
        "name": "MetodoKakebo.com"
    },
    "publisher": { "@id": "https://www.metodokakebo.com/#organization" }
};

const HOW_TO_SCHEMA = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "Cómo calcular tu margen real de ahorro mensual",
    "step": [
        {
            "@type": "HowToStep",
            "name": "Introduce tus ingresos netos",
            "text": "Escribe la cantidad que recibes en tu cuenta bancaria cada mes, después de impuestos y retenciones."
        },
        {
            "@type": "HowToStep",
            "name": "Añade tus gastos fijos",
            "text": "Introduce el total mensual de compromisos que se repiten siempre con el mismo importe: alquiler o hipoteca, seguros, suscripciones y préstamos."
        },
        {
            "@type": "HowToStep",
            "name": "Añade tus gastos variables",
            "text": "Introduce el promedio mensual de gastos que cambian cada mes: alimentación, ocio, transporte, ropa y otros gastos discrecionales."
        },
        {
            "@type": "HowToStep",
            "name": "Lee tu margen real de ahorro",
            "text": "La calculadora muestra tu margen real (ingresos menos todos tus gastos) y tu tasa de ahorro. El método Kakebo recomienda un mínimo del 20%. Si tienes un objetivo concreto, activa 'Añadir objetivo de ahorro' para ver cuántos meses necesitas."
        }
    ]
};

const FAQ_SCHEMA = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
        {
            "@type": "Question",
            "name": "¿Cómo saber cuánto puedo ahorrar cada mes?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Resta tus gastos fijos y variables a tus ingresos netos. El resultado es tu margen real de ahorro. El método Kakebo recomienda que ese margen sea al menos el 20% de tus ingresos."
            }
        },
        {
            "@type": "Question",
            "name": "¿Cuál es la diferencia entre gastos fijos y variables?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Los gastos fijos son compromisos que se repiten cada mes con el mismo importe: alquiler, hipoteca, seguros, suscripciones. Los variables cambian: alimentación, ocio, transporte, ropa. Controlar los variables es donde tienes más margen de acción a corto plazo."
            }
        },
        {
            "@type": "Question",
            "name": "¿Cuánto tiempo tardaré en alcanzar mi objetivo de ahorro?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Depende de tu margen mensual real. Activa la sección 'Añadir objetivo' en la calculadora: introduce el importe objetivo y, opcionalmente, el plazo en meses. La herramienta mostrará el tiempo necesario a tu ritmo actual y cuánto deberías ahorrar al mes para alcanzarlo en un plazo concreto."
            }
        },
        {
            "@type": "Question",
            "name": "¿Qué porcentaje de ahorro mensual es suficiente?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "El método Kakebo recomienda el 20% como mínimo. Por debajo del 10%, el margen es tan ajustado que cualquier imprevisto lo elimina. Si no puedes llegar al 20%, empieza por un 5% constante: ahorrar poco de forma sostenida construye más patrimonio que intentar el 20% y abandonarlo a los tres meses."
            }
        },
        {
            "@type": "Question",
            "name": "¿Cómo calculo el dinero que necesito para un fondo de emergencia?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Un fondo de emergencia estándar cubre entre 3 y 6 meses de tus gastos fijos mensuales. Si tus gastos fijos son 800 € al mes, tu objetivo debería ser entre 2.400 € y 4.800 €. Usa la sección 'Añadir objetivo' de la calculadora para saber cuántos meses necesitas a tu ritmo de ahorro actual."
            }
        },
        {
            "@type": "Question",
            "name": "¿En qué se diferencia esta calculadora de la regla 50/30/20?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "La regla 50/30/20 toma tus ingresos y los distribuye en porcentajes teóricos (50% necesidades, 30% deseos, 20% ahorro). Esta calculadora hace lo contrario: parte de tus gastos reales (fijos y variables) y calcula el margen que te queda de verdad. Con la misma nómina, el margen real puede ser muy diferente del 20% teórico según cuánto sumen tus compromisos fijos."
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
                dangerouslySetInnerHTML={{ __html: JSON.stringify([SCHEMA, HOW_TO_SCHEMA, FAQ_SCHEMA]) }}
            />
            <div className="pt-32 pb-0 px-6">
                <SavingsCalculator />
            </div>

            {/* Server-rendered editorial sections: HowTo + FAQ */}
            <section className="pb-20 px-6">
                <div className="max-w-3xl mx-auto space-y-16">

                    {/* How to use */}
                    <div className="space-y-6">
                        <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
                            ¿Cómo usar la calculadora de ahorro mensual?
                        </h2>
                        <div className="space-y-4">
                            {HOW_TO_SCHEMA.step.map((step, index) => (
                                <div key={index} className="flex gap-4">
                                    <div className="flex-none w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                        {index + 1}
                                    </div>
                                    <div className="pt-0.5">
                                        <p className="text-sm font-semibold text-foreground mb-0.5">{step.name}</p>
                                        <p className="text-sm text-muted-foreground font-light leading-relaxed">{step.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* FAQ visible */}
                    <div className="space-y-6">
                        <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
                            Preguntas frecuentes sobre el ahorro mensual
                        </h2>
                        <div className="space-y-6 divide-y divide-border">
                            {FAQ_SCHEMA.mainEntity.map((faq, index) => (
                                <div key={index} className={index > 0 ? "pt-6" : ""}>
                                    <h3 className="text-base font-semibold text-foreground mb-2">{faq.name}</h3>
                                    <p className="text-sm text-muted-foreground font-light leading-relaxed">{faq.acceptedAnswer.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </section>

            <Footer />
        </main>
    );
}
