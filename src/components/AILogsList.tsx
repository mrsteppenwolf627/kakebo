"use client";

import { AILogEntry } from "@/lib/ai/metrics";

/**
 * Map AI categories (English) to frontend labels (Spanish)
 */
const CATEGORY_LABELS: Record<string, string> = {
  survival: "Supervivencia",
  optional: "Opcional",
  culture: "Cultura",
  extra: "Extra",
};

interface AILogsListProps {
  logs: AILogEntry[];
}

export default function AILogsList({ logs }: AILogsListProps) {
  if (logs.length === 0) {
    return (
      <div className="border border-border bg-card p-4 rounded-xl shadow-sm">
        <div className="font-medium text-foreground mb-2">Logs recientes</div>
        <div className="text-sm text-muted-foreground">No hay logs disponibles</div>
      </div>
    );
  }

  return (
    <div className="border border-border bg-card p-4 rounded-xl shadow-sm">
      <div className="font-medium text-foreground mb-3">Logs recientes</div>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {logs.map((log) => {
          const output = log.output as { category?: string; note?: string; confidence?: number } | null;
          const category = output?.category;
          const confidence = output?.confidence;

          return (
            <div
              key={log.id}
              className={`border p-3 text-sm rounded-lg transition-colors ${log.was_corrected
                  ? "border-amber-200 bg-amber-50/50 dark:bg-amber-900/10 dark:border-amber-800"
                  : log.success
                    ? "border-border bg-muted/20"
                    : "border-red-200 bg-red-50/50 dark:bg-red-900/10 dark:border-red-800"
                }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground truncate" title={log.input}>
                    {log.input}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1">
                      <span className="font-medium">Tipo:</span>
                      {log.type === "classification" ? "Clasificación" : "Asistente"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="font-medium">Modelo:</span>
                      {log.model}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="font-medium">Latencia:</span>
                      {log.latency_ms}ms
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="font-medium">Costo:</span>
                      ${log.cost_usd.toFixed(6)}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {log.success ? (
                    <span className="text-green-600 dark:text-green-400 text-xs font-medium">OK</span>
                  ) : (
                    <span className="text-red-600 dark:text-red-400 text-xs font-medium">Error</span>
                  )}
                </div>
              </div>

              {log.type === "classification" && category && (
                <div className="mt-2 text-xs text-foreground">
                  <span className="font-medium text-muted-foreground">Categoría IA:</span>{" "}
                  {CATEGORY_LABELS[category] || category}
                  {confidence !== undefined && (
                    <span className="ml-2 text-muted-foreground/70">
                      ({(confidence * 100).toFixed(0)}% confianza)
                    </span>
                  )}
                </div>
              )}

              {log.was_corrected && (
                <div className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                  <span className="font-medium">Corregido a:</span>{" "}
                  {CATEGORY_LABELS[log.corrected_category || ""] || log.corrected_category}
                </div>
              )}

              {log.error_message && (
                <div className="mt-1 text-xs text-destructive">
                  Error: {log.error_message}
                </div>
              )}

              <div className="mt-2 text-xs text-muted-foreground/50">
                {log.created_at
                  ? new Date(log.created_at).toLocaleString("es-ES")
                  : "Fecha desconocida"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
