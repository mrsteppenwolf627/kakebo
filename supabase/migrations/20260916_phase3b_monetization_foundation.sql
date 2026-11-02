-- MIGRATION: Fase 3.B — Infraestructura de acceso, fundadores, prueba y límite gratuito
-- DATE: 2026-09-16
-- STATUS: PREPARADA, NO APLICADA. No ejecutar contra Supabase remoto sin autorización
--         explícita del propietario del proyecto y sin haber completado las
--         precondiciones de preflight descritas en docs/planning/phase-3-monetizacion.md
--         (§3.B.4): verificación real de triggers/políticas/grants existentes sobre
--         `profiles` y `expenses` antes de aplicar las secciones marcadas
--         "PENDIENTE DE PREFLIGHT REMOTO" más abajo.
--
-- Esta migración es idempotente (usa IF NOT EXISTS / CREATE OR REPLACE / ADD COLUMN
-- IF NOT EXISTS en todo lo posible) pero eso NO la hace segura de aplicar a ciegas:
-- las sentencias REVOKE sobre profiles/expenses cambian comportamiento en producción
-- y dependen de que las precondiciones de la sección 6 se hayan verificado antes.
--
-- Referencia de diseño completa: docs/planning/phase-3-monetizacion.md §3.A, §3.B.
-- La activación real de fundadores (captura) NO está en esta migración — ver
-- supabase/manual-ops/founder_capture_activation.sql, que se ejecuta aparte, una
-- sola vez, el día real de lanzamiento de monetización.

-- =============================================================================
-- 1. `profiles` — columnas nuevas
-- =============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_founder boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS founder_captured_at timestamptz,
  ADD COLUMN IF NOT EXISTS trial_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS plus_access_until timestamptz;

COMMENT ON COLUMN public.profiles.is_founder IS
  'Fase 3.B: acceso completo y permanente. Escrito EXCLUSIVAMENTE por el procedimiento de captura en supabase/manual-ops/founder_capture_activation.sql. Ningún otro código (app, webhook, admin) debe escribir esta columna.';
COMMENT ON COLUMN public.profiles.founder_captured_at IS
  'Fase 3.B: marca temporal de cuándo el corte automático capturó esta fila. NUNCA lo rellena una concesión manual — ver docs/planning §3.B.3 bis.';
COMMENT ON COLUMN public.profiles.trial_started_at IS
  'Fase 3.B: escrito una única vez por handle_new_user en el INSERT inicial. Inmutable después — ningún flujo de checkout/cancelación/reintento de pago puede reescribirlo.';
COMMENT ON COLUMN public.profiles.plus_access_until IS
  'Fase 3.B: derecho de acceso Plus normalizado. Copia derivada de subscriptions.current_period_end, escrita EXCLUSIVAMENTE por el handler de webhook de Stripe (Fase 3.C, no implementado todavía).';
COMMENT ON COLUMN public.profiles.tier IS
  'LEGADO (pre-Fase 3). Se conserva solo como dato histórico. Tras esta migración, no concede ni condiciona ningún permiso — ver fn_resolve_access_state.';
COMMENT ON COLUMN public.profiles.manual_override IS
  'LEGADO (pre-Fase 3). Se conserva solo como dato histórico. Tras esta migración, no concede ni condiciona ningún permiso — ver fn_resolve_access_state.';

-- =============================================================================
-- 2. `founder_cutoff` — tabla singleton inmutable
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.founder_cutoff (
  id        boolean PRIMARY KEY DEFAULT true,
  cutoff_at timestamptz NOT NULL,
  set_at    timestamptz NOT NULL DEFAULT now(),
  set_by    text,
  CONSTRAINT founder_cutoff_singleton CHECK (id)
);

COMMENT ON TABLE public.founder_cutoff IS
  'Fase 3.B: corte inmutable de activación de fundadores. Como máximo una fila (id boolean PRIMARY KEY + CHECK(id) fuerza el singleton). Server-only: sin ningún grant para anon/authenticated. Ver supabase/manual-ops/founder_capture_activation.sql.';
COMMENT ON COLUMN public.founder_cutoff.set_by IS
  'Anotación manual de contexto (quién/qué ejecutó la activación). No es una referencia verificada a auth.users -- no existe sistema de administración con identidad verificable todavía. Puramente informativo, puede quedar NULL.';

