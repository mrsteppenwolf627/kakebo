import { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { CalculatorInflation } from "@/components/landing/tools/CalculatorInflation";

export const metadata: Metadata = {
    title: "Calculadora Inflación 2026: ¿Cuánto dinero has perdido realmente?",
    description: "La inflación es el impuesto silencioso. Calcula cuántos ahorros has perdido en 2024-2026 y cuánto valdrá tu dinero en el futuro. Herramienta gratuita.",
    keywords: ["calculadora inflación españa", "calcular ipc acumulado", "actualizar renta ipc", "inflación españa 2026", "pérdida poder adquisitivo", "calculadora ipc ine"],
    alternates: {
        canonical: "/herramientas/calculadora-inflacion",
    },
    openGraph: {
        type: "website",
        title: "¿Cuánto te está robando la inflación? (Calculadora 2026)",
        description: "Tus estimaciones fallan. Usa esta calculadora oficial de IPC para ver la pérdida real de poder adquisitivo de tus ahorros.",
        siteName: "Kakebo",
        locale: "es_ES",
        images: [
            {
                url: "/api/og?title=Calculadora Inflación 2026&description=Calcula cuánto valor real pierden tus ahorros por el IPC.",
                width: 1200,
                height: 630,
                alt: "Kakebo Inflation Calculator",
            }
        ]
    },
    twitter: {
        card: "summary_large_image",
        title: "Calculadora Inflación 2026 - Kakebo",
        description: "Descubre cuánto valor han perdido tus ahorros por el IPC.",
    }
};

// Advanced JSON-LD Schema for GEO (Generative Engine Optimization)
const SCHEMA = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "SoftwareApplication",
            "name": "Calculadora de Inflación Kakebo 2026",
            "applicationCategory": "FinanceApplication",
            "operatingSystem": "Web",
            "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "EUR"
            },
            "description": "Herramienta online para calcular la pérdida de poder adquisitivo del dinero en función del IPC y la inflación estimada.",
            "featureList": "Cálculo de valor real, proyección de inflación, gráfico de pérdida de valor",
            "author": {
                "@type": "Organization",
                "name": "Kakebo"
            }
        },
        {
            "@type": "FAQPage",
            "mainEntity": [
                {
                    "@type": "Question",
                    "name": "¿Qué es la inflación?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "La inflación es el aumento generalizado de los precios en una economía. En España se mide con el IPC. Si la inflación es del 3%, tu dinero pierde ese mismo porcentaje de valor de compra cada año."
                    }
                },
                {
                    "@type": "Question",
                    "name": "¿Cuál es la diferencia entre IPC e inflación?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "La inflación es el fenómeno económico de subida de precios, mientras que el IPC (Índice de Precios de Consumo) es el indicador estadístico que mide dicha variación basándose en una cesta de la compra representativa."
                    }
                },
                {
                    "@type": "Question",
                    "name": "¿Cómo calcular la actualización de renta por IPC?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Para actualizar una renta, se aplica la fórmula: Renta Final = Renta Inicial * (1 + Tasa IPC). Por ejemplo, si tu alquiler es 1000€ y el IPC 3%, el nuevo alquiler será 1030€."
                    }
                },
                {
                    "@type": "Question",
                    "name": "¿Cuánto vale mi dinero en el futuro con inflación?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "El valor real de tu dinero se calcula dividiendo el importe nominal entre (1 + tasa inflación)^años. Por ejemplo, 10.000€ hoy, con una inflación media del 3% durante 10 años, tendrán un poder de compra equivalente a unos 7.440€ de hoy."
                    }
                }
            ]
        },
        {
            "@type": "DefinedTerm",
            "name": "Inflación",
            "description": "Aumento sostenido y generalizado del nivel de precios de bienes y servicios en una economía durante un periodo de tiempo",
            "inDefinedTermSet": {
                "@type": "DefinedTermSet",
                "name": "Diccionario Financiero Kakebo"
            }
        }
    ]
};

export default function CalculatorInflationPage() {
    return (
        <div className="min-h-screen bg-stone-50 selection:bg-stone-200">
            <Navbar />

            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA) }}
            />

            <main className="pt-32 pb-20 px-6">
                <CalculatorInflation />
            </main>

            <Footer />
        </div>
    );
}
