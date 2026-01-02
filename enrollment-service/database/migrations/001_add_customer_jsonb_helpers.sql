-- =====================================================
-- Customer JSONB Helper Functions
-- Migration 001: Add helper functions for JSONB operations
-- =====================================================

-- =====================================================
-- Function: build_customer_jsonb_data
-- Purpose: Build JSONB data object from flat parameters
-- Usage: Used when inserting/updating customers to build the data column
-- =====================================================
CREATE OR REPLACE FUNCTION build_customer_jsonb_data(
  p_salutation TEXT DEFAULT NULL,
  p_date_of_birth DATE DEFAULT NULL,
  p_birth_place TEXT DEFAULT NULL,
  p_passport_number TEXT DEFAULT NULL,
  p_residence_permit TEXT DEFAULT NULL,
  p_address_street TEXT DEFAULT NULL,
  p_address_city TEXT DEFAULT NULL,
  p_address_country TEXT DEFAULT NULL,
  p_nationality TEXT DEFAULT NULL,
  p_occupation TEXT DEFAULT NULL,
  p_marital_status TEXT DEFAULT NULL,
  p_widowed BOOLEAN DEFAULT NULL,
  p_number_of_children TEXT DEFAULT NULL,
  p_us_citizen TEXT DEFAULT NULL,
  p_tin TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  address_obj JSONB;
  us_citizen_obj JSONB;
BEGIN
  -- Build address object
  address_obj := jsonb_build_object(
    'street', p_address_street,
    'city', p_address_city,
    'country', p_address_country
  );

  -- Build usCitizen object with nested tin
  IF p_us_citizen IS NOT NULL THEN
    us_citizen_obj := jsonb_build_object('value', p_us_citizen);
    -- Only include tin if US citizen
    IF p_us_citizen = 'Oui' AND p_tin IS NOT NULL THEN
      us_citizen_obj := us_citizen_obj || jsonb_build_object('tin', p_tin);
    END IF;
  ELSE
    us_citizen_obj := NULL;
  END IF;

  -- Build full data object (jsonb_strip_nulls removes null values)
  result := jsonb_strip_nulls(jsonb_build_object(
    'salutation', p_salutation,
    'dateOfBirth', p_date_of_birth::text,
    'birthPlace', p_birth_place,
    'passportNumber', p_passport_number,
    'residencePermit', p_residence_permit,
    'address', address_obj,
    'nationality', p_nationality,
    'occupation', p_occupation,
    'maritalStatus', p_marital_status,
    'widowed', p_widowed,
    'numberOfChildren', p_number_of_children,
    'usCitizen', us_citizen_obj
  ));

  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION build_customer_jsonb_data IS 'Builds JSONB data object from flat parameters for customer storage';

-- =====================================================
-- Function: flatten_customer_data
-- Purpose: Flatten customer JSONB data for backward-compatible API responses
-- Usage: Used when retrieving customers to provide flat structure
-- =====================================================
CREATE OR REPLACE FUNCTION flatten_customer_data(customer_row customers)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  customer_data JSONB;
BEGIN
  customer_data := COALESCE(customer_row.data, '{}'::jsonb);

  result := jsonb_build_object(
    'id', customer_row.id,
    'cin', customer_row.cin,
    'first_name', customer_row.first_name,
    'last_name', customer_row.last_name,
    'email', customer_row.email,
    'phone', customer_row.phone,

    -- Flatten JSONB data with fallback to old columns
    'salutation', customer_data->>'salutation',
    'date_of_birth', COALESCE(
      customer_data->>'dateOfBirth',
      customer_row.date_of_birth::text
    ),
    'birth_place', customer_data->>'birthPlace',
    'passport_number', customer_data->>'passportNumber',
    'residence_permit', customer_data->>'residencePermit',
    'nationality', customer_data->>'nationality',
    'occupation', customer_data->>'occupation',
    'marital_status', customer_data->>'maritalStatus',
    'widowed', (customer_data->>'widowed')::boolean,
    'number_of_children', customer_data->>'numberOfChildren',

    -- Flatten address (handle both old and new structure)
    'address', COALESCE(
      customer_data->'address'->>'street',
      CASE
        WHEN jsonb_typeof(customer_row.address) = 'string' THEN customer_row.address::text
        WHEN jsonb_typeof(customer_row.address) = 'object' THEN customer_row.address->>'street'
        ELSE NULL
      END
    ),
    'city', COALESCE(
      customer_data->'address'->>'city',
      customer_row.city,
      CASE
        WHEN jsonb_typeof(customer_row.address) = 'object' THEN customer_row.address->>'city'
        ELSE NULL
      END
    ),
    'country', customer_data->'address'->>'country',

    -- Flatten usCitizen
    'us_citizen', customer_data->'usCitizen'->>'value',
    'tin', customer_data->'usCitizen'->>'tin',

    -- Audit fields
    'created_at', customer_row.created_at,
    'updated_at', customer_row.updated_at
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION flatten_customer_data IS 'Flattens customer JSONB data for backward-compatible API responses';

-- =====================================================
-- Verification
-- =====================================================
SELECT
  'Migration 001 complete' as status,
  'Helper functions created: build_customer_jsonb_data, flatten_customer_data' as message;
