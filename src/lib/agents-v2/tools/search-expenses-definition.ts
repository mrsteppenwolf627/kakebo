import type { ChatCompletionTool } from "openai/resources/chat/completions";
import { SUBCATEGORY_IDS } from "@/lib/subcategories";

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

**Cómo funciona (BÚSQUEDA TRANSVERSAL):**
Busca en TODAS las categorías (Supervivencia, Opcional, Cultura, Extra) simultáneamente.
Usa embeddings semánticos para entender el contexto. Por ejemplo:
- "comida" encuentra: Mercadona [Supervivencia], restaurantes [Opcional], delivery [Opcional]
- "vicios" encuentra: tabaco [Opcional], alcohol [Opcional], energéticas [Supervivencia]
- "salud" encuentra: farmacia [Supervivencia], dentista [Supervivencia], yoga [Opcional]

Cada resultado incluye su campo "category" — SIEMPRE muéstraselo al usuario.
Usa las correcciones previas del PROPIO usuario para categorizar mejor (ver sección 11 del sistema). No existe hoy ninguna vía de aprendizaje colectivo activa: nunca sugieras que esta búsqueda mejora a partir de otras cuentas.

**Totales fiables (cycle_scope y/o subcategories):** cuando uses "cycle_scope" y/o "subcategories", el resultado incluye "totalCount" y "totalAmount" calculados sobre TODOS los gastos coincidentes, no solo los que aparecen en "expenses" (que puede estar limitado por "limit"). Usa siempre "totalCount"/"totalAmount" para dar cifras al usuario, y "returnedCount" solo para explicar cuántos se están mostrando en detalle.

**⚠️ OBLIGATORIO en TODA llamada: "search_intent".** Sin él (o si lo omites), la llamada se bloqueará y se te pedirá el ámbito antes de ejecutarse. Ver el parámetro "search_intent" para el criterio exacto.`,
        parameters: {
            type: "object",
            properties: {
                search_intent: {
                    type: "string",
                    enum: ["individual_lookup", "analysis"],
                    description: `OBLIGATORIO EN TODA LLAMADA. Clasifica la intención real de la búsqueda:

- "individual_lookup": localizar UN gasto concreto (para mostrarlo, editarlo o corregirlo). Ejemplos: "busca mi último gasto de Netflix", "el gasto de ayer de Mercadona". Exento de "cycle_scope".
- "analysis": totales, categorías, hábitos, comparativas, resúmenes, tendencias, "cuánto he gastado", "gastos de X" como pregunta agregada, o cualquier consulta que no sea localizar un único gasto. SIEMPRE requiere "cycle_scope" — si no lo tienes, la llamada se bloqueará y se preguntará el ámbito al usuario en vez de ejecutarse.

Si tienes dudas sobre cuál aplica, usa "analysis" (es el valor conservador). Nunca omitas este campo.`,
                },
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
                    description: `Período de tiempo de CALENDARIO. Por defecto: "current_month". Usa "all" para buscar en TODO el histórico.

⚠️ Kakebo usa ciclos libres: el usuario puede cerrar su ciclo cualquier día, y un gasto conserva su fecha real aunque pertenezca al ciclo siguiente ya abierto. Por eso, si el usuario pregunta por "este mes", "el ciclo actual" o "mi mes" en el sentido de Kakebo (no del calendario), usa "cycle_scope" en vez de (o además de) "period" — "period" sigue existiendo por compatibilidad, pero "cycle_scope" tiene prioridad si se indica.`,
                },
                cycle_scope: {
                    type: "string",
                    enum: ["current", "specific", "all_history"],
                    description: `Ámbito de CICLO REAL (ciclos libres), preferible a "period" cuando el usuario habla de su ciclo Kakebo:
- "current": el ciclo actualmente ABIERTO del usuario (nunca se calcula por fecha de calendario — usa el ciclo real, aunque el usuario lo haya cerrado anticipadamente y algunos gastos de ese ciclo tengan fecha real del mes natural anterior).
- "specific": un ciclo concreto (abierto o cerrado) identificado por "cycle_ym". Puedes consultar ciclos cerrados en modo lectura.
- "all_history": todo el histórico del usuario, sin filtrar por ciclo.

Si se indica "cycle_scope", prevalece sobre "period". El resultado incluye "resolvedScope" con el ciclo realmente resuelto (etiqueta YYYY-MM y si está abierto o cerrado) — úsalo para explicar con precisión qué ciclo se consultó.`,
                },
                cycle_ym: {
                    type: "string",
                    description: `Identificador del ciclo cuando cycle_scope = "specific", en formato "YYYY-MM" (ej: "2026-10"). Corresponde a la etiqueta (year, month) del ciclo en el sistema, no a un rango de fechas — un ciclo etiquetado "2026-10" puede contener gastos con fecha real de finales de septiembre si el usuario cerró el ciclo anterior anticipadamente.`,
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
                subcategories: {
                    type: "array",
                    items: { type: "string", enum: [...SUBCATEGORY_IDS] },
                    description: `Filtro EXACTO (no semántico) por una o varias subcategorías. Úsalo cuando el usuario pida algo que mapea claramente a una subcategoría del catálogo, especialmente para distinguir:
- "gastos de supermercado/comida para casa" → subcategories: ["food_basic"]
- "gastos de restaurantes/comer fuera/a domicilio" → subcategories: ["dining_out"]

Si se usa este filtro, el resultado incluye "coverage" (cuántos gastos del periodo tienen subcategoría asignada y cuántos no) — SIEMPRE avisa al usuario si hay gastos sin clasificar, no presentes el resultado como exhaustivo sobre datos históricos sin subcategoría. Si no hay una subcategoría clara, omite este campo y deja que la búsqueda por texto/categoría se encargue.

⚠️ Usar "subcategories" implica automáticamente "search_intent": "analysis" — si lo usas, incluye también "cycle_scope", o la llamada se bloqueará.`,
                },
            },
            // query es opcional (por defecto "último"); search_intent es
            // obligatorio en toda llamada (Fase 2.D) — sin él se bloquea la
            // ejecución y se pregunta el ámbito antes de buscar nada.
            required: ["search_intent"],
        },
    },
};

export { searchExpensesTool };
