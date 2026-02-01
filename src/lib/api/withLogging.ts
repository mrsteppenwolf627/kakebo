import { NextRequest, NextResponse } from "next/server";
import { logApiRequest, logApiResponse, logApiError } from "@/lib/logger";

/**
 * Higher-order function that wraps API route handlers with logging.
 *
 * Automatically logs:
 * - Incoming requests (method, path, userId if available)
 * - Outgoing responses (status, duration in ms)
 * - Errors (with stack trace)
 *
 * @example
 * // Without params
 * export const GET = withLogging(async (request) => {
 *   return responses.ok({ data: "hello" });
 * });
 *
 * @example
 * // With params (dynamic routes like [id])
 * export const GET = withLogging(async (request, { params }) => {
 *   const { id } = await params;
 *   return responses.ok({ id });
 * });
 */
export function withLogging<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  THandler extends (request: NextRequest, context?: any) => Promise<NextResponse> | NextResponse
>(handler: THandler): THandler {
  const wrappedHandler = async (
    request: NextRequest,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    context?: any
  ): Promise<NextResponse> => {
    const startTime = Date.now();
    const method = request.method;
    const path = new URL(request.url).pathname;

    // Extract user ID from request if available (set by auth middleware)
    const userId = request.headers.get("x-user-id") || undefined;

    // Log incoming request
    logApiRequest(method, path, userId);

    try {
      // Execute the actual handler
      const response = await handler(request, context);
      const durationMs = Date.now() - startTime;

      // Log response
      logApiResponse(method, path, response.status, durationMs);

      return response;
    } catch (error) {
      const durationMs = Date.now() - startTime;

      // Log error
      logApiError(method, path, error, { durationMs });

      // Re-throw to let error handling middleware deal with it
      throw error;
    }
  };

  return wrappedHandler as THandler;
}

export default withLogging;
