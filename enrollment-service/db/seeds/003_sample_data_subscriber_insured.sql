-- Sample Data for Subscriber/Insured Schema
-- Demonstrates both scenarios: subscriber = insured and subscriber ≠ insured
-- This seed file uses the new schema with subscriber_id and insured_id columns

-- Insert sample customers
INSERT INTO customers (id, cin, first_name, last_name, email, phone, address, data)
VALUES
  -- Subscriber 1 (self-insured)
  (
    'c1000001-0001-0001-0001-000000000001',
    'AA123456',
    'Hassan',
    'Alaoui',
    'hassan.alaoui@email.ma',
    '0661111111',
    '{"street": "Rue Principale", "city": "Casablanca", "postalCode": "20100"}',
    '{"dateOfBirth": "1980-05-15", "placeOfBirth": "Casablanca", "nationality": "Moroccan"}'::jsonb
  ),

  -- Subscriber 2 (insuring child)
  (
    'c1000002-0002-0002-0002-000000000002',
    'BB234567',
    'Amina',
    'Bennani',
    'amina.bennani@email.ma',
    '0662222222',
    '{"street": "Avenue Hassan II", "city": "Rabat", "postalCode": "10000"}',
    '{"dateOfBirth": "1975-08-20", "placeOfBirth": "Rabat", "nationality": "Moroccan"}'::jsonb
  ),

  -- Insured child
  (
    'c1000003-0003-0003-0003-000000000003',
    'CC345678',
    'Karim',
    'Bennani',
    'karim.bennani@email.ma',
    '0663333333',
    '{"street": "Avenue Hassan II", "city": "Rabat", "postalCode": "10000"}',
    '{"dateOfBirth": "2005-03-10", "placeOfBirth": "Rabat", "nationality": "Moroccan"}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- Insert enrollments

-- Enrollment 1: Subscriber IS the insured (self-insured)
INSERT INTO enrollments (id, agent_id, subscriber_id, insured_id, data)
VALUES
  (
    'e2000001-0001-0001-0001-000000000001',
    '8ab743b2-e9df-4035-8f29-968be5928100',
    'c1000001-0001-0001-0001-000000000001',  -- Hassan (subscriber)
    NULL,  -- Self-insured (insured_id is NULL)
    '{
      "personalInfo": {
        "insuredSameAsSubscriber": true
      },
      "contribution": {
        "amount": 600,
        "amountText": "six hundred",
        "originOfFunds": {
          "source": "salary",
          "employer": "Bank Al Maghrib"
        },
        "paymentMode": {
          "method": "bank_transfer",
          "frequency": "monthly"
        }
      },
      "beneficiaries": [
        {
          "firstName": "Salma",
          "lastName": "Alaoui",
          "relationship": "spouse",
          "percentage": 100,
          "dateOfBirth": "1982-11-25"
        }
      ]
    }'::jsonb
  ),

-- Enrollment 2: Subscriber ≠ insured (parent insuring child)
  (
    'e2000002-0002-0002-0002-000000000002',
    '8ab743b2-e9df-4035-8f29-968be5928100',
    'c1000002-0002-0002-0002-000000000002',  -- Amina (subscriber/parent)
    'c1000003-0003-0003-0003-000000000003',  -- Karim (insured/child)
    '{
      "personalInfo": {
        "insuredSameAsSubscriber": false
      },
      "contribution": {
        "amount": 400,
        "amountText": "four hundred",
        "originOfFunds": {
          "source": "business",
          "businessName": "Bennani Consulting"
        },
        "paymentMode": {
          "method": "check",
          "frequency": "monthly"
        }
      },
      "beneficiaries": [
        {
          "firstName": "Amina",
          "lastName": "Bennani",
          "relationship": "parent",
          "percentage": 100,
          "dateOfBirth": "1975-08-20"
        }
      ]
    }'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- Verification
SELECT
  'Seed data created' as status,
  COUNT(*) FILTER (WHERE insured_id IS NULL) as self_insured_count,
  COUNT(*) FILTER (WHERE insured_id IS NOT NULL) as separate_insured_count
FROM enrollments
WHERE id IN ('e2000001-0001-0001-0001-000000000001', 'e2000002-0002-0002-0002-000000000002');
