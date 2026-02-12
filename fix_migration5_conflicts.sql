-- ============================================================================
-- FIX MIGRATION 5 CONFLICTS
-- Run this if you get "policy already exists" error
-- ============================================================================

-- Drop existing policies if they exist (to allow re-running migration 5)
DROP POLICY IF EXISTS "Users can view their own scenarios" ON public.financial_scenarios;
DROP POLICY IF EXISTS "Users can create their own scenarios" ON public.financial_scenarios;
DROP POLICY IF EXISTS "Users can update their own scenarios" ON public.financial_scenarios;
DROP POLICY IF EXISTS "Users can delete their own scenarios" ON public.financial_scenarios;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_auto_calculate_scenario_savings ON public.financial_scenarios;

-- Drop functions if they exist (CASCADE to drop dependencies)
DROP FUNCTION IF EXISTS public.auto_calculate_scenario_savings() CASCADE;
DROP FUNCTION IF EXISTS public.complete_scenario(UUID, NUMERIC, DATE) CASCADE;
DROP FUNCTION IF EXISTS public.calculate_scenario_commitments(UUID, DATE, DATE) CASCADE;
DROP FUNCTION IF EXISTS public.get_upcoming_scenarios(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_active_scenarios(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.calculate_monthly_savings_needed(NUMERIC, DATE) CASCADE;

-- Drop view if exists
DROP VIEW IF EXISTS public.scenario_summary CASCADE;

-- Drop indexes if they exist
DROP INDEX IF EXISTS public.idx_financial_scenarios_user_id;
DROP INDEX IF EXISTS public.idx_financial_scenarios_user_status;
DROP INDEX IF EXISTS public.idx_financial_scenarios_target_date;
DROP INDEX IF EXISTS public.idx_financial_scenarios_category;

-- Drop table if exists (CAREFUL: this deletes data!)
-- Only uncomment if you want to start fresh
-- DROP TABLE IF EXISTS public.financial_scenarios CASCADE;

-- ============================================================================
-- After running this, re-run migration 5 (supabase_migration_financial_scenarios.sql)
-- ============================================================================
