-- MIGRATION: ai_logs support for agent-v2 turn metrics (Fase 2.I)
-- DATE: 2026-09-14
-- DESCRIPTION:
-- Fase 2.I: persistir métricas mínimas y privacy-safe de cada turno del
-- chat activo (agent-v2 streaming, src/lib/agents-v2/stream-caller.ts) en
-- la tabla `ai_logs` ya existente (src/lib/ai/metrics.ts), reutilizada —
-- no se crea un esquema paralelo.
--
-- `ai_logs` no tiene una migración local previa (se creó directamente en
-- Supabase a partir del SQL embebido en `AI_LOGS_TABLE_SQL`,
-- src/lib/ai/metrics.ts). Su forma ANTES de esta migración era:
--   id, user_id, type TEXT CHECK (type IN ('classification','assistant')),
--   input TEXT NOT NULL, output JSONB, model, prompt_version,
--   input_tokens, output_tokens, cost_usd, latency_ms, tools_used TEXT[],
--   success, error_message, was_corrected, corrected_category, created_at.
--
-- Corrección posterior a la primera versión de esta migración:
-- `AI_LOGS_TABLE_SQL` (src/lib/ai/metrics.ts) se actualizó para reflejar
-- YA el estado final deseado (type con 'agent_v2', turn_type, input
-- nullable) — es la definición de referencia para un entorno NUEVO sin la
-- tabla todavía. Esta migración sigue siendo la vía correcta para un
-- entorno donde `ai_logs` YA EXISTE con la forma antigua de arriba: ambas
-- fuentes describen el MISMO estado final, nunca esquemas contradictorios.
--
-- Dos huecos esenciales para poder reutilizarla sin violar el contrato de
-- privacidad de la Fase 2.I ("nunca mensaje del usuario, historial,
-- respuesta de IA, nota/importe/fecha de gasto, argumentos de
-- herramientas, confirmationId ni IDs de gasto"):
--
-- 1. `input TEXT NOT NULL` obligaría a escribir ALGO en una columna
--    pensada para el texto de entrada — exactamente el tipo de contenido
--    que esta fase prohíbe guardar para el chat activo. Se relaja a
--    NULLABLE para poder omitirlo con seguridad en las filas de agent-v2
--    (nunca se rellena con contenido de conversación).
-- 2. El CHECK de `type` solo admite 'classification'/'assistant' — ninguno
--    describe con precisión una fila de agent-v2, y 'assistant' ya está
--    reservado conceptualmente para /api/ai/assistant (aunque hoy no
--    escribe en esta tabla). Se añade 'agent_v2' como tercer valor
--    permitido, sin tocar los dos existentes.
--
-- Además, se añade `turn_type` (nueva columna, nullable, con su propio
-- CHECK) para diferenciar el tipo TÉCNICO de turno dentro de agent-v2
-- (respuesta directa, consulta con herramientas, propuesta de
-- confirmación, confirmación ejecutada, bloqueo por ámbito, error) — la
-- señal que permitirá más adelante decidir un enrutamiento de modelos por
-- tipo de tarea (Fase 2.H). `tools_used` (ya existente, TEXT[]) se
-- reutiliza tal cual para los NOMBRES de herramientas, nunca argumentos.
--
-- `cost_usd` (ya existente) se reutiliza para la estimación de coste que
-- ya calcula el código (calculateCost, src/lib/ai/client.ts) — sigue
-- siendo una ESTIMACIÓN local basada en el precio configurado por modelo,
-- nunca una factura real de OpenAI; ver el comentario de columna añadido
-- más abajo y la documentación en código
-- (src/lib/ai/metrics.ts: logAgentTurnMetrics).
--
-- SAFETY: this migration has NOT been run against any Supabase project by
-- the assistant. Idempotent and defensive: usa `IF EXISTS`/`to_regclass`
-- en TODOS los pasos — incluidos los `COMMENT ON COLUMN` finales, que van
-- envueltos en su propio bloque guardado por la misma razón que el resto:
-- son sentencias sueltas que fallarían igual que un ALTER TABLE si
-- `ai_logs` no existe todavía — así que no falla si `ai_logs` todavía no
-- existe en el entorno de destino, y es segura de re-ejecutar. Run it in
-- the Supabase SQL Editor (or via the Supabase CLI) of the target project
-- when the owner decides to close Fase 2.

-- 1. `input` deja de ser obligatorio — las filas de agent-v2 nunca lo rellenan.
ALTER TABLE IF EXISTS public.ai_logs
  ALTER COLUMN input DROP NOT NULL;

-- 2. Nueva columna `turn_type` (nullable — NULL para filas preexistentes
--    de 'classification'/'assistant', que no tienen este concepto).
ALTER TABLE IF EXISTS public.ai_logs
  ADD COLUMN IF NOT EXISTS turn_type TEXT;

-- 3. Amplía el CHECK de `type` para admitir 'agent_v2', sin asumir el
--    nombre exacto de la restricción existente (puede variar según cómo
--    se creó la tabla): la localiza por su definición SQL, la sustituye.
DO $$
DECLARE
  r RECORD;
BEGIN
  IF to_regclass('public.ai_logs') IS NULL THEN
    RETURN; -- Tabla no existe todavía en este entorno: no-op seguro.
  END IF;

  FOR r IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.ai_logs'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%type%classification%'
  LOOP
    EXECUTE format('ALTER TABLE public.ai_logs DROP CONSTRAINT %I', r.conname);
  END LOOP;

  ALTER TABLE public.ai_logs
    ADD CONSTRAINT ai_logs_type_check
    CHECK (type IN ('classification', 'assistant', 'agent_v2'));
END $$;

-- 4. CHECK para `turn_type`: solo los valores técnicos definidos por la
--    Fase 2.I, o NULL (filas que no son de agent_v2).
DO $$
BEGIN
  IF to_regclass('public.ai_logs') IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ai_logs_turn_type_check'
      AND conrelid = 'public.ai_logs'::regclass
  ) THEN
    ALTER TABLE public.ai_logs
      ADD CONSTRAINT ai_logs_turn_type_check
      CHECK (
        turn_type IS NULL OR turn_type IN (
          'direct_response',
          'tool_query',
          'confirmation_proposed',
          'confirmation_executed',
          'scope_blocked',
          'error'
        )
      );
  END IF;
