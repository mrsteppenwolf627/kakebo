import { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { CalculatorInflation } from "@/components/landing/tools/CalculatorInflation";
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Tools.Inflation.meta' });

    return {
        title: t('title'),
        description: t('description'),
        keywords: ["calculadora de inflacion", "calculadora inflacion", "inflation calculator", "calculadora ipc", "perdida poder adquisitivo", "actualizar renta ipc", "calculadora ipc ine", "inflacion acumulada"],
        alternates: {
            canonical: `https://www.metodokakebo.com${locale === 'es' ? '' : `/${locale}`}/herramientas/calculadora-inflacion`.replace(/([^:]\/)\/+/g, "$1"),
            languages: {
                "es": "https://www.metodokakebo.com/herramientas/calculadora-inflacion",
                "en": "https://www.metodokakebo.com/en/herramientas/calculadora-inflacion",
                "x-default": "https://www.metodokakebo.com/herramientas/calculadora-inflacion"
            }
        },
        openGraph: {
            type: "website",
            title: t('ogTitle'),
            description: t('ogDescription'),
            siteName: "MetodoKakebo.com",
            locale: locale === 'es' ? "es_ES" : "en_US",
            images: [
                {
                    url: `/api/og?title=${encodeURIComponent(t('ogTitle'))}&description=${encodeURIComponent(t('ogDescription'))}`,
                    width: 1200,
                    height: 630,
                    alt: "Kakebo Inflation Calculator",
                }
            ]
        },
        twitter: {
            card: "summary_large_image",
            title: t('title'),
            description: t('description'),
        }
    };
}

// Advanced JSON-LD Schema for GEO (Generative Engine Optimization)
const SCHEMA = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "SoftwareApplication",
            "name": "Calculadora de Inflación e IPC",
            "applicationCategory": "FinanceApplication",
            "operatingSystem": "Web",
            "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "EUR"
            },
            "description": "Herramienta online gratuita de MetodoKakebo.com para calcular la pérdida de poder adquisitivo del dinero en función del IPC y la inflación estimada.",
            "featureList": "Cálculo de valor real, proyección de inflación, gráfico de pérdida de valor",
            "author": {
                "@type": "Organization",
                "name": "MetodoKakebo.com"
            },
            "publisher": { "@id": "https://www.metodokakebo.com/#organization" }
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

export default async function CalculatorInflationPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const localePath = locale === 'es' ? '' : '/en';

    const BREADCRUMB_SCHEMA = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": locale === 'es' ? "Inicio" : "Home", "item": `https://www.metodokakebo.com${localePath}` },
            { "@type": "ListItem", "position": 2, "name": locale === 'es' ? "Herramientas" : "Tools", "item": `https://www.metodokakebo.com${localePath}/herramientas` },
            { "@type": "ListItem", "position": 3, "name": locale === 'es' ? "Calculadora de inflación" : "Inflation calculator", "item": `https://www.metodokakebo.com${localePath}/herramientas/calculadora-inflacion` }
        ]
    };

    return (
        <div className="min-h-screen bg-background dark:bg-background selection:bg-stone-200 dark:selection:bg-stone-800">
            <Navbar />

            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(BREADCRUMB_SCHEMA) }}
            />

            <main className="pt-32 pb-20 px-6">
                <CalculatorInflation />
            </main>

            <Footer />
        </div>
    );
}
