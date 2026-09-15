/**
 * OpenAI Function Calling tool definitions
 *
 * These definitions map the existing Kakebo tools to OpenAI's function calling format.
 * Each tool includes detailed semantic mapping to help GPT understand user intent naturally.
 */

import type { ChatCompletionTool } from "openai/resources/chat/completions";
import { searchExpensesTool } from "./search-expenses-definition";
import { submitFeedbackTool } from "./submit-feedback-definition";
import { SUBCATEGORY_IDS, SUBCATEGORIES } from "@/lib/subcategories";

/**
 * Tool 1: Analyze Spending Habits (Fase 2.F)
 *
 * Análisis agregado y de HÁBITOS (totales, distribución, gastos frecuentes,
 * concentración, comparativas explícitas) sobre un ÁMBITO DE CICLO REAL —
 * nunca sobre meses de calendario. Todo número sale de cálculo determinista
 * sobre los gastos reales; el modelo solo redacta y explica.
 */
const analyzeSpendingPatternTool: ChatCompletionTool = {
  type: "function",
  function: {
    name: "analyzeSpendingPattern",
    description: `Analiza patrones y HÁBITOS de gasto AGREGADOS (totales, distribución por categoría/subcategoría, gastos más frecuentes, mayores gastos, y comparativas cuando se pidan explícitamente) sobre un ámbito de ciclo real.

**⚠️ REGLA CRÍTICA: USA searchExpenses PRIMERO para "gastos de X" (listar gastos individuales)**

**Úsala cuando el usuario pida ESTADÍSTICAS o HÁBITOS, sin listar cada gasto:**
- "¿cuánto he gastado este ciclo?" (solo total)
- "resumen de gastos por categoría"
- "analiza mis hábitos de este ciclo" / "¿tengo algún patrón raro de gasto?"
- "¿estoy gastando más en opcional que en mi ciclo anterior?" (comparación EXPLÍCITA)
- "¿qué gasto se repite más?"

**❌ NO LA USES cuando el usuario quiera VER GASTOS INDIVIDUALES:**
- "gastos de comida" → USA searchExpenses (lista gastos específicos)
- "muéstrame los gastos de X" → USA searchExpenses
- CUALQUIER consulta donde el usuario quiera DETALLES de gastos concretos → USA searchExpenses

**⚠️ ÁMBITO DE CICLO OBLIGATORIO (cycle_scope) — sin excepción:**
Esta tool SIEMPRE es una consulta agregada — a diferencia de searchExpenses, no existe aquí ningún caso "individual_lookup" exento. Debes indicar SIEMPRE cycle_scope:
- "current": el ciclo actualmente abierto del usuario.
- "previous": el ciclo INMEDIATAMENTE ANTERIOR al ciclo actualmente abierto (resuelto siempre por los ciclos reales del usuario, nunca por mes de calendario). Úsalo SIEMPRE que el usuario diga "ciclo anterior", "mi ciclo anterior", "ciclo pasado" o equivalentes — NUNCA lo traduzcas a "specific" con un cycle_ym inventado ni a "current". Si no hay ciclo anterior disponible, la herramienta lo dirá con claridad; no inventes ningún mes.
- "specific": un ciclo concreto ya identificado (aporta cycle_ym, formato YYYY-MM) — incluye ciclos YA CERRADOS, cuya lectura está permitida. Úsalo solo cuando el usuario identifique un ciclo distinto al inmediatamente anterior (p. ej. "el ciclo de agosto"), nunca como sustituto de "previous".
- "all_history": todo el histórico, sin restringir a ningún ciclo.

Si el usuario no ha dejado claro el ámbito, NO llames a esta tool — el orquestador bloqueará la llamada igualmente y se le preguntará. Nunca asumas "el ciclo actual" salvo que el usuario lo haya elegido expresamente (ni tampoco un mes de calendario natural). Si el usuario pide su "ciclo anterior" y no usas cycle_scope: "previous" (o compare_cycle_scope: "previous" cuando corresponda a la comparación), el orquestador bloqueará la llamada igualmente.

**⚠️ COMPARACIÓN SOLO SI SE PIDE EXPLÍCITAMENTE:**
- Usa compare: true SOLO cuando el usuario pida comparar, evolución, cambio o tendencia frente a OTRO ciclo (p. ej. "¿he gastado más que el ciclo pasado?", "¿cómo ha evolucionado mi gasto en ocio?").
- Cuando compare: true, indica también compare_cycle_scope (y compare_cycle_ym si es "specific") — el ciclo contra el que se compara. Si no lo tienes claro, no lo inventes: el orquestador pedirá esa aclaración.
- Si el usuario NO ha pedido comparar, NO uses compare — no añadas un segundo ciclo "por si acaso".

**MAPEO SEMÁNTICO CRÍTICO - Categorías:**
- **"survival"** (Supervivencia): comida, alimentación, supermercado, vivienda, alquiler, transporte, gasolina, medicinas, farmacia
- **"optional"** (Opcional): ocio, entretenimiento, restaurantes, comer fuera, cine, ropa, compras, viajes
- **"culture"** (Cultura): educación, formación, cursos, libros, museos, desarrollo personal
- **"extra"** (Extra): imprevistos, emergencias, regalos, otros
- **"all"** (Todas): cuando el usuario no especifica categoría o pide análisis general

**Ejemplos correctos:**
- "¿cuánto llevo gastado este ciclo?" → { cycle_scope: "current", category: "all" }
- "analiza mis hábitos de este ciclo" → { cycle_scope: "current", category: "all" }
- "resumen de supervivencia del ciclo de agosto" → { cycle_scope: "specific", cycle_ym: "2026-08", category: "survival" }
- "analiza mi ciclo anterior" → { cycle_scope: "previous", category: "all" }
- "¿he gastado más en opcional que en mi ciclo anterior?" → { cycle_scope: "current", category: "optional", compare: true, compare_cycle_scope: "previous" }

**Sobre el resultado:** usa SIEMPRE los campos ya calculados (totalAmount, count, byCategory, bySubcategory, mostFrequent, topExpenses, comparison, observations, possiblePatterns, recommendations) — nunca sumes ni cuentes tú mismo. Si "limited" es true, dilo con claridad: hay demasiado pocos gastos para detectar patrones fiables, y "possiblePatterns"/"recommendations" estarán vacíos a propósito. Distingue siempre observación (hecho verificable) de posible patrón (señal, no concluyente) y de recomendación (sugerencia genérica y prudente, nunca un diagnóstico). Si "coverage.unclassified" > 0, avisa de que el desglose por subcategoría no es exhaustivo sobre histórico sin clasificar.`,

    parameters: {
      type: "object",
      properties: {
        cycle_scope: {
          type: "string",
          enum: ["current", "previous", "specific", "all_history"],
          description: `Ámbito de ciclo real (obligatorio, sin excepción):
- "current": ciclo actualmente abierto.
- "previous": el ciclo inmediatamente anterior al actual. Úsalo SIEMPRE para "ciclo anterior"/"ciclo pasado" — nunca lo sustituyas por "specific" con un cycle_ym adivinado.
- "specific": ciclo concreto (aporta cycle_ym) — permite leer ciclos cerrados.
- "all_history": todo el histórico.

NUNCA se resuelve por mes de calendario ni se omite.`,
        },
        cycle_ym: {
          type: "string",
          description: `Requerido cuando cycle_scope es "specific". Formato YYYY-MM (p. ej. "2026-08").`,
        },
        category: {
          type: "string",
          enum: ["survival", "optional", "culture", "extra", "all"],
          description: `Categoría de gasto. USA INTELIGENCIA SEMÁNTICA para mapear términos naturales:
- "comida", "alimentación", "supermercado" → "survival"
- "ocio", "entretenimiento", "restaurantes", "cine", "ropa" → "optional"
- "educación", "libros", "cursos" → "culture"
- "imprevistos", "regalos" → "extra"
- Usuario no especifica categoría → "all"

Por defecto: "all"`,
        },
        compare: {
          type: "boolean",
          description: `true SOLO cuando el usuario pida explícitamente comparar, evolución, cambio o tendencia frente a otro ciclo. Requiere compare_cycle_scope. Por defecto: false (nunca compares "por si acaso").`,
        },
        compare_cycle_scope: {
          type: "string",
          enum: ["current", "previous", "specific", "all_history"],
          description: `Ámbito del ciclo de comparación. Requerido cuando compare es true. Usa "previous" cuando el usuario pida comparar con su ciclo anterior/pasado — nunca "specific" con un cycle_ym adivinado.`,
        },
        compare_cycle_ym: {
          type: "string",
          description: `Requerido cuando compare_cycle_scope es "specific". Formato YYYY-MM.`,
        },
        limit: {
          type: "number",
          description: `Número máximo de elementos en las listas de gastos más frecuentes / mayores gastos.
- Por defecto: 5
- Máximo: 20`,
        },
      },
      required: ["cycle_scope"],
    },
  },
};

