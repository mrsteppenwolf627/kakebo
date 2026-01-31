import { ZodError } from "zod";
import { responses } from "./responses";
import { NextResponse } from "next/server";

/**
 * Custom API error class for controlled error throwing
 */
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 400,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Predefined API errors for common scenarios
 */
export const apiErrors = {
  unauthorized: () => new ApiError("UNAUTHORIZED", "No autorizado", 401),
  forbidden: () => new ApiError("FORBIDDEN", "Acceso denegado", 403),
  notFound: (resource = "Recurso") =>
    new ApiError("NOT_FOUND", `${resource} no encontrado`, 404),
  badRequest: (message: string, details?: unknown) =>
    new ApiError("BAD_REQUEST", message, 400, details),
  conflict: (message: string) =>
    new ApiError("CONFLICT", message, 409),
  validation: (message: string, details?: unknown) =>
    new ApiError("VALIDATION_ERROR", message, 422, details),
};

/**
 * Formats Zod validation errors into a user-friendly structure
 */
export function formatZodError(error: ZodError): {
  message: string;
  details: Record<string, string[]>;
} {
  const details: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join(".") || "_root";
    if (!details[path]) {
      details[path] = [];
    }
    details[path].push(issue.message);
  }

  const firstIssue = error.issues[0];
  const fieldName = firstIssue?.path.join(".") || "input";
  const message = `Error de validación en '${fieldName}': ${firstIssue?.message}`;

  return { message, details };
}

/**
 * Handles any error and returns appropriate API response
 * Use this in catch blocks of API routes
 */
export function handleApiError(error: unknown): NextResponse {
  // Log error for debugging (structured logging)
  console.error("[API Error]", {
    timestamp: new Date().toISOString(),
    error:
      error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : error,
  });

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const { message, details } = formatZodError(error);
    return responses.validationError(message, details);
  }

  // Handle custom API errors
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        return responses.unauthorized(error.message);
      case 403:
        return responses.forbidden(error.message);
      case 404:
        return responses.notFound(error.message);
      case 409:
        return responses.conflict(error.message);
      case 422:
        return responses.validationError(error.message, error.details);
      default:
        return responses.badRequest(error.message, error.details);
    }
  }

  // Handle Supabase errors (they have a 'code' property)
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
  ) {
    const supabaseError = error as { code: string; message?: string };

    // Common Supabase error codes
    switch (supabaseError.code) {
      case "PGRST116": // Row not found
        return responses.notFound("Registro no encontrado");
      case "23505": // Unique violation
        return responses.conflict("El registro ya existe");
      case "23503": // Foreign key violation
        return responses.badRequest("Referencia inválida a otro registro");
      case "42501": // Insufficient privilege (RLS)
        return responses.forbidden("No tienes permiso para esta operación");
      default:
        return responses.badRequest(
          supabaseError.message || "Error de base de datos"
        );
    }
  }

  // Generic error
  return responses.internalError();
}
