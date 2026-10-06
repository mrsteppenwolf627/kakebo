-- ⚠️ NO EJECUTAR AUTOMÁTICAMENTE. NO FORMA PARTE DE supabase/migrations/.
-- ROLLBACK de la Fase 3.B en MODO COMPATIBLE (20260916 + 20260917 + 20261001).
-- Requiere, en la misma sesión:  SET kakebo.phase3b_rollback = 'confirmed';
--
-- ANTES de ejecutarlo: el código desplegado en Vercel que llama a fn_create_expense y lee
-- first_expense_activations (commits 2153647 en adelante) dejaría de funcionar al borrar esas
-- funciones/tablas. Vuelve PRIMERO a un deployment anterior (p. ej. 41a4c98) o no ejecutes este script.
--
-- QUÉ HACE (una sola transacción; cualquier fallo deshace todo):
--   1. Se NIEGA a ejecutarse si el modelo freemium está activo (fn_create_expense en MODE: freemium,
--      fn_resolve_access_state o access_grants con filas). En ese caso hay que ejecutar antes
--      supabase/deferred/freemium/rollback_freemium.sql.
--   2. Quita los triggers/funciones de protección de profiles y de primera activación.
--   3. Borra tablas nuevas SOLO si están vacías. Si tienen filas (p. ej. contadores de uso o marcas
--      de activación), las CONSERVA y avisa: nunca se borran datos críticos.
--   4. Quita fn_create_expense y las funciones auxiliares que ya no se usan.
--
-- QUÉ NO HACE:
--   * No elimina las columnas añadidas a profiles (is_founder, founder_captured_at, trial_started_at,
--     plus_access_until): son inertes y pueden contener datos.
--   * No modifica tier, manual_override, trial_ends_at ni ningún dato de usuarios o gastos.
--   * No toca permisos de tabla (el GRANT INSERT de authenticated sobre expenses sigue intacto).
--   * No restaura handle_new_user: el modo compatible nunca lo cambió.

BEGIN;

DO $guard$
BEGIN
  IF coalesce(current_setting('kakebo.phase3b_rollback', true), '') <> 'confirmed' THEN
    RAISE EXCEPTION 'Rollback Fase 3.B: run SET kakebo.phase3b_rollback = ''confirmed''; first (y lee las advertencias de este archivo).';
  END IF;
END
$guard$;

-- 1. Diferenciar modo compatible de freemium activo.
DO $mode$
DECLARE
  v_descr text := obj_description(to_regprocedure('public.fn_create_expense(uuid, date, numeric, text, text, text, text)'), 'pg_proc');
  v_grants bigint := 0;
BEGIN
  IF to_regclass('public.access_grants') IS NOT NULL THEN
    EXECUTE 'SELECT count(*) FROM public.access_grants' INTO v_grants;
  END IF;

  IF coalesce(v_descr, '') LIKE 'MODE: freemium%'
     OR to_regprocedure('public.fn_resolve_access_state(uuid)') IS NOT NULL
     OR v_grants > 0 THEN
    RAISE EXCEPTION 'El modelo freemium está (o estuvo) activo. Ejecuta primero supabase/deferred/freemium/rollback_freemium.sql. No se hace nada.';
  END IF;
END
$mode$;

-- 2. Triggers y funciones de protección / activación.
DROP TRIGGER IF EXISTS trg_protect_profile_access_columns ON public.profiles;
DROP FUNCTION IF EXISTS public.protect_profile_access_columns();

DROP TRIGGER IF EXISTS trigger_claim_first_expense_activation ON public.expenses;
DROP FUNCTION IF EXISTS public.claim_first_expense_activation();

-- 3. Tablas: solo se borran si están vacías.
DO $tables$
DECLARE
  v_table text;
  v_rows  bigint;
BEGIN
  FOREACH v_table IN ARRAY ARRAY['first_expense_activations','expense_monthly_usage','subscriptions','stripe_webhook_events','founder_cutoff'] LOOP
    IF to_regclass('public.' || v_table) IS NOT NULL THEN
      EXECUTE format('SELECT count(*) FROM public.%I', v_table) INTO v_rows;
      IF v_rows = 0 THEN
        EXECUTE format('DROP TABLE public.%I', v_table);
        RAISE NOTICE 'Tabla % vacía: eliminada.', v_table;
      ELSE
        RAISE NOTICE 'Tabla % tiene % filas: SE CONSERVA (no se borran datos).', v_table, v_rows;
      END IF;
    END IF;
  END LOOP;
END
$tables$;

-- 4. Funciones que ya no se usan. fn_create_expense depende de expense_monthly_usage solo en tiempo de
--    ejecución (no hay dependencia de catálogo), por lo que se puede borrar aunque la tabla se conserve.
DROP FUNCTION IF EXISTS public.fn_create_expense(uuid, date, numeric, text, text, text, text);
DROP FUNCTION IF EXISTS public.fn_recompute_plus_access_until(uuid);

DO $founder_fn$
BEGIN
  IF to_regclass('public.founder_cutoff') IS NULL THEN
    DROP FUNCTION IF EXISTS public.reject_founder_cutoff_mutation();
  END IF;
END
$founder_fn$;

COMMIT;