/**
 * Tool 2: Get Budget Status
 *
 * Checks how user's spending compares to their budget limits.
 */
const getBudgetStatusTool: ChatCompletionTool = {
  type: "function",
  function: {
    name: "getBudgetStatus",
    description: `Verifica el estado del presupuesto del usuario, comparando gastos reales con límites establecidos.

**Úsala cuando el usuario pregunte sobre:**
- Estado del presupuesto (ej: "¿cómo va mi presupuesto?", "¿he superado el presupuesto?")
- Cuánto le queda del presupuesto (ej: "¿cuánto me queda?", "saldo disponible")
- Si está dentro del límite (ej: "¿voy bien con el presupuesto?")
- Porcentaje usado del presupuesto

**Información que proporciona:**
- Presupuesto total y por categoría
- Gasto acumulado vs presupuesto
- Porcentaje usado
- Proyección de gasto para fin de mes
- Estado: safe (seguro), warning (advertencia), exceeded (superado)

**Ejemplos:**
- "¿Cómo va mi presupuesto?" → NO pasar month (usa mes actual automáticamente)
- "¿He superado el presupuesto de ocio?" → NO pasar month, category: "optional"
- "Presupuesto del mes pasado" → month: "2026-01" (si hoy es febrero 2026)

**IMPORTANTE:** La fecha actual es 2026-02-13. Usa siempre el año correcto (2026).`,

    parameters: {
      type: "object",
      properties: {
        month: {
          type: "string",
          description: `Mes a consultar en formato YYYY-MM.

**FECHA ACTUAL: 2026-02-13**

Ejemplos:
- Usuario dice "este mes" o "cómo va mi presupuesto": NO pasar este parámetro (usará 2026-02 automáticamente)
- Usuario dice "mes pasado" o "enero": month: "2026-01"
- Usuario dice "febrero": month: "2026-02"

**NUNCA uses años antiguos como 2024 o 2025. Estamos en 2026.**

Por defecto: mes actual (2026-02)`,
        },
        category: {
          type: "string",
          enum: ["survival", "optional", "culture", "extra"],
          description: `Categoría específica de presupuesto a consultar. Usar mismo mapeo semántico que analyzeSpendingPattern.
Si no se especifica, retorna estado de TODAS las categorías.

Por defecto: undefined (todas las categorías)`,
        },
      },
      required: [],
    },
  },
};

