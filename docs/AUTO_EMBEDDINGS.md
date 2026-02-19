# 🤖 Sistema de Embeddings Automáticos

**Versión:** 1.0
**Fecha:** 2026-02-19
**Estado:** ✅ Implementado

---

## 📋 Índice

1. [Visión General](#visión-general)
2. [¿Cómo Funciona?](#cómo-funciona)
3. [Configuración](#configuración)
4. [Arquitectura Técnica](#arquitectura-técnica)
5. [Monitoreo](#monitoreo)
6. [FAQ](#faq)

---

## Visión General

El sistema de **embeddings automáticos** genera vectores semánticos para los gastos de forma completamente **transparente** para el usuario. No requiere intervención manual ni conocimiento técnico.

### ✨ Características Clave

- 🌍 **Global y Distribuido**: Se activa cada 5 gastos totales (no por usuario)
- 🚀 **Procesamiento en Batch**: Genera embeddings para hasta 50 gastos a la vez
- ⚡ **No Bloquea la UI**: Todo ocurre en background sin afectar la experiencia
- 🔄 **Tolerante a Fallos**: Si falla, se reintenta en el siguiente ciclo
- 💰 **Eficiente en Costos**: Usa batch processing de OpenAI (~$0.02/1M tokens)

---

## ¿Cómo Funciona?

### Flujo de Usuario (Transparente)

```
1. Usuario crea gasto → "Café en bar 2D2 - 3.50€"
2. Sistema guarda el gasto en la BD ✅
3. Contador global se incrementa (ahora: 5 gastos totales)
4. 🎯 TRIGGER: Sistema detecta que llegó a 5 gastos
5. Sistema procesa embeddings en background:
   - Busca gastos sin embeddings (de TODOS los usuarios)
   - Genera embeddings en batch (hasta 50 a la vez)
   - Los guarda en expense_embeddings
6. Usuario sigue usando la app normalmente 🎉
```

### Flujo Técnico

```
┌─────────────────────────────────────────────────────────┐
│ Usuario crea gasto (POST /api/expenses)                 │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 1. Guardar gasto en BD                                  │
│    INSERT INTO expenses (...)                           │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Trigger PostgreSQL                                   │
│    auto_increment_expense_counter                       │
│    → Incrementa contador global atómicamente            │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│ 3. App verifica: ¿contador % 5 == 0?                   │
│    shouldTriggerEmbeddings(supabase)                    │
└──────────────────┬──────────────────────────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
         ▼ NO                ▼ SÍ
    Fin del flujo    ┌─────────────────────────┐
                     │ 4. Disparar background  │
                     │    POST /api/ai/        │
                     │    process-embeddings   │
                     └──────────┬──────────────┘
                                │
                                ▼
                     ┌─────────────────────────┐
                     │ 5. Procesar batch       │
                     │    - Buscar gastos sin  │
                     │      embeddings (todos) │
                     │    - Generar vectores   │
                     │    - Guardar en BD      │
                     └─────────────────────────┘
```

---

## Configuración

### 1. Ejecutar Migración SQL

Ejecuta este comando en **Supabase SQL Editor**:

```bash
# Archivo: migrations/auto_embeddings_setup.sql
```

Este script crea:
- ✅ Tabla `expense_counter` (contador global)
- ✅ Función `increment_expense_counter()` (incremento atómico)
- ✅ Trigger automático en la tabla `expenses`

### 2. Configurar Variables de Entorno

Añade en `.env.local`:

```bash
# Internal API Security
# Genera un secreto: openssl rand -hex 32
INTERNAL_API_SECRET=tu-secreto-aleatorio-aqui
```

**⚠️ IMPORTANTE**: En producción, usa un secreto aleatorio fuerte.

### 3. Verificar Setup

Ejecuta en Supabase SQL Editor:

```sql
-- Verificar contador
SELECT * FROM expense_counter;

-- Verificar trigger
SELECT * FROM pg_trigger WHERE tgname = 'auto_increment_expense_counter';

-- Ver gastos sin embeddings
SELECT COUNT(*)
FROM expenses e
LEFT JOIN expense_embeddings ee ON e.id = ee.expense_id
WHERE ee.expense_id IS NULL
  AND e.note IS NOT NULL
  AND e.note != '';
```

---

## Arquitectura Técnica

### Componentes

#### 1. **Contador Global (`expense_counter`)**

**Tabla:**
```sql
CREATE TABLE expense_counter (
  id INTEGER PRIMARY KEY DEFAULT 1, -- Solo una fila
  count BIGINT NOT NULL,             -- Contador global
  updated_at TIMESTAMPTZ
);
```

**Función de Incremento:**
```sql
CREATE FUNCTION increment_expense_counter()
RETURNS BIGINT AS $$
BEGIN
  UPDATE expense_counter
  SET count = count + 1
  WHERE id = 1
  RETURNING count;
END;
$$;
```

**Trigger Automático:**
```sql
CREATE TRIGGER auto_increment_expense_counter
  AFTER INSERT ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION trigger_increment_expense_counter();
```

#### 2. **Verificador de Umbral (`shouldTriggerEmbeddings`)**

**Archivo:** `src/lib/ai/auto-embeddings.ts`

```typescript
export async function shouldTriggerEmbeddings(
  supabase: SupabaseClient
): Promise<boolean> {
  const { data } = await supabase.rpc("increment_expense_counter");
  const currentCount = data as number;
  return currentCount % 5 === 0; // Trigger cada 5 gastos
}
```

#### 3. **Procesador Batch (`generatePendingEmbeddings`)**

**Archivo:** `src/lib/ai/auto-embeddings.ts`

**Características:**
- ✅ Procesa hasta 50 gastos a la vez
- ✅ Usa `generateEmbeddings()` (batch) en lugar de llamadas individuales
- ✅ Filtra gastos que ya tienen embeddings
- ✅ Funciona con **service role key** (bypass RLS, procesa todos los usuarios)

**Flujo:**
```typescript
1. Obtener gastos sin embeddings (todos los usuarios)
2. Generar textos para embedding
3. Llamar a OpenAI (batch)
4. Guardar embeddings en BD
5. Reportar resultados
```

#### 4. **Endpoint Interno (`/api/ai/process-embeddings`)**

**Archivo:** `src/app/api/ai/process-embeddings/route.ts`

**Seguridad:**
- ✅ Requiere `INTERNAL_API_SECRET` en query params
- ✅ Usa `SUPABASE_SERVICE_ROLE_KEY` (bypass RLS)

**Ejemplo de uso:**
```bash
POST /api/ai/process-embeddings?limit=50&secret=tu-secreto
```

---

## Monitoreo

### 1. Ver Estado Global

**GET** `/api/ai/process-embeddings?secret=tu-secreto`

Respuesta:
```json
{
  "totalExpenses": 1250,
  "withEmbeddings": 1200,
  "pending": 50,
  "percentage": 96,
  "status": "pending"
}
```

### 2. Ver Contador Global

```sql
SELECT * FROM expense_counter;
```

Resultado:
```
id | count | updated_at
---+-------+-------------------------
 1 | 1250  | 2026-02-19 14:32:10+00
```

### 3. Logs de Procesamiento

Busca en logs de Next.js:

```
✓ Batch embedding generation completed
  - processed: 50
  - errors: 0
  - remaining: 0
  - durationMs: 2340
  - expensesPerSecond: 21.37
```

---

## FAQ

### ❓ ¿Cuánto cuesta generar embeddings?

**Respuesta:** ~$0.02 por 1 millón de tokens.

**Ejemplo:**
- 1 gasto = ~20 tokens
- 50 gastos = ~1000 tokens
- Costo por batch: ~$0.00002 (0.002 centavos)

### ❓ ¿Qué pasa si OpenAI falla?

**Respuesta:** El sistema reintenta en el siguiente ciclo (próximos 5 gastos).

### ❓ ¿Puedo cambiar el umbral de 5 gastos?

**Sí.** Edita `AUTO_EMBEDDING_BATCH_SIZE` en `src/lib/ai/auto-embeddings.ts`:

```typescript
const AUTO_EMBEDDING_BATCH_SIZE = 5; // Cambia este valor
```

### ❓ ¿Cómo genero embeddings para gastos antiguos?

**Opción 1:** Usa el endpoint de migración:

```bash
POST /api/ai/migrate-embeddings?limit=100
```

**Opción 2:** Dispara manualmente el procesador:

```bash
POST /api/ai/process-embeddings?limit=100&secret=tu-secreto
```

### ❓ ¿El sistema procesa gastos de todos los usuarios?

**Sí.** Cada 5 gastos globales (de cualquier usuario), se procesan hasta 50 gastos pendientes de TODOS los usuarios.

**Ejemplo:**
- Usuario A crea 3 gastos → contador = 3
- Usuario B crea 2 gastos → contador = 5 → ✅ TRIGGER
- Sistema procesa gastos pendientes de A, B, y otros usuarios

### ❓ ¿Qué pasa si el contador se desincroniza?

**Solución:** Recalcula el contador manualmente:

```sql
UPDATE expense_counter
SET count = (SELECT COUNT(*) FROM expenses)
WHERE id = 1;
```

---

## Mejoras Futuras

### 🔮 Roadmap

1. **Queue System** (e.g., BullMQ, Inngest)
   - Procesamiento más robusto con reintentos
   - Mejor observabilidad

2. **Smart Batching**
   - Priorizar usuarios activos
   - Ajustar batch size dinámicamente

3. **Embeddings Delta**
   - Solo regenerar si el gasto cambia
   - Versioning de embeddings

4. **Metrics Dashboard**
   - Visualizar tasa de procesamiento
   - Detectar cuellos de botella

---

## Soporte

**Preguntas técnicas:** [aitoralmu21@gmail.com](mailto:aitoralmu21@gmail.com)

**Documentos relacionados:**
- [API Documentation](API_DOCUMENTATION.md)
- [AI Architecture](KAKEBOT_V2_ARCHITECTURE.md)
- [Embeddings Library](../src/lib/ai/embeddings.ts)

---

**Desarrollado por:** Aitor Alarcón
**Última actualización:** 2026-02-19
**Estado:** ✅ Production Ready
