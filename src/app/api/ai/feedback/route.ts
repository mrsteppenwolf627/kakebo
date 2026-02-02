import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { responses, handleApiError, requireAuth, withLogging } from "@/lib/api";
import { recordCorrection } from "@/lib/ai";
import { feedbackRequestSchema } from "@/lib/schemas";

/**
 * Map frontend categories (Spanish) to AI categories (English)
 */
const CATEGORY_MAP: Record<string, string> = {
  supervivencia: "survival",
  opcional: "optional",
  cultura: "culture",
  extra: "extra",
};

/**
 * POST /api/ai/feedback
 * Record a classification correction for accuracy tracking
 *
 * Body:
 * - logId: string (required) - The AI log ID to correct
 * - correctedCategory: string (required) - The correct category (in Spanish)
 *
 * Returns:
 * - success: true if correction was recorded
 */
export const POST = withLogging(async (request: NextRequest) => {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const body = await request.json();
    const input = feedbackRequestSchema.parse(body);

    // Verify the log belongs to the authenticated user
    const { data: logEntry, error: fetchError } = await supabase
      .from("ai_logs")
      .select("id, user_id")
      .eq("id", input.logId)
      .single();

    if (fetchError || !logEntry) {
      return responses.notFound("Log no encontrado");
    }

    if (logEntry.user_id !== user.id) {
      return responses.forbidden("No tienes permiso para modificar este log");
    }

    // Convert Spanish category to English for storage
    const englishCategory = CATEGORY_MAP[input.correctedCategory] || input.correctedCategory;

    // Record the correction
    await recordCorrection(supabase, input.logId, englishCategory);

    return responses.ok({ recorded: true });
  } catch (error) {
    return handleApiError(error);
  }
});
