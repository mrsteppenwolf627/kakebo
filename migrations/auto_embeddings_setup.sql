-- ============================================================================
-- AUTO EMBEDDINGS SETUP
-- ============================================================================
-- This migration sets up the automatic embedding generation system
-- that triggers batch processing every 5 expenses globally (across all users)
--
-- IMPORTANT: Run this migration in Supabase SQL Editor
-- ============================================================================

-- Step 1: Create expense counter table
-- This table tracks the global count of expenses to trigger batch processing
CREATE TABLE IF NOT EXISTS expense_counter (
  id INTEGER PRIMARY KEY DEFAULT 1,
  count BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (id = 1) -- Ensure only one row exists
);

-- Insert the initial row with current expense count
INSERT INTO expense_counter (id, count)
SELECT 1, COUNT(*) FROM expenses
ON CONFLICT (id) DO UPDATE
SET count = (SELECT COUNT(*) FROM expenses),
    updated_at = NOW();

-- Step 2: Create function to atomically increment counter
-- This function is called by the trigger after each expense insertion
CREATE OR REPLACE FUNCTION increment_expense_counter()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count BIGINT;
BEGIN
  UPDATE expense_counter
  SET count = count + 1,
      updated_at = NOW()
  WHERE id = 1
  RETURNING count INTO new_count;

  RETURN new_count;
END;
$$;

-- Step 3: Create trigger function to auto-increment counter
-- This ensures the counter is always up to date even if app logic fails
CREATE OR REPLACE FUNCTION trigger_increment_expense_counter()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Increment the global counter
  PERFORM increment_expense_counter();
  RETURN NEW;
END;
$$;

-- Step 4: Create trigger on expenses table
-- This trigger fires after each expense insertion
DROP TRIGGER IF EXISTS auto_increment_expense_counter ON expenses;
CREATE TRIGGER auto_increment_expense_counter
  AFTER INSERT ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION trigger_increment_expense_counter();

-- Step 5: Set up permissions
-- The counter table doesn't need RLS for writes since it's only modified by triggers
ALTER TABLE expense_counter ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read the counter (for monitoring)
CREATE POLICY "Allow read for authenticated users"
  ON expense_counter FOR SELECT
  TO authenticated
  USING (true);

-- Optionally allow service role to update counter manually
CREATE POLICY "Allow service role full access"
  ON expense_counter FOR ALL
  TO service_role
  USING (true);

-- Step 6: Create index on expense_embeddings for faster lookups
-- This improves performance when checking which expenses need embeddings
CREATE INDEX IF NOT EXISTS idx_expense_embeddings_lookup
  ON expense_embeddings(expense_id, user_id);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these queries to verify the setup:

-- 1. Check counter value
-- SELECT * FROM expense_counter;

-- 2. Test counter increment (manual test)
-- SELECT increment_expense_counter();

-- 3. Count expenses without embeddings
-- SELECT COUNT(*)
-- FROM expenses e
-- LEFT JOIN expense_embeddings ee ON e.id = ee.expense_id
-- WHERE ee.expense_id IS NULL
--   AND e.note IS NOT NULL
--   AND e.note != '';

-- 4. Check trigger is active
-- SELECT * FROM pg_trigger WHERE tgname = 'auto_increment_expense_counter';

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================
-- Uncomment to remove the auto-embeddings system:

-- DROP TRIGGER IF EXISTS auto_increment_expense_counter ON expenses;
-- DROP FUNCTION IF EXISTS trigger_increment_expense_counter();
-- DROP FUNCTION IF EXISTS increment_expense_counter();
-- DROP TABLE IF EXISTS expense_counter;
