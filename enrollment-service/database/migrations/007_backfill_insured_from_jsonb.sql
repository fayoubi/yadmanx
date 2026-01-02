-- Migration 007: Backfill insured_id from JSONB data
-- This migration extracts insured customer data from enrollments.data JSONB
-- and creates separate customer records for cases where subscriber ≠ insured

BEGIN;

-- Step 1: Extract insured data from JSONB where subscriber ≠ insured
CREATE TEMP TABLE insured_to_create AS
SELECT
  e.id as enrollment_id,
  e.data->'personalInfo'->'insured'->>'cin' as cin,
  e.data->'personalInfo'->'insured'->>'firstName' as first_name,
  e.data->'personalInfo'->'insured'->>'lastName' as last_name,
  e.data->'personalInfo'->'insured'->>'email' as email,
  e.data->'personalInfo'->'insured'->>'phone' as phone,
  e.data->'personalInfo'->'insured'->>'dateOfBirth' as date_of_birth,
  e.data->'personalInfo'->'insured'->'address' as address_jsonb
FROM enrollments e
WHERE e.deleted_at IS NULL
  AND e.data->'personalInfo'->>'insuredSameAsSubscriber' = 'false'
  AND e.data->'personalInfo'->'insured' IS NOT NULL
  AND e.data->'personalInfo'->'insured'->>'cin' IS NOT NULL;

-- Step 2: Create customer records for insured persons
-- For each insured person, either find existing customer by CIN or create new one
DO $$
DECLARE
  rec RECORD;
  v_customer_id UUID;
BEGIN
  FOR rec IN SELECT * FROM insured_to_create LOOP
    -- Try to find existing customer with this CIN
    SELECT id INTO v_customer_id
    FROM customers
    WHERE cin = rec.cin
    AND deleted_at IS NULL
    LIMIT 1;

    -- If not found, create new customer
    IF v_customer_id IS NULL THEN
      INSERT INTO customers (cin, first_name, last_name, email, phone, address, data)
      VALUES (
        rec.cin,
        rec.first_name,
        rec.last_name,
        COALESCE(rec.email, ''),
        rec.phone,
        COALESCE(rec.address_jsonb, '{}'::jsonb),
        jsonb_build_object(
          'dateOfBirth', rec.date_of_birth,
          'address', COALESCE(rec.address_jsonb, '{}'::jsonb)
        )
      )
      RETURNING id INTO v_customer_id;
    END IF;

    -- Update enrollment with insured_id
    UPDATE enrollments
    SET insured_id = v_customer_id
    WHERE id = rec.enrollment_id;
  END LOOP;
END $$;

-- Step 3: Verification
DO $$
DECLARE
  total_with_separate_insured INTEGER;
  successfully_backfilled INTEGER;
BEGIN
  SELECT
    COUNT(*),
    COUNT(insured_id)
  INTO total_with_separate_insured, successfully_backfilled
  FROM enrollments
  WHERE deleted_at IS NULL
    AND data->'personalInfo'->>'insuredSameAsSubscriber' = 'false';

  RAISE NOTICE 'Migration 007 Backfill Results:';
  RAISE NOTICE '  Enrollments with separate insured: %', total_with_separate_insured;
  RAISE NOTICE '  Successfully backfilled: %', successfully_backfilled;

  IF total_with_separate_insured != successfully_backfilled THEN
    RAISE WARNING 'Some enrollments were not backfilled! Check data integrity.';
  ELSE
    RAISE NOTICE 'All separate-insured enrollments backfilled successfully!';
  END IF;
END $$;

COMMIT;
