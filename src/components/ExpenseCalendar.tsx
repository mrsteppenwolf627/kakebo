"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

type ExpenseRow = {
  id: string;
  user_id: string;
  date: string;      // yyyy-mm-dd
  amount: number;
  category: string;
  note: string | null;     // ✅
  color: string | null;
  created_at: string;
};

export default function ExpenseCalendar() {
  const supabase = createClient();

  const [rows, setRows] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const total = useMemo(
    () => rows.reduce((acc, r) => acc + (Number(r.amount) || 0), 0),
    [rows]
  );

  async function load() {
    setLoading(true);
    setErr(null);

    try {
      const { data: sessionRes, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) throw sessionErr;

      const session = sessionRes.session;
      if (!session?.user) {
        setErr("Auth session missing!");
        return;
      }

      const userId = session.user.id;

      const { data, error } = await supabase
        .from("expenses")
        .select("id,user_id,date,amount,category,note,color,created_at") // ✅ note
        .eq("user_id", userId)
        .order("date", { ascending: false });

      if (error) throw error;

      setRows((data as ExpenseRow[]) ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Error cargando gastos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <div className="border border-black/10 p-4">
        <div className="text-sm text-black/60">Gastos cargados: {rows.length}</div>
        <div className="text-sm text-black/60">Total: {total.toFixed(2)} €</div>
      </div>

      {err && <div className="text-sm text-red-600">{err}</div>}
      {loading && <div className="text-sm text-black/60">Cargando...</div>}

      <div className="border border-black/10 p-4">
        <div className="font-semibold">Lista rápida</div>
        <div className="text-sm text-black/60">
          {rows.length === 0 ? "Aún no hay gastos. Crea uno en “+ Nuevo Gasto”." : ""}
        </div>

        {rows.length > 0 && (
          <ul className="mt-3 space-y-2">
            {rows.slice(0, 10).map((r) => (
              <li key={r.id} className="flex items-center justify-between text-sm">
                <div className="flex flex-col">
                  <span className="font-medium">{r.note ?? "(sin concepto)"}</span>
                  <span className="text-black/60">
                    {r.date} · {r.category}
                  </span>
                </div>
                <div className="font-semibold">{Number(r.amount).toFixed(2)} €</div>
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={load}
          className="mt-4 border border-black px-3 py-2 text-sm hover:bg-black hover:text-white"
        >
          Recargar
        </button>
      </div>
    </div>
  );
}
