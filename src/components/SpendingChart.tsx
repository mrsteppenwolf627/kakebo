"use client";

import { useMemo, useState, useEffect } from "react";
import { useTheme } from "next-themes";
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

  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (theme === "dark" || resolvedTheme === "dark");
  const axisColor = isDark ? "#a8a29e" : "#57534e";
  const gridColor = isDark ? "#44403c" : "#e7e5e4";
  const tooltipBg = isDark ? "#292524" : "#ffffff";
  const tooltipBorder = isDark ? "#44403c" : "#e7e5e4";
  const tooltipText = isDark ? "#fafaf9" : "#1c1917";

  const total = useMemo(
    () => data.reduce((acc, x) => acc + (Number(x.value) || 0), 0),
    [data]
  );

  if (!mounted) return <div className="h-64 w-full bg-muted/20 animate-pulse rounded-lg" />;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-muted-foreground">
            Total: <span className="font-medium text-foreground">{total.toFixed(2)} €</span>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-md">
          <button
            onClick={() => setMode("bar")}
            className={`px-3 py-1 text-xs rounded-sm transition-all ${mode === "bar" ? "bg-white text-stone-900 shadow-sm font-medium" : "text-stone-500 hover:text-stone-700"
              }`}
            title="Ver barras"
          >
            Barras
          </button>
          <button
            onClick={() => setMode("pie")}
            className={`px-3 py-1 text-xs rounded-sm transition-all ${mode === "pie" ? "bg-white text-stone-900 shadow-sm font-medium" : "text-stone-500 hover:text-stone-700"
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
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor} />
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 12, fill: axisColor }}
                width={100}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: isDark ? "#44403c" : "#f5f5f4" }}
                contentStyle={{
                  backgroundColor: tooltipBg,
                  borderColor: tooltipBorder,
                  color: tooltipText,
                  borderRadius: "6px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                  fontSize: "12px",
                }}
                itemStyle={{ color: tooltipText }}
                formatter={(value: any) => [`${Number(value).toFixed(2)} €`, "Gasto"]}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                {data.map((entry) => (
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
                  backgroundColor: tooltipBg,
                  borderColor: tooltipBorder,
                  color: tooltipText,
                  borderRadius: "6px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                  fontSize: "12px",
                }}
                itemStyle={{ color: tooltipText }}
                formatter={(value: any) => [`${Number(value).toFixed(2)} €`, "Gasto"]}
              />
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                label={(p: any) => {
                  const v = Number(p.value) || 0;
                  if (total <= 0) return "";
                  const pct = (v / total) * 100;
                  return pct >= 5 ? `${pct.toFixed(0)}%` : "";
                }}
                labelLine={false}
              >
                {data.map((entry) => (
                  <Cell key={entry.key} fill={entry.color} strokeWidth={1} stroke={tooltipBg} />
                ))}
              </Pie>
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span style={{ color: axisColor }} className="text-xs ml-1">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {total <= 0 && (
        <div className="text-xs text-center text-stone-400 italic">
          No hay gastos suficientes para mostrar el gráfico.
        </div>
      )}
    </div>
  );
}
