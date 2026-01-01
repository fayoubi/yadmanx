-- Insert agent
INSERT INTO agents (id, first_name, last_name, email, phone, license_number, status)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'John', 'Agent', 'john.agent@yadmanx.com', '555-0100', 'LIC-12345', 'active')
ON CONFLICT (id) DO NOTHING;

-- Insert customers (middle_name removed as per migration 004)
INSERT INTO customers (id, cin, first_name, last_name, date_of_birth, email, phone, address)
VALUES
  ('22222222-2222-2222-2222-222222222222', 'CIN123456', 'Alice', 'Johnson', '1985-03-15', 'alice.johnson@email.com', '555-0101',
   '{"street": "123 Main St", "city": "New York", "state": "NY", "zip": "10001"}'),
  ('33333333-3333-3333-3333-333333333333', 'CIN234567', 'Bob', 'Smith', '1978-07-22', 'bob.smith@email.com', '555-0102',
   '{"street": "456 Oak Ave", "city": "Los Angeles", "state": "CA", "zip": "90001"}'),
  ('44444444-4444-4444-4444-444444444444', 'CIN345678', 'Carol', 'Williams', '1990-11-08', 'carol.williams@email.com', '555-0103',
   '{"street": "789 Pine Rd", "city": "Chicago", "state": "IL", "zip": "60601"}'),
  ('55555555-5555-5555-5555-555555555555', 'CIN456789', 'David', 'Brown', '1982-01-30', 'david.brown@email.com', '555-0104',
   '{"street": "321 Elm St", "city": "Houston", "state": "TX", "zip": "77001"}'),
  ('66666666-6666-6666-6666-666666666666', 'CIN567890', 'Emma', 'Davis', '1995-05-17', 'emma.davis@email.com', '555-0105',
   '{"street": "654 Maple Dr", "city": "Phoenix", "state": "AZ", "zip": "85001"}'),
  ('77777777-7777-7777-7777-777777777777', 'CIN678901', 'Frank', 'Miller', '1988-09-25', 'frank.miller@email.com', '555-0106',
   '{"street": "987 Cedar Ln", "city": "Philadelphia", "state": "PA", "zip": "19019"}'),
  ('88888888-8888-8888-8888-888888888888', 'CIN789012', 'Grace', 'Wilson', '1975-12-03', 'grace.wilson@email.com', '555-0107',
   '{"street": "147 Birch Ct", "city": "San Antonio", "state": "TX", "zip": "78201"}'),
  ('99999999-9999-9999-9999-999999999999', 'CIN890123', 'Henry', 'Moore', '1992-06-14', 'henry.moore@email.com', '555-0108',
   '{"street": "258 Spruce Way", "city": "San Diego", "state": "CA", "zip": "92101"}')
ON CONFLICT (id) DO NOTHING;

-- Insert enrollments with different statuses

-- Draft enrollments (2)
INSERT INTO enrollments (id, customer_id, agent_id, plan_id, status, effective_date, current_step, completed_steps, session_data, metadata, expires_at)
VALUES
  ('e1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111',
   'f1111111-1111-1111-1111-111111111111', 'draft', NULL, 'customer_info', '[]', '{"last_activity": "2025-09-25T10:00:00Z"}',
   '{"ip": "192.168.1.1"}', '2025-10-07T10:00:00Z'),
  ('e2222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111',
   'f2222222-2222-2222-2222-222222222222', 'draft', NULL, 'plan_selection', '["customer_info"]', '{"last_activity": "2025-09-26T14:30:00Z"}',
   '{"ip": "192.168.1.2"}', '2025-10-08T14:30:00Z')
ON CONFLICT (id) DO NOTHING;

-- In-progress enrollments (3)
INSERT INTO enrollments (id, customer_id, agent_id, plan_id, status, effective_date, current_step, completed_steps, session_data, metadata, expires_at)
VALUES
  ('e3333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111',
   'f3333333-3333-3333-3333-333333333333', 'in_progress', '2025-11-01', 'billing', '["customer_info", "plan_selection", "health_questions"]',
   '{"last_activity": "2025-09-27T09:15:00Z"}', '{"ip": "192.168.1.3"}', '2025-10-09T09:15:00Z'),
  ('e4444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111',
   'f1111111-1111-1111-1111-111111111111', 'in_progress', '2025-11-15', 'beneficiaries', '["customer_info", "plan_selection", "health_questions", "billing"]',
   '{"last_activity": "2025-09-28T16:45:00Z"}', '{"ip": "192.168.1.4"}', '2025-10-10T16:45:00Z'),
  ('e5555555-5555-5555-5555-555555555555', '66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111',
   'f4444444-4444-4444-4444-444444444444', 'in_progress', '2025-12-01', 'review', '["customer_info", "plan_selection", "health_questions", "billing", "beneficiaries"]',
   '{"last_activity": "2025-09-29T11:20:00Z"}', '{"ip": "192.168.1.5"}', '2025-10-11T11:20:00Z')
