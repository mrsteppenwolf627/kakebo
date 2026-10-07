import { createAdminClient } from "@/lib/supabase/admin";
import { PREMIUM_ACCESS_COOKIE, findPurchaseByToken, insertDownload } from "./purchases";
import {
  PREMIUM_PACK_ID,
  PREMIUM_SIGNED_URL_TTL_SECONDS,
  PREMIUM_STORAGE_BUCKET,
  getPackFile,
  type PremiumPackFile,
} from "./manifest";

/**
 * Delivery layer for the premium pack. SERVER-ONLY: never import this from a client component
 * (it reaches the Supabase service-role client).
 *
 * Three seams:
 *   1. Entitlement: does this request carry a valid guest access token of a PAID purchase?
 *   2. Storage: private Supabase Storage bucket that hands out short-lived signed URLs.
 *   3. Download log: one record per file delivered.
 *
 * Nothing here may be unlocked by query params, headers or client-supplied flags.
 */

// ---------------------------------------------------------------------------
// 1. Entitlement
// ---------------------------------------------------------------------------

export type EntitlementResult =
  | { granted: true; purchaseId: string }
  | { granted: false; reason: "no_purchase" | "storage_error" };

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim() || null;
  }
  return null;
}

/**
 * Guest entitlement (no account). The ONLY credential is the HttpOnly access cookie minted by
 * /api/premium/claim after the signed webhook recorded a paid purchase; it is looked up by hash
 * and must belong to a non-revoked token of a purchase with status "paid". Query params,
 * headers and client flags are never consulted. One purchase grants all three files.
 * Independent of app access (profiles/access_grants/Plus).
 */
export async function verifyPackEntitlement(
  packId: string,
  request: Request | null = null
): Promise<EntitlementResult> {
  if (packId !== PREMIUM_PACK_ID || !request) return { granted: false, reason: "no_purchase" };
  const token = readCookie(request, PREMIUM_ACCESS_COOKIE);
  if (!token || token.length > 200) return { granted: false, reason: "no_purchase" };
  try {
    const found = await findPurchaseByToken(token);
    return found ? { granted: true, purchaseId: found.purchaseId } : { granted: false, reason: "no_purchase" };
  } catch {
    return { granted: false, reason: "storage_error" };
  }
}

// ---------------------------------------------------------------------------
// 2. Private storage (Supabase Storage, signed URLs)
// ---------------------------------------------------------------------------

export interface PremiumDownloadGrant {
  /** Short-lived signed URL. Treat as a secret: never log it, never render it in HTML. */
  url: string;
  expiresAt: Date;
}

export interface PremiumFileStorage {
  /**
   * Returns time-limited access to ONE file of the pack. The object key comes from the
   * manifest, never from user input.
   */
  createDownloadGrant(file: PremiumPackFile, opts: { expiresInSeconds: number }): Promise<PremiumDownloadGrant>;
}

/** Credentials/config for the storage client are missing. Message is generic on purpose. */
export class PremiumStorageNotConfiguredError extends Error {
  constructor() {
    super("Premium private storage is not configured.");
    this.name = "PremiumStorageNotConfiguredError";
  }
}

/** Any other storage failure. Carries only a short, non-sensitive reason code. */
export class PremiumStorageError extends Error {
  constructor(public readonly reason: "invalid_file" | "signing_failed") {
    super("Premium private storage error.");
    this.name = "PremiumStorageError";
  }
}

export function getPremiumStorage(): PremiumFileStorage {
  return {
    async createDownloadGrant(file, { expiresInSeconds }) {
      // Only a manifest entry can ever be signed; a forged object with another key is rejected.
      const entry = getPackFile(file?.id);
      if (!entry || entry.storageKey !== file.storageKey) {
        throw new PremiumStorageError("invalid_file");
      }

      let client: ReturnType<typeof createAdminClient>;
      try {
        client = createAdminClient();
      } catch {
        throw new PremiumStorageNotConfiguredError();
      }

      const ttl = Math.min(Math.max(1, Math.floor(expiresInSeconds)), PREMIUM_SIGNED_URL_TTL_SECONDS);
      const { data, error } = await client.storage
        .from(PREMIUM_STORAGE_BUCKET)
        .createSignedUrl(entry.storageKey, ttl, { download: entry.downloadFileName });

      if (error || !data?.signedUrl) throw new PremiumStorageError("signing_failed");

      return { url: data.signedUrl, expiresAt: new Date(Date.now() + ttl * 1000) };
    },
  };
}

// ---------------------------------------------------------------------------
// 3. Download log (per file)
// ---------------------------------------------------------------------------

export interface PremiumDownloadRecord {
  packId: string;
  fileId: string;
  purchaseId: string;
}

/** One row per delivered file. Never throws: a logging failure must not block a paid download. */
export async function recordPackDownload(record: PremiumDownloadRecord): Promise<void> {
  try {
    await insertDownload(record.purchaseId, record.fileId);
  } catch {
    /* intentionally swallowed; nothing sensitive to report */
  }
}
