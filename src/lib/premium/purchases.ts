import { createHash, randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { PREMIUM_PACK_ID } from "./manifest";

/**
 * Persistence for the guest pack purchase (server-only, service role). These tables are
 * independent of profiles/subscriptions/access_grants/Plus. Never log tokens or hashes.
 */

export const PREMIUM_ACCESS_COOKIE = "kakebo_premium_access";

export function hashAccessToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateAccessToken(): string {
  return randomBytes(32).toString("base64url");
}

export interface PaidPurchaseInput {
  stripeSessionId: string;
  stripePaymentIntentId: string | null;
  customerEmail: string | null;
  amountTotal: number;
  currency: string;
  livemode: boolean;
}

export async function hasProcessedEvent(eventId: string): Promise<boolean> {
  const { data, error } = await createAdminClient()
    .from("premium_webhook_events")
    .select("stripe_event_id")
    .eq("stripe_event_id", eventId)
    .maybeSingle();
  if (error) throw new Error("premium_events_read_failed");
  return !!data;
}

export async function markEventProcessed(eventId: string, eventType: string): Promise<void> {
  const { error } = await createAdminClient()
    .from("premium_webhook_events")
    .upsert({ stripe_event_id: eventId, event_type: eventType }, { onConflict: "stripe_event_id", ignoreDuplicates: true });
  if (error) throw new Error("premium_events_write_failed");
}

/** Idempotent: a repeated session id never creates a second purchase nor reopens a refunded one. */
export async function recordPaidPurchase(input: PaidPurchaseInput): Promise<void> {
  const { error } = await createAdminClient()
    .from("premium_purchases")
    .upsert(
      {
        pack_id: PREMIUM_PACK_ID,
        stripe_session_id: input.stripeSessionId,
        stripe_payment_intent_id: input.stripePaymentIntentId,
        customer_email: input.customerEmail,
        amount_total: input.amountTotal,
        currency: input.currency,
        livemode: input.livemode,
        status: "paid",
      },
      { onConflict: "stripe_session_id", ignoreDuplicates: true }
    );
  if (error) throw new Error("premium_purchase_write_failed");
}

/** Refund/dispute: mark the purchase and revoke every token. No-op if the purchase is unknown. */
export async function revokePurchaseByPaymentIntent(
  paymentIntentId: string,
  status: "refunded" | "disputed"
): Promise<void> {
  const db = createAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await db
    .from("premium_purchases")
    .update({ status, revoked_at: now, updated_at: now })
    .eq("stripe_payment_intent_id", paymentIntentId)
    .select("id");
  if (error) throw new Error("premium_purchase_revoke_failed");
  for (const row of data ?? []) {
    const { error: tokenError } = await db
      .from("premium_access_tokens")
      .update({ revoked_at: now })
      .eq("purchase_id", row.id)
      .is("revoked_at", null);
    if (tokenError) throw new Error("premium_token_revoke_failed");
  }
}

export type ClaimStatus = "claimed" | "already_claimed" | "not_paid" | "not_found";

/**
 * Single-use, atomic exchange of a Stripe session id for an access token. The whole decision runs
 * inside the database function `claim_premium_purchase` (row lock), so concurrent claims cannot both
 * succeed. The token is created only on "claimed"; its plaintext never touches the database.
 */
export async function claimPurchase(
  sessionId: string
): Promise<{ status: "claimed"; token: string } | { status: Exclude<ClaimStatus, "claimed"> }> {
  const token = generateAccessToken();
  const { data, error } = await createAdminClient().rpc("claim_premium_purchase", {
    p_session_id: sessionId,
    p_token_hash: hashAccessToken(token),
  });
  if (error) throw new Error("premium_claim_failed");
  if (data === "claimed") return { status: "claimed", token };
  if (data === "already_claimed" || data === "not_paid" || data === "not_found") return { status: data };
  throw new Error("premium_claim_unexpected");
}

/** Valid only for a non-revoked token whose purchase is `paid`. */
export async function findPurchaseByToken(
  token: string
): Promise<{ purchaseId: string } | null> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("premium_access_tokens")
    .select("id, revoked_at, purchase:premium_purchases(id, status, pack_id)")
    .eq("token_hash", hashAccessToken(token))
    .maybeSingle();
  if (error) throw new Error("premium_token_read_failed");
  if (!data || data.revoked_at) return null;
  const purchase = (Array.isArray(data.purchase) ? data.purchase[0] : data.purchase) as
    | { id: string; status: string; pack_id: string }
    | null
    | undefined;
  if (!purchase || purchase.status !== "paid" || purchase.pack_id !== PREMIUM_PACK_ID) return null;
  await db.from("premium_access_tokens").update({ last_used_at: new Date().toISOString() }).eq("id", data.id);
  return { purchaseId: purchase.id };
}

/** Retries of one download within this window collapse into a single log row. */
export const DOWNLOAD_DEDUPE_WINDOW_MS = 10_000;

export function downloadBucket(nowMs: number = Date.now()): number {
  return Math.floor(nowMs / DOWNLOAD_DEDUPE_WINDOW_MS);
}

/** Idempotent per (purchase, file, bucket): `on conflict do nothing`. Stores no token, cookie or URL. */
export async function insertDownload(purchaseId: string, fileId: string, nowMs?: number): Promise<void> {
  const { error } = await createAdminClient()
    .from("premium_downloads")
    .upsert(
      { purchase_id: purchaseId, file_id: fileId, request_bucket: downloadBucket(nowMs) },
      { onConflict: "purchase_id,file_id,request_bucket", ignoreDuplicates: true }
    );
  if (error) throw new Error("premium_download_log_failed");
}
