import data from "@/content/vivienda/valor-tasado.es.json";

export interface Provincia {
    slug: string;
    nombre: string;
    /** Valor tasado medio de vivienda libre, euros por m² (dato oficial). */
    valorM2: number;
    /** true = tiene página propia en el piloto. */
    piloto: boolean;
}

export interface ViviendaMeta {
    fuente: string;
    organismo: string;
    cita: string;
    url: string;
    avisoLegalUrl: string;
    periodo: string;
    mediaNacionalM2: number;
    consultado: string;
}

/** Hipótesis de cálculo, siempre visibles en la página. */
export const SUPERFICIE_TIPO_M2 = 80;
export const PORCENTAJE_ENTRADA = 0.2;
export const PLAZOS_ANIOS = [3, 5, 8, 10] as const;

const REQUIRED_META = ["fuente", "organismo", "cita", "url", "avisoLegalUrl", "periodo", "consultado"] as const;

// Falla el build cuando falta un campo obligatorio o el dato no es válido.
export function validateProvincia(row: unknown, index: number): Provincia {
    const r = row as Partial<Provincia> | null;
    const where = `valor-tasado.es.json[provincias][${index}]`;
    if (!r || typeof r !== "object") throw new Error(`${where}: fila no válida`);
    for (const key of ["slug", "nombre"] as const) {
        const value = r[key];
        if (typeof value !== "string" || value.trim() === "") {
            throw new Error(`${where}: falta el campo obligatorio "${key}"`);
        }
    }
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(r.slug as string)) {
        throw new Error(`${where}: "slug" no válido`);
    }
    if (typeof r.valorM2 !== "number" || !Number.isFinite(r.valorM2) || r.valorM2 <= 0) {
        throw new Error(`${where}: falta el campo obligatorio "valorM2" (número mayor que 0)`);
    }
    if (typeof r.piloto !== "boolean") {
        throw new Error(`${where}: falta el campo obligatorio "piloto"`);
    }
    return r as Provincia;
}

export function validateMeta(meta: unknown): ViviendaMeta {
    const m = meta as Partial<ViviendaMeta> | null;
    if (!m || typeof m !== "object") throw new Error("valor-tasado.es.json[meta]: no válido");
    for (const key of REQUIRED_META) {
        const value = m[key];
        if (typeof value !== "string" || value.trim() === "") {
            throw new Error(`valor-tasado.es.json[meta]: falta el campo obligatorio "${key}"`);
        }
    }
    if (typeof m.mediaNacionalM2 !== "number" || !(m.mediaNacionalM2 > 0)) {
        throw new Error('valor-tasado.es.json[meta]: falta el campo obligatorio "mediaNacionalM2"');
    }
    return m as ViviendaMeta;
}

export function getViviendaMeta(source: { meta: unknown } = data): ViviendaMeta {
    return validateMeta(source.meta);
}

/** Las 50 provincias, validadas y sin slugs repetidos. */
export function getTodasProvincias(rows: unknown[] = data.provincias): Provincia[] {
    const provincias = rows.map(validateProvincia);
    const slugs = provincias.map((p) => p.slug);
    if (new Set(slugs).size !== slugs.length) throw new Error("valor-tasado.es.json: slugs repetidos");
    return provincias;
}

/** Solo las provincias con página en el piloto. */
export function getProvinciasPiloto(rows: unknown[] = data.provincias): Provincia[] {
    return getTodasProvincias(rows).filter((p) => p.piloto);
}

export function getProvinciaPiloto(slug: string): Provincia | undefined {
    return getProvinciasPiloto().find((p) => p.slug === slug);
}

export interface Entrada {
    superficieM2: number;
    valorEstimado: number;
    entrada: number;
}

/** Cálculo determinista: valor tasado medio por m² × superficie tipo, y entrada como % de ese valor. */
export function calcularEntrada(
    valorM2: number,
    superficieM2: number = SUPERFICIE_TIPO_M2,
    porcentaje: number = PORCENTAJE_ENTRADA,
): Entrada {
    if (!Number.isFinite(valorM2) || valorM2 <= 0) throw new Error("valorM2 debe ser un número mayor que 0");
    if (!Number.isFinite(superficieM2) || superficieM2 <= 0) throw new Error("superficieM2 debe ser mayor que 0");
    if (!Number.isFinite(porcentaje) || porcentaje <= 0 || porcentaje > 1) {
        throw new Error("porcentaje debe estar entre 0 (excluido) y 1");
    }
    const valorEstimado = Math.round(valorM2 * superficieM2);
    const entrada = Math.round(valorEstimado * porcentaje);
    return { superficieM2, valorEstimado, entrada };
}

/** Ahorro mensual mínimo para llegar a la entrada, sin intereses: se redondea hacia arriba al euro. */
export function ahorroMensual(entrada: number, anios: number): number {
    if (!Number.isFinite(entrada) || entrada <= 0) throw new Error("entrada debe ser mayor que 0");
    if (!Number.isInteger(anios) || anios <= 0) throw new Error("anios debe ser un entero mayor que 0");
    return Math.ceil(entrada / (anios * 12));
}

/** Puesto de la provincia entre las 50 (1 = valor tasado más alto). */
export function puestoPorValor(slug: string, provincias: Provincia[] = getTodasProvincias()): number {
    const ordenadas = [...provincias].sort((a, b) => b.valorM2 - a.valorM2);
    const index = ordenadas.findIndex((p) => p.slug === slug);
    if (index === -1) throw new Error(`provincia desconocida: ${slug}`);
    return index + 1;
}

/** Diferencia porcentual (redondeada a entero) respecto a la media nacional del mismo periodo. */
export function diferenciaConMediaNacional(valorM2: number, mediaNacionalM2: number): number {
    if (!(mediaNacionalM2 > 0)) throw new Error("mediaNacionalM2 debe ser mayor que 0");
    return Math.round((valorM2 / mediaNacionalM2 - 1) * 100);
}
