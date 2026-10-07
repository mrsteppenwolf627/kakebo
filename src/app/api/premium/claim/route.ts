import { NextResponse } from "next/server";
import { isPremiumCommerceEnabled } from "@/lib/premium/config";
import { PREMIUM_ACCESS_COOKIE, claimPurchase } from "@/lib/premium/purchases";
import { apiLogger } from "@/lib/logger";

// success_url target. Exchanges a Stripe Checkout Session id for an access cookie, ONCE.
//
// - The session id is only an input to a single-use exchange, never a standing credential: the first
//   successful claim marks the purchase as claimed (atomically, in the database) and every later
//   attempt is refused without creating a token.
// - The browser's arrival here proves nothing; the purchase row written by the signed webhook decides.
// - After the exchange the user is redirected to a clean URL (no session id).
// - Nothing sensitive is logged here: no session id, token, cookie or URL. (Framework/platform access
//   logs may still record the request path; that is why the id is single-use.)
//
// Recovering access after losing the cookie is NOT possible yet: it needs the email-recovery phase.

const LANDING_PATH = "/herramientas/plantilla-kakebo-excel-premium";
const SESSION_ID = /^cs_(test|live)_[A-Za-z0-9]{10,200}$/;
const ONE_YEAR = 60 * 60 * 24 * 365;
const MAX_PENDING_RETRIES = 20;

function harden<T extends Response>(res: T): T {
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("Referrer-Policy", "no-referrer");
  return res;
}

function back(request: Request, outcome: string) {
  const target = new URL(LANDING_PATH + "?checkout=" + outcome, request.url);
  return harden(NextResponse.redirect(target, 303));
}

/** The webhook may not have landed yet: retry a few times, then give up with a clean URL. */
function pending(request: Request, sessionId: string, attempt: number) {
  if (attempt >= MAX_PENDING_RETRIES) return back(request, "pending");
  const next = new URL(request.url);
  next.search = "";
  next.searchParams.set("session_id", sessionId);
  next.searchParams.set("n", String(attempt + 1));
  const html =
    '<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex">' +
    '<meta name="referrer" content="no-referrer">' +
    '<meta http-equiv="refresh" content="3;url=' + next.pathname + next.search + '">' +
    "<title>Confirmando pago</title><p>Confirmando tu pago...</p>";
  return harden(new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }));
}

export async function GET(request: Request) {
  if (!isPremiumCommerceEnabled()) return back(request, "unavailable");

  const params = new URL(request.url).searchParams;
  const sessionId = params.get("session_id") ?? "";
  if (!SESSION_ID.test(sessionId)) return back(request, "invalid");
  const attempt = Math.min(Math.max(parseInt(params.get("n") ?? "0", 10) || 0, 0), MAX_PENDING_RETRIES);

  try {
    const result = await claimPurchase(sessionId);
    switch (result.status) {
      case "claimed": {
        const res = back(request, "success");
        res.cookies.set(PREMIUM_ACCESS_COOKIE, result.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/api/premium",
          maxAge: ONE_YEAR,
        });
        return res;
      }
      case "already_claimed":
        return back(request, "already_claimed");
      case "not_paid":
        return back(request, "unavailable");
      default:
        return pending(request, sessionId, attempt);
    }
  } catch {
    apiLogger.error({ reason: "claim_failed" }, "Premium access claim failed");
    return back(request, "error");
  }
}
