import pool from '../config/database.js';
import { ApiError } from '../middleware/errorHandler.js';
import customerJsonbService from './customer.jsonb.service.js';

/**
 * Enrollment Service V2 - JSONB-based, No Status, Always Editable
 *
 * This service implements Option B:
 * - All enrollment data stored in JSONB column
 * - No status tracking
 * - No step_data table
 * - Data always saved and always editable
 */
class EnrollmentServiceV2 {
  /**
   * Create a new enrollment
   * @param {string} agentId - UUID of the agent creating the enrollment
   * @returns {Object} The created enrollment
   */
  async create(agentId) {
    const query = `
      INSERT INTO enrollments (agent_id, data)
      VALUES ($1, '{}'::jsonb)
      RETURNING id, agent_id, subscriber_id, insured_id, data, created_at, updated_at
    `;

    const result = await pool.query(query, [agentId]);
    return result.rows[0];
  }

  /**
   * Ensure agent exists in local agents table
   * Auto-creates from JWT token data if missing (lazy sync fallback)
   * @param {string} agentId - UUID of the agent
   * @param {Object} agentData - Agent data from JWT token
   * @param {Object} client - Database client (within transaction)
   * @private
   */
  async _ensureAgentExists(agentId, agentData, client) {
    // Check if agent exists
    const checkQuery = 'SELECT id FROM agents WHERE id = $1';
    const checkResult = await client.query(checkQuery, [agentId]);

    if (checkResult.rows.length === 0) {
      // Agent doesn't exist - create from token data
      console.warn(`Agent ${agentId} not found in enrollment DB - auto-creating from token data`);

      const insertQuery = `
        INSERT INTO agents (id, license_number, first_name, last_name, email, phone, agency_name)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING
      `;

      await client.query(insertQuery, [
        agentId,
        agentData.licenseNumber || 'UNKNOWN',
        agentData.firstName || 'Unknown',
        agentData.lastName || 'Agent',
        agentData.email || `agent-${agentId}@yadmanx.com`,
        agentData.phoneNumber || '',
        agentData.agencyName || 'Default Agency',
      ]);

      console.log(`✅ Agent ${agentId} auto-created in enrollment DB`);
    }
  }

  /**
   * Initialize enrollment with customer data (new flow)
   * Creates customer record(s) and enrollment in a single transaction
   * @param {string} agentId - UUID of the agent creating the enrollment
   * @param {Object} personalInfo - Personal info object with subscriber and optional insured
   * @param {Object} agentData - Agent data from JWT token (for lazy sync fallback)
   * @returns {Object} Object containing enrollment, subscriber, and insured (if applicable)
   */
  async initialize(agentId, personalInfo, agentData = {}) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Ensure agent exists (lazy sync fallback)
      await this._ensureAgentExists(agentId, agentData, client);

      // Create or update subscriber
      const { coreFields: subscriberCoreFields, jsonbData: subscriberJsonbData } =
        customerJsonbService.mapPersonToDb(personalInfo.subscriber);

      const subscriberId = await this._upsertCustomer(
        subscriberCoreFields,
        subscriberJsonbData,
        client
      );

      // Create or update insured (if different from subscriber)
      let insuredId = null;
      const insuredSameAsSubscriber = personalInfo.insuredSameAsSubscriber ?? true;

      if (!insuredSameAsSubscriber && personalInfo.insured) {
        const { coreFields: insuredCoreFields, jsonbData: insuredJsonbData } =
          customerJsonbService.mapPersonToDb(personalInfo.insured);

        insuredId = await this._upsertCustomer(
          insuredCoreFields,
          insuredJsonbData,
          client
        );
      }

      // Create enrollment record with minimal JSONB data (no customer objects)
      const enrollmentData = {
        personalInfo: {
          insuredSameAsSubscriber
        }
      };

      const enrollmentQuery = `
        INSERT INTO enrollments (agent_id, subscriber_id, insured_id, data)
        VALUES ($1, $2, $3, $4)
        RETURNING id, agent_id, subscriber_id, insured_id, data, created_at, updated_at
      `;

      const enrollmentResult = await client.query(enrollmentQuery, [
        agentId,
        subscriberId,
        insuredId,
        JSON.stringify(enrollmentData)
      ]);

      // Retrieve customer records to return
      const subscriberQuery = 'SELECT * FROM customers WHERE id = $1';
      const subscriberResult = await client.query(subscriberQuery, [subscriberId]);

      let insuredResult = null;
      if (insuredId) {
        const insuredQuery = 'SELECT * FROM customers WHERE id = $1';
        insuredResult = await client.query(insuredQuery, [insuredId]);
      }

      await client.query('COMMIT');

