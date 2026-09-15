-- MIGRATION: AI pending write-confirmation actions (Fase 2.E — corrección)
-- DATE: 2026-09-14
-- DESCRIPTION:
-- Confirmación de escrituras de IA de un solo uso, validada en servidor.
--
-- Reemplaza el diseño anterior (donde el navegador reenviaba la acción
-- completa a ejecutar) por un identificador opaco: cuando la IA propone una
-- escritura (createTransaction, updateTransaction, setBudget,
-- calculateWhatIf), el servidor persiste la acción exacta aquí y solo
-- envía al cliente el `id` de esta fila + un mensaje humano. Confirmar
-- requiere reenviar ÚNICAMENTE ese `id`; el servidor recupera y CONSUME la
-- fila de forma atómica (una única UPDATE ... WHERE status = 'pending' ...
-- RETURNING) antes de ejecutar nada, así que una repetición de red, un
-- doble clic o un reenvío manual del mismo id nunca puede ejecutar la
-- escritura dos veces.
--
-- - `gen_random_uuid()` ya se usa sin declarar ninguna extensión en
--   src/migrations/001_merchant_rules.sql (tabla merchant_rules, aplicada
--   previamente), lo que confirma que esta función ya está disponible en
--   el proyecto de Supabase de destino (pgcrypto/builtin, según versión de
--   Postgres). Esta migración reutiliza el mismo mecanismo sin asumir nada
--   nuevo ni intentar crear la extensión.
--
-- - TABLA EXCLUSIVAMENTE DE SERVIDOR (corrección de seguridad posterior):
--   RLS está ACTIVADO pero deliberadamente NO se define ninguna política
--   para los roles `anon` ni `authenticated`. Con RLS activado y cero
--   políticas, Postgres deniega TODO acceso a esos roles por defecto — ni
--   siquiera pueden ver que la tabla existe. La única vía de acceso es el
--   cliente ADMINISTRADOR (service role, ver src/lib/supabase/admin.ts,
--   createAdminClient()), que Supabase deja pasar por delante de RLS, y
--   que solo se usa desde rutas de servidor (src/lib/agents-v2/
--   pending-actions.ts: createPendingAction/consumePendingAction/
--   cancelPendingAction). El cliente basado en cookies/sesión de usuario
--   (src/lib/supabase/server.ts) NUNCA debe usarse para leer, crear,
--   actualizar ni cancelar filas de esta tabla — con la política anterior
--   (auth.uid() = user_id) un usuario autenticado podía consultar la tabla
--   directamente vía Supabase y ver `tool_call`/`arguments` de su propia
--   acción pendiente, o incluso modificarla antes de confirmarla, lo cual
--   contradice el objetivo de que el cliente solo reciba un identificador
--   opaco y nunca pueda alterar la acción. El aislamiento por usuario
--   (`user_id = ...`) se sigue aplicando explícitamente en cada consulta
--   dentro de pending-actions.ts, ya que el cliente admin ignora RLS por
--   completo.
--
-- - `status` solo avanza hacia adelante: pending -> confirmed | cancelled.
--   `expired` se usa exclusivamente como resultado calculado al leer
--   (expires_at < now()), no requiere un job en background para esta fase.
--
-- SAFETY: this migration has NOT been run against any Supabase project by
-- the assistant. Idempotent: safe to run more than once (IF NOT EXISTS /
-- guarded DO blocks throughout). Run it in the Supabase SQL Editor (or via
-- the Supabase CLI) of the target project when the owner decides to close
-- Fase 2.

-- 1. Tabla principal.
CREATE TABLE IF NOT EXISTS public.ai_pending_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Propietario. ON DELETE CASCADE: si se borra el usuario, no quedan
  -- confirmaciones pendientes huérfanas. Filtrado explícitamente en cada
  -- consulta de pending-actions.ts (ver nota de seguridad arriba: RLS no
  -- puede hacer este trabajo aquí, porque el único cliente que accede a
  -- esta tabla es el administrador, que la ignora).
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Acción exacta a ejecutar si se confirma (nunca se reconstruye a partir
  -- de nada enviado por el cliente en el momento de confirmar).
  tool_call JSONB NOT NULL,       -- { id, type: "function", function: { name, arguments } }
  tool_name TEXT NOT NULL,
  arguments JSONB NOT NULL,
  description TEXT NOT NULL,      -- Mensaje humano ya mostrado en el popup (sin IDs internos)

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'cancelled')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,   -- Fijada por la aplicación al crear (p. ej. NOW() + 10 min)
  consumed_at TIMESTAMPTZ            -- NULL mientras status = 'pending'
);