ALTER TABLE public.founder_cutoff ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.founder_cutoff FROM anon, authenticated;

-- Inmutabilidad reforzada a nivel de esquema: ni siquiera service_role puede
-- actualizar o borrar la fila una vez creada.
CREATE OR REPLACE FUNCTION public.reject_founder_cutoff_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'founder_cutoff es inmutable: no se permite UPDATE ni DELETE';
END;
$$;

DROP TRIGGER IF EXISTS founder_cutoff_immutable ON public.founder_cutoff;
CREATE TRIGGER founder_cutoff_immutable
  BEFORE UPDATE OR DELETE ON public.founder_cutoff
  FOR EACH ROW EXECUTE FUNCTION public.reject_founder_cutoff_mutation();

-- =============================================================================
-- 3. `subscriptions` — modelo privado de suscripción (fuente de verdad de Stripe)
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
  PRIMARY KEY (user_id, stripe_subscription_id)
);

COMMENT ON TABLE public.subscriptions IS
  'Fase 3.B (esquema preparado, sin uso hasta Fase 3.C): fuente de verdad de la suscripción de Stripe. profiles.plus_access_until es una copia derivada de current_period_end, nunca al revés. Sin acceso directo de cliente -- ver docs/planning §3.B.8 para el futuro endpoint de resumen de solo lectura.';
COMMENT ON COLUMN public.subscriptions.status IS
  'Valor crudo devuelto por Stripe (subscriptions.retrieve), sin interpretar. Nunca se usa para gatear acceso -- eso lo decide únicamente plus_access_until.';
COMMENT ON COLUMN public.subscriptions.last_event_id IS
  'Referencia de auditoría: qué evento de webhook disparó la última comprobación de estado canónico. No se usa como criterio de orden -- ver docs/planning §3.B.1.B.';

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.subscriptions FROM anon, authenticated;

-- =============================================================================
-- 4. `expense_monthly_usage` — contador atómico del límite gratuito
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.expense_monthly_usage (
  user_id uuid NOT NULL REFERENCES auth.users(id),
  period  text NOT NULL,  -- 'YYYY-MM' en Europe/Madrid, calculado siempre en servidor
  count   integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, period)
);

COMMENT ON TABLE public.expense_monthly_usage IS
  'Fase 3.B: contador de creaciones exitosas de gasto por mes natural (Europe/Madrid) para el plan gratuito. Solo lo escribe fn_create_expense. Borrar un gasto no decrementa este contador (cuenta creaciones históricas, no gastos vivos).';

ALTER TABLE public.expense_monthly_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.expense_monthly_usage FROM anon, authenticated;
GRANT SELECT ON public.expense_monthly_usage TO authenticated;

DROP POLICY IF EXISTS "Users can view their own monthly usage" ON public.expense_monthly_usage;
CREATE POLICY "Users can view their own monthly usage"
  ON public.expense_monthly_usage
  FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================================================
-- 5. `stripe_webhook_events` — idempotencia de webhooks (preparado para Fase 3.C)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  stripe_event_id text PRIMARY KEY,
  event_type      text NOT NULL,
  processed_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.stripe_webhook_events IS
  'Fase 3.B (esquema preparado, sin uso hasta Fase 3.C): registro de eventos de Stripe ya procesados, para idempotencia por event_id. Sin acceso de cliente.';

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.stripe_webhook_events FROM anon, authenticated;

-- =============================================================================
-- 6. `handle_new_user` — trial de 30 días, is_founder=false explícito, lock advisory
-- =============================================================================
--
-- El pg_advisory_xact_lock aquí protege el RÉGIMEN POSTERIOR a la activación
-- (coordinación entre altas nuevas y una futura reconciliación que también lo
-- pida). NO es lo que garantiza la corrección de la activación en sí -- eso lo
-- hace el LOCK TABLE del procedimiento manual de activación (ver
-- supabase/manual-ops/founder_capture_activation.sql), que cubre además
-- cualquier transacción heredada que no conozca este lock advisory.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('kakebo:founder_capture'));

  INSERT INTO public.profiles (id, tier, trial_started_at, trial_ends_at, is_founder)
  VALUES (
    new.id,
    'free',
    now(),
    now() + interval '30 days',
    false
  );

  RETURN new;
END;
$$;

-- No hace falta recrear el trigger on_auth_user_created: sigue apuntando a esta
-- función por nombre, CREATE OR REPLACE FUNCTION ya actualiza su comportamiento.

