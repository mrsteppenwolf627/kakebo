-- MIGRATION: Add allow_collective_learning setting (Fase 2.G)
-- DATE: 2026-09-14
-- DESCRIPTION:
-- Adds a persistent per-user preference to `user_settings`: opt-in
-- (explicit, informed, revocable) consent to let the user's own
-- corrections/classifications contribute ANONYMIZED, MINIMIZED signals
-- (category/subcategory-level correction signal only — never free-text
-- note, amount, exact date, email, user id, or history) to collective
-- learning that can help suggestions for OTHER users.
--
-- - NOT NULL with DEFAULT false: Postgres backfills this value for every
--   existing row automatically when the column is added, so existing
--   users get collective learning DISABLED by default, exactly like new
--   users — matching the product requirement "por defecto, ningún usuario
--   participa en aprendizaje colectivo". No separate backfill statement is
--   needed or performed by this migration, and no existing data is
--   altered beyond adding this column.
-- - The application layer (src/lib/agents/tools/utils/
--   collective-learning-consent.ts) also treats a NULL/missing value as
--   "false" defensively (fail closed), in case a row predates this
--   migration in an environment where it has not been applied yet.
-- - PRIVACY CORRECTION (Fase 2.G follow-up): no active code path reads
--   this column today. The only collective-learning mechanism that
--   existed (merchant_rules global vote, via learn-from-correction.ts)
--   was disabled entirely — fail closed — because merchant_rules cannot
--   prove per-contribution provenance/consent and `merchant` is
--   user-entered text, not a minimized label. This column remains as a
--   stored preference for a FUTURE collective-learning design that
--   records provenance and verifiable consent per contribution (out of
--   scope here) — enabling it today does not share any data.
--
-- SAFETY: this migration has NOT been run against any Supabase project by
-- the assistant. Idempotent: safe to run more than once (IF NOT EXISTS
-- guards throughout). Run it in the Supabase SQL Editor (or via the
-- Supabase CLI) of the target project when the owner decides to close
-- Fase 2.

-- 1. Add the column (NOT NULL DEFAULT false — applies to existing rows too).
ALTER TABLE IF EXISTS public.user_settings
  ADD COLUMN IF NOT EXISTS allow_collective_learning boolean NOT NULL DEFAULT false;

-- 2. Audit trail / self-documentation.
COMMENT ON COLUMN public.user_settings.allow_collective_learning IS
  'Fase 2.G: per-user, explicit, revocable opt-in preference for a FUTURE collective-learning design (not yet built). Defaults to false for both new and pre-existing users. PRIVACY CORRECTION: no active code path currently reads this column or shares any data because of it — the merchant_rules global-vote mechanism that used to exist was disabled entirely (fail closed) since that table cannot prove per-contribution provenance/consent and merchant name is user-entered text, not a minimized label. See src/lib/agents/tools/utils/collective-learning-consent.ts for the (currently unused) helper kept ready for a future, properly-designed collective path.';
