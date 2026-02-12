import { SupabaseClient } from "@supabase/supabase-js";
import { apiLogger } from "@/lib/logger";

/**
 * Parameters for calculating a financial scenario
 */
export interface CalculateWhatIfParams {
  name: string; // Name of the scenario (e.g., "Vacaciones en Agosto")
  estimatedCost: number; // Estimated cost in EUR
  category: "survival" | "optional" | "culture" | "extra";
  targetDate?: string; // YYYY-MM-DD format (optional)
  description?: string; // Optional description
}

/**
 * Result of creating a financial scenario
 */
export interface CalculateWhatIfResult {
  success: boolean;
  scenarioId: string;
  name: string;
  estimatedCost: number;
  category: string;
  targetDate: string | null;
  monthlySavingsNeeded: number | null;
  monthsRemaining: number | null;
  message: string;
  advice: string;
}

/**
 * Map English category name to Spanish (as stored in database)
 */
function getSpanishCategoryName(category: string): string {
  const mapping: Record<string, string> = {
    survival: "supervivencia",
    optional: "opcional",
    culture: "cultura",
    extra: "extra",
  };
  return mapping[category] || category;
}

/**
 * Calculate months remaining until target date
 */
function getMonthsRemaining(targetDate: string): number {
  const now = new Date();
  const target = new Date(targetDate);

  const yearsDiff = target.getFullYear() - now.getFullYear();
  const monthsDiff = target.getMonth() - now.getMonth();

  return Math.max(0, yearsDiff * 12 + monthsDiff);
}

/**
 * Create a financial scenario ("what-if") for future planning
 *
 * Uses the financial_scenarios table created in migration 5.
 * Automatically calculates monthly savings needed based on target date.
 *
 * Example: "¿Cuánto tengo que ahorrar al mes para unas vacaciones de 800€ en agosto?"
 */
export async function calculateWhatIf(
  supabase: SupabaseClient,
  userId: string,
  params: CalculateWhatIfParams
): Promise<CalculateWhatIfResult> {
  try {
    // Validate parameters
    if (params.estimatedCost <= 0) {
      throw new Error("El coste estimado debe ser mayor que 0");
    }

    if (!params.name || params.name.trim().length === 0) {
      throw new Error("El nombre del escenario no puede estar vacío");
    }

    // Prepare data
    const dbCategory = getSpanishCategoryName(params.category);
    const targetDate = params.targetDate || null;

    // Insert scenario into financial_scenarios table
    // The trigger auto_calculate_scenario_savings will calculate monthly_savings_needed
    const { data, error } = await supabase
      .from("financial_scenarios")
      .insert({
        user_id: userId,
        name: params.name,
        description: params.description || null,
        estimated_cost: params.estimatedCost,
        category: dbCategory,
        target_date: targetDate,
        status: "planned",
      })
      .select()
      .single();

    if (error) {
      apiLogger.error({ error, params }, "Error creating financial scenario");
      throw error;
    }

    // Calculate months remaining for advice
    const monthsRemaining = targetDate ? getMonthsRemaining(targetDate) : null;

    // monthly_savings_needed is auto-calculated by the trigger
    const monthlySavingsNeeded = data.monthly_savings_needed || null;

    // Generate advice based on calculation
    let advice = "";
    if (monthlySavingsNeeded && monthsRemaining) {
      if (monthsRemaining === 0) {
        advice = `⚠️ La fecha objetivo es muy próxima. Necesitarías ahorrar ${params.estimatedCost}€ de inmediato.`;
      } else if (monthsRemaining === 1) {
        advice = `⏰ Tienes 1 mes para ahorrar ${monthlySavingsNeeded}€/mes.`;
      } else {
        advice = `📊 Para alcanzar tu objetivo, necesitas ahorrar ${monthlySavingsNeeded}€ al mes durante ${monthsRemaining} meses.`;
      }
    } else if (targetDate) {
      advice = "⚠️ No se pudo calcular el ahorro mensual necesario. Verifica la fecha objetivo.";
    } else {
      advice = "💡 Define una fecha objetivo para calcular cuánto debes ahorrar cada mes.";
    }

    const message = `✅ Escenario creado: "${params.name}" (${params.estimatedCost}€)`;

    apiLogger.info(
      {
        userId,
        scenarioId: data.id,
        name: params.name,
        estimatedCost: params.estimatedCost,
        monthlySavingsNeeded,
      },
      "Financial scenario created successfully"
    );

    return {
      success: true,
      scenarioId: data.id,
      name: params.name,
      estimatedCost: params.estimatedCost,
      category: params.category,
      targetDate: targetDate,
      monthlySavingsNeeded,
      monthsRemaining,
      message,
      advice,
    };
  } catch (error) {
    apiLogger.error({ error, params }, "Error in calculateWhatIf");
    throw error;
  }
}
