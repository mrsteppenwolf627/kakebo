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
  due_day: number | null;
  created_at: string;
};

function money(n: number) {
  return (Number(n) || 0).toFixed(2);
}

function isYm(s: string) {
  return /^\d{4}-\d{2}$/.test(s);
}

function currentYm() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function parseDueDay(v: string): number | null {
  const t = v.trim();
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  const i = Math.trunc(n);
  if (i < 1 || i > 31) return null;
  return i;
}

type EditForm = {
  name: string;
  amount: string; // input
  start_ym: string;
  end_ym: string; // "" => null
  due_day: string; // "" => null
};

export default function FixedExpensesPage() {
  const supabase = useMemo(() => createClient(), []);

  const [rows, setRows] = useState<FixedExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Alta
  const [name, setName] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [startYm, setStartYm] = useState<string>(currentYm());
  const [endYm, setEndYm] = useState<string>("");
  const [dueDay, setDueDay] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // Edición
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const totalActive = useMemo(
    () =>
      rows
        .filter((r) => r.active)
        .reduce((acc, r) => acc + (Number(r.amount) || 0), 0),
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
        .select("id,user_id,name,amount,active,start_ym,end_ym,due_day,created_at")
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

  function validateFixedPayload(args: {
    name: string;
    amount: string;
    start_ym: string;
    end_ym: string;
    due_day: string;
  }) {
    const nm = args.name.trim();
    const amt = Number(args.amount);
    const sYm = args.start_ym.trim();
    const eYm = args.end_ym.trim();
    const dd = parseDueDay(args.due_day);

    if (!nm) return { ok: false as const, message: "Pon un nombre." };
    if (!Number.isFinite(amt) || amt <= 0) return { ok: false as const, message: "Importe inválido." };
    if (!isYm(sYm)) return { ok: false as const, message: "start_ym debe ser YYYY-MM." };
    if (eYm && !isYm(eYm)) return { ok: false as const, message: "end_ym debe ser YYYY-MM o vacío." };
    if (eYm && eYm < sYm) return { ok: false as const, message: "end_ym no puede ser anterior a start_ym." };
    if (args.due_day.trim() && dd === null) return { ok: false as const, message: "Día de cobro debe ser 1–31 (o vacío)." };

    return {
      ok: true as const,
      data: {
        name: nm,
        amount: amt,
        start_ym: sYm,
        end_ym: eYm ? eYm : null,
        due_day: dd,
      },
    };
  }

  async function addFixed() {
    setErr(null);
    setSaving(true);

    try {
      const userId = await getUserId();

      const v = validateFixedPayload({
        name,
        amount,
        start_ym: startYm,
        end_ym: endYm,
        due_day: dueDay,
      });

      if (!v.ok) throw new Error(v.message);

      const { error } = await supabase.from("fixed_expenses").insert({
        user_id: userId,
        ...v.data,
        active: true,
      });

      if (error) throw error;

      setName("");
      setAmount("");
      setStartYm(currentYm());
      setEndYm("");
      setDueDay("");
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
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, active: next } : r)));
    } catch (e: any) {
      setErr(e?.message ?? "Error actualizando");
    }
  }

  async function removeRow(id: string) {
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

      // si estabas editando esa fila, sal
      if (editingId === id) {
        setEditingId(null);
        setEditForm(null);
      }

      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (e: any) {
      setErr(e?.message ?? "Error eliminando");
    }
  }

  function startEdit(r: FixedExpenseRow) {
    setErr(null);
    setEditingId(r.id);
    setEditForm({
      name: r.name ?? "",
      amount: String(r.amount ?? ""),
      start_ym: r.start_ym ?? currentYm(),
      end_ym: r.end_ym ?? "",
      due_day: r.due_day ? String(r.due_day) : "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(null);
  }

  async function saveEdit(id: string) {
    if (!editForm) return;

    setErr(null);
    setEditSaving(true);

    try {
      const userId = await getUserId();

      const v = validateFixedPayload({
        name: editForm.name,
        amount: editForm.amount,
        start_ym: editForm.start_ym,
        end_ym: editForm.end_ym,
        due_day: editForm.due_day,
      });

      if (!v.ok) throw new Error(v.message);

      const { error } = await supabase
        .from("fixed_expenses")
        .update(v.data)
        .eq("id", id)
        .eq("user_id", userId);

      if (error) throw error;

      // actualiza en memoria para que se vea al instante
      setRows((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                name: v.data.name,
                amount: v.data.amount,
                start_ym: v.data.start_ym,
                end_ym: v.data.end_ym,
                due_day: v.data.due_day,
              }
            : r
        )
      );

      cancelEdit();
    } catch (e: any) {
      setErr(e?.message ?? "Error guardando cambios");
    } finally {
      setEditSaving(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen px-4 sm:px-6 py-6 sm:py-10">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold">Gastos fijos</h1>
            <p className="text-sm text-black/60">
              Total activo: <span className="font-semibold">{money(totalActive)} €</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/app"
              className="border border-black px-3 py-2 text-sm rounded-lg hover:bg-black hover:text-white"
            >
              ← Dashboard
            </Link>
            <button
              onClick={load}
              className="border border-black px-3 py-2 text-sm rounded-lg hover:bg-black hover:text-white"
            >
              Recargar
            </button>
          </div>
        </div>

        {err && <div className="text-sm text-red-600">{err}</div>}
        {loading && <div className="text-sm text-black/60">Cargando…</div>}

        {/* Alta */}
        <div className="border border-black/10 p-3 sm:p-4 space-y-3 rounded-lg">
          <div className="font-semibold text-sm sm:text-base">Añadir gasto fijo</div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <input
              className="border border-black/20 rounded-lg px-3 py-2 text-sm"
              placeholder="Nombre (Ej: alquiler)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              className="border border-black/20 rounded-lg px-3 py-2 text-sm"
              placeholder="Importe (Ej: 750)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            <input
              className="border border-black/20 rounded-lg px-3 py-2 text-sm"
              placeholder="Inicio (YYYY-MM)"
              value={startYm}
              onChange={(e) => setStartYm(e.target.value)}
            />

            <input
              className="border border-black/20 rounded-lg px-3 py-2 text-sm"
              placeholder="Fin (opcional)"
              value={endYm}
              onChange={(e) => setEndYm(e.target.value)}
            />

            <input
              className="border border-black/20 rounded-lg px-3 py-2 text-sm"
              placeholder="Día cobro (1–31)"
              inputMode="numeric"
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value)}
              title="Día del mes en que suele cobrarse (opcional)"
            />
          </div>

          <button
            onClick={addFixed}
            disabled={saving}
            className="border border-black px-3 py-2 text-sm rounded-lg hover:bg-black hover:text-white disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Añadir"}
          </button>

          <div className="text-xs text-black/60">
            El <span className="font-semibold">Día de cobro</span> es opcional. Si lo pones, luego lo usaremos para
            calcular “pendiente” según el día del mes.
          </div>
        </div>

        {/* Lista */}
        <div className="border border-black/10 p-4 rounded-lg">
          <div className="font-semibold mb-2">Lista</div>

          {rows.length === 0 && !loading && (
            <div className="text-sm text-black/60">No hay gastos fijos todavía.</div>
          )}

          {rows.length > 0 && (
            <ul className="space-y-3">
              {rows.map((r) => {
                const isEditing = editingId === r.id;
                return (
                  <li
                    key={r.id}
                    className="border border-black/10 rounded-lg p-3 flex flex-col gap-3"
                  >
                    {/* Vista normal */}
                    {!isEditing && (
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">
                            {r.name}{" "}
                            {!r.active && (
                              <span className="text-xs text-black/50">(inactivo)</span>
                            )}
                          </div>
                          <div className="text-xs text-black/60">
                            {r.start_ym}
                            {r.end_ym ? ` → ${r.end_ym}` : " → (sin fin)"}
                            {" · "}
                            {r.due_day ? `Día ${r.due_day}` : "Sin día"}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap justify-end">
                          <div className="text-sm font-semibold">{money(Number(r.amount))} €</div>

                          <button
                            onClick={() => startEdit(r)}
                            className="border border-black bg-yellow-400 text-black px-3 py-2 text-xs rounded-lg hover:brightness-95"
                            title="Editar"
                          >
                            Editar
                          </button>

                          <button
                            onClick={() => toggleActive(r.id, !r.active)}
                            className={`border border-black px-3 py-2 text-xs rounded-lg ${
                              r.active
                                ? "hover:bg-black hover:text-white"
                                : "border-black/30 text-black/70 hover:border-black hover:text-black"
                            }`}
                            title={r.active ? "Desactivar" : "Activar"}
                          >
                            {r.active ? "Desactivar" : "Activar"}
                          </button>

                          <button
                            onClick={() => removeRow(r.id)}
                            className="border border-black bg-red-600 text-white px-3 py-2 text-xs rounded-lg hover:brightness-95"
                            title="Eliminar"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Modo edición */}
                    {isEditing && editForm && (
                      <div className="space-y-3">
                        <div className="text-sm font-semibold">Editando</div>

                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                          <input
                            className="border border-black/20 rounded-lg px-3 py-2 text-sm"
                            value={editForm.name}
                            onChange={(e) =>
                              setEditForm({ ...editForm, name: e.target.value })
                            }
                            placeholder="Nombre"
                          />

                          <input
                            className="border border-black/20 rounded-lg px-3 py-2 text-sm"
                            value={editForm.amount}
                            onChange={(e) =>
                              setEditForm({ ...editForm, amount: e.target.value })
                            }
                            placeholder="Importe"
                            inputMode="decimal"
                          />

                          <input
                            className="border border-black/20 rounded-lg px-3 py-2 text-sm"
                            value={editForm.start_ym}
                            onChange={(e) =>
                              setEditForm({ ...editForm, start_ym: e.target.value })
                            }
                            placeholder="Start YM"
                          />

                          <input
                            className="border border-black/20 rounded-lg px-3 py-2 text-sm"
                            value={editForm.end_ym}
                            onChange={(e) =>
                              setEditForm({ ...editForm, end_ym: e.target.value })
                            }
                            placeholder="End YM (opcional)"
                          />

                          <input
                            className="border border-black/20 rounded-lg px-3 py-2 text-sm"
                            value={editForm.due_day}
                            onChange={(e) =>
                              setEditForm({ ...editForm, due_day: e.target.value })
                            }
                            placeholder="Día (1–31)"
                            inputMode="numeric"
                          />
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => saveEdit(r.id)}
                            disabled={editSaving}
                            className="border border-black bg-yellow-400 text-black px-3 py-2 text-xs rounded-lg hover:brightness-95 disabled:opacity-50"
                          >
                            {editSaving ? "Guardando…" : "Guardar"}
                          </button>

                          <button
                            onClick={cancelEdit}
                            disabled={editSaving}
                            className="border border-black px-3 py-2 text-xs rounded-lg hover:bg-black hover:text-white disabled:opacity-50"
                          >
                            Cancelar
                          </button>

                          <button
                            onClick={() => toggleActive(r.id, !r.active)}
                            disabled={editSaving}
                            className={`border border-black px-3 py-2 text-xs rounded-lg disabled:opacity-50 ${
                              r.active
                                ? "hover:bg-black hover:text-white"
                                : "border-black/30 text-black/70 hover:border-black hover:text-black"
                            }`}
                          >
                            {r.active ? "Desactivar" : "Activar"}
                          </button>

                          <button
                            onClick={() => removeRow(r.id)}
                            disabled={editSaving}
                            className="border border-black bg-red-600 text-white px-3 py-2 text-xs rounded-lg hover:brightness-95 disabled:opacity-50"
                          >
                            Eliminar
                          </button>
                        </div>

                        <div className="text-xs text-black/60">
                          Consejo: deja <span className="font-semibold">End YM</span> vacío si no termina nunca. Deja{" "}
                          <span className="font-semibold">Día</span> vacío si no tienes un día fijo.
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
