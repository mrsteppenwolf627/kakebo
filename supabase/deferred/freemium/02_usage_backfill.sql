-- DEFERRED / FREEMIUM 02 — Backfill del contador mensual de gastos
-- ⚠️ NO FORMA PARTE DE supabase/migrations/. NO SE EJECUTA AUTOMÁTICAMENTE. NO aplicar todavía.
-- Ver supabase/deferred/freemium/README.md.
--
-- Rellena `expense_monthly_usage` del MES ACTUAL (Europe/Madrid) con los gastos ya creados, para que
-- el límite de 03_enforce_expense_limit.sql parta de contadores reales.
--   * IDEMPOTENTE: se puede ejecutar varias veces.
--   * NUNCA REDUCE un contador: usa GREATEST(contador actual, recuento calculado). Si el contador ya
--     era mayor (porque se borraron gastos), se conserva.
--   * Solo toca expense_monthly_usage. No concede ni retira acceso. No activa el límite.
-- Cuenta por fecha de CREACIÓN (created_at) si la columna existe; si no, por `date`.

-- Todo el script va en UNA transacción: si el guard falla, nada posterior se ejecuta (ni en psql).
BEGIN;

DO $guard$
BEGIN
  IF coalesce(current_setting('kakebo.freemium_activation', true), '') <> 'confirmed' THEN
    RAISE EXCEPTION 'DEFERRED freemium script: do not run outside the activation phase. Run SET kakebo.freemium_activation = ''confirmed''; only if this is the real activation.';
  END IF;
END
$guard$;

DO $$
DECLARE
  v_ts_expr text;
  v_period  text := to_char(now() AT TIME ZONE 'Europe/Madrid', 'YYYY-MM');
BEGIN
  IF to_regclass('public.expense_monthly_usage') IS NULL THEN
    RAISE EXCEPTION 'Falta expense_monthly_usage (20260916). Aplica el modo compatible antes.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'expenses' AND column_name = 'created_at'
  ) THEN
    v_ts_expr := 'e.created_at';
  ELSE
    v_ts_expr := 'e.date::timestamptz';
  END IF;

  EXECUTE format($sql$
    INSERT INTO public.expense_monthly_usage AS u (user_id, period, count)
    SELECT e.user_id, %L, count(*)::integer
    FROM public.expenses e
    WHERE to_char(%s AT TIME ZONE 'Europe/Madrid', 'YYYY-MM') = %L
    GROUP BY e.user_id
    ON CONFLICT (user_id, period) DO UPDATE
      SET count = GREATEST(u.count, EXCLUDED.count)
  $sql$, v_period, v_ts_expr, v_period);
END
$$;

COMMIT;