/**
 * Tool 3: Detect Anomalies
 *
 * Identifies unusual spending patterns that may need user attention.
 */
const detectAnomaliesTool: ChatCompletionTool = {
  type: "function",
  function: {
    name: "detectAnomalies",
    description: `Detecta gastos inusuales o anomalías en los patrones de gasto del usuario.

**Úsala cuando el usuario pregunte sobre:**
- Gastos raros o inusuales (ej: "¿hay algo raro?", "gastos extraños")
- Anomalías (ej: "detecta anomalías", "gastos fuera de lo normal")
- Gastos altos inesperados (ej: "¿he gastado mucho en algo?")
- Revisión de gastos sospechosos

**Qué detecta:**
1. **Gastos inusualmente altos**: Gastos que superan significativamente el promedio histórico
2. **Categorías raras**: Gastos en categorías poco usadas
3. **Timing inusual**: Múltiples gastos grandes en un mismo día

**Niveles de sensibilidad:**
- "low": Menos estricto (solo anomalías muy claras)
- "medium": Balance entre detección y falsos positivos
- "high": Muy sensible (detecta pequeñas desviaciones)

**Ejemplos:**
- "¿Hay algo raro en mis gastos?" → period: "current_month", sensitivity: "medium"
- "Gastos extraños esta semana" → period: "last_week"
- "Detecta anomalías con alta sensibilidad" → sensitivity: "high"`,

    parameters: {
      type: "object",
      properties: {
        period: {
          type: "string",
          enum: ["current_month", "last_week", "last_3_days"],
          description: `Período a analizar para anomalías:
- "current_month": Este mes completo
- "last_week": Últimos 7 días
- "last_3_days": Últimos 3 días (muy reciente)

Por defecto: "current_month"`,
        },
        sensitivity: {
          type: "string",
          enum: ["low", "medium", "high"],
          description: `Nivel de sensibilidad de la detección:
- "low": Solo anomalías muy evidentes (3 desviaciones estándar)
- "medium": Balance estándar (2 desviaciones estándar)
- "high": Detecta pequeñas desviaciones (1.5 desviaciones estándar)

Por defecto: "medium"`,
        },
      },
      required: [],
    },
  },
};

