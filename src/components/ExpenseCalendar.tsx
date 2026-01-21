"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

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

  const ym = useMemo(
    () => `${year}-${String(month).padStart(2, "0")}`,
    [year, month]
  );

  const total = useMemo(() => {
    return rows.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
  }, [rows]);

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

  async function getUserId() {
    const { data: sessionRes, error } = await supabase.auth.getSession();
    if (error) throw error;
    const session = sessionRes.session;
    if (!session?.user) throw new Error("Auth session missing!");
    return session.user.id;
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

      const m = await getMonth(userId);
      setMonthRow(m);

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

      // fallback por fecha para gastos antiguos
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

      // asegura month
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

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ym]);

  const monthStatusLabel = monthRow?.status
    ? `estado: ${monthRow.status}`
    : "sin registro de mes aún";

  const isClosed = monthRow?.status === "closed";

  return (
    <div className="space-y-4">
      <div className="border border-black/10 p-4 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm text-black/60">
              Mes: {ym} <span className="ml-2">({monthStatusLabel})</span>
            </div>
            <div className="text-sm text-black/60">Gastos del mes: {rows.length}</div>
            <div className="text-sm text-black/60">Total del mes: {total.toFixed(2)} €</div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className="border border-black px-3 py-2 text-sm hover:bg-black hover:text-white"
            >
              Recargar
            </button>

            <button
              onClick={closeMonth}
              disabled={closing || isClosed}
              className="border border-black px-3 py-2 text-sm hover:bg-black hover:text-white disabled:opacity-50"
              title={isClosed ? "Mes cerrado" : "Cerrar mes"}
            >
              {isClosed ? "Mes cerrado" : closing ? "Cerrando…" : "Cerrar mes"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(Object.keys(KAKEBO_CATEGORIES) as CategoryKey[]).map((key) => {
            const cat = KAKEBO_CATEGORIES[key];
            const value = totalsByCategory[key];
            const pct = total > 0 ? (value / total) * 100 : 0;

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
                  <div className="text-sm font-medium">{cat.label}</div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-semibold">{value.toFixed(2)} €</div>
                  <div className="text-xs text-black/60">{pct.toFixed(0)}%</div>
                </div>
              </div>
            );
          })}
        </div>
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
                        {r.month_id ? "" : " · (sin month_id)"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="font-semibold">{Number(r.amount).toFixed(2)} €</div>

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
