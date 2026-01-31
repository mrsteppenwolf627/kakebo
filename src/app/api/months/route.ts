import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { responses, handleApiError, requireAuth } from "@/lib/api";
import { createMonthSchema, monthQuerySchema, parseYm } from "@/lib/schemas";

/**
 * GET /api/months
 * List all months for the authenticated user
 *
 * Query params:
 * - status: Filter by status (open|closed)
 * - year: Filter by year
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = createClient();

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
}

/**
 * POST /api/months
 * Get or create a month (idempotent)
 *
 * Body:
 * - ym: YYYY-MM (required)
 *
 * Returns existing month if found, creates new one if not
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = createClient();

    // Parse and validate body
    const body = await request.json();
    const input = createMonthSchema.parse(body);
    const { year, month } = parseYm(input.ym);

    // Try to find existing month
    const { data: existingMonth, error: fetchError } = await supabase
      .from("months")
      .select("*")
      .eq("user_id", user.id)
      .eq("year", year)
      .eq("month", month)
      .single();

    // If found, return it
    if (existingMonth) {
      return responses.ok(existingMonth);
    }

    // If not found (PGRST116), create new month
    if (fetchError && fetchError.code !== "PGRST116") {
      throw fetchError;
    }

    const { data: newMonth, error: insertError } = await supabase
      .from("months")
      .insert({
        user_id: user.id,
        year,
        month,
        status: "open",
        savings_done: false,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return responses.created(newMonth);
  } catch (error) {
    return handleApiError(error);
  }
}
