-- MIGRATION 7 — Plus activation: backfill de `legacy_full` para los usuarios existentes
-- DATE: 2026-10-15
-- ENVIRONMENT: PREPARADA, NO APLICADA. Aplicar solo con autorización explícita, antes de encender PLUS_SUBSCRIPTIONS_ENABLED.
--
-- Decisión de producto: los usuarios que ya existen al activar Plus conservan el acceso completo (legacy_full, permanente).
-- Los usuarios que se registren después NO reciben ninguna concesión: empiezan en la capa gratuita (sin trial).
--
-- Qué hace:
--   * Inserta una concesión `legacy_full` activa (revoked_at IS NULL) para cada fila de `profiles` que aún no la tenga.
--   * Los usuarios con `trial_ends_at` vigente quedan marcados en `metadata` (`had_active_trial`, `trial_ends_at`) solo para
--     auditoría: `access_grants` no tiene fecha de caducidad ni otro `grant_type`, así que su concesión también es permanente
--     (es un superconjunto de "mantener el trial hasta su fin").
--   * `metadata` nunca contiene datos personales: solo origen, lote y fechas.
--
-- Idempotente: no duplica concesiones (el índice único parcial access_grants_one_active_per_type lo impide y además se filtra
-- con NOT EXISTS). Se puede ejecutar de nuevo para cubrir perfiles creados entre dos ejecuciones.
--
-- Rollback (revoca sin borrar, conserva auditoría):
--   UPDATE public.access_grants SET revoked_at = now()
--   WHERE grant_type = 'legacy_full' AND revoked_at IS NULL AND metadata ->> 'source' = 'plus_activation_backfill';

INSERT INTO public.access_grants (user_id, grant_type, metadata)
SELECT
  p.id,
  'legacy_full',
  jsonb_strip_nulls(jsonb_build_object(
    'source', 'plus_activation_backfill',
    'batch', '2026-10',
    'cutoff_at', now(),
    'had_active_trial', COALESCE(p.trial_ends_at > now(), false),
    'trial_ends_at', CASE WHEN p.trial_ends_at > now() THEN p.trial_ends_at END
  ))
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1
  FROM public.access_grants g
  WHERE g.user_id = p.id
    AND g.grant_type = 'legacy_full'
    AND g.revoked_at IS NULL
)
ON CONFLICT (user_id, grant_type) WHERE revoked_at IS NULL DO NOTHING;
