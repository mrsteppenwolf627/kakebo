"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/browser";
import { usesCycleLedger } from "@/lib/cycles/ledger-scope";
import { useLocale } from "next-intl";

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

function cycleLabel(year: number, month: number, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

export default function HistoryPage() {
  const supabase = createClient();
  const locale = useLocale();

  const [months, setMonths] = useState<MonthRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [agg, setAgg] = useState<Record<string, ExpenseAgg>>({});

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

      const map: Record<string, ExpenseAgg> = {};
      for (const m of ms) {
        const expenseQuery = supabase
          .from("expenses")
          .select("amount")
          .eq("user_id", userId);
        const { data: exp, error: eErr } = usesCycleLedger(ymLabel(m.year, m.month))
          ? await expenseQuery.eq("month_id", m.id)
          : await expenseQuery
            .gte("date", `${ymLabel(m.year, m.month)}-01`)
            .lte("date", `${ymLabel(m.year, m.month)}-${String(new Date(m.year, m.month, 0).getDate()).padStart(2, "0")}`);

        if (eErr) throw eErr;

        const amounts = (exp ?? []) as Array<{ amount: number }>;
        const total = amounts.reduce((a, x) => a + (Number(x.amount) || 0), 0);
        map[m.id] = { total, count: amounts.length };
      }

      setAgg(map);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Error cargando histórico";
      setErr(message);
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
    <main className="min-h-screen px-4 sm:px-6 py-6 sm:py-10">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-medium text-foreground">Histórico</h1>
            <p className="text-muted-foreground text-sm mt-1 max-w-xl">
              Revisa cuánto gastaste en cada ciclo y entra en cualquiera para consultar su detalle.
            </p>
          </div>

          <Link
            href="/app"
            className="border border-border bg-card px-3 py-2 text-sm rounded-lg hover:bg-muted text-foreground text-center transition-colors"
          >
            ← Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:max-w-md">
          <div className="border border-border bg-card rounded-xl p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Ciclos registrados</div>
            <div className="text-2xl font-semibold text-foreground mt-1">{months.length}</div>
          </div>
          <div className="border border-border bg-card rounded-xl p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Ciclos cerrados</div>
            <div className="text-2xl font-semibold text-foreground mt-1">{closedCount}</div>
          </div>
        </div>

        {err && <div className="text-sm text-red-600">{err}</div>}
        {loading && <div className="text-sm text-black/60">Cargando…</div>}

        {!loading && months.length === 0 && (
          <div className="border border-border bg-card rounded-xl p-5 text-sm text-muted-foreground shadow-sm">
            Aún no tienes ciclos registrados. Se crean cuando guardas un gasto o cierras un ciclo.
          </div>
        )}

        {!loading && months.length > 0 && (
          <div className="border border-border bg-card rounded-xl overflow-hidden shadow-sm">
            {/* Desktop Header */}
            <div className="hidden sm:grid sm:grid-cols-12 border-b border-border p-3 text-xs text-muted-foreground uppercase tracking-wide">
              <div className="col-span-3">Ciclo</div>
              <div className="col-span-2">Estado</div>
              <div className="col-span-3">Importe gastado</div>
              <div className="col-span-2">Movimientos</div>
              <div className="col-span-2 text-right">Acción</div>
            </div>

            {months.map((m) => {
              const a = agg[m.id] ?? { total: 0, count: 0 };
              const label = cycleLabel(m.year, m.month, locale);
              return (
                <div
                  key={m.id}
                  className="p-3 border-b border-border text-sm last:border-b-0"
                >
                  {/* Mobile Layout */}
                  <div className="sm:hidden space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium capitalize">{label}</div>
                        <div className="text-xs text-muted-foreground font-mono">{ymLabel(m.year, m.month)}</div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded ${m.status === "closed"
                          ? "bg-muted text-muted-foreground"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                        }`}>
                        {m.status === "closed" ? "Cerrado" : "Abierto"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground text-xs">
                      <span>{a.total.toFixed(2)} € · {a.count} gastos</span>
                      <Link
                        href={`/app/history/${m.year}-${String(m.month).padStart(2, "0")}`}
                        className="border border-border bg-background px-2 py-1 text-xs rounded-md hover:bg-muted text-foreground transition-colors"
                      >
                        Ver
                      </Link>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden sm:grid sm:grid-cols-12 items-center">
                    <div className="col-span-3">
                      <div className="font-medium capitalize">{label}</div>
                      <div className="text-xs text-muted-foreground font-mono">{ymLabel(m.year, m.month)}</div>
                    </div>
                    <div className="col-span-2">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs ${m.status === "closed"
                        ? "bg-muted text-muted-foreground"
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                        }`}>
                        {m.status === "closed" ? "Cerrado" : "Abierto"}
                      </span>
                    </div>
                    <div className="col-span-3">{a.total.toFixed(2)} €</div>
                    <div className="col-span-2 text-muted-foreground">{a.count}</div>
                    <div className="col-span-2 text-right">
                      <Link
                        href={`/app/history/${m.year}-${String(m.month).padStart(2, "0")}`}
                        className="border border-border bg-background px-2 py-1 text-xs rounded-md hover:bg-muted text-foreground transition-colors"
                      >
                        Ver
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={load}
          className="border border-border bg-card px-3 py-2 text-sm rounded-lg hover:bg-muted text-foreground transition-colors"
        >
          Recargar
        </button>
      </div>
    </main>
  );
}
