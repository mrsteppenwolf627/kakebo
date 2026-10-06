-- DEFERRED / FREEMIUM 03 — ACTIVA el límite de 30 gastos/mes (ÚNICO script que lo hace)
-- ⚠️ NO FORMA PARTE DE supabase/migrations/. NO SE EJECUTA AUTOMÁTICAMENTE. NO aplicar todavía.
-- Ver supabase/deferred/freemium/README.md y docs/planning/phase3b-migration-runbook.md.
--
-- Sustituye fn_create_expense por la versión que aplica el límite gratuito (KB001):
--   * founder, legacy_full, plus_active y trialing: sin límite (siguen contando).
--   * free_under_limit: hasta 30 creaciones por mes natural (Europe/Madrid), de forma atómica.
--   * free_readonly: rechaza con KB001.
-- Las validaciones técnicas y los códigos KB002 son idénticos a la versión compatible.
--
-- PRECONDICIONES (el script se niega a ejecutarse si no se cumplen):
--   * 01_access_foundation.sql aplicado (access_grants + fn_resolve_access_state).
--   * 04_legacy_access_grants.sql aplicado: TODO usuario existente tiene concesión legacy_full
--     (si no, los usuarios actuales quedarían limitados).
--   * 02_usage_backfill.sql recomendado antes.
-- Para volver al modo compatible: rollback_freemium.sql.

-- Todo el script va en UNA transacción: si el guard falla, nada posterior se ejecuta (ni en psql).
BEGIN;

DO $guard$
BEGIN
  IF coalesce(current_setting('kakebo.freemium_activation', true), '') <> 'confirmed' THEN
    RAISE EXCEPTION 'DEFERRED freemium script: do not run outside the activation phase. Run SET kakebo.freemium_activation = ''confirmed''; only if this is the real activation.';
  END IF;
END
$guard$;

DO $pre$
DECLARE
  v_missing integer;
BEGIN
  IF to_regclass('public.access_grants') IS NULL
     OR to_regprocedure('public.fn_resolve_access_state(uuid)') IS NULL THEN
    RAISE EXCEPTION 'Falta 01_access_foundation.sql. No se activa el límite.';
  END IF;

  SELECT count(*) INTO v_missing
  FROM public.profiles p
  WHERE NOT EXISTS (
    SELECT 1 FROM public.access_grants g
    WHERE g.user_id = p.id AND g.grant_type = 'legacy_full' AND g.revoked_at IS NULL
  )
  AND p.is_founder = false;

  IF v_missing > 0 THEN
    RAISE EXCEPTION 'Hay % usuarios existentes sin concesión legacy_full. Ejecuta 04_legacy_access_grants.sql primero.', v_missing;
  END IF;
END
$pre$;

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
  v_access_state text;
  v_period       text;
  v_new_count    integer;
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

  v_access_state := public.fn_resolve_access_state(v_user_id);
  v_period := to_char(now() AT TIME ZONE 'Europe/Madrid', 'YYYY-MM');

  IF v_access_state = 'free_readonly' THEN
    RAISE EXCEPTION 'Límite mensual de gastos alcanzado' USING ERRCODE = 'KB001';
  END IF;

  IF v_access_state = 'free_under_limit' THEN
    INSERT INTO public.expense_monthly_usage (user_id, period, count)
    VALUES (v_user_id, v_period, 1)
    ON CONFLICT (user_id, period) DO UPDATE
      SET count = public.expense_monthly_usage.count + 1
      WHERE public.expense_monthly_usage.count < 30
    RETURNING count INTO v_new_count;

    -- Un ON CONFLICT DO UPDATE ... WHERE que no se cumple no devuelve fila.
    IF v_new_count IS NULL THEN
      RAISE EXCEPTION 'Límite mensual de gastos alcanzado' USING ERRCODE = 'KB001';
    END IF;
  ELSE
    -- Estados sin límite: se sigue contando (métrica), nunca se rechaza.
    INSERT INTO public.expense_monthly_usage (user_id, period, count)
    VALUES (v_user_id, v_period, 1)
    ON CONFLICT (user_id, period) DO UPDATE
      SET count = public.expense_monthly_usage.count + 1;
  END IF;

  INSERT INTO public.expenses (user_id, month_id, date, amount, category, note, color, subcategory)
  VALUES (v_user_id, p_month_id, p_date, p_amount, p_category, p_note, p_color, p_subcategory)
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

COMMENT ON FUNCTION public.fn_create_expense(uuid, date, numeric, text, text, text, text) IS
  'MODE: freemium — aplica el límite de 30 gastos/mes a usuarios free (KB001). Revertir con supabase/deferred/freemium/rollback_freemium.sql.';

REVOKE ALL ON FUNCTION public.fn_create_expense(uuid, date, numeric, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_create_expense(uuid, date, numeric, text, text, text, text) TO authenticated;

COMMIT;
