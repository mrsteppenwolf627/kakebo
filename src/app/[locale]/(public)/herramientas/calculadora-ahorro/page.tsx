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
            canonical: "/herramientas/calculadora-ahorro",
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
            <SavingsCalculator />
            <Footer />
        </main>
    );
}
