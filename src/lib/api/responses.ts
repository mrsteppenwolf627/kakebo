import { NextResponse } from "next/server";

/**
 * Standard API response format for success cases
 */
export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
};

/**
 * Standard API response format for error cases
 */
export type ApiErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

/**
 * Union type for all API responses
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Creates a successful JSON response
 */
export function successResponse<T>(data: T, status = 200): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Creates an error JSON response
 */
export function errorResponse(
  code: string,
  message: string,
  status = 400,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  const errorObj: ApiErrorResponse["error"] = { code, message };
  if (details !== undefined) {
    errorObj.details = details;
  }
  return NextResponse.json(
    {
      success: false,
      error: errorObj,
    },
    { status }
  );
}

/**
 * Common HTTP status responses
 */
export const responses = {
  ok: <T>(data: T) => successResponse(data, 200),
  created: <T>(data: T) => successResponse(data, 201),
  noContent: () => new NextResponse(null, { status: 204 }),
  badRequest: (message: string, details?: unknown) =>
    errorResponse("BAD_REQUEST", message, 400, details),
  unauthorized: (message = "No autorizado") =>
    errorResponse("UNAUTHORIZED", message, 401),
  forbidden: (message = "Acceso denegado") =>
    errorResponse("FORBIDDEN", message, 403),
  notFound: (message = "Recurso no encontrado") =>
    errorResponse("NOT_FOUND", message, 404),
  conflict: (message: string) =>
    errorResponse("CONFLICT", message, 409),
  validationError: (message: string, details?: unknown) =>
    errorResponse("VALIDATION_ERROR", message, 422, details),
  internalError: (message = "Error interno del servidor") =>
    errorResponse("INTERNAL_ERROR", message, 500),
};
