-- MIGRATION 1/5 — Plus subscriptions foundation: `access_grants`
-- DATE: 2026-10-13
-- ENVIRONMENT: probada en STAGING (gqnsanzsdnbufwicjtiw). NO aplicar en producción sin autorización explícita.
--
-- INERTE: crea una tabla vacía. No concede ni retira acceso a nadie y no cambia ningún comportamiento actual.
-- La concesión masiva de `legacy_full` NO está aquí: es un paso de activación posterior (corte = momento de activación).
--
-- Diseño de seguridad:
--   * Los clientes (anon/authenticated) solo pueden LEER sus propias filas (RLS). No tienen INSERT/UPDATE/DELETE.
--   * Solo service_role (y funciones SECURITY DEFINER) escriben.
--   * Un solo grant ACTIVO por (usuario, tipo): índice único parcial sobre revoked_at IS NULL.
--   * Un grant se revoca poniendo revoked_at (no se borra) para conservar auditoría.
--
-- Idempotente. Rollback: supabase/rollback/plus/20261013112936_plus_access_grants.rollback.sql

CREATE TABLE IF NOT EXISTS public.access_grants (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  grant_type  text        NOT NULL CHECK (grant_type IN ('legacy_full')),
  granted_at  timestamptz NOT NULL DEFAULT now(),
  revoked_at  timestamptz,
  metadata    jsonb       NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT access_grants_revoked_after_granted CHECK (revoked_at IS NULL OR revoked_at >= granted_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS access_grants_one_active_per_type
  ON public.access_grants (user_id, grant_type)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS access_grants_user_idx ON public.access_grants (user_id);

COMMENT ON TABLE public.access_grants IS
  'Plus foundation: concesiones de acceso permanentes (hoy solo legacy_full: usuarios previos a la activación). Lectura propia por RLS; escritura solo service_role. Vacía hasta la activación.';
COMMENT ON COLUMN public.access_grants.metadata IS
  'Datos de auditoría de la concesión (origen, fecha de corte, lote). Nunca datos personales.';

ALTER TABLE public.access_grants ENABLE ROW LEVEL SECURITY;

-- Privilegios explícitos: en Supabase las tablas nuevas de `public` reciben privilegios por defecto.
REVOKE ALL ON public.access_grants FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.access_grants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.access_grants TO service_role;

DROP POLICY IF EXISTS "Users can view their own access grants" ON public.access_grants;
CREATE POLICY "Users can view their own access grants"
  ON public.access_grants
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