-- 2. Índices mínimos para las consultas reales de esta feature:
--    - lookup exacto por id (ya cubierto por la PK);
--    - "todas las pendientes de este usuario" (limpieza / listados futuros);
--    - filtro por estado (para expirar/purgar);
--    - filtro por caducidad (para expirar/purgar).
CREATE INDEX IF NOT EXISTS idx_ai_pending_actions_user
  ON public.ai_pending_actions (user_id);

CREATE INDEX IF NOT EXISTS idx_ai_pending_actions_status
  ON public.ai_pending_actions (status);

CREATE INDEX IF NOT EXISTS idx_ai_pending_actions_expires_at
  ON public.ai_pending_actions (expires_at);

-- Índice compuesto para el camino caliente real: "consume la fila pendiente
-- de ESTE usuario con ESTE id" (la propia UPDATE atómica de confirmación).
CREATE INDEX IF NOT EXISTS idx_ai_pending_actions_user_status
  ON public.ai_pending_actions (user_id, status);

-- 3. RLS: tabla EXCLUSIVA de servidor. Se activa RLS pero, a propósito, NO
--    se crea ninguna política para `anon` ni `authenticated` — sin
--    políticas, esos roles no pueden hacer SELECT/INSERT/UPDATE/DELETE en
--    absoluto. Solo el cliente administrador (service role, que Postgres
--    dispensa de RLS) puede acceder, y únicamente desde
--    src/lib/agents-v2/pending-actions.ts en rutas de servidor. Si en el
--    futuro hace falta exponer algo de esta tabla al navegador, debe
--    añadirse una política nueva de forma explícita y deliberada — nunca
--    por omisión.
ALTER TABLE public.ai_pending_actions ENABLE ROW LEVEL SECURITY;

-- No se define ninguna política DELETE tampoco: no hace falta borrar filas
-- para esta fase (son de vida corta e informativas); limpiar filas
-- antiguas queda fuera de alcance y, si se añade, será vía el cliente
-- administrador (p. ej. un cron de servidor), nunca vía una política RLS
-- para usuarios.

-- 4. Audit trail / self-documentation.
COMMENT ON TABLE public.ai_pending_actions IS
  'Fase 2.E: confirmaciones de escritura de IA pendientes, de un solo uso. Creada al proponer una escritura (createTransaction/updateTransaction/setBudget/calculateWhatIf); consumida atómicamente al confirmar (pending -> confirmed) o invalidada al cancelar (pending -> cancelled). El id de esta fila es el único dato que el cliente reenvía para confirmar — nunca la acción completa. TABLA EXCLUSIVA DE SERVIDOR: RLS activado sin políticas para anon/authenticated; solo accesible mediante el cliente administrador (createAdminClient(), src/lib/supabase/admin.ts) desde src/lib/agents-v2/pending-actions.ts. El navegador nunca lee, crea, actualiza ni cancela filas directamente — solo a través de los endpoints ya autenticados.';

COMMENT ON COLUMN public.ai_pending_actions.tool_call IS
  'OpenAIToolCall exacto a ejecutar si se confirma: { id, type: "function", function: { name, arguments } }. Fuente de verdad para la ejecución — nunca se acepta un tool_call alternativo enviado por el cliente al confirmar. No accesible al navegador (ver RLS de la tabla).';

COMMENT ON COLUMN public.ai_pending_actions.status IS
  'pending: recién creada, ejecutable si se confirma antes de expires_at. confirmed: ya consumida y ejecutada (no puede volver a ejecutarse). cancelled: invalidada por el usuario (no puede ejecutarse). No existe un valor "expired" persistido: la caducidad se calcula en cada lectura comparando expires_at con NOW().';

COMMENT ON COLUMN public.ai_pending_actions.expires_at IS
  'Fase 2.E: caducidad razonable fijada por la aplicación al crear la fila (ver src/lib/agents-v2/pending-actions.ts). Una confirmación recibida después de expires_at falla sin ejecutar nada, aunque status siga siendo "pending".';
