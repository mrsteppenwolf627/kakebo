-- MIGRATION 3: Alert Settings Table
-- DATE: 2026-02-12
-- PURPOSE: Configurable alert thresholds per user and category
-- AUTHOR: Kakebo Copilot Upgrade

-- ============================================================================
-- 1. CREATE ALERT_SETTINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.alert_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Global alert thresholds (percentage of budget)
  warning_threshold INTEGER DEFAULT 70 CHECK (warning_threshold BETWEEN 1 AND 100),
  critical_threshold INTEGER DEFAULT 90 CHECK (critical_threshold BETWEEN 1 AND 100),

  -- Per-category overrides (optional, null = use global threshold)
  survival_warning INTEGER CHECK (survival_warning IS NULL OR (survival_warning BETWEEN 1 AND 100)),
  survival_critical INTEGER CHECK (survival_critical IS NULL OR (survival_critical BETWEEN 1 AND 100)),

  optional_warning INTEGER CHECK (optional_warning IS NULL OR (optional_warning BETWEEN 1 AND 100)),
  optional_critical INTEGER CHECK (optional_critical IS NULL OR (optional_critical BETWEEN 1 AND 100)),

  culture_warning INTEGER CHECK (culture_warning IS NULL OR (culture_warning BETWEEN 1 AND 100)),
  culture_critical INTEGER CHECK (culture_critical IS NULL OR (culture_critical BETWEEN 1 AND 100)),

  extra_warning INTEGER CHECK (extra_warning IS NULL OR (extra_warning BETWEEN 1 AND 100)),
  extra_critical INTEGER CHECK (extra_critical IS NULL OR (extra_critical BETWEEN 1 AND 100)),

  -- Notification preferences
  daily_summary_enabled BOOLEAN DEFAULT false,
  weekly_summary_enabled BOOLEAN DEFAULT true,
  monthly_summary_enabled BOOLEAN DEFAULT true,
  anomaly_alerts_enabled BOOLEAN DEFAULT true,
  budget_alerts_enabled BOOLEAN DEFAULT true,

  -- Summary delivery time (24h format)
  daily_summary_time TIME DEFAULT '20:00',  -- 8 PM
  weekly_summary_day INTEGER DEFAULT 0 CHECK (weekly_summary_day BETWEEN 0 AND 6),  -- 0 = Sunday

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(user_id),  -- One settings record per user
  CHECK (critical_threshold >= warning_threshold)  -- Critical must be >= warning
);

-- ============================================================================
-- 2. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_alert_settings_user_id
  ON public.alert_settings(user_id);

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.alert_settings ENABLE ROW LEVEL SECURITY;

-- Users can view their own alert settings
CREATE POLICY "Users can view their own alert settings"
  ON public.alert_settings FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own alert settings
CREATE POLICY "Users can create their own alert settings"
  ON public.alert_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own alert settings
CREATE POLICY "Users can update their own alert settings"
  ON public.alert_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own alert settings
CREATE POLICY "Users can delete their own alert settings"
  ON public.alert_settings FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. HELPER FUNCTIONS
-- ============================================================================

-- Function: Get alert thresholds for a category
CREATE OR REPLACE FUNCTION public.get_alert_thresholds(
  p_user_id UUID,
  p_category TEXT
)
RETURNS TABLE(
  warning_threshold INTEGER,
  critical_threshold INTEGER
) AS $$
DECLARE
  v_settings public.alert_settings;
  v_warning INTEGER;
  v_critical INTEGER;
