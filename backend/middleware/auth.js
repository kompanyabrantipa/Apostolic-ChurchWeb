const jwt = require('jsonwebtoken');
const { DataStore } = require('../models/DataStore');

// JWT secret - should be in environment variables in production
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

// Admin data store
const adminStore = new DataStore('admins');

/**
 * Authentication middleware to protect routes
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if admin exists
    const admins = await adminStore.getAll();
    const admin = admins.find(a => a.id === decoded.id);
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token'
      });
    }
    
    // Add admin to request object
    req.admin = {
      id: admin.id,
      username: admin.username
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
        expired: true
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token'
    });
  }
};

/**
 * Generate JWT token for admin
 */
const generateToken = (admin) => {
  return jwt.sign(
    { id: admin.id, username: admin.username },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

module.exports = {
  authMiddleware,
  generateToken,
  JWT_SECRET
};
