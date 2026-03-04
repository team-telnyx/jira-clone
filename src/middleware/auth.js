/**
 * Authentication middleware
 * 
 * In a production environment, this would validate JWT tokens,
 * session cookies, or API keys. For MVP purposes, we use a
 * simplified header-based authentication.
 */

/**
 * Extract user from request headers
 * For development/testing, accepts X-User-Id header
 * In production, this would validate JWT/session tokens
 */
function authMiddleware(req, res, next) {
  const userId = req.headers['x-user-id'];
  const authHeader = req.headers['authorization'];

  // Check for user ID header (development/testing)
  if (userId) {
    req.user = { id: userId };
    return next();
  }

  // Check for Bearer token (placeholder for JWT validation)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // In production: validate JWT and extract user
    // For now, we just extract a user ID from the token
    // Format: Bearer user_<userId>
    if (token.startsWith('user_')) {
      req.user = { id: token };
      return next();
    }
  }

  // No authentication provided
  return res.status(401).json({
    success: false,
    error: {
      message: 'Authentication required. Provide X-User-Id header or Bearer token.',
      status: 401,
    },
  });
}

/**
 * Optional authentication - doesn't require auth but extracts user if present
 */
function optionalAuth(req, _res, next) {
  const userId = req.headers['x-user-id'];
  const authHeader = req.headers['authorization'];

  if (userId) {
    req.user = { id: userId };
  } else if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token.startsWith('user_')) {
      req.user = { id: token };
    }
  }

  return next();
}

module.exports = {
  authMiddleware,
  optionalAuth,
};
