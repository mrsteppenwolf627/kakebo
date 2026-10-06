-- Verificación posterior a aplicar la Fase 3.B en MODO COMPATIBLE (solo lectura).
-- Se puede ejecutar tantas veces como se quiera: SOLO hace SELECT. No modifica nada.
--
-- Resultado: una fila por comprobación con status PASS/FAIL. Debe quedar CERO filas FAIL.
-- Las comprobaciones de la última sección ("sin cambios comerciales") demuestran que el modo
-- compatible no activó fundadores, suscripciones, límites ni concesiones.

WITH
fn AS (
  SELECT p.proname, p.oid, p.prosecdef, p.proconfig, CASE WHEN p.prokind = 'f' THEN pg_get_functiondef(p.oid) END AS def,
         obj_description(p.oid, 'pg_proc') AS descr
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.prokind = 'f'
),
checks(section, check_name, ok, detail) AS (
  -- ── Tablas ────────────────────────────────────────────────────────────────
  SELECT 'tablas', 'existe public.' || t, to_regclass('public.' || t) IS NOT NULL, NULL
  FROM unnest(ARRAY['founder_cutoff','subscriptions','expense_monthly_usage','stripe_webhook_events','first_expense_activations']) AS t
  UNION ALL
  SELECT 'rls', 'RLS activa en public.' || t,
         COALESCE((SELECT relrowsecurity FROM pg_class WHERE oid = to_regclass('public.' || t)), false), NULL
  FROM unnest(ARRAY['founder_cutoff','subscriptions','expense_monthly_usage','stripe_webhook_events','first_expense_activations','profiles','expenses']) AS t
  -- ── Columnas ──────────────────────────────────────────────────────────────
  UNION ALL
  SELECT 'columnas', 'profiles.' || c,
         EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name=c), NULL
  FROM unnest(ARRAY['is_founder','founder_captured_at','trial_started_at','plus_access_until','trial_ends_at','manual_override','tier']) AS c
  -- ── Funciones ─────────────────────────────────────────────────────────────
  UNION ALL
  SELECT 'funciones', 'existe ' || f, EXISTS (SELECT 1 FROM fn WHERE proname = f), NULL
  FROM unnest(ARRAY['fn_create_expense','fn_recompute_plus_access_until','claim_first_expense_activation','protect_profile_access_columns','reject_founder_cutoff_mutation','handle_new_user']) AS f
  UNION ALL
  SELECT 'funciones', f || ' es SECURITY DEFINER con search_path fijo',
         EXISTS (SELECT 1 FROM fn WHERE proname = f AND prosecdef AND EXISTS (SELECT 1 FROM unnest(proconfig) c WHERE c LIKE 'search_path=%')), NULL
  FROM unnest(ARRAY['fn_create_expense','fn_recompute_plus_access_until','claim_first_expense_activation']) AS f
  UNION ALL
  SELECT 'funciones', 'protect_profile_access_columns es SECURITY INVOKER (necesario para current_user)',
         EXISTS (SELECT 1 FROM fn WHERE proname = 'protect_profile_access_columns' AND NOT prosecdef), NULL
  -- ── Triggers e índices ────────────────────────────────────────────────────
  UNION ALL
  SELECT 'triggers', 'trg_protect_profile_access_columns en profiles',
         EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_protect_profile_access_columns' AND tgrelid='public.profiles'::regclass AND NOT tgisinternal), NULL
  UNION ALL
  SELECT 'triggers', 'trigger_claim_first_expense_activation en expenses',
         EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trigger_claim_first_expense_activation' AND tgrelid='public.expenses'::regclass AND NOT tgisinternal), NULL
  UNION ALL
  SELECT 'triggers', 'founder_cutoff_immutable en founder_cutoff',
         EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='founder_cutoff_immutable' AND NOT tgisinternal), NULL
  UNION ALL
  SELECT 'indices', 'idx_subscriptions_user_id', to_regclass('public.idx_subscriptions_user_id') IS NOT NULL, NULL
  UNION ALL
  SELECT 'indices', 'UNIQUE(stripe_subscription_id)',
         EXISTS (SELECT 1 FROM pg_constraint WHERE conname='subscriptions_stripe_subscription_id_key'), NULL
  UNION ALL
  SELECT 'integridad', 'first_expense_activations.expense_id es ON DELETE SET NULL (borrar un gasto no reabre la activación)',
         EXISTS (SELECT 1 FROM pg_constraint WHERE conname='first_expense_activations_expense_id_fkey' AND confdeltype='n'), NULL
  -- ── Privilegios ───────────────────────────────────────────────────────────
  UNION ALL
  SELECT 'privilegios', 'anon NO ejecuta ' || f,
         NOT has_function_privilege('anon', f, 'EXECUTE'), NULL
  FROM unnest(ARRAY[
    'public.fn_create_expense(uuid,date,numeric,text,text,text,text)',
    'public.fn_recompute_plus_access_until(uuid)',
    'public.claim_first_expense_activation()',
    'public.protect_profile_access_columns()',
    'public.handle_new_user()']) AS f
  UNION ALL
  SELECT 'privilegios', 'authenticated NO ejecuta ' || f,
         NOT has_function_privilege('authenticated', f, 'EXECUTE'), NULL
  FROM unnest(ARRAY[
    'public.fn_recompute_plus_access_until(uuid)',
    'public.claim_first_expense_activation()',
    'public.protect_profile_access_columns()',
    'public.handle_new_user()']) AS f
  UNION ALL
  SELECT 'privilegios', 'authenticated SÍ ejecuta fn_create_expense (la usa la app)',
         has_function_privilege('authenticated', 'public.fn_create_expense(uuid,date,numeric,text,text,text,text)', 'EXECUTE'), NULL
  UNION ALL
  SELECT 'privilegios', 'service_role SÍ ejecuta fn_recompute_plus_access_until',
         has_function_privilege('service_role', 'public.fn_recompute_plus_access_until(uuid)', 'EXECUTE'), NULL
  UNION ALL
  SELECT 'privilegios', 'anon/authenticated sin privilegios sobre ' || t,
         NOT has_table_privilege('anon', 'public.' || t, 'SELECT,INSERT,UPDATE,DELETE')
         AND NOT has_table_privilege('authenticated', 'public.' || t, 'INSERT,UPDATE,DELETE'), NULL
  FROM unnest(ARRAY['founder_cutoff','subscriptions','stripe_webhook_events']) AS t
  -- ── Modo compatible: sin cambios comerciales ──────────────────────────────
  UNION ALL
  SELECT 'compat', 'fn_create_expense está en MODE: compat',
         EXISTS (SELECT 1 FROM fn WHERE proname='fn_create_expense' AND descr LIKE 'MODE: compat%'), NULL
  UNION ALL
  SELECT 'compat', 'fn_create_expense no contiene KB001 ni límite',
         EXISTS (SELECT 1 FROM fn WHERE proname='fn_create_expense' AND def NOT LIKE '%KB001%' AND def NOT LIKE '%count < 30%'), NULL
  UNION ALL
  SELECT 'compat', 'handle_new_user conserva el trial de 14 días (y no 30)',
         EXISTS (SELECT 1 FROM fn WHERE proname='handle_new_user' AND def LIKE '%14 days%' AND def NOT LIKE '%30 days%'), NULL
  UNION ALL
  SELECT 'compat', 'no existe fn_resolve_access_state ni access_grants (son freemium)',
         NOT EXISTS (SELECT 1 FROM fn WHERE proname='fn_resolve_access_state') AND to_regclass('public.access_grants') IS NULL, NULL
  UNION ALL
  SELECT 'compat', 'authenticated conserva INSERT directo en expenses (no se cerró)',
         has_table_privilege('authenticated', 'public.expenses', 'INSERT'), NULL
  UNION ALL
  SELECT 'sin_cambios_comerciales', 'ningún fundador (is_founder=true)',
         (SELECT count(*) FROM public.profiles WHERE is_founder) = 0, (SELECT count(*)::text FROM public.profiles WHERE is_founder)
  UNION ALL
  SELECT 'sin_cambios_comerciales', 'ningún founder_captured_at ni founder_cutoff',
         (SELECT count(*) FROM public.profiles WHERE founder_captured_at IS NOT NULL) = 0
         AND (SELECT count(*) FROM public.founder_cutoff) = 0, NULL
  UNION ALL
  SELECT 'sin_cambios_comerciales', 'subscriptions y stripe_webhook_events vacías (Stripe no activo)',
         (SELECT count(*) FROM public.subscriptions) = 0 AND (SELECT count(*) FROM public.stripe_webhook_events) = 0, NULL
  UNION ALL
  SELECT 'sin_cambios_comerciales', 'plus_access_until sin valores (nadie recibió Plus)',
         (SELECT count(*) FROM public.profiles WHERE plus_access_until IS NOT NULL) = 0, NULL
  UNION ALL
  SELECT 'sin_cambios_comerciales', 'trial_started_at sin valores (handle_new_user no se sustituyó)',
         (SELECT count(*) FROM public.profiles WHERE trial_started_at IS NOT NULL) = 0, NULL
  UNION ALL
  SELECT 'integridad', 'contadores de uso no negativos y sin duplicados',
         NOT EXISTS (SELECT 1 FROM public.expense_monthly_usage WHERE count < 0), NULL
  UNION ALL
  SELECT 'integridad', 'una activación como máximo por usuario',
         NOT EXISTS (SELECT user_id FROM public.first_expense_activations GROUP BY user_id HAVING count(*) > 1), NULL
)
SELECT section, check_name, CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END AS status, detail
FROM checks
ORDER BY (CASE WHEN ok THEN 1 ELSE 0 END), section, check_name;

-- COMPARACIÓN OPCIONAL CON LA FOTO PREVIA (sustituye <sufijo> por el de phase3b_backup.profiles_<sufijo>):
-- Debe devolver CERO filas: ningún perfil existente cambió tier, manual_override ni trial_ends_at.
-- SELECT b.id, b.tier AS tier_antes, p.tier AS tier_ahora, b.manual_override AS mo_antes, p.manual_override AS mo_ahora,
--        b.trial_ends_at AS trial_antes, p.trial_ends_at AS trial_ahora
-- FROM phase3b_backup.profiles_<sufijo> b JOIN public.profiles p ON p.id = b.id
-- WHERE (b.tier, b.manual_override, b.trial_ends_at) IS DISTINCT FROM (p.tier, p.manual_override, p.trial_ends_at);
