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

type DataItem = {
  key: string;
  name: string;
  value: number;
  color: string;
};

interface AIMetricsChartProps {
  title: string;
  subtitle?: string;
  data: DataItem[];
  valueFormatter?: (value: number) => string;
}

const DEFAULT_COLORS = [
  "#2563eb", // blue
  "#16a34a", // green
  "#dc2626", // red
  "#9333ea", // purple
  "#f59e0b", // amber
  "#06b6d4", // cyan
];

export default function AIMetricsChart({
  title,
  subtitle,
  data,
  valueFormatter = (v) => v.toString(),
}: AIMetricsChartProps) {
  const [mode, setMode] = useState<ChartMode>("bar");

  const chartData = useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
    }));
  }, [data]);

  const total = useMemo(
    () => chartData.reduce((acc, x) => acc + (Number(x.value) || 0), 0),
    [chartData]
  );

  if (chartData.length === 0) {
    return (
      <div className="border border-black/10 p-4">
        <div className="font-semibold">{title}</div>
        {subtitle && <div className="text-xs text-black/60">{subtitle}</div>}
        <div className="mt-4 text-sm text-black/50">No hay datos disponibles</div>
      </div>
    );
  }

  return (
    <div className="border border-black/10 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">{title}</div>
          {subtitle && <div className="text-xs text-black/60">{subtitle}</div>}
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
            title="Ver gráfico circular"
          >
            Circular
          </button>
        </div>
      </div>

      <div className="h-64">
        {mode === "bar" ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value) => [valueFormatter(Number(value)), "Valor"]}
              />
              <Bar dataKey="value">
                {chartData.map((entry) => (
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
                formatter={(value) => [valueFormatter(Number(value)), "Valor"]}
              />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
                label={(p: { value: number }) => {
                  const v = Number(p.value) || 0;
                  if (total <= 0) return "";
                  const pct = (v / total) * 100;
                  return pct >= 8 ? `${pct.toFixed(0)}%` : "";
                }}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.key} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
