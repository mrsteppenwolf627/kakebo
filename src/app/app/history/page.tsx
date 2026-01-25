"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

type MonthRow = {
  id: string;
  user_id: string;
  year: number;
  month: number;
  status: "open" | "closed";
  created_at: string;
  closed_at: string | null;
};

type ExpenseAgg = {
  total: number;
  count: number;
};

function ymLabel(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export default function HistoryPage() {
  const supabase = createClient();

  const [months, setMonths] = useState<MonthRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [agg, setAgg] = useState<Record<string, ExpenseAgg>>({}); // month_id -> totals

  async function getUserId() {
    const { data: sessionRes, error } = await supabase.auth.getSession();
    if (error) throw error;
    const session = sessionRes.session;
    if (!session?.user) throw new Error("Auth session missing!");
    return session.user.id;
  }

  async function load() {
    setLoading(true);
    setErr(null);

    try {
      const userId = await getUserId();

      const { data, error } = await supabase
        .from("months")
        .select("id,user_id,year,month,status,created_at,closed_at")
        .eq("user_id", userId)
        .order("year", { ascending: false })
        .order("month", { ascending: false });

      if (error) throw error;

      const ms = (data as MonthRow[]) ?? [];
      setMonths(ms);

      // Agregamos gastos por mes con una query por mes (simple y fiable).
      // Si algún día quieres optimizar, lo hacemos con una RPC o una vista.
      const map: Record<string, ExpenseAgg> = {};
      for (const m of ms) {
        const { data: exp, error: eErr } = await supabase
          .from("expenses")
          .select("amount")
          .eq("user_id", userId)
          .eq("month_id", m.id);

        if (eErr) throw eErr;

        const amounts = (exp ?? []) as Array<{ amount: number }>;
        const total = amounts.reduce((a, x) => a + (Number(x.amount) || 0), 0);
        map[m.id] = { total, count: amounts.length };
      }

      setAgg(map);
    } catch (e: any) {
      setErr(e?.message ?? "Error cargando histórico");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closedCount = useMemo(
    () => months.filter((m) => m.status === "closed").length,
    [months]
  );

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Histórico</h1>
            <p className="text-black/60 text-sm">
              Meses registrados: {months.length} · Cerrados: {closedCount}
            </p>
          </div>

          <Link
            href="/"
            className="border border-black px-3 py-2 text-sm hover:bg-black hover:text-white"
          >
            Volver
          </Link>
        </div>

        {err && <div className="text-sm text-red-600">{err}</div>}
        {loading && <div className="text-sm text-black/60">Cargando…</div>}

        {!loading && months.length === 0 && (
          <div className="border border-black/10 p-4 text-sm text-black/60">
            Aún no tienes meses registrados. Se crean cuando guardas un gasto o cierras un mes.
          </div>
        )}

        {!loading && months.length > 0 && (
          <div className="border border-black/10">
            <div className="grid grid-cols-12 border-b border-black/10 p-3 text-xs text-black/60">
              <div className="col-span-3">Mes</div>
              <div className="col-span-2">Estado</div>
              <div className="col-span-3">Gastos</div>
              <div className="col-span-2">Nº gastos</div>
              <div className="col-span-2 text-right">Acción</div>
            </div>

            {months.map((m) => {
              const a = agg[m.id] ?? { total: 0, count: 0 };
              return (
                <div
                  key={m.id}
                  className="grid grid-cols-12 p-3 border-b border-black/10 text-sm items-center"
                >
                  <div className="col-span-3 font-medium">{ymLabel(m.year, m.month)}</div>
                  <div className="col-span-2 text-black/60">{m.status}</div>
                  <div className="col-span-3">{a.total.toFixed(2)} €</div>
                  <div className="col-span-2 text-black/60">{a.count}</div>
                  <div className="col-span-2 text-right">
                    <Link
                      href={`/history/${m.year}-${String(m.month).padStart(2, "0")}`}
                      className="border border-black px-2 py-1 text-xs hover:bg-black hover:text-white"
                    >
                      Ver
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={load}
          className="border border-black px-3 py-2 text-sm hover:bg-black hover:text-white"
        >
          Recargar
        </button>
      </div>
    </main>
  );
}
