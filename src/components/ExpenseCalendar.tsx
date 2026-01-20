"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Tx = {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  category: string;
  note: string | null;
};

export default function ExpenseCalendar() {
  const [items, setItems] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setErr(null);

      try {
        const { data: userRes, error: userErr } = await supabase.auth.getUser();
        if (userErr) throw userErr;
        if (!userRes.user) throw new Error("No hay usuario logueado.");

        const { data, error } = await supabase
          .from("expenses")
          .select("id,date,amount,category,note")
          .order("date", { ascending: true });

        if (error) throw error;

        if (alive) setItems((data ?? []) as Tx[]);
      } catch (e: any) {
        if (alive) setErr(e?.message ?? "Error cargando gastos");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  const total = useMemo(
    () => items.reduce((acc, x) => acc + Number(x.amount || 0), 0),
    [items]
  );

  return (
    <section className="space-y-4">
      <div className="border border-black/10 p-4">
        <div className="text-sm text-black/60">Gastos cargados: {items.length}</div>
        <div className="text-sm text-black/60">Total: {total.toFixed(2)} €</div>
      </div>

      {loading && <div className="text-sm text-black/60">Cargando…</div>}
      {err && <div className="text-sm text-red-600">{err}</div>}

      {/* Placeholder: luego lo conectamos al calendario visual */}
      <div className="border border-black/10 p-4">
        <div className="text-sm font-medium">Lista rápida</div>
        <ul className="mt-2 space-y-1 text-sm">
          {items.map((x) => (
            <li key={x.id} className="flex justify-between gap-4">
              <span className="text-black/70">
                {x.date} · {x.category} {x.note ? `· ${x.note}` : ""}
              </span>
              <span className="font-medium">{Number(x.amount).toFixed(2)} €</span>
            </li>
          ))}
          {!loading && items.length === 0 && (
            <li className="text-black/50">Aún no hay gastos. Crea uno en “+ Nuevo Gasto”.</li>
          )}
        </ul>
      </div>
    </section>
  );
}
