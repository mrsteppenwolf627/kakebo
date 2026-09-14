import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { responses, handleApiError, requireAuth, withLogging } from "@/lib/api";
import { createMonthSchema, monthQuerySchema, parseYm } from "@/lib/schemas";
import { getOrCreateMonth } from "@/lib/months";

/**
 * GET /api/months
 * List all months for the authenticated user
 *
 * Query params:
 * - status: Filter by status (open|closed)
 * - year: Filter by year
 */
export const GET = withLogging(async (request: NextRequest) => {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const query = monthQuerySchema.parse({
      status: searchParams.get("status") || undefined,
      year: searchParams.get("year") || undefined,
    });

    // Build query
    let dbQuery = supabase
      .from("months")
      .select("*")
      .eq("user_id", user.id)
      .order("year", { ascending: false })
      .order("month", { ascending: false });

    if (query.status) {
      dbQuery = dbQuery.eq("status", query.status);
    }

    if (query.year) {
      dbQuery = dbQuery.eq("year", query.year);
    }

    const { data, error } = await dbQuery;

    if (error) throw error;

    return responses.ok(data || []);
  } catch (error) {
    return handleApiError(error);
  }
});

/**
 * POST /api/months
 * Get or create a month (idempotent)
 *
 * Body:
 * - ym: YYYY-MM (required)
 *
 * Returns existing month if found, creates new one if not
 */
export const POST = withLogging(async (request: NextRequest) => {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    // Parse and validate body
    const body = await request.json();
    const input = createMonthSchema.parse(body);
    const { year, month } = parseYm(input.ym);

    // Get or create (idempotent). Also used by Fase 1 (ciclos libres) to
    // open/reuse the next cycle right after closing the current one.
    const { row, created } = await getOrCreateMonth(supabase, user.id, year, month);

    return created ? responses.created(row) : responses.ok(row);
  } catch (error) {
    return handleApiError(error);
  }
});
