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
      <section className="border border-stone-200 rounded-none p-6 bg-white">
        <div className="text-sm text-stone-500 font-light">読み込み中…</div>
      </section>
    );
  }

  return (
    <section className="border border-stone-200 rounded-none p-6 sm:p-8 space-y-6 bg-white">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 border-b border-stone-200 pb-4">
        <div>
          <div className="text-xs sm:text-sm text-stone-500 font-light mb-1">残高</div>
          <div className="text-lg sm:text-xl font-serif text-stone-900">{ym}</div>
        </div>

        <div className="text-xs text-stone-400 sm:max-w-xs leading-relaxed">
          Separa lo gastable de lo reservado para no tocar fijos ni ahorro.
        </div>
      </div>

      {err && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-none p-3">{err}</div>}
      {okMsg && <div className="text-sm text-stone-700 bg-stone-50 border border-stone-200 rounded-none p-3">{okMsg}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Card 1: Disponible categorías */}
        <div className="border border-stone-200 rounded-none p-5 sm:p-6 bg-white">
          <div className="text-xs text-stone-500 font-light mb-3">利用可能</div>
          <div className="text-2xl sm:text-3xl font-serif text-stone-900 mb-2">{money(availableForCategories)} €</div>
          <div className="text-xs text-stone-400 leading-relaxed">Disponible para categorías</div>
          <div className="text-xs text-stone-400 mt-1">Ingresos − fijos − ahorro</div>
        </div>

        {/* Card 2: Reservado fijos */}
        <div className="border border-stone-200 rounded-none p-5 sm:p-6 bg-white">
          <div className="text-xs text-stone-500 font-light mb-3">予約済み</div>
          <div className="text-2xl sm:text-3xl font-serif text-stone-900 mb-2">{money(pendingFixedTotal)} €</div>
          <div className="text-xs text-stone-400 leading-relaxed">Reservado para fijos</div>
          <div className="text-xs text-stone-400 mt-1">Fijos pendientes del mes</div>
        </div>

        {/* Card 3: Disponible real hoy - MÁS GRANDE */}
        <div className="border border-stone-300 rounded-none p-5 sm:p-6 space-y-4 sm:col-span-2 lg:col-span-1 bg-stone-50">
          <div>
            <div className="text-xs text-stone-500 font-light mb-3">今日</div>
            <div className="text-2xl sm:text-3xl font-serif text-stone-900 mb-2">{money(availableAfterExpenses)} €</div>
            <div className="text-xs text-stone-400 leading-relaxed">Disponible real hoy</div>
            <div className="text-xs text-stone-400 mt-1">Utilizable − gastos del mes</div>
          </div>

          <div className="border-t border-stone-200 pt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-stone-600 font-light">Banco − reservas:</span>
              <span className="font-mono text-stone-900">{money(bankMinusReserves)} €</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-600 font-light">Gastos del mes:</span>
              <span className="font-mono text-stone-900">{money(monthSpent)} €</span>
            </div>
            <div className="text-xs text-stone-400 leading-relaxed">
              El banco menos reservas te ayuda a no gastar fijos/ahorro aunque no hayan saltado.
            </div>
          </div>

          <div className="border-t border-stone-200 pt-4 space-y-3">
            <label className="text-xs text-stone-500 font-light block">銀行残高 (Saldo del banco en €)</label>
            <div className="flex items-center gap-2">
              <input
                value={balanceInput}
                onChange={(e) => setBalanceInput(e.target.value)}
                className="border border-stone-300 rounded-none px-3 py-2 text-sm w-full font-mono bg-white focus:border-stone-900 focus:outline-none transition-colors"
                placeholder="1243.50"
                inputMode="decimal"
              />
              <button
                onClick={saveCurrentBalance}
                disabled={savingBalance}
                className="border border-stone-900 rounded-none px-4 py-2 text-sm text-stone-900 hover:bg-stone-900 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {savingBalance ? "…" : "保存"}
              </button>
            </div>

            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={savingsDone}
                onChange={(e) => toggleSavingsDone(e.target.checked)}
                disabled={savingSavingsDone}
                className="accent-stone-900"
              />
              <span>Ahorro transferido este mes</span>
              {savingSavingsDone && <span className="text-xs text-stone-400">(guardando…)</span>}
            </label>
            <div className="text-xs text-stone-500">
              Ahorro pendiente: <span className="font-mono text-stone-900">{money(savingsPending)} €</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 border-t border-stone-200 pt-6">
        <div className="text-sm font-serif text-stone-900">分配 (Distribución)</div>
        <div className="h-2 w-full rounded-none overflow-hidden border border-stone-300 flex bg-stone-100">
          <div style={{ width: `${bar.pctCategories}%` }} className="h-full bg-stone-900" />
          <div style={{ width: `${bar.pctReserves}%` }} className="h-full bg-stone-400" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-stone-600">
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <span className="font-light">Categorías:</span>
            <span className="font-mono text-stone-900">{money(bar.categories)} €</span>
          </div>
          <div className="flex items-center justify-between sm:justify-center gap-2">
            <span className="font-light">Reservas:</span>
            <span className="font-mono text-stone-900">{money(bar.reserves)} €</span>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-2">
            <span className="font-light">Total:</span>
            <span className="font-mono text-stone-900">{money(bar.total)} €</span>
          </div>
        </div>
      </div>
    </section>
  );
}
