-- =====================================================
-- Drop Middle Name Column
-- Migration 004: Remove middle_name column (not used in target demographic)
-- =====================================================

-- IMPORTANT: Only run this migration after:
-- 1. Migrations 001-003 are complete
-- 2. Dual-write mode has been active for at least 1 week
-- 3. Data verification shows 100% JSONB coverage
-- 4. You have a recent database backup

BEGIN;

-- Check if column exists before dropping
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'customers'
    AND column_name = 'middle_name'
  ) THEN
    ALTER TABLE customers DROP COLUMN middle_name;
    RAISE NOTICE 'middle_name column dropped successfully';
  ELSE
    RAISE NOTICE 'middle_name column does not exist (already dropped)';
  END IF;
END $$;

COMMIT;

-- =====================================================
-- Verification
-- =====================================================
SELECT
  'Migration 004 complete' as status,
  'middle_name column removed' as message,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'customers'
      AND column_name = 'middle_name'
    )
    THEN '⚠️ middle_name column still exists'
    ELSE '✓ middle_name column removed'
  END as validation_result;
