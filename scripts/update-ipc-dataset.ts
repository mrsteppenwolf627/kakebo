/**
 * Descarga y normaliza la serie oficial del IPC general nacional del INE
 * (IPC290751, API JSON Tempus3) y regenera el dataset versionado en
 * src/lib/inflation/data/ipc-nacional-es.json.
 *
 * Ejecución manual o vía CI disparado a mano — nunca automática en runtime.
 * Uso: npx tsx scripts/update-ipc-dataset.ts
 *
 * Fuente: https://servicios.ine.es/wstempus/js/ES/DATOS_SERIE/IPC290751
 * Tabla relacionada: https://www.ine.es/jaxiT3/Tabla.htm?t=24077
 * Contexto: docs/adr/ADR-CALCULADORA-INFLACION-DATOS-HISTORICOS-01.md
 */

import fs from "fs";
import path from "path";

const SERIES_ID = "IPC290751";
const SOURCE_URL = `https://servicios.ine.es/wstempus/js/ES/DATOS_SERIE/${SERIES_ID}`;
const RELATED_TABLE_URL = "https://www.ine.es/jaxiT3/Tabla.htm?t=24077";
const LICENSE = "CC BY-SA 4.0";
// Base declarada por el INE en la fecha de creación de este script (2026-07-16).
// El INE puede rebasear la serie en el futuro; este valor NO se detecta automáticamente
// y debe revisarse manualmente si el código de serie cambia (ver comprobación de COD abajo).
const DOCUMENTED_BASE = "2025";
const EXPECTED_FIRST_PERIOD = "2002-01";
const FETCH_TIMEOUT_MS = 15_000;
const OUTPUT_PATH = path.resolve(
    __dirname,
    "../src/lib/inflation/data/ipc-nacional-es.json"
);

interface IneTipoDato {
    Id: number;
    Nombre: string;
    Codigo: string;
}

interface InePeriodo {
    Id: number;
    Valor: number; // mes 1-12
    Codigo: string;
    Nombre: string;
}

interface IneDataPoint {
    Fecha: number;
    TipoDato: IneTipoDato;
    Periodo: InePeriodo;
    Anyo: number;
    NombrePeriodo: string;
    CodigoPeriodo: string;
    Valor: number;
    Secreto: boolean;
}

interface IneSerieResponse {
    COD: string;
    Nombre: string;
    Data: IneDataPoint[];
}

interface IpcRecord {
    period: string; // "YYYY-MM"
    year: number;
    month: number;
    index: number;
}

interface IpcDataset {
    metadata: {
        source: string;
        seriesId: string;
        seriesName: string;
        sourceUrl: string;
        relatedTableUrl: string;
        license: string;
        coverageStart: string;
        coverageEnd: string;
        frequency: "monthly";
        base: string;
        recordCount: number;
        updatedAt: string;
        generator: string;
    };
    data: IpcRecord[];
}

class DatasetValidationError extends Error {}

function fail(message: string): never {
    console.error(`\n✗ ${message}\n`);
    process.exit(1);
}

async function fetchSeries(): Promise<IneSerieResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let response: Response;
    try {
        response = await fetch(`${SOURCE_URL}?nult=999&det=2`, {
            signal: controller.signal,
            headers: { Accept: "application/json" },
        });
    } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
            fail(`Timeout tras ${FETCH_TIMEOUT_MS}ms consultando ${SOURCE_URL}`);
        }
        fail(`Error de red consultando ${SOURCE_URL}: ${(err as Error).message}`);
    } finally {
        clearTimeout(timeout);
    }

    if (!response!.ok) {
        fail(
            `El endpoint del INE devolvió HTTP ${response!.status} (${response!.statusText}). ` +
                `URL: ${SOURCE_URL}`
        );
    }

    const contentType = response!.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
        fail(
            `Respuesta inesperada del INE: content-type "${contentType}" (se esperaba JSON). ` +
                `Posible cambio en el servicio — requiere revisión manual antes de reintentar.`
        );
    }

    const rawText = await response!.text();
    if (!rawText || rawText.trim().length === 0) {
        fail("El endpoint del INE devolvió una respuesta vacía.");
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(rawText);
    } catch {
        fail("La respuesta del INE no es JSON válido (posible cambio de formato del servicio).");
    }

    // El endpoint DATOS_SERIE/{id} devuelve un único objeto de serie (a diferencia de
    // DATOS_TABLA/{id}, que devuelve un array de series) — verificado empíricamente.
    const serie = parsed as Partial<IneSerieResponse>;

    if (!serie || typeof serie !== "object" || Array.isArray(serie) || !("COD" in serie) || !("Data" in serie)) {
        fail('Formato de respuesta inesperado: falta "COD" o "Data" en el objeto de serie.');
    }

    if (serie.COD !== SERIES_ID) {
        fail(
            `El código de serie devuelto ("${serie.COD}") no coincide con el esperado ` +
                `("${SERIES_ID}"). Esto puede indicar un cambio de base del INE que requiere ` +
                `revisión manual antes de continuar — no se debe concatenar automáticamente ` +
                `con series distintas.`
        );
    }

    if (!Array.isArray(serie.Data) || serie.Data.length === 0) {
        fail("La serie del INE no contiene ningún dato en Data[].");
    }

    return serie as IneSerieResponse;
}

