import { PREMIUM_PRIVATE_DIR } from "./config";

/**
 * Single manifest of the premium digital product: ONE purchase, THREE files.
 *
 * - Pure data: no I/O, safe to import anywhere (server or tests).
 * - `storageKey` is the exact object key inside the PRIVATE Supabase Storage bucket
 *   (`PREMIUM_STORAGE_BUCKET`). It is never a public URL and must never be rendered in
 *   HTML or sent to the client. It is the ONLY source of storage paths: nothing coming from
 *   a request may build or alter a path.
 * - `localFileName` is the git-ignored local copy under `PREMIUM_PACK_FOLDER` (preparation
 *   and integrity tests only; never served).
 * - `sizeBytes` and `sha256` were recorded when the files were registered (2026-10-05);
 *   sizes and MIME types were also verified against the uploaded Supabase objects. Update
 *   them whenever a file is replaced.
 */

/** Private Supabase Storage bucket that holds the pack (must stay NON-public). */
export const PREMIUM_STORAGE_BUCKET = "kakebo-premium";

/** Lifetime of a signed download URL, in seconds (10 minutes). */
export const PREMIUM_SIGNED_URL_TTL_SECONDS = 600;

export const PREMIUM_PACK_ID = "kakebo-master-system-pack";
export const PREMIUM_PACK_NAME = "Kakebo Master System";
export const PREMIUM_PACK_FOLDER = `${PREMIUM_PRIVATE_DIR}/${PREMIUM_PACK_ID}`;

export type PremiumPackFileId = "excel" | "tutorial" | "ebook";

export interface PremiumPackFile {
  /** Stable id used by the download route (`?file=<id>`; a selector, never an authorization). */
  id: PremiumPackFileId;
  order: number;
  /** Name shown to the buyer on the future private download page. */
  displayName: string;
  /** Object name inside the bucket folder. */
  internalName: string;
  /** Name of the git-ignored local copy inside `PREMIUM_PACK_FOLDER`. */
  localFileName: string;
  /** Name the buyer's browser will save the file as (Content-Disposition). */
  downloadFileName: string;
  kind: "xlsx" | "pdf";
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  description: string;
  version: string;
  /** Exact object key in the private bucket: `<pack id>/<internalName>`. */
  storageKey: string;
}

function file(f: Omit<PremiumPackFile, "storageKey">): PremiumPackFile {
  return { ...f, storageKey: `${PREMIUM_PACK_ID}/${f.internalName}` };
}

export const PREMIUM_PACK_FILES: readonly PremiumPackFile[] = [
  file({
    id: "excel",
    order: 1,
    displayName: "Plantilla Excel Kakebo Master System",
    internalName: "Kakebo_Master_System_v6.xlsx",
    localFileName: "kakebo-master-system-v6.xlsx",
    downloadFileName: "Kakebo_Master_System_v6.xlsx",
    kind: "xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    sizeBytes: 8781203,
    sha256: "370db38a76efacf2439f6bf18de4bcab93a056a260480fa64e8072601777081f",
    description:
      "Plantilla Excel sin macros con 12 hojas: portada, panel, configuración, plan mensual, registro, semanal, reflexión, objetivos, recurrentes, patrimonio, guía y comprobaciones.",
    version: "6",
  }),
  file({
    id: "tutorial",
    order: 2,
    displayName: "Tutorial PDF de la plantilla",
    internalName: "Kakebo_Master_System_Tutorial.pdf",
    localFileName: "kakebo-master-system-tutorial.pdf",
    downloadFileName: "Kakebo_Master_System_Tutorial.pdf",
    kind: "pdf",
    mimeType: "application/pdf",
    sizeBytes: 3437085,
    sha256: "4e18b68781004870da90e397a4a44e6f74aed333a8f0d85bac256efe5092076c",
    description: "Instrucciones de uso de la plantilla Excel (PDF de 8 páginas).",
    version: "1",
  }),
  file({
    id: "ebook",
    order: 3,
    displayName: "Ebook «El arte de mirar tu dinero»",
    internalName: "ebook-kakebo-master-system.pdf",
    localFileName: "el-arte-de-mirar-tu-dinero.pdf",
    downloadFileName: "El_arte_de_mirar_tu_dinero.pdf",
    kind: "pdf",
    mimeType: "application/pdf",
    sizeBytes: 4237502,
    sha256: "c9133da934f4f96ea4dc3b94da79808ec389a9ee7ce1648cb089d7d387a309e8",
    description: "Guía práctica de Kakebo y finanzas personales (PDF de 20 páginas).",
    version: "1",
  }),
];

/** Looks a file up by id. Anything not in the manifest returns undefined (strict allowlist). */
export function getPackFile(id: string | null | undefined): PremiumPackFile | undefined {
  if (!id) return undefined;
  return PREMIUM_PACK_FILES.find((f) => f.id === id);
}

/** Commercial terms the webhook enforces exactly (never taken from the client). */
export const PREMIUM_PACK_AMOUNT_CENTS = 990;
export const PREMIUM_PACK_CURRENCY = "eur";
/** Stripe product/session metadata key that must equal `PREMIUM_PACK_ID`. */
export const PREMIUM_PRODUCT_METADATA_KEY = "product_key";
