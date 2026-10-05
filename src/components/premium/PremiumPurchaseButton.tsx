"use client";

import React, { useId, useState } from "react";

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
 * - commerce enabled: POSTs to /api/premium/checkout. Today that endpoint answers 501
 *   (Stripe not configured), which is shown as a controlled message.
 *
 * Analytics: do NOT emit `checkout_started` yet. When Stripe exists, track it right before
 * redirecting to the Checkout Session URL returned by the API.
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
      // Today the endpoint always answers 503/501 (no Stripe). Once connected it will
      // return { ok: true, url } and we will redirect to it here.
      setState(res.ok ? "idle" : "unavailable");
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
        {state === "unavailable" ? labels.unavailable : labels.soonNote}
      </p>
    </div>
  );
}
