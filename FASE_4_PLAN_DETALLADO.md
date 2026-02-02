# FASE 4: AGENTES Y ORQUESTACIÓN - PLAN DETALLADO

**Timeline:** Semanas 4-5 (10 días)
**Estado:** Por iniciar
**Objetivo:** Implementar arquitectura multi-agente con LangGraph para análisis financiero inteligente

---

## 🎯 OBJETIVOS PRINCIPALES

1. **Implementar LangGraph** como framework de orquestación
2. **Crear 3 agentes especializados** (Router, Análisis, Recomendaciones)
3. **Ampliar herramientas disponibles** con análisis avanzado
4. **Testing completo** de flujos multi-agente
5. **Documentación** de arquitectura de agentes

---

## 📋 ARQUITECTURA PROPUESTA

### Flujo General

```
Usuario → Router Agent → [Análisis Agent | Recomendaciones Agent | Tools Directos]
                                 ↓                      ↓                ↓
                           Análisis complejo       Sugerencias      Acciones simples
                                 ↓                      ↓                ↓
                           → Respuesta al Usuario ←─────┴────────────────┘
```

### Agentes Principales

#### 1. **Router Agent** (Coordinador)
**Responsabilidad:** Recibir la pregunta del usuario y decidir qué agente debe procesarla

**Capabilities:**
- Clasificar intención del usuario
- Decidir si necesita análisis, recomendaciones, o acción directa
- Coordinar múltiples agentes si es necesario
- Mantener contexto de conversación

**Decisiones que toma:**
- "Añade 30€ de gasolina" → Tool directo (create_expense)
- "¿Cómo voy este mes?" → Agente de Análisis
- "¿Cómo puedo ahorrar?" → Agente de Recomendaciones
- "Muéstrame gastos de Netflix" → Tool directo (search_similar_expenses)

#### 2. **Analysis Agent** (Analista Financiero)
**Responsabilidad:** Análisis profundo de patrones de gasto

**Capabilities:**
- Analizar tendencias temporales
- Comparar períodos (mes actual vs anterior)
- Detectar anomalías en gastos
- Calcular proyecciones
- Identificar categorías problemáticas
- Generar insights accionables

**Tools disponibles:**
- `analyze_spending_pattern`: Analizar patrones por categoría/período
- `get_budget_status`: Estado actual vs presupuesto
- `detect_anomalies`: Detectar gastos inusuales
- `predict_monthly_spending`: Proyección de gasto
- `get_spending_trends`: Tendencias temporales
- `compare_periods`: Comparar meses/trimestres
- Acceso a tools básicos (list_expenses, search_similar_expenses, etc.)

**Ejemplos de preguntas que maneja:**
- "¿Cómo voy este mes?"
- "¿He gastado más que el mes pasado?"
- "¿En qué categoría gasto más?"
- "¿Hay algún gasto raro este mes?"
- "¿Llegaré al presupuesto?"

#### 3. **Recommendation Agent** (Asesor Financiero)
**Responsabilidad:** Generar recomendaciones personalizadas

**Capabilities:**
- Sugerir optimizaciones basadas en historial
- Alertar sobre presupuestos en riesgo
- Recomendar categorías para gastos
- Identificar áreas de ahorro
- Generar planes de acción

**Tools disponibles:**
- `get_optimization_suggestions`: Sugerencias de ahorro
- `get_budget_alerts`: Alertas de presupuestos cercanos a límite
- `suggest_category_budget`: Sugerir presupuesto para categoría
- `identify_savings_opportunities`: Áreas de ahorro potencial
- Acceso a análisis y búsqueda

**Ejemplos de preguntas que maneja:**
- "¿Cómo puedo ahorrar?"
- "¿En qué estoy gastando de más?"
- "¿Debería reducir algún presupuesto?"
- "Dame consejos para llegar a fin de mes"

---

## 🛠️ NUEVAS HERRAMIENTAS (TOOLS)

### 1. analyze_spending_pattern

**Propósito:** Analizar patrones de gasto por categoría y período

**Parámetros:**
```typescript
{
  category?: "survival" | "optional" | "culture" | "extra" | "all",
  period?: "current_month" | "last_month" | "last_3_months" | "last_6_months",
  groupBy?: "day" | "week" | "month"
}
```

