const mongoose = require('mongoose');
const { logQuery } = require('../config/database-mongodb');

// Sermon schema matching PostgreSQL sermons table structure exactly
const sermonSchema = new mongoose.Schema({
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
  speaker: {
    type: String,
    required: [true, 'Speaker is required'],
    trim: true,
    maxlength: [100, 'Speaker name cannot exceed 100 characters']
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  description: {
    type: String,
    default: '' // TinyMCE HTML content
  },
  videoUrl: {
    type: String,
    default: '',
    validate: {
      validator: function(v) {
        if (!v || v === '') return true; // Allow empty strings
        // Allow relative paths or full URLs
        return /^(https?:\/\/.+|[^\/\s]+\/.*|[^\/\s]+\.[a-zA-Z]{2,4})$/.test(v) || v.startsWith('/') || v.startsWith('./') || v.startsWith('../');
      },
      message: 'Video URL must be a valid URL or relative path'
    }
  },
  audioUrl: {
    type: String,
    default: '',
    validate: {
      validator: function(v) {
        if (!v || v === '') return true; // Allow empty strings
        // Allow relative paths or full URLs
        return /^(https?:\/\/.+|[^\/\s]+\/.*|[^\/\s]+\.[a-zA-Z]{2,4})$/.test(v) || v.startsWith('/') || v.startsWith('./') || v.startsWith('../');
      },
      message: 'Audio URL must be a valid URL or relative path'
    }
  },
  thumbnailUrl: {
    type: String,
    default: '',
    validate: {
      validator: function(v) {
        if (!v || v === '') return true; // Allow empty strings
        // Allow relative paths or full URLs
        return /^(https?:\/\/.+|[^\/\s]+\/.*|[^\/\s]+\.[a-zA-Z]{2,4})$/.test(v) || v.startsWith('/') || v.startsWith('./') || v.startsWith('../');
      },
      message: 'Thumbnail URL must be a valid URL or relative path'
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
  collection: 'sermons',
  _id: false // Disable automatic _id generation since we're using custom string IDs
});

// Indexes for performance (matching PostgreSQL indexes)
sermonSchema.index({ status: 1 });
sermonSchema.index({ date: -1 });
sermonSchema.index({ speaker: 1 });
sermonSchema.index({ created_at: -1 });

// Convert to localStorage-compatible format (matching PostgreSQL Sermon model)
sermonSchema.methods.toJSON = function() {
  const sermon = this.toObject();
  
  return {
    id: sermon._id,
    title: sermon.title,
    speaker: sermon.speaker,
    date: sermon.date,
    description: sermon.description,
    videoUrl: sermon.videoUrl,
    audioUrl: sermon.audioUrl,
    thumbnailUrl: sermon.thumbnailUrl,
    status: sermon.status,
    createdAt: sermon.created_at,
    updatedAt: sermon.updated_at
  };
};

// Static methods matching PostgreSQL Sermon model interface
sermonSchema.statics.create = async function(sermonData) {
  const logger = logQuery('CREATE', 'sermons', sermonData);
  
  try {
    // Generate ID if not provided (matching localStorage pattern)
    const id = sermonData.id || Date.now().toString();
    
    const sermon = new this({
      _id: id,
      title: sermonData.title,
      speaker: sermonData.speaker,
      date: sermonData.date,
      description: sermonData.description || '',
      videoUrl: sermonData.videoUrl || '',
      audioUrl: sermonData.audioUrl || '',
      thumbnailUrl: sermonData.thumbnailUrl || '',
      status: sermonData.status || 'draft'
    });

    const savedSermon = await sermon.save();
    logger.end(savedSermon);
    
    return savedSermon;
  } catch (error) {
    logger.end(null);
    console.error('Error creating sermon:', error);
    throw error;
  }
};

// Get all sermons
sermonSchema.statics.getAll = async function() {
  const logger = logQuery('GET_ALL', 'sermons');
  
  try {
    const sermons = await this.find({}).sort({ date: -1 });
    logger.end(sermons);
    return sermons;
  } catch (error) {
    logger.end(null);
    console.error('Error getting all sermons:', error);
    throw error;
  }
};

// Get sermon by ID
sermonSchema.statics.getById = async function(id) {
  const logger = logQuery('GET_BY_ID', 'sermons', { id });
  
  try {
    const sermon = await this.findById(id);
    logger.end(sermon);
    return sermon;
  } catch (error) {
    logger.end(null);
    console.error('Error getting sermon by ID:', error);
    throw error;
  }
};

// Update sermon
sermonSchema.statics.update = async function(id, updateData) {
  const logger = logQuery('UPDATE', 'sermons', { id, ...updateData });
  
  try {
    const sermon = await this.findByIdAndUpdate(
      id,
      {
        title: updateData.title,
        speaker: updateData.speaker,
        date: updateData.date,
        description: updateData.description || '',
        videoUrl: updateData.videoUrl || '',
        audioUrl: updateData.audioUrl || '',
        thumbnailUrl: updateData.thumbnailUrl || '',
        status: updateData.status || 'draft'
      },
      { new: true, runValidators: true }
    );

    logger.end(sermon);
    return sermon;
  } catch (error) {
    logger.end(null);
    console.error('Error updating sermon:', error);
    throw error;
  }
};

// Delete sermon
sermonSchema.statics.delete = async function(id) {
  const logger = logQuery('DELETE', 'sermons', { id });
  
  try {
    const sermon = await this.findByIdAndDelete(id);
    logger.end(sermon);
    return sermon;
  } catch (error) {
    logger.end(null);
    console.error('Error deleting sermon:', error);
    throw error;
  }
};

// Get published sermons only (for frontend)
sermonSchema.statics.getPublished = async function() {
  const logger = logQuery('GET_PUBLISHED', 'sermons', { status: 'published' });
  
  try {
    const sermons = await this.find({ status: 'published' }).sort({ date: -1 });
    logger.end(sermons);
    return sermons;
  } catch (error) {
    logger.end(null);
    console.error('Error getting published sermons:', error);
    throw error;
  }
};

// Get recent sermons (for dashboard)
sermonSchema.statics.getRecent = async function(limit = 5) {
  const logger = logQuery('GET_RECENT', 'sermons', { limit });
  
  try {
    const sermons = await this.find({}).sort({ date: -1 }).limit(limit);
    logger.end(sermons);
    return sermons;
  } catch (error) {
    logger.end(null);
    console.error('Error getting recent sermons:', error);
    throw error;
  }
};

// Get sermon count
sermonSchema.statics.getCount = async function() {
  const logger = logQuery('GET_COUNT', 'sermons');
  
  try {
    const count = await this.countDocuments();
    logger.end([{ count }]);
    return count;
  } catch (error) {
    logger.end(null);
    console.error('Error getting sermon count:', error);
    throw error;
  }
};

// Pre-save middleware
sermonSchema.pre('save', function(next) {
  // Ensure strings are trimmed
  if (this.title) this.title = this.title.trim();
  if (this.speaker) this.speaker = this.speaker.trim();
  
  next();
});

const Sermon = mongoose.model('Sermon', sermonSchema);

module.exports = Sermon;
