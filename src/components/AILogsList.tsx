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
      <div className="border border-black/10 p-4">
        <div className="font-semibold mb-2">Logs recientes</div>
        <div className="text-sm text-black/50">No hay logs disponibles</div>
      </div>
    );
  }

  return (
    <div className="border border-black/10 p-4">
      <div className="font-semibold mb-3">Logs recientes</div>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {logs.map((log) => {
          const output = log.output as { category?: string; note?: string; confidence?: number } | null;
          const category = output?.category;
          const confidence = output?.confidence;

          return (
            <div
              key={log.id}
              className={`border p-3 text-sm ${
                log.was_corrected
                  ? "border-amber-300 bg-amber-50"
                  : log.success
                  ? "border-black/10"
                  : "border-red-300 bg-red-50"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate" title={log.input}>
                    {log.input}
                  </div>
                  <div className="text-xs text-black/60 mt-1 flex flex-wrap gap-2">
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
                    <span className="text-green-600 text-xs">OK</span>
                  ) : (
                    <span className="text-red-600 text-xs">Error</span>
                  )}
                </div>
              </div>

              {log.type === "classification" && category && (
                <div className="mt-2 text-xs">
                  <span className="font-medium">Categoría IA:</span>{" "}
                  {CATEGORY_LABELS[category] || category}
                  {confidence !== undefined && (
                    <span className="ml-2 text-black/50">
                      ({(confidence * 100).toFixed(0)}% confianza)
                    </span>
                  )}
                </div>
              )}

              {log.was_corrected && (
                <div className="mt-1 text-xs text-amber-700">
                  <span className="font-medium">Corregido a:</span>{" "}
                  {CATEGORY_LABELS[log.corrected_category || ""] || log.corrected_category}
                </div>
              )}

              {log.error_message && (
                <div className="mt-1 text-xs text-red-600">
                  Error: {log.error_message}
                </div>
              )}

              <div className="mt-2 text-xs text-black/40">
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
