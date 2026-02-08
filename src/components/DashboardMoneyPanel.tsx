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

  // Nuevo cálculo de "Liquidez Real" (Banco - Reservas)
  // Reservas = Fijos pendientes este mes + Ahorro pendiente este mes + Ahorro Goal (si no separado) -> simplifiquemos
  const liquidity = useMemo(() => {
    const cb = currentBalance ?? 0;
    // Debemos restar lo que YA está comprometido pero AÚN está en la cuenta
    return cb - pendingFixedTotal - savingsPending;
  }, [currentBalance, pendingFixedTotal, savingsPending]);

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
      <section className="border border-stone-200 rounded-none p-6 bg-white animate-pulse">
        <div className="h-4 w-32 bg-stone-200 mb-4"></div>
        <div className="grid grid-cols-3 gap-4">
          <div className="h-24 bg-stone-100"></div>
          <div className="h-24 bg-stone-100"></div>
          <div className="h-24 bg-stone-100"></div>
        </div>
      </section>
    );
  }

  return (
    <section className="border border-stone-200 rounded-none p-6 sm:p-8 space-y-6 bg-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 border-b border-stone-200 pb-4">
        <div>
          <div className="text-xs sm:text-sm text-stone-500 font-light mb-1 uppercase tracking-wider">Balance Mensual</div>
          <div className="text-lg sm:text-xl font-serif text-stone-900">{ym}</div>
        </div>

        <div className="text-xs text-stone-400 sm:max-w-xs leading-relaxed text-right">
          Control financiero simplificado.
        </div>
      </div>

      {err && <div className="text-sm text-red-700 bg-red-50 border border-red-200 p-3">{err}</div>}
      {okMsg && <div className="text-sm text-stone-700 bg-stone-50 border border-stone-200 p-3">{okMsg}</div>}

      {/* Main Stats - 3 Cards Simplified Model */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">

        {/* Card 1: Budget */}
        <div className="border border-stone-100 bg-stone-50/50 p-5">
          <div className="text-xs text-stone-500 font-medium mb-1 uppercase tracking-wide">Presupuesto</div>
          <div className="text-2xl font-serif text-stone-900 mb-1">{money(availableForCategories)} €</div>
          <div className="text-[10px] text-stone-400">
            (Ingresos − Fijos − Ahorro)
          </div>
        </div>

        {/* Card 2: Spent */}
        <div className="border border-stone-100 bg-stone-50/50 p-5">
          <div className="text-xs text-stone-500 font-medium mb-1 uppercase tracking-wide">Gastado</div>
          <div className="text-2xl font-serif text-stone-700 mb-1">{money(monthSpent)} €</div>
          <div className="text-[10px] text-stone-400">
            Suma de gastos registrados
          </div>
        </div>

        {/* Card 3: Remaining (Highlighted) */}
        <div className="border border-stone-200 bg-white shadow-sm p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-stone-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10">
            <div className="text-xs text-stone-900 font-bold mb-1 uppercase tracking-wide">Disponible Real</div>
            <div className={`text-3xl font-serif mb-1 ${availableAfterExpenses >= 0 ? "text-stone-900" : "text-red-700"}`}>
              {money(availableAfterExpenses)} €
            </div>
            <div className="text-[10px] text-stone-500">
              Lo que te queda para terminar el mes
            </div>
          </div>
        </div>
      </div>

      {/* Input de Banco y Ahorro */}
      <div className="bg-stone-50 border border-stone-200 p-4 sm:p-5 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">

          {/* Liquidez / Banco */}
          <div className="space-y-3">
            <label className="text-xs text-stone-500 font-medium block">💰 Saldo actual en Banco (€)</label>
            <div className="flex items-center gap-2">
              <input
                value={balanceInput}
                onChange={(e) => setBalanceInput(e.target.value)}
                className="border border-stone-300 px-3 py-2 text-sm w-32 font-mono bg-white focus:border-stone-900 focus:outline-none"
                placeholder="0.00"
                inputMode="decimal"
              />
              <button
                onClick={saveCurrentBalance}
                disabled={savingBalance}
                className="bg-stone-900 text-white px-4 py-2 text-xs font-medium hover:bg-stone-700 disabled:opacity-50 transition-colors"
              >
                {savingBalance ? "..." : "OK"}
              </button>
            </div>
            <div className="text-[10px] text-stone-400 leading-tight">
              Liquidez real (Banco − Reservas): <span className="font-mono text-stone-600 font-medium">{money(liquidity)} €</span>
              <br />
              <span className="opacity-70">Esto es tu "colchón" real descontando lo que ya está comprometido.</span>
            </div>
          </div>

          {/* Ahorro Check */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="savingsCheck"
                checked={savingsDone}
                onChange={(e) => toggleSavingsDone(e.target.checked)}
                disabled={savingSavingsDone}
                className="w-4 h-4 accent-stone-900 cursor-pointer"
              />
              <label htmlFor="savingsCheck" className="text-sm text-stone-700 cursor-pointer select-none">
                Ya he transferido el ahorro ({money(savingGoal)} €)
              </label>
            </div>
            <div className="text-[10px] text-stone-400 pl-7">
              Marca esto cuando muevas el dinero a tu cuenta de ahorro.
              {savingSavingsDone && <span className="ml-2 text-stone-500">(Guardando...)</span>}
            </div>
            {savingsPending > 0 && (
              <div className="text-[10px] text-amber-700/80 bg-amber-50 px-2 py-1 inline-block rounded-sm ml-7 border border-amber-100">
                Pendiente de transferir: {money(savingsPending)} €
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
