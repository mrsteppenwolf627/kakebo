import type { ChatCompletionTool } from "openai/resources/chat/completions";

/**
 * Tool 7: Submit Search Feedback (User Learning)
 *
 * Allows the agent to learn from user corrections.
 * When user says "X is NOT Y", the agent saves this correction.
 */
const submitFeedbackTool: ChatCompletionTool = {
    type: "function",
    function: {
        name: "submitFeedback",
        description: `Guarda correcciones del usuario para mejorar futuras búsquedas.

**USA ESTA HERRAMIENTA cuando el usuario corrija resultados de búsqueda:**

Ejemplos de cuándo USAR:
- "La insulina NO es un vicio" → submitFeedback({ query: "vicios", incorrectExpenses: ["id-insulina"] })
- "El vaper SÍ es un vicio" → submitFeedback({ query: "vicios", correctExpenses: ["id-vaper"] })
- "Eso NO es comida" → submitFeedback({ query: "comida", incorrectExpenses: ["id-gasto"] })

**Cómo detectar correcciones:**
- Usuario dice "X NO es Y" → marca X como incorrecto para query "Y"
- Usuario dice "X SÍ es Y" → marca X como correcto para query "Y"
- Usuario dice "Eso está mal" después de una búsqueda → marca los gastos incorrectos

**IMPORTANTE:**
- Solo usa esto DESPUÉS de haber hecho una búsqueda con searchExpenses
- Necesitas los expense_id de los gastos que el usuario está corrigiendo
- El agente aprenderá y NO volverá a mostrar gastos marcados como incorrectos

**Beneficio:**
El agente se vuelve más inteligente con cada corrección. La próxima vez que el usuario busque lo mismo, los resultados serán mejores.`,
        parameters: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description: `La consulta original que el usuario está corrigiendo.
Ejemplo: Si usuario buscó "vicios" y luego dijo "la insulina NO es un vicio", query = "vicios"`,
                },
                correctExpenses: {
                    type: "array",
                    items: { type: "string" },
                    description: `IDs de gastos que SÍ deberían estar incluidos en esta búsqueda.
Usa esto cuando usuario confirma que algo SÍ pertenece a la categoría.`,
                },
                incorrectExpenses: {
                    type: "array",
                    items: { type: "string" },
                    description: `IDs de gastos que NO deberían estar incluidos en esta búsqueda.
Usa esto cuando usuario dice que algo NO pertenece a la categoría.`,
                },
            },
            required: ["query"],
        },
    },
};

export { submitFeedbackTool };