/**
 * Tool 4: Predict Monthly Spending
 *
 * Projects end-of-month spending based on current patterns.
 */
const predictMonthlySpendingTool: ChatCompletionTool = {
  type: "function",
  function: {
    name: "predictMonthlySpending",
    description: `Predice el gasto total al final del mes basándose en los patrones actuales de gasto.

**Úsala cuando el usuario pregunte sobre:**
- Proyección de gastos (ej: "¿cuánto voy a gastar este mes?", "estimación de gastos")
- Predicción de fin de mes (ej: "¿llegaré al presupuesto?", "proyección")
- Cuánto gastará al final del mes
- Si superará el presupuesto

**Cómo funciona:**
- Usa el gasto acumulado hasta hoy
- Calcula el promedio diario (con más peso a días recientes)
- Proyecta hasta el fin de mes
- Compara con el presupuesto establecido
- Indica nivel de confianza según días transcurridos

**Niveles de confianza:**
- "high": Más de 20 días del mes transcurridos (predicción muy confiable)
- "medium": 10-20 días transcurridos (predicción moderadamente confiable)
- "low": Menos de 10 días (poca data, predicción menos confiable)

**Ejemplos:**
- "¿Cuánto voy a gastar este mes?" → month: current, category: undefined
- "Proyección de gastos de ocio" → month: current, category: "optional"
- "¿Superaré mi presupuesto de comida?" → month: current, category: "survival"`,

    parameters: {
      type: "object",
      properties: {
        month: {
          type: "string",
          description: `Mes a predecir en formato YYYY-MM.
Generalmente será el mes ACTUAL, ya que la predicción se hace sobre el mes en curso.

Por defecto: mes actual`,
        },
        category: {
          type: "string",
          enum: ["survival", "optional", "culture", "extra"],
          description: `Categoría específica a predecir. Usar mismo mapeo semántico.
Si no se especifica, predice TODAS las categorías.

Por defecto: undefined (todas las categorías)`,
        },
      },
      required: [],
    },
  },
};

/**
 * Tool 5: Get Spending Trends
 *
 * Analyzes long-term spending trends over weeks or months.
 */