function normalizeRecords(rawData: IneDataPoint[]): IpcRecord[] {
    const byPeriod = new Map<string, { record: IpcRecord; tipoDatoId: number }>();
    let rejected = 0;

    for (const point of rawData) {
        const year = point?.Anyo;
        const month = point?.Periodo?.Valor;
        const value = point?.Valor;
        const tipoDatoId = point?.TipoDato?.Id;

        const isValidYear = typeof year === "number" && Number.isInteger(year);
        const isValidMonth =
            typeof month === "number" && Number.isInteger(month) && month >= 1 && month <= 12;
        const isValidValue = typeof value === "number" && Number.isFinite(value) && value > 0;

        if (!isValidYear || !isValidMonth || !isValidValue || point.Secreto === true) {
            rejected += 1;
            continue;
        }

        const period = `${year}-${String(month).padStart(2, "0")}`;
        const record: IpcRecord = { period, year, month, index: value };

        const existing = byPeriod.get(period);
        if (!existing) {
            byPeriod.set(period, { record, tipoDatoId });
            continue;
        }

        // Periodo duplicado: se prioriza el dato "Definitivo" (Id 1) sobre cualquier
        // dato provisional. Si ambos son del mismo tipo, es una anomalía real.
        const DEFINITIVO_ID = 1;
        if (existing.tipoDatoId === DEFINITIVO_ID && tipoDatoId === DEFINITIVO_ID) {
            fail(
                `Periodo duplicado con dos registros "Definitivo" para ${period}: ` +
                    `valores ${existing.record.index} y ${value}. Requiere revisión manual.`
            );
        }
        if (tipoDatoId === DEFINITIVO_ID && existing.tipoDatoId !== DEFINITIVO_ID) {
            byPeriod.set(period, { record, tipoDatoId });
        }
        // Si el existente ya es Definitivo y el nuevo no lo es, se conserva el existente.
    }

    if (rejected > 0) {
        console.warn(`⚠ ${rejected} registro(s) del INE rechazados por datos inválidos/secretos.`);
    }

    return Array.from(byPeriod.values())
        .map((entry) => entry.record)
        .sort((a, b) => a.period.localeCompare(b.period));
}

