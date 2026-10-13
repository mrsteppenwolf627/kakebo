-- MIGRATION 3/5 — Plus subscriptions foundation: protección de `profiles` + `handle_new_user` v2
-- DATE: 2026-10-13
-- ENVIRONMENT: probada en STAGING (gqnsanzsdnbufwicjtiw). NO aplicar en producción sin autorización explícita.
--
-- 1. protect_profile_access_columns v2: además de los campos ya protegidos (is_founder, founder_captured_at,
--    plus_access_until, manual_override, tier, trial_started_at, trial_ends_at) protege ahora
--    stripe_customer_id y stripe_subscription_id. Un usuario autenticado puede actualizar su propia fila de `profiles`
--    (política RLS existente) y, sin esta protección, podría apuntar su portal de facturación a otro cliente de Stripe.
--    El trigger se mantiene (mismo nombre, BEFORE INSERT OR UPDATE).
--
-- 2. handle_new_user v2: alta con trial de 14 días y `trial_started_at` informado (v1 solo informaba trial_ends_at).
--    - NO modifica usuarios existentes (solo actúa al crear un usuario; ON CONFLICT DO NOTHING lo hace idempotente).
--    - CREATE OR REPLACE conserva propietario y privilegios de ejecución actuales de la función.
--    - Añade SET search_path (endurecimiento de SECURITY DEFINER).
--
-- Rollback: supabase/rollback/plus/20261013113038_plus_profile_protection_and_new_user.rollback.sql

CREATE OR REPLACE FUNCTION public.protect_profile_access_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Solo restringe a los roles de cliente de PostgREST. service_role, postgres y los
  -- propietarios de funciones SECURITY DEFINER pasan sin cambios.
  IF current_user NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF COALESCE(NEW.is_founder, false) <> false
       OR NEW.founder_captured_at IS NOT NULL
       OR NEW.plus_access_until IS NOT NULL
       OR COALESCE(NEW.manual_override, false) <> false
       OR NEW.stripe_customer_id IS NOT NULL
       OR NEW.stripe_subscription_id IS NOT NULL THEN
      RAISE EXCEPTION 'No se permite establecer campos de acceso protegidos'
        USING ERRCODE = '42501';
    END IF;
  ELSE
    IF NEW.is_founder          IS DISTINCT FROM OLD.is_founder
       OR NEW.founder_captured_at IS DISTINCT FROM OLD.founder_captured_at
       OR NEW.plus_access_until   IS DISTINCT FROM OLD.plus_access_until
       OR NEW.manual_override     IS DISTINCT FROM OLD.manual_override
       OR NEW.tier                IS DISTINCT FROM OLD.tier
       OR NEW.trial_started_at    IS DISTINCT FROM OLD.trial_started_at
       OR NEW.trial_ends_at       IS DISTINCT FROM OLD.trial_ends_at
       OR NEW.stripe_customer_id     IS DISTINCT FROM OLD.stripe_customer_id
       OR NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id THEN
      RAISE EXCEPTION 'No se permite modificar campos de acceso protegidos'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.protect_profile_access_columns() IS
  'Plus foundation v2: impide que anon/authenticated modifiquen is_founder, founder_captured_at, plus_access_until, manual_override, tier, trial_started_at, trial_ends_at, stripe_customer_id y stripe_subscription_id. service_role y funciones SECURITY DEFINER no se ven afectados.';

DROP TRIGGER IF EXISTS trg_protect_profile_access_columns ON public.profiles;
CREATE TRIGGER trg_protect_profile_access_columns
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_access_columns();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, tier, trial_started_at, trial_ends_at)
  VALUES (
    new.id,
    'free',
    now(),
    now() + interval '14 days'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
  'Plus foundation v2: alta de usuario nuevo en la capa gratuita con trial de 14 días (trial_started_at = now(), trial_ends_at = now() + 14 días). No toca usuarios existentes.';
