"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export default function MarketingConsentPrompt() {
  const t = useTranslations("MarketingConsent");
  const [open, setOpen] = useState(false);
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/communication-preferences")
      .then(async (response) => {
        if (!response.ok) throw new Error("preferences unavailable");
        return response.json();
      })
      .then(({ preferences }) => {
        if (cancelled) return;
        if (!preferences?.privacy_policy_version || preferences.privacy_policy_version !== "2026-11-02") {
          setOpen(true);
        }
      })
      .catch(() => {
        // The prompt must never block the application when the preference table
        // has not been applied yet or the network is temporarily unavailable.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/communication-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketingEmailConsent: consent,
          privacyPolicyAcknowledged: true,
        }),
      });
      if (!response.ok) throw new Error("save failed");
      setOpen(false);
    } catch {
      setError(t("error"));
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true" aria-labelledby="marketing-consent-title">
      <div className="w-full max-w-lg rounded-xl border border-border bg-background p-6 shadow-xl">
        <h2 id="marketing-consent-title" className="text-xl font-serif text-foreground">{t("title")}</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{t("description")}</p>
        <Link href="/privacy" className="mt-2 inline-block text-sm text-primary underline underline-offset-2">{t("privacyLink")}</Link>

        <label className="mt-5 flex items-start gap-3 text-sm text-foreground">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary"
          />
          <span>{t("marketingConsent")}</span>
        </label>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={save} disabled={saving} className="rounded-md border border-border px-4 py-2 text-sm text-foreground hover:bg-muted disabled:opacity-50">
            {t("continueWithout")}
          </button>
          <button type="button" onClick={save} disabled={saving} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
            {saving ? t("saving") : t("save")}
          </button>
        </div>
      </div>
    </div>
  );
}
