-- MIGRATION: Add ai_confirm_writes setting (Fase 2.E)
-- DATE: 2026-09-14
-- DESCRIPTION:
-- Adds a persistent per-user preference to `user_settings`:
-- "Pedir confirmación antes de que la IA cambie mis datos".
--
-- - NOT NULL with DEFAULT true: Postgres backfills this value for every
--   existing row automatically when the column is added, so existing users
--   get the confirmation flow ENABLED by default, exactly like new users.
--   No separate backfill statement is needed or performed by this
--   migration, and no existing data is altered beyond adding this column.
-- - The application layer (src/lib/agents-v2/*) also treats a NULL/missing
--   value as "true" defensively, in case a row predates this migration in
--   an environment where it has not been applied yet.
--
-- SAFETY: this migration has NOT been run against any Supabase project by
-- the assistant. Idempotent: safe to run more than once (IF NOT EXISTS
-- guards throughout). Run it in the Supabase SQL Editor (or via the
-- Supabase CLI) of the target project when the owner decides to close
-- Fase 2.

-- 1. Add the column (NOT NULL DEFAULT true — applies to existing rows too).
ALTER TABLE IF EXISTS public.user_settings
  ADD COLUMN IF NOT EXISTS ai_confirm_writes boolean NOT NULL DEFAULT true;

-- 2. Audit trail / self-documentation.
COMMENT ON COLUMN public.user_settings.ai_confirm_writes IS
  'Fase 2.E: per-user preference — ask for confirmation before the AI copilot creates/edits/corrects data. Defaults to true (confirmation required) for both new and pre-existing users. Read by src/lib/agents-v2/stream-caller.ts before executing any write tool.';
