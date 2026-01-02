import jwt from 'jsonwebtoken';

/**
 * JWT Authentication Middleware
 * Extracts and verifies JWT token from Authorization header
 * Populates req.agent with decoded token data
 */
const authenticateAgent = (req, res, next) => {
  try {
    // Get token from Authorization header (Bearer token)
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Fallback for development: check x-agent-id header
      const testAgentId = req.headers['x-agent-id'];

      if (testAgentId) {
        req.agentId = testAgentId;
        req.agent = {
          id: testAgentId
        };
        req.ipAddress = req.ip || req.connection.remoteAddress;
        req.userAgent = req.get('user-agent') || 'unknown';
        return next();
      }

      return res.status(401).json({
        success: false,
        error: 'No authorization token provided'
      });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Get JWT secret from environment
    const jwtSecret = process.env.JWT_SECRET || 'change-this-in-production';

    // Verify token
    const decoded = jwt.verify(token, jwtSecret, {
      issuer: 'yadmanx-agent-service'
    });

    // Populate request with agent info from token
    req.agentId = decoded.agentId;
    req.agent = {
      id: decoded.agentId,
      email: decoded.email,
      phoneNumber: decoded.phoneNumber,
      licenseNumber: decoded.licenseNumber,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      agencyName: decoded.agencyName
    };
    req.ipAddress = req.ip || req.connection.remoteAddress;
    req.userAgent = req.get('user-agent') || 'unknown';

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
  }
};

export { authenticateAgent };