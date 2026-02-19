"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { canUsePremium, Profile } from "@/lib/auth/access-control";
import { useTranslations } from "next-intl";

const KAKEBO_CATEGORIES = {
  supervivencia: { labelKey: "supervivencia", color: "#dc2626" },
  opcional: { labelKey: "opcional", color: "#2563eb" },
  cultura: { labelKey: "cultura", color: "#16a34a" },
  extra: { labelKey: "extra", color: "#9333ea" },
} as const;

type CategoryKey = keyof typeof KAKEBO_CATEGORIES;

/**
 * Map AI categories (English) to frontend categories (Spanish keys)
 */
const AI_TO_FRONTEND_CATEGORY: Record<string, CategoryKey> = {
  survival: "supervivencia",
  optional: "opcional",
  culture: "cultura",
  extra: "extra",
};

/**
 * Map frontend categories (Spanish) to API categories (English)
 */
const FRONTEND_TO_API_CATEGORY: Record<CategoryKey, string> = {
  supervivencia: "survival",
  opcional: "optional",
  cultura: "culture",
  extra: "extra",
};

interface AISuggestion {
  category: CategoryKey;
  note: string;
  confidence: number;
  logId: string | null;
}

function isYm(s: string | null) {
  return !!s && /^\d{4}-\d{2}$/.test(s);
}

