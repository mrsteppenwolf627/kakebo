import { useEffect, useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

type Values = { monthly_income: string; monthly_saving_goal: string; budget_supervivencia: string; budget_opcional: string; budget_cultura: string; budget_extra: string; current_balance: string; ai_confirm_writes: boolean; allow_collective_learning: boolean };
const empty: Values = { monthly_income: "", monthly_saving_goal: "", budget_supervivencia: "", budget_opcional: "", budget_cultura: "", budget_extra: "", current_balance: "", ai_confirm_writes: true, allow_collective_learning: false };

export function Settings({ client, userId }: { client: SupabaseClient; userId: string }) {
  const [values, setValues] = useState<Values>(empty);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    void (async () => {
      try {
        const { data: row, error } = await client.from("user_settings").select("monthly_income,monthly_saving_goal,budget_supervivencia,budget_opcional,budget_cultura,budget_extra,current_balance,ai_confirm_writes,allow_collective_learning").eq("user_id", userId).maybeSingle();
        if (error) throw error;
        setValues({ monthly_income: String(row?.monthly_income ?? ""), monthly_saving_goal: String(row?.monthly_saving_goal ?? ""), budget_supervivencia: String(row?.budget_supervivencia ?? ""), budget_opcional: String(row?.budget_opcional ?? ""), budget_cultura: String(row?.budget_cultura ?? ""), budget_extra: String(row?.budget_extra ?? ""), current_balance: String(row?.current_balance ?? ""), ai_confirm_writes: row?.ai_confirm_writes ?? true, allow_collective_learning: row?.allow_collective_learning ?? false });
        setLoaded(true);
      } catch { setMessage("No se han podido cargar los ajustes."); }
    })();
  }, [client, userId]);
  function set(name: keyof Values, value: string) { setValues((current) => ({ ...current, [name]: value })); }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setMessage("");
    try {
      const body = { user_id: userId, monthly_income: values.monthly_income === "" ? null : Number(values.monthly_income), monthly_saving_goal: values.monthly_saving_goal === "" ? null : Number(values.monthly_saving_goal), budget_supervivencia: values.budget_supervivencia === "" ? null : Number(values.budget_supervivencia), budget_opcional: values.budget_opcional === "" ? null : Number(values.budget_opcional), budget_cultura: values.budget_cultura === "" ? null : Number(values.budget_cultura), budget_extra: values.budget_extra === "" ? null : Number(values.budget_extra), current_balance: values.current_balance === "" ? null : Number(values.current_balance), ai_confirm_writes: values.ai_confirm_writes, allow_collective_learning: values.allow_collective_learning };
      const { error } = await client.from("user_settings").upsert(body, { onConflict: "user_id" });
      if (error) throw error;
      setMessage("Ajustes guardados.");
    } catch { setMessage("No se han podido guardar los ajustes."); } finally { setBusy(false); }
  }
  return <form onSubmit={save}>
    <h2>Ajustes financieros</h2>
    {!loaded && !message && <p role="status">Cargando ajustes…</p>}
    {(["monthly_income", "monthly_saving_goal", "budget_supervivencia", "budget_opcional", "budget_cultura", "budget_extra", "current_balance"] as const).map((name) => <label key={name}>{name.replaceAll("_", " ")}<input type="number" step="0.01" value={values[name]} onChange={(event) => set(name, event.target.value)} /></label>)}
    <label className="check-row"><input type="checkbox" checked={values.ai_confirm_writes} onChange={(event) => setValues((current) => ({ ...current, ai_confirm_writes: event.target.checked }))} /> Confirmar cambios de datos realizados por IA</label>
    <label className="check-row"><input type="checkbox" checked={values.allow_collective_learning} onChange={(event) => setValues((current) => ({ ...current, allow_collective_learning: event.target.checked }))} /> Permitir aprendizaje colectivo anónimo</label>
    <button disabled={busy}>{busy ? "Guardando…" : "Guardar ajustes"}</button>
    {message && <p role="status">{message}</p>}
  </form>;
}
