import { describe, it, expect, vi } from "vitest";
import { ZodError, z } from "zod";
import {
  ApiError,
  apiErrors,
  formatZodError,
  handleApiError,
} from "@/lib/api/errors";

// Mock the logger to avoid actual logging during tests
vi.mock("@/lib/logger", () => ({
  apiLogger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

describe("API Errors", () => {
  describe("ApiError", () => {
    it("should create error with all properties", () => {
      const error = new ApiError("TEST_ERROR", "Test message", 400, {
        field: "test",
      });

      expect(error.code).toBe("TEST_ERROR");
      expect(error.message).toBe("Test message");
      expect(error.status).toBe(400);
      expect(error.details).toEqual({ field: "test" });
      expect(error.name).toBe("ApiError");
    });

    it("should default status to 400", () => {
      const error = new ApiError("TEST", "Test");
      expect(error.status).toBe(400);
    });
  });

  describe("apiErrors factory functions", () => {
    it("should create unauthorized error", () => {
      const error = apiErrors.unauthorized();
      expect(error.status).toBe(401);
      expect(error.code).toBe("UNAUTHORIZED");
    });

    it("should create forbidden error", () => {
      const error = apiErrors.forbidden();
      expect(error.status).toBe(403);
      expect(error.code).toBe("FORBIDDEN");
    });

    it("should create notFound error with custom resource", () => {
      const error = apiErrors.notFound("Expense");
      expect(error.status).toBe(404);
      expect(error.message).toBe("Expense no encontrado");
    });

    it("should create badRequest error", () => {
      const error = apiErrors.badRequest("Invalid data", { field: "email" });
      expect(error.status).toBe(400);
      expect(error.message).toBe("Invalid data");
      expect(error.details).toEqual({ field: "email" });
    });

    it("should create conflict error", () => {
      const error = apiErrors.conflict("Already exists");
      expect(error.status).toBe(409);
      expect(error.message).toBe("Already exists");
    });

    it("should create validation error", () => {
      const error = apiErrors.validation("Validation failed", { errors: [] });
      expect(error.status).toBe(422);
      expect(error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("formatZodError", () => {
    it("should format single field error", () => {
      const schema = z.object({
        email: z.string().email(),
      });

      const result = schema.safeParse({ email: "invalid" });
      if (!result.success) {
        const formatted = formatZodError(result.error);
        expect(formatted.details).toHaveProperty("email");
        expect(formatted.message).toContain("email");
      }
    });

    it("should format multiple field errors", () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18),
      });

      const result = schema.safeParse({ email: "invalid", age: 10 });
      if (!result.success) {
        const formatted = formatZodError(result.error);
        expect(formatted.details).toHaveProperty("email");
        expect(formatted.details).toHaveProperty("age");
      }
    });

    it("should format nested field errors", () => {
      const schema = z.object({
        user: z.object({
          name: z.string().min(1),
        }),
      });

      const result = schema.safeParse({ user: { name: "" } });
      if (!result.success) {
        const formatted = formatZodError(result.error);
        expect(formatted.details).toHaveProperty("user.name");
      }
    });
  });

  describe("handleApiError", () => {
    it("should handle ZodError", async () => {
      const schema = z.object({
        email: z.string().email(),
      });

      const result = schema.safeParse({ email: "invalid" });
      if (!result.success) {
        const response = handleApiError(result.error);
        expect(response.status).toBe(422);

        const body = await response.json();
        expect(body.error.code).toBe("VALIDATION_ERROR");
      }
    });

    it("should handle ApiError with 401 status", async () => {
      const error = apiErrors.unauthorized();
      const response = handleApiError(error);

      expect(response.status).toBe(401);
    });

    it("should handle ApiError with 403 status", async () => {
      const error = apiErrors.forbidden();
      const response = handleApiError(error);

      expect(response.status).toBe(403);
    });

    it("should handle ApiError with 404 status", async () => {
      const error = apiErrors.notFound("Item");
      const response = handleApiError(error);

      expect(response.status).toBe(404);
    });

    it("should handle ApiError with 409 status", async () => {
      const error = apiErrors.conflict("Duplicate");
      const response = handleApiError(error);

      expect(response.status).toBe(409);
    });

    it("should handle ApiError with 422 status", async () => {
      const error = apiErrors.validation("Invalid", {});
      const response = handleApiError(error);

      expect(response.status).toBe(422);
    });

    it("should handle Supabase PGRST116 error (not found)", async () => {
      const error = { code: "PGRST116", message: "Row not found" };
      const response = handleApiError(error);

      expect(response.status).toBe(404);
    });

    it("should handle Supabase 23505 error (unique violation)", async () => {
      const error = { code: "23505", message: "Duplicate key" };
      const response = handleApiError(error);

      expect(response.status).toBe(409);
    });

    it("should handle Supabase 23503 error (foreign key)", async () => {
      const error = { code: "23503", message: "FK violation" };
      const response = handleApiError(error);

      expect(response.status).toBe(400);
    });

    it("should handle Supabase 42501 error (RLS)", async () => {
      const error = { code: "42501", message: "RLS violation" };
      const response = handleApiError(error);

      expect(response.status).toBe(403);
    });

    it("should handle unknown errors as 500", async () => {
      const error = new Error("Unknown error");
      const response = handleApiError(error);

      expect(response.status).toBe(500);
    });

    it("should handle non-Error objects", async () => {
      const response = handleApiError("string error");

      expect(response.status).toBe(500);
    });
  });
});
