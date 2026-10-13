"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { openPortal } from "@/lib/plus/client";

/** Abre el Customer Portal de Stripe del PROPIO usuario (el servidor decide el customer; aquí solo se envía el idioma). */
export function PortalButton({
  label,
  locale,
  variant = "outline",
  redirect = (url: string) => window.location.assign(url),
}: {
  label: string;
  locale: "es" | "en";
  variant?: "outline" | "solid";
  redirect?: (url: string) => void;
}) {
  const t = useTranslations("Plus");
  const errorId = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setBusy(true);
    setError(null);
    const result = await openPortal(locale);
    if (result.ok) {
      redirect(result.url);
      return; // la página se descarga: se deja el botón ocupado
    }
    setBusy(false);
    setError(result.kind === "unauthorized" ? t("errUnauthorized") : result.kind === "network" ? t("errNetwork") : t("errPortal"));
  }

  const base =
    "inline-flex w-full items-center justify-center rounded-md px-4 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 disabled:opacity-60";
  const style = variant === "solid" ? "bg-primary text-primary-foreground hover:opacity-90" : "border border-foreground text-foreground hover:bg-muted";

  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        aria-busy={busy}
        aria-describedby={error ? errorId : undefined}
        className={`${base} ${style}`}
      >
        {busy ? t("opening") : label}
      </button>
      {error && (
        <p id={errorId} role="alert" className="mt-2 text-sm text-red-700 dark:text-red-400">
          <span aria-hidden="true">⚠ </span>
          {error}
        </p>
      )}
    </div>
  );
}
