-- DEFERRED / FREEMIUM — ROLLBACK: vuelve del modelo freemium al MODO COMPATIBLE
-- ⚠️ NO FORMA PARTE DE supabase/migrations/. NO SE EJECUTA AUTOMÁTICAMENTE.
-- Úsalo solo si 01–05 se aplicaron y hay que desactivar el límite. Requiere:
--   SET kakebo.freemium_rollback = 'confirmed';
--
-- QUÉ HACE (todo en una transacción):
--   1. Restituye el GRANT INSERT sobre `expenses` a authenticated (deshace 05).
--   2. Sustituye fn_create_expense por la versión COMPATIBLE (sin límite, sin KB001).
--   3. Restituye handle_new_user a la versión compatible (alta con trial de 14 días).
--   4. Elimina fn_resolve_access_state (solo existe en modo freemium).
--
-- QUÉ NO HACE (protecciones para no borrar datos críticos):
--   * NO borra ni vacía access_grants, expense_monthly_usage, first_expense_activations,
--     subscriptions, profiles ni expenses. Las concesiones legacy_full quedan como registro
--     inerte (en modo compatible nada las lee) y se reutilizan si se vuelve a activar freemium.
--   * NO modifica tier, manual_override, trial_ends_at, is_founder, plus_access_until.
--   * No toca RLS ni la protección de columnas de profiles.
-- Al terminar verifica que el modo es compatible y aborta (ROLLBACK) si no.

BEGIN;

DO $guard$
BEGIN
  IF coalesce(current_setting('kakebo.freemium_rollback', true), '') <> 'confirmed' THEN
    RAISE EXCEPTION 'DEFERRED freemium rollback: run SET kakebo.freemium_rollback = ''confirmed''; first.';
  END IF;
END
$guard$;

-- 1. Deshace 05.
GRANT INSERT ON public.expenses TO authenticated;

-- 2. fn_create_expense compatible (idéntica a 20260916).
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
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado' USING ERRCODE = 'KB002';
  END IF;

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

  IF p_month_id IS NULL THEN
    RAISE EXCEPTION 'Ciclo no válido' USING ERRCODE = 'KB002';
  END IF;

  SELECT status, user_id INTO v_month_status, v_month_owner
  FROM public.months
  WHERE id = p_month_id
  FOR UPDATE;

  IF NOT FOUND OR v_month_owner <> v_user_id THEN
    RAISE EXCEPTION 'Ciclo no válido' USING ERRCODE = 'KB002';
  END IF;

  IF v_month_status = 'closed' THEN
    RAISE EXCEPTION 'El ciclo está cerrado' USING ERRCODE = 'KB002';
  END IF;

  v_period := to_char(now() AT TIME ZONE 'Europe/Madrid', 'YYYY-MM');

  INSERT INTO public.expense_monthly_usage (user_id, period, count)
  VALUES (v_user_id, v_period, 1)
  ON CONFLICT (user_id, period) DO UPDATE
    SET count = public.expense_monthly_usage.count + 1;

  INSERT INTO public.expenses (user_id, month_id, date, amount, category, note, color, subcategory)
  VALUES (v_user_id, p_month_id, p_date, p_amount, p_category, p_note, p_color, p_subcategory)
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

COMMENT ON FUNCTION public.fn_create_expense(uuid, date, numeric, text, text, text, text) IS
  'MODE: compat — crea gastos sin límite comercial (no KB001). Sustituida solo por supabase/deferred/freemium/03_enforce_expense_limit.sql en la futura activación freemium.';

REVOKE ALL ON FUNCTION public.fn_create_expense(uuid, date, numeric, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_create_expense(uuid, date, numeric, text, text, text, text) TO authenticated;

-- 3. handle_new_user compatible: trial de 14 días (sin lock de fundadores ni trial_started_at).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, tier, trial_ends_at)
  VALUES (new.id, 'free', now() + interval '14 days');
  RETURN new;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- 4. Función exclusiva del modo freemium.
DROP FUNCTION IF EXISTS public.fn_resolve_access_state(uuid);

-- Verificación final: si el modo no es compatible, se deshace todo.
DO $verify$
DECLARE
  v_def text := pg_get_functiondef('public.fn_create_expense(uuid, date, numeric, text, text, text, text)'::regprocedure);
BEGIN
  IF obj_description('public.fn_create_expense(uuid, date, numeric, text, text, text, text)'::regprocedure, 'pg_proc') NOT LIKE 'MODE: compat%'
     OR v_def LIKE '%KB001%' THEN
    RAISE EXCEPTION 'El rollback no dejó fn_create_expense en modo compatible. Se aborta.';
  END IF;
END
$verify$;

COMMIT;
