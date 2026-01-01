-- =====================================================
-- Add Subscriber/Insured Columns
-- Migration 006: Support separate subscriber and insured customers
-- =====================================================

-- This migration enables enrollments to track both:
-- 1. Subscriber (policy owner/payer)
-- 2. Insured (covered person)
--
-- When subscriber = insured: subscriber_id set, insured_id = NULL
-- When subscriber ≠ insured: Both subscriber_id and insured_id set to different customers

BEGIN;

-- Step 1: Add new columns
ALTER TABLE enrollments
  ADD COLUMN IF NOT EXISTS subscriber_id UUID REFERENCES customers(id),
  ADD COLUMN IF NOT EXISTS insured_id UUID REFERENCES customers(id);

RAISE NOTICE 'Added subscriber_id and insured_id columns to enrollments';

-- Step 2: Migrate existing data (customer_id becomes subscriber_id)
UPDATE enrollments
SET subscriber_id = customer_id
WHERE subscriber_id IS NULL AND customer_id IS NOT NULL;

RAISE NOTICE 'Migrated existing customer_id values to subscriber_id';

-- Step 3: Make subscriber_id NOT NULL (always required - every enrollment has a subscriber)
ALTER TABLE enrollments
  ALTER COLUMN subscriber_id SET NOT NULL;

RAISE NOTICE 'Set subscriber_id as NOT NULL';

-- Step 4: Drop old customer_id column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'enrollments'
    AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE enrollments DROP COLUMN customer_id;
    RAISE NOTICE 'Dropped customer_id column';
  ELSE
    RAISE NOTICE 'customer_id column does not exist (already dropped)';
  END IF;
END $$;

-- Step 5: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_enrollments_subscriber_id ON enrollments(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_insured_id ON enrollments(insured_id);

RAISE NOTICE 'Created indexes on subscriber_id and insured_id';

-- Step 6: Add comments
COMMENT ON COLUMN enrollments.subscriber_id IS 'Customer who owns the policy (payer) - always required';
COMMENT ON COLUMN enrollments.insured_id IS 'Customer covered by the policy - NULL if same as subscriber (self-insured)';

COMMIT;

-- =====================================================
-- Verification
-- =====================================================
SELECT
  'Migration 006 complete' as status,
  'Subscriber/Insured relationship columns added' as message;

-- Show enrollment statistics
SELECT
  COUNT(*) as total_enrollments,
  COUNT(*) FILTER (WHERE subscriber_id IS NOT NULL) as with_subscriber,
  COUNT(*) FILTER (WHERE insured_id IS NOT NULL) as with_separate_insured,
  COUNT(*) FILTER (WHERE insured_id IS NULL) as self_insured
FROM enrollments
WHERE deleted_at IS NULL;

-- Verify column structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'enrollments'
AND column_name IN ('subscriber_id', 'insured_id', 'customer_id')
ORDER BY column_name;

-- Verify indexes
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'enrollments'
AND indexname LIKE '%subscriber%' OR indexname LIKE '%insured%'
ORDER BY indexname;

-- Final validation
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'enrollments'
      AND column_name = 'customer_id'
    )
    THEN '⚠️ Old customer_id column still exists'
    WHEN NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'enrollments'
      AND column_name = 'subscriber_id'
    )
    THEN '❌ subscriber_id column missing'
    WHEN NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'enrollments'
      AND column_name = 'insured_id'
    )
    THEN '❌ insured_id column missing'
    ELSE '✓ Migration successful - subscriber/insured columns ready'
  END as final_validation;
