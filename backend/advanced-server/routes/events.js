const express = require('express');
const { body, validationResult } = require('express-validator');
const Event = require('../models/Event');
const { verifyToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/events - Get all events (matches DataService.getAll('events'))
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { status, published } = req.query;
    
    let events;
    
    if (published === 'true' || (!req.user && !status)) {
      // Public endpoint or explicitly requesting published - return only published events
      events = await Event.getPublished();
    } else if (status) {
      // Filter by specific status (requires authentication)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required to filter by status'
        });
      }
      // For now, get all and filter (can be optimized later)
      const allEvents = await Event.getAll();
      events = allEvents.filter(event => event.status === status);
    } else {
      // Get all events (requires authentication)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required to view all events'
        });
      }
      events = await Event.getAll();
    }

    // Convert to JSON format matching localStorage structure
    const eventsData = events.map(event => event.toJSON());

    res.json({
      success: true,
      data: eventsData,
      count: eventsData.length
    });

  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve events'
    });
  }
});

// GET /api/events/:id - Get single event by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.getById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user can access this event
    if (event.status !== 'published' && !req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to view unpublished events'
      });
    }

    res.json({
      success: true,
      data: event.toJSON()
    });

  } catch (error) {
    console.error('Get event by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve event'
    });
  }
});

// POST /api/events - Create new event (matches DataService.create('events', data))
router.post('/', [
  verifyToken,
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('date').isISO8601().withMessage('Date must be a valid ISO date'),
  body('location').optional().trim(),
  body('description').optional().trim(),
  body('imageUrl').optional().isURL().withMessage('Image URL must be valid'),
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

    const eventData = {
      title: req.body.title,
      date: req.body.date,
      location: req.body.location || '',
      description: req.body.description || '',
      imageUrl: req.body.imageUrl || '',
      status: req.body.status || 'draft'
    };

    const event = await Event.create(eventData);

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event.toJSON()
    });

  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create event'
    });
  }
});

// PUT /api/events/:id - Update event (matches DataService.update('events', id, data))
router.put('/:id', [
  verifyToken,
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('date').optional().isISO8601().withMessage('Date must be a valid ISO date'),
  body('location').optional().trim(),
  body('description').optional().trim(),
  body('imageUrl').optional().isURL().withMessage('Image URL must be valid'),
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
    
    // Check if event exists
    const existingEvent = await Event.getById(id);
    if (!existingEvent) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const updateData = {
      title: req.body.title || existingEvent.title,
      date: req.body.date || existingEvent.date,
      location: req.body.location !== undefined ? req.body.location : existingEvent.location,
      description: req.body.description !== undefined ? req.body.description : existingEvent.description,
      imageUrl: req.body.imageUrl !== undefined ? req.body.imageUrl : existingEvent.imageUrl,
      status: req.body.status || existingEvent.status
    };

    const updatedEvent = await Event.update(id, updateData);

    if (!updatedEvent) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: updatedEvent.toJSON()
    });

  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update event'
    });
  }
});

// DELETE /api/events/:id - Delete event (matches DataService.delete('events', id))
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedEvent = await Event.delete(id);

    if (!deletedEvent) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      message: 'Event deleted successfully',
      data: deletedEvent.toJSON()
    });

  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete event'
    });
  }
});

// GET /api/events/stats/count - Get event count
router.get('/stats/count', verifyToken, async (req, res) => {
  try {
    const count = await Event.getCount();
    
    res.json({
      success: true,
      data: { count }
    });

  } catch (error) {
    console.error('Get event count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get event count'
    });
  }
});

// GET /api/events/upcoming/:limit - Get upcoming events
router.get('/upcoming/:limit?', optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.params.limit) || 5;
    const events = await Event.getUpcoming(limit);
    
    // Filter published only for non-authenticated users
    const filteredEvents = req.user ? events : events.filter(event => event.status === 'published');
    
    res.json({
      success: true,
      data: filteredEvents.map(event => event.toJSON())
    });

  } catch (error) {
    console.error('Get upcoming events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get upcoming events'
    });
  }
});

module.exports = router;