ON CONFLICT (id) DO NOTHING;

-- Submitted enrollments (2)
INSERT INTO enrollments (id, customer_id, agent_id, plan_id, status, effective_date, current_step, completed_steps, session_data, metadata, submitted_at)
VALUES
  ('e6666666-6666-6666-6666-666666666666', '77777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111',
   'f2222222-2222-2222-2222-222222222222', 'submitted', '2025-11-01', 'submitted', '["customer_info", "plan_selection", "health_questions", "billing", "beneficiaries", "review"]',
   '{"last_activity": "2025-09-20T13:00:00Z"}', '{"ip": "192.168.1.6", "submission_notes": "Complete application"}', '2025-09-20T13:00:00Z'),
  ('e7777777-7777-7777-7777-777777777777', '88888888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111',
   'f3333333-3333-3333-3333-333333333333', 'submitted', '2025-11-10', 'submitted', '["customer_info", "plan_selection", "health_questions", "billing", "beneficiaries", "review"]',
   '{"last_activity": "2025-09-21T15:30:00Z"}', '{"ip": "192.168.1.7", "submission_notes": "Expedited processing requested"}', '2025-09-21T15:30:00Z')
ON CONFLICT (id) DO NOTHING;

-- Approved enrollments (2)
INSERT INTO enrollments (id, customer_id, agent_id, plan_id, status, effective_date, current_step, completed_steps, session_data, metadata, submitted_at, completed_at)
VALUES
  ('e8888888-8888-8888-8888-888888888888', '99999999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111',
   'f1111111-1111-1111-1111-111111111111', 'approved', '2025-10-15', 'completed', '["customer_info", "plan_selection", "health_questions", "billing", "beneficiaries", "review"]',
   '{"last_activity": "2025-09-15T10:00:00Z"}', '{"ip": "192.168.1.8", "approval_notes": "Standard approval"}', '2025-09-15T10:00:00Z', '2025-09-18T14:00:00Z'),
  ('e9999999-9999-9999-9999-999999999999', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111',
   'f4444444-4444-4444-4444-444444444444', 'approved', '2025-10-20', 'completed', '["customer_info", "plan_selection", "health_questions", "billing", "beneficiaries", "review"]',
   '{"last_activity": "2025-09-16T12:00:00Z"}', '{"ip": "192.168.1.9", "approval_notes": "Approved with standard rates"}', '2025-09-16T12:00:00Z', '2025-09-19T16:30:00Z')
ON CONFLICT (id) DO NOTHING;