const getSpendingTrendsTool: ChatCompletionTool = {
  type: "function",
  function: {
    name: "getSpendingTrends",
    description: `Analiza tendencias de gasto a largo plazo, mostrando la evolución del gasto en semanas o meses.

**Úsala cuando el usuario pregunte sobre:**
- Tendencias de gasto (ej: "¿cómo han evolucionado mis gastos?", "tendencias")
- Evolución temporal (ej: "gastos en los últimos meses", "evolución de gastos")
- Comparación entre períodos (ej: "¿estoy gastando más que antes?")
- Análisis histórico (ej: "historial de gastos", "gastos del último año")

**Información que proporciona:**
- Serie temporal de gastos (por semana o mes)
- Tendencia general: increasing (creciente), decreasing (decreciente), stable (estable)
- Porcentaje de cambio en la tendencia
- Promedio del período
- Pico (máximo) y valle (mínimo) de gasto
- Número de gastos por período

**Diferencia con analyzeSpendingPattern:**
- analyzeSpendingPattern: Análisis detallado de un período corto (días/semanas)
- getSpendingTrends: Visión de largo plazo con evolución temporal (meses/año)

**Ejemplos:**
- "¿Cómo han evolucionado mis gastos?" → period: "last_6_months", groupBy: "month"
- "Tendencia de gastos de ocio en el último año" → period: "last_year", groupBy: "month", category: "optional"
- "Gastos semanales de los últimos 3 meses" → period: "last_3_months", groupBy: "week"`,

    parameters: {
      type: "object",
      properties: {
        period: {
          type: "string",
          enum: ["last_3_months", "last_6_months", "last_year"],
          description: `Período histórico a analizar:
- "last_3_months": Últimos 3 meses (trimestre)
- "last_6_months": Últimos 6 meses (semestre)
- "last_year": Último año completo

REQUERIDO - debe especificarse`,
        },
        groupBy: {
          type: "string",
          enum: ["week", "month"],
          description: `Nivel de agrupación temporal:
- "week": Agrupar por semanas (para períodos cortos: 3-6 meses)
- "month": Agrupar por meses (para períodos largos: 6 meses - 1 año)

Recomendación:
- last_3_months → "week"
- last_6_months → "month"
- last_year → "month"

REQUERIDO - debe especificarse`,
        },
        category: {
          type: "string",
          enum: ["survival", "optional", "culture", "extra"],
          description: `Categoría específica a analizar. Usar mismo mapeo semántico.
Si no se especifica, analiza TODAS las categorías juntas.

Por defecto: undefined (todas las categorías)`,
        },
      },
      required: ["period", "groupBy"], // Estos dos son obligatorios
    },
  },
};

/**
 * Tool 6: Create Transaction
 *
 * Creates a new expense or income when user requests it naturally.
 */
const createTransactionTool: ChatCompletionTool = {
  type: "function",
  function: {
    name: "createTransaction",
    description: `Crea un nuevo gasto o ingreso en nombre del usuario.

**Úsala cuando el usuario pida:**
- Registrar un gasto (ej: "registra 50€ de comida", "apunta un gasto de 30€ en ocio")
- Añadir un ingreso (ej: "añade un ingreso de 1500€", "registra mi nómina")
- Crear una transacción (ej: "crea un gasto de 25€ en transporte")

**IMPORTANTE - Confirmación del usuario:**
- SIEMPRE confirma los detalles ANTES de llamar a esta herramienta
- Pregunta concepto, importe, categoría si no están claros
- Solo llama a la herramienta después de tener confirmación explícita

**Mapeo de categorías (igual que analyzeSpendingPattern):**
- "comida", "supermercado", "transporte" → "survival"
- "ocio", "restaurantes", "cine", "ropa" → "optional"
- "libros", "cursos", "educación" → "culture"
- "imprevistos", "regalos" → "extra"`,

    parameters: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["expense", "income"],
          description: `Tipo de transacción:
- "expense": Gasto (lo más común)
- "income": Ingreso

Por defecto: "expense"`,
        },
        amount: {
          type: "number",
          description: "Importe de la transacción en EUR. Debe ser mayor que 0.",
        },
        concept: {
          type: "string",
          description: `Concepto o descripción de la transacción.
Ejemplos: "Compra en Mercadona", "Cena con amigos", "Netflix", "Transporte público"`,
        },
        category: {
          type: "string",
          enum: ["survival", "optional", "culture", "extra"],
          description: `Categoría Kakebo. Usar mismo mapeo semántico que analyzeSpendingPattern:
- "survival": comida, vivienda, transporte, salud
- "optional": ocio, restaurantes, ropa, viajes
- "culture": educación, libros, museos
- "extra": imprevistos, regalos`,
        },
        subcategory: {
          type: "string",
          enum: [...SUBCATEGORY_IDS],
          description: `Subcategoría opcional (solo para gastos), más específica que la categoría Kakebo. Úsala solo si el concepto la deja clara; si hay duda, omite el campo.

**Distinción obligatoria:**
- "food_basic": supermercado, mercado, comida para casa (ej: Mercadona, Carrefour).
- "dining_out": restaurantes, bares, chiringuitos, comida a domicilio (ej: cena fuera, delivery).

Resto del catálogo: ${SUBCATEGORY_IDS.filter((id) => id !== "food_basic" && id !== "dining_out")
            .map((id) => `"${id}" (${SUBCATEGORIES[id].description})`)
            .join(", ")}.`,
        },
        date: {
          type: "string",
          description: `Fecha de la transacción en formato YYYY-MM-DD.

**IMPORTANTE - Interpretación de fechas relativas:**
Debes calcular la fecha correcta cuando el usuario use expresiones temporales:
- "hoy", "ahora" → fecha actual (YYYY-MM-DD)
- "ayer", "de ayer" → fecha de ayer (calcula: fecha actual - 1 día)
- "anteayer", "antes de ayer" → fecha de anteayer (calcula: fecha actual - 2 días)
- "hace 3 días" → fecha hace 3 días (calcula: fecha actual - 3 días)
- "la semana pasada" → calcula el día específico de la semana pasada

**Fecha actual de referencia:** ${new Date().toISOString().split("T")[0]} (YYYY-MM-DD)

Si no se especifica fecha, usa la fecha actual.

Ejemplos:
- Usuario: "registra un gasto de ayer" → date: "${new Date(Date.now() - 86400000).toISOString().split("T")[0]}"
- Usuario: "añade un gasto de hoy" → date: "${new Date().toISOString().split("T")[0]}"
- Usuario: "apunta 50€ de hace 2 días" → date: "${new Date(Date.now() - 172800000).toISOString().split("T")[0]}"`,
        },
        notes: {
          type: "string",
          description: "Notas adicionales opcionales sobre la transacción",
        },
      },
      required: ["type", "amount", "concept", "category"],
    },
  },
};

