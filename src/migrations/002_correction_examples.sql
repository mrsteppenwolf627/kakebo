-- Migration: Correction Examples for Few-Shot Learning (P1-2)
-- Created: 2026-02-19
-- Purpose: Store full transaction examples when users correct categories
--          Enables few-shot prompting to improve GPT classification accuracy

-- ========== CREATE TABLE ==========

CREATE TABLE IF NOT EXISTS public.correction_examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User ownership (NULL = global example usable by all users)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Original transaction data
  concept TEXT NOT NULL,
  amount FLOAT NOT NULL,
  date DATE NOT NULL,

  -- Category correction (what GPT got wrong)
  old_category TEXT NOT NULL CHECK (old_category IN ('supervivencia', 'opcional', 'cultura', 'extra')),
  new_category TEXT NOT NULL CHECK (new_category IN ('supervivencia', 'opcional', 'cultura', 'extra')),

  -- Metadata
  merchant TEXT, -- Extracted merchant (nullable if extraction failed)
  transaction_id UUID, -- Reference to original transaction (for audit trail)

  -- Quality scoring
  confidence FLOAT DEFAULT 1.0 CHECK (confidence > 0 AND confidence <= 1.0),
  -- 1.0 = explicit user correction (high quality)
  -- <1.0 = inferred or uncertain

  -- Usage tracking
  times_used INT DEFAULT 0 CHECK (times_used >= 0),
  -- How many times this example was used in few-shot prompts

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,

  -- Prevent duplicate examples
  UNIQUE(user_id, concept, old_category, new_category)
);

-- ========== CREATE INDEXES ==========

-- Fast lookup by user
CREATE INDEX IF NOT EXISTS idx_correction_examples_user
  ON public.correction_examples(user_id);

-- Fast lookup by category (for finding relevant examples)
CREATE INDEX IF NOT EXISTS idx_correction_examples_new_category
  ON public.correction_examples(new_category);

-- Fast lookup by merchant (for merchant-specific examples)
CREATE INDEX IF NOT EXISTS idx_correction_examples_merchant
  ON public.correction_examples(merchant)
  WHERE merchant IS NOT NULL;

-- Fast lookup by quality (prioritize high-confidence examples)
CREATE INDEX IF NOT EXISTS idx_correction_examples_confidence
  ON public.correction_examples(confidence DESC)
  WHERE confidence >= 0.8;

-- Fast lookup for recent examples (temporal relevance)
CREATE INDEX IF NOT EXISTS idx_correction_examples_recent
  ON public.correction_examples(created_at DESC);

-- Combined index for retrieval queries (user + category + confidence)
CREATE INDEX IF NOT EXISTS idx_correction_examples_retrieval
  ON public.correction_examples(user_id, new_category, confidence DESC)
  WHERE confidence >= 0.8;

-- ========== ENABLE RLS ==========

ALTER TABLE public.correction_examples ENABLE ROW LEVEL SECURITY;

-- ========== CREATE POLICIES ==========

-- Policy 1: Users can view their own examples + global examples
CREATE POLICY "Users can view own and global correction_examples"
  ON public.correction_examples FOR SELECT
  USING (
    auth.uid() = user_id OR user_id IS NULL
  );

-- Policy 2: Users can insert their own examples only
CREATE POLICY "Users can insert own correction_examples"
  ON public.correction_examples FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
  );

-- Policy 3: Users can update their own examples only
CREATE POLICY "Users can update own correction_examples"
  ON public.correction_examples FOR UPDATE
  USING (
    auth.uid() = user_id
  );

-- Policy 4: Users can delete their own examples only
CREATE POLICY "Users can delete own correction_examples"
  ON public.correction_examples FOR DELETE
  USING (
    auth.uid() = user_id
  );

-- ========== HELPER FUNCTIONS ==========

