import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import { Footer } from "@/components/landing";
import { components } from "@/components/mdx/MDXComponents";
import { CalculadoraEntrada } from "@/components/vivienda/CalculadoraEntrada";
import { GraficoValorTasado } from "@/components/vivienda/GraficoValorTasado";
import {
    PLAZOS_ANIOS,
    PORCENTAJE_ENTRADA,
    SUPERFICIE_TIPO_M2,
    ahorroMensual,
    calcularEntrada,
    diferenciaConMediaNacional,
    getProvinciaPiloto,
    getProvinciasPiloto,
    getTodasProvincias,
    getViviendaMeta,
    puestoPorValor,
} from "@/lib/vivienda";

const BASE_URL = "https://www.metodokakebo.com";
const SECTION_PATH = "/ahorro-entrada-vivienda";
const { FaqSection, FaqItem } = components;

interface Props {
    params: Promise<{ provincia: string; locale: string }>;
}

// Solo se genera el locale por defecto: la sección es solo en español, como /plantillas.
export const dynamicParams = false;

export function generateStaticParams() {
    return getProvinciasPiloto().map((p) => ({ locale: "es", provincia: p.slug }));
}

const numero = new Intl.NumberFormat("es-ES", { useGrouping: "always", maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat("es-ES", { useGrouping: "always", minimumFractionDigits: 1, maximumFractionDigits: 1 });
const eur = (value: number) => `${numero.format(value)} €`;

function buildContent(slug: string) {
    const provincia = getProvinciaPiloto(slug);
    if (!provincia) return undefined;
    const meta = getViviendaMeta();
    const { valorEstimado, entrada } = calcularEntrada(provincia.valorM2);
    const plazos = PLAZOS_ANIOS.map((anios) => ({ anios, mensual: ahorroMensual(entrada, anios) }));
    const puesto = puestoPorValor(provincia.slug);
    const total = getTodasProvincias().length;
    const diferencia = diferenciaConMediaNacional(provincia.valorM2, meta.mediaNacionalM2);
    const pct = Math.round(PORCENTAJE_ENTRADA * 100);
    return { provincia, meta, valorEstimado, entrada, plazos, puesto, total, diferencia, pct };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { provincia: slug, locale } = await params;
    const content = buildContent(slug);
    if (!content || locale !== "es") return {};
    const { provincia, meta, entrada } = content;

    const url = `${BASE_URL}${SECTION_PATH}/${provincia.slug}`;
    const title = `Cuánto ahorrar para la entrada de un piso en ${provincia.nombre}`;
    const description = `Entrada del ${content.pct} % de un piso de ${SUPERFICIE_TIPO_M2} m² en ${provincia.nombre}: ${eur(entrada)} con el valor tasado oficial (${decimal.format(provincia.valorM2)} €/m², ${meta.periodo}) y ahorro mensual a 3, 5, 8 y 10 años.`;
    return {
        title,
        description,
        alternates: {
            canonical: url,
            languages: { es: url, "x-default": url },
        },
        openGraph: {
            title,
            description,
            type: "website",
            url,
            siteName: "MetodoKakebo.com",
            images: [
                {
                    url: `/api/og?title=${encodeURIComponent(`Entrada de un piso en ${provincia.nombre}`)}&description=${encodeURIComponent(
                        `Entrada del ${content.pct} %: ${eur(entrada)}. Valor tasado ${decimal.format(provincia.valorM2)} €/m² (${meta.periodo}).`,
                    )}`,
                    width: 1200,
                    height: 630,
                    alt: title,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
        },
    };
}

export default async function AhorroEntradaViviendaPage({ params }: Props) {
    const { provincia: slug, locale } = await params;
    const content = buildContent(slug);
    // Solo español: la ruta se renderiza dinámicamente, así que /en/... se rechaza aquí.
    if (!content || locale !== "es") notFound();

    const { provincia, meta, valorEstimado, entrada, plazos, puesto, total, diferencia, pct } = content;
    const url = `${BASE_URL}${SECTION_PATH}/${provincia.slug}`;
    const nombre = provincia.nombre;
    const otras = getProvinciasPiloto().filter((p) => p.slug !== provincia.slug);
    const maxM2 = Math.max(...getTodasProvincias().map((p) => p.valorM2));
    const fechaActualizacion = new Date(meta.consultado).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
    });
    const posicion =
        diferencia === 0
            ? "prácticamente igual que la media nacional"
            : diferencia > 0
              ? `un ${Math.abs(diferencia)} % por encima de la media nacional`
              : `un ${Math.abs(diferencia)} % por debajo de la media nacional`;

    const faq = [
        {
            question: `¿Cuánto es la entrada de un piso de ${SUPERFICIE_TIPO_M2} m² en ${nombre}?`,
            answer: `Con el valor tasado medio de ${decimal.format(provincia.valorM2)} €/m² (${meta.periodo}), un piso de ${SUPERFICIE_TIPO_M2} m² se valoraría en ${eur(valorEstimado)} y el ${pct} % de entrada sería ${eur(entrada)}. Es una referencia de tasación, no el precio de un piso concreto.`,
        },
        {
            question: `¿Cuánto hay que ahorrar al mes para esa entrada en ${nombre}?`,
            answer: `Sin contar intereses ni rentabilidad, ${plazos.map((p) => `${eur(p.mensual)} al mes en ${p.anios} años`).join(", ")}. Un plazo más largo reduce la cuota de ahorro, pero retrasa la compra.`,
        },
        {
            question: `¿El valor tasado es el precio al que se vende un piso en ${nombre}?`,
            answer: `No. El valor tasado es el que fijan las sociedades de tasación al valorar viviendas para una hipoteca. Puede diferir del precio de compraventa, que depende de la zona, el estado y la negociación.`,
        },
        {
            question: `¿La entrada incluye los impuestos y gastos de la compra en ${nombre}?`,
            answer: `No. El cálculo cubre solo el ${pct} % del valor de la vivienda. Los impuestos y gastos de compraventa se suman aparte y varían según la comunidad autónoma y el tipo de vivienda.`,
        },
    ];

    return (
        <main className="min-h-screen bg-background text-foreground">
            <article className="mx-auto max-w-3xl px-4 pt-24 pb-16 sm:px-6 lg:px-8">
                <nav aria-label="Migas de pan" className="mb-6 text-sm font-light text-muted-foreground">
                    <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <li>
                            <Link href="/" className="hover:text-primary hover:underline">
                                Inicio
                            </Link>
                        </li>
                        <li aria-hidden="true">/</li>
                        <li>
                            <Link href={SECTION_PATH} className="hover:text-primary hover:underline">
                                Entrada de vivienda por provincia
                            </Link>
                        </li>
                        <li aria-hidden="true">/</li>
                        <li aria-current="page">{nombre}</li>
                    </ol>
                </nav>

                <header className="mb-8">
                    <h1 className="mb-5 text-3xl font-serif font-bold leading-tight sm:text-4xl md:text-5xl">
                        ¿Cuánto ahorrar para la entrada de un piso en {nombre}?
                    </h1>
                    <p className="text-lg font-light leading-relaxed text-muted-foreground">
                        En {nombre}, el valor tasado medio de la vivienda libre fue de {decimal.format(provincia.valorM2)} €/m² en el{" "}
                        {meta.periodo}, {posicion} ({decimal.format(meta.mediaNacionalM2)} €/m²). Con ese dato, la entrada del {pct} % de
                        un piso de {SUPERFICIE_TIPO_M2} m² es de {eur(entrada)}.
                    </p>
                    <p className="mt-3 text-sm font-light text-muted-foreground">
                        Datos del {meta.periodo}. Última consulta de la fuente: <time dateTime={meta.consultado}>{fechaActualizacion}</time>.
                    </p>
                </header>

                <section className="mt-10">
                    <h2 className="mb-4 text-2xl font-serif font-bold">Entrada y ahorro mensual en {nombre}</h2>
                    <dl className="mb-6 grid gap-4 sm:grid-cols-3">
                        <div className="rounded-xl border border-border bg-muted/30 p-4">
                            <dt className="text-sm font-light text-muted-foreground">Valor tasado de {SUPERFICIE_TIPO_M2} m²</dt>
                            <dd className="mt-1 font-serif text-xl font-semibold">{eur(valorEstimado)}</dd>
                        </div>
                        <div className="rounded-xl border border-border bg-muted/30 p-4">
                            <dt className="text-sm font-light text-muted-foreground">Entrada del {pct} %</dt>
                            <dd className="mt-1 font-serif text-xl font-semibold">{eur(entrada)}</dd>
                        </div>
                        <div className="rounded-xl border border-border bg-muted/30 p-4">
                            <dt className="text-sm font-light text-muted-foreground">Puesto por valor tasado</dt>
                            <dd className="mt-1 font-serif text-xl font-semibold">
                                {puesto} de {total}
                            </dd>
                        </div>
                    </dl>

                    <table className="w-full text-left text-sm">
                        <caption className="mb-2 text-left text-sm font-light text-muted-foreground">
                            Ahorro mensual mínimo para reunir {eur(entrada)}, sin intereses
                        </caption>
                        <thead>
                            <tr className="border-b border-border">
                                <th scope="col" className="py-2 pr-4 font-semibold">
                                    Plazo
                                </th>
                                <th scope="col" className="py-2 font-semibold">
                                    Ahorro al mes
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {plazos.map((p) => (
                                <tr key={p.anios} className="border-b border-border/50">
                                    <td className="py-2 pr-4 font-light">{p.anios} años</td>
                                    <td className="py-2 font-light">{eur(p.mensual)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <GraficoValorTasado
                        nombre={nombre}
                        valorM2={provincia.valorM2}
                        mediaNacionalM2={meta.mediaNacionalM2}
                        maxM2={maxM2}
                        periodo={meta.periodo}
                    />
                </section>

                <section className="mt-12">
                    <h2 className="mb-4 text-2xl font-serif font-bold">Ajusta el cálculo a tu caso</h2>
                    <p className="mb-4 font-light leading-relaxed">
                        La tabla usa una vivienda de {SUPERFICIE_TIPO_M2} m² y una entrada del {pct} %. Cambia la superficie y el porcentaje para
                        ver tu entrada y el ahorro mensual en {nombre}.
                    </p>
                    <CalculadoraEntrada
                        nombre={nombre}
                        valorM2={provincia.valorM2}
                        superficieInicial={SUPERFICIE_TIPO_M2}
                        porcentajeInicial={PORCENTAJE_ENTRADA}
                    />
                </section>

                <section className="mt-12">
                    <h2 className="mb-4 text-2xl font-serif font-bold">Cómo se calcula</h2>
                    <ol className="list-decimal space-y-2 pl-6 font-light leading-relaxed marker:font-semibold marker:text-primary">
                        <li>
                            Se toma el valor tasado medio de la vivienda libre en {nombre}: {decimal.format(provincia.valorM2)} €/m².
                        </li>
                        <li>
                            Se multiplica por {SUPERFICIE_TIPO_M2} m², una superficie de referencia: {eur(valorEstimado)}.
                        </li>
                        <li>
                            Se aplica el {pct} % de entrada: {eur(entrada)}.
                        </li>
                        <li>Se divide entre los meses del plazo elegido y se redondea hacia arriba al euro.</li>
                    </ol>
                    <p className="mt-4 text-sm font-light leading-relaxed text-muted-foreground">
                        Aviso: el valor tasado no es el precio de mercado y el cálculo no incluye impuestos ni gastos de compraventa. Es una
                        estimación orientativa, no una oferta ni un asesoramiento financiero.
                    </p>
                </section>

                <section className="mt-12">
                    <h2 className="mb-4 text-2xl font-serif font-bold">Prepara el ahorro mes a mes</h2>
                    <p className="font-light leading-relaxed">
                        Para saber cuánto puedes apartar cada mes, calcula tu objetivo con la{" "}
                        <Link
                            href="/herramientas/calculadora-ahorro"
                            className="font-medium text-primary underline-offset-4 hover:underline"
                        >
                            calculadora de ahorro
                        </Link>{" "}
                        o registra tus gastos con el{" "}
                        <Link href="/" className="font-medium text-primary underline-offset-4 hover:underline">
                            Kakebo online gratis
                        </Link>
                        . Si buscas el método paso a paso, lee la{" "}
                        <Link
                            href="/blog/metodo-kakebo-guia-definitiva"
                            className="font-medium text-primary underline-offset-4 hover:underline"
                        >
                            guía del método Kakebo
                        </Link>
                        .
                    </p>
                </section>

                <section className="mt-12">
                    <h2 className="mb-4 text-2xl font-serif font-bold">Preguntas frecuentes</h2>
                    <FaqSection>
                        {faq.map((item) => (
                            <FaqItem key={item.question} question={item.question}>
                                {item.answer}
                            </FaqItem>
                        ))}
                    </FaqSection>
                </section>

                <section className="mt-12">
                    <h2 className="mb-4 text-2xl font-serif font-bold">Otras provincias</h2>
                    <ul className="flex flex-wrap gap-x-4 gap-y-2 font-light">
                        {otras.map((p) => (
                            <li key={p.slug}>
                                <Link
                                    href={`${SECTION_PATH}/${p.slug}`}
                                    className="text-primary underline-offset-4 hover:underline"
                                >
                                    {p.nombre}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>

                <p className="mt-10 text-sm font-light leading-relaxed text-muted-foreground">
                    {meta.cita}. Dato: valor tasado medio de vivienda libre, provincias, {meta.periodo}. Consultado el{" "}
                    <time dateTime={meta.consultado}>
                        {new Date(meta.consultado).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })}
                    </time>
                    . Fuente: <a href={meta.url} rel="noopener" className="underline-offset-4 hover:underline">{meta.fuente}</a>. Las
                    cifras de entrada y ahorro son un cálculo propio de MetodoKakebo.com a partir de ese dato.
                </p>
            </article>

            <Footer />

            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify([
                        {
                            "@context": "https://schema.org",
                            "@type": "WebPage",
                            "@id": `${url}#webpage`,
                            url,
                            name: `Cuánto ahorrar para la entrada de un piso en ${nombre}`,
                            inLanguage: "es",
                            dateModified: meta.consultado,
                            isPartOf: { "@type": "WebSite", name: "MetodoKakebo.com", url: BASE_URL },
                            publisher: { "@type": "Organization", name: "MetodoKakebo.com", url: BASE_URL },
                            citation: { "@type": "CreativeWork", name: meta.fuente, url: meta.url, publisher: { "@type": "Organization", name: meta.organismo } },
                        },
                        {
                            "@context": "https://schema.org",
                            "@type": "FAQPage",
                            mainEntity: faq.map((item) => ({
                                "@type": "Question",
                                name: item.question,
                                acceptedAnswer: { "@type": "Answer", text: item.answer },
                            })),
                        },
                        {
                            "@context": "https://schema.org",
                            "@type": "BreadcrumbList",
                            itemListElement: [
                                { "@type": "ListItem", position: 1, name: "Inicio", item: BASE_URL },
                                { "@type": "ListItem", position: 2, name: "Entrada de vivienda por provincia", item: `${BASE_URL}${SECTION_PATH}` },
                                { "@type": "ListItem", position: 3, name: `Entrada de un piso en ${nombre}`, item: url },
                            ],
                        },
                    ]),
                }}
            />
        </main>
    );
}
