const express = require('express');
const { body, validationResult } = require('express-validator');
const Sermon = require('../models-mongodb/Sermon');
const { verifyToken, optionalAuth } = require('../middleware/auth-mongodb');

const router = express.Router();

// GET /api/sermons - Get all sermons (matches DataService.getAll('sermons'))
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { status, published } = req.query;
    
    let sermons;
    
    if (published === 'true' || (!req.user && !status)) {
      // Public endpoint or explicitly requesting published - return only published sermons
      sermons = await Sermon.getPublished();
    } else if (status) {
      // Filter by specific status (requires authentication)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required to filter by status'
        });
      }
      // Get all and filter by status
      const allSermons = await Sermon.getAll();
      sermons = allSermons.filter(sermon => sermon.status === status);
    } else {
      // Get all sermons (requires authentication)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required to view all sermons'
        });
      }
      sermons = await Sermon.getAll();
    }

    // Convert to JSON format matching localStorage structure
    const sermonsData = sermons.map(sermon => sermon.toJSON());

    res.json({
      success: true,
      data: sermonsData,
      count: sermonsData.length
    });

  } catch (error) {
    console.error('Get sermons error:', error);
    // Log detailed error information for debugging
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve sermons',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/sermons/:id - Get single sermon by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const sermon = await Sermon.getById(id);

    if (!sermon) {
      return res.status(404).json({
        success: false,
        message: 'Sermon not found'
      });
    }

    // Check if user can access this sermon
    if (sermon.status !== 'published' && !req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to view unpublished sermons'
      });
    }

    res.json({
      success: true,
      data: sermon.toJSON()
    });

  } catch (error) {
    console.error('Get sermon by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve sermon'
    });
  }
});

// POST /api/sermons - Create new sermon (matches DataService.create('sermons', data))
router.post('/', [
  verifyToken,
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('speaker').trim().notEmpty().withMessage('Speaker is required'),
  body('date').isISO8601().withMessage('Date must be a valid ISO date'),
  body('description').optional().trim(),
  body('videoUrl').optional().custom((value) => {
    if (!value || value === '') return true; // Allow empty strings
    // Allow relative paths (like videos/sermon.mp4) or full URLs
    return /^(https?:\/\/.+|[^\/\s]+\/.*|[^\/\s]+\.[a-zA-Z]{2,4})$/.test(value) || value.startsWith('/') || value.startsWith('./') || value.startsWith('../');
  }).withMessage('Video URL must be a valid URL or relative path'),
  body('audioUrl').optional().custom((value) => {
    if (!value || value === '') return true; // Allow empty strings
    // Allow relative paths (like audio/sermon.mp3) or full URLs
    return /^(https?:\/\/.+|[^\/\s]+\/.*|[^\/\s]+\.[a-zA-Z]{2,4})$/.test(value) || value.startsWith('/') || value.startsWith('./') || value.startsWith('../');
  }).withMessage('Audio URL must be a valid URL or relative path'),
  body('thumbnailUrl').optional().custom((value) => {
    if (!value || value === '') return true; // Allow empty strings
    // Allow relative paths (like images/thumbnail.jpg) or full URLs
    return /^(https?:\/\/.+|[^\/\s]+\/.*|[^\/\s]+\.[a-zA-Z]{2,4})$/.test(value) || value.startsWith('/') || value.startsWith('./') || value.startsWith('../');
  }).withMessage('Thumbnail URL must be a valid URL or relative path'),
  body('status').optional().isIn(['draft', 'published']).withMessage('Status must be draft or published')
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

    const sermonData = {
      title: req.body.title,
      speaker: req.body.speaker,
      date: req.body.date,
      description: req.body.description || '',
      videoUrl: req.body.videoUrl || '',
      audioUrl: req.body.audioUrl || '',
      thumbnailUrl: req.body.thumbnailUrl || '',
      status: req.body.status || 'draft'
    };

    const sermon = await Sermon.create(sermonData);

    res.status(201).json({
      success: true,
      message: 'Sermon created successfully',
      data: sermon.toJSON()
    });

  } catch (error) {
    console.error('Create sermon error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create sermon'
    });
  }
});

