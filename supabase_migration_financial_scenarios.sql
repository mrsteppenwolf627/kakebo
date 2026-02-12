-- MIGRATION 5: Financial Scenarios Table
-- DATE: 2026-02-12
-- PURPOSE: Store "what-if" scenarios and financial plans for future expenses
-- AUTHOR: Kakebo Copilot Upgrade

-- ============================================================================
-- 1. CREATE FINANCIAL_SCENARIOS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.financial_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Scenario details
  name TEXT NOT NULL,  -- "Vacaciones en Agosto", "Curso de React", "Nueva laptop"
  description TEXT,

  -- Financial impact
  estimated_cost NUMERIC(10, 2) NOT NULL CHECK (estimated_cost >= 0),
  category TEXT NOT NULL CHECK (category IN ('survival', 'optional', 'culture', 'extra')),
  target_date DATE,  -- When the expense is planned

  -- Status tracking
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),

  -- Actual result (when completed)
  actual_cost NUMERIC(10, 2) CHECK (actual_cost >= 0),
  actual_date DATE,

  -- Linked transactions (if scenario becomes real)
  linked_expense_ids UUID[],  -- Array of expense IDs related to this scenario

  -- Savings plan
  monthly_savings_needed NUMERIC(10, 2),  -- Auto-calculated based on target_date
  current_savings NUMERIC(10, 2) DEFAULT 0,  -- How much saved so far

  -- Notes
  notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Validation
  CHECK (actual_cost IS NULL OR status = 'completed'),
  CHECK (actual_date IS NULL OR status = 'completed')
);

-- ============================================================================
-- 2. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_financial_scenarios_user_id
  ON public.financial_scenarios(user_id);

CREATE INDEX IF NOT EXISTS idx_financial_scenarios_user_status
  ON public.financial_scenarios(user_id, status);

CREATE INDEX IF NOT EXISTS idx_financial_scenarios_target_date
  ON public.financial_scenarios(target_date)
  WHERE status IN ('planned', 'in_progress');

CREATE INDEX IF NOT EXISTS idx_financial_scenarios_category
  ON public.financial_scenarios(user_id, category);

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.financial_scenarios ENABLE ROW LEVEL SECURITY;

-- Users can view their own scenarios
CREATE POLICY "Users can view their own scenarios"
  ON public.financial_scenarios FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own scenarios
CREATE POLICY "Users can create their own scenarios"
  ON public.financial_scenarios FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own scenarios
CREATE POLICY "Users can update their own scenarios"
  ON public.financial_scenarios FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own scenarios
CREATE POLICY "Users can delete their own scenarios"
  ON public.financial_scenarios FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. HELPER FUNCTIONS
-- ============================================================================

-- Function: Calculate monthly savings needed
CREATE OR REPLACE FUNCTION public.calculate_monthly_savings_needed(
  p_estimated_cost NUMERIC,
  p_target_date DATE
)
RETURNS NUMERIC AS $$
DECLARE
  v_months_remaining INTEGER;
BEGIN
  -- Calculate months remaining until target date
  v_months_remaining := EXTRACT(YEAR FROM AGE(p_target_date, CURRENT_DATE)) * 12 +
                        EXTRACT(MONTH FROM AGE(p_target_date, CURRENT_DATE));

  -- Avoid division by zero
  IF v_months_remaining <= 0 THEN
    RETURN p_estimated_cost;  -- Need to save all at once
  END IF;

  RETURN ROUND(p_estimated_cost / v_months_remaining, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Get active scenarios for user
CREATE OR REPLACE FUNCTION public.get_active_scenarios(p_user_id UUID)
RETURNS SETOF public.financial_scenarios AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.financial_scenarios
  WHERE user_id = p_user_id
    AND status IN ('planned', 'in_progress')
  ORDER BY target_date ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get upcoming scenarios (next 3 months)
CREATE OR REPLACE FUNCTION public.get_upcoming_scenarios(p_user_id UUID)
RETURNS SETOF public.financial_scenarios AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.financial_scenarios
  WHERE user_id = p_user_id
    AND status IN ('planned', 'in_progress')
    AND target_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '3 months')
  ORDER BY target_date ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Calculate total financial commitments for a period