function parseYm(ym: string) {
  const [y, m] = ym.split("-");
  return { year: Number(y), month: Number(m) };
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export default function NewExpensePage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("Transaction");
  const tCommon = useTranslations("Transaction.Common");
  const tExpense = useTranslations("Transaction.NewExpense");

  const ym = searchParams?.get("ym");
  const ymValid = isYm(ym);

  // fecha por defecto:
  // - si vienes con ?ym, ponemos el día 01 de ese mes
  // - si no, hoy
  const defaultDate = useMemo(() => {
    if (ymValid && ym) return `${ym}-01`;
    return new Date().toISOString().slice(0, 10);
  }, [ymValid, ym]);

  const [date, setDate] = useState(defaultDate);
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<CategoryKey>("supervivencia");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // AI suggestion state
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [suggestionAccepted, setSuggestionAccepted] = useState(false);

  // estado del mes (si viene ym)
  const [monthClosed, setMonthClosed] = useState(false);
  const [checking, setChecking] = useState(false);

  // Premium access check
  const [hasPremiumAccess, setHasPremiumAccess] = useState<boolean>(false);

  // UI: deshabilitar inputs si el mes está cerrado (y venimos con ym válido)
  const inputsDisabled = !!ymValid && !!ym && !!monthClosed;

  useEffect(() => {
    setDate(defaultDate);
  }, [defaultDate]);

  // Check premium access on mount
  useEffect(() => {
    async function checkPremiumAccess() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setHasPremiumAccess(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setHasPremiumAccess(canUsePremium(data as Profile));
    }
    checkPremiumAccess();
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;

    async function checkMonth() {
      setError(null);
      setMonthClosed(false);

      if (!ymValid || !ym) return;

      setChecking(true);

      try {
        const { data: sessionRes, error: sessionErr } =
          await supabase.auth.getSession();
        if (sessionErr) throw sessionErr;

        const userId = sessionRes.session?.user?.id;
        if (!userId) throw new Error("Auth session missing");

        const { year, month } = parseYm(ym);

        const { data, error } = await supabase
          .from("months")
          .select("status")
          .eq("user_id", userId)
          .eq("year", year)
          .eq("month", month)
          .limit(1);

        if (error) throw error;

        const status =
          (data?.[0]?.status as "open" | "closed" | undefined) ?? "open";

        if (!cancelled) setMonthClosed(status === "closed");
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? tExpense("errors.checkFailed"));
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    checkMonth();

    return () => {
      cancelled = true;
    };
  }, [ymValid, ym, supabase, tExpense]);

  async function requestAISuggestion() {
    if (!note.trim()) {
      setAiError(tExpense("ai.emptyError"));
      return;
    }

    setAiLoading(true);
    setAiError(null);
    setAiSuggestion(null);
    setSuggestionAccepted(false);

    try {
      const response = await fetch("/api/ai/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: note }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || data.error || "Error al clasificar");
      }

      const aiCategory = data.data.category as string;
      const frontendCategory = AI_TO_FRONTEND_CATEGORY[aiCategory] || "opcional";

      setAiSuggestion({
        category: frontendCategory,
        note: data.data.note || note,
        confidence: data.data.confidence || 0,
        logId: data.data.logId || null,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setAiError(message);
    } finally {
      setAiLoading(false);
    }
  }

  // Effect to handle auto-acceptance or notification after suggestion is set
  useEffect(() => {
    if (aiSuggestion && !suggestionAccepted) {
      if (aiSuggestion.confidence > 0.8) {
        // Auto-accept
        setCategory(aiSuggestion.category);
        setSuggestionAccepted(true);
      }
    }
  }, [aiSuggestion, suggestionAccepted]);

  function acceptSuggestion() {
    if (aiSuggestion) {
      setCategory(aiSuggestion.category);
      setSuggestionAccepted(true);
    }
  }

  function dismissSuggestion() {
    setAiSuggestion(null);
    setSuggestionAccepted(false);
  }

  async function recordCorrectionIfNeeded(selectedCategory: CategoryKey) {
    if (!aiSuggestion || !aiSuggestion.logId) return;

    const aiCategoryInFrontend = aiSuggestion.category;
    if (selectedCategory === aiCategoryInFrontend) return;

    try {
      await fetch("/api/ai/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logId: aiSuggestion.logId,
          correctedCategory: selectedCategory,
        }),
      });
    } catch {
      // Silent fail
    }
  }

  function clampDateToYm(d: string) {
    if (!ymValid || !ym) return d;
    if (d.startsWith(`${ym}-`)) return d;
    return `${ym}-01`;
  }

  async function ensureMonth(userId: string, year: number, month: number) {
    // ... same implementation ...
    const { data, error } = await supabase
      .from("months")
      .select("id,status")
      .eq("user_id", userId)
      .eq("year", year)
      .eq("month", month)
      .limit(1);

    if (error) throw error;

    const existing = data?.[0] as
      | { id: string; status: "open" | "closed" }
      | undefined;
    if (existing) return existing;

    const { data: created, error: cErr } = await supabase
      .from("months")
      .insert({ user_id: userId, year, month, status: "open" })
      .select("id,status")
      .single();

    if (cErr) throw cErr;

    return created as { id: string; status: "open" | "closed" };
  }

  async function saveExpense() {
    setError(null);

    if (checking) return;

    if (inputsDisabled) {
      setError(tExpense("errors.monthClosed", { ym }));
      return;
    }

    setSaving(true);

    try {
      const { data: sessionRes } = await supabase.auth.getSession();
      const session = sessionRes.session;
      if (!session?.user) throw new Error("Auth session missing");

      const safeDate = clampDateToYm(date);

      const targetYear =
        ymValid && ym ? parseYm(ym).year : Number(safeDate.slice(0, 4));
      const targetMonth =
        ymValid && ym ? parseYm(ym).month : Number(safeDate.slice(5, 7));

      const m = await ensureMonth(session.user.id, targetYear, targetMonth);

      if (m.status === "closed") {
        setError(
          tExpense("errors.monthClosed", { ym: `${targetYear}-${pad2(targetMonth)}` })
        );
        return;
      }

      // Use API endpoint instead of direct Supabase insert
      // This triggers the auto-embeddings system
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: safeDate,
          amount: Number(amount),
          category: FRONTEND_TO_API_CATEGORY[category], // Map to English
          note,
          month_id: m.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Error al guardar el gasto");
      }

      await recordCorrectionIfNeeded(category);

      router.push(`/app?ym=${targetYear}-${pad2(targetMonth)}`);
      router.refresh?.();
    } catch (e: any) {
      setError(e?.message ?? tExpense("errors.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  const badge = ymValid && ym ? tCommon("monthActivity", { month: ym }) : tCommon("currentMonth");
  const backHref = ymValid && ym ? `/app?ym=${ym}` : "/app";

  return (
    <main className="min-h-screen px-4 sm:px-6 pt-6 sm:pt-10 flex items-start justify-center">
      <div className="w-full max-w-2xl mx-auto space-y-6">

        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push(backHref)}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            ← {tCommon("back")}
          </button>
          <div className="text-xs uppercase tracking-wide font-medium text-muted-foreground bg-muted px-2 py-1 rounded-sm">
            {badge}
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-6 sm:p-8">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-serif text-foreground font-medium mb-2">{tExpense("title")}</h1>
            <p className="text-sm text-muted-foreground">{tExpense("subtitle")}</p>
          </div>

          {inputsDisabled && (
            <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md flex items-start gap-2">
              <span className="text-lg">🔒</span>
              <div>
                <strong>{tCommon("monthClosed")}</strong>
                <p className="opacity-90">{tCommon("monthClosedDesc")}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Date Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{tCommon("date")}</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(clampDateToYm(e.target.value))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={inputsDisabled}
              />
              {ymValid && ym && (
                <p className="text-xs text-muted-foreground">
                  {tCommon("dateHint")}
                </p>
              )}
            </div>

            {/* Concept + AI */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{tCommon("concept")}</label>
              <div className="flex gap-2">
                <input
                  value={note}
                  onChange={(e) => {
                    setNote(e.target.value);
                    if (aiSuggestion) {
                      setAiSuggestion(null);
                      setSuggestionAccepted(false);
                    }
                  }}
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder={tCommon("placeholders.conceptExpense")}
                  disabled={inputsDisabled}
                  autoFocus
                />
                {hasPremiumAccess && (
                  <button
                    type="button"
                    onClick={requestAISuggestion}
                    disabled={inputsDisabled || aiLoading || !note.trim()}
                    className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 transition-colors shadow-sm"
                    title={tExpense("ai.tooltip")}
                  >
                    {aiLoading ? (
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      `🤖 ${tExpense("ai.button")}`
                    )}
                  </button>
                )}
              </div>
              {aiError && (
                <p className="text-xs text-destructive">{aiError}</p>
              )}
            </div>

            {/* AI Suggestion Box */}
            {aiSuggestion && !suggestionAccepted && (
              <div className="rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      {tExpense("ai.suggestionTitle")}
                    </p>
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      {tCommon("category")}:{" "}
                      <span className="font-semibold" style={{ color: KAKEBO_CATEGORIES[aiSuggestion.category].color }}>
                        {tCommon(`categories.${KAKEBO_CATEGORIES[aiSuggestion.category].labelKey}`)}
                      </span>
                      {" "}• {tExpense("ai.confidence", { percent: (aiSuggestion.confidence * 100).toFixed(0) })}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={acceptSuggestion}
                      className="inline-flex h-8 items-center justify-center rounded-md bg-blue-600 px-3 text-xs font-medium text-white shadow hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {tExpense("ai.accept")}
                    </button>
                    <button
                      type="button"
                      onClick={dismissSuggestion}
                      className="inline-flex h-8 items-center justify-center rounded-md border border-blue-200 dark:border-blue-700 bg-transparent px-3 text-xs font-medium text-blue-900 dark:text-blue-100 shadow-sm hover:bg-blue-100 dark:hover:bg-blue-900/40"
                    >
                      {tExpense("ai.ignore")}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {suggestionAccepted && aiSuggestion && (
              <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900 p-2 rounded-md">
                <span>✨</span>
                <span>{tExpense("ai.detected")} <strong>{tCommon(`categories.${KAKEBO_CATEGORIES[aiSuggestion.category].labelKey}`)}</strong></span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Amount */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{tCommon("amount")}</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">€</span>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-md border border-input bg-background pl-7 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="0.00"
                    disabled={inputsDisabled}
                  />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{tCommon("category")}</label>
                <div className="relative">
                  <div
                    className="absolute left-3 top-3 h-3 w-3 rounded-full ring-1 ring-black/5 dark:ring-white/10"
                    style={{ backgroundColor: KAKEBO_CATEGORIES[category].color }}
                  />
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CategoryKey)}
                    className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={inputsDisabled}
                  >
                    {Object.entries(KAKEBO_CATEGORIES).map(([key, c]) => (
                      <option key={key} value={key}>
                        {tCommon(`categories.${c.labelKey}`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={saveExpense}
                disabled={saving || inputsDisabled || checking}
                className="w-full inline-flex items-center justify-center rounded-md bg-stone-900 dark:bg-stone-50 px-8 py-3 text-sm font-medium text-stone-50 dark:text-stone-900 shadow transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              >
                {checking ? tExpense("checking") : saving ? tExpense("saving") : tExpense("submit")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
