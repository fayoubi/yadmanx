-- =====================================================
-- Backfill Customer JSONB Data (Enhanced)
-- Migration 003: Migrate existing customer data to JSONB structure
-- =====================================================

-- This migration handles customers created before dual-write mode
-- It backfills the data column from existing columns
-- If a customer cannot be migrated (missing critical data), they are deleted

-- Start transaction
BEGIN;

-- Step 1: Identify customers that cannot be migrated (missing critical data)
-- Critical data: Must have at least CIN or (first_name AND last_name AND email)
CREATE TEMP TABLE customers_to_delete AS
SELECT id
FROM customers
WHERE (data IS NULL OR data = '{}'::jsonb)
  AND (
    -- No CIN AND (no first_name OR no last_name OR no email)
    (cin IS NULL OR cin = '')
    AND (
      first_name IS NULL OR first_name = '' OR
      last_name IS NULL OR last_name = '' OR
      email IS NULL OR email = ''
    )
  );

-- Step 2: Delete enrollments for these customers
DO $$
DECLARE
  deleted_enrollments_count INTEGER;
  deleted_customers_count INTEGER;
BEGIN
  DELETE FROM enrollments
  WHERE customer_id IN (SELECT id FROM customers_to_delete)
    AND deleted_at IS NULL;

  GET DIAGNOSTICS deleted_enrollments_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % enrollments for incomplete customers', deleted_enrollments_count;

  -- Step 3: Soft delete the incomplete customers
  UPDATE customers
  SET deleted_at = CURRENT_TIMESTAMP
  WHERE id IN (SELECT id FROM customers_to_delete)
    AND deleted_at IS NULL;

  GET DIAGNOSTICS deleted_customers_count = ROW_COUNT;
  RAISE NOTICE 'Soft deleted % customers with incomplete data', deleted_customers_count;
END $$;

-- Step 4: Backfill customers that have sufficient data
DO $$
DECLARE
  backfilled_count INTEGER;
BEGIN
  UPDATE customers
  SET data = jsonb_build_object(
    'dateOfBirth', CASE
      WHEN date_of_birth IS NOT NULL THEN date_of_birth::text
      ELSE NULL
    END,
    'address', jsonb_build_object(
      'street', address,
      'city', city,
      'country', NULL
    )
  )
  WHERE (data IS NULL OR data = '{}'::jsonb)
    AND deleted_at IS NULL;

  GET DIAGNOSTICS backfilled_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled % customers', backfilled_count;
END $$;

-- Step 5: Remove null values from JSONB (cleanup)
UPDATE customers
SET data = (
  SELECT jsonb_object_agg(key, value)
  FROM jsonb_each(data)
  WHERE value != 'null'::jsonb
)
WHERE data IS NOT NULL
  AND deleted_at IS NULL;

COMMIT;

-- =====================================================
-- Verification
-- =====================================================
SELECT
  'Migration 003 complete' as status,
  'Customer JSONB data backfilled' as message,
  COUNT(*) FILTER (WHERE deleted_at IS NULL) as total_active_customers,
  COUNT(*) FILTER (WHERE deleted_at IS NULL AND data IS NOT NULL AND data != '{}'::jsonb) as customers_with_jsonb,
  COUNT(*) FILTER (WHERE deleted_at IS NULL AND data->>'dateOfBirth' IS NOT NULL) as with_date_of_birth,
  COUNT(*) FILTER (WHERE deleted_at IS NULL AND data->'address'->>'city' IS NOT NULL) as with_city,
  COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) as deleted_customers
FROM customers;

-- Check for any active customers missing JSONB data
SELECT
  CASE
    WHEN COUNT(*) = 0 THEN '✓ All active customers have JSONB data'
    ELSE '⚠️ ' || COUNT(*)::text || ' active customers missing JSONB data'
  END as validation_result
FROM customers
WHERE (data IS NULL OR data = '{}'::jsonb)
  AND deleted_at IS NULL;

-- Show summary of deletions
SELECT
  'Cleanup summary' as info,
  (SELECT COUNT(*) FROM customers WHERE deleted_at IS NOT NULL) as total_deleted_customers,
  (SELECT COUNT(*) FROM enrollments WHERE deleted_at IS NOT NULL) as total_deleted_enrollments;
