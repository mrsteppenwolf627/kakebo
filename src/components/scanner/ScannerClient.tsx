"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

type Category = "survival" | "optional" | "culture" | "extra";
type Source = "camera" | "image";
type Line = {
  id: string;
  kind: "item" | "adjustment";
  description: string;
  amountCents: number;
  categoryProposal: Category | null;
  category: Category | null;
  allocations: { category: Category | null; amountCents: number }[];
};
type Ticket = {
  id: string;
  status: string;
  draftVersion: number;
  merchant: string | null;
  date: string | null;
  totalCents: number | null;
  currency: string | null;
  lines: Line[];
};
type PendingTicket = { id: string; status: string; merchant: string | null; date: string | null; totalCents: number | null; currency: string | null };

type ApiResponse<T> = { success: true; data: T } | { success: false; error?: { message?: string } };

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: "no-store" });
  const body = await response.json() as ApiResponse<T>;
  if (!response.ok || !body.success) throw new Error(body.success ? "REQUEST_FAILED" : body.error?.message || "REQUEST_FAILED");
  return body.data;
}

function centsFromInput(value: string): number | null {
  if (!value.trim()) return null;
  const normalized = value.trim().replace(",", ".");
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) : null;
}

const allowedTypes = ["image/jpeg", "image/png"] as const;
const maxBytes = 4 * 1024 * 1024;

