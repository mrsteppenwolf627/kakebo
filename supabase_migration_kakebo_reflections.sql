-- MIGRATION 4: Kakebo Reflections Table
-- DATE: 2026-02-12
-- PURPOSE: Store user reflections and action items per cycle (core of Kakebo method)
-- AUTHOR: Kakebo Copilot Upgrade

-- ============================================================================
-- 1. CREATE KAKEBO_REFLECTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.kakebo_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Cycle associated with this reflection
  cycle_start DATE NOT NULL,
  cycle_end DATE NOT NULL,

  -- Reflection data (structured JSON)
  reflection_data JSONB NOT NULL DEFAULT '{}'::JSONB,
  -- Structure:
  -- {
  --   "questions": [
  --     { "id": "what_worked", "question": "¿Qué funcionó bien?", "answer": "..." },
  --     { "id": "what_failed", "question": "¿Qué no funcionó?", "answer": "..." },
  --     { "id": "change_next", "question": "Un cambio para la próxima semana", "answer": "..." },
  --     { "id": "unnecessary_expense", "question": "Un gasto prescindible", "answer": "..." },
  --     { "id": "budget_adjustment", "question": "¿Ajustar presupuesto?", "answer": "..." }
  --   ],
  --   "mood": "good|neutral|bad",
  --   "notes": "Free text notes"
  -- }

  -- Action items committed by user
  action_items TEXT[] DEFAULT '{}',
  -- Example: ["Reducir salidas a restaurantes", "Cocinar más en casa", "Cancelar suscripción de X"]

  -- Completed action items (subset of action_items)
  completed_actions TEXT[] DEFAULT '{}',

  -- Overall sentiment (optional)
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'mixed')),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(user_id, cycle_start),  -- One reflection per cycle per user
  CHECK (cycle_end > cycle_start)
);

-- ============================================================================
-- 2. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_kakebo_reflections_user_id
  ON public.kakebo_reflections(user_id);

CREATE INDEX IF NOT EXISTS idx_kakebo_reflections_user_cycle
  ON public.kakebo_reflections(user_id, cycle_start DESC);

CREATE INDEX IF NOT EXISTS idx_kakebo_reflections_dates
  ON public.kakebo_reflections(cycle_start DESC);

-- GIN index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_kakebo_reflections_data
  ON public.kakebo_reflections USING GIN(reflection_data);

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.kakebo_reflections ENABLE ROW LEVEL SECURITY;

-- Users can view their own reflections
CREATE POLICY "Users can view their own reflections"
  ON public.kakebo_reflections FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own reflections
CREATE POLICY "Users can create their own reflections"
  ON public.kakebo_reflections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own reflections
CREATE POLICY "Users can update their own reflections"
  ON public.kakebo_reflections FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own reflections
CREATE POLICY "Users can delete their own reflections"
  ON public.kakebo_reflections FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. HELPER FUNCTIONS
-- ============================================================================

-- Function: Get reflection for a specific cycle
CREATE OR REPLACE FUNCTION public.get_reflection_for_cycle(
  p_user_id UUID,
  p_cycle_start DATE
)
RETURNS public.kakebo_reflections AS $$
DECLARE
  v_reflection public.kakebo_reflections;
BEGIN
  SELECT *
  INTO v_reflection
  FROM public.kakebo_reflections
  WHERE user_id = p_user_id
    AND cycle_start = p_cycle_start;

  RETURN v_reflection;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get recent reflections (last N cycles)
CREATE OR REPLACE FUNCTION public.get_recent_reflections(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 3
)
RETURNS SETOF public.kakebo_reflections AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.kakebo_reflections
  WHERE user_id = p_user_id
  ORDER BY cycle_start DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Mark action item as completed
