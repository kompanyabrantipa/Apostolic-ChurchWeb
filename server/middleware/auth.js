const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
require('dotenv').config();

// JWT secret from environment
const JWT_SECRET = process.env.JWT_SECRET || 'apostolic_church_jwt_secret_key_2024_very_secure_minimum_32_chars';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Generate JWT token
function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Verify JWT token middleware
async function verifyToken(req, res, next) {
  try {
    // Get token from cookie or Authorization header
    let token = req.cookies?.authToken;
    
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user from database to ensure they still exist
    const userResult = await query('SELECT id, username, role FROM users WHERE id = $1', [decoded.id]);
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token. User not found.' 
      });
    }

    // Add user to request object
    req.user = userResult.rows[0];
    next();

  } catch (error) {
    console.error('Token verification error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token.' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired.' 
      });
    }

    return res.status(500).json({ 
      success: false, 
      message: 'Token verification failed.' 
    });
  }
}

// Optional authentication middleware (doesn't fail if no token)
async function optionalAuth(req, res, next) {
  try {
    // Get token from cookie or Authorization header
    let token = req.cookies?.authToken;
    
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userResult = await query('SELECT id, username, role FROM users WHERE id = $1', [decoded.id]);
        
        if (userResult.rows.length > 0) {
          req.user = userResult.rows[0];
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
  generateToken,
  verifyToken,
  optionalAuth,
  requireRole,
  requireAdmin,
  JWT_SECRET,
  JWT_EXPIRES_IN
};
