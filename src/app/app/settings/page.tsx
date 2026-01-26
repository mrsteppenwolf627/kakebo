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

type FixedExpenseRow = {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  active: boolean;
  start_ym: string;
  end_ym: string | null;
  created_at: string;
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

function isYm(s: string) {
  return /^\d{4}-\d{2}$/.test(s);
}

function currentYm() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export default function SettingsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<UserSettingsRow, "user_id">>(DEFAULT);

  // ✅ gastos fijos
  const [fixedLoading, setFixedLoading] = useState(true);
  const [fixedErr, setFixedErr] = useState<string | null>(null);
  const [fixedOk, setFixedOk] = useState<string | null>(null);
  const [fixedRows, setFixedRows] = useState<FixedExpenseRow[]>([]);
  const [fixedSaving, setFixedSaving] = useState(false);

  const [fixedForm, setFixedForm] = useState<{
    name: string;
    amount: number;
    start_ym: string;
    end_ym: string;
    active: boolean;
  }>({
    name: "",
    amount: 0,
    start_ym: currentYm(),
    end_ym: "",
    active: true,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr(null);
      setOk(null);

      setFixedLoading(true);
      setFixedErr(null);
      setFixedOk(null);

      try {
        const { data: sessionRes, error: sessionErr } = await supabase.auth.getSession();
        if (sessionErr) throw sessionErr;

        const uid = sessionRes.session?.user?.id;
        if (!uid) throw new Error("Auth session missing");
        if (cancelled) return;

        setUserId(uid);

        // 1) settings
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

        // 2) fixed expenses
        const { data: fx, error: fxErr } = await supabase
          .from("fixed_expenses")
          .select("id,user_id,name,amount,active,start_ym,end_ym,created_at")
          .eq("user_id", uid)
          .order("created_at", { ascending: false });

        if (fxErr) throw fxErr;

        setFixedRows((fx as FixedExpenseRow[]) ?? []);
      } catch (e: any) {
        setErr(e?.message ?? "Error cargando ajustes");
      } finally {
        setLoading(false);
        setFixedLoading(false);
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

      const { error } = await supabase.from("user_settings").upsert(payload, { onConflict: "user_id" });
      if (error) throw error;

      setOk("Ajustes guardados.");
    } catch (e: any) {
      setErr(e?.message ?? "Error guardando ajustes");
    } finally {
      setSaving(false);
    }
  }

  async function reloadFixed() {
    if (!userId) return;

    setFixedLoading(true);
    setFixedErr(null);
    try {
      const { data: fx, error: fxErr } = await supabase
        .from("fixed_expenses")
        .select("id,user_id,name,amount,active,start_ym,end_ym,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (fxErr) throw fxErr;

      setFixedRows((fx as FixedExpenseRow[]) ?? []);
    } catch (e: any) {
      setFixedErr(e?.message ?? "Error cargando gastos fijos");
    } finally {
      setFixedLoading(false);
    }
  }

  async function addFixed() {
    setFixedErr(null);
    setFixedOk(null);

    if (!userId) {
      setFixedErr("Auth session missing");
      return;
    }

    const name = (fixedForm.name ?? "").trim();
    const amount = num(fixedForm.amount);
    const start_ym = (fixedForm.start_ym ?? "").trim();
    const end_ym = (fixedForm.end_ym ?? "").trim();

    if (!name) {
      setFixedErr("Pon un nombre (ej: Alquiler).");
      return;
    }
    if (!(amount > 0)) {
      setFixedErr("El importe debe ser mayor que 0.");
      return;
    }
    if (!isYm(start_ym)) {
      setFixedErr("start_ym debe ser YYYY-MM (ej: 2026-01).");
      return;
    }
    if (end_ym && !isYm(end_ym)) {
      setFixedErr("end_ym debe ser YYYY-MM o vacío.");
      return;
    }
    if (end_ym && end_ym < start_ym) {
      setFixedErr("end_ym no puede ser anterior a start_ym.");
      return;
    }

    setFixedSaving(true);

    try {
      const payload = {
        user_id: userId,
        name,
        amount,
        active: !!fixedForm.active,
        start_ym,
        end_ym: end_ym ? end_ym : null,
      };

      const { error } = await supabase.from("fixed_expenses").insert(payload);
      if (error) throw error;

      setFixedOk("Gasto fijo añadido.");
      setFixedForm((s) => ({
        ...s,
        name: "",
        amount: 0,
        // dejamos start_ym igual por comodidad
        end_ym: "",
        active: true,
      }));

      await reloadFixed();
    } catch (e: any) {
      setFixedErr(e?.message ?? "Error guardando gasto fijo");
    } finally {
      setFixedSaving(false);
    }
  }

  async function toggleFixed(id: string, nextActive: boolean) {
    setFixedErr(null);
    setFixedOk(null);

    if (!userId) {
      setFixedErr("Auth session missing");
      return;
    }

    // optimista
    const prev = fixedRows;
    setFixedRows((r) => r.map((x) => (x.id === id ? { ...x, active: nextActive } : x)));

    try {
      const { error } = await supabase
        .from("fixed_expenses")
        .update({ active: nextActive })
        .eq("id", id)
        .eq("user_id", userId);

      if (error) throw error;

      setFixedOk(nextActive ? "Activado." : "Desactivado.");
    } catch (e: any) {
      setFixedRows(prev);
      setFixedErr(e?.message ?? "Error actualizando gasto fijo");
    }
  }

  const fixedActiveTotal = useMemo(() => {
    return fixedRows
      .filter((r) => r.active)
      .reduce((acc, r) => acc + (num(r.amount) || 0), 0);
  }, [fixedRows]);

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
                onChange={(e) => setForm({ ...form, monthly_income: Number(e.target.value) })}
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
                  onChange={(e) => setForm({ ...form, budget_opcional: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm">Cultura (€)</label>
                <input
                  type="number"
                  className="w-full border border-black/20 rounded-lg p-2"
                  value={form.budget_cultura}
                  onChange={(e) => setForm({ ...form, budget_cultura: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm">Extra (€)</label>
                <input
                  type="number"
                  className="w-full border border-black/20 rounded-lg p-2"
                  value={form.budget_extra}
                  onChange={(e) => setForm({ ...form, budget_extra: Number(e.target.value) })}
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

          {/* ✅ GASTOS FIJOS */}
          <section className="mt-10 border-t border-black/10 pt-8 space-y-4">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-semibold text-black">Gastos fijos</h2>
              <div className="text-sm text-black/60">
                Total activos: <span className="font-semibold">{fixedActiveTotal.toFixed(2)} €</span>
              </div>
            </div>

            {fixedErr && <div className="text-sm text-red-600">{fixedErr}</div>}
            {fixedOk && <div className="text-sm text-green-700">{fixedOk}</div>}
            {fixedLoading && <div className="text-sm text-black/60">Cargando gastos fijos…</div>}

            {!fixedLoading && (
              <div className="border border-black/10 rounded-lg p-4 space-y-4">
                {/* Form alta */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-sm">Nombre</label>
                    <input
                      className="w-full border border-black/20 rounded-lg p-2"
                      placeholder="Ej: Alquiler"
                      value={fixedForm.name}
                      onChange={(e) => setFixedForm({ ...fixedForm, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm">Importe (€)</label>
                    <input
                      type="number"
                      className="w-full border border-black/20 rounded-lg p-2"
                      value={fixedForm.amount}
                      onChange={(e) => setFixedForm({ ...fixedForm, amount: Number(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm">Activo</label>
                    <select
                      className="w-full border border-black/20 rounded-lg p-2"
                      value={fixedForm.active ? "true" : "false"}
                      onChange={(e) => setFixedForm({ ...fixedForm, active: e.target.value === "true" })}
                    >
                      <option value="true">Sí</option>
                      <option value="false">No</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm">Desde (YYYY-MM)</label>
                    <input
                      className="w-full border border-black/20 rounded-lg p-2"
                      placeholder="2026-01"
                      value={fixedForm.start_ym}
                      onChange={(e) => setFixedForm({ ...fixedForm, start_ym: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm">Hasta (opcional, YYYY-MM)</label>
                    <input
                      className="w-full border border-black/20 rounded-lg p-2"
                      placeholder="2026-12"
                      value={fixedForm.end_ym}
                      onChange={(e) => setFixedForm({ ...fixedForm, end_ym: e.target.value })}
                    />
                  </div>
                </div>

                <button
                  onClick={addFixed}
                  disabled={fixedSaving}
                  className="w-full bg-black text-white rounded-lg p-2 hover:opacity-90 disabled:opacity-50"
                >
                  {fixedSaving ? "Guardando…" : "Añadir gasto fijo"}
                </button>

                <div className="text-xs text-black/60">
                  Los gastos fijos se aplican al mes si <span className="font-semibold">start_ym ≤ ym</span> y{" "}
                  <span className="font-semibold">end_ym</span> está vacío o <span className="font-semibold">end_ym ≥ ym</span>.
                </div>

                {/* Lista */}
                <div className="border-t border-black/10 pt-4 space-y-2">
                  <div className="font-semibold text-sm">Tus gastos fijos</div>

                  {fixedRows.length === 0 && (
                    <div className="text-sm text-black/60">Aún no tienes gastos fijos.</div>
                  )}

                  {fixedRows.length > 0 && (
                    <ul className="space-y-2">
                      {fixedRows.map((r) => (
                        <li
                          key={r.id}
                          className="border border-black/10 rounded-lg p-3 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">
                              {r.name}{" "}
                              {!r.active && <span className="text-xs text-black/50">(inactivo)</span>}
                            </div>
                            <div className="text-xs text-black/60">
                              {r.start_ym}
                              {r.end_ym ? ` → ${r.end_ym}` : " → (sin fin)"}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-sm font-semibold">{num(r.amount).toFixed(2)} €</div>

                            <button
                              onClick={() => toggleFixed(r.id, !r.active)}
                              className={`border px-3 py-2 text-xs rounded-lg ${
                                r.active
                                  ? "border-black hover:bg-black hover:text-white"
                                  : "border-black/30 text-black/60 hover:border-black hover:text-black"
                              }`}
                              title={r.active ? "Desactivar" : "Activar"}
                            >
                              {r.active ? "Desactivar" : "Activar"}
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="pt-2">
                    <button
                      onClick={reloadFixed}
                      className="border border-black px-3 py-2 text-sm hover:bg-black hover:text-white rounded-lg"
                    >
                      Recargar gastos fijos
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ✅ BLOQUE SEO */}
          <section className="mt-12 border-t border-black/10 pt-8 space-y-3 text-sm text-black/70">
            <h2 className="text-lg font-semibold text-black">
              Ajustes de presupuesto y objetivo de ahorro
            </h2>
            <p>
              En esta sección puedes definir tu ingreso mensual, tu objetivo de ahorro y los presupuestos máximos por
              categoría del método Kakebo. Esto te permite controlar el gasto y medir la evolución de tus hábitos mes a
              mes.
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
