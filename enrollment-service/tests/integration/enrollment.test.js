import request from 'supertest';
import app from '../../src/app.js';
import pool from '../../src/config/database.js';

describe('Enrollment Service Integration Tests', () => {
  const agentId = '11111111-1111-1111-1111-111111111111';
  let createdEnrollmentId;

  afterAll(async () => {
    await pool.end();
  });

  describe('POST /api/v1/enrollments', () => {
    it('should create a new enrollment', async () => {
      const response = await request(app)
        .post('/api/v1/enrollments')
        .set('x-agent-id', agentId)
        .send({
          customer: {
            cin: 'TEST123456',
            first_name: 'Test',
            last_name: 'User',
            date_of_birth: '1990-01-01',
            email: 'test@example.com',
            phone: '555-1234',
            address: {
              street: '123 Test St',
              city: 'Test City',
              state: 'TS',
              zip: '12345',
            },
          },
          plan_id: 'test-plan-001',
          effective_date: '2025-11-01',
          metadata: { test: true },
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.status).toBe('draft');

      createdEnrollmentId = response.body.data.id;
    });

    it('should return 400 when missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/enrollments')
        .set('x-agent-id', agentId)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/enrollments/:id', () => {
    it('should get enrollment by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/enrollments/${createdEnrollmentId}`)
        .set('x-agent-id', agentId);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(createdEnrollmentId);
    });

    it('should return 404 for non-existent enrollment', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .get(`/api/v1/enrollments/${fakeId}`)
        .set('x-agent-id', agentId);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/v1/enrollments', () => {
    it('should list enrollments', async () => {
      const response = await request(app)
        .get('/api/v1/enrollments')
        .set('x-agent-id', agentId);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter enrollments by status', async () => {
      const response = await request(app)
        .get('/api/v1/enrollments?status=draft')
        .set('x-agent-id', agentId);

      expect(response.status).toBe(200);
      expect(response.body.data.every((e) => e.status === 'draft')).toBe(true);
    });
  });

  describe('POST /api/v1/enrollments/:id/billing', () => {
    it('should save billing data', async () => {
      const response = await request(app)
        .post(`/api/v1/enrollments/${createdEnrollmentId}/billing`)
        .set('x-agent-id', agentId)
        .send({
          contribution_amount: 100.0,
          contribution_frequency: 'monthly',
          payment_method_type: 'credit_card',
          payment_method_last_four: '1234',
          payment_method_expiry: '12/26',
          payment_method_data: {
            card_number: '4242-4242-4242-4242',
            cvv: '123',
          },
          effective_date: '2025-11-01',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/enrollments/:id/billing', () => {
    it('should get masked billing data', async () => {
      const response = await request(app)
        .get(`/api/v1/enrollments/${createdEnrollmentId}/billing`)
        .set('x-agent-id', agentId);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).not.toHaveProperty('encrypted_payment_data');
    });
  });

  describe('POST /api/v1/enrollments/:id/beneficiaries', () => {
    it('should add beneficiaries', async () => {
      const response = await request(app)
        .post(`/api/v1/enrollments/${createdEnrollmentId}/beneficiaries`)
        .set('x-agent-id', agentId)
        .send({
          beneficiaries: [
            {
              type: 'primary',
              first_name: 'Jane',
              last_name: 'Doe',
              relationship: 'spouse',
              percentage: 100,
              date_of_birth: '1992-05-15',
              ssn: '123-45-6789',
              address: {
                street: '456 Test Ave',
                city: 'Test City',
                state: 'TS',
                zip: '12345',
              },
              display_order: 1,
            },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
    });

    it('should return 400 for invalid percentages', async () => {
      const response = await request(app)
        .post(`/api/v1/enrollments/${createdEnrollmentId}/beneficiaries`)
        .set('x-agent-id', agentId)
        .send({
          beneficiaries: [
            {
              type: 'primary',
              first_name: 'John',
              last_name: 'Doe',
              relationship: 'child',
              percentage: 50, // Invalid total
              date_of_birth: '2010-01-01',
              display_order: 1,
            },
          ],
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/enrollments/:id/summary', () => {
    it('should get enrollment summary', async () => {
      const response = await request(app)
        .get(`/api/v1/enrollments/${createdEnrollmentId}/summary`)
        .set('x-agent-id', agentId);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('enrollment');
      expect(response.body.data).toHaveProperty('billing');
      expect(response.body.data).toHaveProperty('beneficiaries');
      expect(response.body.data).toHaveProperty('steps');
    });
  });

  describe('PATCH /api/v1/enrollments/:id/status', () => {
    it('should update enrollment status', async () => {
      const response = await request(app)
        .patch(`/api/v1/enrollments/${createdEnrollmentId}/status`)
        .set('x-agent-id', agentId)
        .send({
          status: 'in_progress',
          metadata: { note: 'Updated to in_progress' },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('in_progress');
    });
  });

  describe('DELETE /api/v1/enrollments/:id', () => {
    it('should cancel enrollment', async () => {
      const response = await request(app)
        .delete(`/api/v1/enrollments/${createdEnrollmentId}`)
        .set('x-agent-id', agentId);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('cancelled');
    });
  });
});