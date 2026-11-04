import data from "@/content/plantillas/plantillas.es.json";

export interface Plantilla {
    slug: string;
    title: string;
    metaDescription: string;
    h1: string;
    format: string;
    year: number | null;
    asset: {
        path: string;
        pages: number;
        sizeKb: number;
        previewImage: string | null;
    };
    targetQueries: string[];
    intro: string;
    steps: string[];
    includes: string[];
    faq: { question: string; answer: string }[];
    updatedDate: string;
    related: string[];
}

const REQUIRED_STRINGS = ["slug", "title", "metaDescription", "h1", "format", "intro", "updatedDate"] as const;

// Fails the build when a row misses a required field (spec §2).
export function validatePlantilla(row: unknown, index: number): Plantilla {
    const r = row as Partial<Plantilla> | null;
    const where = `plantillas.es.json[${index}]`;
    if (!r || typeof r !== "object") throw new Error(`${where}: fila no válida`);
    for (const key of REQUIRED_STRINGS) {
        const value = r[key];
        if (typeof value !== "string" || value.trim() === "") {
            throw new Error(`${where}: falta el campo obligatorio "${key}"`);
        }
    }
    if (typeof r.asset?.path !== "string" || r.asset.path.trim() === "") {
        throw new Error(`${where}: falta el campo obligatorio "asset.path"`);
    }
    if (!Array.isArray(r.steps) || r.steps.length === 0) {
        throw new Error(`${where}: falta el campo obligatorio "steps"`);
    }
    if (!Array.isArray(r.faq) || r.faq.length < 3) {
        throw new Error(`${where}: "faq" necesita 3 preguntas o más`);
    }
    return r as Plantilla;
}

export function getPlantillas(rows: unknown[] = data): Plantilla[] {
    return rows.map(validatePlantilla);
}

export function getPlantilla(slug: string): Plantilla | undefined {
    return getPlantillas().find((p) => p.slug === slug);
}
