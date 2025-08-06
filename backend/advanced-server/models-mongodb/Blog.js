const mongoose = require('mongoose');
const { logQuery } = require('../config/database-mongodb');

// Blog schema matching PostgreSQL blogs table structure exactly
const blogSchema = new mongoose.Schema({
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
  summary: {
    type: String,
    default: '',
    trim: true
  },
  content: {
    type: String,
    default: '' // TinyMCE HTML content
  },
  imageUrl: {
    type: String,
    default: '',
    validate: {
      validator: function(v) {
        if (!v || v === '') return true; // Allow empty strings
        // Allow relative paths (like images/blog.jpg) or full URLs
        return /^(https?:\/\/.+|[^\/\s]+\/.*|[^\/\s]+\.[a-zA-Z]{2,4})$/.test(v) || v.startsWith('/') || v.startsWith('./') || v.startsWith('../');
      },
      message: 'Image URL must be a valid URL or relative path'
    }
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  author: {
    type: String,
    default: 'Church Staff',
    trim: true
  },
  category: {
    type: String,
    default: 'Faith',
    trim: true
  },
  comments: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  collection: 'blogs',
  _id: false // Disable automatic _id generation since we're using custom string IDs
});

// Indexes for performance (matching PostgreSQL indexes)
blogSchema.index({ status: 1 });
blogSchema.index({ created_at: -1 });
blogSchema.index({ category: 1 });
blogSchema.index({ author: 1 });

// Convert to localStorage-compatible format (matching PostgreSQL Blog model)
blogSchema.methods.toJSON = function() {
  const blog = this.toObject();
  
  return {
    id: blog._id,
    title: blog.title,
    summary: blog.summary,
    content: blog.content,
    imageUrl: blog.imageUrl,
    status: blog.status,
    author: blog.author,
    category: blog.category,
    comments: blog.comments,
    createdAt: blog.created_at,
    updatedAt: blog.updated_at
  };
};

// Static methods matching PostgreSQL Blog model interface
blogSchema.statics.create = async function(blogData) {
  const logger = logQuery('CREATE', 'blogs', blogData);
  
  try {
    // Generate ID if not provided (matching localStorage pattern)
    const id = blogData.id || Date.now().toString();
    
    const blog = new this({
      _id: id,
      title: blogData.title,
      summary: blogData.summary || '',
      content: blogData.content || '',
      imageUrl: blogData.imageUrl || '',
      status: blogData.status || 'draft',
      author: blogData.author || 'Church Staff',
      category: blogData.category || 'Faith',
      comments: blogData.comments || 0
    });

    const savedBlog = await blog.save();
    logger.end(savedBlog);
    
    return savedBlog;
  } catch (error) {
    logger.end(null);
    console.error('Error creating blog:', error);
    throw error;
  }
};

// Get all blogs
blogSchema.statics.getAll = async function() {
  const logger = logQuery('GET_ALL', 'blogs');
  
  try {
    const blogs = await this.find({}).sort({ created_at: -1 });
    logger.end(blogs);
    return blogs;
  } catch (error) {
    logger.end(null);
    console.error('Error getting all blogs:', error);
    throw error;
  }
};

// Get blog by ID
blogSchema.statics.getById = async function(id) {
  const logger = logQuery('GET_BY_ID', 'blogs', { id });
  
  try {
    const blog = await this.findById(id);
    logger.end(blog);
    return blog;
  } catch (error) {
    logger.end(null);
    console.error('Error getting blog by ID:', error);
    throw error;
  }
};

// Update blog
blogSchema.statics.update = async function(id, updateData) {
  const logger = logQuery('UPDATE', 'blogs', { id, ...updateData });
  
  try {
    const blog = await this.findByIdAndUpdate(
      id,
      {
        title: updateData.title,
        summary: updateData.summary || '',
        content: updateData.content || '',
        imageUrl: updateData.imageUrl || '',
        status: updateData.status || 'draft',
        author: updateData.author || 'Church Staff',
        category: updateData.category || 'Faith',
        comments: updateData.comments || 0
      },
      { new: true, runValidators: true }
    );

    logger.end(blog);
    return blog;
  } catch (error) {
    logger.end(null);
    console.error('Error updating blog:', error);
    throw error;
  }
};

// Delete blog
blogSchema.statics.delete = async function(id) {
  const logger = logQuery('DELETE', 'blogs', { id });
  
  try {
    const blog = await this.findByIdAndDelete(id);
    logger.end(blog);
    return blog;
  } catch (error) {
    logger.end(null);
    console.error('Error deleting blog:', error);
    throw error;
  }
};

// Get published blogs only (for frontend)
blogSchema.statics.getPublished = async function() {
  const logger = logQuery('GET_PUBLISHED', 'blogs', { status: 'published' });
  
  try {
    const blogs = await this.find({ status: 'published' }).sort({ created_at: -1 });
    logger.end(blogs);
    return blogs;
  } catch (error) {
    logger.end(null);
    console.error('Error getting published blogs:', error);
    throw error;
  }
};

// Get recent blogs (for dashboard)
blogSchema.statics.getRecent = async function(limit = 5) {
  const logger = logQuery('GET_RECENT', 'blogs', { limit });
  
  try {
    const blogs = await this.find({}).sort({ created_at: -1 }).limit(limit);
    logger.end(blogs);
    return blogs;
  } catch (error) {
    logger.end(null);
    console.error('Error getting recent blogs:', error);
    throw error;
  }
};

// Get blog count
blogSchema.statics.getCount = async function() {
  const logger = logQuery('GET_COUNT', 'blogs');
  
  try {
    const count = await this.countDocuments();
    logger.end([{ count }]);
    return count;
  } catch (error) {
    logger.end(null);
    console.error('Error getting blog count:', error);
    throw error;
  }
};

// Pre-save middleware
blogSchema.pre('save', function(next) {
  // Ensure strings are trimmed
  if (this.title) this.title = this.title.trim();
  if (this.author) this.author = this.author.trim();
  if (this.category) this.category = this.category.trim();
  
  next();
});

const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog;
