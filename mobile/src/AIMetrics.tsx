import { useEffect, useState } from "react";

type Props = { accessToken: string; apiBaseUrl?: string };
type Data = { metrics?: Record<string, unknown>; learning?: Record<string, unknown>; logs?: Array<Record<string, unknown>> };

export function AIMetrics({ accessToken, apiBaseUrl }: Props) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!apiBaseUrl) return;
    let cancelled = false;
    fetch(`${apiBaseUrl.replace(/\/$/, "")}/api/ai/metrics?includeLogs=true&logsLimit=10`, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(async (response) => { const payload = await response.json(); if (!response.ok) throw new Error(payload?.error?.message || "No se han podido cargar las métricas."); return payload.data as Data; })
      .then((next) => { if (!cancelled) { setData(next); setError(""); } })
      .catch((cause) => { if (!cancelled) setError(cause instanceof Error ? cause.message : "No se han podido cargar las métricas."); });
    return () => { cancelled = true; };
  }, [accessToken, apiBaseUrl, attempt]);
  if (!apiBaseUrl) return <section><h2>Métricas de IA</h2><p role="status">Falta configurar la API.</p></section>;
  if (error) return <section><h2>Métricas de IA</h2><p role="alert">{error}</p><button onClick={() => setAttempt((value) => value + 1)}>Reintentar</button></section>;
  if (!data) return <section><h2>Métricas de IA</h2><p role="status">Cargando métricas…</p></section>;
  const entries = Object.entries(data.metrics ?? {});
  return <section><h2>Métricas de IA</h2><dl>{entries.map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{typeof value === "object" ? JSON.stringify(value) : String(value)}</dd></div>)}</dl><h3>Aprendizaje</h3><dl>{Object.entries(data.learning ?? {}).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{typeof value === "object" ? JSON.stringify(value) : String(value)}</dd></div>)}</dl><h3>Interacciones recientes</h3>{data.logs?.length ? <ul>{data.logs.map((log, index) => <li key={index}>{JSON.stringify(log)}</li>)}</ul> : <p>No hay interacciones recientes.</p>}</section>;
}