      return {
        enrollment: enrollmentResult.rows[0],
        subscriber: subscriberResult.rows[0] ?
          customerJsonbService.flattenCustomerRow(subscriberResult.rows[0]) : null,
        insured: insuredResult?.rows[0] ?
          customerJsonbService.flattenCustomerRow(insuredResult.rows[0]) : null
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get enrollment by ID with subscriber and insured customer info
   * @param {string} enrollmentId - UUID of the enrollment
   * @returns {Object|null} The enrollment with subscriber and insured data
   */
  async getById(enrollmentId) {
    const query = `
      SELECT
        e.id,
        e.agent_id,
        e.subscriber_id,
        e.insured_id,
        e.data,
        e.created_at,
        e.updated_at,

        -- Subscriber customer data
        cs.id as subscriber_customer_id,
        cs.cin as subscriber_cin,
        cs.first_name as subscriber_first_name,
        cs.last_name as subscriber_last_name,
        cs.email as subscriber_email,
        cs.phone as subscriber_phone,
        cs.address as subscriber_address,
        cs.data as subscriber_data,

        -- Insured customer data
        ci.id as insured_customer_id,
        ci.cin as insured_cin,
        ci.first_name as insured_first_name,
        ci.last_name as insured_last_name,
        ci.email as insured_email,
        ci.phone as insured_phone,
        ci.address as insured_address,
        ci.data as insured_data

      FROM enrollments e
      LEFT JOIN customers cs ON e.subscriber_id = cs.id
      LEFT JOIN customers ci ON e.insured_id = ci.id
      WHERE e.id = $1 AND e.deleted_at IS NULL
    `;

    const result = await pool.query(query, [enrollmentId]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    return {
      id: row.id,
      agent_id: row.agent_id,
      subscriber_id: row.subscriber_id,
      insured_id: row.insured_id,
      data: row.data,
      created_at: row.created_at,
      updated_at: row.updated_at,

      subscriber: row.subscriber_customer_id ? customerJsonbService.flattenCustomerRow({
        id: row.subscriber_customer_id,
        cin: row.subscriber_cin,
        first_name: row.subscriber_first_name,
        last_name: row.subscriber_last_name,
        email: row.subscriber_email,
        phone: row.subscriber_phone,
        address: row.subscriber_address,
        data: row.subscriber_data
      }) : null,

      insured: row.insured_customer_id ? customerJsonbService.flattenCustomerRow({
        id: row.insured_customer_id,
        cin: row.insured_cin,
        first_name: row.insured_first_name,
        last_name: row.insured_last_name,
        email: row.insured_email,
        phone: row.insured_phone,
        address: row.insured_address,
        data: row.insured_data
      }) : null
    };
  }

  /**
   * List enrollments for an agent
   * Shows subscriber info for display (subscriber is the primary contact)
   * @param {string} agentId - UUID of the agent
   * @param {number} limit - Max number of results
   * @param {number} offset - Offset for pagination
   * @returns {Object} Object with enrollments array and pagination info
   */
  async list(agentId, limit = 50, offset = 0) {
    const query = `
      SELECT
        e.id,
        e.agent_id,
        e.subscriber_id,
        e.insured_id,
        e.data,
        e.created_at,
        e.updated_at,
        -- Subscriber data (always shown)
        c.cin as subscriber_cin,
        c.first_name as subscriber_first_name,
        c.last_name as subscriber_last_name,
        c.email as subscriber_email,
        c.phone as subscriber_phone,
        CASE
          WHEN c.data IS NOT NULL AND c.data != '{}'::jsonb
          THEN (c.data::jsonb)->'address'->>'city'
          ELSE NULL
        END as subscriber_city,
        CASE
          WHEN c.data IS NOT NULL AND c.data != '{}'::jsonb
          THEN (c.data::jsonb)->>'dateOfBirth'
          ELSE NULL
        END as subscriber_dob,
        CASE
          WHEN c.data IS NOT NULL AND c.data != '{}'::jsonb
          THEN (c.data::jsonb)->>'birthPlace'
          ELSE NULL
        END as subscriber_birth_place,
        -- Status indicator based on data presence
        CASE
          WHEN e.data ? 'beneficiaries' THEN 'completed'
          WHEN e.data ? 'contribution' THEN 'in_progress'
          WHEN e.subscriber_id IS NOT NULL THEN 'draft'
          ELSE 'new'
        END as status
      FROM enrollments e
      LEFT JOIN customers c ON e.subscriber_id = c.id AND c.deleted_at IS NULL
      WHERE e.agent_id = $1 AND e.deleted_at IS NULL
      ORDER BY e.updated_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [agentId, limit, offset]);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) FROM enrollments
      WHERE agent_id = $1 AND deleted_at IS NULL
    `;
    const countResult = await pool.query(countQuery, [agentId]);

    return {
      enrollments: result.rows.map(row => ({
        id: row.id,
        agent_id: row.agent_id,
        subscriber_id: row.subscriber_id,
        insured_id: row.insured_id,
        first_name: row.subscriber_first_name,
        last_name: row.subscriber_last_name,
        email: row.subscriber_email,
        phone: row.subscriber_phone,
        cin: row.subscriber_cin,
        city: row.subscriber_city,
        date_of_birth: row.subscriber_dob,
        birth_place: row.subscriber_birth_place,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
        data: row.data
      })),
      pagination: {
        limit,
        offset,
        total: parseInt(countResult.rows[0].count)
      }
    };
  }

  /**
   * Helper function to upsert customer (create or update)
   * @private
   * @param {Object} coreFields - Core customer fields
   * @param {Object} jsonbData - JSONB data object
   * @param {Object} client - Database client (for transaction)
   * @returns {string} Customer ID
   */
  async _upsertCustomer(coreFields, jsonbData, client) {
    // Try to find existing by CIN
    const existingQuery = 'SELECT id FROM customers WHERE cin = $1';
    const existingResult = await client.query(existingQuery, [coreFields.cin]);

    if (existingResult.rows.length > 0) {
      // Update existing customer - store all data in JSONB
      const updateQuery = `
        UPDATE customers
        SET
          first_name = $1,
          last_name = $2,
          email = $3,
          phone = $4,
          address = $5,
          data = $6,
          updated_at = CURRENT_TIMESTAMP
        WHERE cin = $7
        RETURNING id
      `;

      const result = await client.query(updateQuery, [
        coreFields.first_name,
        coreFields.last_name,
        coreFields.email,
        coreFields.phone,
        JSON.stringify(jsonbData.address || {}),
        JSON.stringify(jsonbData),
        coreFields.cin
      ]);

      return result.rows[0].id;
    } else {
      // Create new customer - store all data in JSONB
      const insertQuery = `
        INSERT INTO customers (
          cin, first_name, last_name, email, phone,
          address, data
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `;

      const result = await client.query(insertQuery, [
        coreFields.cin,
        coreFields.first_name,
        coreFields.last_name,
        coreFields.email,
        coreFields.phone,
        JSON.stringify(jsonbData.address || {}),
        JSON.stringify(jsonbData)
      ]);

      return result.rows[0].id;
    }
  }

  /**
   * Update enrollment data (always allowed, no status check)
   * Handles separate subscriber and insured customers
   * @param {string} enrollmentId - UUID of the enrollment
   * @param {Object} enrollmentData - New data to merge into enrollment.data
   * @returns {Object} The updated enrollment
   */
  async update(enrollmentId, enrollmentData) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get current enrollment
      const getCurrentQuery = 'SELECT data, subscriber_id, insured_id FROM enrollments WHERE id = $1 AND deleted_at IS NULL';
      const currentResult = await client.query(getCurrentQuery, [enrollmentId]);

      if (currentResult.rows.length === 0) {
        throw new ApiError(404, 'Enrollment not found');
      }

      const currentData = currentResult.rows[0].data || {};
      let subscriberId = currentResult.rows[0].subscriber_id;
      let insuredId = currentResult.rows[0].insured_id;

      // Merge new data with existing data
      const mergedData = {
        ...currentData,
        ...enrollmentData
      };

      // Process subscriber
      if (enrollmentData.personalInfo?.subscriber) {
        const { coreFields, jsonbData } = customerJsonbService.mapPersonToDb(
          enrollmentData.personalInfo.subscriber
        );
        subscriberId = await this._upsertCustomer(coreFields, jsonbData, client);
      }

      // Process insured
      const insuredSameAsSubscriber = mergedData.personalInfo?.insuredSameAsSubscriber ?? true;

      if (insuredSameAsSubscriber) {
        // Self-insured: insured_id should be NULL
        insuredId = null;
      } else if (enrollmentData.personalInfo?.insured) {
        // Different insured: create/update separate customer
        const { coreFields, jsonbData } = customerJsonbService.mapPersonToDb(
          enrollmentData.personalInfo.insured
        );
        insuredId = await this._upsertCustomer(coreFields, jsonbData, client);
      }

      // Clean JSONB: Remove subscriber and insured objects
      if (mergedData.personalInfo) {
        const { subscriber, insured, ...restPersonalInfo } = mergedData.personalInfo;
        mergedData.personalInfo = restPersonalInfo;
      }

      // Update enrollment
      const updateEnrollmentQuery = `
        UPDATE enrollments
        SET
          data = $1,
          subscriber_id = $2,
          insured_id = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING id, agent_id, subscriber_id, insured_id, data, created_at, updated_at
      `;

      const result = await client.query(updateEnrollmentQuery, [
        JSON.stringify(mergedData),
        subscriberId,
        insuredId,
        enrollmentId
      ]);

      await client.query('COMMIT');

      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Soft delete enrollment
   * @param {string} enrollmentId - UUID of the enrollment
   * @returns {Object} The deleted enrollment
   */
  async delete(enrollmentId) {
    const query = `
      UPDATE enrollments
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id
    `;

    const result = await pool.query(query, [enrollmentId]);

    if (result.rows.length === 0) {
      throw new ApiError(404, 'Enrollment not found');
    }

    return result.rows[0];
  }
}

export default new EnrollmentServiceV2();
