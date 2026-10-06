-- MIGRATION: Fase 3.B — Infraestructura de monetización (MODO COMPATIBLE)
-- DATE: 2026-09-16 (reconstruida en modo compatible el 2026-10-06)
-- STATUS: PREPARADA, NO APLICADA. No ejecutar contra Supabase remoto sin autorización
--         explícita del propietario del proyecto. Ver docs/planning/phase3b-migration-runbook.md.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- MODO COMPATIBLE: esta migración NO cambia el comportamiento actual de Kakebo.
-- ═══════════════════════════════════════════════════════════════════════════
--   * NO impone ningún límite de gastos (ni 30 ni ninguno). No existe KB001 aquí.
--   * NO toca `handle_new_user`: el periodo de prueba de 14 días y el resto del
--     alta de usuarios quedan exactamente como están hoy.
--   * NO convierte a nadie en free limitado, fundador ni Pro; NO concede ni
--     retira acceso; NO modifica `tier`, `manual_override`, `trial_ends_at` ni
--     suscripciones existentes (solo AÑADE columnas nuevas con valores neutros).
--   * NO bloquea IA ni informes PDF (esos permisos no dependen de esta migración).
--   * NO activa Stripe, fundadores ni `access_grants` comerciales.
--   * NO contiene `REVOKE`/`DROP POLICY` sobre `profiles`/`expenses`: el cierre
--     del INSERT directo vive en supabase/deferred/freemium/05_* y el
--     endurecimiento opcional en supabase/manual-ops/phase3b_permission_hardening.sql.
--
-- Lo único que añade:
--   1. Columnas nuevas (inertes) en `profiles`.
--   2. Tablas de infraestructura sin uso comercial todavía (`founder_cutoff`,
--      `subscriptions`, `expense_monthly_usage`, `stripe_webhook_events`).
--   3. `fn_create_expense`: la única vía de creación de gastos que usa el código
--      actual (POST /api/expenses, asistente legado y agent-v2). En modo
--      compatible solo valida, inserta y cuenta; NUNCA rechaza por cantidad.
--   4. `fn_recompute_plus_access_until`: preparada para Stripe (sin uso aún).
--
-- El modelo freemium (límite de 30 gastos/mes, trial/legacy access, cierre del
-- INSERT directo) está SEPARADO en supabase/deferred/freemium/ y NO se aplica
-- como migración. El hardening de `profiles` va en 20260917_phase3b_profiles_hardening.sql.
--
-- Idempotente: IF NOT EXISTS / CREATE OR REPLACE / ADD COLUMN IF NOT EXISTS.
--
-- Compatibilidad con "ciclos libres" (Fase 1, ver src/lib/months.ts):
-- `expenses.month_id` referencia un CICLO que puede no coincidir con el mes natural
-- de `expenses.date`. fn_create_expense no resuelve el ciclo (lo hacen las rutas
-- TypeScript antes de llamarla); solo revalida, como defensa en profundidad, que
-- el month_id recibido existe, pertenece al usuario y no está cerrado.

-- =============================================================================
-- 1. `profiles` — columnas nuevas (inertes: ningún valor concede ni retira acceso)
-- =============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_founder boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS founder_captured_at timestamptz,
  ADD COLUMN IF NOT EXISTS trial_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS plus_access_until timestamptz;

COMMENT ON COLUMN public.profiles.is_founder IS
  'Fase 3.B (inerte en modo compatible): siempre false hasta el procedimiento manual supabase/manual-ops/founder_capture_activation.sql. Protegida contra escritura de usuarios por 20260917_phase3b_profiles_hardening.sql.';
COMMENT ON COLUMN public.profiles.founder_captured_at IS
  'Fase 3.B (inerte en modo compatible): NULL hasta una captura de fundadores explícita.';
COMMENT ON COLUMN public.profiles.trial_started_at IS
  'Fase 3.B (inerte en modo compatible): NULL para usuarios existentes y nuevos mientras handle_new_user no se sustituya (supabase/deferred/freemium/01).';
