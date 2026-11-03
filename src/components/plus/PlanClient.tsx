"use client";

import { useTranslations } from "next-intl";
import type { PlusViewReady } from "@/lib/plus/access-view";
import { Link } from "@/i18n/routing";
import { UpgradePanel } from "./UpgradePanel";
import { PortalButton } from "./PortalButton";

const dateFmt = (iso: string | null, locale: string) =>
  iso ? new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "es-ES", { dateStyle: "long", timeZone: "Europe/Madrid" }).format(new Date(iso)) : "";

function Card({ children, tone = "default", label }: { children: React.ReactNode; tone?: "default" | "warn"; label: string }) {
  return (
    <section
      aria-label={label}
      className={`space-y-4 rounded-lg border p-5 sm:p-6 ${tone === "warn" ? "border-amber-600/60 bg-amber-500/10" : "border-primary/40 bg-primary/5"}`}
    >
      {children}
    </section>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-full border border-primary/50 bg-background px-3 py-1 text-xs font-semibold text-foreground">{children}</span>;
}

/** Pantalla "Tu plan" con el flag encendido. Recibe el estado ya calculado en servidor (fn_my_access). */
export function PlanClient({ view, locale }: { view: PlusViewReady; locale: "es" | "en" }) {
  const t = useTranslations("Plus");
  const d = (iso: string | null) => dateFmt(iso, locale);
  const { state } = view;

  const planName = view.planInterval === "monthly" ? t("planMonthly") : view.planInterval === "annual" ? t("planAnnual") : t("planUnknown");

  if (state === "founder") {
    return (
      <Card label={t("state_founder")}>
        <Badge>{t("state_founder")}</Badge>
        <p className="text-sm text-foreground">{t("founderDesc")}</p>
      </Card>
    );
  }

  if (state === "legacy_full") {
    return (
      <Card label={t("state_legacy_full")}>
        <Badge>{t("state_legacy_full")}</Badge>
        <p className="text-sm text-foreground">{t("legacyDesc")}</p>
      </Card>
    );
  }

  if (state === "plus_active" || state === "plus_canceled_pending") {
    const pending = state === "plus_canceled_pending";
    return (
      <div className="space-y-4">
        <Card label={view.pastDue ? t("state_past_due") : pending ? t("state_plus_canceled_pending") : t("state_plus_active")}>
          <Badge>{view.pastDue ? t("state_past_due") : pending ? t("state_plus_canceled_pending") : t("state_plus_active")}</Badge>
          <p className="text-base font-semibold text-foreground">{planName}</p>
          {!pending && view.plusAccessUntil && <p className="text-sm text-foreground">{t("renewsOn", { date: d(view.plusAccessUntil) })}</p>}
          {pending && (
            <div role="status" className="space-y-1">
              <p className="text-sm font-semibold text-foreground">{t("cancelPendingTitle")}</p>
              <p className="text-sm text-foreground">{t("cancelPendingDesc", { date: d(view.plusAccessUntil) })}</p>
            </div>
          )}
          <p className="text-sm text-muted-foreground">{t("manageHint")}</p>
          <PortalButton label={pending ? t("reactivateButton") : t("manageButton")} locale={locale} variant="solid" />
        </Card>

        {view.pastDue && (
          <Card tone="warn" label={t("pastDueTitle")}>
            <div role="alert" className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                <span aria-hidden="true">⚠ </span>
                {t("pastDueTitle")}
              </p>
              <p className="text-sm text-foreground">{t("pastDueDesc", { date: d(view.graceEndsAt) })}</p>
            </div>
            <PortalButton label={t("updatePaymentButton")} locale={locale} variant="solid" />
          </Card>
        )}
      </div>
    );
  }

  // free_under_limit | free_readonly
  const used = view.freeExpensesUsed ?? 0;
  const limit = view.freeExpensesLimit;
  return (
    <div className="space-y-6">
      <Card label={t("state_free")}>
        <Badge>{t("state_free")}</Badge>
        <p className="text-sm text-foreground">{t("freeDesc", { limit })}</p>
        <p className="text-sm font-semibold text-foreground">{t("freeUsage", { used, limit })}</p>
        {state === "free_readonly" && (
          <p role="status" className="text-sm font-medium text-amber-900 dark:text-amber-300">
            <span aria-hidden="true">⚠ </span>
            {t("freeLimitReached", { limit })}
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <h2 className="text-sm font-semibold text-foreground">{t("freeIncludedTitle")}</h2>
            <ul className="mt-2 space-y-1 text-sm text-foreground">
              <li>
                <span aria-hidden="true">✓ </span>
                {t("freeIncluded1", { limit })}
              </li>
              <li>
                <span aria-hidden="true">✓ </span>
                {t("freeIncluded2")}
              </li>
              <li>
                <span aria-hidden="true">✓ </span>
                {t("freeIncluded3")}
              </li>
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">{t("plusOnlyTitle")}</h2>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {(["plusFeatureUnlimited", "plusFeatureAi", "plusFeaturePdf", "plusFeatureSearch"] as const).map((k) => (
                <li key={k}>
                  <span aria-hidden="true">🔒 </span>
                  {t(k)} <span className="text-xs">({t("plusOnlyBadge")})</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
      <UpgradePanel locale={locale} />
      {view.hasBillingAccount && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{t("manageHint")}</p>
          <PortalButton label={t("manageButton")} locale={locale} />
        </div>
      )}
    </div>
  );
}

export function PlanLoadError({ kind, locale }: { kind: "error" | "unauthenticated"; locale: "es" | "en" }) {
  const t = useTranslations("Plus");
  return (
    <div role={kind === "error" ? "alert" : "status"} className="space-y-3 rounded-lg border border-amber-600/60 bg-amber-500/10 p-5 text-sm text-foreground">
      {kind === "error" ? (
        <>
          <p className="font-semibold">
            <span aria-hidden="true">⚠ </span>
            {t("loadErrorTitle")}
          </p>
          <p>{t("loadErrorDesc")}</p>
        </>
      ) : (
        <>
          <p>{t("loginRequiredDesc")}</p>
          <Link href="/login" className="font-medium underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground">
            {t("errLogin")}
          </Link>
        </>
      )}
      <span className="sr-only">{locale}</span>
    </div>
  );
}
