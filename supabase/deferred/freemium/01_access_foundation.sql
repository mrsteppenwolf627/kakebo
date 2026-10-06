-- DEFERRED / FREEMIUM 01 — Base de acceso (access_grants, fn_resolve_access_state, handle_new_user)
-- ⚠️ NO FORMA PARTE DE supabase/migrations/. NO SE EJECUTA AUTOMÁTICAMENTE. NO aplicar todavía.
-- Ver supabase/deferred/freemium/README.md y docs/planning/phase3b-migration-runbook.md.
--
-- Prepara la infraestructura del modelo freemium SIN activar el límite:
--   * `access_grants`: concesiones de acceso por usuario (la usa 04_legacy_access_grants.sql).
--   * `fn_resolve_access_state(uuid)`: réplica SQL de src/lib/auth/access-state.ts, ampliada con
--     'legacy_full'. Orden: founder -> legacy_full -> plus_active -> trialing -> free_*.
--     (Al activar freemium habrá que reflejar 'legacy_full' también en access-state.ts.)
--   * `handle_new_user`: alta de usuarios nuevos con trial de 14 días (misma duración que hoy) y
--     is_founder=false explícito. NO cambia la duración del trial.
-- Nada de esto limita gastos: el límite solo lo activa 03_enforce_expense_limit.sql.

-- Todo el script va en UNA transacción: si el guard falla, nada posterior se ejecuta (ni en psql).
BEGIN;

DO $guard$
BEGIN
  IF coalesce(current_setting('kakebo.freemium_activation', true), '') <> 'confirmed' THEN
    RAISE EXCEPTION 'DEFERRED freemium script: do not run outside the activation phase. Run SET kakebo.freemium_activation = ''confirmed''; only if this is the real activation.';
  END IF;
END
$guard$;

-- Precondición: modo compatible aplicado.
DO $pre$
BEGIN
  IF to_regprocedure('public.fn_create_expense(uuid, date, numeric, text, text, text, text)') IS NULL
     OR to_regclass('public.expense_monthly_usage') IS NULL
     OR to_regclass('public.founder_cutoff') IS NULL THEN
    RAISE EXCEPTION 'Faltan las migraciones del modo compatible (20260916/20260917). Aplícalas antes.';
  END IF;
END
$pre$;

-- =============================================================================
-- 1. access_grants
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.access_grants (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  grant_type text NOT NULL CHECK (grant_type IN ('legacy_full')),
  reason     text,
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

-- A lo sumo una concesión ACTIVA por usuario y tipo (idempotencia de 04).
CREATE UNIQUE INDEX IF NOT EXISTS access_grants_one_active_per_type
  ON public.access_grants (user_id, grant_type) WHERE revoked_at IS NULL;

COMMENT ON TABLE public.access_grants IS
  'Freemium (diferido): concesiones de acceso. legacy_full = usuario anterior a la activación que conserva todos sus privilegios. Escrita solo por scripts de servicio.';

ALTER TABLE public.access_grants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.access_grants FROM anon, authenticated;
GRANT SELECT ON public.access_grants TO authenticated;

DROP POLICY IF EXISTS "Users can view their own access grants" ON public.access_grants;
CREATE POLICY "Users can view their own access grants"
  ON public.access_grants FOR SELECT USING (auth.uid() = user_id);

-- =============================================================================
-- 2. fn_resolve_access_state
-- =============================================================================

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

  IF EXISTS (
    SELECT 1 FROM public.access_grants g
    WHERE g.user_id = p_user_id AND g.grant_type = 'legacy_full' AND g.revoked_at IS NULL
  ) THEN
    RETURN 'legacy_full';
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
  END IF;

  RETURN 'free_readonly';
END;
$$;

REVOKE ALL ON FUNCTION public.fn_resolve_access_state(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_resolve_access_state(uuid) TO service_role;

-- =============================================================================
-- 3. handle_new_user — trial de 14 días (SIN cambiar la duración actual)
-- =============================================================================

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
    now() + interval '14 days',
    false
  );

  RETURN new;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

COMMIT;
