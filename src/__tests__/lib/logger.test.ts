import { describe, it, expect, vi, beforeEach } from "vitest";

// We need to test the logger utility functions, but since pino actually logs,
// we'll test the function signatures and that they don't throw

describe("Logger", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("should export logger instance", async () => {
    const { logger } = await import("@/lib/logger");
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.error).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.debug).toBe("function");
  });

  it("should export createRequestLogger function", async () => {
    const { createRequestLogger } = await import("@/lib/logger");
    expect(typeof createRequestLogger).toBe("function");

    const requestLogger = createRequestLogger({
      requestId: "test-123",
      userId: "user-456",
      path: "/api/test",
      method: "GET",
    });

    expect(requestLogger).toBeDefined();
    expect(typeof requestLogger.info).toBe("function");
  });

  it("should export module-specific loggers", async () => {
    const { apiLogger, authLogger, dbLogger } = await import("@/lib/logger");

    expect(apiLogger).toBeDefined();
    expect(authLogger).toBeDefined();
    expect(dbLogger).toBeDefined();
  });

  it("should export utility logging functions", async () => {
    const {
      logApiRequest,
      logApiResponse,
      logApiError,
      logAuthEvent,
      logDbQuery,
    } = await import("@/lib/logger");

    expect(typeof logApiRequest).toBe("function");
    expect(typeof logApiResponse).toBe("function");
    expect(typeof logApiError).toBe("function");
    expect(typeof logAuthEvent).toBe("function");
    expect(typeof logDbQuery).toBe("function");
  });

  it("logApiRequest should not throw", async () => {
    const { logApiRequest } = await import("@/lib/logger");

    expect(() => {
      logApiRequest("GET", "/api/test", "user-123", { extra: "data" });
    }).not.toThrow();
  });

  it("logApiResponse should not throw", async () => {
    const { logApiResponse } = await import("@/lib/logger");

    expect(() => {
      logApiResponse("GET", "/api/test", 200, 50);
    }).not.toThrow();

    expect(() => {
      logApiResponse("POST", "/api/test", 400, 100);
    }).not.toThrow();

    expect(() => {
      logApiResponse("DELETE", "/api/test", 500, 200);
    }).not.toThrow();
  });

  it("logApiError should not throw", async () => {
    const { logApiError } = await import("@/lib/logger");

    expect(() => {
      logApiError("GET", "/api/test", new Error("Test error"));
    }).not.toThrow();

    expect(() => {
      logApiError("POST", "/api/test", "string error");
    }).not.toThrow();
  });

  it("logAuthEvent should not throw", async () => {
    const { logAuthEvent } = await import("@/lib/logger");

    expect(() => {
      logAuthEvent("login", "user-123");
    }).not.toThrow();

    expect(() => {
      logAuthEvent("error", undefined, { reason: "invalid token" });
    }).not.toThrow();
  });

  it("logDbQuery should not throw", async () => {
    const { logDbQuery } = await import("@/lib/logger");

    expect(() => {
      logDbQuery("expenses", "select", 15);
    }).not.toThrow();

    expect(() => {
      logDbQuery("months", "insert", undefined, { rowsAffected: 1 });
    }).not.toThrow();
  });
});
