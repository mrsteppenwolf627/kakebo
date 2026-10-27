/**
 * Adaptador de Supabase Storage PRIVADO para originales temporales del escáner (Fase 7).
 *
 * SOLO servidor. Bucket exacto: `kakebo-ticket-temp` (privado, 5 MB, JPEG/PNG/HEIC/HEIF, creado a mano).
 * Reglas:
 *  - Nunca `getPublicUrl`: las lecturas usan la sesión del usuario o una URL firmada de vida corta.
 *  - La ruta la genera el servidor: `<userId>/<ticketId>/<uuid>`; sin nombre de archivo original.
 *  - El cliente Supabase se INYECTA: sesión del usuario (`createClient` de `@/lib/supabase/server`) para
 *    subir/leer; el cliente de servicio solo lo usa el job de limpieza. Este módulo no lee variables de entorno
 *    ni importa el cliente de servicio, así que no puede exponer la service role.
 *  - Implementa `PrivateTicketStorage` (retention.ts), de modo que el borrado verificado se reutiliza tal cual.
 */
import type { PrivateTicketStorage } from "./retention";

export const SCANNER_TICKET_BUCKET = "kakebo-ticket-temp";
export const SCANNER_MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const SCANNER_ALLOWED_MIME = ["image/jpeg", "image/png", "image/heic", "image/heif"] as const;
export type ScannerMime = (typeof SCANNER_ALLOWED_MIME)[number];

export const SIGNED_URL_DEFAULT_TTL_SECONDS = 60;
export const SIGNED_URL_MAX_TTL_SECONDS = 120;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PATH = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\/[0-9a-f-]{36}$/i;

/** Subconjunto estructural de `supabase.storage.from(bucket)` que usa el adaptador. */
export interface StorageBucketApi {
  upload(
    path: string,
    body: ArrayBuffer | Uint8Array | Blob,
    options: { contentType: string; upsert: boolean; cacheControl?: string }
  ): Promise<{ data: unknown; error: { message: string } | null }>;
  createSignedUrl(
    path: string,
    expiresIn: number
  ): Promise<{ data: { signedUrl: string } | null; error: { message: string } | null }>;
  createSignedUploadUrl?: (
    path: string
  ) => Promise<{ data: { signedUrl: string; token: string; path: string } | null; error: { message: string } | null }>;
  remove(paths: string[]): Promise<{ data: unknown; error: { message: string } | null }>;
  list(
    folder: string,
    options?: { limit?: number; search?: string }
  ): Promise<{ data: { name: string }[] | null; error: { message: string } | null }>;
}

export interface StorageClientLike {
  storage: { from(bucket: string): StorageBucketApi };
}

export type StorageErrorCode = "INVALID_INPUT" | "TOO_LARGE" | "UNSUPPORTED_TYPE" | "STORAGE_ERROR";
export type UploadResult = { ok: true; objectPath: string } | { ok: false; code: StorageErrorCode };
export type SignedReadResult = { ok: true; url: string; expiresInSeconds: number } | { ok: false; code: StorageErrorCode };
export type SignedUploadResult = { ok: true; path: string; url: string; token: string; maxBytes: number } | { ok: false; code: StorageErrorCode };

export function buildObjectPath(userId: string, ticketId: string, objectId: string = crypto.randomUUID()): string | null {
  if (![userId, ticketId, objectId].every((v) => UUID.test(v))) return null;
  return `${userId}/${ticketId}/${objectId}`;
}

export class PrivateTicketBucket implements PrivateTicketStorage {
  readonly visibility = "private" as const;
  private readonly bucket: StorageBucketApi;

  constructor(client: StorageClientLike) {
    this.bucket = client.storage.from(SCANNER_TICKET_BUCKET);
  }

  /** Sube un original. `upsert: false`: nunca sobrescribe. Valida tipo y tamaño antes de la red. */
  async upload(args: {
    userId: string;
    ticketId: string;
    bytes: Uint8Array | ArrayBuffer;
    contentType: string;
  }): Promise<UploadResult> {
    if (!(SCANNER_ALLOWED_MIME as readonly string[]).includes(args.contentType)) {
      return { ok: false, code: "UNSUPPORTED_TYPE" };
    }
    const size = args.bytes.byteLength;
    if (size === 0) return { ok: false, code: "INVALID_INPUT" };
    if (size > SCANNER_MAX_UPLOAD_BYTES) return { ok: false, code: "TOO_LARGE" };
    const objectPath = buildObjectPath(args.userId, args.ticketId);
    if (!objectPath) return { ok: false, code: "INVALID_INPUT" };

    const { error } = await this.bucket.upload(objectPath, args.bytes, {
      contentType: args.contentType,
      upsert: false,
      cacheControl: "no-store",
    });
    return error ? { ok: false, code: "STORAGE_ERROR" } : { ok: true, objectPath };
  }

  /** URL firmada de vida corta (tope 120 s). Es un secreto: no registrarla ni guardarla. */
  async createReadUrl(objectPath: string, ttlSeconds: number = SIGNED_URL_DEFAULT_TTL_SECONDS): Promise<SignedReadResult> {
    if (!PATH.test(objectPath)) return { ok: false, code: "INVALID_INPUT" };
    const ttl = Math.min(Math.max(Math.floor(ttlSeconds) || SIGNED_URL_DEFAULT_TTL_SECONDS, 1), SIGNED_URL_MAX_TTL_SECONDS);
    const { data, error } = await this.bucket.createSignedUrl(objectPath, ttl);
    if (error || !data?.signedUrl) return { ok: false, code: "STORAGE_ERROR" };
    return { ok: true, url: data.signedUrl, expiresInSeconds: ttl };
  }

  /** Autoriza una sola subida a una ruta opaca. Si el cliente no soporta URLs firmadas, falla cerrado. */
  async createUploadUrl(userId: string, ticketId: string): Promise<SignedUploadResult> {
    const objectPath = buildObjectPath(userId, ticketId);
    if (!objectPath || typeof this.bucket.createSignedUploadUrl !== "function") return { ok: false, code: "STORAGE_ERROR" };
    const { data, error } = await this.bucket.createSignedUploadUrl(objectPath);
    if (error || !data?.signedUrl || !data.token || data.path !== objectPath) return { ok: false, code: "STORAGE_ERROR" };
    return { ok: true, path: objectPath, url: data.signedUrl, token: data.token, maxBytes: SCANNER_MAX_UPLOAD_BYTES };
  }

  async remove(objectPath: string): Promise<{ ok: boolean }> {
    if (!PATH.test(objectPath)) return { ok: false };
    const { error } = await this.bucket.remove([objectPath]);
    return { ok: !error };
  }

  /** Comprobación independiente: lista la carpeta del ticket y busca el objeto. */
  async exists(objectPath: string): Promise<{ ok: true; exists: boolean } | { ok: false }> {
    if (!PATH.test(objectPath)) return { ok: false };
    const slash = objectPath.lastIndexOf("/");
    const folder = objectPath.slice(0, slash);
    const name = objectPath.slice(slash + 1);
    const { data, error } = await this.bucket.list(folder, { limit: 100, search: name });
    if (error || !data) return { ok: false };
    return { ok: true, exists: data.some((o) => o.name === name) };
  }
}
