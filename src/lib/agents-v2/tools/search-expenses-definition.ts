import type { ChatCompletionTool } from "openai/resources/chat/completions";

/**
 * Tool 6: Search Expenses (Free-form Natural Language)
 *
 * Allows searching expenses using ANY natural language query.
 * Uses semantic embeddings to understand context.
 * 
 * Examples:
 * - "vicios" → tobacco, alcohol, gambling
 * - "restaurantes caros" → restaurants >€30
 * - "gimnasio" → gym memberships, classes
 */
const searchExpensesTool: ChatCompletionTool = {
    type: "function",
    function: {
        name: "searchExpenses",
        description: `🎯 **HERRAMIENTA PREDETERMINADA** para buscar y LISTAR gastos individuales con detalles.

**✅ USA SIEMPRE cuando el usuario diga "gastos de X":**
- "gastos de comida" → query: "comida"
- "gastos de salud" → query: "salud"
- "gastos de restaurantes" → query: "restaurantes"
- "gastos de transporte" → query: "transporte"
- "gastos de ocio" → query: "ocio"
- "mis gastos de gimnasio" → query: "gimnasio"
- "gastos de suscripciones" → query: "suscripciones"
- "gastos de medicinas" → query: "medicinas"

**✅ También úsala para:**
- **Últimos gastos**: "último gasto", "gastos recientes", "mis últimas compras"
- **Conceptos específicos**: "vicios", "Netflix", "Mercadona"
- **Búsquedas con condiciones**: "restaurantes caros" (usa minAmount), "gastos pequeños" (usa maxAmount)

**✅ CRÍTICO para updateTransaction:**
Esta herramienta retorna el ID de cada gasto. SIEMPRE úsala ANTES de updateTransaction para obtener el transactionId real.

**❌ NO uses esta herramienta SOLO para:**
- Totales sin detalles: "¿cuánto llevo gastado?" (usa analyzeSpendingPattern)
- Estado de presupuesto: "¿cómo va mi presupuesto?" (usa getBudgetStatus)

**Cómo funciona:**
Usa embeddings semánticos para entender el contexto. Por ejemplo:
- "vicios" encuentra: tabaco, alcohol, apuestas, vaper
- "comida" encuentra: supermercado, restaurantes, delivery (en TODAS las categorías)
- "gimnasio" encuentra: cuotas, clases, entrenador personal

Aprende de TODOS los usuarios, así que mejora con el tiempo.`,
        parameters: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description: `Consulta en lenguaje natural. Ejemplos:

**Para encontrar último gasto (COMÚN para updateTransaction):**
- "último" o "last" → Encuentra el gasto más reciente
- "reciente" → Gastos recientes

**Para buscar por concepto:**
- "vicios"
- "restaurantes"
- "gimnasio"
- "suscripciones"
- "comida"
- "transporte"
- "salud"

Sé específico. El sistema entiende contexto humano.`,
                },
                period: {
                    type: "string",
                    enum: [
                        "current_month",
                        "last_month",
                        "last_3_months",
                        "last_6_months",
                        "current_week",
                        "last_week",
                        "all",
                    ],
                    description: `Período de tiempo. Por defecto: "current_month"

Usa "all" para buscar en TODO el histórico.`,
                },
                minAmount: {
                    type: "number",
                    description: `Filtro de importe mínimo. Ejemplo:
- Para "restaurantes caros": minAmount: 30
- Para "gastos grandes": minAmount: 100`,
                },
                maxAmount: {
                    type: "number",
                    description: `Filtro de importe máximo. Ejemplo:
- Para "gastos pequeños": maxAmount: 10`,
                },
                limit: {
                    type: "number",
                    description: `Número máximo de resultados (default: 20, max: 50)`,
                },
            },
            required: [], // query is optional, defaults to "último" if not provided
        },
    },
};

export { searchExpensesTool };
