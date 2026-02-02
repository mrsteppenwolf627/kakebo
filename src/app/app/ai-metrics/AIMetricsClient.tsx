"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import AIMetricsChart from "@/components/AIMetricsChart";
import AILogsList from "@/components/AILogsList";
import { AIMetrics, AILogEntry } from "@/lib/ai/metrics";

type DateRange = "7d" | "30d" | "90d" | "all";

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  "7d": "7 días",
  "30d": "30 días",
  "90d": "90 días",
  all: "Todo",
};

function getDateRangeStart(range: DateRange): string | undefined {
  if (range === "all") return undefined;
  const days = parseInt(range);
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

export default function AIMetricsClient() {
  const supabase = useMemo(() => createClient(), []);

  const [metrics, setMetrics] = useState<AIMetrics | null>(null);
  const [logs, setLogs] = useState<AILogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>("30d");

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const startDate = getDateRangeStart(dateRange);
      const params = new URLSearchParams({
        includeLogs: "true",
        logsLimit: "50",
      });
      if (startDate) {
        params.set("startDate", startDate);
      }

      const response = await fetch(`/api/ai/metrics?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al cargar métricas");
      }

      setMetrics(data.data.metrics);
      setLogs(data.data.logs || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Prepare chart data for type distribution
  const typeChartData = useMemo(() => {
    if (!metrics) return [];
    return [
      {
        key: "classification",
        name: "Clasificación",
        value: metrics.byType.classification,
        color: "#2563eb",
      },
      {
        key: "assistant",
        name: "Asistente",
        value: metrics.byType.assistant,
        color: "#16a34a",
      },
    ];
  }, [metrics]);

  // Prepare chart data for model distribution
  const modelChartData = useMemo(() => {
    if (!metrics) return [];
    const colors = ["#9333ea", "#f59e0b", "#06b6d4", "#dc2626"];
    return Object.entries(metrics.byModel).map(([model, count], index) => ({
      key: model,
      name: model,
      value: count,
      color: colors[index % colors.length],
    }));
  }, [metrics]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-black/10 rounded w-48" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-black/10 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red-300 bg-red-50 p-4 text-red-700">
        <div className="font-medium">Error</div>
        <div className="text-sm">{error}</div>
        <button
          onClick={fetchMetrics}
          className="mt-2 text-sm underline hover:no-underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-black/50">No hay métricas disponibles</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date range filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-black/60">Período:</span>
        {(Object.keys(DATE_RANGE_LABELS) as DateRange[]).map((range) => (
          <button
            key={range}
            onClick={() => setDateRange(range)}
            className={`px-3 py-1.5 text-sm border hover:bg-black hover:text-white ${
              dateRange === range
                ? "bg-black text-white border-black"
                : "border-black/20"
            }`}
          >
            {DATE_RANGE_LABELS[range]}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricCard
          label="Total peticiones"
          value={metrics.totalRequests.toString()}
        />
        <MetricCard
          label="Tasa de éxito"
          value={`${metrics.successRate.toFixed(1)}%`}
          highlight={metrics.successRate >= 95 ? "green" : metrics.successRate >= 80 ? "yellow" : "red"}
        />
        <MetricCard
          label="Costo total"
          value={`$${metrics.totalCostUsd.toFixed(4)}`}
        />
        <MetricCard
          label="Latencia media"
          value={`${metrics.avgLatencyMs}ms`}
        />
        <MetricCard
          label="Accuracy"
          value={`${metrics.classificationAccuracy}%`}
          subtitle={`${metrics.classificationsCorrected} correcciones de ${metrics.classificationsTotal}`}
          highlight={metrics.classificationAccuracy >= 90 ? "green" : metrics.classificationAccuracy >= 70 ? "yellow" : "red"}
        />
      </div>

      {/* Token usage */}
      <div className="border border-black/10 p-4">
        <div className="font-semibold mb-2">Uso de tokens</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-black/60">Tokens entrada</div>
            <div className="font-medium">{metrics.totalInputTokens.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-black/60">Tokens salida</div>
            <div className="font-medium">{metrics.totalOutputTokens.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-black/60">Total tokens</div>
            <div className="font-medium">
              {(metrics.totalInputTokens + metrics.totalOutputTokens).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-black/60">Costo por petición</div>
            <div className="font-medium">${metrics.avgCostPerRequest.toFixed(6)}</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <AIMetricsChart
          title="Por tipo"
          subtitle={`Total: ${metrics.totalRequests}`}
          data={typeChartData}
        />
        <AIMetricsChart
          title="Por modelo"
          data={modelChartData}
        />
      </div>

      {/* Logs list */}
      <AILogsList logs={logs} />
    </div>
  );
}

function MetricCard({
  label,
  value,
  subtitle,
  highlight,
}: {
  label: string;
  value: string;
  subtitle?: string;
  highlight?: "green" | "yellow" | "red";
}) {
  const highlightClass =
    highlight === "green"
      ? "border-green-300 bg-green-50"
      : highlight === "yellow"
      ? "border-amber-300 bg-amber-50"
      : highlight === "red"
      ? "border-red-300 bg-red-50"
      : "border-black/10";

  return (
    <div className={`border p-4 ${highlightClass}`}>
      <div className="text-xs text-black/60">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
      {subtitle && <div className="text-xs text-black/50 mt-1">{subtitle}</div>}
    </div>
  );
}
