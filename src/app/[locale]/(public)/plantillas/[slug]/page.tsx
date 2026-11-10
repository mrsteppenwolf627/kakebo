import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import { DownloadCTA, PremiumCTA } from "@/components/mdx/MDXClientCTAs";
import { components } from "@/components/mdx/MDXComponents";
import { getPlantilla, getPlantillas } from "@/lib/plantillas";
import { getBlogPost } from "@/lib/blog";
import JsonLd from "@/components/seo/JsonLd";
import * as S from "@/lib/seo/jsonld";
import Breadcrumbs from "@/components/seo/Breadcrumbs";

const BASE_URL = "https://www.metodokakebo.com";
const { FaqSection, FaqItem } = components;

const CATEGORIES = [
    ["Supervivencia", "Lo imprescindible: vivienda, comida, transporte, salud."],
    ["Ocio y vicio", "Lo que te apetece pero no necesitas: salidas, caprichos, suscripciones."],
    ["Cultura", "Libros, cursos, cine, museos: lo que alimenta la cabeza."],
    ["Extras", "Imprevistos y gastos fuera de lo normal: regalos, reparaciones."],
] as const;

const QUESTIONS = [
    "¿Cuánto dinero tengo?",
    "¿Cuánto quiero ahorrar?",
    "¿Cuánto he gastado?",
    "¿Cómo puedo mejorar el mes que viene?",
] as const;

interface Props {
    params: Promise<{ slug: string; locale: string }>;
}

// Only the default locale is generated: this section is Spanish-only (spec §1).
export const dynamicParams = false;

export function generateStaticParams() {
    return getPlantillas().map((p) => ({ locale: "es", slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug, locale } = await params;
    const plantilla = getPlantilla(slug);
    if (!plantilla || locale !== "es") return {};

    const url = `${BASE_URL}/plantillas/${plantilla.slug}`;
    return {
        title: plantilla.title,
        description: plantilla.metaDescription,
        alternates: {
            canonical: url,
            languages: { es: url, "x-default": url },
        },
        openGraph: {
            title: plantilla.title,
            description: plantilla.metaDescription,
            type: "website",
            url,
            siteName: "MetodoKakebo.com",
            images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: plantilla.title }],
        },
    };
}

