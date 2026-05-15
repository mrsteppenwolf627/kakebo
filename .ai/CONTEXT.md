# CONTEXTO DEL PROYECTO KAKEBO AI

**Última actualización:** 2025-02-02
**Sesión anterior con:** Claude Opus 4.5
**Fase actual:** 3 - RAG y Memoria (COMPLETADA) → Listo para Fase 4

---

## 🎯 QUÉ ES KAKEBO AI

**Kakebo AI** es una aplicación de finanzas personales basada en el método japonés Kakebo, potenciada con inteligencia artificial:

- **Clasificación automática de gastos** usando GPT-4o-mini
- **Asistente conversacional** con function calling para gestionar finanzas
- **Búsqueda semántica (RAG)** para encontrar gastos similares en el historial
- **Panel de métricas** para evaluar el rendimiento del modelo

**Objetivo del proyecto:** Crear un portfolio profesional de AI Systems Engineering para conseguir empleo como AI Solutions Engineer (50-65K€).

---

## 🏗️ STACK TECNOLÓGICO

| Capa | Tecnología | Propósito |
|------|------------|-----------|
| **Frontend** | Next.js 16 + React 18 + TypeScript | UI y routing |
| **Estilos** | Tailwind CSS | Diseño responsive |
| **Backend** | Next.js API Routes | Endpoints REST |
| **Validación** | Zod | Schemas TypeScript-first |
| **Auth** | Supabase Auth | OAuth (Google) + JWT |
| **Database** | Supabase PostgreSQL | Datos + pgvector |
| **AI** | OpenAI API | GPT-4o-mini + embeddings |
| **Hosting** | Vercel | Deploy automático desde GitHub |
| **Gráficos** | Recharts | Visualización de métricas |

---

## 📁 ESTRUCTURA DEL PROYECTO

```
kakebo/
├── .ai/                          # Documentación para LLMs
│   ├── CONTEXT.md               # ← Este archivo
│   ├── CURRENT_TASK.md          # Tarea actual detallada
│   └── prompts/                 # Prompts del Claude Project
│
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── api/                 # API Routes
│   │   │   ├── ai/              # Endpoints de IA
│   │   │   │   ├── classify/    # POST - Clasificar gasto
│   │   │   │   ├── assistant/   # POST - Chat con asistente
│   │   │   │   ├── feedback/    # POST - Registrar corrección
│   │   │   │   ├── search/      # POST - Búsqueda semántica
│   │   │   │   └── metrics/     # GET - Métricas agregadas
│   │   │   ├── expenses/        # CRUD gastos
│   │   │   ├── months/          # CRUD meses
│   │   │   ├── settings/        # GET/PATCH configuración
│   │   │   └── fixed-expenses/  # CRUD gastos fijos
│   │   │
│   │   ├── app/                 # Páginas protegidas
│   │   │   ├── page.tsx         # Dashboard principal
│   │   │   ├── new/             # Crear nuevo gasto
│   │   │   ├── ai-metrics/      # Panel de métricas IA
│   │   │   ├── history/         # Historial de gastos
│   │   │   ├── settings/        # Configuración
│   │   │   └── fixed-expenses/  # Gastos fijos
│   │   │
│   │   ├── auth/callback/       # OAuth callback (Google)
│   │   └── login/               # Página de login
│   │
│   ├── components/              # Componentes React
│   │   ├── AuthGate.tsx         # Protección de rutas
│   │   ├── TopNav.tsx           # Navegación superior
│   │   ├── ExpenseCalendar.tsx  # Calendario de gastos
│   │   ├── AIMetricsChart.tsx   # Gráficos de métricas IA
│   │   ├── AILogsList.tsx       # Lista de logs IA
│   │   └── ...
│   │
│   └── lib/                     # Lógica de negocio
│       ├── ai/                  # Sistema de IA (ver detalle abajo)
│       ├── api/                 # Utilidades API
│       ├── supabase/            # Clientes Supabase
│       ├── schemas/             # Schemas Zod
│       └── logger.ts            # Logging con Pino
│
├── docs/                        # Documentación adicional
└── public/                      # Assets estáticos
```

