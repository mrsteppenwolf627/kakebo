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

  // estado del mes (si viene ym)
  const [monthClosed, setMonthClosed] = useState(false);
  const [checking, setChecking] = useState(false);

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
    if (ymValid && ym && monthClosed) {
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
    <main className="min-h-screen px-6 py-10">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Nuevo gasto</h1>
            <div className="text-sm text-black/60">{badge}</div>
            {ymValid && ym && monthClosed && (
              <div className="text-xs text-red-600 mt-1">
                Este mes está cerrado. No se pueden añadir gastos.
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => router.push(backHref)}
            className="border border-black px-3 py-2 text-sm hover:bg-black hover:text-white"
          >
            Volver
          </button>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Fecha</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(clampDateToYm(e.target.value))}
              className="border border-black/20 px-3 py-2 w-full"
              disabled={Boolean(ymValid && ym) && Boolean(monthClosed)}

            />
            {ymValid && ym && (
              <div className="text-xs text-black/50 mt-1">
                La fecha se mantiene dentro del mes seleccionado.
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm mb-1">Concepto</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="border border-black/20 px-3 py-2 w-full"
              placeholder="Ej: mandarina"
              disabled={!!ymValid && !!ym && !!monthClosed}

            />
          </div>

          <div>
            <label className="block text-sm mb-1">Importe (€)</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="border border-black/20 px-3 py-2 w-full"
              placeholder="Ej: 12.50"
              disabled={!!ymValid && !!ym && !!monthClosed}

            />
          </div>

          <div>
            <label className="block text-sm mb-1">Categoría (Kakebo)</label>
            <div className="flex items-center gap-3">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: KAKEBO_CATEGORIES[category].color }}
                title={KAKEBO_CATEGORIES[category].label}
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryKey)}
                className="border border-black/20 px-3 py-2 w-full"
                disabled={!!ymValid && !!ym && !!monthClosed}

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
            disabled={saving || (ymValid && ym && monthClosed) || checking}
            className="border border-black px-4 py-2 hover:bg-black hover:text-white disabled:opacity-50"
          >
            {checking ? "Comprobando…" : saving ? "Guardando…" : "Guardar gasto"}
          </button>
        </div>
      </div>
    </main>
  );
}
