import { SupabaseClient } from "@supabase/supabase-js";
import { ToolName, ToolParams } from "./tools";
import { classifyExpense } from "./classifier";
import { apiLogger } from "@/lib/logger";

/**
 * Result of tool execution
 */
export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * Execute a tool with the given parameters
 *
 * This is the bridge between AI decisions and actual database operations.
 */
export async function executeTool(
  toolName: ToolName,
  params: ToolParams[ToolName],
  supabase: SupabaseClient,
  userId: string
): Promise<ToolResult> {
  apiLogger.info({ toolName, params, userId }, `Executing tool: ${toolName}`);

  try {
    switch (toolName) {
      case "create_expense":
        return await executeCreateExpense(
          params as ToolParams["create_expense"],
          supabase,
          userId
        );

      case "list_expenses":
        return await executeListExpenses(
          params as ToolParams["list_expenses"],
          supabase,
          userId
        );

      case "get_monthly_summary":
        return await executeGetMonthlySummary(
          params as ToolParams["get_monthly_summary"],
          supabase,
          userId
        );

      case "get_settings":
        return await executeGetSettings(supabase, userId);

      case "update_settings":
        return await executeUpdateSettings(
          params as ToolParams["update_settings"],
          supabase,
          userId
        );

      case "classify_expense":
        return await executeClassifyExpense(
          params as ToolParams["classify_expense"]
        );

      default:
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
  } catch (error) {
    apiLogger.error({ error, toolName, params }, "Tool execution failed");
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Create a new expense
 */
async function executeCreateExpense(
  params: ToolParams["create_expense"],
  supabase: SupabaseClient,
  userId: string
): Promise<ToolResult> {
  const date = params.date || new Date().toISOString().split("T")[0];
  const ym = date.substring(0, 7);

  // Get or create month
  const { year, month } = parseYm(ym);

  let monthId: string;

  const { data: existingMonth } = await supabase
    .from("months")
    .select("id, status")
    .eq("user_id", userId)
    .eq("year", year)
    .eq("month", month)
    .single();

  if (existingMonth) {
    if (existingMonth.status === "closed") {
      return {
        success: false,
        error: `El mes ${ym} está cerrado. No se pueden añadir gastos.`,
      };
    }
    monthId = existingMonth.id;
  } else {
    const { data: newMonth, error: monthError } = await supabase
      .from("months")
      .insert({ user_id: userId, year, month, status: "open", savings_done: false })
      .select("id")
      .single();

    if (monthError) throw monthError;
    monthId = newMonth.id;
  }

  // Create expense
  const { data, error } = await supabase
    .from("expenses")
    .insert({
      user_id: userId,
      month_id: monthId,
      date,
      amount: params.amount,
      category: params.category,
      note: params.note,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    success: true,
    data: {
      message: `Gasto creado: ${params.amount}€ en ${params.category}`,
      expense: data,
    },
  };
}

/**
 * List expenses with optional filters
 */
async function executeListExpenses(
  params: ToolParams["list_expenses"],
  supabase: SupabaseClient,
  userId: string
): Promise<ToolResult> {
  const ym = params.ym || getCurrentYm();
  const limit = params.limit || 10;

  let query = supabase
    .from("expenses")
    .select("*")
    .eq("user_id", userId)
    .gte("date", `${ym}-01`)
    .lt("date", getNextMonth(ym))
    .order("date", { ascending: false })
    .limit(limit);

  if (params.category) {
    query = query.eq("category", params.category);
  }

  const { data, error } = await query;

  if (error) throw error;

  const total = (data || []).reduce((sum, e) => sum + e.amount, 0);

  return {
    success: true,
    data: {
      expenses: data || [],
      count: (data || []).length,
      total: Math.round(total * 100) / 100,
      period: ym,
    },
  };
}

/**
 * Get monthly summary with totals per category
 */
async function executeGetMonthlySummary(
  params: ToolParams["get_monthly_summary"],
  supabase: SupabaseClient,
  userId: string
): Promise<ToolResult> {
  const ym = params.ym || getCurrentYm();

  // Get expenses for the month
  const { data: expenses, error } = await supabase
    .from("expenses")
    .select("amount, category")
    .eq("user_id", userId)
    .gte("date", `${ym}-01`)
    .lt("date", getNextMonth(ym));

  if (error) throw error;

  // Get user settings for budget comparison
  const { data: settings } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  // Calculate totals per category
  const byCategory = {
    survival: 0,
    optional: 0,
    culture: 0,
    extra: 0,
  };

  for (const expense of expenses || []) {
    const cat = expense.category as keyof typeof byCategory;
    if (cat in byCategory) {
      byCategory[cat] += expense.amount;
    }
  }

  const totalSpent = Object.values(byCategory).reduce((a, b) => a + b, 0);

  // Budget comparison
  const budgetComparison = settings
    ? {
        survival: {
          spent: byCategory.survival,
          budget: settings.budget_survival,
          remaining: settings.budget_survival - byCategory.survival,
        },
        optional: {
          spent: byCategory.optional,
          budget: settings.budget_optional,
          remaining: settings.budget_optional - byCategory.optional,
        },
        culture: {
          spent: byCategory.culture,
          budget: settings.budget_culture,
          remaining: settings.budget_culture - byCategory.culture,
        },
        extra: {
          spent: byCategory.extra,
          budget: settings.budget_extra,
          remaining: settings.budget_extra - byCategory.extra,
        },
      }
    : null;

  return {
    success: true,
    data: {
      period: ym,
      totalSpent: Math.round(totalSpent * 100) / 100,
      byCategory: {
        survival: Math.round(byCategory.survival * 100) / 100,
        optional: Math.round(byCategory.optional * 100) / 100,
        culture: Math.round(byCategory.culture * 100) / 100,
        extra: Math.round(byCategory.extra * 100) / 100,
      },
      expenseCount: (expenses || []).length,
      budgetComparison,
    },
  };
}

/**
 * Get user settings
 */
async function executeGetSettings(
  supabase: SupabaseClient,
  userId: string
): Promise<ToolResult> {
  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") throw error;

  if (!data) {
    return {
      success: true,
      data: {
        message: "No tienes configuración guardada aún.",
        settings: null,
      },
    };
  }

  return {
    success: true,
    data: {
      monthly_income: data.monthly_income,
      savings_goal: data.savings_goal,
      budgets: {
        survival: data.budget_survival,
        optional: data.budget_optional,
        culture: data.budget_culture,
        extra: data.budget_extra,
      },
      current_balance: data.current_balance,
    },
  };
}

/**
 * Update user settings
 */
async function executeUpdateSettings(
  params: ToolParams["update_settings"],
  supabase: SupabaseClient,
  userId: string
): Promise<ToolResult> {
  // Check if settings exist
  const { data: existing } = await supabase
    .from("user_settings")
    .select("id")
    .eq("user_id", userId)
    .single();

  const updateData: Record<string, number> = {};
  if (params.monthly_income !== undefined)
    updateData.monthly_income = params.monthly_income;
  if (params.savings_goal !== undefined)
    updateData.savings_goal = params.savings_goal;
  if (params.budget_survival !== undefined)
    updateData.budget_survival = params.budget_survival;
  if (params.budget_optional !== undefined)
    updateData.budget_optional = params.budget_optional;
  if (params.budget_culture !== undefined)
    updateData.budget_culture = params.budget_culture;
  if (params.budget_extra !== undefined)
    updateData.budget_extra = params.budget_extra;

  if (Object.keys(updateData).length === 0) {
    return { success: false, error: "No se proporcionaron datos para actualizar" };
  }

  let result;
  if (existing) {
    const { data, error } = await supabase
      .from("user_settings")
      .update(updateData)
      .eq("user_id", userId)
      .select()
      .single();
    if (error) throw error;
    result = data;
  } else {
    const { data, error } = await supabase
      .from("user_settings")
      .insert({ user_id: userId, ...updateData })
      .select()
      .single();
    if (error) throw error;
    result = data;
  }

  return {
    success: true,
    data: { message: "Configuración actualizada", settings: result },
  };
}

/**
 * Classify an expense using AI
 */
async function executeClassifyExpense(
  params: ToolParams["classify_expense"]
): Promise<ToolResult> {
  const result = await classifyExpense(params.text);

  return {
    success: true,
    data: {
      text: params.text,
      suggestedCategory: result.category,
      suggestedNote: result.note,
      confidence: result.confidence,
    },
  };
}

// Helper functions

function getCurrentYm(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getNextMonth(ym: string): string {
  const [year, month] = ym.split("-").map(Number);
  if (month === 12) {
    return `${year + 1}-01`;
  }
  return `${year}-${String(month + 1).padStart(2, "0")}-01`;
}

function parseYm(ym: string): { year: number; month: number } {
  const [year, month] = ym.split("-").map(Number);
  return { year, month };
}
