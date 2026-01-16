const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models-mongodb/User');
const RefreshToken = require('../models-mongodb/RefreshToken');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../middleware/auth-mongodb');

const router = express.Router();

// Login endpoint - matches existing auth-guard.js pattern
router.post('/login', [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { username, password } = req.body;

    // Find user in MongoDB
    const user = await User.findByUsername(username);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Verify password using Mongoose method
    const isValidPassword = await user.comparePassword(password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Generate access token
    const accessToken = generateAccessToken({
      id: user._id.toString(),
      username: user.username,
      role: user.role
    });

    // Generate refresh token
    const refreshTokenObj = generateRefreshToken({
      id: user._id.toString(),
      username: user.username,
      role: user.role
    });

    // Store refresh token in database
    await RefreshToken.createToken({
      id: refreshTokenObj.id,
      userId: user._id.toString(),
      token: refreshTokenObj.token,
      expiresAt: refreshTokenObj.expiresAt,
      userAgent: req.get('User-Agent') || '',
      ip: req.ip || ''
    });

    // Set refresh token as HTTP-only cookie for security
    res.cookie('refreshToken', refreshTokenObj.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Return success response with access token
    res.json({
      success: true,
      message: 'Login successful',
      user: user.toJSON(),
      accessToken, // Provide access token for Authorization header usage
      refreshToken: refreshTokenObj.token // Provide refresh token for client storage (though primarily in cookie)
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
  try {
    // Get refresh token from cookie
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      // Revoke the refresh token
      await RefreshToken.revokeToken(refreshToken);
    }

    // Clear the auth cookies
    res.clearCookie('refreshToken');
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

// Refresh token endpoint
router.post('/refresh-token', async (req, res) => {
  try {
    // Get refresh token from cookie
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'No refresh token provided'
      });
    }

    try {
      // Verify the refresh token and get user
      const user = await verifyRefreshToken(refreshToken);

      // Generate new access token
      const newAccessToken = generateAccessToken({
        id: user._id.toString(),
        username: user.username,
        role: user.role
      });

      // Optionally generate a new refresh token (rotate refresh tokens)
      const newRefreshTokenObj = generateRefreshToken({
        id: user._id.toString(),
        username: user.username,
        role: user.role
      });

      // Store new refresh token in database
      await RefreshToken.createToken({
        id: newRefreshTokenObj.id,
        userId: user._id.toString(),
        token: newRefreshTokenObj.token,
        expiresAt: newRefreshTokenObj.expiresAt,
        userAgent: req.get('User-Agent') || '',
        ip: req.ip || ''
      });

      // Revoke old refresh token
      await RefreshToken.revokeToken(refreshToken);

      // Set new refresh token as HTTP-only cookie
      res.cookie('refreshToken', newRefreshTokenObj.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        accessToken: newAccessToken
      });

    } catch (error) {
      // Invalid refresh token - clear the cookie and return error
      res.clearCookie('refreshToken');
      
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed'
    });
  }
});

// Verify token endpoint - for auth-guard.js integration
router.get('/verify', async (req, res) => {
  try {
    // Get access token from Authorization header
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required for verification'
      });
    }

    // Verify the access token
    let decoded;
    try {
      const jwt = require('jsonwebtoken');
      const { JWT_SECRET } = require('../middleware/auth-mongodb');
      decoded = jwt.verify(token, JWT_SECRET);

      if (decoded.type !== 'access') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token type'
        });
      }
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired'
        });
      } else {
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      }
    }

    // Get user from MongoDB to ensure they still exist
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // If we reach here, token is valid
    res.json({
      success: true,
      message: 'Token is valid',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Token verification failed'
    });
  }
});

// Get current user info
router.get('/me', async (req, res) => {
  try {
    // Get access token from Authorization header
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify the access token
    let decoded;
    try {
      const jwt = require('jsonwebtoken');
      const { JWT_SECRET } = require('../middleware/auth-mongodb');
      decoded = jwt.verify(token, JWT_SECRET);

      if (decoded.type !== 'access') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token type'
        });
      }
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired'
        });
      } else {
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      }
    }

    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user information'
    });
  }
});

// Change password endpoint
router.post('/change-password', async (req, res) => {
  try {
    // Get access token from Authorization header
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify the access token
    let decoded;
    try {
      const jwt = require('jsonwebtoken');
      const { JWT_SECRET } = require('../middleware/auth-mongodb');
      decoded = jwt.verify(token, JWT_SECRET);

      if (decoded.type !== 'access') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token type'
        });
      }
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired'
        });
      } else {
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      }
    }

    const { currentPassword, newPassword } = req.body;
    const userId = decoded.id;

    // Get current user from MongoDB
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isValidPassword = await user.comparePassword(currentPassword);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password using static method
    await User.updatePassword(userId, newPassword);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
});

// Create user endpoint (admin only)
router.post('/create-user', async (req, res) => {
  try {
    // Get access token from Authorization header
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify the access token
    let decoded;
    try {
      const jwt = require('jsonwebtoken');
      const { JWT_SECRET } = require('../middleware/auth-mongodb');
      decoded = jwt.verify(token, JWT_SECRET);

      if (decoded.type !== 'access') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token type'
        });
      }
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired'
        });
      } else {
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      }
    }

    // Check if user is admin
    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { username, password, role } = req.body;

    // Create user using static method
    const user = await User.createUser({
      username,
      password,
      role: role || 'admin'
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Create user error:', error);
    
    if (error.message === 'Username already exists') {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create user'
    });
  }
});

module.exports = router;