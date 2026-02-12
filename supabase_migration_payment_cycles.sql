-- MIGRATION 1: Payment Cycles Table
-- DATE: 2026-02-12
-- PURPOSE: Support custom payroll-to-payroll cycles (not just calendar months)
-- AUTHOR: Kakebo Copilot Upgrade

-- ============================================================================
-- 1. CREATE PAYMENT_CYCLES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.payment_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Cycle configuration
  cycle_type TEXT NOT NULL CHECK (cycle_type IN ('calendar', 'payroll')),
  payroll_day INTEGER CHECK (payroll_day BETWEEN 1 AND 31),  -- Day of month for payroll (e.g., 25)

  -- Current cycle dates (auto-calculated based on config)
  current_cycle_start DATE NOT NULL,
  current_cycle_end DATE NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(user_id),  -- One active cycle configuration per user

  -- Validation: payroll_day required if cycle_type = 'payroll'
  CHECK (
    (cycle_type = 'calendar' AND payroll_day IS NULL) OR
    (cycle_type = 'payroll' AND payroll_day IS NOT NULL)
  )
);

-- ============================================================================
-- 2. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_payment_cycles_user_id
  ON public.payment_cycles(user_id);

CREATE INDEX IF NOT EXISTS idx_payment_cycles_dates
  ON public.payment_cycles(current_cycle_start, current_cycle_end);

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.payment_cycles ENABLE ROW LEVEL SECURITY;

-- Users can view their own cycle
CREATE POLICY "Users can view their own payment cycle"
  ON public.payment_cycles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own cycle (only if they don't have one)
CREATE POLICY "Users can create their own payment cycle"
  ON public.payment_cycles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own cycle
CREATE POLICY "Users can update their own payment cycle"
  ON public.payment_cycles FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own cycle
CREATE POLICY "Users can delete their own payment cycle"
  ON public.payment_cycles FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. HELPER FUNCTIONS
-- ============================================================================

-- Function: Calculate current cycle for a user
CREATE OR REPLACE FUNCTION public.get_current_cycle(p_user_id UUID)
RETURNS TABLE(
  cycle_start DATE,
  cycle_end DATE,
  days_remaining INTEGER,
  days_elapsed INTEGER,
  days_total INTEGER,
  cycle_type TEXT
) AS $$
DECLARE
  v_cycle_type TEXT;
  v_payroll_day INTEGER;
  v_today DATE := CURRENT_DATE;
  v_start DATE;
  v_end DATE;
BEGIN
  -- Get user's cycle configuration
  SELECT pc.cycle_type, pc.payroll_day
  INTO v_cycle_type, v_payroll_day
  FROM public.payment_cycles pc
  WHERE pc.user_id = p_user_id;

  -- If no configuration found, default to calendar month
  IF v_cycle_type IS NULL THEN
    v_cycle_type := 'calendar';
  END IF;

  -- Calculate cycle dates based on type
  IF v_cycle_type = 'calendar' THEN
    -- Calendar month: 1st to last day of month
    v_start := DATE_TRUNC('month', v_today);
    v_end := (DATE_TRUNC('month', v_today) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

  ELSIF v_cycle_type = 'payroll' THEN
    -- Payroll cycle: payroll_day to (payroll_day - 1) next month

    -- If today is before payroll day, cycle started last month
    IF EXTRACT(DAY FROM v_today) < v_payroll_day THEN
      v_start := (DATE_TRUNC('month', v_today) - INTERVAL '1 month')::DATE + (v_payroll_day - 1) * INTERVAL '1 day';
    ELSE
      v_start := DATE_TRUNC('month', v_today)::DATE + (v_payroll_day - 1) * INTERVAL '1 day';
    END IF;

    -- End is day before next payroll day
    v_end := (v_start + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  END IF;

  -- Return calculated values
  RETURN QUERY SELECT
    v_start,
    v_end,
    (v_end - v_today)::INTEGER,
    (v_today - v_start)::INTEGER,
    (v_end - v_start + 1)::INTEGER,
    v_cycle_type;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Auto-update cycle dates when configuration changes
CREATE OR REPLACE FUNCTION public.update_payment_cycle_dates()
RETURNS TRIGGER AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_start DATE;
  v_end DATE;
BEGIN
  -- Calculate new cycle dates based on updated config
  IF NEW.cycle_type = 'calendar' THEN
    v_start := DATE_TRUNC('month', v_today);
    v_end := (DATE_TRUNC('month', v_today) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

  ELSIF NEW.cycle_type = 'payroll' THEN
    IF EXTRACT(DAY FROM v_today) < NEW.payroll_day THEN
      v_start := (DATE_TRUNC('month', v_today) - INTERVAL '1 month')::DATE + (NEW.payroll_day - 1) * INTERVAL '1 day';
    ELSE
      v_start := DATE_TRUNC('month', v_today)::DATE + (NEW.payroll_day - 1) * INTERVAL '1 day';
    END IF;
    v_end := (v_start + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  END IF;

  -- Update dates
  NEW.current_cycle_start := v_start;
  NEW.current_cycle_end := v_end;
  NEW.updated_at := NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-calculate dates on insert/update
DROP TRIGGER IF EXISTS trigger_update_payment_cycle_dates ON public.payment_cycles;
CREATE TRIGGER trigger_update_payment_cycle_dates
  BEFORE INSERT OR UPDATE ON public.payment_cycles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_payment_cycle_dates();

-- ============================================================================
-- 5. BACKFILL EXISTING USERS WITH DEFAULT CALENDAR CYCLE
-- ============================================================================

-- Give all existing users a default calendar cycle
INSERT INTO public.payment_cycles (user_id, cycle_type, current_cycle_start, current_cycle_end)
SELECT
  au.id,
  'calendar',
  DATE_TRUNC('month', CURRENT_DATE)::DATE,
  (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE
FROM auth.users au
WHERE au.id NOT IN (SELECT user_id FROM public.payment_cycles)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- 6. COMMENTS
-- ============================================================================

COMMENT ON TABLE public.payment_cycles IS
  'User payment cycle configuration. Supports both calendar months and custom payroll-to-payroll cycles.';

COMMENT ON COLUMN public.payment_cycles.cycle_type IS
  'Type of cycle: "calendar" (1st-31st) or "payroll" (custom day-to-day)';

COMMENT ON COLUMN public.payment_cycles.payroll_day IS
  'Day of month when salary is received (1-31). Only used for payroll cycles.';

COMMENT ON FUNCTION public.get_current_cycle IS
  'Calculate current cycle dates, days remaining, and days elapsed for a user';
