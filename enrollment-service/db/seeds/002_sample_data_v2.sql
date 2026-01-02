-- Sample Data for V2 Schema (JSONB-based enrollments)
-- This seed file creates sample enrollments with customer data stored in JSONB

-- Insert test agent (matching the one from agent-service seeds)
INSERT INTO agents (id, first_name, last_name, email, phone, license_number, agency_name, is_active)
VALUES
  ('8ab743b2-e9df-4035-8f29-968be5928100', 'Mohammed', 'Alami', 'mohammed.alami@yadmanx.ma', '0612345678', 'AG-2024-001', 'Yadmanx Agency Casablanca', true),
  ('9bc854c3-f0ea-5146-9f40-079cf6039211', 'Fatima', 'Benjelloun', 'fatima.benjelloun@yadmanx.ma', '0623456789', 'AG-2024-002', 'Yadmanx Agency Rabat', true)
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  license_number = EXCLUDED.license_number,
  agency_name = EXCLUDED.agency_name,
  is_active = EXCLUDED.is_active;

-- Insert sample customers (all fields moved to JSONB data column)
INSERT INTO customers (id, cin, first_name, last_name, email, phone, address, data)
VALUES
  (
    'c1111111-1111-1111-1111-111111111111',
    'BK2134566',
    'Ahmed',
    'El Fassi',
    'ahmed.elfassi@email.ma',
    '0661234567',
    '{"street": "Avenue Mohammed V", "city": "Casablanca", "postalCode": "20000"}',
    '{"dateOfBirth": "1985-03-15", "placeOfBirth": "Fes", "nationality": "Moroccan", "address": {"street": "Avenue Mohammed V", "city": "Casablanca", "postalCode": "20000"}}'::jsonb
  ),
  (
    'c2222222-2222-2222-2222-222222222222',
    'CD5678901',
    'Laila',
    'Bennani',
    'laila.bennani@email.ma',
    '0672345678',
    '{"street": "Rue de la Liberté", "city": "Rabat", "postalCode": "10000"}',
    '{"dateOfBirth": "1990-07-22", "placeOfBirth": "Rabat", "nationality": "Moroccan", "address": {"street": "Rue de la Liberté", "city": "Rabat", "postalCode": "10000"}}'::jsonb
  ),
  (
    'c3333333-3333-3333-3333-333333333333',
    'EF9012345',
    'Youssef',
    'Chraibi',
    'youssef.chraibi@email.ma',
    '0683456789',
    '{"street": "Boulevard Hassan II", "city": "Marrakech", "postalCode": "40000"}',
    '{"dateOfBirth": "1978-11-08", "placeOfBirth": "Marrakech", "nationality": "Moroccan", "address": {"street": "Boulevard Hassan II", "city": "Marrakech", "postalCode": "40000"}}'::jsonb
  ),
  (
    'c4444444-4444-4444-4444-444444444444',
    'GH3456789',
    'Samira',
    'Tazi',
    'samira.tazi@email.ma',
    '0694567890',
    '{"street": "Avenue des FAR", "city": "Tangier", "postalCode": "90000"}',
    '{"dateOfBirth": "1995-01-30", "placeOfBirth": "Tangier", "nationality": "Moroccan", "address": {"street": "Avenue des FAR", "city": "Tangier", "postalCode": "90000"}}'::jsonb
  ),
  (
    'c5555555-5555-5555-5555-555555555555',
    'IJ567',
    'Omar',
    'Karimi',
    'omar.karimi@email.ma',
    '0605678901',
    '{"street": "Rue Mohammed VI", "city": "Agadir", "postalCode": "80000"}',
    '{"dateOfBirth": "1988-05-17", "placeOfBirth": "Agadir", "nationality": "Moroccan", "address": {"street": "Rue Mohammed VI", "city": "Agadir", "postalCode": "80000"}}'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  cin = EXCLUDED.cin,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address,
  data = EXCLUDED.data;

-- Insert sample enrollments with JSONB data structure
-- Enrollment 1: Complete enrollment with all data
INSERT INTO enrollments (id, agent_id, customer_id, data, created_at, updated_at)
VALUES
  (
    'e1111111-1111-1111-1111-111111111111',
    '8ab743b2-e9df-4035-8f29-968be5928100',
    'c1111111-1111-1111-1111-111111111111',
    '{
      "personalInfo": {
        "subscriber": {
          "firstName": "Ahmed",
          "lastName": "El Fassi",
          "cin": "BK2134566",
          "dateOfBirth": "1985-03-15",
          "email": "ahmed.elfassi@email.ma",
          "phone": "0661234567",
          "address": {
            "street": "Avenue Mohammed V",
            "city": "Casablanca",
            "postalCode": "20000"
          },
          "placeOfBirth": "Fes",
          "nationality": "Moroccan"
        },
        "insured": {
          "firstName": "Ahmed",
          "lastName": "El Fassi",
          "cin": "BK2134566",
          "dateOfBirth": "1985-03-15"
        },
        "insuredSameAsSubscriber": true
      },
      "contribution": {
        "amount": 500,
        "amountText": "five hundred",
        "originOfFunds": {
          "source": "salary",
          "employer": "TechCorp Morocco"
        },
        "paymentMode": {
          "method": "bank_transfer",
          "frequency": "monthly"
        }
      },
      "beneficiaries": [
        {
          "firstName": "Fatima",
          "lastName": "El Fassi",
          "relationship": "spouse",
          "percentage": 50,
          "dateOfBirth": "1987-06-20"
        },
        {
          "firstName": "Yasmine",
          "lastName": "El Fassi",
          "relationship": "child",
          "percentage": 50,
          "dateOfBirth": "2015-09-10"
        }
      ]
    }'::jsonb,
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '2 days'
  ),

