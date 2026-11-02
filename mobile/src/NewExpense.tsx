import { useRef, useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

function today() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function NewExpense({ client, monthId, accessToken, apiBaseUrl, onSaved }: { client: SupabaseClient; monthId: string; accessToken: string; apiBaseUrl?: string; onSaved: () => void }) {
  const [date, setDate] = useState(today);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("survival");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [message, setMessage] = useState("");
  const sending = useRef(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current || uncertain) return;
    const value = Number(amount);
    if (!date || !Number.isFinite(value) || value <= 0) {
      setMessage("Introduce una fecha y un importe mayor que cero.");
      return;
    }
    sending.current = true;
    setBusy(true); setMessage("");
    try {
      let data: unknown = null;
      let error: { code?: string } | null = null;
      if (apiBaseUrl) {
        const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/api/expenses`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ date, amount: value, category, note, month_id: monthId }),
        });
        const payload = await response.json().catch(() => null) as { data?: unknown; error?: { code?: string } } | null;
        data = payload?.data ?? null;
        error = response.ok ? null : (payload?.error ?? { code: "UNKNOWN" });
      } else {
        const result = await client.rpc("fn_create_expense", {
          p_month_id: monthId, p_date: date, p_amount: value, p_category: category,
          p_note: note, p_subcategory: null,
        });
        data = result.data; error = result.error;
      }
      if (error) {
        if (error.code === "KB001") setMessage("Se ha alcanzado el límite de gastos de la cuenta.");
        else if (error.code === "KB002") setMessage("No se ha podido guardar. Comprueba los datos y el estado del ciclo.");
        else { setUncertain(true); setMessage("No se puede confirmar si se guardó. Revisa los movimientos antes de volver a intentarlo."); }
      } else if (!data) {
        setUncertain(true);
        setMessage("No se puede confirmar si se guardó. Revisa los movimientos antes de volver a intentarlo.");
      } else {
        setAmount(""); setNote("");
        onSaved();
      }
    } catch {
      setUncertain(true);
      setMessage("No se puede confirmar si se guardó. Revisa los movimientos antes de volver a intentarlo.");
    } finally { sending.current = false; setBusy(false); }
  }

  return <form onSubmit={save}>
    <h3>Añadir gasto</h3>
    <label>Fecha<input type="date" required value={date} onChange={(event) => setDate(event.target.value)} /></label>
    <label>Importe (€)<input type="number" min="0.01" step="0.01" required value={amount} onChange={(event) => setAmount(event.target.value)} /></label>
    <label>Categoría<select value={category} onChange={(event) => setCategory(event.target.value)}><option value="survival">Supervivencia</option><option value="optional">Opcional</option><option value="culture">Cultura</option><option value="extra">Extra</option></select></label>
    <label>Nota<input maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} /></label>
    <button disabled={busy || uncertain}>{busy ? "Guardando…" : "Guardar gasto"}</button>
    {message && <p role="alert">{message}</p>}
    {uncertain && <button type="button" onClick={onSaved}>Revisar movimientos</button>}
  </form>;
}
