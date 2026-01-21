"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export default function NewExpensePage() {
  const supabase = createClient();
  const router = useRouter();

  const [date, setDate] = useState(() => {
    // yyyy-mm-dd para <input type="date">
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });

  const [concept, setConcept] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("General");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    console.log("[NEW PAGE] mounted");
  }, []);

  async function saveExpense() {
    setLoading(true);
    setMsg(null);

    console.log("[NEW PAGE] save button clicked");
    console.log("[NEW PAGE] saveExpense() ENTERED");

    try {
      const { data: sessionRes, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) throw sessionErr;

      const session = sessionRes.session;
      console.log("[NEW PAGE] session:", session);

      if (!session?.user) {
        setMsg("No hay sesión. Vuelve a iniciar sesión.");
        return;
      }

      const user_id = session.user.id;

      // amount a número
      const parsedAmount = Number(String(amount).replace(",", "."));
      if (!Number.isFinite(parsedAmount)) {
        setMsg("El importe no es válido.");
        return;
      }

      // si quieres mapear colores por categoría, aquí:
      const colorMap: Record<string, string> = {
        General: "#111111",
        Comida: "#2563eb",
        Transporte: "#16a34a",
        Ocio: "#9333ea",
        Salud: "#dc2626",
      };
      const color = colorMap[category] ?? "#111111";

      console.log("[NEW PAGE] inserting expense for user:", user_id);

      // ✅ CLAVE: tu DB tiene `note`, no `description`
      const { data, error } = await supabase
        .from("expenses")
        .insert({
          user_id,
          date,                 // input type date -> yyyy-mm-dd ok
          amount: parsedAmount,
          category,
          note: concept || null, // ✅ aquí va el texto
          color,                 // si existe en tu tabla
        })
        .select()
        .single();

      if (error) {
        console.log("[NEW PAGE] INSERT ERROR:", error);
        throw error;
      }

      console.log("[NEW PAGE] inserted row:", data);

      // vuelve al dashboard
      router.push("/");
      router.refresh();
    } catch (e: any) {
      console.log("[NEW PAGE] CATCH ERROR:", e);
      setMsg(e?.message ?? "Error desconocido al guardar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-semibold">Nuevo gasto</h1>

        <div className="space-y-2">
          <label className="text-sm text-black/70">Fecha</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-black/15 px-3 py-2 outline-none focus:border-black"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-black/70">Concepto</label>
          <input
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            className="w-full border border-black/15 px-3 py-2 outline-none focus:border-black"
            placeholder="Ej: mandarina"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-black/70">Importe (€)</label>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border border-black/15 px-3 py-2 outline-none focus:border-black"
            placeholder="Ej: 12.50"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-black/70">Categoría</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-black/15 px-3 py-2 outline-none focus:border-black"
          >
            <option>General</option>
            <option>Comida</option>
            <option>Transporte</option>
            <option>Ocio</option>
            <option>Salud</option>
          </select>
        </div>

        {msg && <p className="text-sm text-red-600">{msg}</p>}

        <button
          onClick={saveExpense}
          disabled={loading || !concept || !amount}
          className="w-full bg-black text-white py-3 text-sm hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Guardando..." : "Guardar gasto"}
        </button>
      </div>
    </main>
  );
}
