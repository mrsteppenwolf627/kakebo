/**
 * Contrato del adaptador Azure Document Intelligence Receipt (Fase 6).
 *
 * SOLO contrato: sin SDK, sin credenciales, sin claves, sin endpoints, sin red.
 * No se describe ninguna API de Azure: no se ha podido demostrar con el
 * repositorio, así que el mapeo a `NormalizedReceiptV1` queda PENDIENTE.
 *
 * El piloto usará EXCLUSIVAMENTE documentos sintéticos o completamente
 * anonimizados. No se envía ningún ticket real hasta que existan DPA, región,
 * retención, subprocesadores y benchmark con documentos sintéticos/anonimizados
 * (decision-log §11). Mientras tanto el adaptador está desactivado y nunca
 * llama a nada.
 */
import type { OcrOutcome, ReceiptOcrProvider } from "./ocr-contract";

export const AZURE_RECEIPT_PROVIDER_ID = "azure-document-intelligence-receipt";
export const AZURE_RECEIPT_ADAPTER_VERSION = "contract-0";

/** Único tipo de dato admitido en el piloto. */
export const PILOT_ALLOWED_DATA = ["synthetic", "anonymized"] as const;
export type PilotDataClass = (typeof PILOT_ALLOWED_DATA)[number] | "real";

export const PILOT_PREREQUISITES = [
  "dpa_signed",
  "region_decided",
  "retention_configured",
  "subprocessors_reviewed",
  "synthetic_benchmark_done",
] as const;
export type PilotPrerequisite = (typeof PILOT_PREREQUISITES)[number];

export type PilotReadiness =
  | { ready: true }
  | { ready: false; missing: PilotPrerequisite[] };

/** Estado de los prerrequisitos contractuales. Por defecto, todos sin cumplir. */
export function evaluatePilotReadiness(done: Partial<Record<PilotPrerequisite, boolean>> = {}): PilotReadiness {
  const missing = PILOT_PREREQUISITES.filter((p) => done[p] !== true);
  return missing.length === 0 ? { ready: true } : { ready: false, missing };
}

/** Un documento solo puede salir hacia el piloto si es sintético o anonimizado. */
export function isPilotDataAllowed(dataClass: PilotDataClass): boolean {
  return (PILOT_ALLOWED_DATA as readonly string[]).includes(dataClass);
}

/**
 * Adaptador desactivado: implementa la interfaz común pero devuelve siempre
 * `config` / `PILOT_NOT_ENABLED` sin leer `req.bytes` ni hacer I/O.
 */
export const azureReceiptDisabledAdapter: ReceiptOcrProvider = {
  id: AZURE_RECEIPT_PROVIDER_ID,
  adapterVersion: AZURE_RECEIPT_ADAPTER_VERSION,
  async analyze(): Promise<OcrOutcome> {
    return { ok: false, kind: "config", code: "PILOT_NOT_ENABLED" };
  },
};
