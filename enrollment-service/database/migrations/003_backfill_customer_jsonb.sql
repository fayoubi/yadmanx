-- =====================================================
-- Backfill Customer JSONB Data
-- Migration 003: Migrate existing customer data to JSONB structure
-- =====================================================

-- This migration handles customers created before dual-write mode
-- It backfills the data column from existing columns

-- Start transaction
BEGIN;

-- Update customers that don't have JSONB data yet
UPDATE customers
SET data = jsonb_build_object(
  'dateOfBirth', CASE
    WHEN date_of_birth IS NOT NULL THEN date_of_birth::text
    ELSE NULL
  END,
  'address', jsonb_build_object(
    'street', CASE
      WHEN jsonb_typeof(address) = 'string' THEN address::text
      WHEN jsonb_typeof(address) = 'object' THEN address->>'street'
      ELSE NULL
    END,
    'city', COALESCE(
      city,
      CASE
        WHEN jsonb_typeof(address) = 'object' THEN address->>'city'
        ELSE NULL
      END
    ),
    'country', CASE
      WHEN jsonb_typeof(address) = 'object' THEN address->>'country'
      ELSE NULL
    END
  )
)
WHERE data IS NULL OR data = '{}'::jsonb;

-- Remove null values from JSONB (cleanup)
UPDATE customers
SET data = (
  SELECT jsonb_object_agg(key, value)
  FROM jsonb_each(data)
  WHERE value != 'null'::jsonb
)
WHERE data IS NOT NULL;

COMMIT;

-- =====================================================
-- Verification
-- =====================================================
SELECT
  'Migration 003 complete' as status,
  'Customer JSONB data backfilled' as message,
  COUNT(*) as total_customers,
  COUNT(*) FILTER (WHERE data IS NOT NULL AND data != '{}'::jsonb) as customers_with_jsonb,
  COUNT(*) FILTER (WHERE data->>'dateOfBirth' IS NOT NULL) as with_date_of_birth,
  COUNT(*) FILTER (WHERE data->'address'->>'city' IS NOT NULL) as with_city
FROM customers;

-- Check for any customers missing JSONB data
SELECT
  CASE
    WHEN COUNT(*) = 0 THEN '✓ All customers have JSONB data'
    ELSE '⚠️ ' || COUNT(*)::text || ' customers missing JSONB data'
  END as validation_result
FROM customers
WHERE data IS NULL OR data = '{}'::jsonb;
