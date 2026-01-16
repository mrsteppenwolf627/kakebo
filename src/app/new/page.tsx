"use client";

import { useEffect, useMemo, useState } from "react";
import type { Settings, Transaction, Category } from "@/lib/types";
import { CATEGORY_LABEL } from "@/lib/types";
import { loadSettings, loadTransactions } from "@/lib/storage";
import { filterByMonth, sumAmount, sumByCategory } from "@/lib/kakebo";

function currentMonth(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
      <div
        className="h-full bg-black transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function CategoryRow({
  name,
  value,
  total,
}: {
  name: string;
  value: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{name}</span>
        <span className="font-medium">{value.toFixed(2)} €</span>
      </div>
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-black"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
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
    <main className="min-h-screen p-6 max-w-3xl mx-auto space-y-8">
      <header className="space-y-1">
        <h1 className="text-4xl font-bold tracking-tight">Kakebo</h1>
        <p className="text-sm text-muted-foreground">
          Mes activo: <span className="font-medium">{month}</span>
        </p>
      </header>

      {/* Tarjetas principales */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border p-5 space-y-2">
          <p className="text-sm text-muted-foreground">Ingresos</p>
          <p className="text-3xl font-semibold">
            {settings.monthlyIncome.toFixed(2)} €
          </p>
        </div>

        <div className="rounded-2xl border p-5 space-y-2">
          <p className="text-sm text-muted-foreground">Gastado</p>
          <p className="text-3xl font-semibold">{spent.toFixed(2)} €</p>
        </div>

        <div className="rounded-2xl border p-5 space-y-2">
          <p className="text-sm text-muted-foreground">Ahorro</p>
          <p className="text-3xl font-semibold">{saved.toFixed(2)} €</p>
          <ProgressBar value={saved} max={settings.savingsGoal} />
          <p className="text-xs text-muted-foreground">
            Objetivo: {settings.savingsGoal.toFixed(2)} €
          </p>
        </div>
      </section>

      {/* Categorías */}
      <section className="rounded-2xl border p-5 space-y-4">
        <h2 className="text-lg font-semibold">Distribución de gasto</h2>
        <div className="space-y-3">
          {Object.entries(byCat).map(([k, v]) => (
            <CategoryRow
              key={k}
              name={CATEGORY_LABEL[k as Category]}
              value={v}
              total={spent}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