---

## 🤖 SISTEMA DE IA - DETALLE

### Archivos en `src/lib/ai/`

| Archivo | Descripción | Funciones principales |
|---------|-------------|----------------------|
| `client.ts` | Cliente OpenAI configurado | `openai`, `calculateCost()` |
| `classifier.ts` | Clasificador de gastos | `classifyExpense(text)` |
| `assistant.ts` | Asistente conversacional | `processMessage()` |
| `tools.ts` | Definiciones de tools | `ASSISTANT_TOOLS`, tipos |
| `tool-executor.ts` | Ejecutor de tools | `executeTool()` |
| `embeddings.ts` | Sistema RAG | `generateEmbedding()`, `searchExpensesByText()` |
| `metrics.ts` | Logging y métricas | `logAIInteraction()`, `getAIMetrics()` |
| `prompts.ts` | Prompts versionados | `CLASSIFICATION_PROMPT` |

### Flujo de Clasificación

```
Usuario escribe "Netflix mensual"
         │
         ▼
POST /api/ai/classify
         │
         ▼
classifyExpense() en classifier.ts
         │
         ├─► Construye prompt con few-shot examples
         ├─► Llama a GPT-4o-mini
         ├─► Parsea JSON response
         └─► Guarda log en ai_logs
         │
         ▼
{ category: "culture", note: "Netflix mensual", confidence: 0.95, logId: "..." }
```

### Flujo del Asistente

```
Usuario: "¿Cuánto llevo gastado en cultura?"
         │
         ▼
POST /api/ai/assistant
         │
         ▼
processMessage() en assistant.ts
         │
         ├─► Construye mensajes con historial
         ├─► Llama a GPT-4o-mini con tools
         │
         ▼
Modelo decide: tool_call → get_monthly_summary
         │
         ▼
executeTool() en tool-executor.ts
         │
         ├─► Consulta Supabase
         └─► Retorna datos al modelo
         │
         ▼
Modelo genera respuesta final con datos
         │
         ▼
"Este mes llevas 45.99€ en cultura (Netflix, Spotify...)"
```

### Flujo de Búsqueda Semántica (RAG)

```
Usuario: "Busca gastos de comida"
         │
         ▼
Asistente usa tool: search_similar_expenses
         │
         ▼
searchExpensesByText() en embeddings.ts
         │
         ├─► generateEmbedding("comida") → vector 1536D
         └─► searchSimilarExpenses() → RPC match_expenses
         │
         ▼
Supabase calcula similitud de coseno
         │
         ▼
Resultados: [{ note: "Glovo pizza", similarity: 0.87 }, ...]
```

---

## 📡 ENDPOINTS API

