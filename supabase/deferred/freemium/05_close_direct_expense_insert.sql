-- DEFERRED / FREEMIUM 05 — Cierra el INSERT directo en `expenses`
-- ⚠️ NO FORMA PARTE DE supabase/migrations/. NO SE EJECUTA AUTOMÁTICAMENTE. NO aplicar todavía.
-- Ver supabase/deferred/freemium/README.md y supabase/manual-ops/phase3b_permission_hardening.sql.
--
-- Una vez activo el límite (03), el INSERT directo en `expenses` desde el cliente permitiría saltarse
-- el contador. Este script lo revoca: a partir de aquí la ÚNICA vía de creación es fn_create_expense
-- (SECURITY DEFINER; no depende de este grant). SELECT/UPDATE/DELETE no se tocan.
--
-- NUNCA en modo compatible: si fn_create_expense no está en modo freemium, el script se niega a
-- ejecutarse. Si las rutas de la app no usan fn_create_expense, la creación de gastos se rompería.
-- Revertir con rollback_freemium.sql (restituye el GRANT INSERT).

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
BEGIN
  IF coalesce(obj_description('public.fn_create_expense(uuid, date, numeric, text, text, text, text)'::regprocedure, 'pg_proc'), '')
       NOT LIKE 'MODE: freemium%' THEN
    RAISE EXCEPTION 'fn_create_expense no está en modo freemium (03 no aplicado). No se cierra el INSERT directo.';
  END IF;
END
$pre$;

REVOKE INSERT ON public.expenses FROM authenticated, anon;

COMMIT;
