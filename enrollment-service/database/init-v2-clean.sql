-- =====================================================
-- Yadmanx Enrollment Service - V2 JSONB Schema (Clean)
-- This is the minimal schema for V2 service
-- =====================================================

-- =====================================================
-- 1. CUSTOMERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Info
  cin VARCHAR(50) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE NOT NULL,

  -- Contact Info
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address JSONB NOT NULL,

  -- Additional flexible data
  data JSONB DEFAULT '{}'::jsonb,

  -- Audit fields
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITHOUT TIME ZONE,

  UNIQUE(cin)
);

CREATE INDEX IF NOT EXISTS idx_customers_cin ON customers(cin);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_customers_data_gin ON customers USING gin(data);
CREATE INDEX IF NOT EXISTS idx_customers_deleted_at ON customers(deleted_at);

-- =====================================================
-- 2. ENROLLMENTS TABLE (JSONB-based)
-- =====================================================
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  agent_id UUID NOT NULL,
  customer_id UUID REFERENCES customers(id),

  -- All enrollment data in JSONB
  data JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Audit fields
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_enrollments_agent_id ON enrollments(agent_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_enrollments_customer_id ON enrollments(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_enrollments_data_gin ON enrollments USING gin(data);
CREATE INDEX IF NOT EXISTS idx_enrollments_deleted_at ON enrollments(deleted_at);
CREATE INDEX IF NOT EXISTS idx_enrollments_created_at ON enrollments(created_at);

-- =====================================================
-- 3. TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_enrollments_updated_at ON enrollments;
CREATE TRIGGER update_enrollments_updated_at
  BEFORE UPDATE ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. COMMENTS
-- =====================================================

COMMENT ON TABLE customers IS 'Customer information for enrollments';
COMMENT ON TABLE enrollments IS 'Enrollments with all data stored in JSONB format';
COMMENT ON COLUMN enrollments.data IS 'JSONB structure: {personalInfo: {...}, contribution: {...}, beneficiaries: [...]}';

-- Schema initialization complete
SELECT
  'V2 JSONB Schema initialized successfully!' as status,
  (SELECT COUNT(*) FROM customers) as customers,
  (SELECT COUNT(*) FROM enrollments) as enrollments;
