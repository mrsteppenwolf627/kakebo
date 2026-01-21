"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

const KAKEBO_CATEGORIES = {
  supervivencia: { label: "Supervivencia", color: "#dc2626" },
  opcional: { label: "Opcional", color: "#2563eb" },
  cultura: { label: "Cultura", color: "#16a34a" },
  extra: { label: "Extra", color: "#9333ea" },
} as const;

type CategoryKey = keyof typeof KAKEBO_CATEGORIES;

type MonthRow = {
  id: string;
  user_id: string;
  year: number;
  month: number;
  status: "open" | "closed";
  created_at: string;
  closed_at: string | null;
};

type ExpenseRow = {
  id: string;
  user_id: string;
  month_id: string | null;
  date: string;
  amount: number;
  category: string;
  note: string | null;
  color: string | null;
  created_at: string;
};

function parseYM(ym: string) {
  const [y, m] = ym.split("-");
  return { year: Number(y), month: Number(m) };
}

export default function MonthDetailPage() {
  const supabase = createClient();
  const params = useParams<{ ym: string }>();

  const ym = params?.ym ?? "";
  const { year, month } = useMemo(() => parseYM(ym), [ym]);

  const [monthRow, setMonthRow] = useState<MonthRow | null>(null);
  const [rows, setRows] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

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

      const { data: months, error: mErr } = await supabase
        .from("months")
        .select("id,user_id,year,month,status,created_at,closed_at")
        .eq("user_id", userId)
        .eq("year", year)
        .eq("month", month)
        .limit(1);

      if (mErr) throw mErr;

      const m = (months?.[0] as MonthRow | undefined) ?? null;
      setMonthRow(m);

      if (!m?.id) {
        setRows([]);
        return;
      }

      const { data, error } = await supabase
        .from("expenses")
        .select("id,user_id,month_id,date,amount,category,note,color,created_at")
        .eq("user_id", userId)
        .eq("month_id", m.id)
        .order("date", { ascending: false });

      if (error) throw error;

      setRows((data as ExpenseRow[]) ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Error cargando mes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!ym) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ym]);

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Mes {ym}</h1>
            <p className="text-black/60 text-sm">
              {monthRow?.status
                ? `Estado: ${monthRow.status}`
                : "No existe registro de mes (aún)"}
              {monthRow?.closed_at ? ` · Cerrado: ${monthRow.closed_at}` : ""}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/history"
              className="border border-black px-3 py-2 text-sm hover:bg-black hover:text-white"
            >
              Volver
            </Link>

            <button
              onClick={load}
              className="border border-black px-3 py-2 text-sm hover:bg-black hover:text-white"
            >
              Recargar
            </button>
          </div>
        </div>

        {err && <div className="text-sm text-red-600">{err}</div>}
        {loading && <div className="text-sm text-black/60">Cargando…</div>}

        {!loading && (
          <div className="border border-black/10 p-4 space-y-3">
            <div className="text-sm text-black/60">Total del mes: {total.toFixed(2)} €</div>

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
        )}

        {!loading && rows.length === 0 && (
          <div className="border border-black/10 p-4 text-sm text-black/60">
            No hay gastos vinculados a este mes (month_id). Si es un mes antiguo,
            aún no se migraron los gastos.
          </div>
        )}

        {!loading && rows.length > 0 && (
          <div className="border border-black/10 p-4">
            <div className="font-semibold mb-2">Gastos del mes</div>
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

                    <div className="font-semibold">{Number(r.amount).toFixed(2)} €</div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
