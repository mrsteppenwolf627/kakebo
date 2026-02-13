/**
 * OpenAI Function Calling tool definitions
 *
 * These definitions map the existing Kakebo tools to OpenAI's function calling format.
 * Each tool includes detailed semantic mapping to help GPT understand user intent naturally.
 */

import type { ChatCompletionTool } from "openai/resources/chat/completions";
import { searchExpensesTool } from "./search-expenses-definition";
import { submitFeedbackTool } from "./submit-feedback-definition";

/**
 * Tool 1: Analyze Spending Patterns
 *
 * Maps natural language about spending to category and period analysis.
 * Critical: Handles semantic mapping of terms like "comida" → "survival"
 */
const analyzeSpendingPatternTool: ChatCompletionTool = {
  type: "function",
  function: {
    name: "analyzeSpendingPattern",
    description: `Analiza patrones de gasto del usuario por categoría y período de tiempo.

**Úsala cuando el usuario pregunte sobre:**
- Cuánto ha gastado (ej: "¿cuánto gasté en comida?", "¿cuánto llevo gastado?")
- Gastos por categoría (ej: "gastos de supervivencia", "gastos de ocio")
- Análisis de patrones (ej: "¿estoy gastando más?", "tendencia de gastos")
- Gastos recientes (ej: "esta semana", "este mes")

**MAPEO SEMÁNTICO CRÍTICO - Categorías:**
Debes interpretar inteligentemente el lenguaje natural del usuario:

- **"survival"** (Supervivencia): comida, alimentación, supermercado, alimentos, mercado, despensa, vivienda, alquiler, renta, casa, transporte, metro, autobús, gasolina, medicinas, farmacia

- **"optional"** (Opcional): ocio, entretenimiento, diversión, tiempo libre, restaurantes, bares, cafés, comer fuera, cine, conciertos, teatro, eventos, ropa, calzado, moda, compras, shopping, viajes, vacaciones

- **"culture"** (Cultura): educación, formación, cursos, clases, estudios, libros, ebooks, audiolibros, museos, exposiciones, conferencias, talleres, desarrollo personal

- **"extra"** (Extra): imprevistos, emergencias, urgencias, regalos, obsequios, otros, varios

- **"all"** (Todas): cuando el usuario NO especifica categoría o pide análisis general

**Ejemplos de mapeo:**
- "¿cuánto he gastado en comida?" → category: "survival"
- "gastos de ocio" → category: "optional"
- "mis gastos en libros" → category: "culture"
- "¿cuánto he gastado?" → category: "all"`,

    parameters: {
      type: "object",
      properties: {
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
        period: {
          type: "string",
          enum: [
            "current_month",
            "last_month",
            "last_3_months",
            "last_6_months",
            "current_week",
            "last_week",
          ],
          description: `Período de tiempo a analizar. Mapea expresiones naturales:
- "este mes", "en el mes actual" → "current_month"
- "el mes pasado", "mes anterior" → "last_month"
- "últimos 3 meses", "trimestre" → "last_3_months"
- "últimos 6 meses", "semestre" → "last_6_months"
- "esta semana", "semana actual" → "current_week"
- "semana pasada", "la semana pasada" → "last_week"

Por defecto: "current_month"`,
        },
        groupBy: {
          type: "string",
          enum: ["day", "week", "month"],
          description: `Nivel de agrupación de datos:
- "day": Datos diarios (más detalle)
- "week": Por semanas
- "month": Por meses (para períodos largos)

Por defecto: "day"`,
        },
        limit: {
          type: "number",
          description: `Número máximo de gastos a devolver.
- Por defecto: 5
- Máximo: 50

**USA limit=50 cuando usuario pida:**
- "todos los gastos"
- "muéstrame todo"
- "lista completa"

Usa default (5) para preguntas generales.`,
        },
        semanticFilter: {
          type: "string",
          description: `Filtro semántico para subcategorías dentro de una categoría principal.

**USA ESTO cuando el usuario pida algo MÁS ESPECÍFICO que las 4 categorías Kakebo:**

Ejemplos de cuándo USAR semanticFilter:
- "gastos de comida" → category="survival", semanticFilter="comida"
- "gastos de restaurantes" → category="optional", semanticFilter="restaurantes"
- "gastos de salud" → category="survival", semanticFilter="salud"
- "gastos de transporte" → category="survival", semanticFilter="transporte"
- "suscripciones" → category="optional", semanticFilter="suscripciones"

Ejemplos de cuándo NO usar semanticFilter:
- "gastos de supervivencia" → category="survival" (sin filtro)
- "gastos opcionales" → category="optional" (sin filtro)

**IMPORTANTE:** El filtro usa embeddings semánticos para entender contexto humano.
Por ejemplo, si piden "comida", excluirá automáticamente "psicólogo" o "medicamentos" 
aunque estén en la misma categoría "supervivencia".`,
        },
      },
      required: [], // Todos los parámetros son opcionales con defaults sensibles
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
