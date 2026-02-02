import { ChatCompletionTool } from "openai/resources/chat/completions";

/**
 * Tool definitions for OpenAI function calling
 *
 * These define what functions the AI can call and their parameters.
 * The AI will decide when to call each function based on user input.
 */

export const ASSISTANT_TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "create_expense",
      description:
        "Crear un nuevo gasto. Usa esta función cuando el usuario quiera registrar un gasto.",
      parameters: {
        type: "object",
        properties: {
          amount: {
            type: "number",
            description: "Cantidad del gasto en euros (debe ser mayor que 0)",
          },
          category: {
            type: "string",
            enum: ["survival", "optional", "culture", "extra"],
            description:
              "Categoría del gasto: survival (esencial), optional (no esencial), culture (ocio/formación), extra (imprevisto)",
          },
          note: {
            type: "string",
            description: "Descripción breve del gasto (máximo 100 caracteres)",
          },
          date: {
            type: "string",
            description:
              "Fecha del gasto en formato YYYY-MM-DD. Si no se especifica, usar fecha actual.",
          },
        },
        required: ["amount", "category", "note"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_expenses",
      description:
        "Listar gastos del usuario. Usa esta función para ver gastos registrados.",
      parameters: {
        type: "object",
        properties: {
          ym: {
            type: "string",
            description:
              "Filtrar por año-mes en formato YYYY-MM (ej: 2026-02). Si no se especifica, muestra el mes actual.",
          },
          category: {
            type: "string",
            enum: ["survival", "optional", "culture", "extra"],
            description: "Filtrar por categoría específica",
          },
          limit: {
            type: "number",
            description: "Número máximo de gastos a mostrar (default: 10)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_monthly_summary",
      description:
        "Obtener resumen del mes: total gastado, desglose por categoría, comparación con presupuesto.",
      parameters: {
        type: "object",
        properties: {
          ym: {
            type: "string",
            description:
              "Año-mes en formato YYYY-MM (ej: 2026-02). Si no se especifica, usa el mes actual.",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_settings",
      description:
        "Obtener la configuración del usuario: ingresos, presupuestos por categoría, objetivo de ahorro.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_settings",
      description:
        "Actualizar la configuración del usuario: ingresos, presupuestos, objetivo de ahorro.",
      parameters: {
        type: "object",
        properties: {
          monthly_income: {
            type: "number",
            description: "Ingresos mensuales en euros",
          },
          savings_goal: {
            type: "number",
            description: "Objetivo de ahorro mensual en euros",
          },
          budget_survival: {
            type: "number",
            description: "Presupuesto para gastos esenciales",
          },
          budget_optional: {
            type: "number",
            description: "Presupuesto para gastos opcionales",
          },
          budget_culture: {
            type: "number",
            description: "Presupuesto para cultura y ocio",
          },
          budget_extra: {
            type: "number",
            description: "Presupuesto para imprevistos",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "classify_expense",
      description:
        "Clasificar un texto de gasto para sugerir categoría y nota. Usa esto cuando el usuario describe un gasto pero no especifica la categoría.",
      parameters: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "Texto describiendo el gasto (ej: 'Mercadona 45€')",
          },
        },
        required: ["text"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_similar_expenses",
      description:
        "Buscar gastos similares en el historial usando búsqueda semántica. Usa esto cuando el usuario pregunta por gastos parecidos, patrones de gasto, o quiere encontrar gastos relacionados con un tema.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Texto de búsqueda (ej: 'supermercado', 'comida', 'transporte')",
          },
          limit: {
            type: "number",
            description: "Número máximo de resultados (default: 5, max: 10)",
          },
        },
        required: ["query"],
      },
    },
  },
];

/**
 * Tool names for type safety
 */
export type ToolName =
  | "create_expense"
  | "list_expenses"
  | "get_monthly_summary"
  | "get_settings"
  | "update_settings"
  | "classify_expense"
  | "search_similar_expenses";

/**
 * Parameters for each tool
 */
export interface ToolParams {
  create_expense: {
    amount: number;
    category: "survival" | "optional" | "culture" | "extra";
    note: string;
    date?: string;
  };
  list_expenses: {
    ym?: string;
    category?: "survival" | "optional" | "culture" | "extra";
    limit?: number;
  };
  get_monthly_summary: {
    ym?: string;
  };
  get_settings: Record<string, never>;
  update_settings: {
    monthly_income?: number;
    savings_goal?: number;
    budget_survival?: number;
    budget_optional?: number;
    budget_culture?: number;
    budget_extra?: number;
  };
  classify_expense: {
    text: string;
  };
  search_similar_expenses: {
    query: string;
    limit?: number;
  };
}
