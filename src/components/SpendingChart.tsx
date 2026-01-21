"use client";

import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type ChartMode = "bar" | "pie";

type CategoryMeta = {
  key: string;
  label: string;
  color: string;
};

export default function SpendingChart({
  title = "Distribución por categoría",
  totals,
  categories,
}: {
  title?: string;
  totals: Record<string, number>;
  categories: CategoryMeta[];
}) {
  const [mode, setMode] = useState<ChartMode>("bar");

  const data = useMemo(() => {
    return categories.map((c) => ({
      key: c.key,
      name: c.label,
      value: Number(totals[c.key] ?? 0),
      color: c.color,
    }));
  }, [totals, categories]);

  const total = useMemo(
    () => data.reduce((acc, x) => acc + (Number(x.value) || 0), 0),
    [data]
  );

  return (
    <div className="border border-black/10 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">{title}</div>
          <div className="text-xs text-black/60">
            Total categorías: {total.toFixed(2)} €
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode("bar")}
            className={`border border-black px-3 py-1.5 text-xs hover:bg-black hover:text-white ${
              mode === "bar" ? "bg-black text-white" : ""
            }`}
            title="Ver barras"
          >
            Barras
          </button>
          <button
            onClick={() => setMode("pie")}
            className={`border border-black px-3 py-1.5 text-xs hover:bg-black hover:text-white ${
              mode === "pie" ? "bg-black text-white" : ""
            }`}
            title="Ver gráfico de queso"
          >
            Queso
          </button>
        </div>
      </div>

      <div className="h-64">
        {mode === "bar" ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: any) => [`${Number(value).toFixed(2)} €`, "Gasto"]}
              />
              <Bar dataKey="value">
                {data.map((entry) => (
                  <Cell key={entry.key} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Legend />
              <Tooltip
                formatter={(value: any) => [`${Number(value).toFixed(2)} €`, "Gasto"]}
              />
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
                label={(p: any) => {
                  const v = Number(p.value) || 0;
                  if (total <= 0) return "";
                  const pct = (v / total) * 100;
                  return pct >= 8 ? `${pct.toFixed(0)}%` : "";
                }}
              >
                {data.map((entry) => (
                  <Cell key={entry.key} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {total <= 0 && (
        <div className="text-xs text-black/60">
          No hay gastos suficientes para mostrar el gráfico.
        </div>
      )}
    </div>
  );
}
