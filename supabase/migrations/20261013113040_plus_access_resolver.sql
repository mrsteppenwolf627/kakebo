-- MIGRATION 4/5 — Plus subscriptions foundation: resolver de acceso SQL v2 + fn_my_access()
-- DATE: 2026-10-13
-- ENVIRONMENT: probada en STAGING (gqnsanzsdnbufwicjtiw). NO aplicar en producción sin autorización explícita.
--
-- INERTE: ninguna ruta de la aplicación llama todavía a estas funciones y `fn_create_expense` NO se modifica
-- (el límite de 30 gastos, el backfill de uso, `legacy_full` y el cierre del INSERT directo son pasos de activación posteriores).
--
-- Prioridad del resolver (la primera que se cumple):
--   founder > legacy_full > plus_active > plus_canceled_pending > free_under_limit > free_readonly
--
-- Derecho de acceso Plus (fn_subscription_entitlement), evaluado SIEMPRE sobre `subscriptions` (nunca por la mera existencia
-- de una fila; el estado se valida):
--   * status 'active' | 'trialing' y now() < current_period_end  -> acceso hasta current_period_end
--       (si cancel_at_period_end -> plus_canceled_pending, acceso hasta fin de periodo)
--   * status 'past_due' -> 3 días de gracia contados desde current_period_start (Stripe adelanta el periodo al emitir la
--       factura de renovación, así que contar desde current_period_end concedería un mes completo por un impago),
--       con tope en current_period_end
--   * cualquier otro estado (incomplete, incomplete_expired, canceled, unpaid, paused, desconocido) -> sin acceso
--   Nunca se revoca por un error de webhook: el acceso solo caduca por tiempo o por un estado verificado en Stripe.
--
-- Sin trial: las cuentas nuevas empiezan en la capa gratuita y `profiles.trial_ends_at` NO se lee para decidir acceso
-- (columna legada). El contador gratuito (expense_monthly_usage, mes natural Europe/Madrid) solo se evalúa en los
-- estados free_*.
--
-- Rollback: supabase/rollback/plus/20261013113040_plus_access_resolver.rollback.sql

