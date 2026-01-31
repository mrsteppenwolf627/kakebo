import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { responses, handleApiError, requireAuth } from "@/lib/api";
import { updateSettingsSchema, DEFAULT_SETTINGS } from "@/lib/schemas";

/**
 * GET /api/settings
 * Get user settings (creates default if not exists)
 */
export async function GET() {
  try {
    const user = await requireAuth();
    const supabase = createClient();

    // Try to get existing settings
    const { data: existing, error: fetchError } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // If found, return it
    if (existing) {
      return responses.ok(existing);
    }

    // If not found, create default settings
    if (fetchError && fetchError.code !== "PGRST116") {
      throw fetchError;
    }

    const { data: newSettings, error: insertError } = await supabase
      .from("user_settings")
      .insert({
        user_id: user.id,
        ...DEFAULT_SETTINGS,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return responses.ok(newSettings);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/settings
 * Update user settings (upsert)
 *
 * Body (all optional, at least one required):
 * - monthly_income: number >= 0
 * - savings_goal: number >= 0
 * - budget_survival: number >= 0
 * - budget_optional: number >= 0
 * - budget_culture: number >= 0
 * - budget_extra: number >= 0
 * - current_balance: number (can be negative)
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = createClient();

    // Parse and validate body
    const body = await request.json();
    const input = updateSettingsSchema.parse(body);

    // Check if settings exist
    const { data: existing } = await supabase
      .from("user_settings")
      .select("id")
      .eq("user_id", user.id)
      .single();

    let result;

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from("user_settings")
        .update(input)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create with defaults + input
      const { data, error } = await supabase
        .from("user_settings")
        .insert({
          user_id: user.id,
          ...DEFAULT_SETTINGS,
          ...input,
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return responses.ok(result);
  } catch (error) {
    return handleApiError(error);
  }
}
