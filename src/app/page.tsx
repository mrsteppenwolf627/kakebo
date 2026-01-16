"use client";

import { useEffect, useMemo, useState } from "react";
import type { Settings, Transaction } from "@/lib/types";
import { CATEGORY_LABEL } from "@/lib/types";
import { loadSettings, loadTransactions } from "@/lib/storage";
import { filterByMonth, sumAmount, sumByCategory } from "@/lib/kakebo";

function currentMonth(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export default function Home() {
  const [settings, setSettings] = useState<Settings>({
    monthlyIncome: 0,
    savingsGoal: 0,
  });
  const [txs, setTxs] = useState<Transaction[]>([]);
  const month = useMemo(() => currentMonth(), []);

  useEffect(() => {
    setSettings(loadSettings());
    setTxs(loadTransactions());
  }, []);

  const monthTxs = useMemo(() => filterByMonth(txs, month), [txs, month]);
  const spent = useMemo(() => sumAmount(monthTxs), [monthTxs]);
  const byCat = useMemo(() => sumByCategory(monthTxs), [monthTxs]);
  const saved = settings.monthlyIncome - spent;

  return (
    <main className="min-h-screen p-6 max-w-3xl mx-auto space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold">Kakebo</h1>
        <p className="text-sm text-muted-foreground">
          Mes: <span className="font-medium">{month}</span>
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">Ingresos</p>
          <p className="text-2xl font-semibold">
            {settings.monthlyIncome.toFixed(2)} €
          </p>
        </div>

        <div className="rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">Gastado</p>
          <p className="text-2xl font-semibold">{spent.toFixed(2)} €</p>
        </div>

        <div className="rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">Ahorro (estimado)</p>
          <p className="text-2xl font-semibold">{saved.toFixed(2)} €</p>
        </div>
      </section>

      <section className="rounded-xl border p-4 space-y-3">
        <h2 className="text-lg font-semibold">Gasto por categoría</h2>
        <div className="space-y-2">
          {Object.entries(byCat).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between">
              <span className="text-sm">
                {CATEGORY_LABEL[k as keyof typeof CATEGORY_LABEL]}
              </span>
              <span className="font-medium">{v.toFixed(2)} €</span>
            </div>
          ))}
        </div>
      </section>

      <section className="text-sm text-muted-foreground">
        Próximo paso: pantalla de Ajustes + formulario “Nuevo gasto”.
      </section>
    </main>
  );
}