### Endpoints de IA

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/ai/classify` | Clasificar texto → categoría |
| POST | `/api/ai/assistant` | Chat con function calling |
| POST | `/api/ai/feedback` | Registrar corrección |
| POST | `/api/ai/search` | Búsqueda semántica |
| GET | `/api/ai/metrics` | Métricas + logs |
| GET/POST | `/api/ai/migrate-embeddings` | Migración de embeddings |

### Endpoints CRUD

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET/POST | `/api/expenses` | Listar/Crear gastos |
| GET/PATCH/DELETE | `/api/expenses/[id]` | Gasto individual |
| GET/POST | `/api/months` | Listar/Crear meses |
| GET/PATCH | `/api/settings` | Configuración usuario |
| GET/POST | `/api/fixed-expenses` | Gastos fijos |

---

## 🗄️ BASE DE DATOS (Supabase)

### Tablas principales

| Tabla | Descripción |
|-------|-------------|
| `expenses` | Gastos del usuario |
| `months` | Meses con estado (open/closed) |
| `user_settings` | Presupuestos por categoría |
| `fixed_expenses` | Gastos fijos mensuales |
| `ai_logs` | Registro de interacciones IA |
| `expense_embeddings` | Vectores para RAG (pgvector) |

### Categorías Kakebo

| Código | Español | Descripción |
|--------|---------|-------------|
| `survival` | Supervivencia | Comida, transporte, salud |
| `optional` | Opcional | Restaurantes, ropa, caprichos |
| `culture` | Cultura | Netflix, libros, cursos |
| `extra` | Extra | Imprevistos, emergencias |

---

## 📊 PROGRESO DEL PROYECTO

### Fases completadas

| Fase | Nombre | Estado | Semana |
|------|--------|--------|--------|
| 0 | Setup y Planificación | ✅ 100% | 0 |
| 1 | Backend Profesional | ✅ 100% | 1 |
| 2 | IA Aplicada | ✅ 100% | 2 |
| 3 | RAG y Memoria | ✅ 100% | 3 |
| 4 | Agentes y Orquestación | ⬜ 0% | 4-5 |
| 5 | Producción AWS | ⬜ 0% | 6-7 |
| 6 | Portfolio | ⬜ 0% | 8 |

### Fase 3 - Completada

**Infraestructura:**
- ✅ pgvector habilitado en Supabase
- ✅ Tabla `expense_embeddings` con índice HNSW
- ✅ Función SQL `match_expenses`
- ✅ `embeddings.ts` completo

**Endpoints:**
- ✅ POST `/api/ai/search` - Búsqueda semántica
- ✅ GET/POST `/api/ai/migrate-embeddings` - Migración

**Integración:**
- ✅ Tool `search_similar_expenses` en asistente
- ✅ Embeddings auto-generados al crear gastos
- ✅ UI de migración en `/app/ai-metrics`
- ✅ Clasificación IA en `/app/new`
- ✅ Login Google OAuth arreglado

---

## 🔧 CONFIGURACIÓN

### Variables de entorno requeridas

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# OpenAI
OPENAI_API_KEY=sk-...

# Site URL (para OAuth)
NEXT_PUBLIC_SITE_URL=https://kakebo-neon.vercel.app
```

### Supabase Dashboard

- **Proyecto:** kakebo
- **URL:** Configurado en Vercel
- **Auth providers:** Google OAuth habilitado
- **Extensiones:** pgvector habilitado

---

## 🔮 Future Roadmap

## Completed (v3.12.0)
- **Income Card** — Ahora visible en el panel principal con color verde
- **4-Card Layout**: Presupuesto, Gastos, Disponible + Ingresos
- **Responsive Grid**: 4 cols (desktop), 2×2 (tablet), 1 col (mobile)

### Próximo (v3.13.0)
- **Flow Chart** — Gráfico de Ingresos → Presupuesto → Gastos → Disponible
- **Projected Income** — Estimación de ingresos futuros
- **Income Breakdown** — Desglose de fuentes de ingreso (nómina, extras, etc.)

### Futuro (v4.0.0)
- **Budget Distribution** — Recomendaciones automáticas de cómo distribuir presupuesto
- **Spending Patterns** — Análisis temporal de patrones de gasto
- **Multi-currency Support** — Soportar múltiples monedas

---

## 📝 NOTAS PARA LLMs

### Al leer este proyecto:

1. **Sistema de IA** está en `src/lib/ai/` - revisa `CURRENT_TASK.md` para detalles de cada función
2. **Autenticación** usa Supabase Auth con OAuth de Google
3. **API Routes** siguen patrón REST con respuestas `{ success, data/error }`
4. **Validación** con Zod en `src/lib/schemas/`
5. **RAG** usa pgvector con embeddings de OpenAI

### Comandos útiles:

```bash
npm run dev      # Desarrollo local
npm run build    # Build de producción
npm run lint     # Linter
git push         # Deploy automático a Vercel
```

---

**Versión:** 3.0
**Última actualización:** 2025-02-02 CET
