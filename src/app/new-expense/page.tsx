"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";


const CATEGORIES = ["General", "Opcional", "Cultura", "Extra"] as const;

export default function NewExpensePage() {
  const router = useRouter();

  const [date, setDate] = useState<string>(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("General");
  const [note, setNote] = useState<string>("");
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setMsg(null);
    setSaving(true);

    try {
      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const user = userRes.user;
      if (!user) throw new Error("No hay usuario logueado.");

      const parsed = Number(String(amount).replace(",", "."));
      if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error("Importe inválido. Ej: 12.50");
      }

      const { error } = await supabase.from("expenses").insert({
        user_id: user.id,
        date,
        amount: parsed,
        category,
        note: note.trim() || null,
      });

      if (error) throw error;

      router.push("/dashboard");
    } catch (e: any) {
      setMsg(e?.message ?? "Error desconocido guardando gasto");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="max-w-xl mx-auto px-6 py-10 space-y-6">
      <h1 className="text-2xl font-semibold">Nuevo gasto</h1>

      <div className="space-y-2">
        <label className="text-sm text-black/60">Fecha</label>
        <input
          type="date"
          className="w-full border border-black/15 px-3 py-2 outline-none focus:border-black"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm text-black/60">Importe (€)</label>
        <input
          inputMode="decimal"
          placeholder="12.50"
          className="w-full border border-black/15 px-3 py-2 outline-none focus:border-black"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm text-black/60">Categoría</label>
        <select
          className="w-full border border-black/15 px-3 py-2 outline-none focus:border-black"
          value={category}
          onChange={(e) => setCategory(e.target.value as any)}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm text-black/60">Nota (opcional)</label>
        <input
          className="w-full border border-black/15 px-3 py-2 outline-none focus:border-black"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ej: Supermercado"
        />
      </div>

      {msg && <p className="text-sm text-red-600">{msg}</p>}

      <div className="flex gap-3">
        <button
          onClick={() => router.push("/dashboard")}
          className="px-4 py-2 border border-black/15 hover:border-black"
        >
          Cancelar
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-2 bg-black text-white disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Guardar gasto"}
        </button>
      </div>
    </main>
  );
}