**Retorna:**
```typescript
{
  category: string,
  period: string,
  totalAmount: number,
  averagePerPeriod: number,
  trend: "increasing" | "decreasing" | "stable",
  trendPercentage: number,
  topExpenses: Array<{concept: string, amount: number, date: string}>,
  insights: string[]
}
```

**Implementación:**
- Query SQL para agrupar gastos
- Cálculo de tendencias con regresión lineal simple
- Identificación de top expenses
- Generación de insights textuales

---

### 2. get_budget_status

**Propósito:** Estado actual de presupuestos vs gastos reales

**Parámetros:**
```typescript
{
  month?: string, // YYYY-MM, default: current month
  category?: string // optional, specific category
}
```

**Retorna:**
```typescript
{
  month: string,
  categories: Array<{
    category: string,
    budget: number,
    spent: number,
    remaining: number,
    percentage: number,
    status: "safe" | "warning" | "exceeded",
    daysRemaining: number,
    projectedSpending: number
  }>,
  totalBudget: number,
  totalSpent: number,
  totalRemaining: number,
  overallStatus: "safe" | "warning" | "exceeded"
}
```

**Lógica de status:**
- `safe`: < 70% del presupuesto usado
- `warning`: 70-100% del presupuesto usado
- `exceeded`: > 100% del presupuesto usado

**Proyección:**
```
proyectedSpending = (spentSoFar / daysElapsed) * totalDaysInMonth
```

---

### 3. detect_anomalies

**Propósito:** Detectar gastos inusuales basados en historial

**Parámetros:**
```typescript
{
  period?: "current_month" | "last_week" | "last_3_days",
  sensitivity?: "low" | "medium" | "high" // threshold de desviación
}
```

**Retorna:**
```typescript
{
  anomalies: Array<{
    expense_id: string,
    concept: string,
    amount: number,
    category: string,
    date: string,
    reason: string, // "unusually_high_amount" | "rare_category" | "unusual_timing"
    severity: "low" | "medium" | "high",
    historicalAverage: number,
    deviationPercentage: number
  }>,
  summary: string
}
```

**Algoritmo:**
1. Calcular media y desviación estándar por categoría (últimos 3 meses)
2. Identificar gastos > media + (2 * desviación_estándar)
3. Detectar categorías raramente usadas (< 5 veces en 3 meses)
4. Detectar timing inusual (múltiples gastos grandes en mismo día)

---

### 4. predict_monthly_spending

**Propósito:** Proyectar gasto total del mes basado en tendencia actual

**Parámetros:**
```typescript
{
  month?: string, // YYYY-MM, default: current month
  category?: string // optional
}
```

**Retorna:**
```typescript
{
  month: string,
  currentDate: string,
  daysElapsed: number,
  daysRemaining: number,
  spentSoFar: number,
  projectedTotal: number,
  budget: number,
  projectedOverage: number,
  confidence: "high" | "medium" | "low",
  byCategory: Array<{
    category: string,
    spentSoFar: number,
    projectedTotal: number,
    budget: number
  }>
}
```

**Método de proyección:**
```
Simple linear: projectedTotal = (spentSoFar / daysElapsed) * totalDays

Weighted (más sofisticado):
- 60% peso a últimos 7 días
- 40% peso a resto del mes
```

---

### 5. get_optimization_suggestions

**Propósito:** Generar sugerencias personalizadas de ahorro

**Parámetros:**
```typescript
{
  focus?: "budget" | "category" | "overall" // área de enfoque
}
```

**Retorna:**
```typescript
{
  suggestions: Array<{
    type: "reduce_spending" | "adjust_budget" | "change_habit" | "alert",
    category?: string,
    priority: "high" | "medium" | "low",
    title: string,
    description: string,
    potentialSavings: number,
    actionable: boolean,
    action?: string
  }>,
  totalPotentialSavings: number
}
```

**Lógica de sugerencias:**
1. **Categorías sobre presupuesto:** Sugerir reducción o ajuste
2. **Gastos recurrentes altos:** Identificar suscripciones/fijos optimizables
3. **Patrones de gasto:** Días de mayor gasto, horarios
4. **Comparación histórica:** Si gastas más que hace 3 meses
5. **Gastos similares duplicados:** Detectar con embeddings

