import { createAdminClient } from "@/lib/supabase/admin";
import {
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
 *   1. Entitlement: has this authenticated user a CONFIRMED purchase of the pack?
 *      (NOT connected: always denies.)
 *   2. Storage: private Supabase Storage bucket that hands out short-lived signed URLs.
 *      (Connected, but only reachable after the entitlement check in the download route.)
 *   3. Download log: one record per file delivered. (NOT connected: no-op.)
 *
 * Nothing here may be unlocked by query params, headers or client-supplied flags.
 */

// ---------------------------------------------------------------------------
// 1. Entitlement
// ---------------------------------------------------------------------------

export type EntitlementResult =
  | { granted: true; userId: string; purchaseId: string }
  | { granted: false; reason: "not_implemented" | "no_purchase" | "not_authenticated" };

/**
 * TODO (after Stripe): authenticate the user server-side (Supabase session) and look up a
 * purchase row for `packId` whose status was set to "paid" ONLY by the signed Stripe
 * webhook (checkout.session.completed, with metadata.product === packId). One purchase
 * grants all three files. Never trust request input to decide this.
 */
export async function verifyPackEntitlement(_packId: string): Promise<EntitlementResult> {
  void _packId;
  return { granted: false, reason: "not_implemented" };
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
  userId: string;
  purchaseId: string;
  at: Date;
}

/**
 * TODO (after Stripe): insert one row per delivered file (table e.g. `premium_downloads`),
 * enforce a per-purchase download limit, and emit `digital_product_downloaded` only after
 * a successful, authorized delivery. Intentionally a no-op today.
 */
export async function recordPackDownload(_record: PremiumDownloadRecord): Promise<void> {
  void _record;
}