-- Function to save a correction example
CREATE OR REPLACE FUNCTION save_correction_example(
  p_user_id UUID,
  p_concept TEXT,
  p_amount FLOAT,
  p_date DATE,
  p_old_category TEXT,
  p_new_category TEXT,
  p_merchant TEXT DEFAULT NULL,
  p_transaction_id UUID DEFAULT NULL,
  p_confidence FLOAT DEFAULT 1.0
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_example_id UUID;
BEGIN
  -- Normalize concept (lowercase, trim)
  p_concept := LOWER(TRIM(p_concept));

  -- Normalize merchant (if provided)
  IF p_merchant IS NOT NULL THEN
    p_merchant := LOWER(TRIM(p_merchant));
  END IF;

  -- Insert or update
  INSERT INTO public.correction_examples (
    user_id,
    concept,
    amount,
    date,
    old_category,
    new_category,
    merchant,
    transaction_id,
    confidence,
    created_at
  )
  VALUES (
    p_user_id,
    p_concept,
    p_amount,
    p_date,
    p_old_category,
    p_new_category,
    p_merchant,
    p_transaction_id,
    p_confidence,
    NOW()
  )
  ON CONFLICT (user_id, concept, old_category, new_category)
  DO UPDATE SET
    amount = EXCLUDED.amount,
    date = EXCLUDED.date,
    merchant = COALESCE(EXCLUDED.merchant, correction_examples.merchant),
    transaction_id = COALESCE(EXCLUDED.transaction_id, correction_examples.transaction_id),
    confidence = GREATEST(EXCLUDED.confidence, correction_examples.confidence)
  RETURNING id INTO v_example_id;

  RETURN v_example_id;
END;
$$;

-- Function to retrieve relevant examples for few-shot prompting
CREATE OR REPLACE FUNCTION get_relevant_examples(
  p_user_id UUID,
  p_category TEXT,
  p_limit INT DEFAULT 3
)
RETURNS TABLE (
  concept TEXT,
  old_category TEXT,
  new_category TEXT,
  merchant TEXT,
  confidence FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Get user-specific examples first (higher priority)
  RETURN QUERY
  SELECT
    ce.concept,
    ce.old_category,
    ce.new_category,
    ce.merchant,
    ce.confidence
  FROM public.correction_examples ce
  WHERE ce.user_id = p_user_id
    AND ce.new_category = p_category
    AND ce.confidence >= 0.8
  ORDER BY ce.confidence DESC, ce.created_at DESC
  LIMIT p_limit;

  -- If not enough user examples, supplement with global examples
  IF (SELECT COUNT(*) FROM correction_examples WHERE user_id = p_user_id AND new_category = p_category) < p_limit THEN
    RETURN QUERY
    SELECT
      ce.concept,
      ce.old_category,
      ce.new_category,
      ce.merchant,
      ce.confidence * 0.8 AS confidence -- Discount global vs personal
    FROM public.correction_examples ce
    WHERE ce.user_id IS NULL
      AND ce.new_category = p_category
      AND ce.confidence >= 0.8
      AND ce.times_used >= 3 -- Only use examples that have proven useful
    ORDER BY ce.times_used DESC, ce.confidence DESC
    LIMIT (p_limit - (SELECT COUNT(*) FROM correction_examples WHERE user_id = p_user_id AND new_category = p_category));
  END IF;
END;
$$;

-- Function to increment usage counter
CREATE OR REPLACE FUNCTION increment_example_usage(
  p_example_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.correction_examples
  SET
    times_used = times_used + 1,
    last_used_at = NOW()
  WHERE id = p_example_id;
END;
$$;

-- Function to get example statistics
CREATE OR REPLACE FUNCTION get_example_stats(
  p_user_id UUID
)
RETURNS TABLE (
  total_examples INT,
  examples_by_category JSONB,
  most_corrected TEXT,
  correction_count INT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT
      COUNT(*)::INT AS total,
      jsonb_object_agg(
        new_category,
        category_count
      ) AS by_category,
      old_category AS most_from
    FROM (
      SELECT
        new_category,
        old_category,
        COUNT(*)::INT AS category_count
      FROM public.correction_examples
      WHERE user_id = p_user_id
      GROUP BY new_category, old_category
    ) category_counts
    GROUP BY old_category
    ORDER BY COUNT(*) DESC
    LIMIT 1
  )
  SELECT
    s.total,
    s.by_category,
    s.most_from,
    (SELECT COUNT(*)::INT FROM correction_examples WHERE user_id = p_user_id AND old_category = s.most_from)
  FROM stats s;
END;
$$;

-- ========== COMMENTS FOR DOCUMENTATION ==========

COMMENT ON TABLE public.correction_examples IS
  'Stores correction examples for few-shot learning. When users correct categories, full transaction details are saved to improve future GPT classification accuracy.';

COMMENT ON COLUMN public.correction_examples.concept IS
  'Transaction concept (normalized lowercase). Example: "mercadona compra semanal"';

COMMENT ON COLUMN public.correction_examples.old_category IS
  'Category before correction (what GPT classified incorrectly)';

COMMENT ON COLUMN public.correction_examples.new_category IS
  'Category after correction (user''s correct classification)';

COMMENT ON COLUMN public.correction_examples.confidence IS
  'Quality score: 1.0 = explicit user correction, <1.0 = inferred/uncertain';

COMMENT ON COLUMN public.correction_examples.times_used IS
  'Number of times this example was used in few-shot prompts. Higher = more useful.';

COMMENT ON FUNCTION save_correction_example IS
  'Saves a correction example. Upserts on conflict (user_id, concept, old_category, new_category).';

COMMENT ON FUNCTION get_relevant_examples IS
  'Gets relevant examples for few-shot prompting. Returns user-specific examples first, then global examples.';

COMMENT ON FUNCTION increment_example_usage IS
  'Increments usage counter and updates last_used_at timestamp.';

COMMENT ON FUNCTION get_example_stats IS
  'Gets statistics about saved examples for a user.';

-- ========== GRANT PERMISSIONS ==========

-- Allow authenticated users to execute helper functions
GRANT EXECUTE ON FUNCTION save_correction_example TO authenticated;
GRANT EXECUTE ON FUNCTION get_relevant_examples TO authenticated;
GRANT EXECUTE ON FUNCTION increment_example_usage TO authenticated;
GRANT EXECUTE ON FUNCTION get_example_stats TO authenticated;

-- ========== SEED DATA (OPTIONAL) ==========

-- Seed some common correction examples for better initial experience
-- These are patterns that most users would agree with

INSERT INTO public.correction_examples (
  user_id,
  concept,
  amount,
  date,
  old_category,
  new_category,
  merchant,
  confidence,
  times_used,
  created_at
)
VALUES
  -- Common misclassifications: Supermarkets marked as optional → should be survival
  (NULL, 'mercadona compra semanal', 50.0, CURRENT_DATE, 'opcional', 'supervivencia', 'mercadona', 1.0, 10, NOW()),
  (NULL, 'carrefour compra mensual', 120.0, CURRENT_DATE, 'opcional', 'supervivencia', 'carrefour', 1.0, 8, NOW()),
  (NULL, 'lidl productos', 35.0, CURRENT_DATE, 'opcional', 'supervivencia', 'lidl', 1.0, 7, NOW()),

  -- Common misclassifications: Streaming marked as survival → should be optional
  (NULL, 'netflix suscripción', 12.99, CURRENT_DATE, 'supervivencia', 'opcional', 'netflix', 1.0, 15, NOW()),
  (NULL, 'spotify premium', 9.99, CURRENT_DATE, 'supervivencia', 'opcional', 'spotify', 1.0, 12, NOW()),
  (NULL, 'amazon prime mensual', 4.99, CURRENT_DATE, 'supervivencia', 'opcional', 'amazon prime', 1.0, 10, NOW()),

  -- Common misclassifications: Education marked as optional → should be culture
  (NULL, 'udemy curso programación', 49.99, CURRENT_DATE, 'opcional', 'cultura', 'udemy', 1.0, 8, NOW()),
  (NULL, 'casa del libro novela', 15.0, CURRENT_DATE, 'opcional', 'cultura', 'casa del libro', 1.0, 6, NOW()),

  -- Common misclassifications: Transport marked as optional → should be survival
  (NULL, 'uber viaje trabajo', 12.0, CURRENT_DATE, 'opcional', 'supervivencia', 'uber', 1.0, 9, NOW()),
  (NULL, 'renfe billete madrid', 25.0, CURRENT_DATE, 'opcional', 'supervivencia', 'renfe', 1.0, 7, NOW())
ON CONFLICT (user_id, concept, old_category, new_category) DO NOTHING;

-- ========== VERIFICATION QUERIES ==========

-- Uncomment to verify migration:
-- SELECT * FROM public.correction_examples ORDER BY times_used DESC LIMIT 10;
-- SELECT get_relevant_examples('00000000-0000-0000-0000-000000000000'::uuid, 'supervivencia', 3);
-- SELECT * FROM get_example_stats('00000000-0000-0000-0000-000000000000'::uuid);
