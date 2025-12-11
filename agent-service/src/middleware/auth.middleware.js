import tokenService from '../services/token.service.js';
import { ApiError } from './errorHandler.js';

/**
 * Middleware to validate JWT token
 */
export const authenticateToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw new ApiError(401, 'Access token required');
    }

    // Verify token
    const verification = tokenService.verifyToken(token);

    if (!verification.valid) {
      throw new ApiError(401, 'Invalid or expired token');
    }

    // Validate session in database
    const sessionValidation = await tokenService.validateSession(token);

    if (!sessionValidation.valid) {
      throw new ApiError(401, 'Session expired or invalid');
    }

    // Attach agent info to request
    req.agent = {
      id: sessionValidation.session.agent_id,
      phoneNumber: sessionValidation.session.phone_number,
      email: sessionValidation.session.email,
      firstName: sessionValidation.session.first_name,
      lastName: sessionValidation.session.last_name,
      licenseNumber: sessionValidation.session.license_number,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to validate token for other services (public endpoint)
 */
export const validateTokenForServices = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      throw new ApiError(400, 'Token is required');
    }

    // Verify token
    const verification = tokenService.verifyToken(token);

    if (!verification.valid) {
      return res.json({
        valid: false,
        error: 'Invalid or expired token',
      });
    }

    // Validate session
    const sessionValidation = await tokenService.validateSession(token);

    if (!sessionValidation.valid) {
      return res.json({
        valid: false,
        error: 'Session not found or expired',
      });
    }

    res.json({
      valid: true,
      agent: {
        id: sessionValidation.session.agent_id,
        phoneNumber: sessionValidation.session.phone_number,
        email: sessionValidation.session.email,
        firstName: sessionValidation.session.first_name,
        lastName: sessionValidation.session.last_name,
        status: sessionValidation.session.status,
        licenseNumber: sessionValidation.session.license_number,
      },
    });
  } catch (error) {
    next(error);
  }
};