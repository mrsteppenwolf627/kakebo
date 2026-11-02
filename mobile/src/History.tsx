import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

type Cycle = { id: string; year: number; month: number; status: string };
type Expense = { id: string; date: string; amount: number; category: string; note: string | null };
type Income = { id: string; date: string; amount: number; description: string | null };
type Movements = { expenses: Expense[]; incomes: Income[] };
const money = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

export function History({ client, userId }: { client: SupabaseClient; userId: string }) {
  const [cycles, setCycles] = useState<Cycle[] | null>(null);
  const [selected, setSelected] = useState("");
  const [items, setItems] = useState<Movements | null>(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setCycles(null); setError(""); setSelected(""); setItems(null);
    void (async () => {
      try {
        const { data, error: failure } = await client.from("months").select("id,year,month,status")
          .eq("user_id", userId).eq("status", "closed").order("year", { ascending: false }).order("month", { ascending: false });
        if (failure) throw failure;
        if (!cancelled) setCycles(data ?? []);
      } catch { if (!cancelled) setError("No se ha podido cargar el historial."); }
    })();
    return () => { cancelled = true; };
  }, [client, userId, revision]);

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    setItems(null); setError("");
    void (async () => {
      try {
        const [expenses, incomes] = await Promise.all([
          client.from("expenses").select("id,date,amount,category,note").eq("user_id", userId).eq("month_id", selected).order("date", { ascending: false }).limit(50),
          client.from("incomes").select("id,date,amount,description").eq("user_id", userId).eq("month_id", selected).order("date", { ascending: false }).limit(50),
        ]);
        if (expenses.error || incomes.error) throw new Error("Unable to load movements");
        if (!cancelled) setItems({ expenses: expenses.data ?? [], incomes: incomes.data ?? [] });
      } catch { if (!cancelled) setError("No se han podido cargar los movimientos del ciclo."); }
    })();
    return () => { cancelled = true; };
  }, [client, userId, selected]);

  return <section>
    <h2>Historial</h2>
    {error ? <><p role="alert">{error}</p><button onClick={() => setRevision((n) => n + 1)}>Reintentar historial</button></> : cycles === null ? <p role="status">Cargando historial…</p> : cycles.length === 0 ? <p>No hay ciclos cerrados.</p> : <>
      <label>Ciclo cerrado<select value={selected} onChange={(event) => setSelected(event.target.value)}>
        <option value="">Selecciona un ciclo</option>
        {cycles.map((cycle) => <option key={cycle.id} value={cycle.id}>{String(cycle.month).padStart(2, "0")}/{cycle.year}</option>)}
      </select></label>
      {selected && (items === null ? <p role="status">Cargando movimientos…</p> : <>
        <p>Se muestran hasta 50 gastos y 50 ingresos del ciclo.</p>
        <h3>Gastos</h3>
        {items.expenses.length ? <ul>{items.expenses.map((item) => <li key={item.id}><span>{item.note || item.category} · {item.date}</span><strong>{money.format(Number(item.amount))}</strong></li>)}</ul> : <p>No hay gastos en este ciclo.</p>}
        <h3>Ingresos</h3>
        {items.incomes.length ? <ul>{items.incomes.map((item) => <li key={item.id}><span>{item.description || "Ingreso"} · {item.date}</span><strong>{money.format(Number(item.amount))}</strong></li>)}</ul> : <p>No hay ingresos en este ciclo.</p>}
      </>)}
    </>}
  </section>;
}
