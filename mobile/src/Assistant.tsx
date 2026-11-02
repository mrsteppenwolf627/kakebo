import { useState } from "react";

type ChatMessage = { role: "user" | "assistant"; content: string };
type Confirmation = { id: string; message: string };

export function Assistant({ accessToken, apiBaseUrl }: { accessToken: string; apiBaseUrl?: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  async function sendMessage(message: string, confirmationId?: string) {
    if (!apiBaseUrl || busy) return;
    setBusy(true); setError("");
    const history = messages;
    if (!confirmationId) setMessages((current) => [...current, { role: "user", content: message }]);
    try {
      const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/api/ai/agent-v2/stream`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ message, history, ...(confirmationId ? { confirmationId } : {}) }) });
      if (!response.ok) { const payload = await response.json().catch(() => null); throw new Error(payload?.error?.message || payload?.message || "No se ha podido obtener respuesta."); }
      if (!response.body) throw new Error("El asistente no ha devuelto un flujo válido.");
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = ""; let answer = ""; let sawConfirmation = false;
      const consume = (raw: string) => {
        buffer += raw;
        const frames = buffer.split("\n\n"); buffer = frames.pop() || "";
        for (const frame of frames) {
          const line = frame.split("\n").find((item) => item.startsWith("data:")); if (!line) continue;
          const event = JSON.parse(line.slice(5).trim()) as { type?: string; text?: string; message?: string; request?: { message?: string; confirmationId?: string } };
          if (event.type === "chunk" && event.text) { answer += event.text; setMessages((current) => { const last = current[current.length - 1]; return last?.role === "assistant" ? [...current.slice(0, -1), { role: "assistant", content: answer }] : [...current, { role: "assistant", content: answer }]; }); }
          else if (event.type === "confirmation" && event.request?.confirmationId) { sawConfirmation = true; setConfirmation({ id: event.request.confirmationId, message: event.request.message || "El asistente solicita confirmación para realizar una operación." }); }
          else if (event.type === "error") throw new Error(event.message || "El asistente ha devuelto un error.");
        }
      };
      while (true) { const result = await reader.read(); if (result.done) break; consume(decoder.decode(result.value, { stream: true })); }
      consume(decoder.decode());
      if (!answer && !sawConfirmation) setError("El asistente no ha devuelto texto.");
    } catch (cause) {
      if (!confirmationId) setMessages((current) => current.filter((item, index) => !(index === current.length - 1 && item.role === "user" && item.content === message)));
      setError(cause instanceof Error ? cause.message : "No se ha podido conectar con el asistente.");
    } finally { setBusy(false); }
  }

  function send(event: React.FormEvent) { event.preventDefault(); const message = input.trim(); if (!message || busy) return; setInput(""); void sendMessage(message); }
  if (!apiBaseUrl) return <section><h2>Asistente Kakebo</h2><p role="status">Falta configurar la API del asistente.</p></section>;
  return <section>
    <h2>Asistente Kakebo</h2><p>Consulta tus gastos y pide análisis del ciclo actual.</p>
    <div className="chat-list" aria-live="polite">{messages.length === 0 ? <p>Ejemplo: «¿Cuánto he gastado este mes?»</p> : messages.map((item, index) => <p key={`${item.role}-${index}`} className={`chat-message ${item.role}`}><strong>{item.role === "user" ? "Tú" : "Kakebo"}:</strong> {item.content}</p>)}</div>
    {confirmation && <div className="confirmation-card" role="alert"><p>{confirmation.message}</p><button type="button" onClick={() => { setConfirmation(null); void sendMessage("Confirmar operación", confirmation.id); }} disabled={busy}>Confirmar operación</button><button type="button" onClick={() => setConfirmation(null)} disabled={busy}>Cancelar</button></div>}
    {error && <p role="alert">{error}</p>}
    <form onSubmit={send} aria-label="Enviar mensaje al asistente"><label>Mensaje<input value={input} onChange={(event) => setInput(event.target.value)} disabled={busy} maxLength={1000} placeholder="Escribe una pregunta" /></label><button disabled={busy || !input.trim()}>{busy ? "Pensando…" : "Enviar"}</button></form>
  </section>;
}