-- ---------------------------------------------------------------------------
-- 1. Derecho de acceso por suscripción
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_subscription_entitlement(p_user_id uuid, p_now timestamptz DEFAULT now())
RETURNS TABLE (access_until timestamptz, cancel_pending boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT s.access_until, s.cancel_pending
  FROM (
    SELECT
      CASE
        WHEN sub.status IN ('active', 'trialing') THEN sub.current_period_end
        WHEN sub.status = 'past_due' THEN LEAST(
          sub.current_period_end,
          COALESCE(sub.current_period_start, sub.updated_at) + interval '3 days'
        )
        ELSE NULL
      END AS access_until,
      CASE WHEN sub.status IN ('active', 'trialing') THEN sub.cancel_at_period_end ELSE false END AS cancel_pending
    FROM public.subscriptions sub
    WHERE sub.user_id = p_user_id
  ) s
  WHERE s.access_until IS NOT NULL
    AND p_now < s.access_until
  ORDER BY s.access_until DESC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.fn_subscription_entitlement(uuid, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_subscription_entitlement(uuid, timestamptz) TO service_role;

-- ---------------------------------------------------------------------------
-- 2. profiles.plus_access_until: valor derivado (conveniencia/compatibilidad); nunca concede acceso por sí solo
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
  SELECT e.access_until INTO v_new_until
  FROM public.fn_subscription_entitlement(p_user_id, now()) e;

  UPDATE public.profiles
  SET plus_access_until = v_new_until
  WHERE id = p_user_id;

  RETURN v_new_until;
END;
$$;

COMMENT ON FUNCTION public.fn_recompute_plus_access_until(uuid) IS
  'Plus foundation v2: recalcula profiles.plus_access_until a partir de fn_subscription_entitlement (estado validado + gracia de 3 días), no del mayor current_period_end de cualquier fila.';

-- ---------------------------------------------------------------------------
-- 3. Resolver de acceso v2
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_resolve_access_state(p_user_id uuid, p_now timestamptz DEFAULT now())
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_profile public.profiles;
  v_ent     record;
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

  IF EXISTS (
    SELECT 1 FROM public.access_grants g
    WHERE g.user_id = p_user_id AND g.grant_type = 'legacy_full' AND g.revoked_at IS NULL
  ) THEN
    RETURN 'legacy_full';
  END IF;

  SELECT * INTO v_ent FROM public.fn_subscription_entitlement(p_user_id, p_now);
  IF FOUND THEN
    RETURN CASE WHEN v_ent.cancel_pending THEN 'plus_canceled_pending' ELSE 'plus_active' END;
  END IF;

  v_period := to_char(p_now AT TIME ZONE 'Europe/Madrid', 'YYYY-MM');

  SELECT u.count INTO v_count
  FROM public.expense_monthly_usage u
  WHERE u.user_id = p_user_id AND u.period = v_period;

  IF v_count IS NULL OR v_count < 30 THEN
    RETURN 'free_under_limit';
  END IF;

  RETURN 'free_readonly';
END;
$$;

COMMENT ON FUNCTION public.fn_resolve_access_state(uuid, timestamptz) IS
  'Plus foundation v2: founder > legacy_full > plus_active > plus_canceled_pending > free_under_limit > free_readonly. Solo service_role; el cliente usa fn_my_access().';

REVOKE ALL ON FUNCTION public.fn_resolve_access_state(uuid, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_resolve_access_state(uuid, timestamptz) TO service_role;

-- ---------------------------------------------------------------------------
-- 4. fn_my_access(): estado del PROPIO usuario autenticado (sin parámetros: nunca acepta un user_id)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_my_access()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid      uuid := auth.uid();
  v_now      timestamptz := now();
  v_state    text;
  v_ent      record;
  v_period   text;
  v_used     integer;
  v_premium  boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'No autenticado' USING ERRCODE = 'KB002';
  END IF;

  v_state := public.fn_resolve_access_state(v_uid, v_now);
  SELECT * INTO v_ent FROM public.fn_subscription_entitlement(v_uid, v_now);

  v_premium := v_state IN ('founder', 'legacy_full', 'plus_active', 'plus_canceled_pending');

  v_used := NULL;
  IF v_state IN ('free_under_limit', 'free_readonly') THEN
    v_period := to_char(v_now AT TIME ZONE 'Europe/Madrid', 'YYYY-MM');
    SELECT COALESCE(u.count, 0) INTO v_used
    FROM public.expense_monthly_usage u
    WHERE u.user_id = v_uid AND u.period = v_period;
    v_used := COALESCE(v_used, 0);
  END IF;

  RETURN jsonb_build_object(
    'state', v_state,
    'is_premium', v_premium,
    'plus_access_until', CASE WHEN v_state IN ('plus_active', 'plus_canceled_pending') THEN v_ent.access_until END,
    'cancel_at_period_end', v_state = 'plus_canceled_pending',
    'free_expenses_used', v_used,
    'free_expenses_limit', 30,
    'permissions', jsonb_build_object(
      'can_create_expense', v_state <> 'free_readonly',
      'can_use_ai', v_premium,
      'can_export_reports', v_premium,
      'can_use_plus_features', v_premium,
      'can_manage_billing', v_state IN ('plus_active', 'plus_canceled_pending')
    )
  );
END;
$$;

COMMENT ON FUNCTION public.fn_my_access() IS
  'Plus foundation: estado de acceso del usuario autenticado (auth.uid()). Sin parámetros: no puede consultar a otros usuarios. Ejecutable por authenticated.';

REVOKE ALL ON FUNCTION public.fn_my_access() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_my_access() TO authenticated, service_role;
