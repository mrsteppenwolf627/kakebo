-- Comprobaciones de seguridad SQL — Fase 3.B
--
-- ⚠️ ESTE ARCHIVO NO SE EJECUTA COMO PARTE DE `npm test`. Vitest no tiene acceso
-- a una base de datos Postgres real en este entorno (no hay `supabase/config.toml`
-- ni Docker local configurado -- confirmado en docs/planning/phase-3-monetizacion.md
-- §3.B.5). Estas comprobaciones son SQL real, pensado para ejecutarse manualmente
-- con `psql` o el editor SQL de Supabase, DESPUÉS de aplicar la migración
-- 20260916_phase3b_monetization_foundation.sql en un entorno de prueba (local con
-- Docker, o un proyecto Supabase de staging) -- nunca contra producción sin más.
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
-- Esperado: cero filas (tras aplicar la sección 9 de la migración).
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
--   SELECT public.fn_create_expense(NULL, current_date, 10, 'survival', 'test', NULL);
-- ROLLBACK;

-- =============================================================================
-- 6. UPDATE de profiles no permitido para authenticated (tras aplicar sección 10)
-- =============================================================================
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND privilege_type = 'UPDATE'
  AND grantee IN ('authenticated', 'anon');
-- Esperado: cero filas.

-- =============================================================================
-- 8. fn_create_expense — ciclo abierto, ciclo cerrado, ciclo ajeno
-- =============================================================================
-- Requiere ejecutarse en el contexto de sesión de un usuario de prueba real
-- (auth.uid() resuelto vía RLS, no un superusuario de psql) -- documentado aquí
-- como referencia de qué comprobar, no ejecutado en este entorno.
--
-- Preparación (como superusuario, fuera de la sesión de prueba):
--   -- mes abierto del propio usuario de prueba
--   INSERT INTO months (id, user_id, year, month, status) VALUES ('...', '<uid>', 2026, 5, 'open');
--   -- mes cerrado del propio usuario de prueba
--   INSERT INTO months (id, user_id, year, month, status) VALUES ('...', '<uid>', 2026, 4, 'closed');
--   -- mes de OTRO usuario (ajeno)
--   INSERT INTO months (id, user_id, year, month, status) VALUES ('...', '<otro-uid>', 2026, 5, 'open');
--
-- Con la sesión de <uid> activa (auth.uid() = <uid>):
--   -- Ciclo abierto propio: debe INSERTAR correctamente y devolver la fila.
--   SELECT * FROM fn_create_expense('<month-abierto-propio>', '2026-05-10', 10, 'survival', 'test', NULL);
--
--   -- Ciclo cerrado propio: debe fallar con 'El mes está cerrado' (ERRCODE KB002).
--   SELECT * FROM fn_create_expense('<month-cerrado-propio>', '2026-04-10', 10, 'survival', 'test', NULL);
--
--   -- Ciclo ajeno: debe fallar con 'Mes no válido' (ERRCODE KB002) -- el mismo
--   -- mensaje que "no existe", para no permitir distinguir ambos casos.
--   SELECT * FROM fn_create_expense('<month-ajeno>', '2026-05-10', 10, 'survival', 'test', NULL);
--
-- NOTA: antes de esta función, el endpoint manual (POST /api/expenses) aceptaba
-- un `month_id` enviado directamente por el cliente sin verificar propiedad si
-- el body ya lo incluía (solo se validaba ownership cuando el propio servidor
-- resolvía el mes a partir de la fecha) -- fn_create_expense cierra ese hueco
-- como defensa en profundidad, con independencia de lo que ya filtre la app.

-- =============================================================================
-- 7. search_path fijo en las funciones SECURITY DEFINER nuevas
-- =============================================================================
SELECT p.proname, p.proconfig
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('fn_create_expense', 'fn_resolve_access_state', 'handle_new_user');
-- Esperado: proconfig debe incluir 'search_path=public, pg_temp' para las tres.
