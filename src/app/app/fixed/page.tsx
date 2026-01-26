"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

type FixedExpenseRow = {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  active: boolean;
  start_ym: string;
  end_ym: string | null;
  created_at: string;
};

function money(n: number) {
  return (Number(n) || 0).toFixed(2);
}

export default function FixedExpensesPage() {
  const supabase = createClient();

  const [rows, setRows] = useState<FixedExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [startYm, setStartYm] = useState("");
  const [endYm, setEndYm] = useState("");
  const [saving, setSaving] = useState(false);

  const totalActive = useMemo(
    () => rows.filter(r => r.active).reduce((acc, r) => acc + (Number(r.amount) || 0), 0),
    [rows]
  );

  async function getUserId() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    const session = data.session;
    if (!session?.user) throw new Error("Auth session missing!");
    return session.user.id;
  }

  async function load() {
    setLoading(true);
    setErr(null);

    try {
      const userId = await getUserId();

      const { data, error } = await supabase
        .from("fixed_expenses")
        .select("id,user_id,name,amount,active,start_ym,end_ym,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRows((data as FixedExpenseRow[]) ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Error cargando gastos fijos");
    } finally {
      setLoading(false);
    }
  }

  async function addFixed() {
    setErr(null);
    setSaving(true);

    try {
      const userId = await getUserId();

      const amt = Number(amount);
      if (!name.trim()) throw new Error("Pon un nombre.");
      if (!Number.isFinite(amt) || amt <= 0) throw new Error("Importe inválido.");
      if (!startYm.match(/^\d{4}-\d{2}$/)) throw new Error("start_ym debe ser YYYY-MM.");
      if (endYm && !endYm.match(/^\d{4}-\d{2}$/)) throw new Error("end_ym debe ser YYYY-MM o vacío.");

      const { error } = await supabase.from("fixed_expenses").insert({
        user_id: userId,
        name: name.trim(),
        amount: amt,
        active: true,
        start_ym: startYm,
        end_ym: endYm || null,
      });

      if (error) throw error;

      setName("");
      setAmount("");
      setStartYm("");
      setEndYm("");
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Error creando gasto fijo");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(id: string, next: boolean) {
    setErr(null);
    try {
      const userId = await getUserId();
      const { error } = await supabase
        .from("fixed_expenses")
        .update({ active: next })
        .eq("id", id)
        .eq("user_id", userId);

      if (error) throw error;
      setRows(prev => prev.map(r => (r.id === id ? { ...r, active: next } : r)));
    } catch (e: any) {
      setErr(e?.message ?? "Error actualizando");
    }
  }

  async function remove(id: string) {
    const ok = window.confirm("¿Eliminar este gasto fijo? No se puede deshacer.");
    if (!ok) return;

    setErr(null);
    try {
      const userId = await getUserId();
      const { error } = await supabase
        .from("fixed_expenses")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) throw error;
      setRows(prev => prev.filter(r => r.id !== id));
    } catch (e: any) {
      setErr(e?.message ?? "Error eliminando");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Gastos fijos</h1>
            <p className="text-sm text-black/60">
              Total activo: <span className="font-semibold">{money(totalActive)} €</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/app"
              className="border border-black px-3 py-2 text-sm hover:bg-black hover:text-white"
            >
              Volver
            </Link>
            <button
              onClick={load}
              className="border border-black px-3 py-2 text-sm hover:bg-black hover:text-white"
            >
              Recargar
            </button>
          </div>
        </div>

        {err && <div className="text-sm text-red-600">{err}</div>}
        {loading && <div className="text-sm text-black/60">Cargando…</div>}

        <div className="border border-black/10 p-4 space-y-3 rounded-lg">
          <div className="font-semibold">Añadir gasto fijo</div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              className="border border-black/20 px-3 py-2 text-sm"
              placeholder="Nombre (Ej: alquiler)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="border border-black/20 px-3 py-2 text-sm"
              placeholder="Importe (Ej: 750)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <input
              className="border border-black/20 px-3 py-2 text-sm"
              placeholder="Start YM (YYYY-MM)"
              value={startYm}
              onChange={(e) => setStartYm(e.target.value)}
            />
            <input
              className="border border-black/20 px-3 py-2 text-sm"
              placeholder="End YM (opcional)"
              value={endYm}
              onChange={(e) => setEndYm(e.target.value)}
            />
          </div>

          <button
            onClick={addFixed}
            disabled={saving}
            className="border border-black px-3 py-2 text-sm hover:bg-black hover:text-white disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Añadir"}
          </button>
        </div>

        <div className="border border-black/10 p-4 rounded-lg">
          <div className="font-semibold mb-2">Lista</div>

          {rows.length === 0 && !loading && (
            <div className="text-sm text-black/60">No hay gastos fijos todavía.</div>
          )}

          {rows.length > 0 && (
            <ul className="space-y-2">
              {rows.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 text-sm border-b border-black/10 pb-2">
                  <div className="flex flex-col">
                    <span className="font-medium">{r.name}</span>
                    <span className="text-black/60">
                      {r.start_ym}{r.end_ym ? ` → ${r.end_ym}` : ""} · {r.active ? "Activo" : "Inactivo"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="font-semibold">{money(Number(r.amount))} €</div>

                    <button
                      onClick={() => toggleActive(r.id, !r.active)}
                      className="border border-black px-2 py-1 text-xs hover:bg-black hover:text-white"
                    >
                      {r.active ? "Desactivar" : "Activar"}
                    </button>

                    <button
                      onClick={() => remove(r.id)}
                      className="border border-black px-2 py-1 text-xs hover:bg-black hover:text-white"
                    >
                      Eliminar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
