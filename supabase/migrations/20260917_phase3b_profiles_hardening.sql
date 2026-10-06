-- MIGRATION: Fase 3.B — Endurecimiento de `profiles` y de funciones sensibles (MODO COMPATIBLE)
-- DATE: 2026-09-17 (reconstruida el 2026-10-06)
-- STATUS: PREPARADA, NO APLICADA. No ejecutar contra Supabase remoto sin autorización
--         explícita del propietario. Requiere 20260916_phase3b_monetization_foundation.sql
--         (columnas is_founder, founder_captured_at, trial_started_at, plus_access_until).
--
-- PROBLEMA QUE CORRIGE
--   La política "Users can update their own profile" (FOR UPDATE USING (auth.uid() = id), sin
--   WITH CHECK) y el GRANT UPDATE a `authenticated` permiten que cualquier usuario modifique
--   desde el navegador TODAS las columnas de su propio perfil: `manual_override`, `tier`,
--   `trial_ends_at`, y las nuevas `is_founder`, `plus_access_until`... Es decir, auto-concederse
--   acceso VIP/fundador/Plus o alargar su prueba. Además, en Supabase las funciones nuevas de
--   `public` reciben EXECUTE para `anon`/`authenticated` por privilegios por defecto, y un
--   `REVOKE ... FROM PUBLIC` NO los quita.
--
-- QUÉ HACE (sin cambiar el comportamiento legítimo de nadie)
--   1. Trigger BEFORE INSERT OR UPDATE en `profiles` que rechaza (42501) cualquier cambio de
--      columnas de acceso cuando el rol que ejecuta es `anon` o `authenticated`.
--      Las operaciones legítimas NO se ven afectadas:
--        - service_role (cliente admin: /api/admin/grant-vip, /api/admin/list-vip-users) sigue
--          pudiendo escribir manual_override, plus_access_until, etc.
--        - Funciones SECURITY DEFINER (handle_new_user, fn_recompute_plus_access_until) se
--          ejecutan como su propietario, no como authenticated.
--        - El usuario puede seguir actualizando columnas NO protegidas de su perfil.
--   2. Revoca EXECUTE por nombre a anon/authenticated sobre funciones sensibles.
--
-- QUÉ NO HACE
--   - No hace REVOKE UPDATE sobre `profiles` ni DROP POLICY (eso es el script manual
--     supabase/manual-ops/phase3b_permission_hardening.sql).
--   - No debilita RLS. No cambia ningún dato. No concede ni retira acceso a nadie.
--
-- Idempotente (CREATE OR REPLACE / DROP TRIGGER IF EXISTS / to_regprocedure).

-- =============================================================================
-- 1. Protección de columnas de acceso en `profiles`
-- =============================================================================
-- IMPORTANTE: SECURITY INVOKER (por defecto). Con SECURITY DEFINER `current_user` sería el
-- propietario de la función y la comprobación no distinguiría al usuario.

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
       OR COALESCE(NEW.manual_override, false) <> false THEN
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
       OR NEW.trial_ends_at       IS DISTINCT FROM OLD.trial_ends_at THEN
      RAISE EXCEPTION 'No se permite modificar campos de acceso protegidos'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.protect_profile_access_columns() IS
  'Fase 3.B: impide que anon/authenticated modifiquen is_founder, founder_captured_at, plus_access_until, manual_override, tier, trial_started_at y trial_ends_at. service_role y funciones SECURITY DEFINER no se ven afectados.';

DROP TRIGGER IF EXISTS trg_protect_profile_access_columns ON public.profiles;
CREATE TRIGGER trg_protect_profile_access_columns
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_access_columns();

-- =============================================================================
-- 2. Privilegios de ejecución de funciones sensibles
-- =============================================================================
-- Ninguna de estas funciones debe poder invocarse desde el cliente (anon/authenticated).
-- Las funciones de trigger no necesitan EXECUTE del usuario que dispara el trigger.
-- Guardado con to_regprocedure: una función que no exista en este entorno se omite.

DO $$
DECLARE
  v_sig text;
  v_sensitive text[] := ARRAY[
    'public.protect_profile_access_columns()',
    'public.handle_new_user()',
    'public.claim_first_expense_activation()',
    'public.reject_founder_cutoff_mutation()',
    'public.fn_recompute_plus_access_until(uuid)',
    'public.fn_resolve_access_state(uuid)'
  ];
BEGIN
  FOREACH v_sig IN ARRAY v_sensitive LOOP
    IF to_regprocedure(v_sig) IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', v_sig);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', v_sig);
    END IF;
  END LOOP;
END;
$$;

-- fn_create_expense es la única función de este bloque que `authenticated` SÍ debe ejecutar
-- (la usa la app); anon nunca.
DO $$
BEGIN
  IF to_regprocedure('public.fn_create_expense(uuid, date, numeric, text, text, text, text)') IS NOT NULL THEN
    REVOKE ALL ON FUNCTION public.fn_create_expense(uuid, date, numeric, text, text, text, text) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.fn_create_expense(uuid, date, numeric, text, text, text, text) TO authenticated;
  END IF;
END;
$$;
