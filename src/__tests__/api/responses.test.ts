import { describe, it, expect } from "vitest";
import { responses, successResponse, errorResponse } from "@/lib/api/responses";

describe("API Responses", () => {
  describe("successResponse", () => {
    it("should return 200 with data by default", async () => {
      const data = { id: 1, name: "Test" };
      const response = successResponse(data);

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toEqual(data);
    });

    it("should allow custom status code", async () => {
      const data = { id: 1 };
      const response = successResponse(data, 201);

      expect(response.status).toBe(201);
    });
  });

  describe("errorResponse", () => {
    it("should return error with code and message", async () => {
      const response = errorResponse("TEST_ERROR", "Test message", 400);

      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("TEST_ERROR");
      expect(body.error.message).toBe("Test message");
    });

    it("should include details when provided", async () => {
      const details = { field: "email" };
      const response = errorResponse("TEST", "Test", 400, details);

      const body = await response.json();
      expect(body.error.details).toEqual(details);
    });
  });

  describe("responses.ok", () => {
    it("should return 200 with data", async () => {
      const data = { id: 1, name: "Test" };
      const response = responses.ok(data);

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toEqual(data);
    });
  });

  describe("responses.created", () => {
    it("should return 201 with data", async () => {
      const data = { id: "new-id", name: "New Item" };
      const response = responses.created(data);

      expect(response.status).toBe(201);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toEqual(data);
    });
  });

  describe("responses.noContent", () => {
    it("should return 204 with no body", () => {
      const response = responses.noContent();

      expect(response.status).toBe(204);
    });
  });

  describe("responses.badRequest", () => {
    it("should return 400 with error message", async () => {
      const response = responses.badRequest("Invalid input");

      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("BAD_REQUEST");
      expect(body.error.message).toBe("Invalid input");
    });

    it("should include details when provided", async () => {
      const details = { field: "email", issue: "invalid format" };
      const response = responses.badRequest("Validation failed", details);

      const body = await response.json();
      expect(body.error.details).toEqual(details);
    });
  });

  describe("responses.unauthorized", () => {
    it("should return 401 with default message", async () => {
      const response = responses.unauthorized();

      expect(response.status).toBe(401);

      const body = await response.json();
      expect(body.error.code).toBe("UNAUTHORIZED");
      expect(body.error.message).toBe("No autorizado");
    });

    it("should return 401 with custom message", async () => {
      const response = responses.unauthorized("Token expired");

      const body = await response.json();
      expect(body.error.message).toBe("Token expired");
    });
  });

  describe("responses.forbidden", () => {
    it("should return 403", async () => {
      const response = responses.forbidden();

      expect(response.status).toBe(403);

      const body = await response.json();
      expect(body.error.code).toBe("FORBIDDEN");
    });
  });

  describe("responses.notFound", () => {
    it("should return 404 with default message", async () => {
      const response = responses.notFound();

      expect(response.status).toBe(404);

      const body = await response.json();
      expect(body.error.code).toBe("NOT_FOUND");
      expect(body.error.message).toBe("Recurso no encontrado");
    });

    it("should return 404 with custom message", async () => {
      const response = responses.notFound("Expense not found");

      const body = await response.json();
      expect(body.error.message).toBe("Expense not found");
    });
  });

  describe("responses.conflict", () => {
    it("should return 409", async () => {
      const response = responses.conflict("Resource already exists");

      expect(response.status).toBe(409);

      const body = await response.json();
      expect(body.error.code).toBe("CONFLICT");
      expect(body.error.message).toBe("Resource already exists");
    });
  });

  describe("responses.validationError", () => {
    it("should return 422 with validation details", async () => {
      const details = { email: ["Invalid format"], password: ["Too short"] };
      const response = responses.validationError("Validation failed", details);

      expect(response.status).toBe(422);

      const body = await response.json();
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.details).toEqual(details);
    });
  });

  describe("responses.internalError", () => {
    it("should return 500 with default message", async () => {
      const response = responses.internalError();

      expect(response.status).toBe(500);

      const body = await response.json();
      expect(body.error.code).toBe("INTERNAL_ERROR");
      expect(body.error.message).toBe("Error interno del servidor");
    });
  });
});