function validateDataset(records: IpcRecord[]): void {
    if (records.length === 0) {
        throw new DatasetValidationError("El dataset normalizado no contiene ningún registro.");
    }

    const first = records[0];
    if (first.period !== EXPECTED_FIRST_PERIOD) {
        throw new DatasetValidationError(
            `El primer periodo es "${first.period}", se esperaba "${EXPECTED_FIRST_PERIOD}". ` +
                `Un cambio aquí puede indicar que el INE ha ampliado o recortado la cobertura ` +
                `de la serie — requiere revisión manual antes de aceptar el dataset.`
        );
    }

    const now = new Date();
    const currentPeriod = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
    const last = records[records.length - 1];
    if (last.period > currentPeriod) {
        throw new DatasetValidationError(
            `El último periodo ("${last.period}") es posterior al mes actual ("${currentPeriod}"). ` +
                `Un IPC "futuro" es imposible y sugiere un problema de datos.`
        );
    }

    const seen = new Set<string>();
    for (let i = 0; i < records.length; i++) {
        const record = records[i];

        if (seen.has(record.period)) {
            throw new DatasetValidationError(`Periodo duplicado tras normalizar: ${record.period}.`);
        }
        seen.add(record.period);

        if (!Number.isFinite(record.index) || record.index <= 0) {
            throw new DatasetValidationError(
                `Índice no válido en ${record.period}: ${record.index} (debe ser un número finito positivo).`
            );
        }

        if (i > 0) {
            const prev = records[i - 1];
            const expectedNext = nextPeriod(prev.period);
            if (record.period !== expectedNext) {
                throw new DatasetValidationError(
                    `Hueco mensual detectado entre ${prev.period} y ${record.period} ` +
                        `(se esperaba ${expectedNext}).`
                );
            }
        }
    }
}

function nextPeriod(period: string): string {
    const [year, month] = period.split("-").map(Number);
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    return `${nextYear}-${String(nextMonth).padStart(2, "0")}`;
}

function buildDataset(records: IpcRecord[], seriesName: string): IpcDataset {
    return {
        metadata: {
            source: "Instituto Nacional de Estadística (INE)",
            seriesId: SERIES_ID,
            seriesName: seriesName.trim(),
            sourceUrl: SOURCE_URL,
            relatedTableUrl: RELATED_TABLE_URL,
            license: LICENSE,
            coverageStart: records[0].period,
            coverageEnd: records[records.length - 1].period,
            frequency: "monthly",
            base: DOCUMENTED_BASE,
            recordCount: records.length,
            updatedAt: new Date().toISOString().slice(0, 10),
            generator: "scripts/update-ipc-dataset.ts",
        },
        data: records,
    };
}

function readExistingDataset(): IpcDataset | null {
    if (!fs.existsSync(OUTPUT_PATH)) return null;
    try {
        return JSON.parse(fs.readFileSync(OUTPUT_PATH, "utf-8")) as IpcDataset;
    } catch {
        return null;
    }
}

function datasetsHaveSameData(a: IpcDataset | null, b: IpcDataset): boolean {
    if (!a) return false;
    return JSON.stringify(a.data) === JSON.stringify(b.data);
}

async function main() {
    console.log(`→ Consultando ${SOURCE_URL} ...`);
    const serie = await fetchSeries();

    console.log(`→ Normalizando ${serie.Data.length} registro(s) crudos...`);
    const records = normalizeRecords(serie.Data);

    try {
        validateDataset(records);
    } catch (err) {
        if (err instanceof DatasetValidationError) {
            fail(err.message);
        }
        throw err;
    }

    // Guarda de regresión: si ya existe un dataset previo, no aceptar silenciosamente
    // una cobertura menor (posible respuesta parcial o error del servicio).
    const existing = readExistingDataset();
    if (existing && records.length < existing.metadata.recordCount) {
        fail(
            `El nuevo dataset tiene menos registros (${records.length}) que el existente ` +
                `(${existing.metadata.recordCount}). No se sobrescribe automáticamente — requiere revisión manual.`
        );
    }

    const dataset = buildDataset(records, serie.Nombre);
    const unchanged = datasetsHaveSameData(existing, dataset);

    if (!unchanged) {
        fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(dataset, null, 2) + "\n", "utf-8");
    }

    console.log("\n— Resumen —");
    console.log(`Serie:            ${SERIES_ID} (${dataset.metadata.seriesName})`);
    console.log(`Primer periodo:   ${dataset.metadata.coverageStart}`);
    console.log(`Último periodo:   ${dataset.metadata.coverageEnd}`);
    console.log(`Registros:        ${dataset.metadata.recordCount}`);
    console.log(`Archivo:          ${path.relative(process.cwd(), OUTPUT_PATH)}`);
    console.log(`¿Hubo cambios?:   ${unchanged ? "No (datos idénticos a los existentes)" : "Sí"}`);
    console.log("");
}

main().catch((err) => {
    fail(`Error inesperado: ${err instanceof Error ? err.message : String(err)}`);
});
