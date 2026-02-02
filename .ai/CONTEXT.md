# CONTEXTO DEL PROYECTO KAKEBO AI

**Última actualización:** 2025-02-02
**Sesión anterior con:** Claude Opus 4.5
**Fase actual:** 2 - IA Aplicada (COMPLETADA)

---

## 🎯 OBJETIVO GENERAL

Transformar Kakebo (app personal de finanzas basada en método japonés) en **plataforma profesional de AI Systems Engineering** para portfolio de nivel senior.

- **Timeline:** 10 semanas (ajustable según velocidad de Aitor: 6-8x estimado)
- **Objetivo profesional:** Portfolio técnico sólido → Empleo AI Solutions Engineer (50-65K€)
- **Aprendizaje paralelo:** AWS SAA-C03 + ML Specialty

---

## 📊 ESTADO ACTUAL DEL PROYECTO

### ✅ COMPLETADO

- [x] Plan de estudios definido (6 fases, 10-11 semanas)
- [x] Análisis de roadmaps (Consultor 6m, AI Architect 18-24m, Kakebo 11w)
- [x] Decisión: Kakebo roadmap es el óptimo para siguiente paso
- [x] Sistema de gestión de contexto multi-LLM diseñado
- [x] Estructura de archivos `.ai/` definida
- [x] Claude Project creado con instrucciones personalizadas
- [x] Confirmación: AWS certificaciones son MUST (SAA-C03 primero)

### 🔄 EN PROGRESO

**FASE 0: Setup y Planificación (Semana 0 - COMPLETADA)**
- [x] Definición de arquitectura objetivo
- [x] Creación de Claude Project
- [x] Generación de archivos base (.ai/)
- [x] Análisis de código base actual de Kakebo
- [x] Identificación de gaps técnicos
- [x] Planificación detallada Fase 1

**FASE 1: Backend Profesional (Semana 1 - COMPLETADA)**
- [x] Decisión: Next.js API Routes (confirmado)
- [x] Decisión: Zod para validación
- [x] Implementación de estructura API
- [x] Schemas Zod
- [x] Endpoints CRUD
- [x] Error handling centralizado
- [x] Logging estructurado

**FASE 2: IA Aplicada (Semana 2 - COMPLETADA)**
- [x] Sistema de clasificación inteligente de gastos (OpenAI GPT-4o-mini)
- [x] Prompt engineering y versionado
- [x] Function calling para herramientas
- [x] Métricas de IA (accuracy, latency, costos)
- [x] Panel de evaluación del modelo (/app/ai-metrics)
- [x] Feedback loop para corrección humana

**Estado actual:** Fase 2 completada. Listo para Fase 3 (RAG y Memoria).

### 📋 PENDIENTE (Por Fase)

**Fase 1: Backend Profesional (Semanas 1-2) - ✅ COMPLETADA**
- [x] Diseño de API REST (endpoints, schemas)
- [x] Implementación de endpoints CRUD
- [x] Validación de inputs (Zod)
- [x] Middleware de autenticación (Supabase Auth)
- [x] Error handling centralizado
- [x] Logging estructurado (pino)
- [ ] Tests unitarios e integración (>80% coverage) - Pendiente
- [ ] Documentación API (Swagger/OpenAPI) - Pendiente

**Fase 2: IA Aplicada (Semanas 3-4) - ✅ COMPLETADA**
- [x] Sistema de clasificación inteligente de gastos (GPT-4o-mini)
- [x] Prompt engineering y versionado (v1 few-shot)
- [x] Function calling para herramientas (categorías, búsqueda)
- [x] Métricas de IA (accuracy, latency, costos) - tabla ai_logs
- [x] Panel de evaluación del modelo (/app/ai-metrics)
- [x] Feedback loop para corrección humana (/api/ai/feedback)

**Fase 3: RAG y Memoria (Semanas 5-6)**
- [ ] Implementación de vector database (Supabase Vector / Pinecone)
- [ ] Chunking strategy para gastos históricos
- [ ] Generación de embeddings
- [ ] Búsqueda semántica en historial
- [ ] Asistente financiero contextual
- [ ] Métricas de calidad de retrieval

