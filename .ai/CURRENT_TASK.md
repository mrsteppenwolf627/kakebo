# TAREA ACTUAL

**Inicio:** 2025-02-02
**Objetivo:** Completar Fase 3 - RAG y Memoria
**Fase:** 3 - RAG y Memoria
**Semana:** 3/10
**Estado:** 🟢 EN PROGRESO - 90% completado

---

## 📋 RESUMEN EJECUTIVO

La Fase 3 implementa **RAG (Retrieval-Augmented Generation)** para que el asistente IA pueda buscar gastos históricos similares y dar respuestas contextualizadas basadas en el historial del usuario.

**Lo que ya funciona:**
- ✅ Tabla `expense_embeddings` creada en Supabase con pgvector
- ✅ Función `match_expenses` para búsqueda por similitud
- ✅ Generación de embeddings con OpenAI `text-embedding-3-small`
- ✅ Tool `search_similar_expenses` disponible para el asistente
- ✅ Endpoint POST `/api/ai/search` para búsqueda semántica
- ✅ Panel de métricas IA funcionando en `/app/ai-metrics`

**Lo que falta:**
- [ ] Probar clasificación IA en `/app/new`
- [ ] Crear script de migración para embeddings de gastos existentes
- [ ] Métricas de calidad de retrieval

---

## 🏗️ ARQUITECTURA COMPLETA DEL SISTEMA IA

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
├─────────────────────────────────────────────────────────────────┤
│  /app/new                    │  /app/ai-metrics                  │
│  ├─ NewExpenseClient.tsx     │  ├─ AIMetricsClient.tsx           │
│  │   └─ Botón "🤖 IA"        │  │   └─ Gráficos Recharts         │
│  │   └─ Sugerencia categoría │  │   └─ Lista de logs             │
│  │   └─ Aceptar/Ignorar      │  │   └─ Filtros por fecha         │
│  └─ Feedback automático      │  └─ Métricas agregadas            │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API ROUTES (Next.js)                        │
├─────────────────────────────────────────────────────────────────┤
│  POST /api/ai/classify    → Clasificar gasto, devuelve logId     │
│  POST /api/ai/assistant   → Chat con tools (function calling)    │
│  POST /api/ai/feedback    → Registrar corrección de usuario      │
│  POST /api/ai/search      → Búsqueda semántica de gastos         │
│  GET  /api/ai/metrics     → Métricas agregadas + logs recientes  │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                       LIB/AI (Core Logic)                        │
├─────────────────────────────────────────────────────────────────┤
│  classifier.ts   → classifyExpense(text) → {category, note}      │
│  assistant.ts    → processMessage() → respuesta + tools usados   │
│  tools.ts        → Definiciones de tools para OpenAI             │
│  tool-executor.ts→ Ejecuta tools y conecta con Supabase          │
│  embeddings.ts   → Genera/busca embeddings con pgvector          │
│  metrics.ts      → Logging y agregación de métricas              │
│  prompts.ts      → System prompts versionados                    │
│  client.ts       → Cliente OpenAI configurado                    │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SUPABASE (PostgreSQL)                        │
├─────────────────────────────────────────────────────────────────┤
│  expenses            → Gastos del usuario                        │
│  expense_embeddings  → Vectores 1536D para búsqueda semántica    │
│  ai_logs             → Registro de todas las interacciones IA    │
│  user_settings       → Presupuestos y configuración              │
│  months              → Meses con estado (open/closed)            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 ARCHIVOS Y FUNCIONES DETALLADAS

### 1. `src/lib/ai/classifier.ts`
**Propósito:** Clasificar gastos usando GPT-4o-mini

```typescript
// Función principal
classifyExpense(text: string): Promise<ClassificationResult>

// Ejemplo de uso:
const result = await classifyExpense("Netflix mensual");
// → { category: "culture", note: "Netflix mensual", confidence: 0.95 }

// Internamente:
// 1. Construye prompt con few-shot examples
// 2. Llama a OpenAI con response_format: json_object
// 3. Parsea respuesta y valida con Zod
// 4. Retorna categoría, nota sugerida y confianza
```

### 2. `src/lib/ai/assistant.ts`
**Propósito:** Asistente conversacional con function calling

```typescript
// Función principal
processMessage(
  userMessage: string,
  conversationHistory: Message[],
  supabase: SupabaseClient,
  userId: string,
  options?: { model?: ModelId }
): Promise<AssistantResponse>

// Flujo interno:
// 1. Construye mensajes con system prompt + historial
// 2. Llama a OpenAI con tools disponibles
// 3. Si hay tool_calls, ejecuta cada tool
// 4. Agrega resultados al contexto
// 5. Llama a OpenAI de nuevo para respuesta final
// 6. Retorna mensaje + tools usados + métricas

// Tools disponibles para el asistente:
// - create_expense: Crear gasto
// - list_expenses: Listar gastos del mes
// - get_monthly_summary: Resumen con presupuestos
// - get_settings: Obtener configuración
// - update_settings: Actualizar presupuestos
// - classify_expense: Clasificar texto
// - search_similar_expenses: Buscar gastos similares (RAG)
```