COMMENT ON COLUMN public.profiles.plus_access_until IS
  'Fase 3.B: derecho de acceso Plus derivado de subscriptions. Solo lo escribe fn_recompute_plus_access_until (Fase 3.C, sin uso todavía).';

-- =============================================================================
-- 2. `founder_cutoff` — tabla singleton inmutable (sin uso hasta la activación)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.founder_cutoff (
  id        boolean PRIMARY KEY DEFAULT true,
  cutoff_at timestamptz NOT NULL,
  set_at    timestamptz NOT NULL DEFAULT now(),
  set_by    text,
  CONSTRAINT founder_cutoff_singleton CHECK (id)
);

COMMENT ON TABLE public.founder_cutoff IS
  'Fase 3.B: corte inmutable de activación de fundadores. Como máximo una fila. Server-only: sin ningún grant para anon/authenticated. Vacía en modo compatible.';

ALTER TABLE public.founder_cutoff ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.founder_cutoff FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.reject_founder_cutoff_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  RAISE EXCEPTION 'founder_cutoff es inmutable: no se permite UPDATE ni DELETE';
END;
$$;

DROP TRIGGER IF EXISTS founder_cutoff_immutable ON public.founder_cutoff;
CREATE TRIGGER founder_cutoff_immutable
  BEFORE UPDATE OR DELETE ON public.founder_cutoff
  FOR EACH ROW EXECUTE FUNCTION public.reject_founder_cutoff_mutation();

REVOKE ALL ON FUNCTION public.reject_founder_cutoff_mutation() FROM PUBLIC, anon, authenticated;

-- =============================================================================
-- 3. `subscriptions` — modelo privado de suscripción (preparado para Stripe 3.C)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  user_id                 uuid NOT NULL REFERENCES auth.users(id),
  stripe_customer_id      text NOT NULL,
  stripe_subscription_id  text NOT NULL,
  status                  text NOT NULL,        -- valor crudo de Stripe, sin interpretar
  plan_interval           text NOT NULL,        -- 'monthly' | 'annual'
  current_period_end      timestamptz NOT NULL,
  cancel_at_period_end    boolean NOT NULL DEFAULT false,
  last_event_id           text,                 -- último Event.id de Stripe aplicado (auditoría)
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, stripe_subscription_id),
  -- Un stripe_subscription_id es único en todo Stripe: nunca puede pertenecer a
  -- dos usuarios distintos. La PK compuesta no lo garantiza sola; este UNIQUE sí.
  CONSTRAINT subscriptions_stripe_subscription_id_key UNIQUE (stripe_subscription_id)
);

-- Índice que usa fn_recompute_plus_access_until() para agregar por user_id.
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions (user_id);

COMMENT ON TABLE public.subscriptions IS
  'Fase 3.B (esquema preparado, sin uso hasta Fase 3.C): fuente de verdad de las suscripciones de Stripe. Vacía en modo compatible. profiles.plus_access_until NUNCA se copia de una sola fila: ver fn_recompute_plus_access_until().';
COMMENT ON COLUMN public.subscriptions.status IS
  'Valor crudo devuelto por Stripe, sin interpretar. Nunca se usa para gatear acceso.';
COMMENT ON COLUMN public.subscriptions.last_event_id IS
  'Referencia de auditoría del último evento de webhook aplicado. No se usa como criterio de orden.';

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.subscriptions FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- fn_recompute_plus_access_until: recalcula el acceso agregando TODAS las
-- suscripciones locales del usuario (nunca copiando una sola fila).
-- Flujo previsto para 3.C: validar firma del webhook -> registrar event_id en
-- stripe_webhook_events -> serializar por stripe_subscription_id Y por user_id
-- (pg_advisory_xact_lock) -> stripe.subscriptions.retrieve() -> UPSERT en
-- subscriptions -> llamar a esta función -> COMMIT. Qué estados de Stripe cuentan
-- como "con derecho de acceso" es decisión explícita de 3.C.
-- SIN USO en modo compatible: solo service_role podría llamarla (ver privilegios).
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.fn_recompute_plus_access_until(p_user_id uuid)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_new_until timestamptz;
BEGIN
  SELECT max(current_period_end) INTO v_new_until
  FROM public.subscriptions
  WHERE user_id = p_user_id
    AND current_period_end > now();

  UPDATE public.profiles
  SET plus_access_until = v_new_until
  WHERE id = p_user_id;

  RETURN v_new_until;