// PUT /api/sermons/:id - Update sermon (matches DataService.update('sermons', id, data))
router.put('/:id', [
  verifyToken,
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('speaker').optional().trim().notEmpty().withMessage('Speaker is required'),
  body('date').optional().isISO8601().withMessage('Date must be a valid ISO date'),
  body('description').optional().trim(),
  body('videoUrl').optional().custom((value) => {
    if (!value || value === '') return true; // Allow empty strings
    // Allow relative paths (like videos/sermon.mp4) or full URLs
    return /^(https?:\/\/.+|[^\/\s]+\/.*|[^\/\s]+\.[a-zA-Z]{2,4})$/.test(value) || value.startsWith('/') || value.startsWith('./') || value.startsWith('../');
  }).withMessage('Video URL must be a valid URL or relative path'),
  body('audioUrl').optional().custom((value) => {
    if (!value || value === '') return true; // Allow empty strings
    // Allow relative paths (like audio/sermon.mp3) or full URLs
    return /^(https?:\/\/.+|[^\/\s]+\/.*|[^\/\s]+\.[a-zA-Z]{2,4})$/.test(value) || value.startsWith('/') || value.startsWith('./') || value.startsWith('../');
  }).withMessage('Audio URL must be a valid URL or relative path'),
  body('thumbnailUrl').optional().custom((value) => {
    if (!value || value === '') return true; // Allow empty strings
    // Allow relative paths (like images/thumbnail.jpg) or full URLs
    return /^(https?:\/\/.+|[^\/\s]+\/.*|[^\/\s]+\.[a-zA-Z]{2,4})$/.test(value) || value.startsWith('/') || value.startsWith('./') || value.startsWith('../');
  }).withMessage('Thumbnail URL must be a valid URL or relative path'),
  body('status').optional().isIn(['draft', 'published']).withMessage('Status must be draft or published')
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

    const { id } = req.params;
    
    // Check if sermon exists
    const existingSermon = await Sermon.getById(id);
    if (!existingSermon) {
      return res.status(404).json({
        success: false,
        message: 'Sermon not found'
      });
    }

    const updateData = {
      title: req.body.title || existingSermon.title,
      speaker: req.body.speaker || existingSermon.speaker,
      date: req.body.date || existingSermon.date,
      description: req.body.description !== undefined ? req.body.description : existingSermon.description,
      videoUrl: req.body.videoUrl !== undefined ? req.body.videoUrl : existingSermon.videoUrl,
      audioUrl: req.body.audioUrl !== undefined ? req.body.audioUrl : existingSermon.audioUrl,
      thumbnailUrl: req.body.thumbnailUrl !== undefined ? req.body.thumbnailUrl : existingSermon.thumbnailUrl,
      status: req.body.status || existingSermon.status
    };

    const updatedSermon = await Sermon.update(id, updateData);

    if (!updatedSermon) {
      return res.status(404).json({
        success: false,
        message: 'Sermon not found'
      });
    }

    res.json({
      success: true,
      message: 'Sermon updated successfully',
      data: updatedSermon.toJSON()
    });

  } catch (error) {
    console.error('Update sermon error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update sermon'
    });
  }
});

// DELETE /api/sermons/:id - Delete sermon (matches DataService.delete('sermons', id))
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedSermon = await Sermon.delete(id);

    if (!deletedSermon) {
      return res.status(404).json({
        success: false,
        message: 'Sermon not found'
      });
    }

    res.json({
      success: true,
      message: 'Sermon deleted successfully',
      data: deletedSermon.toJSON()
    });

  } catch (error) {
    console.error('Delete sermon error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete sermon'
    });
  }
});

// GET /api/sermons/stats/count - Get sermon count
router.get('/stats/count', verifyToken, async (req, res) => {
  try {
    const count = await Sermon.getCount();
    
    res.json({
      success: true,
      data: { count }
    });

  } catch (error) {
    console.error('Get sermon count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sermon count'
    });
  }
});

// GET /api/sermons/recent/:limit - Get recent sermons
router.get('/recent/:limit?', optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.params.limit) || 5;
    const sermons = await Sermon.getRecent(limit);
    
    // Filter published only for non-authenticated users
    const filteredSermons = req.user ? sermons : sermons.filter(sermon => sermon.status === 'published');
    
    res.json({
      success: true,
      data: filteredSermons.map(sermon => sermon.toJSON())
    });

  } catch (error) {
    console.error('Get recent sermons error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recent sermons'
    });
  }
});

module.exports = router;
