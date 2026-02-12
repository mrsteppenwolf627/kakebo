-- MIGRATION 6: Deprecate user_settings budget columns
-- DATE: 2026-02-12
-- PURPOSE: Mark old budget columns as deprecated, add migration notes
-- AUTHOR: Kakebo Copilot Upgrade

-- ============================================================================
-- IMPORTANT: This migration does NOT drop columns to maintain backwards compatibility
-- ============================================================================

-- Add comments to deprecated columns in user_settings
COMMENT ON COLUMN public.user_settings.budget_supervivencia IS
  'DEPRECATED: Use cycle_budgets table instead. This column is kept for backwards compatibility only.';

COMMENT ON COLUMN public.user_settings.budget_opcional IS
  'DEPRECATED: Use cycle_budgets table instead. This column is kept for backwards compatibility only.';

COMMENT ON COLUMN public.user_settings.budget_cultura IS
  'DEPRECATED: Use cycle_budgets table instead. This column is kept for backwards compatibility only.';

COMMENT ON COLUMN public.user_settings.budget_extra IS
  'DEPRECATED: Use cycle_budgets table instead. This column is kept for backwards compatibility only.';

COMMENT ON COLUMN public.user_settings.monthly_saving_goal IS
  'DEPRECATED: Use cycle_budgets.savings_target instead. This column is kept for backwards compatibility only.';

-- Add general table comment
COMMENT ON TABLE public.user_settings IS
  'User settings and configuration. NOTE: Budget columns are deprecated - use cycle_budgets table for per-cycle budgets.';

-- ============================================================================
-- FUTURE CLEANUP (to be run after all code is migrated)
-- ============================================================================

-- Uncomment these lines AFTER all application code has been migrated to use cycle_budgets:

-- ALTER TABLE public.user_settings DROP COLUMN IF EXISTS budget_supervivencia;
-- ALTER TABLE public.user_settings DROP COLUMN IF EXISTS budget_opcional;
-- ALTER TABLE public.user_settings DROP COLUMN IF EXISTS budget_cultura;
-- ALTER TABLE public.user_settings DROP COLUMN IF EXISTS budget_extra;
-- ALTER TABLE public.user_settings DROP COLUMN IF EXISTS monthly_saving_goal;