CREATE OR REPLACE FUNCTION public.complete_action_item(
  p_reflection_id UUID,
  p_action_item TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_actions TEXT[];
  v_completed TEXT[];
BEGIN
  -- Get current action items and completed actions
  SELECT action_items, completed_actions
  INTO v_actions, v_completed
  FROM public.kakebo_reflections
  WHERE id = p_reflection_id;

  -- Check if action item exists
  IF NOT (p_action_item = ANY(v_actions)) THEN
    RETURN false;
  END IF;

  -- Check if already completed
  IF p_action_item = ANY(v_completed) THEN
    RETURN true;  -- Already completed, return success
  END IF;

  -- Add to completed actions
  UPDATE public.kakebo_reflections
  SET
    completed_actions = array_append(completed_actions, p_action_item),
    updated_at = NOW()
  WHERE id = p_reflection_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function: Get completion rate for user
CREATE OR REPLACE FUNCTION public.get_action_completion_rate(p_user_id UUID)
RETURNS TABLE(
  total_actions BIGINT,
  completed_actions BIGINT,
  completion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    SUM(array_length(action_items, 1))::BIGINT as total,
    SUM(array_length(completed_actions, 1))::BIGINT as completed,
    CASE
      WHEN SUM(array_length(action_items, 1)) > 0 THEN
        ROUND(
          (SUM(array_length(completed_actions, 1))::NUMERIC /
           SUM(array_length(action_items, 1))::NUMERIC) * 100,
          2
        )
      ELSE 0
    END as rate
  FROM public.kakebo_reflections
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Update timestamp on row update
CREATE OR REPLACE FUNCTION public.update_kakebo_reflections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at
DROP TRIGGER IF EXISTS trigger_kakebo_reflections_updated_at ON public.kakebo_reflections;
CREATE TRIGGER trigger_kakebo_reflections_updated_at
  BEFORE UPDATE ON public.kakebo_reflections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_kakebo_reflections_updated_at();

-- ============================================================================
-- 5. DEFAULT REFLECTION QUESTIONS (JSONB template)
-- ============================================================================

-- Create a function to get default reflection questions
CREATE OR REPLACE FUNCTION public.get_default_reflection_template()
RETURNS JSONB AS $$
BEGIN
  RETURN jsonb_build_object(
    'questions', jsonb_build_array(
      jsonb_build_object(
        'id', 'what_worked',
        'question', '¿Qué funcionó bien en este ciclo?',
        'answer', ''
      ),
      jsonb_build_object(
        'id', 'what_failed',
        'question', '¿Qué no funcionó o qué gastos fueron innecesarios?',
        'answer', ''
      ),
      jsonb_build_object(
        'id', 'change_next',
        'question', '¿Qué cambio vas a implementar en el próximo ciclo?',
        'answer', ''
      ),
      jsonb_build_object(
        'id', 'unnecessary_expense',
        'question', 'Menciona un gasto que podrías haber evitado',
        'answer', ''
      ),
      jsonb_build_object(
        'id', 'budget_adjustment',
        'question', '¿Necesitas ajustar algún presupuesto? ¿Cuál y por qué?',
        'answer', ''
      )
    ),
    'mood', 'neutral',
    'notes', ''
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- 6. COMMENTS
-- ============================================================================

COMMENT ON TABLE public.kakebo_reflections IS
  'Kakebo reflections per cycle. Core of the Kakebo method: conscious reflection on spending habits and action planning.';

COMMENT ON COLUMN public.kakebo_reflections.reflection_data IS
  'Structured reflection data with questions and answers (JSONB format)';

COMMENT ON COLUMN public.kakebo_reflections.action_items IS
  'Action items committed by user for next cycle (array of strings)';

COMMENT ON COLUMN public.kakebo_reflections.completed_actions IS
  'Subset of action_items that user marked as completed (array of strings)';

COMMENT ON FUNCTION public.get_default_reflection_template IS
  'Returns default JSONB template for Kakebo reflection with standard questions';

COMMENT ON FUNCTION public.get_action_completion_rate IS
  'Calculate user''s overall action completion rate across all reflections';
