-- =====================================================
-- Drop Migrated Columns
-- Migration 005: Remove date_of_birth and city columns (migrated to JSONB)
-- =====================================================

-- CRITICAL: Only run this migration after:
-- 1. Migrations 001-004 are complete
-- 2. Application has been reading from JSONB for at least 1 week
-- 3. Data verification shows 100% consistency between old columns and JSONB
-- 4. You have a recent database backup
-- 5. All monitoring shows no issues

-- This is a DESTRUCTIVE operation - data in these columns will be lost
-- Ensure JSONB data is complete before running

BEGIN;

-- Verification check before dropping
DO $$
DECLARE
  total_customers INTEGER;
  customers_with_jsonb INTEGER;
  customers_with_date INTEGER;
  customers_with_city INTEGER;
BEGIN
  -- Count customers
  SELECT COUNT(*) INTO total_customers FROM customers;
  SELECT COUNT(*) INTO customers_with_jsonb
    FROM customers WHERE data IS NOT NULL AND data != '{}'::jsonb;
  SELECT COUNT(*) INTO customers_with_date
    FROM customers WHERE data->>'dateOfBirth' IS NOT NULL;
  SELECT COUNT(*) INTO customers_with_city
    FROM customers WHERE data->'address'->>'city' IS NOT NULL;

  -- Safety check
  IF customers_with_jsonb < total_customers THEN
    RAISE EXCEPTION 'SAFETY CHECK FAILED: Not all customers have JSONB data (% out of %)',
      customers_with_jsonb, total_customers;
  END IF;

  RAISE NOTICE 'Safety check passed: All % customers have JSONB data', total_customers;
  RAISE NOTICE 'Customers with dateOfBirth in JSONB: %', customers_with_date;
  RAISE NOTICE 'Customers with city in JSONB: %', customers_with_city;
END $$;

-- Drop date_of_birth column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'customers'
    AND column_name = 'date_of_birth'
  ) THEN
    ALTER TABLE customers DROP COLUMN date_of_birth;
    RAISE NOTICE 'date_of_birth column dropped successfully';
  ELSE
    RAISE NOTICE 'date_of_birth column does not exist (already dropped)';
  END IF;
END $$;

-- Drop city column and its index
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'customers'
    AND column_name = 'city'
  ) THEN
    -- Drop index first
    DROP INDEX IF EXISTS idx_customers_city;
    RAISE NOTICE 'idx_customers_city index dropped';

    -- Drop column
    ALTER TABLE customers DROP COLUMN city;
    RAISE NOTICE 'city column dropped successfully';
  ELSE
    RAISE NOTICE 'city column does not exist (already dropped)';
  END IF;
END $$;

-- Update comment on address column
COMMENT ON COLUMN customers.address IS 'DEPRECATED: Address data is now in data.address. This column maintained for backward compatibility. Consider dropping after thorough testing.';

COMMIT;

-- =====================================================
-- Verification
-- =====================================================
SELECT
  'Migration 005 complete' as status,
  'Migrated columns removed' as message;

-- Verify columns are dropped
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'customers'
ORDER BY ordinal_position;

-- Final structure check
SELECT
  CASE
    WHEN NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'customers'
      AND column_name IN ('date_of_birth', 'city', 'middle_name')
    )
    THEN '✓ All migrated columns removed successfully'
    ELSE '⚠️ Some columns still exist'
  END as final_validation;

-- Show current customer table structure
SELECT
  'Current customers table structure:' as info;

SELECT
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'customers'
ORDER BY ordinal_position;
