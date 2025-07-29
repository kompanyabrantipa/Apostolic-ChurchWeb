const express = require('express');
const { DataStore } = require('../models/DataStore');
const { authMiddleware } = require('../middleware/auth');
const { blogValidation } = require('../middleware/validation');

const router = express.Router();
const blogStore = new DataStore('blog-posts');

/**
 * @route   GET /api/blog
 * @desc    Get all blog posts (admin)
 * @access  Private
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const posts = await blogStore.getAll();
    return res.json({
      success: true,
      message: 'Blog posts retrieved successfully',
      data: posts
    });
  } catch (error) {
    console.error('Error getting blog posts:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving blog posts'
    });
  }
});

/**
 * @route   GET /api/blog/public
 * @desc    Get published blog posts (public)
 * @access  Public
 */
router.get('/public', async (req, res) => {
  try {
    const posts = await blogStore.getPublic();
    return res.json(posts);
  } catch (error) {
    console.error('Error getting public blog posts:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving public blog posts'
    });
  }
});

/**
 * @route   GET /api/blog/:id
 * @desc    Get a single blog post by ID (admin)
 * @access  Private
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const post = await blogStore.getById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }
    
    return res.json({
      success: true,
      message: 'Blog post retrieved successfully',
      data: post
    });
  } catch (error) {
    console.error('Error getting blog post:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving blog post'
    });
  }
});

/**
 * @route   GET /api/blog/public/:id
 * @desc    Get a single published blog post by ID (public)
 * @access  Public
 */
router.get('/public/:id', async (req, res) => {
  try {
    const post = await blogStore.getById(req.params.id);
    
    if (!post || post.status !== 'published') {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }
    
    return res.json(post);
  } catch (error) {
    console.error('Error getting public blog post:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving public blog post'
    });
  }
});

/**
 * @route   POST /api/blog
 * @desc    Create a new blog post
 * @access  Private
 */
router.post('/', authMiddleware, blogValidation, async (req, res) => {
  try {
    const { title, content, summary, imageUrl, status } = req.body;
    
    const newPost = await blogStore.create({
      title,
      content,
      summary: summary || '',
      imageUrl: imageUrl || '',
      status: status || 'draft',
      author: req.admin.username
    });
    
    return res.status(201).json({
      success: true,
      message: 'Blog post created successfully',
      data: newPost
    });
  } catch (error) {
    console.error('Error creating blog post:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating blog post'
    });
  }
});

/**
 * @route   PUT /api/blog/:id
 * @desc    Update a blog post
 * @access  Private
 */
router.put('/:id', authMiddleware, blogValidation, async (req, res) => {
  try {
    const { title, content, summary, imageUrl, status } = req.body;
    
    // Check if post exists
    const post = await blogStore.getById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }
    
    // Update post
    const updatedPost = await blogStore.update(req.params.id, {
      title,
      content,
      summary: summary || post.summary || '',
      imageUrl: imageUrl || post.imageUrl || '',
      status: status || post.status
    });
    
    return res.json({
      success: true,
      message: 'Blog post updated successfully',
      data: updatedPost
    });
  } catch (error) {
    console.error('Error updating blog post:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating blog post'
    });
  }
});

/**
 * @route   DELETE /api/blog/:id
 * @desc    Delete a blog post
 * @access  Private
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // Check if post exists
    const post = await blogStore.getById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }
    
    // Delete post
    await blogStore.delete(req.params.id);
    
    return res.json({
      success: true,
      message: 'Blog post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting blog post'
    });
  }
});

module.exports = router;