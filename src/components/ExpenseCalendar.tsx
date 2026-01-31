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

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

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

  // total gastos fijos aplicables al mes (ym)
  const [fixedTotal, setFixedTotal] = useState(0);

  const ym = useMemo(() => `${year}-${pad2(month)}`, [year, month]);

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

  // ✅ disponible real para gastar este mes = ingreso - gastos fijos
  const disposableIncome = useMemo(() => {
    if (!Number.isFinite(income) || income <= 0) return 0;
    return Math.max(0, income - (Number(fixedTotal) || 0));
  }, [income, fixedTotal]);

  // ✅ utilizable para categorías (plan del mes):
  // ingreso - gastos fijos - objetivo de ahorro
  // (puede ser negativo si el objetivo de ahorro es mayor que lo que queda tras fijos)
  const availableForCategories = useMemo(() => {
    if (!Number.isFinite(income) || income === 0) return 0;
    return (
      income - (Number(fixedTotal) || 0) - (Number(savingGoal) || 0)
    );
  }, [income, fixedTotal, savingGoal]);

  // ✅ disponible tras gastos variables del mes (puede ser negativo si has gastado de más)
  const availableAfterExpenses = useMemo(() => {
    return availableForCategories - total;
  }, [availableForCategories, total]);

  // ✅ ahorrado “de momento” frente a objetivo (lo que sobra tras fijos y gastos)
  const savedSoFar = useMemo(() => {
    if (disposableIncome <= 0) return 0;
    return disposableIncome - total;
  }, [disposableIncome, total]);

  const savingProgress = useMemo(() => {
    if (savingGoal <= 0) return 0;
    const p = savedSoFar / savingGoal;
    if (Number.isNaN(p) || !Number.isFinite(p)) return 0;
    return Math.max(0, Math.min(1, p));
  }, [savedSoFar, savingGoal]);

  const savingPct = Math.round(savingProgress * 100);

  const remainingToGoal = useMemo(() => {
    if (savingGoal <= 0) return 0;
    return Math.max(0, savingGoal - Math.max(0, savedSoFar));
  }, [savingGoal, savedSoFar]);

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

      setSettings(
        ((data?.[0] as UserSettingsRow) ?? null) as UserSettingsRow | null
      );
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

  async function loadFixedTotal(userId: string) {
    const { data: fixedData, error: fixedErr } = await supabase
      .from("fixed_expenses")
      .select("amount,start_ym,end_ym,active")
      .eq("user_id", userId)
      .eq("active", true);

    if (fixedErr) throw fixedErr;

    const fixedTotalForYm = (fixedData ?? []).reduce((acc, r: any) => {
      // ym es YYYY-MM, comparación lexicográfica funciona
      const startOk = typeof r.start_ym === "string" && r.start_ym <= ym;
      const endOk =
        !r.end_ym || (typeof r.end_ym === "string" && r.end_ym >= ym);
      return startOk && endOk ? acc + (Number(r.amount) || 0) : acc;
    }, 0);

    setFixedTotal(fixedTotalForYm);
  }

  async function load() {
    setLoading(true);
    setErr(null);

    try {
      const userId = await getUserId();

      // ✅ importante: esperamos settings y fijos antes del render “correcto”
      await Promise.all([loadSettings(userId), loadFixedTotal(userId)]);

      const m = await getMonth(userId);
      setMonthRow(m);

      if (m?.id) {
        const { data, error } = await supabase
          .from("expenses")
          .select("id,user_id,month_id,date,amount,category,note,color")
          .eq("user_id", userId)
          .eq("month_id", m.id)
          .order("date", { ascending: false });

        if (error) throw error;
        setRows((data as ExpenseRow[]) ?? []);
        return;
      }

      const fromDate = `${ym}-01`;
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      const toDate = `${nextYear}-${pad2(nextMonth)}-01`;

      const { data, error } = await supabase
        .from("expenses")
        .select("id,user_id,month_id,date,amount,category,note,color")
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
    if (monthRow?.status === "closed") {
      setErr("Mes cerrado: no se pueden eliminar gastos.");
      return;
    }

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
        `Vas a CERRAR el mes ${ym}. No podrás añadir ni eliminar gastos en este mes.\n\n¿Continuar?`
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
        `Vas a REABRIR el mes ${ym}. Podrás volver a añadir y eliminar gastos.\n\n¿Continuar?`
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
      <div className="border border-black/10 p-3 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <div className="text-sm text-black/60">
              Mes: {ym} <span className="ml-2">({monthStatusLabel})</span>
            </div>

            {isClosed && (
              <div className="mt-1 text-xs text-red-600">
                Mes cerrado: no se pueden añadir ni eliminar gastos.
              </div>
            )}

            <div className="text-sm text-black/60">Gastos: {rows.length} · Total: {money(total)} €</div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={load}
              className="border border-black px-3 py-2 text-xs sm:text-sm hover:bg-black hover:text-white"
            >
              Recargar
            </button>

            {isClosed ? (
              <button
                onClick={reopenMonth}
                disabled={closing}
                className="border border-black px-3 py-2 text-xs sm:text-sm hover:bg-black hover:text-white disabled:opacity-50"
                title="Reabrir mes"
              >
                {closing ? "…" : "Reabrir"}
              </button>
            ) : (
              <button
                onClick={closeMonth}
                disabled={closing}
                className="border border-black px-3 py-2 text-xs sm:text-sm hover:bg-black hover:text-white disabled:opacity-50"
                title="Cerrar mes"
              >
                {closing ? "…" : "Cerrar mes"}
              </button>
            )}
          </div>
        </div>

        {/* Finanzas del mes */}
        <div className="border border-black/10 p-3 sm:p-4 space-y-2 sm:space-y-3 rounded-lg">
          <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
            <span className="text-black/60">Ingreso mensual</span>
            <span className="font-semibold">
              {settingsLoading ? "…" : income > 0 ? `${money(income)} €` : "—"}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
            <span className="text-black/60">Gastos fijos</span>
            <span className="font-semibold">{income > 0 ? `${money(fixedTotal)} €` : "—"}</span>
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
            <span className="text-black/60">Utilizable</span>
            <span
              className={`font-semibold ${
                income > 0 && availableForCategories < 0 ? "text-red-600" : ""
              }`}
            >
              {income > 0 ? `${money(availableForCategories)} €` : "—"}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
            <span className="text-black/60">Disponible</span>
            <span
              className={`font-semibold ${
                income > 0 && availableAfterExpenses < 0 ? "text-red-600" : ""
              }`}
            >
              {income > 0 ? `${money(availableAfterExpenses)} €` : "—"}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
            <span className="text-black/60">Objetivo ahorro</span>
            <span className="font-semibold">
              {savingGoal > 0 ? `${money(savingGoal)} €` : "—"}
            </span>
          </div>

          {income > 0 && savingGoal > 0 ? (
            <div className="pt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-black/60">Progreso de ahorro</span>
                <span className="font-semibold">{savingPct}%</span>
              </div>

              <div className="mt-2 h-3 w-full rounded-full bg-black/10 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all ${
                    savingProgress >= 1 ? "bg-green-600" : "bg-black"
                  }`}
                  style={{ width: `${savingPct}%` }}
                />
              </div>

              <div className="mt-2 text-xs text-black/60">
                Ahorrado: <span className="font-semibold">{money(Math.max(0, savedSoFar))} €</span>{" "}
                / Objetivo: <span className="font-semibold">{money(savingGoal)} €</span>
                {savingProgress >= 1 ? (
                  <span className="ml-2 text-green-700 font-semibold">Objetivo conseguido</span>
                ) : (
                  <span className="ml-2">
                    Te faltan <span className="font-semibold">{money(remainingToGoal)} €</span>
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="text-xs text-black/60">
              Configura ingreso y objetivo en{" "}
              <Link href="/app/settings" className="underline">
                Ajustes
              </Link>{" "}
              para ver el progreso de ahorro.
            </div>
          )}
        </div>

        {/* Resumen por categorías + presupuestos + barras */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(Object.keys(KAKEBO_CATEGORIES) as CategoryKey[]).map((key) => {
            const cat = KAKEBO_CATEGORIES[key];
            const spent = totalsByCategory[key];
            const pct = total > 0 ? (spent / total) * 100 : 0;

            const budget = budgetFor(key);
            const remaining = budget != null ? budget - spent : null;
            const over = remaining != null ? remaining < 0 : false;

            const barPct =
              budget != null && budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;

            return (
              <div key={key} className="border border-black/10 p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <div className="font-semibold text-sm">{cat.label}</div>
                  </div>
                  <div className="text-sm font-semibold">{money(spent)} €</div>
                </div>

                <div className="text-xs text-black/60 flex items-center justify-between">
                  <span>Del total: {pct.toFixed(0)}%</span>
                  {budget != null ? (
                    <span className={over ? "text-red-600 font-semibold" : ""}>
                      Presupuesto: {money(budget)} € {remaining != null ? `· Restan ${money(remaining)} €` : ""}
                    </span>
                  ) : (
                    <span>Presupuesto: —</span>
                  )}
                </div>

                {budget != null && budget > 0 ? (
                  <div className="h-2 w-full rounded-full bg-black/10 overflow-hidden">
                    <div
                      className={`h-2 rounded-full ${over ? "bg-red-600" : "bg-black"}`}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                ) : (
                  <div className="h-2 w-full rounded-full bg-black/5" />
                )}
              </div>
            );
          })}
        </div>

        {/* Chart */}
        <div className="border border-black/10 p-4 rounded-lg">
          <div className="font-semibold mb-2">Distribución por categorías</div>
          <SpendingChart
  title="Gasto por categoría"
  categories={chartCategories}
  totals={totalsByCategory}
/>

        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          <Link
            href={`/app/new?ym=${ym}`}
            className={`border border-black px-3 py-2 text-sm text-center hover:bg-black hover:text-white ${
              isClosed ? "pointer-events-none opacity-50" : ""
            }`}
            title={isClosed ? "Mes cerrado" : "Añadir gasto"}
          >
            + Nuevo gasto
          </Link>

          <Link href={`/app/history/${ym}`} className="text-sm underline text-center sm:text-right">
            Ver histórico
          </Link>
        </div>

        {err && <div className="text-sm text-red-600">{err}</div>}
        {loading && <div className="text-sm text-black/60">Cargando…</div>}

        {/* Lista */}
        <div className="border border-black/10 p-3 sm:p-4 rounded-lg">
          <div className="font-semibold mb-2 text-sm sm:text-base">Últimos gastos</div>

          {rows.length === 0 && !loading && (
            <div className="text-sm text-black/60">No hay gastos todavía.</div>
          )}

          {rows.length > 0 && (
            <ul className="space-y-2">
              {rows.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 text-sm border-b border-black/10 pb-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate text-sm">{r.note || "Sin concepto"}</div>
                    <div className="text-xs text-black/60">
                      {r.date} · {(KAKEBO_CATEGORIES as any)[r.category]?.label ?? r.category}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <div className="font-semibold text-sm">{money(Number(r.amount))} €</div>

                    <button
                      onClick={() => removeExpense(r.id)}
                      disabled={isClosed || deletingId === r.id}
                      className="border border-black px-2 py-1 text-xs hover:bg-black hover:text-white disabled:opacity-50 shrink-0"
                      title={isClosed ? "Mes cerrado" : "Eliminar"}
                    >
                      {deletingId === r.id ? "…" : "✕"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ✅ BLOQUE SEO */}
        <section className="mt-10 border-t border-black/10 pt-8 space-y-3 text-sm text-black/70">
          <h2 className="text-lg font-semibold text-black">Control mensual con Kakebo</h2>
          <p>
            Este panel muestra tu resumen del mes con el método Kakebo: gasto total, desglose por
            categorías, presupuestos y progreso hacia el objetivo de ahorro.
          </p>
          <div className="text-xs text-black/50">
            (Hueco SEO: texto sobre “control de gastos mensual”, “kakebo”, “presupuesto por
            categorías”, etc.)
          </div>
        </section>
      </div>
    </div>
  );
}