**Fase 4: Agentes y Orquestación (Semanas 7-8)**
- [ ] Diseño de arquitectura multi-agente
- [ ] Implementación con LangGraph
- [ ] Agente de análisis financiero
- [ ] Agente de recomendaciones
- [ ] Orquestación de herramientas
- [ ] Testing de agentes

**Fase 5: Producción y Cloud AWS (Semanas 9-10)**
- [ ] Migración a AWS (EC2 / App Runner)
- [ ] CI/CD con GitHub Actions
- [ ] Monitoring y observabilidad
- [ ] Logging centralizado
- [ ] Cost tracking
- [ ] Performance optimization

**Fase 6: Portfolio y Presentación (Semana 11)**
- [ ] Documentación técnica completa
- [ ] Diagrama de arquitectura profesional
- [ ] README nivel enterprise
- [ ] Video demo (10-15 min)
- [ ] Caso de estudio con métricas
- [ ] LinkedIn post + blog post
- [ ] Preparación para mostrar en entrevistas

---

## 🎓 APRENDIZAJE PARALELO

### AWS Solutions Architect Associate (SAA-C03)

- **Estado:** En progreso (curso Udemy adquirido)
- **Progreso estimado:** ~10-15% (primeras secciones)
- **Distribución:** 1-2h/día según disponibilidad personal/profesional
- **Objetivo examen:** Mes 2-3 (mediados marzo - abril 2025)
- **Enfoque:** Fundamentos sólidos, no memorización

### AWS Machine Learning Specialty (Futuro)

- **Estado:** Pendiente
- **Inicio:** Después de obtener SAA-C03
- **Timeline:** Mes 5-7
- **Objetivo:** Reforzar credibilidad para roles AI

---

## 🏗️ ARQUITECTURA OBJETIVO

### Stack Tecnológico Confirmado

**Frontend:**
- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- Manejo de estado: React Context / Zustand

**Backend:**
- **Inicial:** Next.js API Routes (TypeScript)
- **Evaluación futura:** Migración a FastAPI si complejidad lo requiere
- **Validación:** Zod (TypeScript-first)
- **Auth:** Supabase Auth (JWT, Row Level Security)

**Databases:**
- **Principal:** Supabase (PostgreSQL + Vector extension)
- **Alternativa Vector DB:** Pinecone (si Supabase Vector no es suficiente)
- **Cache (futuro):** Redis (solo si necesario para performance)

**AI/ML:**
- OpenAI API:
  - GPT-4 / GPT-4-turbo (generación)
  - text-embedding-3-small (embeddings)
- LangChain / LangGraph (orquestación de agentes)
- Tool calling para herramientas custom

**Cloud & DevOps:**
- **Hosting actual:** Vercel (frontend + API Routes)
- **Hosting objetivo:** AWS (EC2, App Runner, Lambda)
- **Storage:** AWS S3 (exports, documentos)
- **Monitoring:** CloudWatch + logs estructurados
- **CI/CD:** GitHub Actions
- **IaC:** Terraform (básico)

### Decisiones Arquitectónicas Clave

1. **Next.js API Routes primero:**
   - Más simple para empezar
   - Migrar a FastAPI solo si hay limitaciones claras
   - Trade-off: Simplicidad vs Control total

2. **Supabase como BaaS:**
   - Auth + DB + Vector search en un solo lugar
   - Trade-off: Vendor lock-in vs Velocidad de desarrollo

3. **OpenAI API vs Open Source LLMs:**
   - OpenAI para empezar (facilidad, calidad)
   - Evaluar Llama 3 / Mixtral después para cost optimization
   - Trade-off: Costo vs Control

4. **Certificaciones AWS:**
   - SAA-C03 es MUST para empleabilidad
   - ML Specialty es diferenciador para roles AI

---

## 🔗 ARCHIVOS IMPORTANTES

