"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

const KAKEBO_CATEGORIES = {
  supervivencia: { label: "Supervivencia", color: "#dc2626" },
  opcional: { label: "Opcional", color: "#2563eb" },
  cultura: { label: "Cultura", color: "#16a34a" },
  extra: { label: "Extra", color: "#9333ea" },
} as const;

type CategoryKey = keyof typeof KAKEBO_CATEGORIES;

/**
 * Map AI categories (English) to frontend categories (Spanish)
 */
const AI_TO_FRONTEND_CATEGORY: Record<string, CategoryKey> = {
  survival: "supervivencia",
  optional: "opcional",
  culture: "cultura",
  extra: "extra",
};

/**
 * Map frontend categories (Spanish) to AI categories (English)
 */
const FRONTEND_TO_AI_CATEGORY: Record<CategoryKey, string> = {
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

  // UI: deshabilitar inputs si el mes está cerrado (y venimos con ym válido)
  const inputsDisabled = !!ymValid && !!ym && !!monthClosed;

  useEffect(() => {
    setDate(defaultDate);
  }, [defaultDate]);

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
        if (!cancelled) setError(e?.message ?? "Error comprobando el mes");
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    checkMonth();

    return () => {
      cancelled = true;
    };
  }, [ymValid, ym, supabase]);

  async function requestAISuggestion() {
    if (!note.trim()) {
      setAiError("Escribe un concepto primero");
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
        throw new Error(data.error || "Error al clasificar");
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
    // Only record if we had a suggestion and the user chose differently
    if (!aiSuggestion || !aiSuggestion.logId) return;

    const aiCategoryInFrontend = aiSuggestion.category;
    if (selectedCategory === aiCategoryInFrontend) return;

    // Record the correction
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
      // Silent fail - don't block the expense save
    }
  }

  function clampDateToYm(d: string) {
    // si hay ym, obligamos a que la fecha se mantenga dentro del mes seleccionado
    if (!ymValid || !ym) return d;
    if (d.startsWith(`${ym}-`)) return d;
    return `${ym}-01`;
  }

  async function ensureMonth(userId: string, year: number, month: number) {
    // buscamos mes, si no existe lo creamos open
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
      setError(`Mes cerrado (${ym}): no se pueden añadir gastos.`);
      return;
    }

    setSaving(true);

    try {
      const { data: sessionRes } = await supabase.auth.getSession();
      const session = sessionRes.session;
      if (!session?.user) throw new Error("Auth session missing");

      // si venimos con ym, forzamos la fecha dentro de ese mes
      const safeDate = clampDateToYm(date);

      // determinamos mes objetivo
      const targetYear =
        ymValid && ym ? parseYm(ym).year : Number(safeDate.slice(0, 4));
      const targetMonth =
        ymValid && ym ? parseYm(ym).month : Number(safeDate.slice(5, 7));

      const m = await ensureMonth(session.user.id, targetYear, targetMonth);

      if (m.status === "closed") {
        setError(
          `Mes cerrado (${targetYear}-${pad2(
            targetMonth
          )}): no se pueden añadir gastos.`
        );
        return;
      }

      const cat = KAKEBO_CATEGORIES[category];

      const { error } = await supabase.from("expenses").insert({
        user_id: session.user.id,
        month_id: m.id,
        date: safeDate,
        note,
        amount: Number(amount),
        category, // clave kakebo
        color: cat.color,
      });

      if (error) throw error;

      // Record correction if user changed the AI suggestion
      await recordCorrectionIfNeeded(category);

      // volvemos al dashboard del mes correspondiente (AHORA ES /app)
      router.push(`/app?ym=${targetYear}-${pad2(targetMonth)}`);
      router.refresh?.();
    } catch (e: any) {
      setError(e?.message ?? "Error guardando gasto");
    } finally {
      setSaving(false);
    }
  }

  const badge = ymValid && ym ? `Mes: ${ym}` : "Mes: actual";

  // volver al dashboard (AHORA ES /app)
  const backHref = ymValid && ym ? `/app?ym=${ym}` : "/app";

  return (
    <main className="min-h-screen px-4 sm:px-6 py-6 sm:py-10">
      <div className="mx-auto max-w-xl space-y-4 sm:space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold">Nuevo gasto</h1>
            <div className="text-sm text-black/60">{badge}</div>

            {inputsDisabled && (
              <div className="mt-1 text-xs text-red-600">
                Este mes está cerrado. No se pueden añadir gastos.
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => router.push(backHref)}
            className="border border-black px-3 py-2 text-sm hover:bg-black hover:text-white shrink-0"
          >
            ← Volver
          </button>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm">Fecha</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(clampDateToYm(e.target.value))}
              className="w-full border border-black/20 px-3 py-2"
              disabled={inputsDisabled}
            />
            {ymValid && ym && (
              <div className="mt-1 text-xs text-black/50">
                La fecha se mantiene dentro del mes seleccionado.
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm">Concepto</label>
            <div className="flex gap-2">
              <input
                value={note}
                onChange={(e) => {
                  setNote(e.target.value);
                  // Clear suggestion when note changes
                  if (aiSuggestion) {
                    setAiSuggestion(null);
                    setSuggestionAccepted(false);
                  }
                }}
                className="flex-1 border border-black/20 px-3 py-2"
                placeholder="Ej: mandarina"
                disabled={inputsDisabled}
              />
              <button
                type="button"
                onClick={requestAISuggestion}
                disabled={inputsDisabled || aiLoading || !note.trim()}
                className="border border-black/20 px-3 py-2 text-sm hover:border-black hover:bg-black hover:text-white disabled:opacity-50 shrink-0"
                title="Sugerir categoría con IA"
              >
                {aiLoading ? "…" : "🤖 IA"}
              </button>
            </div>
            {aiError && (
              <div className="mt-1 text-xs text-red-600">{aiError}</div>
            )}
          </div>

          {/* AI Suggestion */}
          {aiSuggestion && !suggestionAccepted && (
            <div className="border border-blue-300 bg-blue-50 p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-medium">Sugerencia IA</div>
                  <div className="text-xs text-black/60 mt-1">
                    Categoría:{" "}
                    <span className="font-medium">
                      {KAKEBO_CATEGORIES[aiSuggestion.category].label}
                    </span>
                    <span
                      className="inline-block ml-1 h-2 w-2 rounded-full"
                      style={{ backgroundColor: KAKEBO_CATEGORIES[aiSuggestion.category].color }}
                    />
                  </div>
                  <div className="text-xs text-black/60">
                    Confianza: {(aiSuggestion.confidence * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={acceptSuggestion}
                    className="border border-green-600 text-green-700 px-3 py-1 text-xs hover:bg-green-600 hover:text-white"
                  >
                    Aceptar
                  </button>
                  <button
                    type="button"
                    onClick={dismissSuggestion}
                    className="border border-black/20 px-3 py-1 text-xs hover:border-black"
                  >
                    Ignorar
                  </button>
                </div>
              </div>
            </div>
          )}

          {suggestionAccepted && (
            <div className="text-xs text-green-600">
              Sugerencia de IA aceptada
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm">Importe (€)</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-black/20 px-3 py-2"
              placeholder="Ej: 12.50"
              disabled={inputsDisabled}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm">Categoría (Kakebo)</label>
            <div className="flex items-center gap-3">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: KAKEBO_CATEGORIES[category].color }}
                title={KAKEBO_CATEGORIES[category].label}
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryKey)}
                className="w-full border border-black/20 px-3 py-2"
                disabled={inputsDisabled}
              >
                {Object.entries(KAKEBO_CATEGORIES).map(([key, c]) => (
                  <option key={key} value={key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={saveExpense}
            disabled={saving || inputsDisabled || checking}
            className="border border-black px-4 py-2 hover:bg-black hover:text-white disabled:opacity-50"
          >
            {checking ? "Comprobando…" : saving ? "Guardando…" : "Guardar gasto"}
          </button>
        </div>
      </div>
    </main>
  );
}
