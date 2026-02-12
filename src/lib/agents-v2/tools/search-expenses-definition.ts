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
        description: `Busca gastos usando lenguaje natural LIBRE, sin restricciones de categorías.

**USA ESTA HERRAMIENTA cuando el usuario pida:**
- **Último(s) gasto(s)**: "último gasto", "gastos recientes", "mis últimas compras"
- **Conceptos específicos**: "vicios", "gimnasio", "suscripciones", "comida", "restaurantes"
- **Búsquedas con condiciones**: "restaurantes caros", "gastos pequeños", "compras grandes"
- **Cualquier cosa que NO sea una de las 4 categorías Kakebo base**

**MUY IMPORTANTE para updateTransaction:**
Esta herramienta retorna el ID de cada gasto encontrado. SIEMPRE úsala ANTES de updateTransaction para obtener el transactionId.

**NO uses esta herramienta para:**
- Categorías Kakebo base: "supervivencia", "opcional", "cultura", "extra" (usa analyzeSpendingPattern)
- Análisis de tendencias o patrones (usa analyzeSpendingPattern)
- Estado de presupuesto (usa getBudgetStatus)

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
