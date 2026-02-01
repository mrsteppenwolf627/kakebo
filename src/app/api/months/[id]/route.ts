import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { responses, handleApiError, requireAuth, withLogging } from "@/lib/api";
import { updateMonthSchema, uuidSchema } from "@/lib/schemas";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/months/[id]
 * Get a single month by ID
 */
export const GET = withLogging(async (request: NextRequest, { params }: RouteParams) => {
  try {
    const user = await requireAuth();
    const supabase = createClient();

    const { id } = await params;
    const monthId = uuidSchema.parse(id);

    const { data, error } = await supabase
      .from("months")
      .select("*")
      .eq("id", monthId)
      .eq("user_id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return responses.notFound("Mes no encontrado");
      }
      throw error;
    }

    return responses.ok(data);
  } catch (error) {
    return handleApiError(error);
  }
});

/**
 * PATCH /api/months/[id]
 * Update a month (close it, mark savings done, etc.)
 *
 * Body (all optional, at least one required):
 * - status: open|closed
 * - savings_done: boolean
 */
export const PATCH = withLogging(async (request: NextRequest, { params }: RouteParams) => {
  try {
    const user = await requireAuth();
    const supabase = createClient();

    const { id } = await params;
    const monthId = uuidSchema.parse(id);

    // Verify month exists and belongs to user
    const { data: existing, error: fetchError } = await supabase
      .from("months")
      .select("id, status")
      .eq("id", monthId)
      .eq("user_id", user.id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return responses.notFound("Mes no encontrado");
      }
      throw fetchError;
    }

    // Parse and validate body
    const body = await request.json();
    const input = updateMonthSchema.parse(body);

    // Business rule: can't reopen a closed month (optional, remove if not needed)
    if (existing.status === "closed" && input.status === "open") {
      return responses.conflict("No puedes reabrir un mes cerrado");
    }

    // Update month
    const { data, error } = await supabase
      .from("months")
      .update(input)
      .eq("id", monthId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;

    return responses.ok(data);
  } catch (error) {
    return handleApiError(error);
  }
});
