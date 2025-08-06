const express = require('express');
const { body, validationResult } = require('express-validator');
const Blog = require('../models/Blog');
const { verifyToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/blogs - Get all blogs (matches DataService.getAll('blogs'))
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { status, published } = req.query;
    
    let blogs;
    
    if (published === 'true' || (!req.user && !status)) {
      // Public endpoint or explicitly requesting published - return only published blogs
      blogs = await Blog.getPublished();
    } else if (status) {
      // Filter by specific status (requires authentication)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required to filter by status'
        });
      }
      // For now, get all and filter (can be optimized later)
      const allBlogs = await Blog.getAll();
      blogs = allBlogs.filter(blog => blog.status === status);
    } else {
      // Get all blogs (requires authentication)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required to view all blogs'
        });
      }
      blogs = await Blog.getAll();
    }

    // Convert to JSON format matching localStorage structure
    const blogsData = blogs.map(blog => blog.toJSON());

    res.json({
      success: true,
      data: blogsData,
      count: blogsData.length
    });

  } catch (error) {
    console.error('Get blogs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve blogs'
    });
  }
});

// GET /api/blogs/:id - Get single blog by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.getById(id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Check if user can access this blog
    if (blog.status !== 'published' && !req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to view unpublished blogs'
      });
    }

    res.json({
      success: true,
      data: blog.toJSON()
    });

  } catch (error) {
    console.error('Get blog by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve blog'
    });
  }
});

// POST /api/blogs - Create new blog (matches DataService.create('blogs', data))
router.post('/', [
  verifyToken,
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('summary').optional().trim(),
  body('content').optional().trim(),
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

    const blogData = {
      title: req.body.title,
      summary: req.body.summary || '',
      content: req.body.content || '',
      imageUrl: req.body.imageUrl || '',
      status: req.body.status || 'draft',
      author: req.body.author || 'Church Staff',
      category: req.body.category || 'Faith',
      comments: req.body.comments || 0
    };

    const blog = await Blog.create(blogData);

    res.status(201).json({
      success: true,
      message: 'Blog created successfully',
      data: blog.toJSON()
    });

  } catch (error) {
    console.error('Create blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create blog'
    });
  }
});

// PUT /api/blogs/:id - Update blog (matches DataService.update('blogs', id, data))
router.put('/:id', [
  verifyToken,
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('summary').optional().trim(),
  body('content').optional().trim(),
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
    
    // Check if blog exists
    const existingBlog = await Blog.getById(id);
    if (!existingBlog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    const updateData = {
      title: req.body.title || existingBlog.title,
      summary: req.body.summary !== undefined ? req.body.summary : existingBlog.summary,
      content: req.body.content !== undefined ? req.body.content : existingBlog.content,
      imageUrl: req.body.imageUrl !== undefined ? req.body.imageUrl : existingBlog.imageUrl,
      status: req.body.status || existingBlog.status,
      author: req.body.author || existingBlog.author,
      category: req.body.category || existingBlog.category,
      comments: req.body.comments !== undefined ? req.body.comments : existingBlog.comments
    };

    const updatedBlog = await Blog.update(id, updateData);

    if (!updatedBlog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    res.json({
      success: true,
      message: 'Blog updated successfully',
      data: updatedBlog.toJSON()
    });

  } catch (error) {
    console.error('Update blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update blog'
    });
  }
});

// DELETE /api/blogs/:id - Delete blog (matches DataService.delete('blogs', id))
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedBlog = await Blog.delete(id);

    if (!deletedBlog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    res.json({
      success: true,
      message: 'Blog deleted successfully',
      data: deletedBlog.toJSON()
    });

  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete blog'
    });
  }
});

// GET /api/blogs/stats/count - Get blog count
router.get('/stats/count', verifyToken, async (req, res) => {
  try {
    const count = await Blog.getCount();
    
    res.json({
      success: true,
      data: { count }
    });

  } catch (error) {
    console.error('Get blog count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get blog count'
    });
  }
});

// GET /api/blogs/recent/:limit - Get recent blogs
router.get('/recent/:limit?', optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.params.limit) || 5;
    const blogs = await Blog.getRecent(limit);
    
    // Filter published only for non-authenticated users
    const filteredBlogs = req.user ? blogs : blogs.filter(blog => blog.status === 'published');
    
    res.json({
      success: true,
      data: filteredBlogs.map(blog => blog.toJSON())
    });

  } catch (error) {
    console.error('Get recent blogs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recent blogs'
    });
  }
});

module.exports = router;
