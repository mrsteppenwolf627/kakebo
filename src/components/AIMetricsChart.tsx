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
  CartesianGrid,
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
  "#cf5c5c", // Terracota
  "#818cf8", // Índigo
  "#84cc16", // Matcha
  "#c084fc", // Wisteria
  "#fbbf24", // Ámbar
  "#06b6d4", // Cyan
];

import { useTheme } from "next-themes";

// ... (imports remain)

export default function AIMetricsChart({
  title,
  subtitle,
  data,
  valueFormatter = (v) => v.toString(),
}: AIMetricsChartProps) {
  const [mode, setMode] = useState<ChartMode>("bar");
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const chartColors = useMemo(() => {
    return {
      text: isDark ? "#faaf9f" : "#1c1917", // text-foreground
      muted: isDark ? "#a8a29e" : "#78716c", // text-muted-foreground
      grid: isDark ? "#44403c" : "#e7e5e4", // border-border (approx)
      tooltipBg: isDark ? "#292524" : "#ffffff", // bg-card
      tooltipBorder: isDark ? "#44403c" : "#e7e5e4", // border-border
    };
  }, [isDark]);

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
      <div className="border border-border bg-card p-4 rounded-xl shadow-sm">
        <div className="font-medium text-foreground">{title}</div>
        {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
        <div className="mt-4 text-sm text-muted-foreground italic">No hay datos disponibles</div>
      </div>
    );
  }

  return (
    <div className="border border-border bg-card p-4 space-y-4 rounded-xl shadow-sm transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium text-foreground">{title}</div>
          {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
        </div>

        <div className="flex items-center gap-1 bg-muted p-0.5 rounded-md">
          <button
            onClick={() => setMode("bar")}
            className={`px-3 py-1 text-xs rounded-sm transition-all ${mode === "bar" ? "bg-card text-foreground shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"
              }`}
            title="Ver barras"
          >
            Barras
          </button>
          <button
            onClick={() => setMode("pie")}
            className={`px-3 py-1 text-xs rounded-sm transition-all ${mode === "pie" ? "bg-card text-foreground shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"
              }`}
            title="Ver gráfico circular"
          >
            Circular
          </button>
        </div>
      </div>

      <div className="h-64 w-full">
        {mode === "bar" ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chartColors.grid} />
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 12, fill: chartColors.muted }}
                width={100}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: isDark ? "#44403c" : "#f5f5f4" }}
                contentStyle={{
                  backgroundColor: chartColors.tooltipBg,
                  borderColor: chartColors.tooltipBorder,
                  borderRadius: "6px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                  fontSize: "12px",
                  color: chartColors.text,
                }}
                formatter={(value) => [valueFormatter(Number(value)), "Valor"]}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                {chartData.map((entry) => (
                  <Cell key={entry.key} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                contentStyle={{
                  backgroundColor: chartColors.tooltipBg,
                  borderColor: chartColors.tooltipBorder,
                  borderRadius: "6px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                  fontSize: "12px",
                  color: chartColors.text,
                }}
                formatter={(value) => [valueFormatter(Number(value)), "Valor"]}
              />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                label={(p: { value: number }) => {
                  const v = Number(p.value) || 0;
                  if (total <= 0) return "";
                  const pct = (v / total) * 100;
                  return pct >= 5 ? `${pct.toFixed(0)}%` : "";
                }}
                labelLine={false}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.key} fill={entry.color} strokeWidth={0} />
                ))}
              </Pie>
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span className="text-xs ml-1" style={{ color: chartColors.muted }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
