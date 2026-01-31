"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

type Props = {
  year: number;
  month: number;
  ym: string; // YYYY-MM
};

type UserSettingsRow = {
  monthly_income: number | null;
  monthly_saving_goal: number | null;
  current_balance: number | null;
};

type FixedExpenseRow = {
  id: string;
  amount: number;
  active: boolean;
  start_ym: string;
  end_ym: string | null;
  due_day: number | null;
};

function num(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function money(n: number) {
  return num(n).toFixed(2);
}

function isYm(s: string) {
  return /^\d{4}-\d{2}$/.test(s);
}

function compareYm(a: string, b: string) {
  return a.localeCompare(b);
}

function todayYm() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function monthRangeFromYm(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const start = `${ym}-01`;

  // último día real del mes (evita el famoso 2026-02-31)
  const lastDay = new Date(y, m, 0).getDate(); // m aquí es 1..12, y Date usa "día 0" del mes siguiente
  const end = `${ym}-${String(lastDay).padStart(2, "0")}`;

  return { y, m, start, end };
}

export default function DashboardMoneyPanel({ ym }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [income, setIncome] = useState(0);
  const [savingGoal, setSavingGoal] = useState(0);
  const [currentBalance, setCurrentBalance] = useState<number | null>(null);

  const [fixedRows, setFixedRows] = useState<FixedExpenseRow[]>([]);
  const [savingsDone, setSavingsDone] = useState(false);

  // gastos del mes (Kakebo)
  const [monthSpent, setMonthSpent] = useState(0);

  // input UI
  const [balanceInput, setBalanceInput] = useState<string>("");
  const [savingBalance, setSavingBalance] = useState(false);
  const [savingSavingsDone, setSavingSavingsDone] = useState(false);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    setOkMsg(null);

    try {
      if (!isYm(ym)) throw new Error("YM inválido en dashboard.");

      const { data: sessionRes, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) throw sessionErr;

      const userId = sessionRes.session?.user?.id;
      if (!userId) throw new Error("Auth session missing");

      const { y, m, start, end } = monthRangeFromYm(ym);

      // 1) settings
      const { data: us, error: usErr } = await supabase
        .from("user_settings")
        .select("monthly_income,monthly_saving_goal,current_balance")
        .eq("user_id", userId)
        .limit(1);

      if (usErr) throw usErr;

      const row = (us?.[0] as UserSettingsRow | undefined) ?? null;

      const mi = num(row?.monthly_income ?? 0);
      const sg = num(row?.monthly_saving_goal ?? 0);
      const cb = row?.current_balance ?? null;

      setIncome(mi);
      setSavingGoal(sg);
      setCurrentBalance(cb);
      setBalanceInput(cb === null ? "" : String(cb));

      // 2) fixed expenses (need due_day)
      const { data: fx, error: fxErr } = await supabase
        .from("fixed_expenses")
        .select("id,amount,active,start_ym,end_ym,due_day")
        .eq("user_id", userId);

      if (fxErr) throw fxErr;
      setFixedRows((fx as FixedExpenseRow[]) ?? []);

      // 3) month savings_done
      const { data: mo, error: moErr } = await supabase
        .from("months")
        .select("savings_done")
        .eq("user_id", userId)
        .eq("year", y)
        .eq("month", m)
        .limit(1);

      if (moErr) throw moErr;

      const done = Boolean(mo?.[0]?.savings_done ?? false);
      setSavingsDone(done);

      // 4) month spent (expenses)
      const { data: ex, error: exErr } = await supabase
        .from("expenses")
        .select("amount")
        .eq("user_id", userId)
        .gte("date", start)
        .lte("date", end);

      if (exErr) throw exErr;

      const spent = (ex ?? []).reduce((acc: number, r: any) => acc + num(r.amount), 0);
      setMonthSpent(spent);
    } catch (e: any) {
      setErr(e?.message ?? "Error cargando panel");
    } finally {
      setLoading(false);
    }
  }, [supabase, ym]);

  // carga inicial + cuando cambia ym
  useEffect(() => {
    load();
  }, [load]);

  // recargar automáticamente cuando cambian gastos
  useEffect(() => {
    const handler = () => load();
    window.addEventListener("kakebo:expenses-changed", handler);
    return () => window.removeEventListener("kakebo:expenses-changed", handler);
  }, [load]);

  const fixedMonthRows = useMemo(() => {
    return fixedRows.filter((r) => {
      if (!r.active) return false;
      if (compareYm(r.start_ym, ym) === 1) return false; // start_ym > ym
      if (r.end_ym && compareYm(r.end_ym, ym) === -1) return false; // end_ym < ym
      return true;
    });
  }, [fixedRows, ym]);

  const fixedTotal = useMemo(() => {
    return fixedMonthRows.reduce((acc, r) => acc + num(r.amount), 0);
  }, [fixedMonthRows]);

  const pendingFixedTotal = useMemo(() => {
    const tYm = todayYm();
    const cmp = compareYm(ym, tYm);
    const todayDay = new Date().getDate();

    if (cmp === -1) return 0; // pasado
    if (cmp === 1) return fixedMonthRows.reduce((acc, r) => acc + num(r.amount), 0); // futuro

    // actual => pendiente según due_day
    return fixedMonthRows.reduce((acc, r) => {
      const due = r.due_day;
      if (!due) return acc + num(r.amount); // sin día => por seguridad pendiente
      return due > todayDay ? acc + num(r.amount) : acc;
    }, 0);
  }, [fixedMonthRows, ym]);

  const availableForCategories = useMemo(() => {
    return income - fixedTotal - savingGoal; // “gastable” antes de gastar
  }, [income, fixedTotal, savingGoal]);

  const availableAfterExpenses = useMemo(() => {
    return availableForCategories - monthSpent; // lo que queda tras gastar en Kakebo
  }, [availableForCategories, monthSpent]);

  const savingsPending = useMemo(() => {
    const cmp = compareYm(ym, todayYm());
    if (cmp === -1) return 0;
    return savingsDone ? 0 : savingGoal;
  }, [savingGoal, savingsDone, ym]);

  const bankMinusReserves = useMemo(() => {
    const cb = currentBalance ?? 0;
    return cb - pendingFixedTotal - savingsPending;
  }, [currentBalance, pendingFixedTotal, savingsPending]);

  const bar = useMemo(() => {
    const categories = Math.max(0, availableForCategories);
    const reserves = Math.max(0, pendingFixedTotal + savingsPending);
    const total = categories + reserves;
    const pctCategories = total <= 0 ? 0 : (categories / total) * 100;
    const pctReserves = total <= 0 ? 0 : (reserves / total) * 100;
    return { categories, reserves, total, pctCategories, pctReserves };
  }, [availableForCategories, pendingFixedTotal, savingsPending]);

  async function saveCurrentBalance() {
    setErr(null);
    setOkMsg(null);

    setSavingBalance(true);
    try {
      const { data: sessionRes } = await supabase.auth.getSession();
      const userId = sessionRes.session?.user?.id;
      if (!userId) throw new Error("Auth session missing");

      const trimmed = balanceInput.trim();
      const next = trimmed === "" ? null : Number(trimmed);
      if (trimmed !== "" && (!Number.isFinite(next) || Number(next) < 0)) {
        throw new Error("Saldo inválido (pon un número o déjalo vacío).");
      }

      const { error } = await supabase
        .from("user_settings")
        .upsert({ user_id: userId, current_balance: next }, { onConflict: "user_id" });

      if (error) throw error;

      setCurrentBalance(next);
      setOkMsg("Saldo guardado.");
    } catch (e: any) {
      setErr(e?.message ?? "Error guardando saldo");
    } finally {
      setSavingBalance(false);
    }
  }

  async function toggleSavingsDone(next: boolean) {
    setErr(null);
    setOkMsg(null);

    setSavingSavingsDone(true);
    try {
      const { data: sessionRes } = await supabase.auth.getSession();
      const userId = sessionRes.session?.user?.id;
      if (!userId) throw new Error("Auth session missing");

      const { y, m } = monthRangeFromYm(ym);

      const { error } = await supabase
        .from("months")
        .upsert({ user_id: userId, year: y, month: m, savings_done: next }, { onConflict: "user_id,year,month" });

      if (error) throw error;

      setSavingsDone(next);
      setOkMsg(next ? "Ahorro marcado como transferido." : "Ahorro marcado como pendiente.");
    } catch (e: any) {
      setErr(e?.message ?? "Error guardando ahorro");
    } finally {
      setSavingSavingsDone(false);
    }
  }

  if (loading) {
    return (
      <section className="border border-black/10 rounded-xl p-4">
        <div className="text-sm text-black/60">Cargando resumen real…</div>
      </section>
    );
  }

  return (
    <section className="border border-black/10 rounded-xl p-3 sm:p-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
        <div>
          <div className="text-xs sm:text-sm text-black/60">Resumen realista</div>
          <div className="text-base sm:text-lg font-semibold">Mes: {ym}</div>
        </div>

        <div className="text-xs text-black/50 sm:max-w-xs">
          Separa "gastable" de "reservado" para no tocar fijos/ahorro.
        </div>
      </div>

      {err && <div className="text-sm text-red-600">{err}</div>}
      {okMsg && <div className="text-sm text-green-700">{okMsg}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="border border-black/10 rounded-xl p-3 sm:p-4">
          <div className="text-xs text-black/60">Disponible categorías</div>
          <div className="text-xl sm:text-2xl font-semibold">{money(availableForCategories)} €</div>
          <div className="text-xs text-black/50 mt-1 sm:mt-2">Ingresos − fijos − ahorro</div>
        </div>

        <div className="border border-black/10 rounded-xl p-3 sm:p-4">
          <div className="text-xs text-black/60">Reservado fijos</div>
          <div className="text-xl sm:text-2xl font-semibold">{money(pendingFixedTotal)} €</div>
          <div className="text-xs text-black/50 mt-1 sm:mt-2">Fijos pendientes del mes</div>
        </div>

        <div className="border border-black/10 rounded-xl p-3 sm:p-4 space-y-3 sm:col-span-2 lg:col-span-1">
          <div>
            <div className="text-xs text-black/60">Disponible real hoy</div>
            <div className="text-xl sm:text-2xl font-semibold">{money(availableAfterExpenses)} €</div>
            <div className="text-xs text-black/50 mt-1 sm:mt-2">Utilizable − gastos del mes</div>
          </div>

          <div className="border-t border-black/10 pt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-black/60">Banco − reservas:</span>
              <span className="font-semibold">{money(bankMinusReserves)} €</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-black/60">Gastos del mes (Kakebo):</span>
              <span className="font-semibold">{money(monthSpent)} €</span>
            </div>
            <div className="text-xs text-black/50">
              (El “banco − reservas” sigue siendo útil para no comerte fijos/ahorro aunque aún no hayan saltado.)
            </div>
          </div>

          <div className="border-t border-black/10 pt-3 space-y-2">
            <label className="text-xs text-black/60 block">Saldo actual del banco (€)</label>
            <div className="flex items-center gap-2">
              <input
                value={balanceInput}
                onChange={(e) => setBalanceInput(e.target.value)}
                className="border border-black/20 rounded-lg px-3 py-2 text-sm w-full"
                placeholder="Ej: 1243.50"
                inputMode="decimal"
              />
              <button
                onClick={saveCurrentBalance}
                disabled={savingBalance}
                className="border border-black px-3 py-2 text-sm rounded-lg hover:bg-black hover:text-white disabled:opacity-50"
              >
                {savingBalance ? "…" : "Guardar"}
              </button>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={savingsDone}
                onChange={(e) => toggleSavingsDone(e.target.checked)}
                disabled={savingSavingsDone}
              />
              <span>Ahorro transferido este mes</span>
              {savingSavingsDone && <span className="text-xs text-black/50">(guardando…)</span>}
            </label>
            <div className="text-xs text-black/50">
              Ahorro pendiente ahora: <span className="font-semibold">{money(savingsPending)} €</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-semibold">Distribución: gastable vs reservado</div>
        <div className="h-3 w-full rounded-full overflow-hidden border border-black/10 flex">
          <div style={{ width: `${bar.pctCategories}%` }} className="h-full bg-black/80" />
          <div style={{ width: `${bar.pctReserves}%` }} className="h-full bg-black/20" />
        </div>

        <div className="flex items-center justify-between text-xs text-black/60">
          <div>
            Categorías: <span className="font-semibold">{money(bar.categories)} €</span>
          </div>
          <div>
            Reservas: <span className="font-semibold">{money(bar.reserves)} €</span>
          </div>
          <div>
            Total mostrado: <span className="font-semibold">{money(bar.total)} €</span>
          </div>
        </div>
      </div>
    </section>
  );
}
