import { NextResponse } from "next/server";
import { isPremiumCommerceEnabled } from "@/lib/premium/config";
import {
  PREMIUM_PACK_ID,
  PREMIUM_SIGNED_URL_TTL_SECONDS,
  getPackFile,
} from "@/lib/premium/manifest";
import {
  getPremiumStorage,
  verifyPackEntitlement,
  recordPackDownload,
  PremiumStorageNotConfiguredError,
} from "@/lib/premium/delivery";
import { apiLogger } from "@/lib/logger";

// Premium secure download.
//
// Order is deliberate and fail-closed:
//   1. PREMIUM_COMMERCE_ENABLED must be exactly "true"  -> else 503.
//   2. A verified entitlement for the pack               -> else 403.
//   3. `file` must be exactly excel | tutorial | ebook (manifest allowlist) -> else 400.
//   4. Only now is a signed URL created (Supabase Storage, private bucket, 600 s) and the
//      response is a 302 to it. The URL is never logged, rendered or returned earlier.
//
// Access never depends on query params: `?paid=true`, `?token=x`, `?purchase=true`, ... are
// ignored. `file` is only a selector validated against the manifest; it can never build a path.
//
// Entitlement = HttpOnly guest cookie checked against a paid, non-revoked purchase (see delivery.ts).

const NO_STORE = { "Cache-Control": "no-store" };

function json(body: Record<string, unknown>, status: number) {
  return NextResponse.json({ ok: false, ...body }, { status, headers: NO_STORE });
}

export async function GET(request?: Request) {
  if (!isPremiumCommerceEnabled()) {
    return json(
      { code: "premium_commerce_disabled", message: "Premium downloads are not available yet." },
      503
    );
  }

  const entitlement = await verifyPackEntitlement(PREMIUM_PACK_ID, request ?? null);
  if (!entitlement.granted) {
    return json(
      { code: "entitlement_not_verified", message: "A verified purchase is required to download this product." },
      403
    );
  }

  const fileId = request ? new URL(request.url).searchParams.get("file") : null;
  const file = getPackFile(fileId);
  if (!file) {
    return json({ code: "invalid_file", message: "Unknown file. Use excel, tutorial or ebook." }, 400);
  }

  try {
    const grant = await getPremiumStorage().createDownloadGrant(file, {
      expiresInSeconds: PREMIUM_SIGNED_URL_TTL_SECONDS,
    });
    // Only a real GET delivery is logged (HEAD probes are not downloads); the log is idempotent per
    // (purchase, file, 10 s bucket), so a technical retry of the same request adds no extra row.
    if (request?.method !== "HEAD") {
      await recordPackDownload({ packId: PREMIUM_PACK_ID, fileId: file.id, purchaseId: entitlement.purchaseId });
    }
    const redirect = NextResponse.redirect(grant.url, 302);
    redirect.headers.set("Cache-Control", "no-store");
    redirect.headers.set("Referrer-Policy", "no-referrer");
    return redirect;
  } catch (error) {
    // Never log the error object or any URL: only a short, non-sensitive reason.
    apiLogger.error(
      {
        fileId: file.id,
        reason:
          error instanceof PremiumStorageNotConfiguredError
            ? "storage_not_configured"
            : "storage_error",
      },
      "Premium download could not be prepared"
    );
    return json({ code: "download_unavailable", message: "The download is temporarily unavailable." }, 503);
  }
}
