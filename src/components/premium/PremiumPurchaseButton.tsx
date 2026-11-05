"use client";

import React, { useId, useState } from "react";
import { analytics } from "@/lib/analytics";
import { PREMIUM_PRODUCT_NAME, PREMIUM_PRODUCT_PRICE } from "@/lib/premium/product-meta";

type Labels = {
  soon: string;
  soonNote: string;
  buy: string;
  pending: string;
  unavailable: string;
};

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2";

/**
 * Future purchase CTA.
 * - commerce disabled: a focusable but inert, visibly muted control that reads "Próximamente".
 *   It uses aria-disabled (not `disabled`) so keyboard and screen-reader users can still reach
 *   it and hear why it is unavailable. It has no handler, no href and never navigates.
 * - commerce enabled: POSTs to /api/premium/checkout and redirects to the Stripe-hosted Checkout URL it
 *   returns. While waiting it shows `pending`; if checkout cannot be created it shows `unavailable`
 *   (and the button can be pressed again). The idle state shows no extra note: the page itself already
 *   states that the purchase is available.
 *
 * Analytics: `checkout_started` is emitted right before redirecting to the Stripe Checkout URL, and only
 * when the API returned a valid one (a failed checkout creation is not counted as a started checkout).
 * `purchase` is emitted on return by PremiumPurchaseTracker.
 */
export function PremiumPurchaseButton({ enabled, labels }: { enabled: boolean; labels: Labels }) {
  const noteId = useId();
  const [state, setState] = useState<"idle" | "pending" | "unavailable">("idle");

  if (!enabled) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          aria-disabled="true"
          aria-describedby={noteId}
          onClick={(e) => e.preventDefault()}
          className={`inline-flex cursor-not-allowed items-center justify-center rounded-full border border-dashed border-border bg-muted px-8 py-3 font-medium text-muted-foreground ${FOCUS_RING}`}
        >
          {labels.soon}
        </button>
        <p id={noteId} className="text-sm text-muted-foreground">
          {labels.soonNote}
        </p>
      </div>
    );
  }

  async function startCheckout() {
    if (state === "pending") return;
    setState("pending");
    try {
      const res = await fetch("/api/premium/checkout", { method: "POST" });
      const body = res.ok ? await res.json().catch(() => null) : null;
      // Only ever follow a Stripe-hosted Checkout URL returned by our own server.
      if (typeof body?.url === "string" && body.url.startsWith("https://checkout.stripe.com/")) {
        analytics.track("checkout_started", {
          source_page: window.location.pathname,
          product_name: PREMIUM_PRODUCT_NAME,
          value: PREMIUM_PRODUCT_PRICE,
          currency: "EUR",
        });
        window.location.assign(body.url);
        return;
      }
      setState("unavailable");
    } catch {
      setState("unavailable");
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={startCheckout}
        aria-disabled={state === "pending"}
        aria-describedby={noteId}
        className={`inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 font-bold text-primary-foreground transition-opacity hover:opacity-90 ${FOCUS_RING}`}
      >
        {state === "pending" ? labels.pending : labels.buy}
      </button>
      <p id={noteId} role="status" className="text-sm text-muted-foreground">
        {state === "unavailable" ? labels.unavailable : state === "pending" ? labels.pending : ""}
      </p>
    </div>
  );
}
