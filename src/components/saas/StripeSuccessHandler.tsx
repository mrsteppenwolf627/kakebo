"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { syncCheckout } from "@/lib/plus/client";

type Phase = "processing" | "confirmed" | "delayed" | "error" | "cancelled";

/** Esperas entre intentos de sync (ms): el webhook de Stripe puede tardar unos segundos en llegar. */
export const DEFAULT_SYNC_DELAYS = [0, 2000, 4000, 6000, 8000, 10000];

/**
 * Retorno de Checkout (`?plus=success&session_id=...` / `?plus=cancelled`).
 * Volver de Stripe NO concede nada: se llama a /api/stripe/sync, que verifica la suscripción en el servidor. La
 * confirmación solo se muestra cuando el servidor responde con una suscripción Plus; si el pago aún no está
 * disponible se reintenta y, al agotar los intentos, se informa de que sigue procesándose.
 */
export default function StripeSuccessHandler({
  status,
  sessionId,
  delays = DEFAULT_SYNC_DELAYS,
}: {
  status: "success" | "cancelled" | null;
  sessionId: string | null;
  delays?: number[];
}) {
  const t = useTranslations("Plus");
  const supportEmail = useTranslations("About.contact")("email");
  const router = useRouter();
  const [phase, setPhase] = useState<Phase | null>(
    status === "cancelled" ? "cancelled" : status === "success" && sessionId ? "processing" : null,
  );
  const stoppedRef = useRef(false);
  const runId = useRef(0);

  const run = useCallback(async () => {
    if (!sessionId) return;
    const id = ++runId.current;
    for (const wait of delays) {
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      if (stoppedRef.current || id !== runId.current) return;
      const result = await syncCheckout(sessionId);
      if (stoppedRef.current || id !== runId.current) return;
      if (result.kind === "confirmed") {
        setPhase("confirmed");
        // Limpia el session_id de la URL y recarga los datos del servidor (solo los del usuario de la sesión).
        try {
          window.history.replaceState(null, "", window.location.pathname);
        } catch {
          /* sin history */
        }
        router.refresh();
        return;
      }
      if (result.kind === "error") {
        setPhase("error");
        return;
      }
    }
    setPhase("delayed");
  }, [delays, router, sessionId]);

  // Reintento manual: vuelve a "procesando" y repite la sincronización.
  const retry = () => {
    setPhase("processing");
    void run();
  };

  useEffect(() => {
    stoppedRef.current = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincronización asíncrona con el servidor tras volver de Checkout (los setState ocurren tras await)
    if (status === "success" && sessionId) void run();
    return () => {
      stoppedRef.current = true;
    };
  }, [status, sessionId, run]);

  if (!phase) return null;

  const box = "rounded-lg border p-4 text-sm text-foreground";
  const retryBtn =
    "mt-3 rounded-md border border-foreground px-3 py-1.5 font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2";
  return (
    <div aria-live="polite" data-testid="stripe-return" data-phase={phase} className="mb-4">
      {phase === "processing" && (
        <div role="status" className={`${box} border-primary/40 bg-primary/5`}>
          <p className="font-semibold">{t("processingTitle")}</p>
          <p className="mt-1 text-muted-foreground">{t("processingDesc")}</p>
        </div>
      )}
      {phase === "confirmed" && (
        <div role="status" className={`${box} border-green-700/50 bg-green-500/10`}>
          <p className="font-semibold">
            <span aria-hidden="true">✓ </span>
            {t("confirmedTitle")}
          </p>
          <p className="mt-1">{t("confirmedDesc")}</p>
        </div>
      )}
      {phase === "delayed" && (
        <div role="status" className={`${box} border-amber-600/60 bg-amber-500/10`}>
          <p className="font-semibold">{t("delayedTitle")}</p>
          <p className="mt-1">{t("delayedDesc")}</p>
          <p className="mt-2">
            {t("supportLead")}{" "}
            <a href={`mailto:${supportEmail}`} className="font-medium underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground">
              {supportEmail}
            </a>
          </p>
          <button type="button" onClick={retry} className={retryBtn}>
            {t("retry")}
          </button>
        </div>
      )}
      {phase === "error" && (
        <div role="alert" className={`${box} border-red-700/50 bg-red-500/10`}>
          <p className="font-semibold">
            <span aria-hidden="true">⚠ </span>
            {t("syncErrorTitle")}
          </p>
          <p className="mt-1">{t("errGeneric")}</p>
          <button type="button" onClick={retry} className={retryBtn}>
            {t("retry")}
          </button>
        </div>
      )}
      {phase === "cancelled" && (
        <div role="status" className={`${box} border-border bg-muted/40`}>
          {t("checkoutCancelled")}
        </div>
      )}
    </div>
  );
}
