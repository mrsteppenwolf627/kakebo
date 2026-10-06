-- Línea base de PRODUCCIÓN antes de la Fase 3.B (SOLO LECTURA).
-- Ejecutar manualmente en el editor SQL de Supabase ANTES de aplicar las migraciones, y guardar
-- los resultados junto a la foto de supabase/manual-ops/phase3b_pre_apply_snapshot.sql.
-- Solo contiene SELECT: no modifica nada. NO forma parte de `npm test`.
--
-- Objetivo: confirmar con datos reales las suposiciones del modo compatible:
--   (a) cómo está definido hoy handle_new_user (¿trial de 14 días?),
--   (b) qué columnas/permisos/políticas tienen profiles y expenses,
--   (c) cuántos usuarios hay y en qué estado (tier, manual_override, trial),
--   (d) qué piezas de la Fase 3.B existen ya (para no solaparse).

-- 1. Versión y extensiones relevantes
SELECT version();

-- 2. Definición ACTUAL de handle_new_user y su trigger (confirma el trial de 14 días)
SELECT pg_get_functiondef('public.handle_new_user()'::regprocedure) AS handle_new_user_def;
SELECT tgname, pg_get_triggerdef(oid) AS def
FROM pg_trigger WHERE tgrelid = 'auth.users'::regclass AND NOT tgisinternal;

-- 3. Columnas de profiles y expenses (¿existe expenses.created_at? ¿qué defaults?)
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name IN ('profiles','expenses','months')
ORDER BY table_name, ordinal_position;

-- 4. Privilegios de tabla, políticas y triggers de profiles/expenses
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND table_name IN ('profiles','expenses')
  AND grantee IN ('anon','authenticated','service_role')
ORDER BY table_name, grantee, privilege_type;

SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('profiles','expenses');

SELECT tgrelid::regclass AS tabla, tgname, pg_get_triggerdef(oid) AS def
FROM pg_trigger WHERE NOT tgisinternal AND tgrelid IN ('public.profiles'::regclass, 'public.expenses'::regclass);

-- 5. Usuarios por estado (no expone emails ni identificadores)
SELECT
  count(*)                                                       AS perfiles,
  count(*) FILTER (WHERE tier::text = 'pro')                     AS tier_pro,
  count(*) FILTER (WHERE manual_override IS TRUE)                AS manual_override_true,
  count(*) FILTER (WHERE trial_ends_at IS NULL)                  AS trial_null,
  count(*) FILTER (WHERE trial_ends_at IS NOT NULL AND trial_ends_at <= now()) AS trial_caducado,
  count(*) FILTER (WHERE trial_ends_at > now())                  AS trial_vigente,
  count(*) FILTER (WHERE stripe_subscription_id IS NOT NULL)     AS con_stripe_subscription_id
FROM public.profiles;

SELECT (SELECT count(*) FROM auth.users) AS auth_users,
       (SELECT count(*) FROM public.profiles) AS profiles,
       (SELECT count(*) FROM auth.users u WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)) AS usuarios_sin_perfil,
       (SELECT count(*) FROM public.expenses) AS gastos;

-- 6. Gasto máximo mensual por usuario (¿alguien pasaría hoy de 30? informativo para el futuro freemium)
SELECT count(*) FILTER (WHERE n > 30) AS usuarios_con_mas_de_30_gastos_en_un_mes, max(n) AS maximo
FROM (
  SELECT user_id, to_char(date, 'YYYY-MM') AS periodo, count(*) AS n
  FROM public.expenses GROUP BY 1, 2
) s;

-- 7. ¿Qué piezas de la Fase 3.B existen ya?
SELECT t AS objeto, to_regclass('public.' || t) IS NOT NULL AS existe
FROM unnest(ARRAY['founder_cutoff','subscriptions','expense_monthly_usage','stripe_webhook_events','first_expense_activations','access_grants']) AS t;

SELECT p.oid::regprocedure AS funcion, obj_description(p.oid, 'pg_proc') AS descripcion
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('fn_create_expense','fn_resolve_access_state','fn_recompute_plus_access_until',
                    'claim_first_expense_activation','protect_profile_access_columns','handle_new_user');