/**
 * Tool 7: Update Transaction
 *
 * Updates an existing expense or income when user wants to correct something.
 */
const updateTransactionTool: ChatCompletionTool = {
  type: "function",
  function: {
    name: "updateTransaction",
    description: `Modifica un gasto o ingreso existente.

**Úsala cuando el usuario pida:**
- Cambiar un importe (ej: "cambia el último gasto a 45€")
- Reclasificar (ej: "mueve ese gasto a opcional")
- Corregir concepto (ej: "cambia el concepto a 'Cena con Ana'")
- Modificar fecha (ej: "ese gasto fue ayer, no hoy")

**IMPORTANTE:**
- Necesitas el ID de la transacción (usa searchExpenses primero si no lo tienes)
- Al menos uno de: amount, concept, category, date debe ser proporcionado`,

    parameters: {
      type: "object",
      properties: {
        transactionId: {
          type: "string",
          description: `UUID del gasto/ingreso a modificar (formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx).

IMPORTANTE:
1. Usa searchExpenses primero para obtener el ID si el usuario dice "el último gasto"
2. Extrae el campo "id" del primer elemento del array "expenses" del resultado
3. El ID es un UUID completo, NO un número como "1" o "2"

Ejemplo de extracción correcta:
- searchExpenses retorna: { expenses: [{ id: "abc-123-def", concept: "...", amount: 50 }] }
- Debes usar: transactionId: "abc-123-def"`,
        },
        type: {
          type: "string",
          enum: ["expense", "income"],
          description: `Tipo de transacción a modificar:
- "expense": Gasto (por defecto)
- "income": Ingreso

Por defecto: "expense"`,
        },
        amount: {
          type: "number",
          description: "Nuevo importe (opcional). Debe ser mayor que 0.",
        },
        concept: {
          type: "string",
          description: "Nuevo concepto/descripción (opcional)",
        },
        category: {
          type: "string",
          enum: ["survival", "optional", "culture", "extra"],
          description: `Nueva categoría (opcional). Usar mismo mapeo semántico.`,
        },
        date: {
          type: "string",
          description: "Nueva fecha en formato YYYY-MM-DD (opcional)",
        },
      },
      required: ["transactionId"],
    },
  },
};

/**
 * Tool 8: Calculate What-If Scenario
 *
 * Creates a financial scenario for "what-if" planning.
 */
