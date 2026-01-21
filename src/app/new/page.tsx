"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

const KAKEBO_CATEGORIES = {
  supervivencia: { label: "Supervivencia", color: "#dc2626" },
  opcional: { label: "Opcional", color: "#2563eb" },
  cultura: { label: "Cultura", color: "#16a34a" },
  extra: { label: "Extra", color: "#9333ea" },
} as const;

type CategoryKey = keyof typeof KAKEBO_CATEGORIES;

type MonthRow = {
  id: string;
  user_id: string;
  year: number;
  month: number;
  status: "open" | "closed";
};

function parseYearMonth(dateStr: string) {
  // dateStr: yyyy-mm-dd
  const [y, m] = dateStr.split("-").map((x) => Number(x));
  return { year: y, month: m };
}

export default function NewExpensePage() {
  const supabase = createClient();
  const router = useRouter();

  const today = new Date().toISOString().slice(0, 10);

  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<CategoryKey>("supervivencia");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function getOrCreateMonthId(userId: string, year: number, month: number) {
    // 1) buscar mes existente
    const { data: existing, error: selErr } = await supabase
      .from("months")
      .select("id,user_id,year,month,status")
      .eq("user_id", userId)
      .eq("year", year)
      .eq("month", month)
      .limit(1);

    if (selErr) throw selErr;

    const row = (existing?.[0] as MonthRow | undefined) ?? null;
    if (row) {
      if (row.status === "closed") {
        throw new Error("Este mes está cerrado. No se pueden añadir gastos.");
      }
      return row.id;
    }

    // 2) crear mes
    const { data: created, error: insErr } = await supabase
      .from("months")
      .insert({
        user_id: userId,
        year,
        month,
        status: "open",
      })
      .select("id")
      .single();

    if (insErr) throw insErr;

    return created.id as string;
  }

  async function saveExpense() {
    setError(null);
    setSaving(true);

    try {
      const { data: sessionRes, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) throw sessionErr;

      const session = sessionRes.session;
      if (!session?.user) throw new Error("Auth session missing");

      const userId = session.user.id;
      const { year, month } = parseYearMonth(date);

      const monthId = await getOrCreateMonthId(userId, year, month);

      const cat = KAKEBO_CATEGORIES[category];

      const { error } = await supabase.from("expenses").insert({
        user_id: userId,
        month_id: monthId, // ✅ clave
        date,
        note,
        amount: Number(amount),
        category,
        color: cat.color,
      });

      if (error) throw error;

      router.push("/");
      router.refresh?.();
    } catch (e: any) {
      setError(e?.message ?? "Error guardando gasto");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="max-w-xl mx-auto space-y-6">
        <h1 className="text-3xl font-semibold">Nuevo gasto</h1>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Fecha</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border border-black/20 px-3 py-2 w-full"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Concepto</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="border border-black/20 px-3 py-2 w-full"
              placeholder="Ej: mandarina"
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
            onClick={saveExpense}
            disabled={saving}
            className="border border-black px-4 py-2 hover:bg-black hover:text-white disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar gasto"}
          </button>
        </div>
      </div>
    </main>
  );
}
