-- MIGRATION 6 — Plus foundation: reafirma de forma explícita los permisos de las funciones internas de acceso
-- DATE: 2026-10-13
-- ENVIRONMENT: NO aplicada en ningún entorno todavía. Para staging y, más adelante y con autorización, producción.
--
-- Motivo: `fn_recompute_plus_access_until` se redefinió con CREATE OR REPLACE (migración 4), que CONSERVA los
-- permisos previos de la función. En staging son correctos (solo service_role), pero la migración no los fijaba:
-- si en algún entorno la función original hubiera quedado con EXECUTE por defecto para anon/authenticated, un
-- usuario podría forzar el recálculo de plus_access_until de cualquier cuenta. Esta migración es IDEMPOTENTE y
-- no cambia nada donde los permisos ya son los correctos.
--
-- Rollback: supabase/rollback/plus/20261013140000_plus_harden_function_acl.rollback.sql (no-op documentado)

REVOKE ALL ON FUNCTION public.fn_recompute_plus_access_until(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_recompute_plus_access_until(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.fn_subscription_entitlement(uuid, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_subscription_entitlement(uuid, timestamptz) TO service_role;

REVOKE ALL ON FUNCTION public.fn_resolve_access_state(uuid, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_resolve_access_state(uuid, timestamptz) TO service_role;

REVOKE ALL ON FUNCTION public.fn_my_access() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_my_access() TO authenticated, service_role;
