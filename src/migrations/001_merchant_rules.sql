-- Migration: Merchant Rules for Category Classification (P1-1)
-- Created: 2026-02-19
-- Purpose: Store learned rules for merchant → category mapping
--          Enables the agent to learn from user corrections and improve classification accuracy

-- ========== CREATE TABLE ==========

CREATE TABLE IF NOT EXISTS public.merchant_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User ownership (NULL = global rule applicable to all users)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Merchant identification (normalized lowercase)
  merchant TEXT NOT NULL,

  -- Category mapping (Spanish DB format)
  category TEXT NOT NULL CHECK (category IN ('supervivencia', 'opcional', 'cultura', 'extra')),

  -- Confidence score (1.0 = user explicit rule, <1.0 = inferred/learned)
  confidence FLOAT NOT NULL DEFAULT 1.0 CHECK (confidence > 0 AND confidence <= 1.0),

  -- Vote count for global rules (higher = more users agree)
  vote_count INT NOT NULL DEFAULT 1 CHECK (vote_count > 0),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure one rule per merchant per user
  UNIQUE(user_id, merchant)
);

-- ========== CREATE INDEXES ==========

-- Fast lookup by user
CREATE INDEX IF NOT EXISTS idx_merchant_rules_user
  ON public.merchant_rules(user_id);

-- Fast lookup by merchant (for global rules)
CREATE INDEX IF NOT EXISTS idx_merchant_rules_merchant
  ON public.merchant_rules(merchant);

-- Fast lookup for user+merchant combination (most common query)
CREATE INDEX IF NOT EXISTS idx_merchant_rules_user_merchant
  ON public.merchant_rules(user_id, merchant);

-- Fast lookup for global rules only (user_id IS NULL)
CREATE INDEX IF NOT EXISTS idx_merchant_rules_global
  ON public.merchant_rules(merchant)
  WHERE user_id IS NULL;

-- ========== ENABLE RLS ==========

ALTER TABLE public.merchant_rules ENABLE ROW LEVEL SECURITY;

-- ========== CREATE POLICIES ==========

-- Policy 1: Users can view their own rules + global rules
CREATE POLICY "Users can view own and global merchant_rules"
  ON public.merchant_rules FOR SELECT
  USING (
    auth.uid() = user_id OR user_id IS NULL
  );

-- Policy 2: Users can insert their own rules only
CREATE POLICY "Users can insert own merchant_rules"
  ON public.merchant_rules FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
  );

-- Policy 3: Users can update their own rules only
CREATE POLICY "Users can update own merchant_rules"
  ON public.merchant_rules FOR UPDATE
  USING (
    auth.uid() = user_id
  );

-- Policy 4: Users can delete their own rules only
CREATE POLICY "Users can delete own merchant_rules"
  ON public.merchant_rules FOR DELETE
  USING (
    auth.uid() = user_id
  );

-- ========== HELPER FUNCTIONS ==========

