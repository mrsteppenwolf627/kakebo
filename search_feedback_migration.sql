-- Migration: Add search_feedback table for user learning
-- Created: 2026-02-09
-- Purpose: Store user corrections on search results to improve future searches

-- Create search_feedback table
CREATE TABLE IF NOT EXISTS search_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,                    -- The search query (e.g., "vicios")
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('correct', 'incorrect')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate feedback for same query+expense
  UNIQUE(user_id, query, expense_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_search_feedback_query ON search_feedback(query);
CREATE INDEX IF NOT EXISTS idx_search_feedback_user ON search_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_search_feedback_user_query ON search_feedback(user_id, query);

-- Enable RLS
ALTER TABLE search_feedback ENABLE ROW LEVEL SECURITY;

-- Policies: users can only access their own feedback
CREATE POLICY "Users can view own search_feedback"
  ON search_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own search_feedback"
  ON search_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own search_feedback"
  ON search_feedback FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own search_feedback"
  ON search_feedback FOR DELETE
  USING (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE search_feedback IS 'Stores user corrections on search results to improve future searches';
COMMENT ON COLUMN search_feedback.query IS 'The search query that was corrected (e.g., "vicios", "restaurantes")';
COMMENT ON COLUMN search_feedback.feedback_type IS 'Whether this expense was correctly or incorrectly included in results';
