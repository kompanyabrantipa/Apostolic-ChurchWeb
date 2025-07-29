const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

// Rate limiters
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    message: 'Too many login attempts. Please try again later.'
  }
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 uploads per minute
  message: {
    success: false,
    message: 'Too many upload attempts. Please try again later.'
  }
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    success: false,
    message: 'Too many requests. Please try again later.'
  }
});

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }
  next();
};

// Blog post validation
const blogValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('status').isIn(['draft', 'published']).withMessage('Status must be draft or published'),
  validate
];

// Event validation
const eventValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('status').isIn(['draft', 'published']).withMessage('Status must be draft or published'),
  validate
];

// Sermon validation
const sermonValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('speaker').trim().notEmpty().withMessage('Speaker is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('status').isIn(['draft', 'published']).withMessage('Status must be draft or published'),
  validate
];

module.exports = {
  loginLimiter,
  uploadLimiter,
  apiLimiter,
  validate,
  blogValidation,
  eventValidation,
  sermonValidation
};
