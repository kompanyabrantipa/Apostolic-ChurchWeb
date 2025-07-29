const express = require('express');
const bcrypt = require('bcryptjs');
const { body } = require('express-validator');
const { DataStore } = require('../models/DataStore');
const { generateToken, authMiddleware } = require('../middleware/auth');
const { loginLimiter, validate } = require('../middleware/validation');

const router = express.Router();
const adminStore = new DataStore('admins');

/**
 * @route   POST /api/auth/login
 * @desc    Login admin user
 * @access  Public
 */
router.post('/login', loginLimiter, [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').trim().notEmpty().withMessage('Password is required'),
  validate
], async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Get all admins
    const admins = await adminStore.getAll();
    
    // Find admin by username
    const admin = admins.find(a => a.username === username);
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, admin.password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Generate token
    const token = generateToken(admin);
    
    // Return token and admin info
    return res.json({
      success: true,
      message: 'Login successful',
      token,
      admin: {
        id: admin.id,
        username: admin.username
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

/**
 * @route   GET /api/auth/verify
 * @desc    Verify token and get admin info
 * @access  Private
 */
router.get('/verify', authMiddleware, async (req, res) => {
  try {
    return res.json({
      success: true,
      message: 'Token is valid',
      admin: req.admin
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during token verification'
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout admin (client-side only)
 * @access  Public
 */
router.post('/logout', (req, res) => {
  return res.json({
    success: true,
    message: 'Logout successful'
  });
});

module.exports = router;