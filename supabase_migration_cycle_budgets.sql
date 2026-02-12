-- MIGRATION 2: Cycle Budgets Table
-- DATE: 2026-02-12
-- PURPOSE: Budgets per cycle (not global). Supports historical tracking.
-- AUTHOR: Kakebo Copilot Upgrade

-- ============================================================================
-- 1. CREATE CYCLE_BUDGETS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cycle_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Cycle dates (denormalized for easy queries)
  cycle_start DATE NOT NULL,
  cycle_end DATE NOT NULL,

  -- Budgets by Kakebo category (in EUR)
  budget_supervivencia NUMERIC(10, 2) DEFAULT 0 CHECK (budget_supervivencia >= 0),
  budget_opcional NUMERIC(10, 2) DEFAULT 0 CHECK (budget_opcional >= 0),
  budget_cultura NUMERIC(10, 2) DEFAULT 0 CHECK (budget_cultura >= 0),
  budget_extra NUMERIC(10, 2) DEFAULT 0 CHECK (budget_extra >= 0),

  -- Total budget (auto-calculated)
  total_budget NUMERIC(10, 2) GENERATED ALWAYS AS (
    budget_supervivencia + budget_opcional + budget_cultura + budget_extra
  ) STORED,

  -- Savings target for this cycle
  savings_target NUMERIC(10, 2) DEFAULT 0 CHECK (savings_target >= 0),

  -- Notes for this cycle
  notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(user_id, cycle_start),  -- One budget per cycle per user
  CHECK (cycle_end > cycle_start)  -- End must be after start
);

-- ============================================================================
-- 2. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_cycle_budgets_user_id
  ON public.cycle_budgets(user_id);

CREATE INDEX IF NOT EXISTS idx_cycle_budgets_user_dates
  ON public.cycle_budgets(user_id, cycle_start DESC);

CREATE INDEX IF NOT EXISTS idx_cycle_budgets_dates
  ON public.cycle_budgets(cycle_start, cycle_end);

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.cycle_budgets ENABLE ROW LEVEL SECURITY;

-- Users can view their own budgets
CREATE POLICY "Users can view their own cycle budgets"
  ON public.cycle_budgets FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own budgets
CREATE POLICY "Users can create their own cycle budgets"
  ON public.cycle_budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own budgets
CREATE POLICY "Users can update their own cycle budgets"
  ON public.cycle_budgets FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own budgets
CREATE POLICY "Users can delete their own cycle budgets"
  ON public.cycle_budgets FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. HELPER FUNCTIONS
-- ============================================================================

-- Function: Get budget for a specific cycle
CREATE OR REPLACE FUNCTION public.get_cycle_budget(
  p_user_id UUID,
  p_cycle_start DATE,
  p_cycle_end DATE
)
RETURNS public.cycle_budgets AS $$
DECLARE
  v_budget public.cycle_budgets;
BEGIN
  -- Try to find existing budget for this cycle
  SELECT *
  INTO v_budget
  FROM public.cycle_budgets
  WHERE user_id = p_user_id
    AND cycle_start = p_cycle_start
    AND cycle_end = p_cycle_end;

  -- If not found, try to get most recent budget to use as template
  IF v_budget IS NULL THEN
    SELECT *
    INTO v_budget
    FROM public.cycle_budgets
    WHERE user_id = p_user_id
    ORDER BY cycle_start DESC
    LIMIT 1;
  END IF;

  RETURN v_budget;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get or create budget for current cycle
CREATE OR REPLACE FUNCTION public.get_or_create_current_budget(p_user_id UUID)
RETURNS public.cycle_budgets AS $$
DECLARE
  v_cycle RECORD;
  v_budget public.cycle_budgets;
  v_last_budget public.cycle_budgets;