const calculateWhatIfTool: ChatCompletionTool = {
  type: "function",
  function: {
    name: "calculateWhatIf",
    description: `Crea un escenario financiero "what-if" para planificar gastos futuros.

**Úsala cuando el usuario pregunte:**
- Planificar algo futuro (ej: "quiero ahorrar para vacaciones en agosto", "cuánto tengo que ahorrar para un curso de 500€")
- Calcular ahorro mensual (ej: "si quiero comprar un portátil de 800€ en 6 meses, ¿cuánto debo ahorrar?")
- Crear objetivo financiero (ej: "quiero ahorrar 2000€ para diciembre")

**Características:**
- Calcula automáticamente el ahorro mensual necesario
- Guarda el escenario para seguimiento
- Proporciona consejos sobre viabilidad

**Ejemplos:**
- "Quiero irme de vacaciones en agosto, costarán 1200€" → name: "Vacaciones Agosto", estimatedCost: 1200, targetDate: "2024-08-01"
- "Necesito ahorrar 500€ para un curso" → name: "Curso formación", estimatedCost: 500`,

    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: `Nombre descriptivo del escenario.
Ejemplos: "Vacaciones Agosto 2024", "Nuevo laptop", "Curso React", "Arreglo coche"`,
        },
        estimatedCost: {
          type: "number",
          description: "Coste estimado del escenario en EUR. Debe ser mayor que 0.",
        },
        category: {
          type: "string",
          enum: ["survival", "optional", "culture", "extra"],
          description: `Categoría del gasto futuro:
- "survival": necesidades básicas
- "optional": ocio, viajes
- "culture": educación, formación
- "extra": imprevistos`,
        },
        targetDate: {
          type: "string",
          description: `Fecha objetivo en formato YYYY-MM-DD.
Si se proporciona, calcula automáticamente el ahorro mensual necesario.
Ejemplos: "2024-08-01", "2024-12-31"`,
        },
        description: {
          type: "string",
          description: "Descripción adicional opcional del escenario",
        },
      },
      required: ["name", "estimatedCost", "category"],
    },
  },
};

/**
 * Tool 9: Set Budget
 *
 * Sets or updates budget for a category and cycle.
 */
const setBudgetTool: ChatCompletionTool = {
  type: "function",
  function: {
    name: "setBudget",
    description: `Establece o actualiza el presupuesto de una categoría para el ciclo actual.

**Úsala cuando el usuario pida:**
- Configurar presupuesto (ej: "establece el presupuesto de supervivencia en 500€")
- Cambiar presupuesto (ej: "pon el presupuesto de ocio en 200€")
- Ajustar límites (ej: "aumenta mi presupuesto de cultura a 150€")

**IMPORTANTE:**
- Por defecto modifica el ciclo ACTUAL del usuario
- El usuario puede tener ciclos personalizados (nómina a nómina) no solo meses calendario
- Puedes establecer category="all" para poner todas las categorías al mismo importe`,

    parameters: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: ["survival", "optional", "culture", "extra", "all"],
          description: `Categoría a configurar:
- "survival", "optional", "culture", "extra": Categorías individuales
- "all": Todas las categorías (las pone al mismo importe)

Usar mismo mapeo semántico que otras herramientas.`,
        },
        amount: {
          type: "number",
          description: `Importe del presupuesto en EUR.
Puede ser 0 si el usuario quiere "desactivar" una categoría.
Debe ser >= 0.`,
        },
        cycleStart: {
          type: "string",
          description: `Fecha de inicio del ciclo en formato YYYY-MM-DD (OPCIONAL).
Si no se especifica, usa el ciclo actual del usuario.
Generalmente NO necesitas especificar esto.`,
        },
        cycleEnd: {
          type: "string",
          description: `Fecha de fin del ciclo en formato YYYY-MM-DD (OPCIONAL).
Si no se especifica, usa el ciclo actual del usuario.
Generalmente NO necesitas especificar esto.`,
        },
      },
      required: ["category", "amount"],
    },
  },
};

/**
 * Tool 10: Get Current Cycle
 *
 * Gets information about the user's current payment cycle.
 */