-- Rejected enrollment (1)
INSERT INTO enrollments (id, customer_id, agent_id, plan_id, status, effective_date, current_step, completed_steps, session_data, metadata, submitted_at, completed_at)
VALUES
  ('ea111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111',
   'f2222222-2222-2222-2222-222222222222', 'rejected', NULL, 'rejected', '["customer_info", "plan_selection", "health_questions", "billing", "beneficiaries", "review"]',
   '{"last_activity": "2025-09-17T09:00:00Z"}', '{"ip": "192.168.1.10", "rejection_reason": "Medical underwriting requirements not met"}', '2025-09-17T09:00:00Z', '2025-09-19T10:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Insert billing data for submitted and approved enrollments
INSERT INTO billing_data (enrollment_id, contribution_amount, contribution_frequency, payment_method_type, payment_method_last_four, payment_method_expiry, encrypted_payment_data, encryption_key_id, effective_date)
VALUES
  ('e6666666-6666-6666-6666-666666666666', 150.00, 'monthly', 'credit_card', '4242', '12/27',
   'eyJjYXJkTnVtYmVyIjogIjQyNDItNDI0Mi00MjQyLTQyNDIiLCAiY3Z2IjogIjEyMyJ9', 'v1', '2025-11-01'),
  ('e7777777-7777-7777-7777-777777777777', 200.00, 'monthly', 'bank_account', '9876', NULL,
   'eyJhY2NvdW50TnVtYmVyIjogIjk4NzY1NDMyMSIsICJyb3V0aW5nTnVtYmVyIjogIjEyMzQ1Njc4OSJ9', 'v1', '2025-11-10'),
  ('e8888888-8888-8888-8888-888888888888', 175.50, 'monthly', 'credit_card', '5555', '06/28',
   'eyJjYXJkTnVtYmVyIjogIjU1NTUtNTU1NS01NTU1LTU1NTUiLCAiY3Z2IjogIjQ1NiJ9', 'v1', '2025-10-15'),
  ('e9999999-9999-9999-9999-999999999999', 225.00, 'quarterly', 'credit_card', '3782', '09/26',
   'eyJjYXJkTnVtYmVyIjogIjM3ODItODIyNDYzLTEwMDA1IiwgImN2diI6ICI3ODkifQ==', 'v1', '2025-10-20')
ON CONFLICT (enrollment_id) DO NOTHING;

-- Insert beneficiaries for some enrollments
INSERT INTO beneficiaries (enrollment_id, type, first_name, last_name, relationship, percentage, date_of_birth, encrypted_ssn, address, display_order)
VALUES
  ('e4444444-4444-4444-4444-444444444444', 'primary', 'Sarah', 'Brown', 'spouse', 60, '1984-04-12',
   'MTIzLTQ1LTY3ODk=', '{"street": "321 Elm St", "city": "Houston", "state": "TX", "zip": "77001"}', 1),
  ('e4444444-4444-4444-4444-444444444444', 'primary', 'Michael', 'Brown', 'child', 40, '2010-08-22',
   'OTg3LTY1LTQzMjE=', '{"street": "321 Elm St", "city": "Houston", "state": "TX", "zip": "77001"}', 2),
  ('e5555555-5555-5555-5555-555555555555', 'primary', 'Robert', 'Davis', 'parent', 100, '1965-03-05',
   'MTExLTIyLTMzMzM=', '{"street": "100 Senior Ln", "city": "Phoenix", "state": "AZ", "zip": "85002"}', 1),
  ('e6666666-6666-6666-6666-666666666666', 'primary', 'Jennifer', 'Miller', 'spouse', 50, '1976-07-18',
   'MjIyLTMzLTQ0NDQ=', '{"street": "987 Cedar Ln", "city": "Philadelphia", "state": "PA", "zip": "19019"}', 1),
  ('e6666666-6666-6666-6666-666666666666', 'contingent', 'Tom', 'Miller', 'child', 50, '2005-11-30',
   'MzMzLTQ0LTU1NTU=', '{"street": "987 Cedar Ln", "city": "Philadelphia", "state": "PA", "zip": "19019"}', 2),
  ('e8888888-8888-8888-8888-888888888888', 'primary', 'Linda', 'Moore', 'spouse', 70, '1990-02-25',
   'NDQ0LTU1LTY2NjY=', '{"street": "258 Spruce Way", "city": "San Diego", "state": "CA", "zip": "92101"}', 1),
  ('e8888888-8888-8888-8888-888888888888', 'contingent', 'Peter', 'Moore', 'sibling', 30, '1985-09-10',
   'NTU1LTY2LTc3Nzc=', '{"street": "300 Ocean Blvd", "city": "San Diego", "state": "CA", "zip": "92102"}', 2)
ON CONFLICT DO NOTHING;

-- Insert step data for enrollments with progress
INSERT INTO enrollment_step_data (enrollment_id, step_id, step_data, version)
VALUES
  ('e3333333-3333-3333-3333-333333333333', 'customer_info',
   '{"verified": true, "verification_date": "2025-09-27T09:00:00Z"}', 1),
  ('e3333333-3333-3333-3333-333333333333', 'plan_selection',
   '{"selected_plan": "plan-003", "coverage_amount": 500000, "term_length": 20}', 1),
  ('e3333333-3333-3333-3333-333333333333', 'health_questions',
   '{"smoker": false, "height": "5-10", "weight": 180, "medical_conditions": []}', 1),
  ('e4444444-4444-4444-4444-444444444444', 'customer_info',
   '{"verified": true, "verification_date": "2025-09-28T15:00:00Z"}', 1),
  ('e4444444-4444-4444-4444-444444444444', 'plan_selection',
   '{"selected_plan": "plan-001", "coverage_amount": 750000, "term_length": 30}', 1),
  ('e4444444-4444-4444-4444-444444444444', 'health_questions',
   '{"smoker": false, "height": "6-2", "weight": 195, "medical_conditions": ["controlled_hypertension"]}', 1),
  ('e5555555-5555-5555-5555-555555555555', 'customer_info',
   '{"verified": true, "verification_date": "2025-09-29T10:00:00Z"}', 1),
  ('e5555555-5555-5555-5555-555555555555', 'plan_selection',
   '{"selected_plan": "plan-004", "coverage_amount": 1000000, "term_length": 25}', 1),
  ('e5555555-5555-5555-5555-555555555555', 'health_questions',
   '{"smoker": true, "height": "5-6", "weight": 150, "medical_conditions": []}', 1)
ON CONFLICT (enrollment_id, step_id) DO NOTHING;