BEGIN
  -- Get current cycle dates
  SELECT * INTO v_cycle
  FROM public.get_current_cycle(p_user_id)
  LIMIT 1;

  -- Try to find budget for current cycle
  SELECT *
  INTO v_budget
  FROM public.cycle_budgets
  WHERE user_id = p_user_id
    AND cycle_start = v_cycle.cycle_start
    AND cycle_end = v_cycle.cycle_end;

  -- If found, return it
  IF v_budget IS NOT NULL THEN
    RETURN v_budget;
  END IF;

  -- Not found: create new budget based on last cycle's budget (or defaults)
  SELECT *
  INTO v_last_budget
  FROM public.cycle_budgets
  WHERE user_id = p_user_id
  ORDER BY cycle_start DESC
  LIMIT 1;

  -- Create new budget
  INSERT INTO public.cycle_budgets (
    user_id,
    cycle_start,
    cycle_end,
    budget_supervivencia,
    budget_opcional,
    budget_cultura,
    budget_extra,
    savings_target
  )
  VALUES (
    p_user_id,
    v_cycle.cycle_start,
    v_cycle.cycle_end,
    COALESCE(v_last_budget.budget_supervivencia, 0),
    COALESCE(v_last_budget.budget_opcional, 0),
    COALESCE(v_last_budget.budget_cultura, 0),
    COALESCE(v_last_budget.budget_extra, 0),
    COALESCE(v_last_budget.savings_target, 0)
  )
  RETURNING * INTO v_budget;

  RETURN v_budget;
END;
$$ LANGUAGE plpgsql;

-- Function: Update timestamp on row update
CREATE OR REPLACE FUNCTION public.update_cycle_budgets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at
DROP TRIGGER IF EXISTS trigger_cycle_budgets_updated_at ON public.cycle_budgets;
CREATE TRIGGER trigger_cycle_budgets_updated_at
  BEFORE UPDATE ON public.cycle_budgets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_cycle_budgets_updated_at();

-- ============================================================================
-- 5. MIGRATE DATA FROM user_settings TO cycle_budgets
-- ============================================================================

-- For all users with budgets in user_settings, create a cycle_budget for current cycle
INSERT INTO public.cycle_budgets (
  user_id,
  cycle_start,
  cycle_end,
  budget_supervivencia,
  budget_opcional,
  budget_cultura,
  budget_extra,
  savings_target
)
SELECT
  us.user_id,
  pc.current_cycle_start,
  pc.current_cycle_end,
  COALESCE(us.budget_supervivencia, 0),
  COALESCE(us.budget_opcional, 0),
  COALESCE(us.budget_cultura, 0),
  COALESCE(us.budget_extra, 0),
  COALESCE(us.monthly_saving_goal, 0)
FROM public.user_settings us
JOIN public.payment_cycles pc ON pc.user_id = us.user_id
WHERE (
  us.budget_supervivencia IS NOT NULL OR
  us.budget_opcional IS NOT NULL OR
  us.budget_cultura IS NOT NULL OR
  us.budget_extra IS NOT NULL OR
  us.monthly_saving_goal IS NOT NULL
)
ON CONFLICT (user_id, cycle_start) DO UPDATE SET
  budget_supervivencia = EXCLUDED.budget_supervivencia,
  budget_opcional = EXCLUDED.budget_opcional,
  budget_cultura = EXCLUDED.budget_cultura,
  budget_extra = EXCLUDED.budget_extra,
  savings_target = EXCLUDED.savings_target;

-- ============================================================================
-- 6. COMMENTS
-- ============================================================================

COMMENT ON TABLE public.cycle_budgets IS
  'Budget configuration per cycle (not global). Supports historical tracking and cycle-specific budgets.';

COMMENT ON COLUMN public.cycle_budgets.cycle_start IS
  'Start date of the cycle (inclusive)';

COMMENT ON COLUMN public.cycle_budgets.cycle_end IS
  'End date of the cycle (inclusive)';

COMMENT ON COLUMN public.cycle_budgets.total_budget IS
  'Auto-calculated sum of all category budgets';

COMMENT ON COLUMN public.cycle_budgets.savings_target IS
  'Amount the user wants to save during this cycle';

COMMENT ON FUNCTION public.get_or_create_current_budget IS
  'Get budget for current cycle, creating it from last cycle if it doesn''t exist';
