const express = require('express');
const { DataStore } = require('../models/DataStore');
const { authMiddleware } = require('../middleware/auth');
const { eventValidation } = require('../middleware/validation');

const router = express.Router();
const eventStore = new DataStore('events');

/**
 * @route   GET /api/events
 * @desc    Get all events (admin)
 * @access  Private
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const events = await eventStore.getAll();
    return res.json({
      success: true,
      message: 'Events retrieved successfully',
      data: events
    });
  } catch (error) {
    console.error('Error getting events:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving events'
    });
  }
});

/**
 * @route   GET /api/events/public
 * @desc    Get published events (public)
 * @access  Public
 */
router.get('/public', async (req, res) => {
  try {
    const events = await eventStore.getPublic();
    
    // Sort events by date (upcoming first)
    events.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return res.json(events);
  } catch (error) {
    console.error('Error getting public events:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving public events'
    });
  }
});

/**
 * @route   GET /api/events/:id
 * @desc    Get a single event by ID (admin)
 * @access  Private
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const event = await eventStore.getById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    return res.json({
      success: true,
      message: 'Event retrieved successfully',
      data: event
    });
  } catch (error) {
    console.error('Error getting event:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving event'
    });
  }
});

/**
 * @route   GET /api/events/public/:id
 * @desc    Get a single published event by ID (public)
 * @access  Public
 */
router.get('/public/:id', async (req, res) => {
  try {
    const event = await eventStore.getById(req.params.id);
    
    if (!event || event.status !== 'published') {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    return res.json(event);
  } catch (error) {
    console.error('Error getting public event:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving public event'
    });
  }
});

/**
 * @route   POST /api/events
 * @desc    Create a new event
 * @access  Private
 */
router.post('/', authMiddleware, eventValidation, async (req, res) => {
  try {
    const { title, date, time, location, description, imageUrl, status } = req.body;
    
    const newEvent = await eventStore.create({
      title,
      date,
      time: time || '00:00',
      location,
      description,
      imageUrl: imageUrl || '',
      status: status || 'draft'
    });
    
    return res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: newEvent
    });
  } catch (error) {
    console.error('Error creating event:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating event'
    });
  }
});

/**
 * @route   PUT /api/events/:id
 * @desc    Update an event
 * @access  Private
 */
router.put('/:id', authMiddleware, eventValidation, async (req, res) => {
  try {
    const { title, date, time, location, description, imageUrl, status } = req.body;
    
    // Check if event exists
    const event = await eventStore.getById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Update event
    const updatedEvent = await eventStore.update(req.params.id, {
      title,
      date,
      time: time || event.time || '00:00',
      location,
      description,
      imageUrl: imageUrl || event.imageUrl || '',
      status: status || event.status
    });
    
    return res.json({
      success: true,
      message: 'Event updated successfully',
      data: updatedEvent
    });
  } catch (error) {
    console.error('Error updating event:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating event'
    });
  }
});

/**
 * @route   DELETE /api/events/:id
 * @desc    Delete an event
 * @access  Private
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // Check if event exists
    const event = await eventStore.getById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Delete event
    await eventStore.delete(req.params.id);
    
    return res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting event'
    });
  }
});

module.exports = router;