import { SupabaseClient } from "@supabase/supabase-js";
import { apiLogger } from "@/lib/logger";

/**
 * Parameters for setting a budget
 */
export interface SetBudgetParams {
  category: "survival" | "optional" | "culture" | "extra" | "all";
  amount: number;
  cycleStart?: string; // YYYY-MM-DD format (optional, defaults to current cycle)
  cycleEnd?: string; // YYYY-MM-DD format (optional, defaults to current cycle)
}

/**
 * Result of setting a budget
 */
export interface SetBudgetResult {
  success: boolean;
  category: string;
  amount: number;
  cycleStart: string;
  cycleEnd: string;
  message: string;
  totalBudget: number;
}

/**
 * Map English category name to database column name
 */
function getCategoryBudgetColumn(category: string): string {
  const mapping: Record<string, string> = {
    survival: "budget_supervivencia",
    optional: "budget_opcional",
    culture: "budget_cultura",
    extra: "budget_extra",
  };
  return mapping[category];
}

/**
 * Set or update budget for a category and cycle
 *
 * Uses the cycle_budgets table created in migration 2.
 * If cycleStart/cycleEnd not specified, uses the current cycle from payment_cycles.
 *
 * Examples:
 * - "Establece el presupuesto de supervivencia en 500€"
 * - "Pon el presupuesto de ocio en 200€"
 * - "Cambia todos los presupuestos a 100€ cada uno"
 */
export async function setBudget(
  supabase: SupabaseClient,
  userId: string,
  params: SetBudgetParams
): Promise<SetBudgetResult> {
  try {
    // Validate amount
    if (params.amount < 0) {
      throw new Error("El presupuesto no puede ser negativo");
    }

    // Get current cycle if dates not specified
    let cycleStart: string;
    let cycleEnd: string;

    if (!params.cycleStart || !params.cycleEnd) {
      const { data: cycleData, error: cycleError } = await supabase.rpc(
        "get_current_cycle",
        { p_user_id: userId }
      );

      if (cycleError || !cycleData || cycleData.length === 0) {
        apiLogger.error({ cycleError }, "Error getting current cycle");
        throw new Error(
          "No se pudo obtener el ciclo actual. Verifica tu configuración de ciclos de pago."
        );
      }

      const currentCycle = cycleData[0];
      cycleStart = currentCycle.cycle_start;
      cycleEnd = currentCycle.cycle_end;
    } else {
      cycleStart = params.cycleStart;
      cycleEnd = params.cycleEnd;
    }

    // Get or create current budget
    const { data: existingBudget, error: fetchError } = await supabase
      .from("cycle_budgets")
      .select("*")
      .eq("user_id", userId)
      .eq("cycle_start", cycleStart)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 = not found (expected if budget doesn't exist yet)
      apiLogger.error({ fetchError }, "Error fetching existing budget");
      throw fetchError;
    }

    // Prepare update object
    const updates: Record<string, unknown> = {};

    if (params.category === "all") {
      // Set all categories to the same amount
      updates.budget_supervivencia = params.amount;
      updates.budget_opcional = params.amount;
      updates.budget_cultura = params.amount;
      updates.budget_extra = params.amount;
    } else {
      // Set specific category
      const columnName = getCategoryBudgetColumn(params.category);
      updates[columnName] = params.amount;
    }

    let result;
    let totalBudget = params.amount;

    if (existingBudget) {
      // Update existing budget
      const { data, error } = await supabase
        .from("cycle_budgets")
        .update(updates)
        .eq("user_id", userId)
        .eq("cycle_start", cycleStart)
        .select()
        .single();

      if (error) {
        apiLogger.error({ error, params }, "Error updating budget");
        throw error;
      }

      result = data;

      // Calculate total budget
      totalBudget =
        (result.budget_supervivencia || 0) +
        (result.budget_opcional || 0) +
        (result.budget_cultura || 0) +
        (result.budget_extra || 0);
    } else {
      // Create new budget
      const insertData = {
        user_id: userId,
        cycle_start: cycleStart,
        cycle_end: cycleEnd,
        budget_supervivencia: params.category === "survival" || params.category === "all" ? params.amount : 0,
        budget_opcional: params.category === "optional" || params.category === "all" ? params.amount : 0,
        budget_cultura: params.category === "culture" || params.category === "all" ? params.amount : 0,
        budget_extra: params.category === "extra" || params.category === "all" ? params.amount : 0,
      };

      const { data, error } = await supabase
        .from("cycle_budgets")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        apiLogger.error({ error, params }, "Error creating budget");
        throw error;
      }

      result = data;

      // Calculate total budget
      totalBudget =
        (result.budget_supervivencia || 0) +
        (result.budget_opcional || 0) +
        (result.budget_cultura || 0) +
        (result.budget_extra || 0);
    }

    const categoryText = params.category === "all" ? "todas las categorías" : params.category;
    const message = `✅ Presupuesto actualizado: ${categoryText} = ${params.amount}€ (Total: ${totalBudget}€)`;

    apiLogger.info(
      {
        userId,
        category: params.category,
        amount: params.amount,
        cycleStart,
        cycleEnd,
        totalBudget,
      },
      "Budget updated successfully"
    );

    return {
      success: true,
      category: params.category,
      amount: params.amount,
      cycleStart,
      cycleEnd,
      message,
      totalBudget,
    };
  } catch (error) {
    apiLogger.error({ error, params }, "Error in setBudget");
    throw error;
  }
}
