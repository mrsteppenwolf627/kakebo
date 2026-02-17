import { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Calculator503020 } from "@/components/landing/tools/Calculator503020";
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
    const t = await getTranslations({ locale, namespace: 'Tools.Rule503020.meta' });

    return {
        title: t('title'),
        description: t('description'),
        alternates: {
            canonical: "/herramientas/regla-50-30-20",
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
        <div className="min-h-screen bg-stone-50 selection:bg-stone-200">
            <Navbar />

            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify([SCHEMA, HOW_TO_SCHEMA]) }}
            />

            <main className="pt-32 pb-20 px-6">
                <Calculator503020 />
            </main>

            <Footer />
        </div>
    );
}
