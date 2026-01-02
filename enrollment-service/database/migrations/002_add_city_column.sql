-- =====================================================
-- Add City Column Migration
-- Migration 002: Add missing city column to fix existing bug
-- =====================================================

-- The enrollment.service.v2.js references a city column that doesn't exist
-- This migration adds it temporarily - it will be migrated to JSONB data.address.city later

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS city VARCHAR(100);

-- Add index for city lookups
CREATE INDEX IF NOT EXISTS idx_customers_city ON customers(city);

-- Add comment explaining this is temporary
COMMENT ON COLUMN customers.city IS 'Temporary column - will be migrated to data.address.city in future migration';

-- =====================================================
-- Verification
-- =====================================================
SELECT
  'Migration 002 complete' as status,
  'City column added to customers table' as message,
  COUNT(*) FILTER (WHERE city IS NOT NULL) as customers_with_city
FROM customers;
