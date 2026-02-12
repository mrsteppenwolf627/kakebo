-- ============================================================================
-- VERIFICATION QUERIES - Check migration status
-- ============================================================================

-- 1. Check if financial_scenarios table exists
SELECT
  EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'financial_scenarios'
  ) as financial_scenarios_exists;

-- 2. Check RLS policies on financial_scenarios
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'financial_scenarios'
ORDER BY policyname;

-- 3. Check if functions exist
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'calculate_monthly_savings_needed',
    'get_active_scenarios',
    'get_upcoming_scenarios',
    'calculate_scenario_commitments',
    'complete_scenario',
    'auto_calculate_scenario_savings'
  )
ORDER BY routine_name;

-- 4. Check if scenario_summary view exists
SELECT
  EXISTS (
    SELECT FROM information_schema.views
    WHERE table_schema = 'public'
    AND table_name = 'scenario_summary'
  ) as scenario_summary_view_exists;

-- 5. Count rows in financial_scenarios (should be 0 if just created)
SELECT COUNT(*) as row_count FROM public.financial_scenarios;

-- 6. Check all migrations status
SELECT
  EXISTS(SELECT FROM information_schema.tables WHERE table_name = 'payment_cycles') as migration1_payment_cycles,
  EXISTS(SELECT FROM information_schema.tables WHERE table_name = 'cycle_budgets') as migration2_cycle_budgets,
  EXISTS(SELECT FROM information_schema.tables WHERE table_name = 'alert_settings') as migration3_alert_settings,
  EXISTS(SELECT FROM information_schema.tables WHERE table_name = 'kakebo_reflections') as migration4_reflections,
  EXISTS(SELECT FROM information_schema.tables WHERE table_name = 'financial_scenarios') as migration5_scenarios;
