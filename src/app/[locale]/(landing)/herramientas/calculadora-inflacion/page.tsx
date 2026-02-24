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
        keywords: ["calculadora inflación españa", "calcular ipc acumulado", "actualizar renta ipc", "inflación españa 2026", "pérdida poder adquisitivo", "calculadora ipc ine"], // Keywords might need their own translation or strategy
        alternates: {
            canonical: "/herramientas/calculadora-inflacion",
        },
        openGraph: {
            type: "website",
            title: t('ogTitle'),
            description: t('ogDescription'),
            siteName: "Kakebo",
            locale: locale === 'es' ? "es_ES" : "en_US",
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
        <div className="min-h-screen bg-background dark:bg-background selection:bg-stone-200 dark:selection:bg-stone-800">
            <Navbar />

            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA) }}
            />

            <main className="pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold font-serif text-foreground mb-6">
                        Calculadora de Inflación
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        Descubre cuánto poder adquisitivo pierden tus ahorros con el paso del tiempo.
                    </p>
                </div>

                <CalculatorInflation />

                <section className="py-16 max-w-3xl mx-auto space-y-12">
                    <div>
                        <h2 className="text-2xl font-bold font-serif mb-4">¿Cómo usar esta calculadora de inflación?</h2>
                        <div className="space-y-4 text-muted-foreground">
                            <p>
                                El enemigo silencioso de tus ahorros en el banco no son los gastos imprevistos, sino la <strong>inflación</strong>. Esta calculadora te permite visualizar la devaluación real de tu dinero a lo largo de los años.
                            </p>
                            <p>
                                Para utilizarla, introduce la cantidad de dinero que tienes ahorrada en "Efectivo Actual", selecciona una tasa de inflación estimada (históricamente en España ronda el 2-3% anual) y el número de años que prevés mantener ese dinero parado. La calculadora dibujará la curva de pérdida de valor.
                            </p>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold font-serif mb-4">¿Qué te dice el resultado?</h2>
                        <div className="space-y-4 text-muted-foreground">
                            <p>
                                La gráfica resultante es reveladora: te muestra la diferencia entre tu "Dinero Nominal" (el número que ves en tu cuenta corriente) y el "Poder Adquisitivo Real" (lo que realmente podrás comprar con ese dinero en el futuro).
                            </p>
                            <p>
                                Si dejas 10.000€ quietos bajo el colchón durante 10 años con una inflación del 3%, seguirás teniendo 10.000 billetes, pero su capacidad de compra será equivalente a unos 7.400€ de hoy. Has perdido un 26% de tu riqueza simplemente por no hacer nada.
                            </p>
                            <p>
                                Este resultado es la motivación principal para pasar del ahorro estático (guardar por guardar) a la inversión activa, buscando rentabilidades que al menos igualen o superen el porcentaje de inflación.
                            </p>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold font-serif mb-4">Preguntas frecuentes sobre inflación e IPC</h2>
                        <div className="space-y-6">
                            {/* We cast here because we know the schema structure matches what we expect */}
                            {((SCHEMA["@graph"].find(g => g["@type"] === "FAQPage") as any)?.mainEntity || []).map((faq: any, index: number) => (
                                <div key={index}>
                                    <h3 className="text-lg font-bold text-foreground">{faq.name}</h3>
                                    <p className="text-muted-foreground mt-2">{faq.acceptedAnswer.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="text-center pt-8 border-t border-border">
                        <h3 className="text-2xl font-bold mb-4">Vence a la inflación controlando tus gastos</h3>
                        <p className="text-muted-foreground mb-6">
                            El primer paso para protegerte de la subida de precios es optimizar en qué gastas tu dinero. Kakebo AI te ayuda a encontrar fugas de capital para que puedas ahorrar e invertir más rápido.
                        </p>
                        <a href="/login" className="bg-primary text-primary-foreground font-semibold px-8 py-3 rounded-full hover:bg-primary/90 transition-colors inline-block">
                            Optimizar mis gastos gratis
                        </a>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
