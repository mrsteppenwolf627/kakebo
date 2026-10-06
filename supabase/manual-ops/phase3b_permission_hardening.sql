-- ⚠️⚠️⚠️  NO EJECUTAR AUTOMÁTICAMENTE. NO FORMA PARTE DE supabase/migrations/.  ⚠️⚠️⚠️
--
-- Endurecimiento de permisos de `expenses`/`profiles` — Fase 3.B.
--
-- Este script se ejecuta MANUALMENTE, una sola vez, el día de lanzamiento --
-- NUNCA como parte de aplicar la migración base
-- (supabase/migrations/20260916_phase3b_monetization_foundation.sql), que
-- deliberadamente no contiene ningún REVOKE ni DROP POLICY. Un comentario
-- "pendiente de preflight" dentro de una migración no impide su ejecución al
-- aplicarla -- por eso este cierre de permisos vive en un archivo aparte que
-- ningún pipeline ni `supabase db push` ejecuta automáticamente.
--
-- ORDEN DE APLICACIÓN OBLIGATORIO (no negociable):
--   1. La migración base ya está aplicada (columnas, tablas, funciones RPC).
--   2. Las tres rutas que llaman a fn_create_expense (POST /api/expenses,
--      el asistente legado en /api/ai/assistant, y agent-v2/streaming vía
--      create-transaction.ts) están DESPLEGADAS y VERIFICADAS en producción
--      -- confirmado creando un gasto de prueba real por cada canal.
--   3. Solo entonces se ejecuta este script.
-- Si se ejecuta antes del paso 2, la creación de gastos se rompe por completo
-- para todos los usuarios (ni el INSERT directo antiguo ni la RPC nueva
-- estarían disponibles a la vez).
--
-- ═══════════════════════════════════════════════════════════════════════════
-- PREFLIGHT OBLIGATORIO — ejecutar y revisar el resultado ANTES de la sección
-- de cambios más abajo. No continuar si alguna respuesta no es la esperada.
-- ═══════════════════════════════════════════════════════════════════════════

-- Preflight 1: confirmar que el grant INSERT sobre expenses existe hoy tal
-- como sugiere supabase/migrations/20260217_security_audit.sql (que lo
-- concedió explícitamente) -- no asumirlo solo por ese archivo.
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'expenses'
  AND privilege_type = 'INSERT'
  AND grantee IN ('authenticated', 'anon');
-- Esperado antes de aplicar: al menos una fila con grantee='authenticated'
-- (confirma que hay algo real que revocar, no una revocación de un grant
-- que ya no existía).

-- Preflight 2: ningún trigger BEFORE/AFTER INSERT sobre expenses debe
-- depender de que `authenticated` tenga ese grant directo.
SELECT tgname, pg_get_triggerdef(oid) AS def
FROM pg_trigger
WHERE tgrelid = 'public.expenses'::regclass AND NOT tgisinternal;
-- Revisar manualmente cada trigger listado -- ninguno debería asumir que el
-- INSERT llega directamente de `authenticated` sin pasar por fn_create_expense.

-- Preflight 3: ningún trigger BEFORE/AFTER UPDATE sobre profiles debe
-- depender de que `authenticated` pueda escribir directamente.
SELECT tgname, pg_get_triggerdef(oid) AS def
FROM pg_trigger
WHERE tgrelid = 'public.profiles'::regclass AND NOT tgisinternal;

-- Preflight 4: listado COMPLETO de políticas sobre profiles, sin filtrar --
-- para no pasar por alto una política RESTRICTIVE no vista en auditorías
-- previas.
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles';

-- Preflight 5: column_privileges reales de profiles en este momento
-- (podrían haber cambiado desde cualquier auditoría de referencia anterior).
SELECT grantee, column_name, privilege_type
FROM information_schema.column_privileges
WHERE table_schema = 'public' AND table_name = 'profiles'
  AND grantee IN ('authenticated', 'anon')
ORDER BY grantee, column_name;

-- Preflight 6 (verificación funcional, no solo de catálogo): confirmar que
-- las tres rutas de creación de gastos ya usan fn_create_expense en el
-- código actualmente desplegado -- comprobación manual fuera de SQL, por
-- ejemplo grepeando el deploy activo o probando cada canal end-to-end.

-- ═══════════════════════════════════════════════════════════════════════════
-- CAMBIOS — solo si TODO el preflight anterior se revisó y no reveló ningún
-- hallazgo bloqueante. Requiere aprobación manual explícita del propietario
-- antes de descomentar y ejecutar lo siguiente.
-- ═══════════════════════════════════════════════════════════════════════════

-- BEGIN;
--
-- -- Cierre del INSERT directo en expenses: única vía de creación posible a
-- -- partir de aquí es fn_create_expense (SECURITY DEFINER, no depende de
-- -- este grant). La lectura (SELECT) y la edición/borrado de un gasto
-- -- existente (UPDATE/DELETE vía PATCH/DELETE /api/expenses/[id]) NO se
-- -- tocan -- esta sección se limita estrictamente a INSERT.
-- REVOKE INSERT ON public.expenses FROM authenticated, anon;
--
-- -- Cierre del UPDATE directo en profiles: no tiene hoy ninguna columna
-- -- pensada para edición de usuario (las preferencias reales viven en
-- -- user_settings, tabla aparte con su propio PATCH /api/settings).
-- REVOKE UPDATE ON public.profiles FROM authenticated, anon;
-- DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
--
-- COMMIT;

-- Verificación posterior recomendada (fuera de la transacción, de solo
-- lectura): repetir los Preflight 1 y 5 -- deben devolver CERO filas para
-- `authenticated`/`anon` tras el COMMIT.
