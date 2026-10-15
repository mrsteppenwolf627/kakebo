-- ROLLBACK de la migracion 7. Revoca (no borra) las concesiones legacy_full creadas por el backfill de Plus,
-- conservando la auditoria. Solo afecta a las filas con metadata.source = 'plus_activation_backfill'.
UPDATE public.access_grants
SET revoked_at = now()
WHERE grant_type = 'legacy_full' AND revoked_at IS NULL AND metadata ->> 'source' = 'plus_activation_backfill';
