import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { responses, handleApiError, requireAuth, withLogging } from "@/lib/api";
import { searchExpensesByText } from "@/lib/ai";
import { semanticSearchSchema } from "@/lib/schemas";

/**
 * POST /api/ai/search
 * Semantic search for expenses
 *
 * Body:
 * - query: string (required) - The search query
 * - limit: number (optional, default 5) - Maximum results
 * - threshold: number (optional, default 0.5) - Minimum similarity (0-1)
 *
 * Returns:
 * - results: Array of similar expenses with similarity scores
 * - metrics: Query cost and token usage
 *
 * Example:
 * POST /api/ai/search
 * Body: { "query": "supermercado", "limit": 5 }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "results": [
 *       {
 *         "expense_id": "uuid",
 *         "note": "Mercadona",
 *         "amount": 45.50,
 *         "category": "survival",
 *         "date": "2026-01-15",
 *         "similarity": 0.92
 *       }
 *     ],
 *     "metrics": {
 *       "queryTokens": 5,
 *       "queryCostUsd": 0.0001
 *     }
 *   }
 * }
 */
export const POST = withLogging(async (request: NextRequest) => {
  try {
    const user = await requireAuth();
    const supabase = createClient();

    const body = await request.json();
    const input = semanticSearchSchema.parse(body);

    const { results, queryTokens, queryCostUsd } = await searchExpensesByText(
      supabase,
      user.id,
      input.query,
      {
        limit: input.limit,
        threshold: input.threshold,
      }
    );

    return responses.ok({
      results,
      metrics: {
        queryTokens,
        queryCostUsd,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
});
