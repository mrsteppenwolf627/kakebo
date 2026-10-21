import { Metadata } from "next";
import { ToolMessages } from "@/components/i18n/ToolMessages";
import { SavingsCalculator } from "@/components/landing/tools/SavingsCalculator";
import { Link } from "@/i18n/routing";
import { getTranslations } from 'next-intl/server';
import { getSavingsPageContent } from "@/content/savings-calculator-page";

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
            siteName: "MetodoKakebo.com",
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

export default async function SavingsCalculatorPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const localePath = locale === 'es' ? '' : '/en';
    const content = getSavingsPageContent(locale);

    // HowTo, FAQ y fórmula salen de la misma fuente: el HTML visible y el JSON-LD no pueden divergir.
    const howToSteps = content.howTo.steps;
    const faqItems = content.faq.items;
    const formulaHow = content.formula.how;
    const formulaAssumptions = content.formula.assumptions;
    const formulaLimits = content.formula.limits;

    const SCHEMA = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": content.schema.name,
        "applicationCategory": "FinanceApplication",
        "operatingSystem": "Web",
        "dateModified": "2026-10-21",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "EUR"
        },
        "featureList": content.schema.featureList,
        "description": content.schema.description,
        "author": {
            "@type": "Organization",
            "name": "MetodoKakebo.com"
        },
        "publisher": { "@id": "https://www.metodokakebo.com/#organization" }
    };

    const HOW_TO_SCHEMA = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": content.howTo.schemaName,
        "step": howToSteps.map((step) => ({
            "@type": "HowToStep",
            "name": step.name,
            "text": step.text
        }))
    };

    const FAQ_SCHEMA = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqItems.map((faq) => ({
            "@type": "Question",
            "name": faq.q,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.a
            }
        }))
    };

    const BREADCRUMB_SCHEMA = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": locale === 'es' ? "Inicio" : "Home", "item": `https://www.metodokakebo.com${localePath}` },
            { "@type": "ListItem", "position": 2, "name": locale === 'es' ? "Herramientas" : "Tools", "item": `https://www.metodokakebo.com${localePath}/herramientas` },
            { "@type": "ListItem", "position": 3, "name": locale === 'es' ? "Calculadora de ahorro" : "Savings calculator", "item": `https://www.metodokakebo.com${localePath}/herramientas/calculadora-ahorro` }
        ]
    };

    return (
        <main className="min-h-screen bg-background">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify([SCHEMA, HOW_TO_SCHEMA, FAQ_SCHEMA]) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(BREADCRUMB_SCHEMA) }}
            />
            <div className="pt-32 pb-0 px-6">
                <ToolMessages locale={locale} tools={{ Savings: true }}>
                    <SavingsCalculator />
                </ToolMessages>
            </div>

            {/* Server-rendered editorial sections: formula, HowTo + FAQ */}
            <section className="pb-20 px-6">
                <div className="max-w-3xl mx-auto space-y-16">

                    {/* Formula, assumptions and limits */}
                    <div className="space-y-6">
                        <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
                            {content.formula.title}
                        </h2>
                        <p
                            role="note"
                            className="rounded-xl border border-border bg-muted/40 p-4 text-sm font-medium text-foreground"
                        >
                            {content.formula.notice}
                        </p>
                        <div className="space-y-6 text-sm text-muted-foreground font-light leading-relaxed">
                            <div className="space-y-2">
                                <h3 className="text-base font-semibold text-foreground">{content.formula.howTitle}</h3>
                                <ul className="list-disc pl-5 space-y-1">
                                    {formulaHow.map((item) => (
                                        <li key={item.term}>
                                            <strong className="font-semibold text-foreground">{item.term}</strong> {item.text}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-base font-semibold text-foreground">{content.formula.assumptionsTitle}</h3>
                                <ul className="list-disc pl-5 space-y-1">
                                    {formulaAssumptions.map((item) => (
                                        <li key={item}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-base font-semibold text-foreground">{content.formula.limitsTitle}</h3>
                                <ul className="list-disc pl-5 space-y-1">
                                    {formulaLimits.map((item) => (
                                        <li key={item}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-base font-semibold text-foreground">{content.formula.readingTitle}</h3>
                                <p>{content.formula.reading}</p>
                            </div>
                            <p>
                                {content.formula.aboutText}{" "}
                                <Link href="/sobre-nosotros" className="underline text-foreground hover:text-primary">
                                    {content.formula.aboutLink}
                                </Link>
                                .
                            </p>
                        </div>
                    </div>

                    {/* How to use */}
                    <div className="space-y-6">
                        <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
                            {content.howTo.title}
                        </h2>
                        <div className="space-y-4">
                            {howToSteps.map((step, index) => (
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
                            {content.faq.title}
                        </h2>
                        <div className="space-y-6 divide-y divide-border">
                            {faqItems.map((faq, index) => (
                                <div key={index} className={index > 0 ? "pt-6" : ""}>
                                    <h3 className="text-base font-semibold text-foreground mb-2">{faq.q}</h3>
                                    <p className="text-sm text-muted-foreground font-light leading-relaxed">{faq.a}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </section>

        </main>
    );
}
