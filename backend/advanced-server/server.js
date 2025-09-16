const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Import database and routes
const { testConnection } = require('./config/database');
const authRoutes = require('./routes/auth');
const blogRoutes = require('./routes/blogs');
const eventRoutes = require('./routes/events');
const sermonRoutes = require('./routes/sermons');
const configRoutes = require('./routes/config');
const paymentRoutes = require('./routes/payments');
const webhookRoutes = require('./routes/webhooks');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// routes before body paser
app.use('/api/webhooks', webhookRoutes);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development (enable in production)
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// CORS configuration

const allowedOrigins = [
  'https://apostolicchurchlouisville.org', 
  'https://www.apostolicchurchlouisville.org'  
];
app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps, curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Serve static files from the parent directory (existing frontend)
app.use(express.static(path.join(__dirname, '..')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/sermons', sermonRoutes);
app.use('/api/config', configRoutes);
app.use('/api/payments', paymentRoutes);


// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const dbConnected = await testConnection();
    
    res.json({
      success: true,
      message: 'Server is healthy',
      timestamp: new Date().toISOString(),
      database: dbConnected ? 'connected' : 'disconnected',
      version: '1.0.0'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server health check failed',
      error: error.message
    });
  }
});

// Dashboard stats endpoint (for dashboard overview)
app.get('/api/stats', async (req, res) => {
  try {
    const Blog = require('./models/Blog');
    const Event = require('./models/Event');
    const Sermon = require('./models/Sermon');

    const [blogCount, eventCount, sermonCount] = await Promise.all([
      Blog.getCount(),
      Event.getCount(),
      Sermon.getCount()
    ]);

    res.json({
      success: true,
      data: {
        blogs: blogCount,
        events: eventCount,
        sermons: sermonCount,
        total: blogCount + eventCount + sermonCount
      }
    });
  } catch (error) {
    console.error('Stats endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics'
    });
  }
});

// Catch-all handler for frontend routes (SPA support)
app.get('*', (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: 'API endpoint not found'
    });
  }
  
  // Serve the appropriate HTML file based on the route
  let htmlFile = 'index.html';
  
  if (req.path.includes('dashboard')) {
    htmlFile = 'dashboard.html';
  } else if (req.path.includes('blog')) {
    htmlFile = 'blog.html';
  } else if (req.path.includes('events')) {
    htmlFile = 'events.html';
  } else if (req.path.includes('sermon')) {
    htmlFile = 'sermon-archive.html';
  } else if (req.path.includes('login')) {
    htmlFile = 'login.html';
  }
  
  res.sendFile(path.join(__dirname, '..', htmlFile));
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  // CORS error
  if (error.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS policy violation'
    });
  }
  
  // JSON parsing error
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON in request body'
    });
  }
  
  // Default error response
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
  });
});

// Start server
async function startServer() {
  try {
    // Test database connection
    console.log('🔍 Testing database connection...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ Database connection failed. Please check your database configuration.');
      console.log('💡 Make sure PostgreSQL is running and the database exists.');
      console.log('💡 Run "npm run setup-db" to create the database schema.');
      process.exit(1);
    }
    
    // Start the server
    app.listen(PORT, () => {
      console.log('🚀 Apostolic Church Backend Server Started');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📡 Server running on: http://localhost:${PORT}`);
      console.log(`🌐 Frontend served from: http://localhost:${PORT}`);
      console.log(`🔧 API endpoints available at: http://localhost:${PORT}/api/`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🎛️ Dashboard: http://localhost:${PORT}/dashboard`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ Ready for localStorage migration!');
      console.log('💡 Next steps:');
      console.log('   1. Run "npm run migrate" to transfer localStorage data');
      console.log('   2. Update DataService to use API endpoints');
      console.log('   3. Test dashboard and frontend functionality');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();