const getCurrentCycleTool: ChatCompletionTool = {
  type: "function",
  function: {
    name: "getCurrentCycle",
    description: `Obtiene información sobre el ciclo de pago actual del usuario.

**Úsala cuando el usuario pregunte:**
- Sobre su ciclo (ej: "¿cuál es mi ciclo actual?", "¿cuándo termina mi ciclo?")
- Días restantes (ej: "¿cuántos días me quedan?", "¿cuándo cobra?")
- Progreso del ciclo (ej: "¿en qué punto del ciclo estoy?")

**Información que proporciona:**
- Fechas de inicio y fin del ciclo
- Días transcurridos y restantes
- Tipo de ciclo (calendario o nómina)
- Día de nómina (si aplica)
- Porcentaje de progreso

**Importante:**
- Los usuarios pueden tener ciclos personalizados (nómina-a-nómina)
- NO todos los usuarios usan meses calendario estándar`,

    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
};

/**
 * Array of all available tools for OpenAI function calling
 */
export const KAKEBO_TOOLS: ChatCompletionTool[] = [
  analyzeSpendingPatternTool,
  getBudgetStatusTool,
  detectAnomaliesTool,
  predictMonthlySpendingTool,
  getSpendingTrendsTool,
  searchExpensesTool,
  submitFeedbackTool,
  // NEW: Copilot CRUD tools (v3)
  createTransactionTool,
  updateTransactionTool,
  calculateWhatIfTool,
  setBudgetTool,
  getCurrentCycleTool,
];

/**
 * Map of tool names to their definitions (for quick lookup)
 */
export const TOOLS_BY_NAME: Record<string, ChatCompletionTool> = {
  analyzeSpendingPattern: analyzeSpendingPatternTool,
  getBudgetStatus: getBudgetStatusTool,
  detectAnomalies: detectAnomaliesTool,
  predictMonthlySpending: predictMonthlySpendingTool,
  getSpendingTrends: getSpendingTrendsTool,
  searchExpenses: searchExpensesTool,
  submitFeedback: submitFeedbackTool,
  // NEW: Copilot CRUD tools (v3)
  createTransaction: createTransactionTool,
  updateTransaction: updateTransactionTool,
  calculateWhatIf: calculateWhatIfTool,
  setBudget: setBudgetTool,
  getCurrentCycle: getCurrentCycleTool,
};

/**
 * Tool metadata for confirmation flow and safety checks
 *
 * Tools with requiresConfirmation=true will NOT be executed automatically.
 * The agent will ask for user confirmation before proceeding.
 */
export interface ToolMetadata {
  requiresConfirmation: boolean;
  confirmationTemplate?: (args: Record<string, unknown>) => string;
}

/**
 * Metadata map for tools requiring special handling
 */
export const TOOL_METADATA: Record<string, ToolMetadata> = {
  // WRITE OPERATIONS - Require explicit confirmation
  createTransaction: {
    requiresConfirmation: true,
    confirmationTemplate: (args) => {
      const type = args.type === 'income' ? 'ingreso' : 'gasto';
      return `¿Confirmas que quieres registrar un ${type} de ${args.amount}€ en ${args.category} con concepto "${args.concept}"?`;
    },
  },
  updateTransaction: {
    requiresConfirmation: true,
    confirmationTemplate: (args) => {
      const changes: string[] = [];
      if (args.amount) changes.push(`importe a ${args.amount}€`);
      if (args.concept) changes.push(`concepto a "${args.concept}"`);
      if (args.category) changes.push(`categoría a ${args.category}`);
      if (args.date) changes.push(`fecha a ${args.date}`);

      return `¿Confirmas que quieres cambiar ${changes.join(', ')} del gasto?`;
    },
  },
  setBudget: {
    requiresConfirmation: true,
    confirmationTemplate: (args) => {
      const category = args.category === 'all' ? 'todas las categorías' : args.category;
      return `¿Confirmas que quieres establecer el presupuesto de ${category} en ${args.amount}€?`;
    },
  },
  calculateWhatIf: {
    requiresConfirmation: true,
    confirmationTemplate: (args) => {
      return `¿Confirmas que quieres crear el escenario "${args.name}" por ${args.estimatedCost}€?`;
    },
  },

  // READ OPERATIONS - No confirmation needed (safe)
  analyzeSpendingPattern: { requiresConfirmation: false },
  getBudgetStatus: { requiresConfirmation: false },
  detectAnomalies: { requiresConfirmation: false },
  predictMonthlySpending: { requiresConfirmation: false },
  getSpendingTrends: { requiresConfirmation: false },
  searchExpenses: { requiresConfirmation: false },
  getCurrentCycle: { requiresConfirmation: false },

  // HYBRID - submitFeedback is write but safe (learning feedback)
  submitFeedback: { requiresConfirmation: false },
};