---

### 6. get_spending_trends

**Propósito:** Tendencias temporales de gasto

**Parámetros:**
```typescript
{
  period: "last_3_months" | "last_6_months" | "last_year",
  groupBy: "week" | "month",
  category?: string
}
```

**Retorna:**
```typescript
{
  period: string,
  dataPoints: Array<{
    date: string,
    amount: number,
    count: number
  }>,
  trend: "increasing" | "decreasing" | "stable",
  trendPercentage: number,
  average: number,
  peak: {date: string, amount: number},
  low: {date: string, amount: number}
}
```

---

### 7. compare_periods

**Propósito:** Comparar dos períodos de tiempo

**Parámetros:**
```typescript
{
  period1: string, // YYYY-MM
  period2: string, // YYYY-MM
  metric?: "total" | "by_category" | "count"
}
```

**Retorna:**
```typescript
{
  period1Summary: {
    total: number,
    count: number,
    byCategory: Record<string, number>
  },
  period2Summary: { /* same */ },
  comparison: {
    totalDifference: number,
    totalDifferencePercentage: number,
    countDifference: number,
    categoryChanges: Array<{
      category: string,
      difference: number,
      percentageChange: number
    }>,
    biggestIncrease: {category: string, amount: number},
    biggestDecrease: {category: string, amount: number}
  },
  insights: string[]
}
```

---

## 🏗️ IMPLEMENTACIÓN LANGGRAPH

### Estructura de Archivos

```
src/lib/agents/
├── index.ts                    # Re-exportaciones
├── router.ts                   # Router Agent (coordinador)
├── analysis.ts                 # Analysis Agent
├── recommendations.ts          # Recommendation Agent
├── state.ts                    # State management
├── graph.ts                    # LangGraph definition
└── tools/
    ├── index.ts
    ├── spending-analysis.ts    # analyze_spending_pattern
    ├── budget-status.ts        # get_budget_status
    ├── anomalies.ts            # detect_anomalies
    ├── predictions.ts          # predict_monthly_spending
    ├── optimization.ts         # get_optimization_suggestions
    ├── trends.ts               # get_spending_trends
    └── comparison.ts           # compare_periods
```

### State Schema

```typescript
interface AgentState {
  // Input
  userMessage: string;
  userId: string;
  conversationHistory: Array<{role: string, content: string}>;

  // Router decision
  intent: "analysis" | "recommendation" | "action" | "unknown";
  targetAgent?: "analysis" | "recommendation" | "direct";

  // Intermediate results
  analysisResult?: any;
  recommendationResult?: any;
  toolResults?: any[];

  // Output
  response: string;
  confidence: number;
  suggestedActions?: string[];

  // Metadata
  tokensUsed: number;
  costUsd: number;
  executionTimeMs: number;
}
```

### Graph Definition

```typescript
import { StateGraph } from "@langchain/langgraph";

const workflow = new StateGraph<AgentState>({
  channels: {
    userMessage: null,
    userId: null,
    intent: null,
    // ... rest of state
  }
});

// Nodes
workflow.addNode("router", routerAgent);
workflow.addNode("analysis", analysisAgent);
workflow.addNode("recommendation", recommendationAgent);
workflow.addNode("direct_tools", directToolExecutor);

// Edges
workflow.addEdge("START", "router");
workflow.addConditionalEdges(
  "router",
  (state) => state.targetAgent,
  {
    "analysis": "analysis",
    "recommendation": "recommendation",
    "direct": "direct_tools"
  }
);
workflow.addEdge("analysis", "END");
workflow.addEdge("recommendation", "END");
workflow.addEdge("direct_tools", "END");

export const agentGraph = workflow.compile();
```

---

## 📝 ENDPOINT DE AGENTES

### POST /api/ai/agents

**Propósito:** Punto de entrada para conversación con agentes multi-rol

