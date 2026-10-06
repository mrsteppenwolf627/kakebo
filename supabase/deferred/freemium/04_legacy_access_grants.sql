-- DEFERRED / FREEMIUM 04 — Conservar el acceso de los usuarios existentes (legacy_full)
-- ⚠️ NO FORMA PARTE DE supabase/migrations/. NO SE EJECUTA AUTOMÁTICAMENTE. NO aplicar todavía.
-- Ver supabase/deferred/freemium/README.md y docs/planning/phase3b-migration-runbook.md.
--
-- Concede `legacy_full` a TODOS los perfiles que existan en el momento de ejecutar el script, para
-- que NINGÚN usuario actual pierda funciones (límite, IA, PDF) cuando se active el modelo freemium.
-- Cubre por igual: usuarios con tier free o pro, con manual_override, con trial_ends_at NULL o
-- caducado, y con suscripciones Stripe existentes.
--   * IDEMPOTENTE: el índice único parcial + ON CONFLICT DO NOTHING impiden duplicados.
--   * NO modifica profiles (ni tier, manual_override, trial_ends_at, is_founder, plus_access_until)
--     ni suscripciones. Solo inserta filas en access_grants.
--   * Ejecutar INMEDIATAMENTE ANTES de 03_enforce_expense_limit.sql; si entran usuarios entre
--     ambos, repetirlo (es seguro) antes del 03.

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
  IF to_regclass('public.access_grants') IS NULL THEN
    RAISE EXCEPTION 'Falta 01_access_foundation.sql (tabla access_grants).';
  END IF;
END
$pre$;

INSERT INTO public.access_grants (user_id, grant_type, reason)
SELECT p.id,
       'legacy_full',
       'Usuario existente antes de la activación freemium'
         || CASE WHEN p.manual_override IS TRUE THEN ' (manual_override)' ELSE '' END
FROM public.profiles p
ON CONFLICT (user_id, grant_type) WHERE revoked_at IS NULL DO NOTHING;

COMMIT;
