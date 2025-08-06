const mongoose = require('mongoose');
const { logQuery } = require('../config/database-mongodb');

// Event schema matching PostgreSQL events table structure exactly
const eventSchema = new mongoose.Schema({
  // Use string ID to match localStorage pattern (timestamp-based)
  _id: {
    type: String,
    default: () => Date.now().toString()
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [255, 'Title cannot exceed 255 characters']
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  location: {
    type: String,
    default: '',
    trim: true,
    maxlength: [255, 'Location cannot exceed 255 characters']
  },
  description: {
    type: String,
    default: '' // TinyMCE HTML content
  },
  imageUrl: {
    type: String,
    default: '',
    validate: {
      validator: function(v) {
        if (!v || v === '') return true; // Allow empty strings
        // Allow relative paths (like images/event.jpg) or full URLs
        return /^(https?:\/\/.+|[^\/\s]+\/.*|[^\/\s]+\.[a-zA-Z]{2,4})$/.test(v) || v.startsWith('/') || v.startsWith('./') || v.startsWith('../');
      },
      message: 'Image URL must be a valid URL or relative path'
    }
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  collection: 'events',
  _id: false // Disable automatic _id generation since we're using custom string IDs
});

// Indexes for performance (matching PostgreSQL indexes)
eventSchema.index({ status: 1 });
eventSchema.index({ date: 1 });
eventSchema.index({ created_at: -1 });

// Convert to localStorage-compatible format (matching PostgreSQL Event model)
eventSchema.methods.toJSON = function() {
  const event = this.toObject();
  
  return {
    id: event._id,
    title: event.title,
    date: event.date,
    location: event.location,
    description: event.description,
    imageUrl: event.imageUrl,
    status: event.status,
    createdAt: event.created_at,
    updatedAt: event.updated_at
  };
};

// Static methods matching PostgreSQL Event model interface
eventSchema.statics.create = async function(eventData) {
  const logger = logQuery('CREATE', 'events', eventData);
  
  try {
    // Generate ID if not provided (matching localStorage pattern)
    const id = eventData.id || Date.now().toString();
    
    const event = new this({
      _id: id,
      title: eventData.title,
      date: eventData.date,
      location: eventData.location || '',
      description: eventData.description || '',
      imageUrl: eventData.imageUrl || '',
      status: eventData.status || 'draft'
    });

    const savedEvent = await event.save();
    logger.end(savedEvent);
    
    return savedEvent;
  } catch (error) {
    logger.end(null);
    console.error('Error creating event:', error);
    throw error;
  }
};

// Get all events
eventSchema.statics.getAll = async function() {
  const logger = logQuery('GET_ALL', 'events');
  
  try {
    const events = await this.find({}).sort({ date: 1 });
    logger.end(events);
    return events;
  } catch (error) {
    logger.end(null);
    console.error('Error getting all events:', error);
    throw error;
  }
};

// Get event by ID
eventSchema.statics.getById = async function(id) {
  const logger = logQuery('GET_BY_ID', 'events', { id });
  
  try {
    const event = await this.findById(id);
    logger.end(event);
    return event;
  } catch (error) {
    logger.end(null);
    console.error('Error getting event by ID:', error);
    throw error;
  }
};

// Update event
eventSchema.statics.update = async function(id, updateData) {
  const logger = logQuery('UPDATE', 'events', { id, ...updateData });
  
  try {
    const event = await this.findByIdAndUpdate(
      id,
      {
        title: updateData.title,
        date: updateData.date,
        location: updateData.location || '',
        description: updateData.description || '',
        imageUrl: updateData.imageUrl || '',
        status: updateData.status || 'draft'
      },
      { new: true, runValidators: true }
    );

    logger.end(event);
    return event;
  } catch (error) {
    logger.end(null);
    console.error('Error updating event:', error);
    throw error;
  }
};

// Delete event
eventSchema.statics.delete = async function(id) {
  const logger = logQuery('DELETE', 'events', { id });
  
  try {
    const event = await this.findByIdAndDelete(id);
    logger.end(event);
    return event;
  } catch (error) {
    logger.end(null);
    console.error('Error deleting event:', error);
    throw error;
  }
};

// Get published events only (for frontend)
eventSchema.statics.getPublished = async function() {
  const logger = logQuery('GET_PUBLISHED', 'events', { status: 'published' });
  
  try {
    const events = await this.find({ status: 'published' }).sort({ date: 1 });
    logger.end(events);
    return events;
  } catch (error) {
    logger.end(null);
    console.error('Error getting published events:', error);
    throw error;
  }
};

// Get upcoming events (for dashboard)
eventSchema.statics.getUpcoming = async function(limit = 5) {
  const logger = logQuery('GET_UPCOMING', 'events', { limit });
  
  try {
    const events = await this.find({ date: { $gte: new Date() } })
      .sort({ date: 1 })
      .limit(limit);
    logger.end(events);
    return events;
  } catch (error) {
    logger.end(null);
    console.error('Error getting upcoming events:', error);
    throw error;
  }
};

// Get event count
eventSchema.statics.getCount = async function() {
  const logger = logQuery('GET_COUNT', 'events');
  
  try {
    const count = await this.countDocuments();
    logger.end([{ count }]);
    return count;
  } catch (error) {
    logger.end(null);
    console.error('Error getting event count:', error);
    throw error;
  }
};

// Pre-save middleware
eventSchema.pre('save', function(next) {
  // Ensure strings are trimmed
  if (this.title) this.title = this.title.trim();
  if (this.location) this.location = this.location.trim();
  
  next();
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
