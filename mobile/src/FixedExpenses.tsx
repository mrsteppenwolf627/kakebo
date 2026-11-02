import { useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

type FixedExpense = {
  id: string;
  name: string;
  amount: number;
  category: string;
  start_ym: string;
  end_ym: string | null;
  due_day: number;
  active: boolean;
};

const categories = [
  ["survival", "Supervivencia"],
  ["optional", "Opcional"],
  ["culture", "Cultura"],
  ["extra", "Extra"],
] as const;
const money = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

export function FixedExpenses({ client, userId }: { client: SupabaseClient; userId: string }) {
  const [rows, setRows] = useState<FixedExpense[]>([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("survival");
  const [startYm, setStartYm] = useState(() => new Date().toISOString().slice(0, 7));
  const [endYm, setEndYm] = useState("");
  const [dueDay, setDueDay] = useState("1");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [attempt, setAttempt] = useState(0);
  const total = useMemo(() => rows.filter((row) => row.active).reduce((sum, row) => sum + Number(row.amount), 0), [rows]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setMessage("");
      const { data, error } = await client.from("fixed_expenses").select("id,name,amount,category,start_ym,end_ym,due_day,active").eq("user_id", userId).order("name");
      if (cancelled) return;
      if (error) setMessage("No se han podido cargar los gastos fijos. Comprueba tu conexión.");
      else setRows((data as FixedExpense[]) ?? []);
    }
    void load();
    return () => { cancelled = true; };
  }, [client, userId, attempt]);

  async function add(event: React.FormEvent) {
    event.preventDefault();
    const numericAmount = Number(amount);
    const numericDay = Number(dueDay);
    if (!name.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0 || !/^\d{4}-\d{2}$/.test(startYm) || (endYm && !/^\d{4}-\d{2}$/.test(endYm)) || numericDay < 1 || numericDay > 31) {
      setMessage("Revisa nombre, importe, fechas y día de vencimiento.");
      return;
    }
    setBusy(true); setMessage("");
    const { error } = await client.from("fixed_expenses").insert({ user_id: userId, name: name.trim(), amount: numericAmount, category, start_ym: startYm, end_ym: endYm || null, due_day: numericDay, active: true });
    setBusy(false);
    if (error) { setMessage("No se ha podido guardar el gasto fijo."); return; }
    setName(""); setAmount(""); setEndYm(""); setDueDay("1"); setAttempt((n) => n + 1);
  }

  async function toggle(row: FixedExpense) {
    const { error } = await client.from("fixed_expenses").update({ active: !row.active }).eq("id", row.id).eq("user_id", userId);
    if (error) setMessage("No se ha podido actualizar el gasto fijo."); else setAttempt((n) => n + 1);
  }

  async function remove(row: FixedExpense) {
    if (!window.confirm(`¿Eliminar «${row.name}»?`)) return;
    const { error } = await client.from("fixed_expenses").delete().eq("id", row.id).eq("user_id", userId);
    if (error) setMessage("No se ha podido eliminar el gasto fijo."); else setAttempt((n) => n + 1);
  }

  return <section>
    <h2>Gastos fijos</h2>
    <p>Total activo: <strong>{money.format(total)}</strong></p>
    <form onSubmit={add} aria-label="Añadir gasto fijo">
      <label>Nombre<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Alquiler" /></label>
      <label>Importe<input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="750" /></label>
      <label>Categoría<select value={category} onChange={(e) => setCategory(e.target.value)}>{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label>Inicio<input type="month" value={startYm} onChange={(e) => setStartYm(e.target.value)} /></label>
      <label>Fin (opcional)<input type="month" value={endYm} onChange={(e) => setEndYm(e.target.value)} /></label>
      <label>Día de vencimiento<input type="number" min="1" max="31" value={dueDay} onChange={(e) => setDueDay(e.target.value)} /></label>
      <button disabled={busy}>{busy ? "Guardando…" : "Añadir gasto fijo"}</button>
    </form>
    {message && <p role="alert">{message}</p>}
    {rows.length === 0 ? <p>No hay gastos fijos.</p> : <ul>{rows.map((row) => <li key={row.id}><span><strong>{row.name}</strong><br />{money.format(Number(row.amount))} · {row.start_ym}{row.end_ym ? ` → ${row.end_ym}` : ""} · día {row.due_day} · {row.active ? "Activo" : "Inactivo"}</span><span><button type="button" onClick={() => void toggle(row)}>{row.active ? "Desactivar" : "Activar"}</button> <button type="button" onClick={() => void remove(row)}>Eliminar</button></span></li>)}</ul>}
  </section>;
}
