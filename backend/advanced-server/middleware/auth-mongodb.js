const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models-mongodb/User');
const RefreshToken = require('../models-mongodb/RefreshToken');
require('dotenv').config();

// JWT secrets from environment
const JWT_SECRET = process.env.JWT_SECRET || 'apostolic_church_jwt_secret_key_2024_very_secure_minimum_32_chars';
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m'; // Short-lived access token
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'; // Long-lived refresh token

// Generate access token (short-lived)
function generateAccessToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      role: user.role,
      type: 'access' // Identify token type
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );
}

// Generate refresh token (long-lived, stored securely)
function generateRefreshToken(user) {
  const refreshToken = crypto.randomBytes(40).toString('hex');
  const refreshTokenId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + (parseInt(REFRESH_TOKEN_EXPIRES_IN.replace('d', '')) * 24 * 60 * 60 * 1000));
  
  return {
    token: refreshToken,
    id: refreshTokenId,
    expiresAt: expiresAt
  };
}

// Verify JWT token with proper error handling
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Ensure token is an access token (not a refresh token)
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }
    
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('TokenExpiredError');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('InvalidTokenError');
    } else {
      throw error;
    }
  }
}

// Verify JWT token middleware with proper error handling
async function verifyToken(req, res, next) {
  try {
    // Get token from Authorization header (preferably)
    let token = null;
    const authHeader = req.headers.authorization;
    
    // NEVER assume Authorization header exists
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (tokenError) {
      if (tokenError.message === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false, 
          message: 'Token expired.' 
        });
      } else if (tokenError.message === 'InvalidTokenError') {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid token.' 
        });
      } else if (tokenError.message === 'Invalid token type') {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid token type.' 
        });
      } else {
        return res.status(401).json({ 
          success: false, 
          message: 'Token verification failed.' 
        });
      }
    }
    
    // Get user from MongoDB to ensure they still exist
    let user;
    try {
      user = await User.findById(decoded.id);
    } catch (dbError) {
      console.error('Database error during token verification:', dbError);
      return res.status(500).json({ 
        success: false, 
        message: 'Database error occurred.' 
      });
    }
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token. User not found.' 
      });
    }

    // Add user to request object
    req.user = {
      id: user._id.toString(),
      username: user.username,
      role: user.role
    };
    next();

  } catch (error) {
    console.error('Token verification error:', error);
    
    // Return controlled 401 response
    return res.status(500).json({ 
      success: false, 
      message: 'Token verification failed.' 
    });
  }
}

// Optional authentication middleware (doesn't fail if no token)
async function optionalAuth(req, res, next) {
  try {
    // Get token from Authorization header
    let token = null;
    const authHeader = req.headers.authorization;
    
    // Check if Authorization header exists
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (token) {
      try {
        const decoded = verifyToken(token);
        const user = await User.findById(decoded.id);
        
        if (user) {
          req.user = {
            id: user._id.toString(),
            username: user.username,
            role: user.role
          };
        }
      } catch (error) {
        // Token invalid, but continue without user
        console.log('Optional auth failed:', error.message);
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next(); // Continue even if error
  }
}

// Verify refresh token and generate new access token
async function verifyRefreshToken(refreshToken) {
  try {
    // Find the refresh token in database (this will internally hash and compare)
    const tokenRecord = await RefreshToken.findByToken(refreshToken);
    
    if (!tokenRecord) {
      throw new Error('Invalid refresh token');
    }
    
    // Get user associated with the refresh token
    const user = await User.findById(tokenRecord.userId);
    
    if (!user) {
      // Token exists but user doesn't - revoke the token
      await RefreshToken.revokeToken(refreshToken);
      throw new Error('User not found');
    }
    
    return user;
  } catch (error) {
    throw error;
  }
}

// Role-based authorization middleware
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required.' 
      });
    }

    if (req.user.role !== role && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions.' 
      });
    }

    next();
  };
}

// Admin-only middleware
function requireAdmin(req, res, next) {
  return requireRole('admin')(req, res, next);
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  optionalAuth,
  requireRole,
  requireAdmin,
  JWT_SECRET,
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN
};