-- =============================================================================
-- 7. `fn_resolve_access_state` — réplica SQL del resolvedor de src/lib/auth/access-state.ts
-- =============================================================================
--
-- ADVERTENCIA DE DISEÑO: esta función debe mantenerse en sincronía manual con
-- resolveAccessState() en src/lib/auth/access-state.ts. Son dos implementaciones
-- independientes (Postgres no puede ejecutar TypeScript) del mismo contrato
-- aprobado en docs/planning/phase-3-monetizacion.md §3.A. Cualquier cambio de
-- reglas debe aplicarse en ambos sitios.
--
-- A diferencia de la versión TypeScript, esta función colapsa plus_active y
-- plus_canceled_pending en un único resultado 'plus_active' (la matriz de
-- permisos es idéntica para ambos; la distinción es solo informativa para UI
-- y se resuelve en la capa de aplicación leyendo subscriptions.cancel_at_period_end).

CREATE OR REPLACE FUNCTION public.fn_resolve_access_state(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_profile public.profiles;
  v_period  text;
  v_count   integer;
BEGIN
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfil no encontrado' USING ERRCODE = 'KB002';
  END IF;

  IF v_profile.is_founder THEN
    RETURN 'founder';
  END IF;

  IF v_profile.plus_access_until IS NOT NULL AND now() < v_profile.plus_access_until THEN
    RETURN 'plus_active';
  END IF;

  IF v_profile.trial_ends_at IS NOT NULL AND now() < v_profile.trial_ends_at THEN
    RETURN 'trialing';
  END IF;

  v_period := to_char(now() AT TIME ZONE 'Europe/Madrid', 'YYYY-MM');

  SELECT count INTO v_count
  FROM public.expense_monthly_usage
  WHERE user_id = p_user_id AND period = v_period;

  IF v_count IS NULL OR v_count < 30 THEN
    RETURN 'free_under_limit';
  ELSE
    RETURN 'free_readonly';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.fn_resolve_access_state(uuid) FROM PUBLIC;
-- Sin GRANT a authenticated: solo se invoca internamente desde fn_create_expense
-- (SECURITY DEFINER, se ejecuta con los privilegios del propietario de la función,
-- no con los del rol que la llama -- ver docs/planning §3.B.2).

-- =============================================================================
-- 8. `fn_create_expense` — única vía de creación de gastos
-- =============================================================================

CREATE OR REPLACE FUNCTION public.fn_create_expense(
  p_month_id uuid,
  p_date     date,
  p_amount   numeric,
  p_category text,
  p_note     text DEFAULT NULL,
  p_color    text DEFAULT NULL
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
  v_access_state text;
  v_period       text;
  v_new_count    integer;
  v_row          public.expenses;
BEGIN
  -- Identidad: SIEMPRE de la sesión autenticada, nunca de un parámetro de cliente.
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado' USING ERRCODE = 'KB002';
  END IF;

  -- Validación mínima de integridad (equivalente a createExpenseSchema en Zod).
  IF p_amount IS NULL OR p_amount < 0 THEN
    RAISE EXCEPTION 'Importe inválido' USING ERRCODE = 'KB002';
  END IF;
  IF p_category IS NULL OR length(trim(p_category)) = 0 THEN
    RAISE EXCEPTION 'Categoría inválida' USING ERRCODE = 'KB002';
  END IF;
  IF p_date IS NULL THEN
    RAISE EXCEPTION 'Fecha inválida' USING ERRCODE = 'KB002';
  END IF;

  -- Validación de propiedad y estado del mes (defensa en profundidad -- ya se
  -- comprueba también en TypeScript antes de llamar a esta función; esto cubre
  -- cualquier llamada directa a la RPC que se salte esa capa).
  IF p_month_id IS NOT NULL THEN
    SELECT status, user_id INTO v_month_status, v_month_owner
    FROM public.months
    WHERE id = p_month_id
    FOR UPDATE;

    -- Mensaje neutro: no distingue "no existe" de "es de otro usuario", para no
    -- permitir enumerar IDs ajenos observando diferencias en la respuesta.
    IF NOT FOUND OR v_month_owner <> v_user_id THEN
      RAISE EXCEPTION 'Mes no válido' USING ERRCODE = 'KB002';
    END IF;

    IF v_month_status = 'closed' THEN
      RAISE EXCEPTION 'El mes está cerrado' USING ERRCODE = 'KB002';
    END IF;
  END IF;

  -- Contador: solo aplica a free_under_limit. founder/plus/trial ni lo leen.
  v_access_state := public.fn_resolve_access_state(v_user_id);

  IF v_access_state = 'free_readonly' THEN
    RAISE EXCEPTION 'Límite mensual de gastos alcanzado' USING ERRCODE = 'KB001';
  END IF;

  IF v_access_state = 'free_under_limit' THEN
    v_period := to_char(now() AT TIME ZONE 'Europe/Madrid', 'YYYY-MM');

    INSERT INTO public.expense_monthly_usage (user_id, period, count)
    VALUES (v_user_id, v_period, 1)
    ON CONFLICT (user_id, period) DO UPDATE
      SET count = public.expense_monthly_usage.count + 1
      WHERE public.expense_monthly_usage.count < 30
    RETURNING count INTO v_new_count;

    -- ON CONFLICT DO UPDATE ... WHERE que no cumple la condición no actualiza
    -- la fila ni dispara el RETURNING -- v_new_count queda NULL, lo detectamos:
    IF v_new_count IS NULL THEN
      RAISE EXCEPTION 'Límite mensual de gastos alcanzado' USING ERRCODE = 'KB001';
    END IF;
  END IF;

  -- Inserción del gasto, en la misma transacción que el incremento del contador
  -- (si esta inserción falla, la excepción deshace también el incremento).
  INSERT INTO public.expenses (user_id, month_id, date, amount, category, note, color)
  VALUES (v_user_id, p_month_id, p_date, p_amount, p_category, p_note, p_color)
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

-- Cierre del permiso de ejecución: anon nunca debe poder ni intentar invocarla,
-- aunque la comprobación interna de auth.uid() fallara alguna vez.
REVOKE EXECUTE ON FUNCTION public.fn_create_expense(uuid, date, numeric, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_create_expense(uuid, date, numeric, text, text, text) TO authenticated;

-- =============================================================================
-- 9. Cierre del INSERT directo en `expenses` — ⚠️ PENDIENTE DE PREFLIGHT REMOTO
-- =============================================================================
--
-- NO aplicar esta sección sin antes verificar, contra el proyecto real:
--   (a) que el grant INSERT de `authenticated`/`anon` sobre expenses existe
--       realmente hoy tal como sugiere supabase/migrations/20260217_security_audit.sql
--       (que lo concedió explícitamente) -- confirmarlo con una lectura puntual
--       autorizada, no asumirlo solo por ese archivo;
--   (b) que ningún trigger BEFORE/AFTER INSERT sobre expenses depende de que
--       `authenticated` tenga ese grant directo;
--   (c) que las tres rutas de creación de gastos (manual, asistente legado,
--       agent-v2/streaming) ya están migradas a fn_create_expense en el código
--       desplegado -- si esta REVOKE se aplica antes de desplegar ese código,
--       la creación de gastos se rompe por completo para todos los usuarios.
--
-- Ver docs/planning/phase-3-monetizacion.md §3.B.4 (precondición 4) y §3.B.2.

REVOKE INSERT ON public.expenses FROM authenticated, anon;

-- =============================================================================
-- 10. Cierre de permisos de `profiles` — ⚠️ PENDIENTE DE PREFLIGHT REMOTO
-- =============================================================================
--
-- NO aplicar esta sección sin antes verificar, contra el proyecto real:
--   (a) que no existe ningún trigger BEFORE/AFTER UPDATE sobre profiles que
--       dependa de que authenticated pueda escribir directamente;
--   (b) el listado completo de pg_policies sobre profiles, sin el filtro usado
--       en la auditoría original (para no pasar por alto una política RESTRICTIVE);
--   (c) los column_privileges reales en el momento de aplicar (podrían haber
--       cambiado desde la auditoría de referencia).
--
-- profiles no tiene hoy ninguna columna pensada para edición de usuario -- las
-- preferencias reales viven en user_settings, tabla aparte con su propio
-- PATCH /api/settings. Por eso esta REVOKE no debería romper ningún flujo
-- legítimo, pero exige la verificación anterior antes de aplicarse.
--
-- Ver docs/planning/phase-3-monetizacion.md §3.B.4.

REVOKE UPDATE ON public.profiles FROM authenticated, anon;

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
