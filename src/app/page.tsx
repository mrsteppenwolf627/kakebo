"use client";

import { useMemo, useState } from "react";
import AuthGate from "@/components/AuthGate";
import ExpenseCalendar from "@/components/ExpenseCalendar";

export default function HomePage() {
  const now = useMemo(() => new Date(), []);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12

  return (
    <AuthGate>
      <main className="min-h-screen px-6 py-10">
        <div className="max-w-5xl mx-auto space-y-6">
          <h1 className="text-4xl font-semibold">Kakebo Ahorro</h1>
          <p className="text-black/60">Registra tus gastos y visualízalos en calendario.</p>

          <div className="flex items-end gap-3 border border-black/10 p-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-black/60">Año</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="border border-black/20 px-3 py-2 text-sm"
                min={2000}
                max={2100}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-black/60">Mes</label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="border border-black/20 px-3 py-2 text-sm"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="ml-auto text-xs text-black/60">
              Mostrando: {year}-{String(month).padStart(2, "0")}
            </div>
          </div>

          <ExpenseCalendar year={year} month={month} />
        </div>
      </main>
    </AuthGate>
  );
}
