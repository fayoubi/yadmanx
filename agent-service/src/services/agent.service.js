import pool from '../config/database.js';
import crypto from 'crypto';

class AgentService {
  /**
   * Generate license number in format: AG-YYYY-XXXXXX
   * Example: AG-2025-482917
   */
  generateLicenseNumber() {
    const year = new Date().getFullYear();
    const randomSixDigit = crypto.randomInt(100000, 999999).toString();
    return `AG-${year}-${randomSixDigit}`;
  }

  /**
   * Validate phone number format and country code
   */
  validatePhoneNumber(phoneNumber, countryCode) {
    const validCountryCodes = ['+212', '+33']; // Morocco and France

    if (!validCountryCodes.includes(countryCode)) {
      throw new Error('Only Morocco (+212) and France (+33) phone numbers are supported');
    }

    // Remove any spaces or dashes
    const cleanPhone = phoneNumber.replace(/[\s-]/g, '');

    // Morocco: 9 digits (after country code)
    // France: 9 digits (after country code)
    if (cleanPhone.length < 9 || cleanPhone.length > 12) {
      throw new Error('Invalid phone number format');
    }

    return cleanPhone;
  }

  /**
   * Register new agent
   */
  async register(agentData) {
    const {  phone_number, country_code, first_name, last_name, email, license_number, agency_name } = agentData;

    // Validate phone number
    const validatedPhone = this.validatePhoneNumber(phone_number, country_code);

    // Validate license number
    if (!license_number || license_number.trim().length === 0) {
      throw new Error('License number is required');
    }
    if (license_number.trim().length > 6) {
      throw new Error('License number must be 6 characters or less');
    }

    // Check if agent already exists
    const existingQuery = `
      SELECT * FROM agents
      WHERE phone_number = $1 OR email = $2 OR license_number = $3
    `;
    const existingResult = await pool.query(existingQuery, [validatedPhone, email, license_number.trim()]);

    if (existingResult.rows.length > 0) {
      const existing = existingResult.rows[0];
      if (existing.phone_number === validatedPhone) {
        throw new Error('Phone number already registered');
      }
      if (existing.email === email) {
        throw new Error('Email already registered');
      }
      if (existing.license_number === license_number.trim()) {
        throw new Error('License number already registered');
      }
    }

    // Insert new agent
    const insertQuery = `
      INSERT INTO agents (phone_number, country_code, first_name, last_name, email, license_number, agency_name, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      validatedPhone,
      country_code,
      first_name,
      last_name,
      email,
      license_number.trim(),
      agency_name || null,
    ]);

    return result.rows[0];
  }

  /**
   * Get agent by phone number
   */
  async getByPhoneNumber(phoneNumber) {
    const query = 'SELECT * FROM agents WHERE phone_number = $1';
    const result = await pool.query(query, [phoneNumber]);
    return result.rows[0] || null;
  }

  /**
   * Get agent by ID
   */
  async getById(agentId) {
    const query = 'SELECT * FROM agents WHERE id = $1';
    const result = await pool.query(query, [agentId]);
    return result.rows[0] || null;
  }

  /**
   * Get agent by email
   */
  async getByEmail(email) {
    const query = 'SELECT * FROM agents WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  }

  /**
   * Update agent profile
   */
  async updateProfile(agentId, updates) {
    const allowedFields = ['first_name', 'last_name', 'email'];
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    // Check if email is being changed and if it's already taken
    if (updates.email) {
      const existingQuery = 'SELECT id FROM agents WHERE email = $1 AND id != $2';
      const existingResult = await pool.query(existingQuery, [updates.email, agentId]);
      if (existingResult.rows.length > 0) {
        throw new Error('Email already in use');
      }
    }

    values.push(agentId);
    const query = `
      UPDATE agents
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new Error('Agent not found');
    }

    return result.rows[0];
  }

  /**
   * Update agent status
   */
  async updateStatus(agentId, status) {
    const validStatuses = ['active', 'inactive', 'suspended'];

    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status');
    }

    const query = `
      UPDATE agents
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [status, agentId]);

    if (result.rows.length === 0) {
      throw new Error('Agent not found');
    }

    return result.rows[0];
  }

  /**
   * Update last login timestamp for agent
   */
  async updateLastLogin(agentId) {
    const query = `
      UPDATE agents
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [agentId]);

    if (result.rows.length === 0) {
      throw new Error('Agent not found');
    }

    return result.rows[0];
  }

  /**
   * Get agent's enrollments from enrollment-service
   */
  async getAgentEnrollments(agentId) {
    try {
      // Call enrollment-service API
      const enrollmentServiceUrl = process.env.ENROLLMENT_SERVICE_URL || 'http://localhost:3002';
      const response = await fetch(`${enrollmentServiceUrl}/api/v1/enrollments?agentId=${agentId}`);

      if (!response.ok) {
        if (response.status === 404) {
          // No enrollments found
          return [];
        }
        throw new Error(`Enrollment service responded with status: ${response.status}`);
      }

      const data = await response.json();
      return data.enrollments || data.data || [];
    } catch (error) {
      console.error('Error fetching agent enrollments:', error);
      throw new Error('Failed to fetch enrollments from enrollment service');
    }
  }

  /**
   * Sync agent to enrollment service
   * Called after registration or login to ensure agent exists in enrollment DB
   * @param {Object} agent - Agent object from database
   * @returns {boolean} - True if sync successful, false otherwise
   */
  async syncToEnrollmentService(agent) {
    try {
      const enrollmentServiceUrl = process.env.ENROLLMENT_SERVICE_URL || 'http://localhost:3002';

      const response = await fetch(`${enrollmentServiceUrl}/api/v1/agents/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: agent.id,
          first_name: agent.first_name,
          last_name: agent.last_name,
          email: agent.email,
          phone: agent.phone_number,
          license_number: agent.license_number,
          agency_name: agent.agency_name || 'Default Agency',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to sync agent to enrollment service:', errorData);
        // Don't throw - sync failure shouldn't block registration/login
        return false;
      }

      console.log(`✅ Agent ${agent.id} synced to enrollment service`);
      return true;
    } catch (error) {
      console.error('Error syncing agent to enrollment service:', error.message);
      // Don't throw - sync failure shouldn't block registration/login
      return false;
    }
  }
}

export default new AgentService();