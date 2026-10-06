-- ⚠️ NOTA 2026-10-06 (MODO COMPATIBLE): las secciones que usan fn_resolve_access_state, el límite de 30 gastos o
-- access_grants SOLO son válidas tras aplicar supabase/deferred/freemium/01–03. En modo compatible usa
-- supabase/verification/phase3b_verify.sql (solo lectura) y supabase/tests/phase3b_prod_baseline.sql.
-- Ver docs/planning/phase3b-migration-runbook.md.

-- Comprobaciones de seguridad SQL — Fase 3.B
--
-- ⚠️ ESTE ARCHIVO NO SE EJECUTA COMO PARTE DE `npm test`. Vitest no tiene acceso
-- a una base de datos Postgres real en este entorno (no hay `supabase/config.toml`
-- ni Docker local configurado). Estas comprobaciones son SQL real, pensado para
-- ejecutarse manualmente con `psql` o el editor SQL de Supabase, DESPUÉS de
-- aplicar la migración 20260916_phase3b_monetization_foundation.sql en un
-- entorno de prueba (local con Docker, o un proyecto Supabase de staging) --
-- nunca contra producción sin más.
--
-- Cada bloque está envuelto en BEGIN/ROLLBACK cuando modifica datos, para no dejar
-- residuos en la base contra la que se ejecute.

-- =============================================================================
-- 1. founder_cutoff es realmente un singleton
-- =============================================================================
-- Esperado: la segunda fila falla por violar founder_cutoff_singleton o la PK.
BEGIN;
  INSERT INTO public.founder_cutoff (id, cutoff_at) VALUES (true, now());
  -- Esto debe fallar (duplicate key value violates unique constraint):
  INSERT INTO public.founder_cutoff (id, cutoff_at) VALUES (true, now());
ROLLBACK;

-- Intento de fila con id=false -- debe fallar por el CHECK(id):
BEGIN;
  -- Esto debe fallar (violates check constraint "founder_cutoff_singleton"):
  INSERT INTO public.founder_cutoff (id, cutoff_at) VALUES (false, now());
ROLLBACK;

-- =============================================================================
-- 2. founder_cutoff es inmutable (trigger rechaza UPDATE/DELETE)
-- =============================================================================
BEGIN;
  INSERT INTO public.founder_cutoff (id, cutoff_at) VALUES (true, now());
  -- Esto debe fallar (founder_cutoff es inmutable: no se permite UPDATE ni DELETE):
  UPDATE public.founder_cutoff SET cutoff_at = now() WHERE id = true;
ROLLBACK;

BEGIN;
  INSERT INTO public.founder_cutoff (id, cutoff_at) VALUES (true, now());
  -- Esto debe fallar igualmente para DELETE:
  DELETE FROM public.founder_cutoff WHERE id = true;
ROLLBACK;

-- =============================================================================
-- 3. EXECUTE de fn_create_expense restringido -- PUBLIC/anon no pueden invocarla
-- =============================================================================
-- Esperado: ninguna fila con grantee = 'PUBLIC' y privilege_type = 'EXECUTE'.
SELECT grantee, privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name = 'fn_create_expense'
  AND privilege_type = 'EXECUTE';
-- Se espera exactamente una fila con grantee = 'authenticated' (y, según cómo
-- Supabase gestione roles internamente, posiblemente 'postgres'/el propietario) --
-- NINGUNA con grantee = 'PUBLIC' ni 'anon'.

-- =============================================================================
-- 4. Ausencia de INSERT directo en expenses para authenticated/anon
-- =============================================================================
-- Esperado: cero filas -- SOLO TRAS ejecutar manualmente
-- supabase/manual-ops/phase3b_permission_hardening.sql (la migración base NO
-- toca este grant; antes de ejecutar ese script manual, esta consulta debe
-- devolver una fila con grantee='authenticated', confirmando que el INSERT
-- directo sigue permitido hasta el endurecimiento explícito).
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'expenses'
  AND privilege_type = 'INSERT'
  AND grantee IN ('authenticated', 'anon');

-- Comprobación funcional equivalente (requiere ejecutarse con el rol authenticated
-- y un auth.uid() de prueba resuelto vía RLS -- no reproducible con un simple
-- superusuario de psql; documentar como pendiente de prueba manual con un JWT de
-- usuario de prueba real, vía el cliente de Supabase, no aquí):
--   supabase.from('expenses').insert({...}) DEBE devolver un error de permisos
--   (42501 / insufficient_privilege), nunca insertar la fila.

-- =============================================================================
-- 5. fn_create_expense rechaza sin sesión (auth.uid() NULL)
-- =============================================================================
-- Requiere ejecutarse SIN contexto de sesión (auth.uid() debe devolver NULL bajo
-- el rol con el que se pruebe). Esperado: excepción con mensaje 'No autenticado'.
-- BEGIN;
--   SELECT public.fn_create_expense(NULL, current_date, 10, 'survival', 'test', NULL, NULL);
-- ROLLBACK;

-- =============================================================================
-- 6. UPDATE de profiles no permitido para authenticated (tras el endurecimiento manual)
-- =============================================================================
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND privilege_type = 'UPDATE'
  AND grantee IN ('authenticated', 'anon');
-- Esperado: cero filas -- SOLO TRAS ejecutar manualmente
-- supabase/manual-ops/phase3b_permission_hardening.sql. La migración base no
-- lo toca; antes de ese script esta consulta debe devolver una fila.

-- =============================================================================
-- 7. search_path fijo en las funciones SECURITY DEFINER nuevas
-- =============================================================================
SELECT p.proname, p.proconfig
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('fn_create_expense', 'fn_resolve_access_state', 'handle_new_user');
-- Esperado: proconfig debe incluir 'search_path=public, pg_temp' para las tres.

