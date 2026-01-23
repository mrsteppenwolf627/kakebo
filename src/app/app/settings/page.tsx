"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

type UserSettingsRow = {
  user_id: string;
  monthly_income: number | null;
  monthly_saving_goal: number | null;
  budget_supervivencia: number | null;
  budget_opcional: number | null;
  budget_cultura: number | null;
  budget_extra: number | null;
};

const DEFAULT: Omit<UserSettingsRow, "user_id"> = {
  monthly_income: 0,
  monthly_saving_goal: 0,
  budget_supervivencia: 0,
  budget_opcional: 0,
  budget_cultura: 0,
  budget_extra: 0,
};

function num(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function SettingsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);

  const [form, setForm] = useState<Omit<UserSettingsRow, "user_id">>(DEFAULT);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr(null);
      setOk(null);

      try {
        const { data: sessionRes, error: sessionErr } =
          await supabase.auth.getSession();
        if (sessionErr) throw sessionErr;

        const uid = sessionRes.session?.user?.id;
        if (!uid) throw new Error("Auth session missing");
        if (cancelled) return;

        setUserId(uid);

        const { data, error } = await supabase
          .from("user_settings")
          .select(
            "user_id,monthly_income,monthly_saving_goal,budget_supervivencia,budget_opcional,budget_cultura,budget_extra"
          )
          .eq("user_id", uid)
          .limit(1);

        if (error) throw error;

        const row = (data?.[0] as UserSettingsRow | undefined) ?? null;

        setForm({
          monthly_income: num(row?.monthly_income ?? 0),
          monthly_saving_goal: num(row?.monthly_saving_goal ?? 0),
          budget_supervivencia: num(row?.budget_supervivencia ?? 0),
          budget_opcional: num(row?.budget_opcional ?? 0),
          budget_cultura: num(row?.budget_cultura ?? 0),
          budget_extra: num(row?.budget_extra ?? 0),
        });
      } catch (e: any) {
        setErr(e?.message ?? "Error cargando ajustes");
      } finally {
        setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function handleSave() {
    setErr(null);
    setOk(null);

    if (!userId) {
      setErr("Auth session missing");
      return;
    }

    setSaving(true);

    try {
      const payload: UserSettingsRow = {
        user_id: userId,
        monthly_income: num(form.monthly_income),
        monthly_saving_goal: num(form.monthly_saving_goal),
        budget_supervivencia: num(form.budget_supervivencia),
        budget_opcional: num(form.budget_opcional),
        budget_cultura: num(form.budget_cultura),
        budget_extra: num(form.budget_extra),
      };

      const { error } = await supabase
        .from("user_settings")
        .upsert(payload, { onConflict: "user_id" });

      if (error) throw error;

      setOk("Ajustes guardados.");
    } catch (e: any) {
      setErr(e?.message ?? "Error guardando ajustes");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen p-6 max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Ajustes</h1>

      {err && <div className="text-sm text-red-600">{err}</div>}
      {ok && <div className="text-sm text-green-700">{ok}</div>}
      {loading && <div className="text-sm text-black/60">Cargando…</div>}

      {!loading && (
        <>
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm">Ingresos mensuales (€)</label>
              <input
                type="number"
                className="w-full border border-black/20 rounded-lg p-2"
                value={form.monthly_income}
                onChange={(e) =>
                  setForm({ ...form, monthly_income: Number(e.target.value) })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm">Objetivo de ahorro (€)</label>
              <input
                type="number"
                className="w-full border border-black/20 rounded-lg p-2"
                value={form.monthly_saving_goal}
                onChange={(e) =>
                  setForm({
                    ...form,
                    monthly_saving_goal: Number(e.target.value),
                  })
                }
              />
            </div>

            <div className="border border-black/10 rounded-lg p-4 space-y-4">
              <div className="font-semibold">Presupuestos por categoría</div>

              <div className="space-y-2">
                <label className="block text-sm">Supervivencia (€)</label>
                <input
                  type="number"
                  className="w-full border border-black/20 rounded-lg p-2"
                  value={form.budget_supervivencia}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      budget_supervivencia: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm">Opcional (€)</label>
                <input
                  type="number"
                  className="w-full border border-black/20 rounded-lg p-2"
                  value={form.budget_opcional}
                  onChange={(e) =>
                    setForm({ ...form, budget_opcional: Number(e.target.value) })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm">Cultura (€)</label>
                <input
                  type="number"
                  className="w-full border border-black/20 rounded-lg p-2"
                  value={form.budget_cultura}
                  onChange={(e) =>
                    setForm({ ...form, budget_cultura: Number(e.target.value) })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm">Extra (€)</label>
                <input
                  type="number"
                  className="w-full border border-black/20 rounded-lg p-2"
                  value={form.budget_extra}
                  onChange={(e) =>
                    setForm({ ...form, budget_extra: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-black text-white rounded-lg p-2 hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Guardar ajustes"}
            </button>

            <div className="text-xs text-black/60">
              Estos ajustes se guardan en tu cuenta (Supabase), no en el navegador.
            </div>
          </div>

          {/* ✅ BLOQUE SEO */}
          <section className="mt-12 border-t border-black/10 pt-8 space-y-3 text-sm text-black/70">
            <h2 className="text-lg font-semibold text-black">
              Ajustes de presupuesto y objetivo de ahorro
            </h2>
            <p>
              En esta sección puedes definir tu ingreso mensual, tu objetivo de ahorro
              y los presupuestos máximos por categoría del método Kakebo. Esto te permite
              controlar el gasto y medir la evolución de tus hábitos mes a mes.
            </p>
            <div className="text-xs text-black/50">
              (Hueco SEO: texto sobre “presupuesto mensual”, “objetivo de ahorro”, “método kakebo”.)
            </div>
          </section>
        </>
      )}
    </main>
  );
}