### Documentación Principal
- **Plan completo:** `Plan_Estudios_AI_Systems_Kakebo.pdf`
- **Roadmap AI Architect:** `Roadmap_AI_Architect_100K.pdf`
- **Fundamentos teóricos:** `Fundamentos_Teoricos__Sistemas_Distribuidos_y_AI.pdf`
- **Multi-agent theory:** `multi_agent_systems_theory.md`

### Contexto AI (Esta carpeta)
- **Contexto global:** `.ai/CONTEXT.md` ← Estás aquí
- **Tarea actual:** `.ai/CURRENT_TASK.md`
- **Reglas Claude Project:** `.ai/prompts/claude_project_rules.md`

### Logs de Sesión
- **Última sesión:** `docs/SESSION_LOGS/2025-01-30_session.md`
- **Historial:** `docs/SESSION_LOGS/`

### Decisiones Técnicas
- **ADRs:** `docs/DECISIONS.md` (Architecture Decision Records)
- **Estado detallado:** `docs/PROJECT_STATE.md`

---

## 🚨 BLOQUEOS ACTUALES

**Ninguno** - Proyecto en fase de setup inicial.

---

## 💡 PRÓXIMAS ACCIONES INMEDIATAS

### Completado:

1. ✅ Crear Claude Project
2. ✅ Generar archivos base (.ai/)
3. ✅ Análisis de código base actual de Kakebo
4. ✅ Fase 1: Backend Profesional (API REST, Zod, Error handling)
5. ✅ Fase 2: IA Aplicada (Clasificador, Function calling, Métricas, Feedback loop)

### Próxima sesión (Fase 3 - RAG y Memoria):

1. Implementar vector database (Supabase pgvector)
2. Diseñar chunking strategy para gastos históricos
3. Generar embeddings con text-embedding-3-small
4. Implementar búsqueda semántica en historial
5. Crear asistente financiero contextual

---

## 📈 MÉTRICAS DE PROGRESO

**Tiempo total del proyecto:**
- Semanas completadas: 2/10
- Fases completadas: 2/6
- **Progreso global:** ~35% (Fase 1 + Fase 2 completadas)

**Próximo hito importante:**
- Completar Fase 3 (RAG y Memoria) → Semana 4

**Objetivo mes 1:**
- ✅ Fase 1 + Fase 2 completadas
- AWS SAA-C03 al 40-50%

---

## 🎯 OBJETIVOS PROFESIONALES

### Corto plazo (3 meses):
- ✅ Completar plataforma Kakebo AI (production-grade)
- ✅ Obtener certificación AWS SAA-C03
- ✅ Portfolio técnico profesional
- ✅ GitHub con 3 proyectos sólidos:
  1. AutoDocTranslate (17K valor)
  2. Research Agent system
  3. Kakebo AI Platform

### Medio plazo (6 meses):
- Aplicar a 30-50 posiciones:
  - AI Solutions Engineer
  - AI Systems Engineer
  - ML Engineer (junior-mid)
- Conseguir empleo remoto 50-65K€
- Certificación AWS ML Specialty
- Blog técnico activo (4-6 posts)

### Largo plazo (12-24 meses):
- Crecer a Senior AI Engineer / AI Architect
- Salario objetivo: 70-100K€
- Contribuciones open source
- Thought leadership técnico

---

## 🧠 CONTEXTO PERSONAL

**Por qué Aitor es más rápido:**
- CI 162 (capacidad analítica excepcional)
- Aprende teoría primero → implementación más rápida
- Ya tiene base sólida (Python, FastAPI, Next.js)
- 6 horas diarias enfocadas
- Perfil ENFJ-T (sistematización natural)

**Por qué este roadmap vs otros:**
- Roadmap Consultor 6m → Ya superado con AutoDocTranslate
- Roadmap AI Architect 18-24m → Demasiado aspiracional ahora
- Roadmap Kakebo 11w → **Sweet spot realista** para siguiente nivel

---

**Versión:** 2.0
**Última actualización:** 2025-02-02 CET