**Request:**
```typescript
{
  message: string,
  conversationHistory?: Array<{role: string, content: string}>
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    response: string,
    intent: string,
    agentUsed: string,
    confidence: number,
    suggestedActions?: string[],
    metadata: {
      tokensUsed: number,
      costUsd: number,
      executionTimeMs: number
    }
  }
}
```

**Diferencia vs /api/ai/assistant:**
- `/api/ai/assistant`: Asistente simple con function calling directo
- `/api/ai/agents`: Orquestación multi-agente con análisis complejo

---

## 🧪 TESTING

### Tests Unitarios (por tool)

```typescript
// src/__tests__/agents/tools/spending-analysis.test.ts
describe("analyze_spending_pattern", () => {
  it("should analyze spending for current month");
  it("should identify increasing trend");
  it("should identify decreasing trend");
  it("should handle category filter");
  it("should generate relevant insights");
});

// Similar para cada tool...
```

### Tests de Integración (agentes)

```typescript
// src/__tests__/agents/analysis-agent.test.ts
describe("Analysis Agent", () => {
  it("should analyze budget status when asked");
  it("should detect anomalies and explain them");
  it("should compare periods accurately");
  it("should generate meaningful insights");
});

// src/__tests__/agents/recommendation-agent.test.ts
describe("Recommendation Agent", () => {
  it("should suggest optimizations based on data");
  it("should prioritize high-impact suggestions");
  it("should handle no-data gracefully");
});
```

### Tests E2E (flujo completo)

```typescript
// src/__tests__/agents/graph.test.ts
describe("Agent Graph E2E", () => {
  it("should route analysis questions to analysis agent");
  it("should route recommendation questions to rec agent");
  it("should route simple actions to direct tools");
  it("should handle multi-turn conversations");
  it("should maintain conversation context");
});
```

---

## 📊 MÉTRICAS DE AGENTES

**Nueva tabla:** `agent_logs`

```sql
CREATE TABLE agent_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Input
  user_message TEXT NOT NULL,
  intent TEXT, -- "analysis" | "recommendation" | "action"

  -- Routing
  router_decision TEXT,
  target_agent TEXT,

  -- Execution
  agent_used TEXT,
  tools_called TEXT[], -- array de tools usados
  execution_time_ms INTEGER,

  -- Tokens y costo
  input_tokens INTEGER,
  output_tokens INTEGER,
  cost_usd DECIMAL(10,6),

  -- Output
  response TEXT,
  confidence DECIMAL(3,2),
  success BOOLEAN,
  error_message TEXT
);

CREATE INDEX idx_agent_logs_user ON agent_logs(user_id);
CREATE INDEX idx_agent_logs_created ON agent_logs(created_at);
CREATE INDEX idx_agent_logs_agent ON agent_logs(agent_used);
```

**Endpoint de métricas:** `GET /api/ai/agent-metrics`

---

## 📅 ROADMAP DE IMPLEMENTACIÓN

### **Semana 4 (Días 1-5)**

#### **Día 1: Setup + Tools Básicos**
- [ ] Instalar LangGraph: `npm install @langchain/langgraph @langchain/core`
- [ ] Crear estructura de carpetas `src/lib/agents/`
- [ ] Implementar `analyze_spending_pattern`
- [ ] Implementar `get_budget_status`
- [ ] Tests unitarios de ambos

#### **Día 2: Tools de Análisis**
- [ ] Implementar `detect_anomalies`
- [ ] Implementar `predict_monthly_spending`
- [ ] Implementar `get_spending_trends`
- [ ] Tests unitarios
- [ ] Documentación de tools

#### **Día 3: Tools de Recomendaciones**
- [ ] Implementar `get_optimization_suggestions`
- [ ] Implementar `compare_periods`
- [ ] Tests unitarios
- [ ] Integración con RAG para sugerencias

#### **Día 4: Analysis Agent**
- [ ] Crear `src/lib/agents/analysis.ts`
- [ ] Implementar prompt del agente
- [ ] Conectar tools de análisis
- [ ] Tests de integración
- [ ] Prompt engineering para mejores insights

#### **Día 5: Recommendation Agent**
- [ ] Crear `src/lib/agents/recommendations.ts`
- [ ] Implementar prompt del agente
- [ ] Conectar tools de optimización
- [ ] Tests de integración
- [ ] Prompt engineering para sugerencias accionables

