-- ⚠️ NO EJECUTAR AUTOMÁTICAMENTE. NO FORMA PARTE DE supabase/migrations/.
-- Fotografía previa a aplicar las migraciones de la Fase 3.B (modo compatible).
--
-- Cuándo: manualmente, UNA vez, justo ANTES de aplicar 20260916 / 20260917 / 20261001, con el propietario
-- presente. NO modifica ningún dato de `public`; solo CREA tablas de copia en el esquema aparte
-- `phase3b_backup` (con sufijo de fecha y hora UTC, así que nunca sobrescribe una foto anterior).
--
-- Qué guarda (lo necesario para auditar y para el rollback):
--   * profiles completa: tier, manual_override, trial_ends_at, stripe_*, is_founder (si existe), etc.
--   * subscriptions, expense_monthly_usage, first_expense_activations (solo si ya existen).
--   * resumen de gastos por usuario (nº, primera y última fecha): contadores de referencia.
--   * definiciones de las funciones afectadas (handle_new_user, fn_create_expense, ...).
--   * privilegios de tabla, políticas RLS y triggers de profiles/expenses.
-- Los datos de backup quedan protegidos: RLS activada y sin ningún privilegio para anon/authenticated.
--
-- Después de ejecutarlo, comprueba con SELECT que las tablas existen y, si quieres, exporta
-- `phase3b_backup.*` fuera de Supabase. Para borrar la foto cuando ya no haga falta, hazlo a mano.

BEGIN;

CREATE SCHEMA IF NOT EXISTS phase3b_backup;
REVOKE ALL ON SCHEMA phase3b_backup FROM PUBLIC, anon, authenticated;

DO $snapshot$
DECLARE
  s text := to_char(now() AT TIME ZONE 'UTC', 'YYYYMMDD_HH24MISS');
  t record;
BEGIN
  EXECUTE format('CREATE TABLE phase3b_backup.snapshot_meta_%s AS SELECT now() AS taken_at, current_user::text AS taken_by, (SELECT count(*) FROM public.profiles) AS profiles_count, (SELECT count(*) FROM public.expenses) AS expenses_count', s);

  EXECUTE format('CREATE TABLE phase3b_backup.profiles_%s AS SELECT * FROM public.profiles', s);

  EXECUTE format('CREATE TABLE phase3b_backup.expenses_summary_%s AS SELECT user_id, count(*)::bigint AS expenses, min(date) AS first_date, max(date) AS last_date FROM public.expenses GROUP BY user_id', s);

  IF to_regclass('public.subscriptions') IS NOT NULL THEN
    EXECUTE format('CREATE TABLE phase3b_backup.subscriptions_%s AS SELECT * FROM public.subscriptions', s);
  END IF;
  IF to_regclass('public.expense_monthly_usage') IS NOT NULL THEN
    EXECUTE format('CREATE TABLE phase3b_backup.expense_monthly_usage_%s AS SELECT * FROM public.expense_monthly_usage', s);
  END IF;
  IF to_regclass('public.first_expense_activations') IS NOT NULL THEN
    EXECUTE format('CREATE TABLE phase3b_backup.first_expense_activations_%s AS SELECT * FROM public.first_expense_activations', s);
  END IF;
  IF to_regclass('public.access_grants') IS NOT NULL THEN
    EXECUTE format('CREATE TABLE phase3b_backup.access_grants_%s AS SELECT * FROM public.access_grants', s);
  END IF;

  EXECUTE format($f$CREATE TABLE phase3b_backup.function_defs_%s AS
    SELECT p.oid::regprocedure::text AS signature, CASE WHEN p.prokind = 'f' THEN pg_get_functiondef(p.oid) END AS definition
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prokind = 'f'
      AND p.proname IN ('handle_new_user','fn_create_expense','claim_first_expense_activation',
                        'fn_recompute_plus_access_until','fn_resolve_access_state',
                        'protect_profile_access_columns','reject_founder_cutoff_mutation')$f$, s);

  EXECUTE format($f$CREATE TABLE phase3b_backup.table_privileges_%s AS
    SELECT grantee, table_name, privilege_type FROM information_schema.role_table_grants
    WHERE table_schema = 'public' AND table_name IN ('profiles','expenses')$f$, s);

  EXECUTE format($f$CREATE TABLE phase3b_backup.policies_%s AS
    SELECT tablename, policyname, permissive, roles::text AS roles, cmd, qual, with_check FROM pg_policies
    WHERE schemaname = 'public' AND tablename IN ('profiles','expenses')$f$, s);

  EXECUTE format($f$CREATE TABLE phase3b_backup.triggers_%s AS
    SELECT tgrelid::regclass::text AS table_name, tgname, pg_get_triggerdef(oid) AS definition
    FROM pg_trigger
    WHERE NOT tgisinternal AND tgrelid IN ('public.profiles'::regclass, 'public.expenses'::regclass)$f$, s);

  -- Protege TODAS las copias: RLS activa y sin privilegios para clientes.
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'phase3b_backup' LOOP
    EXECUTE format('ALTER TABLE phase3b_backup.%I ENABLE ROW LEVEL SECURITY', t.tablename);
    EXECUTE format('REVOKE ALL ON phase3b_backup.%I FROM PUBLIC, anon, authenticated', t.tablename);
  END LOOP;

  RAISE NOTICE 'Snapshot Fase 3.B creada con sufijo %', s;
END
$snapshot$;

COMMIT;
