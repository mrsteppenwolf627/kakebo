import { describe, expect, it } from "vitest";
import { scannerPersistenceError, requireIdempotencyKey, scannerStartTicketSchema } from "@/lib/scanner/http";

describe("scanner HTTP contracts", () => {
  it("requires a UUID v4 idempotency key", () => {
    expect(requireIdempotencyKey("550e8400-e29b-41d4-a716-446655440000")).toBe("550e8400-e29b-41d4-a716-446655440000");
    for (const value of [null, "", "not-a-uuid", "550e8400-e29b-11d4-a716-446655440000"]) {
      expect(() => requireIdempotencyKey(value)).toThrowError(/Idempotency-Key/);
    }
  });

  it("rejects unknown fields and impossible declared uploads", () => {
    expect(scannerStartTicketSchema.safeParse({ source: "image", locale: "es", declaredMime: "image/jpeg", declaredSizeBytes: 100 }).success).toBe(true);
    expect(scannerStartTicketSchema.safeParse({ source: "image", locale: "es", declaredMime: "image/jpeg", declaredSizeBytes: 100, extra: true }).success).toBe(false);
    expect(scannerStartTicketSchema.safeParse({ source: "image", locale: "es", declaredMime: "image/jpeg", declaredSizeBytes: -1 }).success).toBe(false);
    expect(scannerStartTicketSchema.safeParse({ source: "pdf", locale: "es", declaredMime: "image/jpeg", declaredSizeBytes: 100 }).success).toBe(false);
  });

  it("maps persistence failures to neutral HTTP errors", () => {
    expect(scannerPersistenceError("NO_OPEN_CYCLE")).toMatchObject({ code: "CONFLICT", status: 409 });
    expect(scannerPersistenceError("TICKET_NOT_FOUND")).toMatchObject({ code: "NOT_FOUND", status: 404 });
    expect(scannerPersistenceError("BACKEND_ERROR")).toMatchObject({ code: "ACCESS_UNAVAILABLE", status: 503 });
  });
});
