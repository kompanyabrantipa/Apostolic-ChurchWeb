const express = require('express');
const { DataStore } = require('../models/DataStore');
const { authMiddleware } = require('../middleware/auth');
const { sermonValidation } = require('../middleware/validation');

const router = express.Router();
const sermonStore = new DataStore('sermons');

/**
 * @route   GET /api/sermons
 * @desc    Get all sermons (admin)
 * @access  Private
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const sermons = await sermonStore.getAll();
    return res.json({
      success: true,
      message: 'Sermons retrieved successfully',
      data: sermons
    });
  } catch (error) {
    console.error('Error getting sermons:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving sermons'
    });
  }
});

/**
 * @route   GET /api/sermons/public
 * @desc    Get published sermons (public)
 * @access  Public
 */
router.get('/public', async (req, res) => {
  try {
    const sermons = await sermonStore.getPublic();
    
    // Sort sermons by date (newest first)
    sermons.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return res.json(sermons);
  } catch (error) {
    console.error('Error getting public sermons:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving public sermons'
    });
  }
});

/**
 * @route   GET /api/sermons/:id
 * @desc    Get a single sermon by ID (admin)
 * @access  Private
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const sermon = await sermonStore.getById(req.params.id);
    
    if (!sermon) {
      return res.status(404).json({
        success: false,
        message: 'Sermon not found'
      });
    }
    
    return res.json({
      success: true,
      message: 'Sermon retrieved successfully',
      data: sermon
    });
  } catch (error) {
    console.error('Error getting sermon:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving sermon'
    });
  }
});

/**
 * @route   GET /api/sermons/public/:id
 * @desc    Get a single published sermon by ID (public)
 * @access  Public
 */
router.get('/public/:id', async (req, res) => {
  try {
    const sermon = await sermonStore.getById(req.params.id);
    
    if (!sermon || sermon.status !== 'published') {
      return res.status(404).json({
        success: false,
        message: 'Sermon not found'
      });
    }
    
    return res.json(sermon);
  } catch (error) {
    console.error('Error getting public sermon:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving public sermon'
    });
  }
});

/**
 * @route   POST /api/sermons
 * @desc    Create a new sermon
 * @access  Private
 */
router.post('/', authMiddleware, sermonValidation, async (req, res) => {
  try {
    const { title, speaker, date, videoUrl, audioUrl, description, thumbnailUrl, status } = req.body;
    
    const newSermon = await sermonStore.create({
      title,
      speaker,
      date,
      videoUrl: videoUrl || '',
      audioUrl: audioUrl || '',
      description: description || '',
      thumbnailUrl: thumbnailUrl || '',
      status: status || 'draft'
    });
    
    return res.status(201).json({
      success: true,
      message: 'Sermon created successfully',
      data: newSermon
    });
  } catch (error) {
    console.error('Error creating sermon:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating sermon'
    });
  }
});

/**
 * @route   PUT /api/sermons/:id
 * @desc    Update a sermon
 * @access  Private
 */
router.put('/:id', authMiddleware, sermonValidation, async (req, res) => {
  try {
    const { title, speaker, date, videoUrl, audioUrl, description, thumbnailUrl, status } = req.body;
    
    // Check if sermon exists
    const sermon = await sermonStore.getById(req.params.id);
    
    if (!sermon) {
      return res.status(404).json({
        success: false,
        message: 'Sermon not found'
      });
    }
    
    // Update sermon
    const updatedSermon = await sermonStore.update(req.params.id, {
      title,
      speaker,
      date,
      videoUrl: videoUrl || sermon.videoUrl || '',
      audioUrl: audioUrl || sermon.audioUrl || '',
      description: description || sermon.description || '',
      thumbnailUrl: thumbnailUrl || sermon.thumbnailUrl || '',
      status: status || sermon.status
    });
    
    return res.json({
      success: true,
      message: 'Sermon updated successfully',
      data: updatedSermon
    });
  } catch (error) {
    console.error('Error updating sermon:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating sermon'
    });
  }
});

/**
 * @route   DELETE /api/sermons/:id
 * @desc    Delete a sermon
 * @access  Private
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // Check if sermon exists
    const sermon = await sermonStore.getById(req.params.id);
    
    if (!sermon) {
      return res.status(404).json({
        success: false,
        message: 'Sermon not found'
      });
    }
    
    // Delete sermon
    await sermonStore.delete(req.params.id);
    
    return res.json({
      success: true,
      message: 'Sermon deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting sermon:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting sermon'
    });
  }
});

module.exports = router;
