import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { responses, handleApiError, requireAuth, withLogging } from "@/lib/api";
import { createFixedExpenseSchema, fixedExpenseQuerySchema } from "@/lib/schemas";

/**
 * GET /api/fixed-expenses
 * List all fixed expenses for the authenticated user
 *
 * Query params:
 * - active: Filter by active status (true|false)
 * - category: Filter by category
 */
export const GET = withLogging(async (request: NextRequest) => {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const query = fixedExpenseQuerySchema.parse({
      active: searchParams.get("active") || undefined,
      category: searchParams.get("category") || undefined,
    });

    // Build query
    let dbQuery = supabase
      .from("fixed_expenses")
      .select("*")
      .eq("user_id", user.id)
      .order("name", { ascending: true });

    if (query.active !== undefined) {
      dbQuery = dbQuery.eq("active", query.active);
    }

    if (query.category) {
      dbQuery = dbQuery.eq("category", query.category);
    }

    const { data, error } = await dbQuery;

    if (error) throw error;

    return responses.ok(data || []);
  } catch (error) {
    return handleApiError(error);
  }
});

/**
 * POST /api/fixed-expenses
 * Create a new fixed expense
 *
 * Body:
 * - name: string (required)
 * - amount: number > 0 (required)
 * - category: survival|optional|culture|extra (required)
 * - start_ym: YYYY-MM (required)
 * - end_ym: YYYY-MM (optional)
 * - due_day: 1-31 (optional, default: 1)
 * - active: boolean (optional, default: true)
 */
export const POST = withLogging(async (request: NextRequest) => {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    // Parse and validate body
    const body = await request.json();
    const input = createFixedExpenseSchema.parse(body);

    // Create fixed expense
    const { data, error } = await supabase
      .from("fixed_expenses")
      .insert({
        user_id: user.id,
        name: input.name,
        amount: input.amount,
        category: input.category,
        start_ym: input.start_ym,
        end_ym: input.end_ym || null,
        due_day: input.due_day,
        active: input.active,
      })
      .select()
      .single();

    if (error) throw error;

    return responses.created(data);
  } catch (error) {
    return handleApiError(error);
  }
});
