"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { startCheckout, type PlusErrorKind, type PlusInterval } from "@/lib/plus/client";
import { PLUS_ANNUAL_CENTS, PLUS_ANNUAL_SAVING_CENTS, PLUS_MONTHLY_CENTS, formatEur } from "@/lib/plus/pricing";
import { PortalButton } from "./PortalButton";

/**
 * Selector mensual/anual + botón de Checkout. Solo envía { interval, locale } a /api/stripe/checkout; los importes
 * mostrados son informativos (el servidor resuelve el precio real). No toca datos de tarjeta.
 */
export function UpgradePanel({
  locale,
  loginHref = "/login",
  redirect = (url: string) => window.location.assign(url),
}: {
  locale: "es" | "en";
  loginHref?: string;
  redirect?: (url: string) => void;
}) {
  const t = useTranslations("Plus");
  const legendId = useId();
  const errorId = useId();
  const [interval, setIntervalValue] = useState<PlusInterval>("year");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<PlusErrorKind | null>(null);

  async function subscribe() {
    setBusy(true);
    setError(null);
    const result = await startCheckout(interval, locale);
    if (result.ok) {
      redirect(result.url);
      return;
    }
    setBusy(false);
    setError(result.kind);
  }

  const message: Record<PlusErrorKind, string> = {
    unauthorized: t("errUnauthorized"),
    forbidden: t("errForbidden"),
    conflict: t("errConflict"),
    validation: t("errValidation"),
    unavailable: t("errUnavailable"),
    network: t("errNetwork"),
    unknown: t("errGeneric"),
  };

  const option = (value: PlusInterval, title: string, price: string, extra?: string) => (
    <label
      key={value}
      className={`flex cursor-pointer flex-col gap-1 rounded-md border p-4 focus-within:ring-2 focus-within:ring-foreground focus-within:ring-offset-2 ${
        interval === value ? "border-foreground bg-primary/5" : "border-border"
      }`}
    >
      <span className="flex items-center gap-2">
        <input
          type="radio"
          name="plus-interval"
          value={value}
          checked={interval === value}
          onChange={() => setIntervalValue(value)}
          className="h-4 w-4 accent-stone-800 dark:accent-stone-100"
        />
        <span className="font-medium text-foreground">{title}</span>
        {interval === value && <span className="sr-only">✓</span>}
      </span>
      <span className="pl-6 text-sm text-foreground">{price}</span>
      {extra && <span className="pl-6 text-xs font-medium text-green-800 dark:text-green-400">{extra}</span>}
    </label>
  );

  return (
    <section aria-labelledby={legendId} className="space-y-4">
      <h2 id={legendId} className="text-lg font-semibold text-foreground">
        {t("plansTitle")}
      </h2>
      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="sr-only">{t("intervalLegend")}</legend>
        {option("month", t("monthly"), t("pricePerMonth", { price: formatEur(PLUS_MONTHLY_CENTS, locale) }))}
        {option(
          "year",
          t("annual"),
          t("pricePerYear", { price: formatEur(PLUS_ANNUAL_CENTS, locale) }),
          t("annualSave", { amount: formatEur(PLUS_ANNUAL_SAVING_CENTS, locale) }),
        )}
      </fieldset>


      <button
        type="button"
        onClick={subscribe}
        disabled={busy}
        aria-busy={busy}
        aria-describedby={error ? errorId : undefined}
        className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 disabled:opacity-60"
      >
        {busy ? t("subscribing") : t("subscribeButton")}
      </button>

      {error && (
        <div id={errorId} role="alert" className="space-y-2 text-sm text-red-700 dark:text-red-400">
          <p>
            <span aria-hidden="true">⚠ </span>
            {message[error]}
          </p>
          {error === "unauthorized" && (
            <a href={loginHref} className="font-medium underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground">
              {t("errLogin")}
            </a>
          )}
          {error === "conflict" && <PortalButton label={t("manageButton")} locale={locale} />}
        </div>
      )}

      <p className="text-xs text-muted-foreground">{t("paymentNote")}</p>
    </section>
  );
}