### **Semana 5 (Días 6-10)**

#### **Día 6: Router Agent + Graph**
- [ ] Crear `src/lib/agents/router.ts`
- [ ] Implementar clasificación de intención
- [ ] Crear `src/lib/agents/graph.ts` con LangGraph
- [ ] Definir state schema
- [ ] Conectar todos los nodos

#### **Día 7: Endpoint + Integración**
- [ ] Crear `POST /api/ai/agents`
- [ ] Integrar con graph de LangGraph
- [ ] Manejo de errores
- [ ] Logging en `agent_logs`
- [ ] Tests E2E

#### **Día 8: UI + Dashboard**
- [ ] Crear página `/app/agents` para chat con agentes
- [ ] Mostrar qué agente respondió
- [ ] Indicadores visuales de análisis/recomendaciones
- [ ] Agregar métricas de agentes al dashboard `/app/ai-metrics`

#### **Día 9: Testing + Refinamiento**
- [ ] Tests completos de todos los flujos
- [ ] Prompt engineering avanzado
- [ ] Optimización de performance
- [ ] Ajuste de confidence thresholds
- [ ] Coverage > 85% en código de agentes

#### **Día 10: Documentación + Demo**
- [ ] Actualizar `.ai/CONTEXT.md`
- [ ] Crear `docs/AGENTS_ARCHITECTURE.md`
- [ ] Video demo de agentes
- [ ] Casos de uso documentados
- [ ] Preparación para Fase 5

---

## 🎨 EJEMPLOS DE USO

### Ejemplo 1: Análisis de Gasto

**Usuario:** "¿Cómo voy este mes?"

**Flujo:**
1. Router → Detecta intent="analysis"
2. Analysis Agent → Usa `get_budget_status` + `get_spending_trends`
3. Response:

```
Este mes vas bien en general, aunque hay algunos puntos de atención:

📊 Resumen de presupuestos:
- Supervivencia: 450€ / 600€ (75% usado, SAFE ✅)
- Opcional: 280€ / 300€ (93% usado, WARNING ⚠️)
- Cultura: 45€ / 100€ (45% usado, SAFE ✅)
- Extra: 0€ / 50€ (0% usado, SAFE ✅)

📈 Tendencias:
- Llevas gastados 775€ de 1050€ totales (74%)
- Quedan 12 días de mes
- Proyección: llegarás a 980€ (bajo presupuesto ✅)

⚠️ Atención:
- Opcional está al 93%, con 12 días aún por delante
- Si mantienes el ritmo, excederás en ~30€

¿Quieres que te sugiera cómo optimizar?
```

### Ejemplo 2: Recomendaciones

**Usuario:** "¿Cómo puedo ahorrar?"

**Flujo:**
1. Router → Detecta intent="recommendation"
2. Recommendation Agent → Usa `get_optimization_suggestions`
3. Response:

```
He analizado tus gastos y tengo 4 sugerencias para ahorrar:

🔴 PRIORIDAD ALTA (ahorro potencial: 60€/mes)
1. Suscripciones duplicadas
   - Tienes Netflix (15€), HBO (12€) y Disney+ (11€)
   - Considera rotar mensualmente en vez de tener todas
   - Ahorro: ~20-25€/mes

🟡 PRIORIDAD MEDIA (ahorro potencial: 45€/mes)
2. Deliverys frecuentes
   - 8 pedidos de delivery este mes (promedio 22€)
   - Considera cocinar los domingos y usar tuppers
   - Ahorro: ~100€/mes si reduces 50%

3. Cafés diarios
   - Gastas ~3.5€/día en cafés (75€/mes)
   - Termo + café en casa: ~15€/mes
   - Ahorro: ~60€/mes

🟢 PRIORIDAD BAJA (ahorro potencial: 20€/mes)
4. Gimnasio poco usado
   - 45€/mes pero solo 4 visitas este mes
   - Considera calistenia o running gratuito
   - Ahorro: 45€/mes

💰 AHORRO TOTAL POTENCIAL: 165€/mes (1980€/año)

¿Quieres que profundice en alguna de estas áreas?
```

