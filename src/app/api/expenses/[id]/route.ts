import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { responses, handleApiError, requireAuth, withLogging } from "@/lib/api";
import { updateExpenseSchema, uuidSchema } from "@/lib/schemas";
import {
  generateEmbedding,
  createExpenseText,
  storeExpenseEmbedding,
  deleteExpenseEmbedding,
} from "@/lib/ai";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/expenses/[id]
 * Get a single expense by ID
 */
export const GET = withLogging(async (request: NextRequest, { params }: RouteParams) => {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const { id } = await params;
    const expenseId = uuidSchema.parse(id);

    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("id", expenseId)
      .eq("user_id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return responses.notFound("Gasto no encontrado");
      }
      throw error;
    }

    return responses.ok(data);
  } catch (error) {
    return handleApiError(error);
  }
});

/**
 * PATCH /api/expenses/[id]
 * Update an existing expense
 *
 * Body (all optional, at least one required):
 * - date: YYYY-MM-DD
 * - amount: number > 0
 * - category: survival|optional|culture|extra
 * - note: string
 */
export const PATCH = withLogging(async (request: NextRequest, { params }: RouteParams) => {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const { id } = await params;
    const expenseId = uuidSchema.parse(id);

    // Verify expense exists and belongs to user
    const { data: existing, error: fetchError } = await supabase
      .from("expenses")
      .select("id, month_id")
      .eq("id", expenseId)
      .eq("user_id", user.id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return responses.notFound("Gasto no encontrado");
      }
      throw fetchError;
    }

    // Check if month is closed
    const { data: monthData } = await supabase
      .from("months")
      .select("status")
      .eq("id", existing.month_id)
      .single();

    if (monthData?.status === "closed") {
      return responses.conflict(
        "No puedes modificar gastos de un mes cerrado"
      );
    }

    // Parse and validate body
    const body = await request.json();
    const input = updateExpenseSchema.parse(body);

    // Update expense
    const { data, error } = await supabase
      .from("expenses")
      .update(input)
      .eq("id", expenseId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;

    // Regenerate embedding if note, amount, or category changed
    if (data && (input.note || input.amount || input.category)) {
      const textContent = createExpenseText({
        note: data.note,
        amount: data.amount,
        category: data.category,
        date: data.date,
      });

      generateEmbedding(textContent)
        .then(({ embedding }) => {
          storeExpenseEmbedding(supabase, data.id, user.id, textContent, embedding);
        })
        .catch(() => {
          // Silent fail
        });
    }

    return responses.ok(data);
  } catch (error) {
    return handleApiError(error);
  }
});

/**
 * DELETE /api/expenses/[id]
 * Delete an expense
 */
export const DELETE = withLogging(async (request: NextRequest, { params }: RouteParams) => {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const { id } = await params;
    const expenseId = uuidSchema.parse(id);

    // Verify expense exists and get month_id
    const { data: existing, error: fetchError } = await supabase
      .from("expenses")
      .select("id, month_id")
      .eq("id", expenseId)
      .eq("user_id", user.id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return responses.notFound("Gasto no encontrado");
      }
      throw fetchError;
    }

    // Check if month is closed
    const { data: monthData } = await supabase
      .from("months")
      .select("status")
      .eq("id", existing.month_id)
      .single();

    if (monthData?.status === "closed") {
      return responses.conflict(
        "No puedes eliminar gastos de un mes cerrado"
      );
    }

    // Delete expense
    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", expenseId)
      .eq("user_id", user.id);

    if (error) throw error;

    return responses.noContent();
  } catch (error) {
    return handleApiError(error);
  }
});
