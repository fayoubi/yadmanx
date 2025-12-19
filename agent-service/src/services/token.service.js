import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

class TokenService {
  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || 'change-this-in-production';
    this.TOKEN_EXPIRY_HOURS = 24;
  }

  /**
   * Generate JWT token for agent
   */
  generateToken(agent) {
    const payload = {
      agentId: agent.id,
      phoneNumber: agent.phone_number,
      email: agent.email,
      licenseNumber: agent.license_number,
      firstName: agent.first_name,
      lastName: agent.last_name,
      agencyName: agent.agency_name,
    };

    const token = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: `${this.TOKEN_EXPIRY_HOURS}h`,
      issuer: 'yadmanx-agent-service',
    });

    return token;
  }

  /**
   * Verify and decode JWT token
   */
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET, {
        issuer: 'yadmanx-agent-service',
      });

      return {
        valid: true,
        decoded,
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
      };
    }
  }

  /**
   * Create session in database
   */
  async createSession(agentId, token) {
    const expiresAt = new Date(Date.now() + this.TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    const query = `
      INSERT INTO sessions (agent_id, token, expires_at)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const result = await pool.query(query, [agentId, token, expiresAt]);
    return result.rows[0];
  }

  /**
   * Validate session exists and is not expired
   */
  async validateSession(token) {
    const query = `
      SELECT s.*, a.id as agent_id, a.phone_number, a.email, a.first_name, a.last_name, a.status
      FROM sessions s
      JOIN agents a ON s.agent_id = a.id
      WHERE s.token = $1 AND s.expires_at > NOW()
    `;

    const result = await pool.query(query, [token]);

    if (result.rows.length === 0) {
      return { valid: false, error: 'Session not found or expired' };
    }

    // Update last activity
    await pool.query(
      'UPDATE sessions SET last_activity_at = NOW() WHERE token = $1',
      [token]
    );

    return {
      valid: true,
      session: result.rows[0],
    };
  }

  /**
   * Invalidate session (logout)
   */
  async invalidateSession(token) {
    const query = 'DELETE FROM sessions WHERE token = $1 RETURNING *';
    const result = await pool.query(query, [token]);
    return result.rows.length > 0;
  }

  /**
   * Invalidate all sessions for an agent
   */
  async invalidateAllSessions(agentId) {
    const query = 'DELETE FROM sessions WHERE agent_id = $1';
    await pool.query(query, [agentId]);
  }

  /**
   * Refresh token (generate new token and session)
   */
  async refreshToken(oldToken) {
    const validation = await this.validateSession(oldToken);

    if (!validation.valid) {
      throw new Error('Invalid or expired session');
    }

    const agent = validation.session;

    // Invalidate old session
    await this.invalidateSession(oldToken);

    // Create new token and session
    const newToken = this.generateToken(agent);
    await this.createSession(agent.agent_id, newToken);

    return {
      token: newToken,
      expiresIn: `${this.TOKEN_EXPIRY_HOURS}h`,
    };
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions() {
    await pool.query('DELETE FROM sessions WHERE expires_at < NOW()');
  }
}

export default new TokenService();