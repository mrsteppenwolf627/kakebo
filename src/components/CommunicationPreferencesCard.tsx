"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export default function CommunicationPreferencesCard() {
  const t = useTranslations("MarketingConsent");
  const [enabled, setEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/communication-preferences")
      .then((response) => response.json())
      .then((json) => {
        // API responses are wrapped as { success, data }.
        setEnabled(json?.data?.preferences?.marketing_email_consent === true);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/communication-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketingEmailConsent: enabled, privacyPolicyAcknowledged: true }),
      });
      if (!response.ok) throw new Error("save failed");
      setMessage(t("saved"));
    } catch {
      setMessage(t("error"));
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) return null;

  return (
    <section className="border border-border rounded-lg p-5 space-y-3 bg-card">
      <div className="font-semibold text-foreground">{t("settingsTitle")}</div>
      <p className="text-sm text-muted-foreground">{t("settingsDescription")}</p>
      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary" />
        <span className="text-sm text-foreground">{t("marketingConsent")}</span>
      </label>
      <Link href="/privacy" className="inline-block text-xs text-primary underline underline-offset-2">{t("privacyLink")}</Link>
      <div className="flex items-center gap-3">
        <button type="button" onClick={save} disabled={saving} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
          {saving ? t("saving") : t("save")}
        </button>
        {message && <span className="text-sm text-muted-foreground">{message}</span>}
      </div>
    </section>
  );
}
