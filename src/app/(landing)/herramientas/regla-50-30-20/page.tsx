import { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Calculator503020 } from "@/components/landing/tools/Calculator503020";

export const metadata: Metadata = {
    title: "Calculadora Regla 50/30/20 - Distribuye tu Sueldo | Kakebo",
    description: "Calcula gratis tu presupuesto ideal con la regla 50/30/20. Averigua cuánto ahorrar y cuánto gastar en necesidades según tu salario neto.",
    alternates: {
        canonical: "/herramientas/regla-50-30-20",
    },
    openGraph: {
        title: "Calculadora Regla 50/30/20 - Distribuye tu Sueldo",
        description: "La forma más fácil de dividir tu nómina: 50% Necesidades, 30% Caprichos, 20% Ahorro. Pruébala gratis.",
    }
};

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
