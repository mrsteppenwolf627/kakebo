"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { useTranslations } from "next-intl";

type Expense = {
  id: string;
  type: "expense";
  date: string;
  amount: number;
  category: string;
  note: string | null;
};

type Income = {
  id: string;
  type: "income";
  date: string;
  amount: number;
  description: string | null;
};

type Movement = Expense | Income;

const KAKEBO_CATEGORIES: Record<string, { label: string; color: string }> = {
  supervivencia: { label: "Supervivencia", color: "#fca5a5" },
  opcional: { label: "Opcional", color: "#93c5fd" },
  cultura: { label: "Cultura", color: "#86efac" },
  extra: { label: "Extra", color: "#d8b4fe" },
};

const API_TO_FRONTEND: Record<string, string> = {
  survival: "supervivencia",
  optional: "opcional",
  culture: "cultura",
  extra: "extra",
};

function money(n: number) {
  return Number(n).toFixed(2);
}

type Props = {
  year: number;
  month: number;
  ym: string;
};

export default function RecentMovements({ year, month, ym }: Props) {
  const t = useTranslations("Dashboard.RecentMovements");
  const supabase = useMemo(() => createClient(), []);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const { data: sessionRes, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) throw sessionErr;
      const userId = sessionRes?.session?.user?.id;
      if (!userId) throw new Error("Auth session missing");

      const start = `${ym}-01`;
      const lastDay = new Date(Number(ym.split("-")[0]), Number(ym.split("-")[1]), 0).getDate();
      const end = `${ym}-${String(lastDay).padStart(2, "0")}`;

      const [{ data: expensesData, error: expensesErr }, { data: incomesData, error: incomesErr }] =
        await Promise.all([
          supabase
            .from("expenses")
            .select("id,date,amount,category,note")
            .eq("user_id", userId)
            .gte("date", start)
            .lte("date", end),
          supabase
            .from("incomes")
            .select("id,date,amount,description")
            .eq("user_id", userId)
            .gte("date", start)
            .lte("date", end),
        ]);

      if (expensesErr) throw expensesErr;
      if (incomesErr) throw incomesErr;

      const expenses: Expense[] = (expensesData || []).map((e: any) => ({
        id: e.id,
        type: "expense",
        date: e.date,
        amount: e.amount,
        category: e.category,
        note: e.note,
      }));

      const incomes: Income[] = (incomesData || []).map((i: any) => ({
        id: i.id,
        type: "income",
        date: i.date,
        amount: i.amount,
        description: i.description,
      }));

      const all: Movement[] = [...expenses, ...incomes];
      all.sort((a, b) => b.date.localeCompare(a.date));
      setMovements(all);
    } catch (e: any) {
      setErr(e?.message ?? "Error cargando movimientos");
    } finally {
      setLoading(false);
    }
  }, [supabase, ym]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const handler = () => load();
    window.addEventListener("kakebo:expenses-changed", handler);
    window.addEventListener("kakebo:incomes-changed", handler);
    return () => {
      window.removeEventListener("kakebo:expenses-changed", handler);
      window.removeEventListener("kakebo:incomes-changed", handler);
    };
  }, [load]);

  const removeExpense = async (id: string) => {
    if (!confirm("¿Eliminar este gasto?")) return;
    setDeletingId(id);
    try {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
      await load();
      window.dispatchEvent(new CustomEvent("kakebo:expenses-changed"));
    } catch (e: any) {
      setErr("Error eliminando gasto: " + e.message);
    } finally {
      setDeletingId(null);
    }
  };

  const removeIncome = async (id: string) => {
    if (!confirm("¿Eliminar este ingreso?")) return;
    setDeletingId(id);
    try {
      const { error } = await supabase.from("incomes").delete().eq("id", id);
      if (error) throw error;
      await load();
      window.dispatchEvent(new CustomEvent("kakebo:incomes-changed"));
    } catch (e: any) {
      setErr("Error eliminando ingreso: " + e.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <section className="border border-border rounded-lg p-6 bg-card">
        <div className="h-6 w-32 bg-muted mb-4 animate-pulse rounded"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-muted/50 animate-pulse rounded"></div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="border border-border rounded-lg p-6 bg-card">
      <div className="font-medium text-foreground mb-4 text-sm sm:text-base">
        {t("title")}
      </div>

      {err && (
        <div className="text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-md mb-4 text-sm">
          {err}
        </div>
      )}

      {movements.length === 0 && !loading && (
        <div className="text-sm text-muted-foreground italic py-4 text-center">
          {t("empty")}
        </div>
      )}

      {movements.length > 0 && (
        <ul className="divide-y divide-border">
          {movements.map((m) => {
            const categoryKey = m.type === "expense"
              ? (API_TO_FRONTEND[m.category] || m.category)
              : null;
            const categoryMeta = categoryKey ? KAKEBO_CATEGORIES[categoryKey] : null;

            return (
              <li
                key={`${m.type}-${m.id}`}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 text-sm py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-foreground truncate">
                    {m.type === "expense"
                      ? m.note || t("noConcept")
                      : m.description || t("noDescription")}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {m.date}
                    {" · "}
                    {m.type === "expense" ? (
                      <span style={{ color: categoryMeta?.color }}>
                        {categoryMeta?.label || categoryKey}
                      </span>
                    ) : (
                      <span className="text-green-600 dark:text-green-400 font-semibold">
                        {t("incomeLabel")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={`font-semibold font-mono tabular-nums ${
                      m.type === "income"
                        ? "text-green-600 dark:text-green-400"
                        : "text-foreground"
                    }`}
                  >
                    {m.type === "income" ? "+" : "-"}
                    {money(m.amount)} €
                  </div>

                  <button
                    onClick={() =>
                      m.type === "expense" ? removeExpense(m.id) : removeIncome(m.id)
                    }
                    disabled={deletingId === m.id}
                    className="text-muted-foreground hover:text-destructive disabled:opacity-30 transition-colors p-1"
                    title={m.type === "expense" ? "Eliminar gasto" : "Eliminar ingreso"}
                  >
                    {deletingId === m.id ? "…" : "✕"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
