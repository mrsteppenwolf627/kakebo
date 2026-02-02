# TAREA ACTUAL

**Inicio:** 2025-02-02
**Objetivo:** Iniciar Fase 3 - RAG y Memoria
**Fase:** 3 - RAG y Memoria
**Semana:** 3/10
**Estado:** 🟢 EN PROGRESO - Código implementado, pendiente SQL en Supabase

---

## 📋 CONTEXTO DE ESTA TAREA

Implementar sistema RAG (Retrieval-Augmented Generation) para:
- Buscar gastos históricos similares
- Dar contexto al asistente IA sobre patrones de gasto
- Mejorar clasificaciones con ejemplos personalizados
- Crear un asistente financiero que "recuerde" tu historial

---

## ✅ FASE 2 COMPLETADA

### Sistema de Clasificación IA
- [x] Clasificador de gastos con GPT-4o-mini
- [x] Prompt engineering con few-shot examples
- [x] Function calling (getExpenseCategories, searchExpenses)
- [x] Asistente conversacional con herramientas

### Métricas y Monitoreo
- [x] Tabla `ai_logs` para tracking
- [x] Endpoint GET /api/ai/metrics
- [x] Panel de métricas en /app/ai-metrics
- [x] Filtros por rango de fechas
- [x] Gráficos de distribución (Recharts)

### Feedback Loop
- [x] Endpoint POST /api/ai/feedback
- [x] UI de sugerencia IA en formulario de nuevo gasto
- [x] Botón "🤖 IA" para solicitar clasificación
- [x] Aceptar/Ignorar sugerencias
- [x] Registro automático de correcciones
- [x] Cálculo de accuracy basado en correcciones

---

## 📋 CHECKLIST FASE 3

### 1. Vector Database Setup
- [ ] Habilitar extensión pgvector en Supabase ⚠️ PENDIENTE
- [ ] Crear tabla `expense_embeddings` ⚠️ PENDIENTE (SQL listo)
- [ ] Crear función de búsqueda por similitud ⚠️ PENDIENTE (SQL listo)

### 2. Embeddings
- [x] Integrar OpenAI text-embedding-3-small ✅
- [x] Función para generar embedding de gasto ✅
- [ ] Migración para embeddings de gastos existentes

### 3. Retrieval
- [x] Endpoint de búsqueda semántica (POST /api/ai/search) ✅
- [x] Chunking strategy (por gasto individual) ✅
- [x] Top-K retrieval con threshold de similitud ✅

### 4. Asistente Contextual
- [x] Integrar retrieval en el asistente (search_similar_expenses tool) ✅
- [x] Prompt con contexto de gastos similares ✅
- [ ] Mejorar clasificaciones con ejemplos del usuario

### 5. Métricas RAG
- [ ] Medir calidad de retrieval
- [ ] Comparar accuracy con/sin RAG

---

## 🏗️ ARQUITECTURA ACTUAL

```
src/
├── app/
│   ├── api/
│   │   ├── ai/
│   │   │   ├── classify/route.ts     ✅ Clasificación + logging
│   │   │   ├── assistant/route.ts    ✅ Asistente con tools
│   │   │   ├── feedback/route.ts     ✅ Correcciones
│   │   │   └── metrics/route.ts      ✅ Métricas agregadas
│   │   ├── expenses/...              ✅ CRUD
│   │   ├── months/...                ✅ CRUD
│   │   ├── settings/...              ✅ GET/PATCH
│   │   └── fixed-expenses/...        ✅ CRUD
│   └── app/
│       ├── ai-metrics/               ✅ Dashboard métricas IA
│       │   ├── page.tsx
│       │   └── AIMetricsClient.tsx
│       └── new/
│           └── NewExpenseClient.tsx  ✅ Con sugerencia IA
├── components/
│   ├── AIMetricsChart.tsx            ✅ Gráficos bar/pie
│   ├── AILogsList.tsx                ✅ Lista de logs
│   ├── SpendingChart.tsx             ✅ Gráfico de gastos
│   └── TopNav.tsx                    ✅ Con enlace a IA
└── lib/
    ├── ai/
    │   ├── classifier.ts             ✅ classifyExpense()
    │   ├── assistant.ts              ✅ Asistente con tools
    │   ├── tools.ts                  ✅ Function definitions
    │   ├── tool-executor.ts          ✅ Ejecutor de tools
    │   ├── metrics.ts                ✅ Logging y métricas
    │   └── prompts.ts                ✅ Prompt versionado
    ├── api/...                       ✅ Utilidades API
    └── schemas/...                   ✅ Validación Zod
```

---

## 📡 ENDPOINTS IA DISPONIBLES

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/ai/classify` | Clasificar gasto (devuelve logId) |
| POST | `/api/ai/assistant` | Chat con asistente (function calling) |
| POST | `/api/ai/feedback` | Registrar corrección |
| GET | `/api/ai/metrics` | Métricas agregadas + logs |

---

## 🚨 BLOQUEOS

Ninguno actualmente.

---

## 💡 PRÓXIMA ACCIÓN

**IMPORTANTE: Ejecutar el SQL en Supabase para habilitar la búsqueda semántica**

El código está listo pero necesitas crear la tabla en Supabase:

1. Ir a Supabase Dashboard → SQL Editor
2. Ejecutar el SQL que está en `src/lib/ai/embeddings.ts` (constante EXPENSE_EMBEDDINGS_SQL)
3. Esto habilitará pgvector y creará la tabla con índices

Una vez creada la tabla:
- Los nuevos gastos generarán embeddings automáticamente
- El asistente podrá buscar gastos similares
- POST /api/ai/search funcionará

---

**Versión:** 5.0
**Última actualización:** 2025-02-02 CET (Fase 3 código implementado)
