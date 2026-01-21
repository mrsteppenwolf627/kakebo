"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import Link from "next/link";
import SpendingChart from "@/components/SpendingChart";

const KAKEBO_CATEGORIES = {
  supervivencia: { label: "Supervivencia", color: "#dc2626" },
  opcional: { label: "Opcional", color: "#2563eb" },
  cultura: { label: "Cultura", color: "#16a34a" },
  extra: { label: "Extra", color: "#9333ea" },
} as const;

type CategoryKey = keyof typeof KAKEBO_CATEGORIES;

type ExpenseRow = {
  id: string;
  user_id: string;
  month_id: string | null;
  date: string; // yyyy-mm-dd
  amount: number;
  category: string;
  note: string | null;
  color: string | null;
  created_at: string;
};

type MonthRow = {
  id: string;
  user_id: string;
  year: number;
  month: number;
  status: "open" | "closed";
  closed_at: string | null;
};

type UserSettingsRow = {
  user_id: string;
  monthly_income: number | null;
  monthly_saving_goal: number | null;
  budget_supervivencia: number | null;
  budget_opcional: number | null;
  budget_cultura: number | null;
  budget_extra: number | null;
};

export default function ExpenseCalendar({
  year,
  month,
}: {
  year: number;
  month: number;
}) {
  const supabase = createClient();

  const [rows, setRows] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [monthRow, setMonthRow] = useState<MonthRow | null>(null);
  const [closing, setClosing] = useState(false);

  const [settings, setSettings] = useState<UserSettingsRow | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

  const ym = useMemo(
    () => `${year}-${String(month).padStart(2, "0")}`,
    [year, month]
  );

  const total = useMemo(
    () => rows.reduce((acc, r) => acc + (Number(r.amount) || 0), 0),
    [rows]
  );

  const totalsByCategory = useMemo(() => {
    const base: Record<CategoryKey, number> = {
      supervivencia: 0,
      opcional: 0,
      cultura: 0,
      extra: 0,
    };

    for (const r of rows) {
      const key = r.category as CategoryKey;
      if (key in base) base[key] += Number(r.amount) || 0;
    }

    return base;
  }, [rows]);

  const income = Number(settings?.monthly_income ?? 0);
  const savingGoal = Number(settings?.monthly_saving_goal ?? 0);
  const available = income > 0 ? income - total : 0;

  function money(n: number) {
    return (Number(n) || 0).toFixed(2);
  }

  async function getUserId() {
    const { data: sessionRes, error } = await supabase.auth.getSession();
    if (error) throw error;
    const session = sessionRes.session;
    if (!session?.user) throw new Error("Auth session missing!");
    return session.user.id;
  }

  async function loadSettings(userId: string) {
    setSettingsLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_settings")
        .select(
          "user_id,monthly_income,monthly_saving_goal,budget_supervivencia,budget_opcional,budget_cultura,budget_extra"
        )
        .eq("user_id", userId)
        .limit(1);

      if (error) throw error;

      setSettings(((data?.[0] as UserSettingsRow) ?? null) as UserSettingsRow | null);
    } catch {
      setSettings(null);
    } finally {
      setSettingsLoading(false);
    }
  }

  async function getMonth(userId: string) {
    const { data: months, error: mErr } = await supabase
      .from("months")
      .select("id,user_id,year,month,status,closed_at")
      .eq("user_id", userId)
      .eq("year", year)
      .eq("month", month)
      .limit(1);

    if (mErr) throw mErr;
    return (months?.[0] as MonthRow | undefined) ?? null;
  }

  async function createMonth(userId: string) {
    const { data: created, error } = await supabase
      .from("months")
      .insert({
        user_id: userId,
        year,
        month,
        status: "open",
      })
      .select("id,user_id,year,month,status,closed_at")
      .single();

    if (error) throw error;
    return created as MonthRow;
  }

  async function load() {
    setLoading(true);
    setErr(null);

    try {
      const userId = await getUserId();

      // Settings (no bloquea si no existe)
      loadSettings(userId);

      // Mes
      const m = await getMonth(userId);
      setMonthRow(m);

      // Si existe el mes, cargamos por month_id (lo correcto)
      if (m?.id) {
        const { data, error } = await supabase
          .from("expenses")
          .select("id,user_id,month_id,date,amount,category,note,color,created_at")
          .eq("user_id", userId)
          .eq("month_id", m.id)
          .order("date", { ascending: false });

        if (error) throw error;
        setRows((data as ExpenseRow[]) ?? []);
        return;
      }

      // Fallback por fecha (por si el mes no existe todavía)
      const fromDate = `${ym}-01`;
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      const toDate = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

      const { data, error } = await supabase
        .from("expenses")
        .select("id,user_id,month_id,date,amount,category,note,color,created_at")
        .eq("user_id", userId)
        .gte("date", fromDate)
        .lt("date", toDate)
        .order("date", { ascending: false });

      if (error) throw error;

      setRows((data as ExpenseRow[]) ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Error cargando gastos");
    } finally {
      setLoading(false);
    }
  }

  async function removeExpense(expenseId: string) {
    setErr(null);
    setDeletingId(expenseId);

    const prev = rows;
    setRows((r) => r.filter((x) => x.id !== expenseId));

    try {
      const userId = await getUserId();

      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", expenseId)
        .eq("user_id", userId);

      if (error) throw error;
    } catch (e: any) {
      setRows(prev);
      setErr(e?.message ?? "Error eliminando gasto");
    } finally {
      setDeletingId(null);
    }
  }

  async function closeMonth() {
    setErr(null);
    setClosing(true);

    try {
      const userId = await getUserId();

      let m = await getMonth(userId);
      if (!m) m = await createMonth(userId);

      if (m.status === "closed") return;

      const ok = window.confirm(
        `Vas a CERRAR el mes ${ym}. No podrás añadir gastos en este mes.\n\n¿Continuar?`
      );
      if (!ok) return;

      const { error } = await supabase
        .from("months")
        .update({ status: "closed", closed_at: new Date().toISOString() })
        .eq("id", m.id)
        .eq("user_id", userId);

      if (error) throw error;

      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Error cerrando mes");
    } finally {
      setClosing(false);
    }
  }

  async function reopenMonth() {
    setErr(null);
    setClosing(true);

    try {
      const userId = await getUserId();

      const m = await getMonth(userId);
      if (!m) {
        setErr("No existe registro de mes para reabrir.");
        return;
      }

      if (m.status === "open") return;

      const ok = window.confirm(
        `Vas a REABRIR el mes ${ym}. Podrás volver a añadir gastos.\n\n¿Continuar?`
      );
      if (!ok) return;

      const { error } = await supabase
        .from("months")
        .update({ status: "open", closed_at: null })
        .eq("id", m.id)
        .eq("user_id", userId);

      if (error) throw error;

      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Error reabriendo mes");
    } finally {
      setClosing(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ym]);

  const isClosed = monthRow?.status === "closed";
  const monthStatusLabel = monthRow?.status
    ? `estado: ${monthRow.status}`
    : "sin registro de mes aún";

  function budgetFor(key: CategoryKey) {
    if (!settings) return null;

    const field =
      key === "supervivencia"
        ? settings.budget_supervivencia
        : key === "opcional"
        ? settings.budget_opcional
        : key === "cultura"
        ? settings.budget_cultura
        : settings.budget_extra;

    return field == null ? null : Number(field);
  }

  const chartCategories = useMemo(() => {
    return (Object.keys(KAKEBO_CATEGORIES) as CategoryKey[]).map((key) => ({
      key,
      label: KAKEBO_CATEGORIES[key].label,
      color: KAKEBO_CATEGORIES[key].color,
    }));
  }, []);

  return (
    <div className="space-y-4">
      <div className="border border-black/10 p-4 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm text-black/60">
              Mes: {ym} <span className="ml-2">({monthStatusLabel})</span>
            </div>
            <div className="text-sm text-black/60">Gastos del mes: {rows.length}</div>
            <div className="text-sm text-black/60">Total del mes: {money(total)} €</div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className="border border-black px-3 py-2 text-sm hover:bg-black hover:text-white"
            >
              Recargar
            </button>

            {isClosed ? (
              <button
                onClick={reopenMonth}
                disabled={closing}
                className="border border-black px-3 py-2 text-sm hover:bg-black hover:text-white disabled:opacity-50"
                title="Reabrir mes"
              >
                {closing ? "Reabriendo…" : "Reabrir mes"}
              </button>
            ) : (
              <button
                onClick={closeMonth}
                disabled={closing}
                className="border border-black px-3 py-2 text-sm hover:bg-black hover:text-white disabled:opacity-50"
                title="Cerrar mes"
              >
                {closing ? "Cerrando…" : "Cerrar mes"}
              </button>
            )}
          </div>
        </div>

        {/* Bloque “finanzas del mes” */}
        <div className="border border-black/10 p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-black/60">Ingreso mensual (settings)</span>
            <span className="font-semibold">
              {settingsLoading ? "…" : income > 0 ? `${money(income)} €` : "No configurado"}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-black/60">Disponible (ingreso - gastos)</span>
            <span className="font-semibold">
              {income > 0 ? `${money(available)} €` : "—"}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-black/60">Objetivo ahorro</span>
            <span className="font-semibold">
              {savingGoal > 0 ? `${money(savingGoal)} €` : "No configurado"}
            </span>
          </div>

          {income <= 0 && (
            <div className="text-xs text-black/60">
              Configura ingreso/objetivo en{" "}
              <Link href="/settings" className="underline">
                Ajustes
              </Link>{" "}
              para ver el “Disponible” y el progreso de ahorro.
            </div>
          )}
        </div>

        {/* Resumen por categorías + presupuestos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(Object.keys(KAKEBO_CATEGORIES) as CategoryKey[]).map((key) => {
            const cat = KAKEBO_CATEGORIES[key];
            const spent = totalsByCategory[key];
            const pct = total > 0 ? (spent / total) * 100 : 0;

            const budget = budgetFor(key);
            const remaining = budget != null ? budget - spent : null;
            const over = remaining != null ? remaining < 0 : false;

            return (
              <div
                key={key}
                className="border border-black/10 p-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: cat.color }}
                    title={cat.label}
                  />
                  <div>
                    <div className="text-sm font-medium">{cat.label}</div>
                    <div className="text-xs text-black/60">
                      {pct.toFixed(0)}% del mes
                      {budget != null ? ` · Presupuesto: ${money(budget)} €` : ""}
                    </div>
                    {budget != null && (
                      <div className={`text-xs ${over ? "text-red-600" : "text-black/60"}`}>
                        {over
                          ? `Te pasas por ${money(Math.abs(remaining!))} €`
                          : `Te quedan ${money(remaining!)} €`}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-semibold">{money(spent)} €</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Gráfico (barras / queso) */}
        <SpendingChart
          title="Gasto por categoría"
          totals={totalsByCategory}
          categories={chartCategories}
        />
      </div>

      {err && <div className="text-sm text-red-600">{err}</div>}
      {loading && <div className="text-sm text-black/60">Cargando...</div>}

      <div className="border border-black/10 p-4">
        <div className="font-semibold mb-2">Lista de gastos</div>

        {rows.length === 0 && (
          <div className="text-sm text-black/60">Aún no hay gastos en este mes.</div>
        )}

        {rows.length > 0 && (
          <ul className="space-y-2">
            {rows.map((r) => {
              const cat = KAKEBO_CATEGORIES[r.category as CategoryKey] ?? null;

              return (
                <li key={r.id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-3">
                    {cat && (
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                        title={cat.label}
                      />
                    )}

                    <div className="flex flex-col">
                      <span className="font-medium">{r.note ?? "(sin concepto)"}</span>
                      <span className="text-black/60">
                        {r.date} · {cat?.label ?? r.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="font-semibold">{money(Number(r.amount))} €</div>

                    <button
                      onClick={() => {
                        const ok = window.confirm(
                          "¿Eliminar este gasto? Esta acción no se puede deshacer."
                        );
                        if (ok) removeExpense(r.id);
                      }}
                      disabled={deletingId === r.id}
                      className="border border-black px-2 py-1 text-xs hover:bg-black hover:text-white disabled:opacity-50"
                    >
                      {deletingId === r.id ? "…" : "Eliminar"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
