import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

// Create base logger
export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
  ...(isDev
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss",
            ignore: "pid,hostname",
          },
        },
      }
    : {
        // Production: JSON format for log aggregation (CloudWatch, etc.)
        formatters: {
          level: (label) => ({ level: label }),
        },
        timestamp: pino.stdTimeFunctions.isoTime,
      }),
});

// Request context logger factory
export function createRequestLogger(context: {
  requestId?: string;
  userId?: string;
  path?: string;
  method?: string;
}) {
  return logger.child({
    ...context,
    timestamp: new Date().toISOString(),
  });
}

// API-specific loggers
export const apiLogger = logger.child({ module: "api" });
export const authLogger = logger.child({ module: "auth" });
export const dbLogger = logger.child({ module: "database" });

// Utility functions for common log patterns
export function logApiRequest(
  method: string,
  path: string,
  userId?: string,
  extra?: Record<string, unknown>
) {
  apiLogger.info({ method, path, userId, ...extra }, `${method} ${path}`);
}

export function logApiResponse(
  method: string,
  path: string,
  status: number,
  durationMs: number,
  extra?: Record<string, unknown>
) {
  const level = status >= 500 ? "error" : status >= 400 ? "warn" : "info";
  apiLogger[level](
    { method, path, status, durationMs, ...extra },
    `${method} ${path} -> ${status} (${durationMs}ms)`
  );
}

export function logApiError(
  method: string,
  path: string,
  error: Error | unknown,
  extra?: Record<string, unknown>
) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  apiLogger.error(
    { method, path, error: errorMessage, stack: errorStack, ...extra },
    `${method} ${path} ERROR: ${errorMessage}`
  );
}

export function logAuthEvent(
  event: "login" | "logout" | "signup" | "token_refresh" | "error",
  userId?: string,
  extra?: Record<string, unknown>
) {
  const level = event === "error" ? "error" : "info";
  authLogger[level]({ event, userId, ...extra }, `Auth: ${event}`);
}

export function logDbQuery(
  table: string,
  operation: "select" | "insert" | "update" | "delete",
  durationMs?: number,
  extra?: Record<string, unknown>
) {
  dbLogger.debug(
    { table, operation, durationMs, ...extra },
    `DB ${operation.toUpperCase()} on ${table}${durationMs ? ` (${durationMs}ms)` : ""}`
  );
}

export default logger;