END;
$$;

-- Privilegios explícitos: en Supabase las funciones nuevas de `public` reciben
-- EXECUTE para anon/authenticated por privilegios por defecto; REVOKE ... FROM
-- PUBLIC no los quita. Hay que revocarlos por nombre.
REVOKE ALL ON FUNCTION public.fn_recompute_plus_access_until(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_recompute_plus_access_until(uuid) TO service_role;

-- =============================================================================
-- 4. `expense_monthly_usage` — contador de creaciones de gasto (solo métrica)
-- =============================================================================
-- En modo compatible el contador SOLO se incrementa (nunca bloquea nada). Queda
-- preparado para el límite freemium diferido (supabase/deferred/freemium/).
-- Borrar un gasto NO decrementa este contador.

CREATE TABLE IF NOT EXISTS public.expense_monthly_usage (
  user_id uuid NOT NULL REFERENCES auth.users(id),
  period  text NOT NULL,  -- 'YYYY-MM' en Europe/Madrid, calculado siempre en servidor
  count   integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, period)
);

COMMENT ON TABLE public.expense_monthly_usage IS
  'Fase 3.B: contador de creaciones de gasto por mes natural (Europe/Madrid). En modo compatible es una MÉTRICA: no limita nada. Solo lo escribe fn_create_expense.';

ALTER TABLE public.expense_monthly_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.expense_monthly_usage FROM anon, authenticated;
GRANT SELECT ON public.expense_monthly_usage TO authenticated;

DROP POLICY IF EXISTS "Users can view their own monthly usage" ON public.expense_monthly_usage;
CREATE POLICY "Users can view their own monthly usage"
  ON public.expense_monthly_usage
  FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================================================
-- 5. `stripe_webhook_events` — idempotencia de webhooks (preparado para 3.C)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  stripe_event_id text PRIMARY KEY,
  event_type      text NOT NULL,
  processed_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.stripe_webhook_events IS
  'Fase 3.B (esquema preparado, sin uso hasta Fase 3.C): eventos de Stripe ya procesados. Sin acceso de cliente. Vacía en modo compatible.';

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.stripe_webhook_events FROM anon, authenticated;

-- =============================================================================
-- 6. `handle_new_user` — NO SE TOCA en modo compatible
-- =============================================================================
-- El alta de usuarios (incluido el periodo de prueba de 14 días) permanece
-- exactamente como está en producción. La versión freemium vive en
-- supabase/deferred/freemium/01_access_foundation.sql y no se aplica aquí.
-- (No se crea fn_resolve_access_state en modo compatible: nada la necesita.)

-- =============================================================================
-- 7. `fn_create_expense` — única vía de creación de gastos (SIN límite comercial)
-- =============================================================================
-- Conserva TODAS las validaciones técnicas y los códigos de error existentes:
--   KB002 = validación/propiedad fallida (mensaje neutro, no filtra existencia).
-- KB001 (límite mensual) NO se produce nunca en modo compatible.
-- Operación transaccional: si el INSERT falla, también se deshace el contador.
-- SECURITY DEFINER con search_path fijo; la identidad sale SIEMPRE de auth.uid().

CREATE OR REPLACE FUNCTION public.fn_create_expense(
  p_month_id    uuid,
  p_date        date,
  p_amount      numeric,
  p_category    text,
  p_note        text DEFAULT NULL,
  p_color       text DEFAULT NULL,
  p_subcategory text DEFAULT NULL
)
RETURNS public.expenses
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id      uuid;
  v_month_status text;
  v_month_owner  uuid;
  v_period       text;
  v_row          public.expenses;