### 3. `src/lib/ai/tools.ts`
**Propósito:** Definiciones de tools para OpenAI function calling

```typescript
// Tipos de tools
type ToolName =
  | "create_expense"
  | "list_expenses"
  | "get_monthly_summary"
  | "get_settings"
  | "update_settings"
  | "classify_expense"
  | "search_similar_expenses"

// Cada tool tiene:
// - name: Nombre para OpenAI
// - description: Qué hace (para el modelo)
// - parameters: JSON Schema de parámetros

// Ejemplo: search_similar_expenses
{
  name: "search_similar_expenses",
  description: "Busca gastos similares en el historial usando búsqueda semántica",
  parameters: {
    type: "object",
    properties: {
      query: { type: "string", description: "Texto a buscar" },
      limit: { type: "number", description: "Máximo resultados (default 5)" }
    },
    required: ["query"]
  }
}
```

### 4. `src/lib/ai/tool-executor.ts`
**Propósito:** Ejecuta tools y conecta con base de datos

```typescript
// Función principal
executeTool(
  toolName: ToolName,
  params: ToolParams[ToolName],
  supabase: SupabaseClient,
  userId: string
): Promise<ToolResult>

// Funciones internas:
executeCreateExpense()      // Crea gasto + mes si no existe
executeListExpenses()       // Lista con filtros
executeGetMonthlySummary()  // Totales + comparación presupuesto
executeGetSettings()        // Lee user_settings
executeUpdateSettings()     // Actualiza presupuestos
executeClassifyExpense()    // Llama a classifier
executeSearchSimilarExpenses() // Búsqueda semántica con embeddings
```

### 5. `src/lib/ai/embeddings.ts`
**Propósito:** Generación y búsqueda de embeddings (RAG)

```typescript
// Constantes
EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIMENSIONS = 1536
EMBEDDING_COST_PER_1M = 0.02  // $0.02 por millón de tokens

// Funciones principales:

// Generar embedding para un texto
generateEmbedding(text: string): Promise<EmbeddingResult>
// → { embedding: number[1536], tokens: number, costUsd: number }

// Generar embeddings en batch
generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]>

// Crear texto para embedding desde gasto
createExpenseText(expense): string
// Ejemplo: "Netflix mensual - 15.99€ en cultura el 2025-02-01"

// Guardar embedding en Supabase
storeExpenseEmbedding(supabase, expenseId, userId, text, embedding): Promise<void>

// Eliminar embedding
deleteExpenseEmbedding(supabase, expenseId): Promise<void>

// Buscar gastos similares (usa función SQL match_expenses)
searchSimilarExpenses(supabase, userId, queryEmbedding, options): Promise<SimilarExpense[]>

// Búsqueda por texto (genera embedding + busca)
searchExpensesByText(supabase, userId, query, options): Promise<{
  results: SimilarExpense[],
  queryTokens: number,
  queryCostUsd: number
}>
```

### 6. `src/lib/ai/metrics.ts`
**Propósito:** Logging y métricas de IA

```typescript
// Tipos
interface AILogEntry {
  user_id: string
  type: "classification" | "assistant"
  input: string
  output: unknown
  model: string
  input_tokens: number
  output_tokens: number
  cost_usd: number
  latency_ms: number
  tools_used?: string[]
  success: boolean
  was_corrected?: boolean      // Para tracking de accuracy
  corrected_category?: string  // Categoría corregida por usuario
}

interface AIMetrics {
  period: string
  totalRequests: number
  successRate: number
  totalCostUsd: number
  avgLatencyMs: number
  byType: { classification: number, assistant: number }
  byModel: Record<string, number>
  classificationAccuracy: number  // 100 - (correcciones/total)*100
}

// Funciones:
logAIInteraction(supabase, entry)     // Guarda log
getAIMetrics(supabase, userId, opts)  // Agrega métricas
recordCorrection(supabase, logId, correctedCategory)  // Marca corrección
getRecentLogs(supabase, userId, limit)  // Últimos logs
```

### 7. `src/lib/ai/client.ts`
**Propósito:** Cliente OpenAI configurado

```typescript
// Cliente singleton
export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Modelos disponibles
export const MODELS = {
  "gpt-4o-mini": { input: 0.15, output: 0.6 },      // Por 1M tokens
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4-turbo": { input: 10, output: 30 }
}
export const DEFAULT_MODEL = "gpt-4o-mini"

// Calcular costo
calculateCost(model, inputTokens, outputTokens): number
```

---

## 📡 ENDPOINTS API DETALLADOS

### POST `/api/ai/classify`
Clasifica un gasto y registra el log.

```typescript
// Request
{ "text": "Cena restaurante italiano" }

// Response
{
  "success": true,
  "data": {
    "category": "optional",
    "note": "Cena restaurante italiano",
    "confidence": 0.92,
    "logId": "uuid-del-log"  // Para feedback posterior
  }
}
```

### POST `/api/ai/assistant`
Chat con el asistente (puede usar múltiples tools).

