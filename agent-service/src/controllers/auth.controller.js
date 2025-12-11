import agentService from '../services/agent.service.js';
import otpService from '../services/otp.service.js';
import tokenService from '../services/token.service.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';

class AuthController {
  // POST /api/v1/auth/register - Register new agent
  register = asyncHandler(async (req, res) => {
    const { phone_number, country_code, first_name, last_name, email, license_number, agency_name } = req.body;

    if (!phone_number || !country_code || !first_name || !last_name || !license_number) {
      throw new ApiError(400, 'phone_number, country_code, first_name, last_name, and license_number are required');
    }

    // Register the agent
    const agent = await agentService.register({
      phone_number,
      country_code,
      first_name,
      last_name,
      email,
      license_number,
      agency_name,
    });

    // Generate OTP for verification
    const otp = await otpService.createOTP(agent.phone_number, 'sms');

    res.status(201).json({
      success: true,
      message: 'Agent registered successfully. Please verify OTP.',
      data: {
        agent: {
          id: agent.id,
          first_name: agent.first_name,
          last_name: agent.last_name,
          email: agent.email,
          phone_number: agent.phone_number,
          country_code: agent.country_code,
          license_number: agent.license_number,
          agency_name: agent.agency_name,
          is_active: agent.is_active,
          created_at: agent.created_at,
        },
        otp: {
          code: otp.code,
          expires_at: otp.expiresAt,
        },
      },
    });
  });

  // POST /api/v1/auth/request-otp - Request OTP for login
  requestOTP = asyncHandler(async (req, res) => {
    const { phone_number, country_code } = req.body;

    if (!phone_number) {
      throw new ApiError(400, 'phone_number is required');
    }

    // Check if agent exists
    const agent = await agentService.getByPhoneNumber(phone_number);

    if (!agent) {
      throw new ApiError(404, 'Agent not registered');
    }

    // Create OTP
    const otp = await otpService.createOTP(agent.phone_number, 'sms');

    res.json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        phone_number: agent.phone_number,
        otp: {
          code: otp.code || '',
          expires_at: otp.expiresAt || '',
        },
      },
    });
  });

  // POST /api/v1/auth/verify-otp - Verify OTP and login
  verifyOTP = asyncHandler(async (req, res) => {
    const { phone_number, code } = req.body;

    if (!phone_number || !code) {
      throw new ApiError(400, 'phone_number and code are required');
    }

    // Verify OTP
    await otpService.verifyOTP(phone_number, code);

    // Get agent
    const agent = await agentService.getByPhoneNumber(phone_number);

    if (!agent) {
      throw new ApiError(404, 'Agent not found');
    }

    // Update last login timestamp
    await agentService.updateLastLogin(agent.id);

    // Generate token
    const token = tokenService.generateToken(agent);

    // Create session
    await tokenService.createSession(agent.id, token);

    res.json({
      success: true,
      token: token,
      expiresIn: '24h',
      agent: {
        id: agent.id,
        phone_number: agent.phone_number,
        country_code: agent.country_code,
        first_name: agent.first_name,
        last_name: agent.last_name,
        email: agent.email,
        license_number: agent.license_number,
        status: agent.status,
      },
    });
  });

  // POST /api/v1/auth/refresh - Refresh access token
  refreshToken = asyncHandler(async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authorization token required');
    }

    const token = authHeader.substring(7);

    // Refresh token
    const tokenData = await tokenService.refreshToken(token);

    res.json({
      success: true,
      token: tokenData.token,
      expiresIn: tokenData.expiresIn,
    });
  });

  // POST /api/v1/auth/logout - Logout and invalidate session
  logout = asyncHandler(async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authorization token required');
    }

    const token = authHeader.substring(7);

    // Invalidate session
    await tokenService.invalidateSession(token);

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  });

  // POST /api/v1/auth/validate - Validate JWT token (for other services)
  validate = asyncHandler(async (req, res) => {
    const { token } = req.body;

    if (!token) {
      return res.json({
        valid: false,
        error: 'Token is required',
      });
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
      },
    });
  });
}

export default new AuthController();