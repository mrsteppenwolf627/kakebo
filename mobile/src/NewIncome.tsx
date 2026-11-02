import { useRef, useState, type FormEvent } from "react";

function today() { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`; }

export function NewIncome({ monthId, accessToken, apiBaseUrl, onSaved }: { monthId: string; accessToken: string; apiBaseUrl?: string; onSaved: () => void }) {
  const [date, setDate] = useState(today);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("salary");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const sending = useRef(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number(amount);
    if (sending.current || !apiBaseUrl || !date || !Number.isFinite(value) || value <= 0) {
      setMessage(!apiBaseUrl ? "Configura la URL del API para registrar ingresos." : "Introduce una fecha y un importe mayor que cero.");
      return;
    }
    sending.current = true; setBusy(true); setMessage("");
    try {
      const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/api/incomes`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ date, amount: value, category, description, month_id: monthId }),
      });
      const payload = await response.json().catch(() => null) as { error?: { message?: string } } | null;
      if (!response.ok) { setMessage(payload?.error?.message || "No se ha podido guardar el ingreso."); return; }
      setAmount(""); setDescription(""); onSaved();
    } catch { setMessage("No se ha podido conectar. Revisa tu conexión antes de volver a intentarlo."); }
    finally { sending.current = false; setBusy(false); }
  }

  return <form onSubmit={save}>
    <h3>Añadir ingreso</h3>
    <label>Fecha<input type="date" required value={date} onChange={(event) => setDate(event.target.value)} /></label>
    <label>Importe (€)<input type="number" min="0.01" step="0.01" required value={amount} onChange={(event) => setAmount(event.target.value)} /></label>
    <label>Tipo<input maxLength={100} value={category} onChange={(event) => setCategory(event.target.value)} /></label>
    <label>Descripción<input maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
    <button disabled={busy}>{busy ? "Guardando…" : "Guardar ingreso"}</button>
    {message && <p role="alert">{message}</p>}
  </form>;
}
