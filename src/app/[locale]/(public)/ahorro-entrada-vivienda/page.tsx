import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Footer } from "@/components/landing";
import JsonLd from "@/components/seo/JsonLd";
import * as S from "@/lib/seo/jsonld";
import {
    PLAZOS_ANIOS,
    PORCENTAJE_ENTRADA,
    SUPERFICIE_TIPO_M2,
    ahorroMensual,
    calcularEntrada,
    getProvinciasPiloto,
    getViviendaMeta,
} from "@/lib/vivienda";

const BASE_URL = "https://www.metodokakebo.com";
const SECTION_PATH = "/ahorro-entrada-vivienda";
const PLAZO_REFERENCIA = PLAZOS_ANIOS[PLAZOS_ANIOS.length - 1];

interface Props {
    params: Promise<{ locale: string }>;
}

// Solo español, como las páginas de provincia.
export const dynamicParams = false;

export function generateStaticParams() {
    return [{ locale: "es" }];
}

const numero = new Intl.NumberFormat("es-ES", { useGrouping: "always", maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat("es-ES", { useGrouping: "always", minimumFractionDigits: 1, maximumFractionDigits: 1 });
const eur = (value: number) => `${numero.format(value)} €`;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    if (locale !== "es") return {};
    const url = `${BASE_URL}${SECTION_PATH}`;
    const title = "Cuánto ahorrar para la entrada de un piso por provincia";
    const description = `Entrada del ${Math.round(PORCENTAJE_ENTRADA * 100)} % de un piso de ${SUPERFICIE_TIPO_M2} m² y ahorro mensual en 12 provincias, calculados con el valor tasado oficial del Ministerio de Transportes y Movilidad Sostenible.`;
    return {
        title,
        description,
        alternates: { canonical: url, languages: { es: url, "x-default": url } },
        openGraph: {
            title,
            description,
            type: "website",
            url,
            siteName: "MetodoKakebo.com",
            images: [
                {
                    url: `/api/og?title=${encodeURIComponent("Entrada de un piso por provincia")}&description=${encodeURIComponent(
                        "Cuánto ahorrar al mes según el valor tasado oficial de cada provincia.",
                    )}`,
                    width: 1200,
                    height: 630,
                    alt: title,
                },
            ],
        },
        twitter: { card: "summary_large_image", title, description },
    };
}

export default async function AhorroEntradaViviendaIndexPage({ params }: Props) {
    const { locale } = await params;
    if (locale !== "es") notFound();
    setRequestLocale(locale);

    const meta = getViviendaMeta();
    const url = `${BASE_URL}${SECTION_PATH}`;
    const pct = Math.round(PORCENTAJE_ENTRADA * 100);
    const filas = getProvinciasPiloto()
        .map((p) => {
            const { entrada } = calcularEntrada(p.valorM2);
            return { ...p, entrada, mensual: ahorroMensual(entrada, PLAZO_REFERENCIA) };
        })
        .sort((a, b) => b.valorM2 - a.valorM2);
    const fechaActualizacion = new Date(meta.consultado).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
    });

    const list = S.itemList(
        url,
        filas.map((p) => ({ name: `Entrada de un piso en ${p.nombre}`, url: `${url}/${p.slug}` })),
    );
    const graph = S.graph([
        ...S.core("es"),
        ...S.webPage({
            locale: "es",
            path: SECTION_PATH,
            type: "CollectionPage",
            name: "Cuánto ahorrar para la entrada de un piso por provincia",
            breadcrumbs: S.crumbs("es", [{ name: "Entrada de vivienda por provincia", path: SECTION_PATH }]),
            mainEntityId: list["@id"] as string,
            // Fecha de consulta del dato oficial, visible en la página como «Consultado el…».
            dateModified: meta.consultado,
        }),
        list,
    ]);

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
                        <li aria-current="page">Entrada de vivienda por provincia</li>
                    </ol>
                </nav>

                <header className="mb-8">
                    <h1 className="mb-5 text-3xl font-serif font-bold leading-tight sm:text-4xl md:text-5xl">
                        ¿Cuánto ahorrar para la entrada de un piso, provincia a provincia?
                    </h1>
                    <p className="text-lg font-light leading-relaxed text-muted-foreground">
                        Comparamos el {pct} % de entrada de un piso de {SUPERFICIE_TIPO_M2} m² con el valor tasado medio oficial de cada
                        provincia ({meta.periodo}) y el ahorro mensual necesario a {PLAZO_REFERENCIA} años, sin intereses. Elige tu provincia
                        para ver todos los plazos y ajustar la superficie y el porcentaje.
                    </p>
                    <p className="mt-3 text-sm font-light text-muted-foreground">
                        Última consulta de la fuente: <time dateTime={meta.consultado}>{fechaActualizacion}</time>.
                    </p>
                </header>

                <section>
                    <h2 className="mb-4 text-2xl font-serif font-bold">Provincias, de mayor a menor valor tasado</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <caption className="mb-2 text-left text-sm font-light text-muted-foreground">
                                Valor tasado medio, entrada del {pct} % y ahorro mensual a {PLAZO_REFERENCIA} años
                            </caption>
                            <thead>
                                <tr className="border-b border-border">
                                    <th scope="col" className="py-2 pr-4 font-semibold">
                                        Provincia
                                    </th>
                                    <th scope="col" className="py-2 pr-4 font-semibold">
                                        Valor tasado (€/m²)
                                    </th>
                                    <th scope="col" className="py-2 pr-4 font-semibold">
                                        Entrada
                                    </th>
                                    <th scope="col" className="py-2 font-semibold">
                                        Ahorro al mes ({PLAZO_REFERENCIA} años)
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filas.map((p) => (
                                    <tr key={p.slug} className="border-b border-border/50">
                                        <th scope="row" className="py-2 pr-4 font-medium">
                                            <Link href={`${SECTION_PATH}/${p.slug}`} className="text-primary underline-offset-4 hover:underline">
                                                {p.nombre}
                                            </Link>
                                        </th>
                                        <td className="py-2 pr-4 font-light">{decimal.format(p.valorM2)}</td>
                                        <td className="py-2 pr-4 font-light">{eur(p.entrada)}</td>
                                        <td className="py-2 font-light">{eur(p.mensual)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="mt-4 text-sm font-light leading-relaxed text-muted-foreground">
                        Media nacional: {decimal.format(meta.mediaNacionalM2)} €/m². Aviso: el valor tasado no es el precio de mercado y el
                        cálculo no incluye impuestos ni gastos de compraventa. Es una estimación orientativa, no una oferta ni un
                        asesoramiento financiero.
                    </p>
                </section>

                <section className="mt-12">
                    <h2 className="mb-4 text-2xl font-serif font-bold">Prepara el ahorro mes a mes</h2>
                    <p className="font-light leading-relaxed">
                        Para saber cuánto puedes apartar cada mes, calcula tu objetivo con la{" "}
                        <Link href="/herramientas/calculadora-ahorro" className="font-medium text-primary underline-offset-4 hover:underline">
                            calculadora de ahorro
                        </Link>{" "}
                        o registra tus gastos con el{" "}
                        <Link href="/" className="font-medium text-primary underline-offset-4 hover:underline">
                            Kakebo online gratis
                        </Link>
                        . Si buscas el método paso a paso, lee la{" "}
                        <Link href="/blog/metodo-kakebo-guia-definitiva" className="font-medium text-primary underline-offset-4 hover:underline">
                            guía del método Kakebo
                        </Link>
                        .
                    </p>
                </section>

                <p className="mt-10 text-sm font-light leading-relaxed text-muted-foreground">
                    {meta.cita}. Dato: valor tasado medio de vivienda libre, provincias, {meta.periodo}. Fuente:{" "}
                    <a href={meta.url} rel="noopener" className="underline-offset-4 hover:underline">
                        {meta.fuente}
                    </a>
                    . Las cifras de entrada y ahorro son un cálculo propio de MetodoKakebo.com a partir de ese dato.
                </p>
            </article>

            <Footer />

            <JsonLd graph={graph} />
        </main>
    );
}
