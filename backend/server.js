const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

// Import routes
const authRoutes = require('./routes/auth');
const blogRoutes = require('./routes/blog');
const eventsRoutes = require('./routes/events');
const sermonsRoutes = require('./routes/sermons');
const uploadRoutes = require('./routes/upload');
const adminRoutes = require('./routes/admin');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for development, enable in production
}));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// API routes with rate limiting
app.use('/api/auth', authRoutes);
app.use('/api/blog', apiLimiter, blogRoutes);
app.use('/api/events', apiLimiter, eventsRoutes);
app.use('/api/sermons', apiLimiter, sermonsRoutes);
app.use('/api/upload', apiLimiter, uploadRoutes);
app.use('/api/admin', apiLimiter, adminRoutes);

// Serve admin dashboard for any /dashboard route
app.get('/dashboard*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dashboard.html'));
});

// Serve login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../login.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong on the server',
    error: process.env.NODE_ENV === 'production' ? null : err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Admin dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`Login page: http://localhost:${PORT}/login`);
});
