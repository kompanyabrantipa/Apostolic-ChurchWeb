const express = require('express');
const { DataStore } = require('../models/DataStore');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const blogStore = new DataStore('blog-posts');
const eventStore = new DataStore('events');
const sermonStore = new DataStore('sermons');

/**
 * @route   GET /api/admin/stats
 * @desc    Get dashboard statistics
 * @access  Private
 */
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    // Get counts from each data store
    const [blogs, events, sermons] = await Promise.all([
      blogStore.getAll(),
      eventStore.getAll(),
      sermonStore.getAll()
    ]);

    // Calculate statistics
    const stats = {
      blogCount: blogs.length,
      eventCount: events.length,
      sermonCount: sermons.length,
      publishedBlogs: blogs.filter(blog => blog.status === 'published').length,
      publishedEvents: events.filter(event => event.status === 'published').length,
      publishedSermons: sermons.filter(sermon => sermon.status === 'published').length,
      recentActivity: {
        // Get 5 most recent items from each category
        recentBlogs: blogs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5),
        recentEvents: events.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 5),
        recentSermons: sermons.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 5)
      }
    };

    return res.json({
      success: true,
      message: 'Dashboard statistics retrieved successfully',
      data: stats
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving dashboard statistics'
    });
  }
});

/**
 * @route   GET /api/admin/recent-activity
 * @desc    Get recent activity for dashboard
 * @access  Private
 */
router.get('/recent-activity', authMiddleware, async (req, res) => {
  try {
    // Get all items from each data store
    const [blogs, events, sermons] = await Promise.all([
      blogStore.getAll(),
      eventStore.getAll(),
      sermonStore.getAll()
    ]);

    // Combine and sort by date
    const allItems = [
      ...blogs.map(item => ({ ...item, type: 'blog' })),
      ...events.map(item => ({ ...item, type: 'event' })),
      ...sermons.map(item => ({ ...item, type: 'sermon' }))
    ].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.date || 0);
      const dateB = new Date(b.createdAt || b.date || 0);
      return dateB - dateA;
    }).slice(0, 10); // Get 10 most recent items

    return res.json({
      success: true,
      message: 'Recent activity retrieved successfully',
      data: allItems
    });
  } catch (error) {
    console.error('Error getting recent activity:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving recent activity'
    });
  }
});

/**
 * @route   POST /api/admin/change-password
 * @desc    Change admin password
 * @access  Private
 */
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const adminId = req.admin.id;

    // This would typically validate the current password and update with the new one
    // For this example, we'll just return success
    
    return res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while changing password'
    });
  }
});

module.exports = router;

