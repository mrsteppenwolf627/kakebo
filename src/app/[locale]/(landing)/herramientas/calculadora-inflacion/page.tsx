import { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { ToolMessages } from "@/components/i18n/ToolMessages";
import { CalculatorInflation } from "@/components/landing/tools/CalculatorInflation";
import { INFLATION_FORMULA } from "@/components/landing/tools/inflation-formula";
import { getTranslations, setRequestLocale } from 'next-intl/server';
import JsonLd from "@/components/seo/JsonLd";
import * as S from "@/lib/seo/jsonld";
import Breadcrumbs from "@/components/seo/Breadcrumbs";

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
export default async function CalculatorInflationPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'Tools.Inflation' });

    // JSON-LD: un único @graph. El FAQPage usa las 3 preguntas que se ven en pantalla (Tools.Inflation.content.faq),
    // con las mismas claves que renderiza CalculatorInflation (la respuesta 2 incluye el bloque de la fórmula, que va entre a2 y a2b); las etiquetas de texto enriquecido las quita plain().
    const loc: S.Locale = locale === 'en' ? 'en' : 'es';
    const path = '/herramientas/calculadora-inflacion';
    const pageUrl = S.localeUrl(loc, path);
    const appId = `${pageUrl}#app`;
    const f = (k: string) => t.raw(`content.faq.${k}`) as string;
    // WebApplication.name = texto visible del h1 (misma clave que renderiza CalculatorInflation; sin la etiqueta <italic> del rich text).
    const h1Text = (t.raw('header.title') as string).replace(/<\/?italic>/g, '');
    const faq = [
        { question: f('q1'), answer: f('a1') },
        { question: f('q2'), answer: `${f('a2')} ${INFLATION_FORMULA} ${f('a2b')}` },
        { question: f('q3'), answer: f('a3') },
    ];
    // Una sola fuente: las mismas migas alimentan el BreadcrumbList del JSON-LD y la miga visible.
    const trail = S.crumbs(loc, [
        { name: S.siteCopy[loc].tools, path: '/herramientas' },
        { name: loc === 'es' ? 'Calculadora de inflación' : 'Inflation calculator', path },
    ]);
    const graph = S.graph([
        ...S.core(loc),
        ...S.webPage({
            locale: loc,
            path,
            name: t('meta.title'),
            description: t('meta.description'),
            mainEntityId: appId,
            about: ['inflation', 'consumerPriceIndex', 'purchasingPower'],
            breadcrumbs: trail,
        }),
        S.webApplication({
            id: appId,
            name: h1Text,
            url: pageUrl,
            description: t('meta.description'),
            inLanguage: loc,
            operatingSystem: 'Web',
            about: ['inflation', 'consumerPriceIndex', 'purchasingPower'],
        }),
        S.faqPage(pageUrl, faq, loc),
    ]);

    return (
        <div className="min-h-screen bg-background dark:bg-background selection:bg-stone-200 dark:selection:bg-stone-800">
            <Navbar />

            <JsonLd graph={graph} />

            <main className="pt-32 pb-20 px-6">
                <div className="max-w-6xl mx-auto">
                    <Breadcrumbs items={trail} locale={loc} />
                </div>
                <ToolMessages locale={locale} tools={{ Inflation: true }}>
                    <CalculatorInflation />
                </ToolMessages>
            </main>
        </div>
    );
}
