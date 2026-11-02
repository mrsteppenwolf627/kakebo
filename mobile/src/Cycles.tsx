import { useEffect, useState } from "react";

type Cycle = { id: string; year: number; month: number; status: "open" | "closed"; savings_done?: boolean };
const ym = (year: number, month: number) => `${year}-${String(month).padStart(2, "0")}`;

export function Cycles({ accessToken, apiBaseUrl }: { accessToken: string; apiBaseUrl?: string }) {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [newYm, setNewYm] = useState(() => new Date().toISOString().slice(0, 7));
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => { if (!apiBaseUrl) return; let cancelled = false; fetch(`${apiBaseUrl.replace(/\/$/, "")}/api/months`, { headers: { Authorization: `Bearer ${accessToken}` } }).then(async (res) => { const body = await res.json(); if (!res.ok) throw new Error(body?.error?.message || "No se han podido cargar los ciclos."); return body.data as Cycle[]; }).then((data) => { if (!cancelled) { setCycles(data); setError(""); } }).catch((cause) => { if (!cancelled) setError(cause instanceof Error ? cause.message : "No se han podido cargar los ciclos."); }); return () => { cancelled = true; }; }, [accessToken, apiBaseUrl, attempt]);
  async function createCycle(event: React.FormEvent) { event.preventDefault(); if (!apiBaseUrl) return; setError(""); const res = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/api/months`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ ym: newYm }) }); if (!res.ok) { const body = await res.json().catch(() => null); setError(body?.error?.message || "No se ha podido abrir el ciclo."); return; } setAttempt((value) => value + 1); }
  async function closeCycle(cycle: Cycle) { if (!apiBaseUrl || cycle.status === "closed") return; const res = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/api/months/${cycle.id}`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ status: "closed" }) }); if (!res.ok) { const body = await res.json().catch(() => null); setError(body?.error?.message || "No se ha podido cerrar el ciclo."); return; } setAttempt((value) => value + 1); }
  if (!apiBaseUrl) return <section><h2>Ciclos</h2><p role="status">Falta configurar la API.</p></section>;
  return <section><h2>Ciclos</h2><form onSubmit={createCycle}><label>Abrir ciclo<input type="month" value={newYm} onChange={(event) => setNewYm(event.target.value)} /></label><button>Abrir o reutilizar ciclo</button></form>{error && <p role="alert">{error}</p>}{cycles.length === 0 ? <p>No hay ciclos.</p> : <ul>{cycles.map((cycle) => <li key={cycle.id}><span>{ym(cycle.year, cycle.month)} · {cycle.status === "open" ? "Abierto" : "Cerrado"}</span>{cycle.status === "open" && <button type="button" onClick={() => void closeCycle(cycle)}>Cerrar ciclo</button>}</li>)}</ul>}</section>;
}