BEGIN
  -- Identidad: SIEMPRE de la sesión autenticada, nunca de un parámetro de cliente.
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado' USING ERRCODE = 'KB002';
  END IF;

  -- Importe válido: no nulo, no NaN, no infinito, no negativo.
  IF p_amount IS NULL
     OR p_amount = 'NaN'::numeric
     OR p_amount = 'Infinity'::numeric
     OR p_amount = '-Infinity'::numeric
     OR p_amount < 0 THEN
    RAISE EXCEPTION 'Importe inválido' USING ERRCODE = 'KB002';
  END IF;
  IF p_category IS NULL OR length(trim(p_category)) = 0 THEN
    RAISE EXCEPTION 'Categoría inválida' USING ERRCODE = 'KB002';
  END IF;
  IF p_date IS NULL THEN
    RAISE EXCEPTION 'Fecha inválida' USING ERRCODE = 'KB002';
  END IF;

  -- month_id OBLIGATORIO, del usuario y con el ciclo abierto.
  IF p_month_id IS NULL THEN
    RAISE EXCEPTION 'Ciclo no válido' USING ERRCODE = 'KB002';
  END IF;

  SELECT status, user_id INTO v_month_status, v_month_owner
  FROM public.months
  WHERE id = p_month_id
  FOR UPDATE;

  -- Mensaje neutro: no distingue "no existe" de "es de otro usuario".
  IF NOT FOUND OR v_month_owner <> v_user_id THEN
    RAISE EXCEPTION 'Ciclo no válido' USING ERRCODE = 'KB002';
  END IF;

  IF v_month_status = 'closed' THEN
    RAISE EXCEPTION 'El ciclo está cerrado' USING ERRCODE = 'KB002';
  END IF;

  -- Contador (solo métrica). NUNCA rechaza: no hay WHERE ni límite.
  v_period := to_char(now() AT TIME ZONE 'Europe/Madrid', 'YYYY-MM');

  INSERT INTO public.expense_monthly_usage (user_id, period, count)
  VALUES (v_user_id, v_period, 1)
  ON CONFLICT (user_id, period) DO UPDATE
    SET count = public.expense_monthly_usage.count + 1;

  -- Inserción en la misma transacción que el contador.
  INSERT INTO public.expenses (user_id, month_id, date, amount, category, note, color, subcategory)
  VALUES (v_user_id, p_month_id, p_date, p_amount, p_category, p_note, p_color, p_subcategory)
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

COMMENT ON FUNCTION public.fn_create_expense(uuid, date, numeric, text, text, text, text) IS
  'MODE: compat — crea gastos sin límite comercial (nunca rechaza por cantidad). Sustituida solo por supabase/deferred/freemium/03_enforce_expense_limit.sql en la futura activación freemium.';

-- Solo usuarios autenticados la ejecutan; anon nunca (revocado por nombre).
REVOKE ALL ON FUNCTION public.fn_create_expense(uuid, date, numeric, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_create_expense(uuid, date, numeric, text, text, text, text) TO authenticated;

-- =============================================================================
-- 8. Endurecimiento de permisos de `expenses`/`profiles` — NO EN ESTA MIGRACIÓN
-- =============================================================================
-- El INSERT directo en `expenses` y el UPDATE directo en `profiles` SIGUEN
-- PERMITIDOS tal como están hoy. Referencias:
--   - supabase/migrations/20260917_phase3b_profiles_hardening.sql: trigger que impide
--     que usuarios normales modifiquen campos de acceso (no quita permisos de tabla).
--   - supabase/deferred/freemium/05_close_direct_expense_insert.sql: cierre del INSERT
--     directo, solo en la futura activación freemium.
--   - supabase/manual-ops/phase3b_permission_hardening.sql: preflight + sentencias
--     comentadas, ejecución manual explícita.
