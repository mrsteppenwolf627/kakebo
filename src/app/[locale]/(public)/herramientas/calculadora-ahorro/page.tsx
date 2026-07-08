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
        }
    };
}

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
    "description": "Herramienta gratuita de MetodoKakebo.com para calcular tu margen de ahorro real según ingresos, gastos fijos y gastos variables mensuales.",
    "publisher": { "@id": "https://www.metodokakebo.com/#organization" }
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
                "text": "Los gastos fijos son compromisos que se repiten cada mes con el mismo importe: alquiler, hipoteca, seguro, suscripciones. Los variables cambian: alimentación, ocio, transporte, ropa. Controlar los variables es donde tienes más margen de acción."
            }
        },
        {
            "@type": "Question",
            "name": "¿Cuánto tiempo tardaré en alcanzar mi objetivo de ahorro?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Depende de tu margen mensual real. Si introduces tu objetivo en la calculadora, verás el número de meses necesarios a tu ritmo actual, y cuánto deberías ahorrar al mes si quieres alcanzarlo en un plazo concreto."
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
            <div className="pt-32 pb-20 px-6">
                <SavingsCalculator />
            </div>
            <Footer />
        </main>
    );
}
