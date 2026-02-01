import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { responses, handleApiError, requireAuth, withLogging } from "@/lib/api";
import {
  createExpenseSchema,
  expenseQuerySchema,
  parseYm,
  formatYm,
} from "@/lib/schemas";

/**
 * GET /api/expenses
 * List expenses with optional filters
 *
 * Query params:
 * - ym: Filter by year-month (YYYY-MM)
 * - month_id: Filter by month ID
 * - category: Filter by category
 * - from_date: Filter from date (YYYY-MM-DD)
 * - to_date: Filter to date (YYYY-MM-DD)
 */
export const GET = withLogging(async (request: NextRequest) => {
  try {
    const user = await requireAuth();
    const supabase = createClient();

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const query = expenseQuerySchema.parse({
      ym: searchParams.get("ym") || undefined,
      month_id: searchParams.get("month_id") || undefined,
      category: searchParams.get("category") || undefined,
      from_date: searchParams.get("from_date") || undefined,
      to_date: searchParams.get("to_date") || undefined,
    });

    // Build query
    let dbQuery = supabase
      .from("expenses")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    // Apply filters
    if (query.month_id) {
      dbQuery = dbQuery.eq("month_id", query.month_id);
    }

    if (query.ym) {
      const { year, month } = parseYm(query.ym);
      const fromDate = `${query.ym}-01`;
      const toDate =
        month === 12
          ? `${year + 1}-01-01`
          : `${year}-${(month + 1).toString().padStart(2, "0")}-01`;
      dbQuery = dbQuery.gte("date", fromDate).lt("date", toDate);
    }

    if (query.category) {
      dbQuery = dbQuery.eq("category", query.category);
    }

    if (query.from_date) {
      dbQuery = dbQuery.gte("date", query.from_date);
    }

    if (query.to_date) {
      dbQuery = dbQuery.lte("date", query.to_date);
    }

    const { data, error } = await dbQuery;

    if (error) throw error;

    return responses.ok(data || []);
  } catch (error) {
    return handleApiError(error);
  }
});

/**
 * POST /api/expenses
 * Create a new expense
 *
 * Body:
 * - date: YYYY-MM-DD (required)
 * - amount: number > 0 (required)
 * - category: survival|optional|culture|extra (required)
 * - note: string (optional)
 * - month_id: UUID (optional, resolved from date if not provided)
 */
export const POST = withLogging(async (request: NextRequest) => {
  try {
    const user = await requireAuth();
    const supabase = createClient();

    // Parse and validate body
    const body = await request.json();
    const input = createExpenseSchema.parse(body);

    // Get or create month for this expense
    let monthId = input.month_id;

    if (!monthId) {
      // Extract year-month from date
      const ym = input.date.substring(0, 7); // "YYYY-MM"
      const { year, month } = parseYm(ym);

      // Try to find existing month
      const { data: existingMonth } = await supabase
        .from("months")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("year", year)
        .eq("month", month)
        .single();

      if (existingMonth) {
        // Check if month is closed
        if (existingMonth.status === "closed") {
          return responses.conflict(
            `El mes ${formatYm(year, month)} está cerrado. No puedes añadir gastos.`
          );
        }
        monthId = existingMonth.id;
      } else {
        // Create new month
        const { data: newMonth, error: monthError } = await supabase
          .from("months")
          .insert({
            user_id: user.id,
            year,
            month,
            status: "open",
            savings_done: false,
          })
          .select("id")
          .single();

        if (monthError) throw monthError;
        monthId = newMonth.id;
      }
    }

    // Create expense
    const { data, error } = await supabase
      .from("expenses")
      .insert({
        user_id: user.id,
        month_id: monthId,
        date: input.date,
        amount: input.amount,
        category: input.category,
        note: input.note || "",
      })
      .select()
      .single();

    if (error) throw error;

    return responses.created(data);
  } catch (error) {
    return handleApiError(error);
  }
});
