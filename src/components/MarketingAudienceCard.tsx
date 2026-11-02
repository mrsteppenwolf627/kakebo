"use client";

import { useEffect, useState } from "react";
import { Loader2, Mail, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";

type Audience = {
  summary: { preferences: number; optedIn: number; optedOut: number; events: number };
  eventCounts: Record<string, number>;
  recipients: Array<{ userId: string; email: string; consentedAt: string | null }>;
};

export default function MarketingAudienceCard() {
  const t = useTranslations("Admin.marketing");
  const [data, setData] = useState<Audience | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function load() {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch("/api/admin/marketing-audience");
      if (!response.ok) throw new Error("Unable to load audience");
      setData(await response.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <section className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3"><Mail className="w-6 h-6 text-primary" /><h2 className="text-xl font-serif font-medium">{t("title")}</h2></div>
        <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />{t("refresh")}</button>
      </div>
      <p className="text-sm text-muted-foreground">{t("description")}</p>
      {loading ? <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /> : error ? <p className="text-sm text-destructive">{t("error")}</p> : data && <>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Metric label={t("preferences")} value={data.summary.preferences} />
          <Metric label={t("optedIn")} value={data.summary.optedIn} />
          <Metric label={t("optedOut")} value={data.summary.optedOut} />
          <Metric label={t("events")} value={data.summary.events} />
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-medium">{t("recipients")}</h3>
          {data.recipients.length === 0 ? <p className="text-sm text-muted-foreground">{t("empty")}</p> : data.recipients.map((recipient) => <div key={recipient.userId} className="flex justify-between gap-3 border-b border-border/60 py-2 text-sm"><span>{recipient.email || recipient.userId}</span><span className="text-muted-foreground">{recipient.consentedAt ? new Date(recipient.consentedAt).toLocaleDateString() : "—"}</span></div>)}
        </div>
      </>}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border border-border/60 bg-muted/20 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-medium">{value}</p></div>;
}
