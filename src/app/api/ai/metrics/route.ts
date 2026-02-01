import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { responses, handleApiError, requireAuth, withLogging } from "@/lib/api";
import { getAIMetrics, getRecentLogs } from "@/lib/ai";
import { z } from "zod";

/**
 * Query parameters schema for metrics endpoint
 */
const metricsQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  includeLogs: z.coerce.boolean().optional().default(false),
  logsLimit: z.coerce.number().min(1).max(100).optional().default(20),
});

/**
 * GET /api/ai/metrics
 * Get aggregated AI usage metrics and optionally recent logs
 *
 * Query params:
 * - startDate: ISO date string (optional, defaults to 30 days ago)
 * - endDate: ISO date string (optional, defaults to now)
 * - includeLogs: boolean (optional, default false) - Include recent logs
 * - logsLimit: number (optional, default 20, max 100) - Number of logs to return
 *
 * Returns:
 * - metrics: Aggregated AI metrics (costs, tokens, latency, accuracy)
 * - logs: Recent AI interaction logs (if includeLogs=true)
 *
 * Example:
 * ```
 * GET /api/ai/metrics?includeLogs=true&logsLimit=10
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "metrics": {
 *       "period": "2026-01-01 to 2026-02-01",
 *       "totalRequests": 150,
 *       "successRate": 98.5,
 *       "totalCostUsd": 0.0234,
 *       "avgLatencyMs": 450,
 *       "classificationAccuracy": 94,
 *       ...
 *     },
 *     "logs": [...]
 *   }
 * }
 * ```
 */
export const GET = withLogging(async (request: NextRequest) => {
  try {
    const user = await requireAuth();
    const supabase = createClient();

    // Parse query params
    const { searchParams } = new URL(request.url);
    const query = metricsQuerySchema.parse({
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      includeLogs: searchParams.get("includeLogs") || undefined,
      logsLimit: searchParams.get("logsLimit") || undefined,
    });

    // Get aggregated metrics
    const metrics = await getAIMetrics(supabase, user.id, {
      startDate: query.startDate,
      endDate: query.endDate,
    });

    // Optionally include recent logs
    const logs = query.includeLogs
      ? await getRecentLogs(supabase, user.id, query.logsLimit)
      : undefined;

    return responses.ok({
      metrics,
      ...(logs && { logs }),
    });
  } catch (error) {
    return handleApiError(error);
  }
});
