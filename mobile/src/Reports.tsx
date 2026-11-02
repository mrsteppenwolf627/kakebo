import { useState } from "react";

type Report = { dateRange: string; totalSpent: number; totalIncome: number; fixedTotal: number; savingGoal: number; budgetBeforeExpenses: number; availableReal: number; expenses: Array<{ date: string; amount: number; category: string; note: string | null }>; incomes: Array<{ date: string; amount: number; description: string | null }>; expensesByCategory: Record<string, number> };
const money = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
const ranges = [["cycle", "Ciclo"], ["day", "Día"], ["week", "Semana"], ["month", "Mes"], ["year", "Año"] as const];

export function Reports({ accessToken, apiBaseUrl }: { accessToken: string; apiBaseUrl?: string }) {
  const [range, setRange] = useState("cycle");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 7));
  const [report, setReport] = useState<Report | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function generate() {
    if (!apiBaseUrl) return;
    setBusy(true); setError("");
    const payload = range === "cycle" || range === "month" ? { range, ym: date.slice(0, 7), date: `${date.slice(0, 7)}-01` } : { range, date: date.length === 4 ? `${date}-01-01` : date };
    try { const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/api/reports`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }, body: JSON.stringify(payload) }); const body = await response.json(); if (!response.ok) throw new Error(body?.error?.message || "No se pudo preparar el informe."); setReport(body.data); } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo preparar el informe."); } finally { setBusy(false); }
  }
  function exportCsv() {
    if (!report) return;
    const rows = [["Tipo", "Fecha", "Concepto", "Categoría", "Importe"], ...report.expenses.map((row) => ["Gasto", row.date, row.note || "", row.category, row.amount]), ...report.incomes.map((row) => ["Ingreso", row.date, row.description || "", "Ingreso", row.amount])];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" })); const link = document.createElement("a"); link.href = url; link.download = "kakebo-informe.csv"; link.click(); URL.revokeObjectURL(url);
  }
  if (!apiBaseUrl) return <section><h2>Informes</h2><p role="status">Falta configurar la API.</p></section>;
  return <section><div className="section-heading"><div><p className="eyebrow">Análisis</p><h2>Informes</h2></div><span className="plus-badge">Plus</span></div><p className="muted intro-copy">Consulta tus gastos e ingresos con el mismo detalle que en la web y exporta el resultado cuando lo necesites.</p><div className="report-form"><label>Periodo<select value={range} onChange={(event) => { setRange(event.target.value); setReport(null); }}>{ranges.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Fecha o ciclo<input type={range === "cycle" || range === "month" ? "month" : range === "year" ? "number" : "date"} value={range === "year" ? date.slice(0, 4) : date} onChange={(event) => setDate(event.target.value)} /></label><button onClick={() => void generate()} disabled={busy}>{busy ? "Preparando…" : "Generar informe"}</button></div>{error && <p role="alert" className="error-copy">{error}</p>}{report && <div className="report-result"><h3>{report.dateRange}</h3><div className="metric-grid"><article className="metric-card"><span>Gastos</span><strong>{money.format(report.totalSpent)}</strong></article><article className="metric-card"><span>Ingresos</span><strong>{money.format(report.totalIncome)}</strong></article><article className="metric-card metric-card-highlight"><span>Disponible</span><strong>{money.format(report.availableReal)}</strong></article><article className="metric-card"><span>Movimientos</span><strong>{report.expenses.length + report.incomes.length}</strong></article></div><h3>Por categoría</h3><ul>{Object.entries(report.expensesByCategory).map(([key, value]) => <li key={key}><span>{key}</span><strong>{money.format(value)}</strong></li>)}</ul><button className="secondary-button" onClick={exportCsv}>Exportar CSV</button></div>}</section>;
}
