import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

type Summary = { income: number; spent: number; savingGoal: number; balance: number | null; budgets: Record<string, { spent: number; limit: number }> };
const money = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

export function Dashboard({ client, userId }: { client: SupabaseClient; userId: string }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setSummary(null); setError("");
    void (async () => {
      try {
        const { data: settings, error: settingsError } = await client.from("user_settings")
          .select("monthly_income,monthly_saving_goal,current_balance,budget_supervivencia,budget_opcional,budget_cultura,budget_extra").eq("user_id", userId).limit(1);
        if (settingsError) throw settingsError;
        const { data: cycle, error: cycleError } = await client.from("months")
          .select("id").eq("user_id", userId).eq("status", "open")
          .order("year", { ascending: false }).order("month", { ascending: false })
          .limit(1).maybeSingle();
        if (cycleError) throw cycleError;
        const [expenses, incomes] = cycle ? await Promise.all([
          client.from("expenses").select("amount,category").eq("user_id", userId).eq("month_id", cycle.id),
          client.from("incomes").select("amount").eq("user_id", userId).eq("month_id", cycle.id),
        ]) : [{ data: [], error: null }, { data: [], error: null }];
        if (expenses.error || incomes.error) throw new Error("Unable to load dashboard");
        const row = settings?.[0] as { monthly_income?: number; monthly_saving_goal?: number; current_balance?: number | null; budget_supervivencia?: number; budget_opcional?: number; budget_cultura?: number; budget_extra?: number } | undefined;
        const income = Number(row?.monthly_income ?? 0) + (incomes.data ?? []).reduce((total, item) => total + Number(item.amount), 0);
        const spent = (expenses.data ?? []).reduce((total, item) => total + Number(item.amount), 0);
        const limits: Record<string, number> = { survival: Number(row?.budget_supervivencia ?? 0), optional: Number(row?.budget_opcional ?? 0), culture: Number(row?.budget_cultura ?? 0), extra: Number(row?.budget_extra ?? 0) };
        const budgets = Object.fromEntries(Object.entries(limits).map(([category, limit]) => [category, { limit, spent: (expenses.data ?? []).filter((item) => item.category === category).reduce((total, item) => total + Number(item.amount), 0) }]));
        if (!cancelled) setSummary({ income, spent, savingGoal: Number(row?.monthly_saving_goal ?? 0), balance: row?.current_balance ?? null, budgets });
      } catch { if (!cancelled) setError("No se ha podido cargar el resumen."); }
    })();
    return () => { cancelled = true; };
  }, [client, userId, attempt]);
  if (error) return <section aria-label="Resumen financiero"><div className="section-heading"><div><p className="eyebrow">Resumen financiero</p><h2>Tu ciclo Kakebo</h2></div><button className="secondary-button" onClick={() => setAttempt((value) => value + 1)}>Actualizar</button></div><p role="alert">{error}</p><button onClick={() => setAttempt((value) => value + 1)}>Reintentar resumen</button></section>;
  if (!summary) return <p role="status">Cargando resumen…</p>;
  return <section aria-label="Resumen financiero">
    <div className="section-heading"><div><p className="eyebrow">Resumen financiero</p><h2>Resumen del ciclo abierto</h2></div><button className="secondary-button" onClick={() => setAttempt((value) => value + 1)}>Actualizar</button></div>
    <div className="metric-grid"><article className="metric-card metric-card-highlight"><span>Disponible</span><strong>{money.format(summary.income - summary.spent)}</strong><small>Ingresos menos gastos</small></article><article className="metric-card"><span>Ingresos</span><strong>{money.format(summary.income)}</strong><small>Este ciclo</small></article><article className="metric-card"><span>Gastos</span><strong>{money.format(summary.spent)}</strong><small>Registrados</small></article><article className="metric-card"><span>Ahorro objetivo</span><strong>{money.format(summary.savingGoal)}</strong><small>Meta mensual</small></article>{summary.balance !== null && <article className="metric-card"><span>Saldo actual</span><strong>{money.format(summary.balance)}</strong><small>Cuenta personal</small></article>}</div>
    <div className="subsection-heading"><h3>Presupuestos por categoría</h3><span className="muted">Gasto / límite</span></div><ul className="budget-list">{Object.entries(summary.budgets).map(([category, budget]) => <li key={category}><div className={`category-dot category-${category}`}><span>{category === "survival" ? "Supervivencia" : category === "optional" ? "Opcional" : category === "culture" ? "Cultura" : "Extra"}</span><small>{budget.limit > 0 ? `${Math.min(100, Math.round((budget.spent / budget.limit) * 100))}% utilizado` : "Sin límite configurado"}</small></div><strong>{money.format(budget.spent)} <span className="muted">/ {money.format(budget.limit)}</span></strong></li>)}</ul>
  </section>;
}