```typescript
// Request
{
  "message": "¿Cuánto llevo gastado este mes en cultura?",
  "history": [
    { "role": "user", "content": "Hola" },
    { "role": "assistant", "content": "¡Hola! ¿En qué puedo ayudarte?" }
  ]
}

// Response
{
  "success": true,
  "data": {
    "message": "Este mes llevas 45.99€ gastados en cultura...",
    "toolsUsed": ["get_monthly_summary"],
    "metrics": {
      "model": "gpt-4o-mini",
      "latencyMs": 1234,
      "inputTokens": 500,
      "outputTokens": 150,
      "costUsd": 0.00015,
      "toolCalls": 1
    }
  }
}
```

### POST `/api/ai/feedback`
Registra corrección de usuario (para calcular accuracy).

```typescript
// Request
{
  "logId": "uuid-del-log",
  "correctedCategory": "survival"  // Usuario cambió de "optional" a "survival"
}

// Response
{ "success": true, "data": { "message": "Corrección registrada" } }
```

### POST `/api/ai/search`
Búsqueda semántica de gastos similares.

```typescript
// Request
{
  "query": "comida delivery",
  "limit": 5,
  "threshold": 0.4  // Similitud mínima (0-1)
}

// Response
{
  "success": true,
  "data": {
    "results": [
      {
        "expense_id": "uuid",
        "note": "Glovo - pizza",
        "amount": 18.50,
        "category": "optional",
        "date": "2025-01-15",
        "similarity": 0.87
      }
    ],
    "query": "comida delivery",
    "searchCost": 0.000002
  }
}
```

### GET `/api/ai/metrics`
Métricas agregadas y logs recientes.

```typescript
// Request
GET /api/ai/metrics?includeLogs=true&logsLimit=50&startDate=2025-01-01

// Response
{
  "success": true,
  "data": {
    "metrics": {
      "period": "2025-01-01 to 2025-02-02",
      "totalRequests": 150,
      "successRate": 98.5,
      "totalCostUsd": 0.0234,
      "avgLatencyMs": 450,
      "classificationAccuracy": 94,
      "byType": { "classification": 100, "assistant": 50 },
      "byModel": { "gpt-4o-mini": 150 }
    },
    "logs": [...]
  }
}
```

---

## 🗄️ TABLAS SUPABASE

### `ai_logs`
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES auth.users
type TEXT ('classification' | 'assistant')
input TEXT
output JSONB
model TEXT
input_tokens INTEGER
output_tokens INTEGER
cost_usd DECIMAL(10,6)
latency_ms INTEGER
tools_used TEXT[]
success BOOLEAN
was_corrected BOOLEAN DEFAULT false
corrected_category TEXT
created_at TIMESTAMPTZ
```

### `expense_embeddings`
```sql
id UUID PRIMARY KEY
expense_id UUID UNIQUE REFERENCES expenses ON DELETE CASCADE
user_id UUID REFERENCES auth.users
embedding vector(1536)  -- pgvector
text_content TEXT
created_at TIMESTAMPTZ
```

### Función `match_expenses`
```sql
-- Búsqueda por similitud de coseno
match_expenses(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_user_id uuid
) RETURNS TABLE (
  expense_id, note, amount, category, date, similarity
)
```

---

## ✅ FASE 2 - COMPLETADA

- [x] Clasificador de gastos (`classifier.ts`)
- [x] Prompt engineering con few-shot examples
- [x] Function calling (`tools.ts`, `tool-executor.ts`)
- [x] Asistente conversacional (`assistant.ts`)
- [x] Logging a `ai_logs` (`metrics.ts`)
- [x] Panel de métricas (`/app/ai-metrics`)
- [x] Endpoint feedback (`/api/ai/feedback`)
- [x] UI sugerencia IA en `/app/new`
- [x] Cálculo de accuracy

---

## ✅ FASE 3 - EN PROGRESO (90%)

### Completado:
- [x] Extensión pgvector habilitada
- [x] Tabla `expense_embeddings` creada
- [x] Función `match_expenses` creada
- [x] `embeddings.ts` con todas las funciones
- [x] Endpoint `/api/ai/search`
- [x] Tool `search_similar_expenses` en asistente
- [x] Login Google OAuth arreglado
- [x] Panel métricas funcionando

### Pendiente:
- [ ] Probar flujo completo de clasificación IA
- [ ] Script de migración para gastos existentes
- [ ] Métricas de calidad de retrieval
- [ ] Comparar accuracy con/sin RAG

---

## 💡 PRÓXIMAS ACCIONES

1. **Probar clasificación IA:**
   - Ir a `/app/new`
   - Escribir un concepto (ej: "Spotify premium")
   - Click en botón "🤖 IA"
   - Verificar que sugiere categoría
   - Aceptar o cambiar manualmente

2. **Script de migración (opcional):**
   - Crear script que genere embeddings para gastos existentes
   - Esto mejorará la búsqueda semántica

3. **Probar búsqueda semántica:**
   - Crear varios gastos nuevos
   - Preguntar al asistente "¿qué gastos tengo similares a comida?"
   - Verificar que usa `search_similar_expenses`

---

**Versión:** 6.0
**Última actualización:** 2025-02-02 CET
