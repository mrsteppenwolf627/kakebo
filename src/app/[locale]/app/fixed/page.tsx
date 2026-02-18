"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/routing";
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
    <main className="min-h-screen px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-medium text-foreground">Gastos fijos</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Total activo: <span className="font-semibold text-foreground">{money(totalActive)} €</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/app"
              className="border border-border bg-card hover:bg-muted text-foreground px-3 py-2 text-sm rounded-lg transition-colors"
            >
              ← Dashboard
            </Link>
            <button
              onClick={load}
              className="border border-border bg-card hover:bg-muted text-foreground px-3 py-2 text-sm rounded-lg transition-colors"
            >
              Recargar
            </button>
          </div>
        </div>

        {err && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">{err}</div>}
        {loading && <div className="text-sm text-muted-foreground animate-pulse">Cargando…</div>}

        {/* Alta */}
        <div className="border border-border bg-card p-4 sm:p-5 space-y-4 rounded-xl shadow-sm transition-colors">
          <div className="font-medium text-foreground text-sm sm:text-base">Añadir gasto fijo</div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <input
              className="border border-border bg-muted/50 text-foreground rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-shadow"
              placeholder="Nombre (Ej: alquiler)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              className="border border-border bg-muted/50 text-foreground rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-shadow"
              placeholder="Importe (Ej: 750)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            <input
              className="border border-border bg-muted/50 text-foreground rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-shadow"
              placeholder="Inicio (YYYY-MM)"
              value={startYm}
              onChange={(e) => setStartYm(e.target.value)}
            />

            <input
              className="border border-border bg-muted/50 text-foreground rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-shadow"
              placeholder="Fin (opcional)"
              value={endYm}
              onChange={(e) => setEndYm(e.target.value)}
            />

            <input
              className="border border-border bg-muted/50 text-foreground rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-shadow"
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
            className="bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 px-4 py-2 text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors shadow-sm"
          >
            {saving ? "Guardando…" : "Añadir"}
          </button>

          <div className="text-xs text-muted-foreground">
            El <span className="font-medium text-foreground">Día de cobro</span> es opcional. Si lo pones, luego lo usaremos para
            calcular “pendiente” según el día del mes.
          </div>
        </div>

        {/* Lista */}
        <div className="border border-border bg-card p-4 sm:p-5 rounded-xl shadow-sm transition-colors">
          <div className="font-medium text-foreground mb-4">Lista de gastos</div>

          {rows.length === 0 && !loading && (
            <div className="text-sm text-muted-foreground italic">No hay gastos fijos todavía.</div>
          )}

          {rows.length > 0 && (
            <ul className="space-y-3">
              {rows.map((r) => {
                const isEditing = editingId === r.id;
                return (
                  <li
                    key={r.id}
                    className="border border-border bg-muted/30 rounded-lg p-3 flex flex-col gap-3 transition-colors hover:border-border/80"
                  >
                    {/* Vista normal */}
                    {!isEditing && (
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">
                            {r.name}{" "}
                            {!r.active && (
                              <span className="text-xs text-muted-foreground ml-2">(inactivo)</span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {r.start_ym}
                            {r.end_ym ? ` → ${r.end_ym}` : " → (sin fin)"}
                            {" · "}
                            {r.due_day ? `Día ${r.due_day}` : "Sin día"}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap justify-end">
                          <div className="text-sm font-semibold font-mono text-foreground">{money(Number(r.amount))} €</div>

                          <button
                            onClick={() => startEdit(r)}
                            className="text-xs bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200 border border-amber-200 dark:border-amber-800 px-2 py-1.5 rounded hover:opacity-80 transition-colors"
                            title="Editar"
                          >
                            Editar
                          </button>

                          <button
                            onClick={() => toggleActive(r.id, !r.active)}
                            className={`text-xs px-2 py-1.5 rounded border transition-colors ${r.active
                              ? "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                              : "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                              }`}
                            title={r.active ? "Desactivar" : "Activar"}
                          >
                            {r.active ? "Desactivar" : "Activar"}
                          </button>

                          <button
                            onClick={() => removeRow(r.id)}
                            className="text-xs bg-destructive/10 text-destructive border border-destructive/20 px-2 py-1.5 rounded hover:bg-destructive/20 transition-colors"
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
                        <div className="text-sm font-semibold text-foreground">Editando</div>

                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                          <input
                            className="border border-border bg-card text-foreground rounded-lg px-3 py-2 text-sm"
                            value={editForm.name}
                            onChange={(e) =>
                              setEditForm({ ...editForm, name: e.target.value })
                            }
                            placeholder="Nombre"
                          />

                          <input
                            className="border border-border bg-card text-foreground rounded-lg px-3 py-2 text-sm"
                            value={editForm.amount}
                            onChange={(e) =>
                              setEditForm({ ...editForm, amount: e.target.value })
                            }
                            placeholder="Importe"
                            inputMode="decimal"
                          />

                          <input
                            className="border border-border bg-card text-foreground rounded-lg px-3 py-2 text-sm"
                            value={editForm.start_ym}
                            onChange={(e) =>
                              setEditForm({ ...editForm, start_ym: e.target.value })
                            }
                            placeholder="Start YM"
                          />

                          <input
                            className="border border-border bg-card text-foreground rounded-lg px-3 py-2 text-sm"
                            value={editForm.end_ym}
                            onChange={(e) =>
                              setEditForm({ ...editForm, end_ym: e.target.value })
                            }
                            placeholder="End YM (opcional)"
                          />

                          <input
                            className="border border-border bg-card text-foreground rounded-lg px-3 py-2 text-sm"
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
                            className="bg-primary text-primary-foreground px-3 py-1.5 text-xs rounded-lg hover:opacity-90 disabled:opacity-50"
                          >
                            {editSaving ? "Guardando…" : "Guardar"}
                          </button>

                          <button
                            onClick={cancelEdit}
                            disabled={editSaving}
                            className="bg-muted text-muted-foreground border border-border px-3 py-1.5 text-xs rounded-lg hover:bg-muted/80 disabled:opacity-50"
                          >
                            Cancelar
                          </button>
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
