import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NewExpense } from "./NewExpense";
import { NewIncome } from "./NewIncome";

type Month = { id: string; year: number; month: number };
type Expense = { id: string; date: string; amount: number; category: string; note: string | null };
type Income = { id: string; date: string; amount: number; description: string | null };
type State =
  | { status: "loading" }
  | { status: "error" }
  | { status: "empty" }
  | { status: "ready"; month: Month; expenses: Expense[]; incomes: Income[] };

const categoryNames: Record<string, string> = {
  survival: "Supervivencia", optional: "Opcional", culture: "Cultura", extra: "Extra",
};
const money = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

export function Movements({ client, userId, accessToken, apiBaseUrl }: { client: SupabaseClient; userId: string; accessToken: string; apiBaseUrl?: string }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setState({ status: "loading" });
      try {
        const { data: month, error: monthError } = await client.from("months")
          .select("id,year,month").eq("user_id", userId).eq("status", "open")
          .order("year", { ascending: false }).order("month", { ascending: false })
          .limit(1).maybeSingle();
        if (monthError) throw monthError;
        if (!month) { if (!cancelled) setState({ status: "empty" }); return; }
        const [expenseResult, incomeResult] = await Promise.all([
          client.from("expenses").select("id,date,amount,category,note")
            .eq("user_id", userId).eq("month_id", month.id).order("date", { ascending: false }).limit(50),
          client.from("incomes").select("id,date,amount,description")
            .eq("user_id", userId).eq("month_id", month.id).order("date", { ascending: false }).limit(50),
        ]);
        if (expenseResult.error || incomeResult.error) throw new Error("Unable to load movements");
        if (!cancelled) setState({ status: "ready", month, expenses: expenseResult.data ?? [], incomes: incomeResult.data ?? [] });
      } catch {
        if (!cancelled) setState({ status: "error" });
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [client, userId, attempt]);

  async function updateExpense(item: Expense) {
    if (!apiBaseUrl) return;
    const amountText = window.prompt("Importe del gasto (€)", String(item.amount));
    if (amountText === null) return;
    const amount = Number(amountText.replace(",", "."));
    if (!Number.isFinite(amount) || amount <= 0) return;
    const note = window.prompt("Nota del gasto", item.note ?? "");
    if (note === null) return;
    const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/api/expenses/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ amount, note }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null) as { error?: { message?: string } } | null;
      window.alert(body?.error?.message || "No se ha podido editar el gasto.");
      return;
    }
    setAttempt((n) => n + 1);
  }

  async function deleteExpense(item: Expense) {
    if (!apiBaseUrl || !window.confirm("¿Eliminar este gasto?")) return;
    const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/api/expenses/${item.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null) as { error?: { message?: string } } | null;
      window.alert(body?.error?.message || "No se ha podido eliminar el gasto.");
      return;
    }
    setAttempt((n) => n + 1);
  }

  async function deleteIncome(item: Income) {
    if (!window.confirm("¿Eliminar este ingreso?")) return;
    const { error } = await client.from("incomes").delete().eq("id", item.id).eq("user_id", userId);
    if (error) {
      window.alert("No se ha podido eliminar el ingreso. Comprueba tu conexión y el estado del ciclo.");
      return;
    }
    setAttempt((n) => n + 1);
  }

  if (state.status === "loading") return <p role="status">Cargando movimientos…</p>;
  if (state.status === "error") return <section><p role="alert">No se han podido cargar los movimientos. Comprueba tu conexión.</p><button onClick={() => setAttempt((n) => n + 1)}>Reintentar</button></section>;
  if (state.status === "empty") return <p>No hay ningún ciclo abierto.</p>;
  return (
    <section>
      <h2>Ciclo abierto: {String(state.month.month).padStart(2, "0")}/{state.month.year}</h2>
      <NewExpense client={client} monthId={state.month.id} accessToken={accessToken} apiBaseUrl={apiBaseUrl} onSaved={() => setAttempt((n) => n + 1)} />
      <NewIncome monthId={state.month.id} accessToken={accessToken} apiBaseUrl={apiBaseUrl} onSaved={() => setAttempt((n) => n + 1)} />
      <p>Últimos movimientos del ciclo. Se muestran hasta 50 gastos y 50 ingresos.</p>
      <h3>Gastos</h3>
      {state.expenses.length === 0 ? <p>No hay gastos en este ciclo.</p> : <ul>{state.expenses.map((item) => <li key={item.id}><span>{item.note || categoryNames[item.category] || item.category} · {item.date}</span><strong>{money.format(Number(item.amount))}</strong>{apiBaseUrl && <span className="row-actions"><button type="button" onClick={() => void updateExpense(item)}>Editar</button><button type="button" onClick={() => void deleteExpense(item)}>Eliminar</button></span>}</li>)}</ul>}
      <h3>Ingresos</h3>
      {state.incomes.length === 0 ? <p>No hay ingresos en este ciclo.</p> : <ul>{state.incomes.map((item) => <li key={item.id}><span>{item.description || "Ingreso"} · {item.date}</span><strong>{money.format(Number(item.amount))}</strong><span className="row-actions"><button type="button" onClick={() => void deleteIncome(item)}>Eliminar</button></span></li>)}</ul>}
      <button onClick={() => setAttempt((n) => n + 1)}>Actualizar movimientos</button>
    </section>
  );
}