BEGIN
  -- Get user's alert settings
  SELECT *
  INTO v_settings
  FROM public.alert_settings
  WHERE user_id = p_user_id;

  -- If no settings found, use defaults
  IF v_settings IS NULL THEN
    RETURN QUERY SELECT 70::INTEGER, 90::INTEGER;
    RETURN;
  END IF;

  -- Get category-specific thresholds or fall back to global
  CASE p_category
    WHEN 'survival', 'supervivencia' THEN
      v_warning := COALESCE(v_settings.survival_warning, v_settings.warning_threshold);
      v_critical := COALESCE(v_settings.survival_critical, v_settings.critical_threshold);

    WHEN 'optional', 'opcional' THEN
      v_warning := COALESCE(v_settings.optional_warning, v_settings.warning_threshold);
      v_critical := COALESCE(v_settings.optional_critical, v_settings.critical_threshold);

    WHEN 'culture', 'cultura' THEN
      v_warning := COALESCE(v_settings.culture_warning, v_settings.warning_threshold);
      v_critical := COALESCE(v_settings.culture_critical, v_settings.critical_threshold);

    WHEN 'extra' THEN
      v_warning := COALESCE(v_settings.extra_warning, v_settings.warning_threshold);
      v_critical := COALESCE(v_settings.extra_critical, v_settings.critical_threshold);

    ELSE
      -- Unknown category: use global
      v_warning := v_settings.warning_threshold;
      v_critical := v_settings.critical_threshold;
  END CASE;

  RETURN QUERY SELECT v_warning, v_critical;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get budget status level based on percentage
CREATE OR REPLACE FUNCTION public.get_budget_status_level(
  p_percentage NUMERIC,
  p_user_id UUID,
  p_category TEXT
)
RETURNS TEXT AS $$
DECLARE
  v_warning INTEGER;
  v_critical INTEGER;
BEGIN
  -- Get thresholds for this user and category
  SELECT warning_threshold, critical_threshold
  INTO v_warning, v_critical
  FROM public.get_alert_thresholds(p_user_id, p_category);

  -- Determine status
  IF p_percentage >= v_critical THEN
    RETURN 'critical';
  ELSIF p_percentage >= v_warning THEN
    RETURN 'warning';
  ELSE
    RETURN 'safe';
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Update timestamp on row update
CREATE OR REPLACE FUNCTION public.update_alert_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at
DROP TRIGGER IF EXISTS trigger_alert_settings_updated_at ON public.alert_settings;
CREATE TRIGGER trigger_alert_settings_updated_at
  BEFORE UPDATE ON public.alert_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_alert_settings_updated_at();

-- ============================================================================
-- 5. CREATE DEFAULT SETTINGS FOR ALL EXISTING USERS
-- ============================================================================

-- Give all existing users default alert settings
INSERT INTO public.alert_settings (user_id)
SELECT au.id
FROM auth.users au
WHERE au.id NOT IN (SELECT user_id FROM public.alert_settings)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- 6. TRIGGER: Auto-create alert settings for new users
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_default_alert_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.alert_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_create_alert_settings ON auth.users;
CREATE TRIGGER trigger_create_alert_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_alert_settings();

-- ============================================================================
-- 7. COMMENTS
-- ============================================================================

COMMENT ON TABLE public.alert_settings IS
  'Configurable alert thresholds and notification preferences per user. Supports global and per-category overrides.';

COMMENT ON COLUMN public.alert_settings.warning_threshold IS
  'Global warning threshold (percentage of budget, e.g., 70 = 70%)';

COMMENT ON COLUMN public.alert_settings.critical_threshold IS
  'Global critical threshold (percentage of budget, e.g., 90 = 90%)';

COMMENT ON COLUMN public.alert_settings.survival_warning IS
  'Override for survival category warning (null = use global)';

COMMENT ON COLUMN public.alert_settings.weekly_summary_day IS
  'Day of week for weekly summary: 0=Sunday, 1=Monday, ..., 6=Saturday';

COMMENT ON FUNCTION public.get_alert_thresholds IS
  'Get warning and critical thresholds for a specific category (uses category override or global default)';

COMMENT ON FUNCTION public.get_budget_status_level IS
  'Determine budget status level (safe/warning/critical) based on percentage and user thresholds';
