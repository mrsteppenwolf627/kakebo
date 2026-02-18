"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { canUsePremium, Profile } from "@/lib/auth/access-control";
import { Link } from "@/i18n/routing";
import SpendingChart from "@/components/SpendingChart";
import { useTranslations } from "next-intl";

const KAKEBO_CATEGORIES = {
  supervivencia: { label: "Supervivencia", color: "#fca5a5" }, // Red-300 (Pastel)
  opcional: { label: "Opcional", color: "#93c5fd" },      // Blue-300 (Pastel)
  cultura: { label: "Cultura", color: "#86efac" },        // Green-300 (Pastel)
  extra: { label: "Extra", color: "#d8b4fe" },            // Purple-300 (Pastel)
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
  const t = useTranslations("Dashboard.ExpenseCalendar");
  const supabase = createClient();

  const [rows, setRows] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [monthRow, setMonthRow] = useState<MonthRow | null>(null);
  const [closing, setClosing] = useState(false);

  // Auth & Premium Logic
  const [profile, setProfile] = useState<Profile | null>(null);

  const [settings, setSettings] = useState<UserSettingsRow | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

  // total gastos fijos aplicables al mes (ym)
  const [fixedTotal, setFixedTotal] = useState(0);
  const [fetchedIncome, setFetchedIncome] = useState(0);

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

  // Sum both sources of income to avoid confusing users who have a base salary in settings
  // and just added an extra income.
  const settingsIncome = Number(settings?.monthly_income ?? 0);
  const income = settingsIncome + fetchedIncome;

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

  async function loadProfile(userId: string) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (data) setProfile(data as Profile);
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

  async function loadIncomes(userId: string) {
    // Calculamos rango de fechas para el mes actual (ym)
    const [y, m] = ym.split("-").map(Number);
    const startDate = `${ym}-01`;
    // Mes siguiente para limite superior
    const nextYm = m === 12
      ? `${y + 1}-01`
      : `${y}-${String(m + 1).padStart(2, "0")}`;
    const endDate = `${nextYm}-01`;

    const { data: incomeData, error: incomeErr } = await supabase
      .from("incomes")
      .select("amount")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lt("date", endDate);

    if (incomeErr) throw incomeErr;

    const totalInc = (incomeData || []).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    setFetchedIncome(totalInc);
  }

  async function load() {
    setLoading(true);
    setErr(null);

    try {
      const userId = await getUserId();

      // ✅ importante: esperamos settings y fijos antes del render “correcto”
      await Promise.all([
        loadSettings(userId),
        loadFixedTotal(userId),
        loadIncomes(userId),
        loadProfile(userId)
      ]);

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

  useEffect(() => {
    const handler = () => load();
    window.addEventListener("kakebo:incomes-changed", handler);
    // Also listen to expenses-changed just in case we missed it earlier
    window.addEventListener("kakebo:expenses-changed", handler);
    return () => {
      window.removeEventListener("kakebo:incomes-changed", handler);
      window.removeEventListener("kakebo:expenses-changed", handler);
    };
  }, [ym]); // Re-bind if ym changes, though load uses current ym

  const isClosed = monthRow?.status === "closed";
  const monthStatusLabel = monthRow?.status
    ? (monthRow.status === "closed" ? t("status.closed") : t("status.open"))
    : t("status.unknown");

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
      label: t(`categories.${key}`), // Translating labels for chart
      color: KAKEBO_CATEGORIES[key].color,
    }));
  }, [t]);

  // Check if viewing past month and user is not premium
  const isLocked = useMemo(() => {
    if (!profile) return false; // Loading or error, let's show data or wait

    const now = new Date();
    const currentYm = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;

    // Si estamos viendo un mes pasado (lexicográficamente menor)
    if (ym < currentYm) {
      // Y no tenemos premium
      if (!canUsePremium(profile)) {
        return true;
      }
    }
    return false;
  }, [ym, profile]);

  return (
    <div className="space-y-6">
      <div className="border border-border rounded-lg p-6 sm:p-8 space-y-6 bg-card/90 backdrop-blur-sm shadow-sm transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="text-sm text-muted-foreground font-light mb-2">
              <span className="font-mono text-base text-foreground">{ym}</span>
              <span className="ml-3 text-xs opacity-70">({monthStatusLabel})</span>
            </div>

            {isClosed && (
              <div className="mt-2 text-xs text-muted-foreground bg-muted border border-border rounded-md p-2 inline-block">
                {t("status.closedMsg")}
              </div>
            )}

            <div className="text-sm text-muted-foreground font-light mt-2">
              {t("stats.expenses")} <span className="font-mono text-foreground font-medium">{rows.length}</span>
              <span className="mx-2 text-border">·</span>
              {t("stats.total")} <span className="font-mono text-foreground font-medium">{money(total)} €</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={load}
              className="border border-border bg-card rounded-md px-4 py-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
            >
              {t("actions.update")}
            </button>

            {isClosed ? (
              <button
                onClick={reopenMonth}
                disabled={closing}
                className="border border-border bg-card rounded-md px-4 py-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 disabled:opacity-50 transition-colors"
                title={t("actions.reopen")}
              >
                {closing ? "…" : t("actions.reopen")}
              </button>
            ) : (
              <button
                onClick={closeMonth}
                disabled={closing}
                className="border border-stone-800 bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 rounded-md px-4 py-2 text-xs sm:text-sm hover:opacity-90 disabled:opacity-50 transition-colors shadow-sm"
                title={t("actions.close")}
              >
                {closing ? "…" : t("actions.close")}
              </button>
            )}
          </div>
        </div>

        {/* Finanzas del mes */}
        <div className="border border-border rounded-lg p-5 sm:p-6 space-y-3 bg-muted/30">
          <div className="flex items-center justify-between text-sm gap-2">
            <span className="text-muted-foreground font-light">{t("summary.income")}</span>
            <span className="font-mono text-foreground">
              {settingsLoading ? "…" : income > 0 ? `${money(income)} €` : "—"}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm gap-2">
            <span className="text-muted-foreground font-light">{t("summary.fixed")}</span>
            <span className="font-mono text-foreground">{income > 0 ? `${money(fixedTotal)} €` : "—"}</span>
          </div>

          <div className="flex items-center justify-between text-sm gap-2">
            <span className="text-muted-foreground font-light">{t("summary.usable")}</span>
            <span
              className={`font-mono ${income > 0 && availableForCategories < 0 ? "text-destructive" : "text-foreground"
                }`}
            >
              {income > 0 ? `${money(availableForCategories)} €` : "—"}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm gap-2">
            <span className="text-muted-foreground font-light">{t("summary.available")}</span>
            <span
              className={`font-mono ${income > 0 && availableAfterExpenses < 0 ? "text-destructive" : "text-foreground"
                }`}
            >
              {income > 0 ? `${money(availableAfterExpenses)} €` : "—"}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm gap-2 border-t border-border pt-3">
            <span className="text-muted-foreground font-light">{t("summary.savingGoal")}</span>
            <span className="font-mono text-foreground">
              {savingGoal > 0 ? `${money(savingGoal)} €` : "—"}
            </span>
          </div>

          {income > 0 && savingGoal > 0 ? (
            <div className="pt-2">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground text-xs">{t("summary.savingProgress")}</span>
                <span className="font-medium text-foreground text-xs">{savingPct}%</span>
              </div>

              <div className="mt-1 h-2.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${savingProgress >= 1 ? "bg-green-500" : "bg-stone-800 dark:bg-stone-500"
                    }`}
                  style={{ width: `${savingPct}%` }}
                />
              </div>

              <div className="mt-2 text-xs text-muted-foreground">
                {t("summary.saved")} <span className="font-medium text-foreground">{money(Math.max(0, savedSoFar))} €</span>{" "}
                / {t("summary.goal")} <span className="font-medium text-foreground">{money(savingGoal)} €</span>
                {savingProgress >= 1 ? (
                  <span className="ml-2 text-green-600 dark:text-green-400 font-medium">{t("summary.achieved")}</span>
                ) : (
                  <span className="ml-2">
                    {t("summary.missing", { amount: money(remainingToGoal) })}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground pt-2">
              {t.rich("summary.noConfig", {
                settingsLink: (chunks: any) => <Link href="/app/settings" className="underline hover:text-foreground">{chunks}</Link>
              })}
            </div>
          )}
        </div>

        {/* Resumen por categorías + presupuestos + barras */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div key={key} className="border border-border bg-card p-4 rounded-lg shadow-sm flex flex-col gap-3 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full ring-1 ring-inset ring-black/5 dark:ring-white/10"
                      style={{ backgroundColor: cat.color }}
                    />
                    <div className="font-medium text-foreground text-sm">{t(`categories.${key}`)}</div>
                  </div>
                  <div className="text-sm font-semibold font-mono text-foreground">{money(spent)} €</div>
                </div>

                <div className="text-xs text-muted-foreground flex items-center justify-between">
                  <span>{t("categories.percentTotal", { percent: pct.toFixed(0) })}</span>
                  {budget != null ? (
                    <span className={over ? "text-destructive font-medium" : ""}>
                      {t("categories.budget", { amount: money(budget) })} {remaining != null ? `· ${t("categories.remaining", { amount: money(remaining) })}` : ""}
                    </span>
                  ) : (
                    <span>{t("categories.noBudget")}</span>
                  )}
                </div>

                {budget != null && budget > 0 ? (
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${over ? "bg-destructive" : "bg-stone-800 dark:bg-stone-500"}`}
                      style={{ width: `${barPct}%`, backgroundColor: over ? undefined : cat.color }}
                    />
                  </div>
                ) : (
                  <div className="h-1.5 w-full rounded-full bg-muted" />
                )}
              </div>
            );
          })}
        </div>

        {/* Chart */}
        <div className="border border-border p-6 rounded-lg bg-card shadow-sm relative overflow-hidden">
          {isLocked && (
            <div className="absolute inset-0 z-10 bg-white/60 dark:bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
              <p className="text-lg font-bold text-foreground mb-2">{t("locked.title")}</p>
              <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                {t("locked.desc")}
              </p>
              <Link
                href="/pricing"
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
              >
                {t("locked.unlock")}
              </Link>
            </div>
          )}
          <div className="font-medium text-foreground mb-4">Distribución por categorías</div>
          <SpendingChart
            title="Gasto por categoría"
            categories={chartCategories}
            totals={totalsByCategory}
          />
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex gap-2 w-full sm:w-auto">
            <Link
              href={`/app/new?ym=${ym}`}
              className={`flex-1 sm:flex-none border border-stone-900 bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 px-5 py-2.5 text-sm font-medium text-center rounded-md hover:opacity-90 transition-colors shadow-sm ${isClosed ? "pointer-events-none opacity-50" : ""
                }`}
              title={isClosed ? t("status.closedMsg") : t("actions.addExpense")}
            >
              {t("actions.addExpense")}
            </Link>
            <Link
              href={`/app/new-income?ym=${ym}`}
              className={`flex-1 sm:flex-none border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-foreground px-5 py-2.5 text-sm font-medium text-center rounded-md hover:bg-muted transition-colors shadow-sm ${isClosed ? "pointer-events-none opacity-50" : ""
                }`}
              title={isClosed ? t("status.closedMsg") : t("actions.addIncome")}
            >
              {t("actions.addIncome")}
            </Link>
          </div>

          <Link href={`/app/history/${ym}`} className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 text-center sm:text-right decoration-border transition-colors">
            {t("actions.history")}
          </Link>
        </div>

        {err && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">{err}</div>}
        {loading && <div className="text-sm text-muted-foreground animate-pulse">Cargando datos del mes...</div>}

        {/* Lista */}
        <div className="border border-border p-4 sm:p-6 rounded-lg bg-card shadow-sm relative overflow-hidden">
          {isLocked && (
            <div className="absolute inset-0 z-10 bg-white/60 dark:bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center select-none">
              <span className="text-2xl mb-2">🔒</span>
              <p className="font-semibold">{t("locked.premium")}</p>
            </div>
          )}

          <div className="font-medium text-foreground mb-4 text-sm sm:text-base">{t("list.title")}</div>

          {rows.length === 0 && !loading && (
            <div className="text-sm text-muted-foreground italic py-4 text-center">{t("list.empty")}</div>
          )}

          {rows.length > 0 && (
            <ul className="divide-y divide-border">
              {rows.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 text-sm py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-foreground truncate">{r.note || t("list.noConcept")}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {r.date} · <span style={{ color: (KAKEBO_CATEGORIES as any)[r.category]?.color }}>{t(`categories.${r.category}`)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="font-semibold text-foreground font-mono">{money(Number(r.amount))} €</div>

                    <button
                      onClick={() => removeExpense(r.id)}
                      disabled={isClosed || deletingId === r.id || isLocked}
                      className="text-muted-foreground hover:text-destructive disabled:opacity-30 transition-colors p-1"
                      title={isClosed ? t("status.closedMsg") : "Eliminar"}
                    >
                      {deletingId === r.id ? "…" : "✕"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ✅ BLOQUE SEO - Internal hidden description */}
        <section className="mt-12 border-t border-border pt-8 space-y-3 text-sm text-muted-foreground">
          <h2 className="text-base font-semibold text-foreground">Control mensual con Kakebo</h2>
          <p>
            Este panel muestra tu resumen del mes con el método Kakebo: gasto total, desglose por
            categorías, presupuestos y progreso hacia el objetivo de ahorro.
          </p>
          <div className="text-xs opacity-50">
            (Hueco SEO: texto sobre “control de gastos mensual”, “kakebo”, “presupuesto por
            categorías”, etc.)
          </div>
        </section>
      </div>
    </div>
  );
}
