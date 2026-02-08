"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import AIMetricsChart from "@/components/AIMetricsChart";
import AILogsList from "@/components/AILogsList";
import { AIMetrics, AILogEntry } from "@/lib/ai/metrics";

type DateRange = "7d" | "30d" | "90d" | "all";

interface EmbeddingStatus {
  totalExpenses: number;
  withEmbeddings: number;
  withoutEmbeddings: number;
  percentage: number;
  status: "complete" | "in_progress" | "not_started";
}

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

  // Embedding migration state
  const [embeddingStatus, setEmbeddingStatus] = useState<EmbeddingStatus | null>(null);
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<string | null>(null);

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
        throw new Error(data.error?.message || "Error al cargar métricas");
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

  // Fetch embedding migration status
  const fetchEmbeddingStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/ai/migrate-embeddings");
      const data = await response.json();
      if (response.ok) {
        setEmbeddingStatus(data.data);
      }
    } catch {
      // Silent fail - non-critical feature
    }
  }, []);

  useEffect(() => {
    fetchEmbeddingStatus();
  }, [fetchEmbeddingStatus]);

  // Run embedding migration
  const runMigration = async () => {
    setMigrating(true);
    setMigrationResult(null);

    try {
      const response = await fetch("/api/ai/migrate-embeddings?limit=50", {
        method: "POST",
      });
      const data = await response.json();

      if (response.ok) {
        setMigrationResult(data.data.message);
        fetchEmbeddingStatus();
      } else {
        setMigrationResult(data.error?.message || "Error en migración");
      }
    } catch (err) {
      setMigrationResult("Error de conexión");
    } finally {
      setMigrating(false);
    }
  };

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
        <span className="text-sm text-muted-foreground">Período:</span>
        {(Object.keys(DATE_RANGE_LABELS) as DateRange[]).map((range) => (
          <button
            key={range}
            onClick={() => setDateRange(range)}
            className={`px-3 py-1.5 text-sm border rounded-md transition-colors ${dateRange === range
                ? "bg-foreground text-background border-foreground font-medium"
                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/50"
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
      <div className="border border-border bg-card p-4 rounded-xl shadow-sm">
        <div className="font-medium text-foreground mb-3">Uso de tokens</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground text-xs">Tokens entrada</div>
            <div className="font-mono font-medium text-foreground">{metrics.totalInputTokens.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Tokens salida</div>
            <div className="font-mono font-medium text-foreground">{metrics.totalOutputTokens.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Total tokens</div>
            <div className="font-mono font-medium text-foreground">
              {(metrics.totalInputTokens + metrics.totalOutputTokens).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Costo por petición</div>
            <div className="font-mono font-medium text-foreground">${metrics.avgCostPerRequest.toFixed(6)}</div>
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

      {/* Embeddings Migration */}
      {embeddingStatus && (
        <div className="border border-border bg-card p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-medium text-foreground">Embeddings RAG</div>
              <div className="text-xs text-muted-foreground">
                Vectores para búsqueda semántica de gastos
              </div>
            </div>
            {embeddingStatus.status !== "complete" && (
              <button
                onClick={runMigration}
                disabled={migrating}
                className="border border-border bg-muted/50 text-foreground px-3 py-1.5 text-sm rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
              >
                {migrating ? "Procesando..." : "Generar embeddings"}
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm mb-3">
            <div>
              <div className="text-muted-foreground text-xs">Total gastos</div>
              <div className="font-mono font-medium text-foreground">{embeddingStatus.totalExpenses}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Con embedding</div>
              <div className="font-mono font-medium text-green-600 dark:text-green-400">{embeddingStatus.withEmbeddings}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Sin embedding</div>
              <div className="font-mono font-medium text-amber-600 dark:text-amber-400">{embeddingStatus.withoutEmbeddings}</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${embeddingStatus.percentage}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {embeddingStatus.percentage}% completado
            {embeddingStatus.status === "complete" && " ✓"}
          </div>

          {migrationResult && (
            <div className="mt-3 text-sm text-foreground bg-muted/50 p-2 rounded border border-border">
              {migrationResult}
            </div>
          )}
        </div>
      )}

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
      ? "border-green-200 bg-green-50/50 text-green-900 dark:bg-green-900/20 dark:border-green-800 dark:text-green-100"
      : highlight === "yellow"
        ? "border-amber-200 bg-amber-50/50 text-amber-900 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-100"
        : highlight === "red"
          ? "border-red-200 bg-red-50/50 text-red-900 dark:bg-red-900/20 dark:border-red-800 dark:text-red-100"
          : "border-border bg-card text-foreground";

  return (
    <div className={`border p-4 rounded-xl shadow-sm transition-colors ${highlightClass}`}>
      <div className="text-xs opacity-70 mb-1">{label}</div>
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
      {subtitle && <div className="text-xs opacity-60 mt-1">{subtitle}</div>}
    </div>
  );
}