-- =============================================================================
-- 8. fn_create_expense — ciclo abierto, ciclo cerrado, ciclo ajeno
-- =============================================================================
-- Requiere ejecutarse en el contexto de sesión de un usuario de prueba real
-- (auth.uid() resuelto vía RLS, no un superusuario de psql) -- documentado aquí
-- como referencia de qué comprobar, no ejecutado en este entorno.
--
-- Preparación (como superusuario, fuera de la sesión de prueba):
--   -- ciclo abierto del propio usuario de prueba
--   INSERT INTO months (id, user_id, year, month, status) VALUES ('...', '<uid>', 2026, 5, 'open');
--   -- ciclo cerrado del propio usuario de prueba
--   INSERT INTO months (id, user_id, year, month, status) VALUES ('...', '<uid>', 2026, 4, 'closed');
--   -- ciclo de OTRO usuario (ajeno)
--   INSERT INTO months (id, user_id, year, month, status) VALUES ('...', '<otro-uid>', 2026, 5, 'open');
--
-- Con la sesión de <uid> activa (auth.uid() = <uid>):
--   -- Ciclo abierto propio: debe INSERTAR correctamente y devolver la fila.
--   SELECT * FROM fn_create_expense('<ciclo-abierto-propio>', '2026-05-10', 10, 'survival', 'test', NULL, NULL);
--
--   -- Ciclo cerrado propio: debe fallar con 'El ciclo está cerrado' (ERRCODE KB002).
--   SELECT * FROM fn_create_expense('<ciclo-cerrado-propio>', '2026-04-10', 10, 'survival', 'test', NULL, NULL);
--
--   -- Ciclo ajeno: debe fallar con 'Ciclo no válido' (ERRCODE KB002) -- el mismo
--   -- mensaje que "no existe", para no permitir distinguir ambos casos.
--   SELECT * FROM fn_create_expense('<ciclo-ajeno>', '2026-05-10', 10, 'survival', 'test', NULL, NULL);
--
-- NOTA: bajo "ciclos libres" (Fase 1, src/lib/months.ts), POST /api/expenses ya
-- valida ownership+cierre cuando el cliente envía un month_id explícito (ver
-- Fase 1.1 en src/app/api/expenses/route.ts) -- fn_create_expense repite esa
-- misma comprobación como defensa en profundidad, con independencia de lo que
-- ya filtre la app, y cubre además el canal del asistente legado
-- (src/lib/ai/tool-executor.ts), que todavía resuelve el ciclo por mes natural
-- de forma independiente y no comparte esa validación con la ruta manual.

-- =============================================================================
-- 9. subscriptions — UNIQUE(stripe_subscription_id) y recálculo multi-suscripción
-- =============================================================================
-- Esperado: la segunda fila con el mismo stripe_subscription_id (aunque sea de
-- otro usuario) debe fallar por violar subscriptions_stripe_subscription_id_key.
BEGIN;
  INSERT INTO public.subscriptions
    (user_id, stripe_customer_id, stripe_subscription_id, status, plan_interval, current_period_end)
  VALUES
    ('00000000-0000-4000-8000-000000000001', 'cus_a', 'sub_shared', 'active', 'monthly', now() + interval '30 days');
  -- Esto debe fallar (duplicate key value violates unique constraint
  -- "subscriptions_stripe_subscription_id_key"), aunque el user_id sea distinto:
  INSERT INTO public.subscriptions
    (user_id, stripe_customer_id, stripe_subscription_id, status, plan_interval, current_period_end)
  VALUES
    ('00000000-0000-4000-8000-000000000002', 'cus_b', 'sub_shared', 'active', 'monthly', now() + interval '30 days');
ROLLBACK;

-- Escenario de recálculo: un usuario con dos suscripciones, una vigente y una
-- expirada -- fn_recompute_plus_access_until debe quedarse con la vigente,
-- sin que la expirada (o un webhook tardío suyo) pueda reducir el acceso.
-- Requiere un user_id real de auth.users para satisfacer la FK -- sustituir
-- '<uid-real>' por uno de prueba antes de ejecutar.
-- BEGIN;
--   INSERT INTO public.subscriptions
--     (user_id, stripe_customer_id, stripe_subscription_id, status, plan_interval, current_period_end)
--   VALUES
--     ('<uid-real>', 'cus_old', 'sub_old_expired', 'canceled', 'monthly', now() - interval '5 days'),
--     ('<uid-real>', 'cus_new', 'sub_new_active', 'active', 'monthly', now() + interval '25 days');
--
--   SELECT public.fn_recompute_plus_access_until('<uid-real>');
--   -- Esperado: devuelve el current_period_end de sub_new_active (el futuro),
--   -- NO el de sub_old_expired.
--
--   SELECT plus_access_until FROM public.profiles WHERE id = '<uid-real>';
--   -- Esperado: coincide con el current_period_end de sub_new_active.
--
--   -- Simular un webhook tardío de la suscripción vieja que solo actualiza su
--   -- propia fila (sin tocar la nueva) y vuelve a recalcular:
--   UPDATE public.subscriptions SET current_period_end = now() - interval '10 days'
--     WHERE stripe_subscription_id = 'sub_old_expired';
--   SELECT public.fn_recompute_plus_access_until('<uid-real>');
--   -- Esperado: el resultado NO cambia (sigue siendo el de sub_new_active) --
--   -- el webhook tardío de la suscripción vieja no puede reducir el acceso.
-- ROLLBACK;
