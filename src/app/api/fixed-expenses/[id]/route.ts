import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { responses, handleApiError, requireAuth, withLogging } from "@/lib/api";
import { updateFixedExpenseSchema, uuidSchema } from "@/lib/schemas";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/fixed-expenses/[id]
 * Get a single fixed expense by ID
 */
export const GET = withLogging(async (request: NextRequest, { params }: RouteParams) => {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const { id } = await params;
    const fixedExpenseId = uuidSchema.parse(id);

    const { data, error } = await supabase
      .from("fixed_expenses")
      .select("*")
      .eq("id", fixedExpenseId)
      .eq("user_id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return responses.notFound("Gasto fijo no encontrado");
      }
      throw error;
    }

    return responses.ok(data);
  } catch (error) {
    return handleApiError(error);
  }
});

/**
 * PATCH /api/fixed-expenses/[id]
 * Update an existing fixed expense
 *
 * Body (all optional, at least one required):
 * - name: string
 * - amount: number > 0
 * - category: survival|optional|culture|extra
 * - start_ym: YYYY-MM
 * - end_ym: YYYY-MM | null
 * - due_day: 1-31
 * - active: boolean
 */
export const PATCH = withLogging(async (request: NextRequest, { params }: RouteParams) => {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const { id } = await params;
    const fixedExpenseId = uuidSchema.parse(id);

    // Verify fixed expense exists and belongs to user
    const { error: fetchError } = await supabase
      .from("fixed_expenses")
      .select("id")
      .eq("id", fixedExpenseId)
      .eq("user_id", user.id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return responses.notFound("Gasto fijo no encontrado");
      }
      throw fetchError;
    }

    // Parse and validate body
    const body = await request.json();
    const input = updateFixedExpenseSchema.parse(body);

    // Update fixed expense
    const { data, error } = await supabase
      .from("fixed_expenses")
      .update(input)
      .eq("id", fixedExpenseId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;

    return responses.ok(data);
  } catch (error) {
    return handleApiError(error);
  }
});

/**
 * DELETE /api/fixed-expenses/[id]
 * Delete a fixed expense
 */
export const DELETE = withLogging(async (request: NextRequest, { params }: RouteParams) => {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const { id } = await params;
    const fixedExpenseId = uuidSchema.parse(id);

    // Verify fixed expense exists and belongs to user
    const { error: fetchError } = await supabase
      .from("fixed_expenses")
      .select("id")
      .eq("id", fixedExpenseId)
      .eq("user_id", user.id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return responses.notFound("Gasto fijo no encontrado");
      }
      throw fetchError;
    }

    // Delete fixed expense
    const { error } = await supabase
      .from("fixed_expenses")
      .delete()
      .eq("id", fixedExpenseId)
      .eq("user_id", user.id);

    if (error) throw error;

    return responses.noContent();
  } catch (error) {
    return handleApiError(error);
  }
});