END $$;

-- 5. Audit trail / self-documentation. Corrección: estos COMMENT ON COLUMN
--    son sentencias sueltas — sin envolverlas en un bloque guardado,
--    fallarían igual que cualquier otro paso si `ai_logs` (o alguna de
--    estas columnas) no existe todavía en el entorno de destino. Se
--    ejecutan vía EXECUTE con `format(..., %L)` (que escapa el literal de
--    forma segura) dentro del mismo guard `to_regclass` que el resto de la
--    migración, para que TODOS los pasos sean no-op si la tabla falta.
DO $$
BEGIN
  IF to_regclass('public.ai_logs') IS NULL THEN
    RETURN; -- Tabla no existe todavía en este entorno: no-op seguro.
  END IF;

  EXECUTE format(
    'COMMENT ON COLUMN public.ai_logs.turn_type IS %L',
    'Fase 2.I: clasificación técnica del turno de agent-v2 (src/lib/agents-v2/stream-caller.ts). Uno de: direct_response, tool_query, confirmation_proposed, confirmation_executed, scope_blocked, error. NULL para filas que no son de type = ''agent_v2''.'
  );

  EXECUTE format(
    'COMMENT ON COLUMN public.ai_logs.cost_usd IS %L',
    'Coste ESTIMADO por el código local (calculateCost, src/lib/ai/client.ts) a partir de los precios por modelo configurados ahí mismo — nunca una factura real ni verificada de OpenAI.'
  );

  EXECUTE format(
    'COMMENT ON COLUMN public.ai_logs.input IS %L',
    'Nullable desde la Fase 2.I. Para filas type = ''agent_v2'' se deja SIEMPRE NULL — nunca se guarda el mensaje del usuario, el historial de conversación ni la respuesta de la IA.'
  );
END $$;