export default function ScannerClient() {
  const t = useTranslations("Scanner");
  const locale = t("localeCode");
  const cameraRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<"idle" | "uploading" | "processing" | "review" | "confirmed">("idle");
  const [error, setError] = useState<string | null>(null);
  const [merchant, setMerchant] = useState("");
  const [date, setDate] = useState("");
  const [total, setTotal] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [draftDirty, setDraftDirty] = useState(false);
  const [confirmKey, setConfirmKey] = useState<string | null>(null);
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);
  const [quota, setQuota] = useState<{ remaining: number; limit: number } | null>(null);
  const [pending, setPending] = useState<PendingTicket[]>([]);

  useEffect(() => {
    let active = true;
    Promise.all([
      api<{ remaining: number; limit: number }>("/api/scanner/quota"),
      api<{ tickets: PendingTicket[] }>("/api/scanner/tickets"),
    ]).then(([quotaResult, ticketsResult]) => {
      if (!active) return;
      setQuota(quotaResult); setPending(ticketsResult.tickets);
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  const reset = () => {
    setTicket(null); setStep("idle"); setError(null); setConfirmMessage(null);
    setMerchant(""); setDate(""); setTotal(""); setLines([]);
    setDraftDirty(false); setConfirmKey(null);
  };

  const processFile = async (file: File, source: Source) => {
    setError(null); setConfirmMessage(null);
    if (!(allowedTypes as readonly string[]).includes(file.type)) {
      setError(t("flow.errors.type")); return;
    }
    if (file.size <= 0 || file.size > maxBytes) {
      setError(t("flow.errors.size")); return;
    }
    setBusy(true); setStep("uploading");
    try {
      const created = await api<{ ticketId: string }>("/api/scanner/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({ source, locale: locale === "en" ? "en" : "es", declaredMime: file.type, declaredSizeBytes: file.size }),
      });
      const authorization = await api<{ upload: { url: string; path: string } }>(`/api/scanner/tickets/${created.ticketId}/upload-authorization`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
      });
      const upload = await fetch(authorization.upload.url, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!upload.ok) throw new Error("UPLOAD_FAILED");
      await api(`/api/scanner/tickets/${created.ticketId}/complete-upload`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: authorization.upload.path }),
      });
      setStep("processing");
      const processed = await api<{ status: string; draftVersion?: number }>(`/api/scanner/tickets/${created.ticketId}/process`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
      });
      if (processed.status !== "needs_review") throw new Error("PROCESSING_FAILED");
      const loaded = await api<{ ticket: Ticket }>(`/api/scanner/tickets/${created.ticketId}`);
      setTicket(loaded.ticket); setMerchant(loaded.ticket.merchant ?? ""); setDate(loaded.ticket.date ?? "");
      setTotal(loaded.ticket.totalCents === null ? "" : String(loaded.ticket.totalCents / 100));
      setLines(loaded.ticket.lines); setDraftDirty(false); setConfirmKey(crypto.randomUUID()); setStep("review");
    } catch (cause) {
      setError(cause instanceof Error && cause.message !== "REQUEST_FAILED" ? cause.message : t("flow.errors.generic"));
      setStep("idle");
    } finally { setBusy(false); }
  };

  const openPending = async (ticketId: string) => {
    setBusy(true); setError(null);
    try {
      const loaded = await api<{ ticket: Ticket }>(`/api/scanner/tickets/${ticketId}`);
      if (loaded.ticket.status !== "needs_review") throw new Error(t("flow.pendingNotReady"));
      setTicket(loaded.ticket); setMerchant(loaded.ticket.merchant ?? ""); setDate(loaded.ticket.date ?? "");
      setTotal(loaded.ticket.totalCents === null ? "" : String(loaded.ticket.totalCents / 100));
      setLines(loaded.ticket.lines); setDraftDirty(false); setConfirmKey(crypto.randomUUID()); setStep("review");
    } catch (cause) { setError(cause instanceof Error ? cause.message : t("flow.errors.generic")); }
    finally { setBusy(false); }
  };

  const updateLine = (id: string, patch: Partial<Line>) => { setDraftDirty(true); setLines((current) => current.map((line) => line.id === id ? { ...line, ...patch } : line)); };

  const saveDraft = async (): Promise<number> => {
    if (!ticket) throw new Error("NO_TICKET");
    if (!draftDirty) return ticket.draftVersion;
    const totalCents = centsFromInput(total);
    if (!merchant.trim() || !date || totalCents === null) throw new Error(t("flow.errors.required"));
    if (!lines.every((line) => line.category || (line.allocations.length >= 2 && line.allocations.every((part) => part.category && part.amountCents > 0) && line.allocations.reduce((sum, part) => sum + part.amountCents, 0) === line.amountCents))) {
      throw new Error(t("flow.errors.categories"));
    }
    const result = await api<{ draftVersion: number }>(`/api/scanner/tickets/${ticket.id}/draft`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draftVersion: ticket.draftVersion, merchant: merchant.trim(), date, totalCents, lines: lines.map((line) => ({
        kind: line.kind, description: line.description || null, amountCents: line.amountCents,
        categoryProposal: line.categoryProposal, category: line.category, allocations: line.allocations as { category: Category; amountCents: number }[],
      })) }),
    });
    setTicket({ ...ticket, draftVersion: result.draftVersion, merchant: merchant.trim(), date, totalCents });
    setDraftDirty(false);
    return result.draftVersion;
  };

  const confirm = async () => {
    if (!ticket || busy) return;
    setBusy(true); setError(null); setConfirmMessage(null);
    try {
      const draftVersion = await saveDraft();
      const key = confirmKey ?? crypto.randomUUID();
      if (!confirmKey) setConfirmKey(key);
      const result = await api<{ expenses: unknown[] }>(`/api/scanner/tickets/${ticket.id}/confirm`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmKey: key, draftVersion, userConfirmed: true }),
      });
      setConfirmMessage(t("flow.confirmed", { count: result.expenses.length })); setStep("confirmed");
    } catch (cause) { setError(cause instanceof Error ? cause.message : t("flow.errors.generic")); }
    finally { setBusy(false); }
  };

  const discard = async () => {
    if (!ticket || busy) return;
    setBusy(true); setError(null);
    try {
      await api(`/api/scanner/tickets/${ticket.id}/discard`, { method: "DELETE" });
      reset();
    } catch (cause) { setError(cause instanceof Error ? cause.message : t("flow.errors.generic")); }
    finally { setBusy(false); }
  };

  const totalCents = centsFromInput(total);
  const lineTotal = lines.reduce((sum, line) => sum + line.amountCents, 0);
  const canConfirm = Boolean(ticket && merchant.trim() && date && totalCents !== null && lines.length > 0 && lineTotal === totalCents && lines.every((line) => line.category || (line.allocations.length >= 2 && line.allocations.every((part) => part.category && part.amountCents > 0) && line.allocations.reduce((sum, part) => sum + part.amountCents, 0) === line.amountCents)));
  const categories: Category[] = ["survival", "optional", "culture", "extra"];

  if (step === "confirmed") return <section className="mt-8 rounded-xl border border-border bg-card p-5 sm:p-6" aria-live="polite"><h2 className="text-xl font-serif text-foreground">{t("flow.doneTitle")}</h2><p className="mt-2 text-muted-foreground">{confirmMessage}</p><button type="button" onClick={reset} className="mt-5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2">{t("flow.newTicket")}</button></section>;

  return <section className="mt-8 rounded-xl border border-border bg-card p-5 sm:p-6" aria-live="polite" aria-busy={busy}>
    <h2 className="text-xl font-serif font-normal text-foreground">{step === "review" ? t("flow.reviewTitle") : t("flow.startTitle")}</h2>
    <p className="mt-2 text-muted-foreground">{step === "review" ? t("flow.reviewIntro") : t("flow.startIntro")}</p>
    {error && <p className="mt-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive" role="alert">{error}</p>}
    {step === "idle" && <>
      {quota && <p className="mt-4 rounded-md bg-muted/30 p-3 text-sm text-muted-foreground">{t("flow.quota", { remaining: quota.remaining, limit: quota.limit })}</p>}
      {pending.length > 0 && <div className="mt-5 space-y-2"><h3 className="text-sm font-medium text-foreground">{t("flow.pendingTitle")}</h3>{pending.map((item) => <button type="button" key={item.id} onClick={() => void openPending(item.id)} className="block w-full rounded-md border border-border p-3 text-left text-sm hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"><span className="font-medium text-foreground">{item.merchant || t("flow.unknownMerchant")}</span><span className="ml-2 text-muted-foreground">{item.status === "needs_review" ? t("flow.readyToReview") : t("flow.inProgress")}</span></button>)}</div>}
      <div className="mt-5 flex flex-wrap gap-3">
      <input ref={cameraRef} className="sr-only" type="file" accept="image/jpeg,image/png" capture="environment" onChange={(event) => { const file = event.target.files?.[0]; if (file) void processFile(file, "camera"); event.target.value = ""; }} />
      <input ref={imageRef} className="sr-only" type="file" accept="image/jpeg,image/png" onChange={(event) => { const file = event.target.files?.[0]; if (file) void processFile(file, "image"); event.target.value = ""; }} />
      <button type="button" disabled={busy} onClick={() => cameraRef.current?.click()} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2">{t("flow.takePhoto")}</button>
      <button type="button" disabled={busy} onClick={() => imageRef.current?.click()} className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2">{t("flow.chooseImage")}</button>
      </div>
    </>}
    {(step === "uploading" || step === "processing") && <p className="mt-5 text-sm text-muted-foreground" role="status">{step === "uploading" ? t("flow.uploading") : t("flow.processing")}</p>}
    {step === "review" && ticket && <form className="mt-5 space-y-5" onSubmit={(event) => { event.preventDefault(); void confirm(); }}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-foreground">{t("flow.merchant")}<input id="scanner-merchant" value={merchant} onChange={(event) => { setDraftDirty(true); setMerchant(event.target.value); }} maxLength={120} className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2" /></label>
        <label className="text-sm text-foreground">{t("flow.date")}<input id="scanner-date" type="date" value={date} onChange={(event) => { setDraftDirty(true); setDate(event.target.value); }} className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2" /></label>
      </div>
      <label className="block text-sm text-foreground">{t("flow.total")}<input id="scanner-total" inputMode="decimal" value={total} onChange={(event) => { setDraftDirty(true); setTotal(event.target.value); }} className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2" /></label>
      <fieldset className="space-y-3"><legend className="text-sm font-medium text-foreground">{t("flow.lines")}</legend>
        {lines.map((line) => <div key={line.id} className="rounded-md border border-border p-3">
          <label className="block text-sm text-foreground">{t("flow.description")}<input value={line.description} onChange={(event) => updateLine(line.id, { description: event.target.value })} maxLength={200} className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2" /></label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-sm text-foreground">{t("flow.amount")}<input inputMode="decimal" value={(line.amountCents / 100).toFixed(2)} onChange={(event) => { const cents = centsFromInput(event.target.value); if (cents !== null) updateLine(line.id, { amountCents: cents }); }} className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2" /></label>{line.allocations.length === 0 && <label className="text-sm text-foreground">{t("flow.category")}<select value={line.category ?? ""} onChange={(event) => updateLine(line.id, { category: (event.target.value || null) as Category | null })} className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2"><option value="">{t("flow.chooseCategory")}</option>{categories.map((category) => <option key={category} value={category}>{t(`categories.${category}`)}</option>)}</select></label>}</div>
          {line.allocations.length === 0 ? <button type="button" className="mt-3 text-sm font-medium text-primary underline-offset-4 hover:underline" onClick={() => updateLine(line.id, { category: null, allocations: [{ category: null, amountCents: 0 }, { category: null, amountCents: 0 }] })}>{t("flow.split")}</button> : <div className="mt-3 rounded-md bg-muted/30 p-3"><p className="text-sm font-medium text-foreground">{t("flow.splitParts")}</p>{line.allocations.map((part, index) => <div key={`${line.id}-part-${index}`} className="mt-2 grid gap-2 sm:grid-cols-[1fr_8rem_auto]"><label className="sr-only" htmlFor={`${line.id}-part-category-${index}`}>{t("flow.category")}</label><select id={`${line.id}-part-category-${index}`} value={part.category ?? ""} onChange={(event) => { const next = [...line.allocations]; next[index] = { ...part, category: (event.target.value || null) as Category | null }; updateLine(line.id, { allocations: next, category: null }); }} className="rounded-md border border-border bg-background px-3 py-2 text-sm"><option value="">{t("flow.chooseCategory")}</option>{categories.map((category) => <option key={category} value={category}>{t(`categories.${category}`)}</option>)}</select><label className="sr-only" htmlFor={`${line.id}-part-amount-${index}`}>{t("flow.amount")}</label><input id={`${line.id}-part-amount-${index}`} inputMode="decimal" value={part.amountCents ? (part.amountCents / 100).toFixed(2) : ""} onChange={(event) => { const next = [...line.allocations]; next[index] = { ...part, amountCents: centsFromInput(event.target.value) ?? 0 }; updateLine(line.id, { allocations: next, category: null }); }} className="rounded-md border border-border bg-background px-3 py-2 text-sm" /><button type="button" aria-label={t("flow.removePart")} disabled={line.allocations.length <= 2} onClick={() => updateLine(line.id, { allocations: line.allocations.filter((_, partIndex) => partIndex !== index) })} className="rounded-md border border-border px-3 text-sm disabled:opacity-50">−</button></div>)}<div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground"><span>{t("flow.splitTotal", { current: (line.allocations.reduce((sum, part) => sum + part.amountCents, 0) / 100).toFixed(2), expected: (line.amountCents / 100).toFixed(2) })}</span><button type="button" onClick={() => updateLine(line.id, { allocations: [...line.allocations, { category: null, amountCents: 0 }] })} className="font-medium text-primary underline-offset-4 hover:underline">{t("flow.addPart")}</button><button type="button" onClick={() => updateLine(line.id, { allocations: [], category: null })} className="font-medium text-primary underline-offset-4 hover:underline">{t("flow.cancelSplit")}</button></div></div>}
          {line.categoryProposal && <p className="mt-2 text-xs text-muted-foreground">{t("flow.suggested", { category: t(`categories.${line.categoryProposal}`) })}</p>}
        </div>)}
      </fieldset>
      {totalCents !== null && lineTotal !== totalCents && <p className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive" role="alert">{t("flow.totalMismatch", { current: (lineTotal / 100).toFixed(2), expected: (totalCents / 100).toFixed(2) })}</p>}
      <p className="text-sm text-muted-foreground">{t("flow.reviewNotice")}</p>
      <div className="flex flex-wrap gap-3"><button type="submit" disabled={!canConfirm || busy} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2">{busy ? t("flow.saving") : t("flow.confirm")}</button><button type="button" onClick={() => void discard()} disabled={busy} className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground disabled:opacity-50">{t("flow.discard")}</button></div>
    </form>}
  </section>;
}
