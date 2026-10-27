/**
 * Contrato del adaptador OCR del escáner de tickets (Fase 5).
 *
 * Solo tipos y validación: sin SDK de proveedor, sin red, sin I/O. El dominio
 * depende de `ReceiptOcrProvider`; ningún tipo de un proveedor sale de su
 * adaptador (docs/ticket-scanner/technical-architecture.md §E, F4-10).
 * El proveedor candidato para un piloto futuro (Azure Document Intelligence
 * Receipt) NO está integrado: faltan DPA, credenciales, región, retención,
 * subprocesadores y benchmark con documentos anonimizados.
 *
 * Los importes son céntimos enteros y la moneda inicial es EUR (F4-2). La
 * confianza es 0..1 o `null` (= el proveedor no la da → "unknown"). No se
 * definen umbrales low/medium/high: están PENDIENTES (F3-13).
 */
import { z } from "zod";

export const OCR_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const;
export type OcrMime = (typeof OCR_MIME_TYPES)[number];

export type ConfidenceInput = number | null;

export interface OcrRequest {
  /** Opaco. */
  attemptId: string;
  /** Por intento. */
  idempotencyKey: string;
  /** Nunca una URL aportada por el cliente. */
  bytes: Uint8Array;
  mime: OcrMime;
  pageCount: number;
  locale: "es" | "en";
  hints: { country: "ES"; currency: "EUR" };
  /** Tiempo máximo total. */
  deadlineMs: number;
}

export interface OcrField<T> {
  value: T | null;
  confidence: ConfidenceInput;
}

export interface NormalizedReceiptLine {
  description: OcrField<string>;
  quantity: OcrField<number>;
  amountCents: OcrField<number>;
}

export interface NormalizedReceiptV1 {
  schemaVersion: 1;
  merchant: OcrField<string>;
  /** ISO yyyy-mm-dd. */
  date: OcrField<string>;
  currency: OcrField<string>;
  totalCents: OcrField<number>;
  taxCents: OcrField<number>;
  paymentMethod: OcrField<"cash" | "card" | "other">;
  lines: NormalizedReceiptLine[];
  pagesBilled: number;
  providerRequestId: string | null;
  versions: { adapter: string; providerModel: string | null };
}

export const OCR_ERROR_KINDS = ["transient", "permanent", "unsupported", "quota", "config"] as const;
export type OcrErrorKind = (typeof OCR_ERROR_KINDS)[number];

export type OcrOutcome =
  | { ok: true; receipt: NormalizedReceiptV1 }
  | {
      ok: false;
      kind: OcrErrorKind;
      /** Enumerado; nunca texto libre del proveedor. */
      code: string;
    };

export interface ReceiptOcrProvider {
  readonly id: string;
  readonly adapterVersion: string;
  analyze(req: OcrRequest): Promise<OcrOutcome>;
}

const confidence = z.number().min(0).max(1).nullable();
const field = <T extends z.ZodType>(value: T) => z.strictObject({ value: value.nullable(), confidence });
const cents = z.number().int().safe();

/** Esquema estricto: cualquier clave no listada se rechaza (minimización). */
export const normalizedReceiptV1Schema = z.strictObject({
  schemaVersion: z.literal(1),
  merchant: field(z.string().max(200)),
  date: field(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  currency: field(z.string().max(8)),
  totalCents: field(cents),
  taxCents: field(cents),
  paymentMethod: field(z.enum(["cash", "card", "other"])),
  lines: z.array(
    z.strictObject({
      description: field(z.string().max(200)),
      quantity: field(z.number().positive()),
      amountCents: field(cents),
    })
  ),
  pagesBilled: z.number().int().min(0),
  providerRequestId: z.string().max(100).nullable(),
  versions: z.strictObject({ adapter: z.string().max(40), providerModel: z.string().max(80).nullable() }),
});

export type ParseReceiptResult =
  | { ok: true; receipt: NormalizedReceiptV1 }
  | { ok: false; code: "INVALID_RECEIPT_SHAPE" };

/**
 * Valida la salida de un adaptador. El error no contiene el contenido ni los
 * mensajes de validación (podrían citar valores del ticket).
 */
export function parseNormalizedReceipt(input: unknown): ParseReceiptResult {
  const parsed = normalizedReceiptV1Schema.safeParse(input);
  return parsed.success ? { ok: true, receipt: parsed.data } : { ok: false, code: "INVALID_RECEIPT_SHAPE" };
}

export type ConfidenceLevel = "unknown" | "known";

/** `null`, no finito o fuera de 0..1 → "unknown". Sin umbrales (PENDIENTES, F3-13). */
export function describeConfidence(value: ConfidenceInput | undefined): ConfidenceLevel {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1 ? "known" : "unknown";
}