-- Enrollment 2: Partial enrollment (personal info only)
  (
    'e2222222-2222-2222-2222-222222222222',
    '8ab743b2-e9df-4035-8f29-968be5928100',
    'c2222222-2222-2222-2222-222222222222',
    '{
      "personalInfo": {
        "subscriber": {
          "firstName": "Laila",
          "lastName": "Bennani",
          "cin": "CD5678901",
          "dateOfBirth": "1990-07-22",
          "email": "laila.bennani@email.ma",
          "phone": "0672345678",
          "address": {
            "street": "Rue de la Liberté",
            "city": "Rabat",
            "postalCode": "10000"
          }
        },
        "insuredSameAsSubscriber": true
      }
    }'::jsonb,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '1 day'
  ),

-- Enrollment 3: Another complete enrollment
  (
    'e3333333-3333-3333-3333-333333333333',
    '8ab743b2-e9df-4035-8f29-968be5928100',
    'c3333333-3333-3333-3333-333333333333',
    '{
      "personalInfo": {
        "subscriber": {
          "firstName": "Youssef",
          "lastName": "Chraibi",
          "cin": "EF9012345",
          "dateOfBirth": "1978-11-08",
          "email": "youssef.chraibi@email.ma",
          "phone": "0683456789",
          "address": {
            "street": "Boulevard Hassan II",
            "city": "Marrakech",
            "postalCode": "40000"
          }
        },
        "insuredSameAsSubscriber": false,
        "insured": {
          "firstName": "Nadia",
          "lastName": "Chraibi",
          "cin": "EF9012346",
          "dateOfBirth": "1980-03-15"
        }
      },
      "contribution": {
        "amount": 750,
        "amountText": "seven hundred fifty",
        "originOfFunds": {
          "source": "business",
          "businessName": "Chraibi Trading"
        },
        "paymentMode": {
          "method": "check",
          "frequency": "quarterly"
        }
      },
      "beneficiaries": [
        {
          "firstName": "Nadia",
          "lastName": "Chraibi",
          "relationship": "spouse",
          "percentage": 100,
          "dateOfBirth": "1980-03-15"
        }
      ]
    }'::jsonb,
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '5 days'
  ),

-- Enrollment 4: For second agent
  (
    'e4444444-4444-4444-4444-444444444444',
    '9bc854c3-f0ea-5146-9f40-079cf6039211',
    'c4444444-4444-4444-4444-444444444444',
    '{
      "personalInfo": {
        "subscriber": {
          "firstName": "Samira",
          "lastName": "Tazi",
          "cin": "GH3456789",
          "dateOfBirth": "1995-01-30",
          "email": "samira.tazi@email.ma",
          "phone": "0694567890",
          "address": {
            "street": "Avenue des FAR",
            "city": "Tangier",
            "postalCode": "90000"
          }
        },
        "insuredSameAsSubscriber": true
      },
      "contribution": {
        "amount": 300,
        "amountText": "three hundred",
        "originOfFunds": {
          "source": "salary"
        },
        "paymentMode": {
          "method": "bank_transfer",
          "frequency": "monthly"
        }
      }
    }'::jsonb,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
  ),

-- Enrollment 5: Empty enrollment (just created, no data yet)
  (
    'e5555555-5555-5555-5555-555555555555',
    '8ab743b2-e9df-4035-8f29-968be5928100',
    NULL,
    '{}'::jsonb,
    NOW(),
    NOW()
  ),

-- Enrollment 6: Soft-deleted enrollment (should NOT appear in lists)
  (
    'e6666666-6666-6666-6666-666666666666',
    '8ab743b2-e9df-4035-8f29-968be5928100',
    'c5555555-5555-5555-5555-555555555555',
    '{
      "personalInfo": {
        "subscriber": {
          "firstName": "Omar",
          "lastName": "Karimi",
          "cin": "IJ567",
          "dateOfBirth": "1988-05-17",
          "email": "omar.karimi@email.ma",
          "phone": "0605678901",
          "address": {
            "street": "Rue Mohammed VI",
            "city": "Agadir",
            "postalCode": "80000"
          }
        },
        "insuredSameAsSubscriber": true
      }
    }'::jsonb,
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '15 days'
  )
ON CONFLICT (id) DO UPDATE SET
  agent_id = EXCLUDED.agent_id,
  customer_id = EXCLUDED.customer_id,
  data = EXCLUDED.data,
  updated_at = EXCLUDED.updated_at;

-- Soft delete the last enrollment
UPDATE enrollments
SET deleted_at = NOW() - INTERVAL '14 days'
WHERE id = 'e6666666-6666-6666-6666-666666666666';

-- Summary:
-- Agent 1 (Mohammed Alami - 8ab743b2-e9df-4035-8f29-968be5928100):
--   - 4 active enrollments (e1, e2, e3, e5)
--   - 1 soft-deleted enrollment (e6) - should NOT appear
-- Agent 2 (Fatima Benjelloun - 9bc854c3-f0ea-5146-9g40-079cf6039211):
--   - 1 active enrollment (e4)
