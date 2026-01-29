"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

type Props = {
  ym?: string | null;
  year?: number;
  month?: number;
};

type UserSettingsRow = {
  monthly_income: number | null;
  monthly_saving_goal: number | null; // ✅ nombre correcto
  current_balance: number | null;
};

type FixedExpenseRow = {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  active: boolean;
  start_ym: string;
  end_ym: string | null;
  due_day: number | null; // 1–31 opcional
};

type MonthRow = {
  id: string;
  status: "open" | "closed";
  savings_done: boolean;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function money(n: number) {
  const x = Number(n);
  return (Number.isFinite(x) ? x : 0).toFixed(2);
}

function num(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function isYm(s: string) {
  return /^\d{4}-\d{2}$/.test(s);
}

function currentYm() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

function withinYm(ym: string, start: string, end: string | null) {
  if (!isYm(ym) || !isYm(start)) return false;
  if (ym < start) return false;
  if (end && isYm(end) && ym > end) return false;
  return true;
}

function parseYm(ym: string) {
  const [y, m] = ym.split("-");
  return { year: Number(y), month: Number(m) };
}

export default function DashboardMoneyPanel({
  ym: ymProp,
  year,
  month,
}: Props) {
  const supabase = useMemo(() => createClient(), []);

  // Normalizamos ym: preferimos ymProp si es válido; si no, year+month; si no, mes actual.
  const ym = useMemo(() => {
    if (typeof ymProp === "string" && isYm(ymProp)) return ymProp;

    if (
      typeof year === "number" &&
      Number.isFinite(year) &&
      typeof month === "number" &&
      Number.isFinite(month) &&
      month >= 1 &&
      month <= 12
    ) {
      return `${year}-${pad2(month)}`;
    }

    return currentYm();
  }, [ymProp, year, month]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const [settings, setSettings] = useState<UserSettingsRow>({
    monthly_income: 0,
    monthly_saving_goal: 0,
    current_balance: 0,
  });

  const [fixedRows, setFixedRows] = useState<FixedExpenseRow[]>([]);
  const [monthRow, setMonthRow] = useState<MonthRow | null>(null);

  const [currentBalanceInput, setCurrentBalanceInput] = useState<string>("");
  const [savingBalance, setSavingBalance] = useState(false);

  const [savingSavingsDone, setSavingSavingsDone] = useState(false);
  const [savingsDone, setSavingsDone] = useState(false);

  const [monthSpent, setMonthSpent] = useState<number>(0);

  const ymNow = currentYm();
  const isCurrent = ym === ymNow;
  const today = new Date().getDate();

  // ---- Calculados
  const fixedForYm = useMemo(() => {
    return fixedRows.filter(
      (r) => r.active && withinYm(ym, r.start_ym, r.end_ym)
    );
  }, [fixedRows, ym]);

  const fixedTotal = useMemo(() => {
    return fixedForYm.reduce((acc, r) => acc + num(r.amount), 0);
  }, [fixedForYm]);

  const pendingFixed = useMemo(() => {
    // “pendiente” solo tiene sentido en el mes actual; en futuros: conservador (todo pendiente)
    if (!isCurrent) return fixedTotal;

    return fixedForYm.reduce((acc, r) => {
      // si no sabemos día, lo consideramos pendiente (conservador)
      if (!r.due_day) return acc + num(r.amount);
      // si hoy aún no ha llegado (o justo hoy), sigue pendiente
      if (r.due_day >= today) return acc + num(r.amount);
      // si ya pasó el día, asumimos que ya se cobró
      return acc;
    }, 0);
  }, [fixedForYm, fixedTotal, isCurrent, today]);

  const income = num(settings.monthly_income);
  const savingGoal = num(settings.monthly_saving_goal);
  const currentBalance = num(settings.current_balance);

  const pendingSaving = savingsDone ? 0 : savingGoal;

  // Esto NO cambia con gastos
  const usableForCategories = Math.max(0, income - fixedTotal - savingGoal);

  // Esto SÍ cambia con gastos
  const availableCategoriesNow = usableForCategories - monthSpent;

  // Referencia “banco - reservas” (para que no te autoengañes)
  const bankMinusReserves = currentBalance - pendingFixed - pendingSaving;

  async function getUserId() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    const session = data.session;
    if (!session?.user) throw new Error("Auth session missing");
    return session.user.id;
  }

  async function ensureMonth(userId: string, year: number, month: number) {
    const { data, error } = await supabase
      .from("months")
      .select("id,status,savings_done")
      .eq("user_id", userId)
      .eq("year", year)
      .eq("month", month)
      .limit(1);

    if (error) throw error;

    const existing = (data?.[0] as MonthRow | undefined) ?? null;
    if (existing) return existing;

    const { data: created, error: cErr } = await supabase
      .from("months")
      .insert({
        user_id: userId,
        year,
        month,
        status: "open",
        savings_done: false,
      })
      .select("id,status,savings_done")
      .single();

    if (cErr) throw cErr;

    return created as MonthRow;
  }

  async function loadAll() {
    setLoading(true);
    setErr(null);
    setOkMsg(null);

    try {
      const userId = await getUserId();

      // settings
      const { data: s, error: sErr } = await supabase
        .from("user_settings")
        .select("monthly_income,monthly_saving_goal,current_balance")
        .eq("user_id", userId)
        .limit(1);

      if (sErr) throw sErr;
      const row = (s?.[0] as UserSettingsRow | undefined) ?? null;

      const nextSettings: UserSettingsRow = {
        monthly_income: num(row?.monthly_income),
        monthly_saving_goal: num(row?.monthly_saving_goal),
        current_balance: num(row?.current_balance),
      };
      setSettings(nextSettings);
      setCurrentBalanceInput(
        nextSettings.current_balance ? String(nextSettings.current_balance) : ""
      );

      // fixed expenses
      const { data: fx, error: fxErr } = await supabase
        .from("fixed_expenses")
        .select("id,user_id,name,amount,active,start_ym,end_ym,due_day")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (fxErr) throw fxErr;
      setFixedRows((fx as FixedExpenseRow[]) ?? []);

      // month row + savingsDone
      const { year, month } = parseYm(ym);
      const m = await ensureMonth(userId, year, month);
      setMonthRow(m);
      setSavingsDone(!!m.savings_done);

      // expenses sum for the month
      const from = `${ym}-01`;
      const to = `${ym}-31`;

      const { data: exp, error: expErr } = await supabase
        .from("expenses")
        .select("amount,date")
        .eq("user_id", userId)
        .gte("date", from)
        .lte("date", to);

      if (expErr) throw expErr;

      const spent = (exp as any[] | null)?.reduce(
        (acc, r) => acc + num(r.amount),
        0
      );
      setMonthSpent(num(spent));
    } catch (e: any) {
      setErr(e?.message ?? "Error cargando panel");
    } finally {
      setLoading(false);
    }
  }

  async function saveBalance() {
    setErr(null);
    setOkMsg(null);

    const value = Number(currentBalanceInput);
    if (!Number.isFinite(value)) {
      setErr("Saldo inválido.");
      return;
    }

    setSavingBalance(true);
    try {
      const userId = await getUserId();
      const { error } = await supabase
        .from("user_settings")
        .upsert(
          { user_id: userId, current_balance: value },
          { onConflict: "user_id" }
        );

      if (error) throw error;

      setSettings((s) => ({ ...s, current_balance: value }));
      setOkMsg("Saldo guardado.");
    } catch (e: any) {
      setErr(e?.message ?? "Error guardando saldo");
    } finally {
      setSavingBalance(false);
    }
  }

  async function toggleSavingsDone(next: boolean) {
    if (!monthRow) return;

    setErr(null);
    setOkMsg(null);
    setSavingSavingsDone(true);

    try {
      const userId = await getUserId();
      const { year, month } = parseYm(ym);

      const m = await ensureMonth(userId, year, month);

      const { error } = await supabase
        .from("months")
        .update({ savings_done: next })
        .eq("id", m.id)
        .eq("user_id", userId);

      if (error) throw error;

      setSavingsDone(next);
      setMonthRow((prev) => (prev ? { ...prev, savings_done: next } : prev));
      setOkMsg(next ? "Ahorro marcado como transferido." : "Ahorro marcado como pendiente.");
    } catch (e: any) {
      setErr(e?.message ?? "Error actualizando ahorro");
    } finally {
      setSavingSavingsDone(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ym]);

  return (
    <section className="border border-black/10 rounded-2xl p-6 space-y-5">
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="text-sm text-black/60">Resumen realista</div>
          <div className="text-xl font-semibold">Mes: {ym}</div>
          <div className="text-sm text-black/50">Saldo guardado.</div>
        </div>

        <div className="text-xs text-black/50 max-w-xs leading-relaxed">
          Esto separa “lo gastable” de “lo reservado” para que no muerdas fijos/ahorro
          solo porque aún no han pasado por el banco.
        </div>
      </div>

      {err && <div className="text-sm text-red-600">{err}</div>}
      {okMsg && <div className="text-sm text-green-700">{okMsg}</div>}
      {loading && <div className="text-sm text-black/60">Cargando…</div>}

      {!loading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1) gastable del mes */}
            <div className="border border-black/10 rounded-2xl p-4">
              <div className="text-sm text-black/60">Disponible para categorías (mes)</div>
              <div className="text-3xl font-semibold">{money(usableForCategories)} €</div>
              <div className="text-xs text-black/50 mt-2">
                Ingresos − fijos del mes − ahorro objetivo
              </div>
            </div>

            {/* 2) reservas pendientes */}
            <div className="border border-black/10 rounded-2xl p-4">
              <div className="text-sm text-black/60">Reservado para fijos pendientes</div>
              <div className="text-3xl font-semibold">{money(pendingFixed)} €</div>
              <div className="text-xs text-black/50 mt-2">
                Solo tiene sentido como “pendiente” en el mes actual. En meses futuros es conservador (todo pendiente).
              </div>
            </div>

            {/* 3) disponible real hoy (categorías) */}
            <div className="border border-black/10 rounded-2xl p-4 space-y-3">
              <div>
                <div className="text-sm text-black/60">Disponible real hoy (categorías)</div>
                <div className="text-3xl font-semibold">{money(availableCategoriesNow)} €</div>
                <div className="text-xs text-black/50 mt-2">
                  Utilizable para categorías − gastos del mes
                </div>
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
                <div className="text-xs text-black/50">Saldo actual del banco (€)</div>
                <div className="flex items-center gap-2">
                  <input
                    className="border border-black/20 rounded-xl px-3 py-2 w-full"
                    value={currentBalanceInput}
                    onChange={(e) => setCurrentBalanceInput(e.target.value)}
                    placeholder="Ej: 1202.17"
                    inputMode="decimal"
                  />
                  <button
                    onClick={saveBalance}
                    disabled={savingBalance}
                    className="border border-black px-4 py-2 rounded-xl hover:bg-black hover:text-white disabled:opacity-50"
                  >
                    {savingBalance ? "Guardando…" : "Guardar"}
                  </button>
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={savingsDone}
                    disabled={savingSavingsDone}
                    onChange={(e) => toggleSavingsDone(e.target.checked)}
                  />
                  <span>Ahorro transferido este mes</span>
                </label>

                <div className="text-xs text-black/50">
                  Ahorro pendiente ahora: {money(pendingSaving)} €
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
