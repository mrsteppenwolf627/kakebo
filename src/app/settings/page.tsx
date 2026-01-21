"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import Link from "next/link";

const KAKEBO_CATEGORIES = {
  supervivencia: { label: "Supervivencia", color: "#dc2626" },
  opcional: { label: "Opcional", color: "#2563eb" },
  cultura: { label: "Cultura", color: "#16a34a" },
  extra: { label: "Extra", color: "#9333ea" },
} as const;

type CategoryKey = keyof typeof KAKEBO_CATEGORIES;

type UserSettingsRow = {
  user_id: string;
  monthly_income: number | null;
  monthly_saving_goal: number | null;
  budget_supervivencia: number | null;
  budget_opcional: number | null;
  budget_cultura: number | null;
  budget_extra: number | null;
};

export default function SettingsPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const [monthlyIncome, setMonthlyIncome] = useState<number>(0);
  const [savingGoal, setSavingGoal] = useState<number>(0);

  const [budgets, setBudgets] = useState<Record<CategoryKey, number>>({
    supervivencia: 0,
    opcional: 0,
    cultura: 0,
    extra: 0,
  });

  const totalBudget = useMemo(() => {
    return (
      (Number(budgets.supervivencia) || 0) +
      (Number(budgets.opcional) || 0) +
      (Number(budgets.cultura) || 0) +
      (Number(budgets.extra) || 0)
    );
  }, [budgets]);

  async function getUserId() {
    const { data: sessionRes, error } = await supabase.auth.getSession();
    if (error) throw error;
    const session = sessionRes.session;
    if (!session?.user) throw new Error("Auth session missing!");
    return session.user.id;
  }

  async function load() {
    setLoading(true);
    setErr(null);
    setOkMsg(null);

    try {
      const userId = await getUserId();

      const { data, error } = await supabase
        .from("user_settings")
        .select(
          "user_id,monthly_income,monthly_saving_goal,budget_supervivencia,budget_opcional,budget_cultura,budget_extra"
        )
        .eq("user_id", userId)
        .limit(1);

      if (error) throw error;

      const row = (data?.[0] as UserSettingsRow | undefined) ?? null;

      setMonthlyIncome(Number(row?.monthly_income ?? 0));
      setSavingGoal(Number(row?.monthly_saving_goal ?? 0));

      setBudgets({
        supervivencia: Number(row?.budget_supervivencia ?? 0),
        opcional: Number(row?.budget_opcional ?? 0),
        cultura: Number(row?.budget_cultura ?? 0),
        extra: Number(row?.budget_extra ?? 0),
      });
    } catch (e: any) {
      setErr(e?.message ?? "Error cargando ajustes");
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setSaving(true);
    setErr(null);
    setOkMsg(null);

    try {
      const userId = await getUserId();

      const payload: UserSettingsRow = {
        user_id: userId,
        monthly_income: Number(monthlyIncome) || 0,
        monthly_saving_goal: Number(savingGoal) || 0,
        budget_supervivencia: Number(budgets.supervivencia) || 0,
        budget_opcional: Number(budgets.opcional) || 0,
        budget_cultura: Number(budgets.cultura) || 0,
        budget_extra: Number(budgets.extra) || 0,
      };

      // upsert: crea si no existe, actualiza si existe
      const { error } = await supabase.from("user_settings").upsert(payload);

      if (error) throw error;

      setOkMsg("Ajustes guardados.");
    } catch (e: any) {
      setErr(e?.message ?? "Error guardando ajustes");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen p-6 max-w-xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Ajustes</h1>
          <p className="text-sm text-black/60">
            Ingresos, objetivo de ahorro y presupuestos por categoría.
          </p>
        </div>

        <Link
          href="/"
          className="border border-black px-3 py-2 text-sm hover:bg-black hover:text-white"
        >
          Volver
        </Link>
      </div>

      {err && <div className="text-sm text-red-600">{err}</div>}
      {okMsg && <div className="text-sm text-green-700">{okMsg}</div>}
      {loading && <div className="text-sm text-black/60">Cargando…</div>}

      {!loading && (
        <>
          <div className="space-y-2">
            <label className="block text-sm">Ingresos mensuales (€)</label>
            <input
              type="number"
              className="w-full border rounded-lg p-2"
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm">Objetivo de ahorro (€)</label>
            <input
              type="number"
              className="w-full border rounded-lg p-2"
              value={savingGoal}
              onChange={(e) => setSavingGoal(Number(e.target.value))}
            />
          </div>

          <div className="border border-black/10 rounded-lg p-4 space-y-3">
            <div>
              <div className="text-sm font-semibold">Presupuestos por categoría</div>
              <div className="text-xs text-black/60">
                Total presupuestos: {totalBudget.toFixed(2)} €
              </div>
            </div>

            {(Object.keys(KAKEBO_CATEGORIES) as CategoryKey[]).map((key) => {
              const cat = KAKEBO_CATEGORIES[key];
              return (
                <div key={key} className="space-y-1">
                  <label className="block text-sm">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full mr-2 align-middle"
                      style={{ backgroundColor: cat.color }}
                    />
                    {cat.label} (€)
                  </label>
                  <input
                    type="number"
                    className="w-full border rounded-lg p-2"
                    value={budgets[key]}
                    onChange={(e) =>
                      setBudgets((b) => ({ ...b, [key]: Number(e.target.value) }))
                    }
                  />
                </div>
              );
            })}
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="w-full bg-black text-white rounded-lg p-2 hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar ajustes"}
          </button>
        </>
      )}
    </main>
  );
}
