import { SupabaseClient } from "@supabase/supabase-js";
import { apiLogger } from "@/lib/logger";

/**
 * Parameters for getting current cycle (none needed, uses userId)
 */
export interface GetCurrentCycleParams {
  // No parameters needed - userId is enough
}

/**
 * Result of getting current cycle information
 */
export interface GetCurrentCycleResult {
  cycleStart: string; // YYYY-MM-DD
  cycleEnd: string; // YYYY-MM-DD
  daysRemaining: number;
  daysElapsed: number;
  daysTotal: number;
  cycleType: "calendar" | "payroll";
  payrollDay?: number; // Only if cycleType is "payroll"
  progressPercentage: number;
}

/**
 * Get current payment cycle information
 *
 * Uses the get_current_cycle() function created in migration 1.
 * Returns cycle dates and progress information.
 *
 * This is useful when the agent needs to:
 * - Explain when the user's cycle ends
 * - Calculate days remaining for projections
 * - Understand if user is using payroll or calendar cycles
 *
 * Example: "¿Cuántos días me quedan en mi ciclo actual?"
 */
export async function getCurrentCycle(
  supabase: SupabaseClient,
  userId: string,
  params: GetCurrentCycleParams
): Promise<GetCurrentCycleResult> {
  try {
    // Call the get_current_cycle RPC function
    const { data, error } = await supabase.rpc("get_current_cycle", {
      p_user_id: userId,
    });

    if (error) {
      apiLogger.error({ error, userId }, "Error getting current cycle");
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error(
        "No se encontró información del ciclo. Verifica tu configuración de ciclos de pago."
      );
    }

    const cycle = data[0];

    // Calculate progress percentage
    const progressPercentage =
      cycle.days_total > 0
        ? Math.round((cycle.days_elapsed / cycle.days_total) * 100)
        : 0;

    // Get payroll day if applicable
    const { data: paymentCycleData, error: paymentError } = await supabase
      .from("payment_cycles")
      .select("cycle_type, payroll_day")
      .eq("user_id", userId)
      .single();

    if (paymentError) {
      apiLogger.warn(
        { paymentError, userId },
        "Could not fetch payment cycle details"
      );
    }

    apiLogger.info(
      {
        userId,
        cycleStart: cycle.cycle_start,
        cycleEnd: cycle.cycle_end,
        daysRemaining: cycle.days_remaining,
        progressPercentage,
      },
      "Current cycle retrieved successfully"
    );

    return {
      cycleStart: cycle.cycle_start,
      cycleEnd: cycle.cycle_end,
      daysRemaining: cycle.days_remaining,
      daysElapsed: cycle.days_elapsed,
      daysTotal: cycle.days_total,
      cycleType: cycle.cycle_type,
      payrollDay: paymentCycleData?.payroll_day || undefined,
      progressPercentage,
    };
  } catch (error) {
    apiLogger.error({ error, userId }, "Error in getCurrentCycle");
    throw error;
  }
}
