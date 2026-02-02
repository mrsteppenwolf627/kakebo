# TAREA ACTUAL

**Inicio:** 2025-02-02
**Objetivo:** Iniciar Fase 3 - RAG y Memoria
**Fase:** 3 - RAG y Memoria
**Semana:** 3/10
**Estado:** 🟡 PENDIENTE - Listo para comenzar

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
- [ ] Habilitar extensión pgvector en Supabase
- [ ] Crear tabla `expense_embeddings`
- [ ] Crear función de búsqueda por similitud

### 2. Embeddings
- [ ] Integrar OpenAI text-embedding-3-small
- [ ] Función para generar embedding de gasto
- [ ] Migración para embeddings de gastos existentes

### 3. Retrieval
- [ ] Endpoint de búsqueda semántica
- [ ] Chunking strategy (por gasto individual)
- [ ] Top-K retrieval con threshold de similitud

### 4. Asistente Contextual
- [ ] Integrar retrieval en el asistente
- [ ] Prompt con contexto de gastos similares
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

1. **Verificar Supabase pgvector** - ¿Está disponible en el plan actual?
2. **Diseñar schema de embeddings** - Decidir qué campos indexar
3. **Crear tabla expense_embeddings** - Con índice HNSW o IVFFlat
4. **Implementar generación de embeddings** - En creación de gastos

---

**Versión:** 4.0
**Última actualización:** 2025-02-02 CET