CREATE OR REPLACE FUNCTION public.calculate_scenario_commitments(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(
  category TEXT,
  total_estimated_cost NUMERIC,
  total_savings_needed NUMERIC,
  scenario_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fs.category,
    SUM(fs.estimated_cost)::NUMERIC as total_cost,
    SUM(fs.monthly_savings_needed)::NUMERIC as total_savings,
    COUNT(*)::BIGINT as count
  FROM public.financial_scenarios fs
  WHERE fs.user_id = p_user_id
    AND fs.status IN ('planned', 'in_progress')
    AND fs.target_date BETWEEN p_start_date AND p_end_date
  GROUP BY fs.category
  ORDER BY SUM(fs.estimated_cost) DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Mark scenario as completed
CREATE OR REPLACE FUNCTION public.complete_scenario(
  p_scenario_id UUID,
  p_actual_cost NUMERIC,
  p_actual_date DATE DEFAULT CURRENT_DATE
)
RETURNS public.financial_scenarios AS $$
DECLARE
  v_scenario public.financial_scenarios;
BEGIN
  UPDATE public.financial_scenarios
  SET
    status = 'completed',
    actual_cost = p_actual_cost,
    actual_date = p_actual_date,
    updated_at = NOW()
  WHERE id = p_scenario_id
  RETURNING * INTO v_scenario;

  RETURN v_scenario;
END;
$$ LANGUAGE plpgsql;

-- Function: Auto-calculate monthly_savings_needed on insert/update
CREATE OR REPLACE FUNCTION public.auto_calculate_scenario_savings()
RETURNS TRIGGER AS $$
BEGIN
  -- Only calculate if target_date is set
  IF NEW.target_date IS NOT NULL THEN
    NEW.monthly_savings_needed := public.calculate_monthly_savings_needed(
      NEW.estimated_cost,
      NEW.target_date
    );
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-calculate savings on insert/update
DROP TRIGGER IF EXISTS trigger_auto_calculate_scenario_savings ON public.financial_scenarios;
CREATE TRIGGER trigger_auto_calculate_scenario_savings
  BEFORE INSERT OR UPDATE ON public.financial_scenarios
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_calculate_scenario_savings();

-- ============================================================================
-- 5. VIEW: Scenario Summary per User
-- ============================================================================

CREATE OR REPLACE VIEW public.scenario_summary AS
SELECT
  user_id,
  COUNT(*) FILTER (WHERE status = 'planned') as planned_count,
  COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_count,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
  SUM(estimated_cost) FILTER (WHERE status IN ('planned', 'in_progress')) as total_planned_cost,
  SUM(actual_cost) FILTER (WHERE status = 'completed') as total_actual_cost,
  SUM(current_savings) FILTER (WHERE status IN ('planned', 'in_progress')) as total_savings_so_far
FROM public.financial_scenarios
GROUP BY user_id;

-- RLS for view
ALTER VIEW public.scenario_summary SET (security_invoker = true);

-- ============================================================================
-- 6. COMMENTS
-- ============================================================================

COMMENT ON TABLE public.financial_scenarios IS
  'Financial scenarios and "what-if" planning. Tracks planned future expenses, savings progress, and actual outcomes.';

COMMENT ON COLUMN public.financial_scenarios.name IS
  'Short name for the scenario (e.g., "Vacaciones Agosto 2026")';

COMMENT ON COLUMN public.financial_scenarios.estimated_cost IS
  'Estimated cost of the scenario (in EUR)';

COMMENT ON COLUMN public.financial_scenarios.monthly_savings_needed IS
  'Auto-calculated: how much to save per month to reach target by target_date';

COMMENT ON COLUMN public.financial_scenarios.current_savings IS
  'How much the user has saved so far for this scenario';

COMMENT ON COLUMN public.financial_scenarios.linked_expense_ids IS
  'Array of expense IDs if scenario was completed and expenses were created';

COMMENT ON FUNCTION public.calculate_monthly_savings_needed IS
  'Calculate how much to save per month to reach a target cost by a target date';

COMMENT ON FUNCTION public.get_upcoming_scenarios IS
  'Get scenarios with target dates in the next 3 months';

COMMENT ON VIEW public.scenario_summary IS
  'Summary statistics per user: count of scenarios by status, total costs, total savings';