export default async function PlantillaPage({ params }: Props) {
    const { slug, locale } = await params;
    setRequestLocale(locale);
    const plantilla = getPlantilla(slug);
    // Spanish-only. Defensive: with dynamicParams=false, /en/... already returns 404 before reaching here.
    if (!plantilla || locale !== "es") notFound();

    const url = `${BASE_URL}/plantillas/${plantilla.slug}`;
    const updated = new Date(plantilla.updatedDate).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    // Relacionados (campo `related` del JSON): un slug es un artículo del blog si existe en ES; si no, otra plantilla.
    const relatedLinks = plantilla.related.flatMap((relSlug) => {
        const post = getBlogPost(relSlug, "es");
        if (post) return [{ href: `/blog/${relSlug}`, label: post.frontmatter.title }];
        const other = getPlantilla(relSlug);
        return other ? [{ href: `/plantillas/${relSlug}`, label: other.h1 }] : [];
    });

    // JSON-LD: ItemPage + DigitalDocument (PDF) + FAQPage + migas, en un único @graph.
    const docId = `${url}#document`;
    // Una sola fuente: las mismas migas alimentan el BreadcrumbList del JSON-LD y la miga visible.
    const trail: S.Crumb[] = [
        { name: "Inicio", url: BASE_URL },
        { name: "Plantillas Kakebo", url: `${BASE_URL}/blog/plantilla-kakebo-excel` },
        { name: plantilla.h1, url },
    ];
    const graph = S.graph([
        ...S.core("es"),
        ...S.webPage({
            locale: "es",
            path: `/plantillas/${plantilla.slug}`,
            type: "ItemPage",
            name: plantilla.h1,
            description: plantilla.intro,
            mainEntityId: docId,
            breadcrumbs: trail,
        }),
        S.digitalDocument({
            id: docId,
            name: plantilla.h1,
            description: plantilla.intro,
            url: S.abs(plantilla.asset.path),
            encodingFormat: "application/pdf",
            // Fecha visible como «Última actualización».
            dateModified: plantilla.updatedDate,
            inLanguage: "es",
        }),
        S.faqPage(url, plantilla.faq, "es"),
    ]);

    return (
        <main className="min-h-screen bg-background text-foreground">
            <article className="mx-auto max-w-3xl px-4 pt-24 pb-16 sm:px-6 lg:px-8">
                <Breadcrumbs items={trail} locale="es" />

                <header className="mb-8">
                    <h1 className="mb-5 text-3xl font-serif font-bold leading-tight sm:text-4xl md:text-5xl">
                        {plantilla.h1}
                    </h1>
                    <p className="text-lg font-light leading-relaxed text-muted-foreground">{plantilla.intro}</p>
                </header>

                <DownloadCTA
                    href={plantilla.asset.path}
                    cta={`Descargar PDF gratis (${plantilla.asset.pages} páginas, ${plantilla.asset.sizeKb} KB)`}
                    templateType={plantilla.format}
                    location="plantillas_page"
                    slug={plantilla.slug}
                />

                <section className="mt-12">
                    <h2 className="mb-4 text-2xl font-serif font-bold">Qué incluye</h2>
                    <ul className="list-disc space-y-2 pl-6 font-light leading-relaxed marker:text-primary">
                        {plantilla.includes.map((item) => (
                            <li key={item}>{item}</li>
                        ))}
                    </ul>
                </section>

                <section className="mt-12">
                    <h2 className="mb-4 text-2xl font-serif font-bold">Cómo usarlo</h2>
                    <ol className="list-decimal space-y-2 pl-6 font-light leading-relaxed marker:font-semibold marker:text-primary">
                        {plantilla.steps.map((step) => (
                            <li key={step}>{step}</li>
                        ))}
                    </ol>
                </section>

                <section className="mt-12">
                    <h2 className="mb-4 text-2xl font-serif font-bold">Las cuatro categorías y las cuatro preguntas del Kakebo</h2>
                    <dl className="mb-6 grid gap-4 sm:grid-cols-2">
                        {CATEGORIES.map(([name, description]) => (
                            <div key={name} className="rounded-xl border border-border bg-muted/30 p-4">
                                <dt className="font-serif font-semibold">{name}</dt>
                                <dd className="mt-1 text-sm font-light text-muted-foreground">{description}</dd>
                            </div>
                        ))}
                    </dl>
                    <ol className="list-decimal space-y-1 pl-6 font-light marker:font-semibold marker:text-primary">
                        {QUESTIONS.map((question) => (
                            <li key={question}>{question}</li>
                        ))}
                    </ol>
                </section>

                <section className="mt-12">
                    <p className="font-light leading-relaxed">
                        Esta plantilla forma parte de la{" "}
                        <Link href="/blog/plantilla-kakebo-excel" className="font-medium text-primary underline-offset-4 hover:underline">
                            guía de plantillas Kakebo
                        </Link>
                        , donde también tienes la versión en Excel. Si prefieres no rellenar nada a mano,{" "}
                        <Link href="/" className="font-medium text-primary underline-offset-4 hover:underline">
                            prueba Kakebo AI, la app gratuita del método Kakebo
                        </Link>
                        .
                    </p>
                </section>

                {relatedLinks.length > 0 && (
                    <section className="mt-12" aria-labelledby="plantilla-relacionados">
                        <h2 id="plantilla-relacionados" className="mb-4 text-2xl font-serif font-bold">Guías y plantillas relacionadas</h2>
                        <ul className="list-disc space-y-2 pl-6 font-light leading-relaxed marker:text-primary">
                            {relatedLinks.map((item) => (
                                <li key={item.href}>
                                    <Link href={item.href} className="font-medium text-primary underline-offset-4 hover:underline">
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                <PremiumCTA
                    title="¿Quieres un sistema más completo? Conoce Kakebo Master System"
                    description="La plantilla gratuita es suficiente para empezar y sigue disponible. Kakebo Master System es otro producto, disponible ahora: un pack de pago con plantilla Excel premium, ebook y tutorial en PDF (9,90 € IVA incluido, compra única, entrega digital)."
                    cta="Ver Kakebo Master System"
                />

                <section className="mt-12">
                    <h2 className="mb-4 text-2xl font-serif font-bold">Preguntas frecuentes</h2>
                    <FaqSection>
                        {plantilla.faq.map((item) => (
                            <FaqItem key={item.question} question={item.question}>
                                {item.answer}
                            </FaqItem>
                        ))}
                    </FaqSection>
                </section>

                <p className="mt-10 text-sm text-muted-foreground">
                    Última actualización: <time dateTime={plantilla.updatedDate}>{updated}</time>
                </p>
            </article>


            <JsonLd graph={graph} />
        </main>
    );
}