-- Function to upsert a merchant rule (create or update)
CREATE OR REPLACE FUNCTION upsert_merchant_rule(
  p_user_id UUID,
  p_merchant TEXT,
  p_category TEXT,
  p_confidence FLOAT DEFAULT 1.0
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_rule_id UUID;
BEGIN
  -- Normalize merchant name (lowercase, trim)
  p_merchant := LOWER(TRIM(p_merchant));

  -- Insert or update
  INSERT INTO public.merchant_rules (user_id, merchant, category, confidence, updated_at)
  VALUES (p_user_id, p_merchant, p_category, p_confidence, NOW())
  ON CONFLICT (user_id, merchant)
  DO UPDATE SET
    category = EXCLUDED.category,
    confidence = EXCLUDED.confidence,
    updated_at = NOW(),
    vote_count = merchant_rules.vote_count + 1
  RETURNING id INTO v_rule_id;

  RETURN v_rule_id;
END;
$$;

-- Function to get merchant rule (user-specific first, then global)
CREATE OR REPLACE FUNCTION get_merchant_rule(
  p_user_id UUID,
  p_merchant TEXT
)
RETURNS TABLE (
  category TEXT,
  confidence FLOAT,
  source TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Normalize merchant name
  p_merchant := LOWER(TRIM(p_merchant));

  -- First, try to find user-specific rule
  RETURN QUERY
  SELECT
    mr.category,
    mr.confidence,
    'user_rule'::TEXT as source
  FROM public.merchant_rules mr
  WHERE mr.user_id = p_user_id
    AND mr.merchant = p_merchant
  LIMIT 1;

  -- If found, return early
  IF FOUND THEN
    RETURN;
  END IF;

  -- Otherwise, try to find global rule (min 3 votes for consensus)
  RETURN QUERY
  SELECT
    mr.category,
    mr.confidence * 0.8 as confidence, -- Discount global vs personal
    'global_rule'::TEXT as source
  FROM public.merchant_rules mr
  WHERE mr.user_id IS NULL
    AND mr.merchant = p_merchant
    AND mr.vote_count >= 3
  ORDER BY mr.vote_count DESC
  LIMIT 1;
END;
$$;

-- Function to increment global rule vote count
CREATE OR REPLACE FUNCTION increment_global_rule_vote(
  p_merchant TEXT,
  p_category TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Normalize merchant name
  p_merchant := LOWER(TRIM(p_merchant));

  -- Increment vote count for matching global rule
  INSERT INTO public.merchant_rules (user_id, merchant, category, vote_count, updated_at)
  VALUES (NULL, p_merchant, p_category, 1, NOW())
  ON CONFLICT (user_id, merchant)
  DO UPDATE SET
    vote_count = merchant_rules.vote_count + 1,
    updated_at = NOW();
END;
$$;

-- ========== COMMENTS FOR DOCUMENTATION ==========

COMMENT ON TABLE public.merchant_rules IS
  'Stores learned merchant → category rules for improved classification accuracy. User-specific rules (user_id set) take priority over global rules (user_id NULL).';

COMMENT ON COLUMN public.merchant_rules.merchant IS
  'Normalized merchant name (lowercase, trimmed). Examples: "mercadona", "netflix", "vaper el estanco"';

COMMENT ON COLUMN public.merchant_rules.category IS
  'Spanish category name as stored in DB: supervivencia, opcional, cultura, extra';

COMMENT ON COLUMN public.merchant_rules.confidence IS
  'Confidence score: 1.0 = user explicit rule, <1.0 = inferred/learned. Global rules get 0.8x discount.';

COMMENT ON COLUMN public.merchant_rules.vote_count IS
  'For global rules: number of users who agreed on this classification. Higher = more consensus.';

COMMENT ON FUNCTION upsert_merchant_rule IS
  'Creates or updates a merchant rule. Increments vote_count on update.';

COMMENT ON FUNCTION get_merchant_rule IS
  'Gets merchant rule with priority: user-specific > global (min 3 votes). Returns category, confidence, source.';

COMMENT ON FUNCTION increment_global_rule_vote IS
  'Increments vote count for a global merchant rule, creating it if it does not exist.';

-- ========== GRANT PERMISSIONS ==========

-- Allow authenticated users to execute helper functions
GRANT EXECUTE ON FUNCTION upsert_merchant_rule TO authenticated;
GRANT EXECUTE ON FUNCTION get_merchant_rule TO authenticated;
GRANT EXECUTE ON FUNCTION increment_global_rule_vote TO authenticated;

-- ========== SEED DATA (OPTIONAL) ==========

-- Seed some common global rules for better initial experience
-- These are consensus rules that most users would agree with

INSERT INTO public.merchant_rules (user_id, merchant, category, confidence, vote_count, created_at, updated_at)
VALUES
  -- Supermarkets → supervivencia
  (NULL, 'mercadona', 'supervivencia', 1.0, 10, NOW(), NOW()),
  (NULL, 'carrefour', 'supervivencia', 1.0, 8, NOW(), NOW()),
  (NULL, 'lidl', 'supervivencia', 1.0, 7, NOW(), NOW()),
  (NULL, 'aldi', 'supervivencia', 1.0, 6, NOW(), NOW()),
  (NULL, 'día', 'supervivencia', 1.0, 5, NOW(), NOW()),

  -- Streaming services → opcional
  (NULL, 'netflix', 'opcional', 1.0, 15, NOW(), NOW()),
  (NULL, 'spotify', 'opcional', 1.0, 12, NOW(), NOW()),
  (NULL, 'amazon prime', 'opcional', 1.0, 8, NOW(), NOW()),
  (NULL, 'youtube premium', 'opcional', 1.0, 6, NOW(), NOW()),
  (NULL, 'disney', 'opcional', 1.0, 7, NOW(), NOW()),

  -- Transport → supervivencia
  (NULL, 'uber', 'supervivencia', 1.0, 9, NOW(), NOW()),
  (NULL, 'cabify', 'supervivencia', 1.0, 7, NOW(), NOW()),
  (NULL, 'renfe', 'supervivencia', 1.0, 8, NOW(), NOW()),

  -- Books/Education → cultura
  (NULL, 'casa del libro', 'cultura', 1.0, 6, NOW(), NOW()),
  (NULL, 'fnac', 'cultura', 1.0, 5, NOW(), NOW()),
  (NULL, 'udemy', 'cultura', 1.0, 8, NOW(), NOW()),
  (NULL, 'coursera', 'cultura', 1.0, 7, NOW(), NOW())
ON CONFLICT (user_id, merchant) DO NOTHING;

-- ========== VERIFICATION QUERIES ==========

-- Uncomment to verify migration:
-- SELECT * FROM public.merchant_rules ORDER BY vote_count DESC LIMIT 10;
-- SELECT get_merchant_rule('00000000-0000-0000-0000-000000000000'::uuid, 'mercadona');