### Ejemplo 3: Detección de Anomalías

**Usuario:** "¿Hay algo raro en mis gastos?"

**Flujo:**
1. Router → Detecta intent="analysis"
2. Analysis Agent → Usa `detect_anomalies`
3. Response:

```
He detectado 2 anomalías en tus gastos recientes:

🔴 ANOMALÍA ALTA
📅 3 Feb 2026 - 350€ en "Reparación coche"
- Es 5.2x tu gasto promedio en Extra (67€)
- No habías tenido gastos de mecánica en 6 meses
- ✅ Parece legítimo (emergencia)

🟡 ANOMALÍA MEDIA
📅 1 Feb 2026 - 95€ en "Zapatillas Nike"
- Es 2.1x tu gasto promedio en Opcional (45€)
- Sueles gastar en ropa ~30-40€
- ⚠️ Verifica si está bien categorizado

En general, tus gastos están dentro de lo normal.
Las anomalías detectadas son justificables.
```

---

## 🚀 DEPENDENCIAS NUEVAS

```bash
npm install @langchain/langgraph @langchain/core @langchain/openai
```

**Versiones recomendadas:**
- `@langchain/langgraph`: ^0.0.19 o superior
- `@langchain/core`: ^0.1.40 o superior
- `@langchain/openai`: ^0.0.19 o superior

---

## 💰 ESTIMACIÓN DE COSTOS

### Uso de IA por conversación con agentes

**Escenario típico:**
- Router: ~100 tokens input, ~50 tokens output
- Agent: ~300 tokens input (prompt + context), ~400 tokens output
- Tools: 2-3 llamadas a DB (sin costo IA)

**Costo por conversación:**
- Input tokens: ~400 tokens × $0.15/1M = $0.00006
- Output tokens: ~450 tokens × $0.60/1M = $0.00027
- **Total:** ~$0.0003 por conversación (0.03 centavos)

**Escala:**
- 100 conversaciones/día: $0.03/día = $0.90/mes
- 1000 conversaciones/día: $0.30/día = $9/mes

**Nota:** Mucho más barato que llamadas múltiples sin orquestación, ya que el router evita ejecuciones innecesarias.

---

## ✅ CRITERIOS DE ÉXITO

### Funcionalidad
- [ ] Router clasifica correctamente > 95% de las consultas
- [ ] Analysis Agent genera insights relevantes
- [ ] Recommendation Agent da sugerencias accionables
- [ ] Todos los tools funcionan correctamente
- [ ] Manejo robusto de errores

### Performance
- [ ] Respuesta < 3 segundos en el 90% de los casos
- [ ] Costo < $0.001 por conversación
- [ ] Sin errores de timeout en LangGraph

### Testing
- [ ] Coverage > 85% en código de agentes
- [ ] Tests E2E para flujos principales
- [ ] Tests de regresión para evitar bugs

### Documentación
- [ ] Arquitectura documentada
- [ ] Cada tool tiene ejemplos
- [ ] Prompts versionados
- [ ] README actualizado

---

## 🔄 MANTENIMIENTO POST-FASE 4

### Mejoras futuras (Fase 5+)
- **Personalización:** Agentes que aprenden de correcciones del usuario
- **Multi-turno:** Conversaciones con memoria persistente
- **Agente de Planning:** Crea planes de ahorro de N meses
- **Fine-tuning:** Modelo custom para router más preciso
- **Streaming:** Respuestas en tiempo real con SSE

---

## 📖 RECURSOS

### LangGraph
- Docs: https://langchain-ai.github.io/langgraph/
- Tutorial: https://python.langchain.com/docs/langgraph
- Examples: https://github.com/langchain-ai/langgraph/tree/main/examples

### Agent Patterns
- ReAct: https://react-lm.github.io/
- Multi-agent systems: https://arxiv.org/abs/2308.08155

### SQL Patterns para Analytics
- Window functions para trends
- Common Table Expressions (CTEs) para análisis complejos
- Aggregations para métricas

---

**Autor:** Claude Sonnet 4.5 + Aitor
**Fecha:** 2 de Febrero de 2026
**Versión:** 1.0
**Estado:** Draft - Por revisar con usuario
