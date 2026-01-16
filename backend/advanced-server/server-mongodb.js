const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');
const cookieParser = require('cookie-parser');
require('dotenv').config({ path: __dirname + '/.env' });

// Validate required environment variables
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

console.log('✅ All required environment variables are present');

// Import MongoDB database and routes
const { connectDatabase, testConnection, healthCheck, getDatabaseStats } = require('./config/database-mongodb');
const authRoutes = require('./routes-mongodb/auth');
const blogRoutes = require('./routes-mongodb/blogs');
const eventRoutes = require('./routes-mongodb/events');
const sermonRoutes = require('./routes-mongodb/sermons');
const configRoutes = require('./routes/config');
const paymentRoutes = require('./routes-mongodb/payments');
const webhookRoutes = require('./routes-mongodb/webhooks');

// Import MongoDB models for stats
const Blog = require('./models-mongodb/Blog');
const Event = require('./models-mongodb/Event');
const Sermon = require('./models-mongodb/Sermon');

// Import performance middleware
const {
  cacheMiddleware,
  staticCacheMiddleware,
  invalidateCacheMiddleware,
  getCacheStats,
  warmUpCache
} = require('./middleware/cache');

// Import logging middleware
const {
  logger,
  requestLogger,
  errorLogger,
  logSecurityEvent,
  logHealthCheck
} = require('./middleware/logger');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;
const HTTP_PORT = process.env.HTTP_PORT || 80;
const HTTPS_ENABLED = process.env.HTTPS_ENABLED === 'true';

// SSL Configuration
let sslOptions = {};
if (HTTPS_ENABLED) {
  try {
    sslOptions = {
      key: fs.readFileSync(process.env.SSL_KEY_PATH || './ssl/private.key'),
      cert: fs.readFileSync(process.env.SSL_CERT_PATH || './ssl/certificate.crt')
    };

    // Add CA certificate if provided
    if (process.env.SSL_CA_PATH && fs.existsSync(process.env.SSL_CA_PATH)) {
      sslOptions.ca = fs.readFileSync(process.env.SSL_CA_PATH);
    }

    console.log('✅ SSL certificates loaded successfully');
  } catch (error) {
    console.warn('⚠️ SSL certificates not found, falling back to HTTP');
    console.warn('   For production, ensure SSL certificates are properly configured');
  }
}

// HTTPS Redirect Middleware (for production)
if (HTTPS_ENABLED && process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

// Compression middleware (GZIP)
if (process.env.ENABLE_GZIP === 'true') {
  app.use(compression({
    level: parseInt(process.env.COMPRESSION_LEVEL) || 6,
    threshold: 1024, // Only compress responses > 1KB
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    }
  }));
}

// Security middleware
const helmetConfig = {
  contentSecurityPolicy: process.env.CONTENT_SECURITY_POLICY === 'true',
  crossOriginEmbedderPolicy: false,
  hsts: HTTPS_ENABLED ? {
    maxAge: parseInt(process.env.HSTS_MAX_AGE) || 31536000,
    includeSubDomains: true,
    preload: true
  } : false,
  referrerPolicy: { policy: process.env.REFERRER_POLICY || 'strict-origin-when-cross-origin' },
  xssFilter: process.env.ENABLE_XSS_PROTECTION !== 'false',
  noSniff: process.env.ENABLE_CONTENT_TYPE_NOSNIFF !== 'false',
  frameguard: { action: process.env.X_FRAME_OPTIONS || 'deny' }
};

if (process.env.HELMET_ENABLED !== 'false') {
  app.use(helmet(helmetConfig));
}

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  // Log request
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - IP: ${req.ip || req.connection.remoteAddress}`);
  
  // Log response when it's finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - Status: ${res.statusCode} - Duration: ${duration}ms`);
  });
  
  next();
});

// Rate limiting
// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Default allowed origins plus localhost:3001 for admin dashboard
    const defaultOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'https://apostolicchurchlouisville.org',
      'https://www.apostolicchurchlouisville.org'
    ];
    const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : defaultOrigins;
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies to be sent
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Cookie',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-HTTP-Method-Override',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: [
    'Authorization',
    'Content-Disposition',
    'Content-Length'
  ]
};

// Apply CORS before rate limiter to handle preflight requests correctly
app.use(cors(corsOptions));

// Handle preflight requests for all routes
app.options('*', cors(corsOptions));

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

// Request logging middleware (before other middleware)
if (process.env.ENABLE_ACCESS_LOG !== 'false') {
  app.use(requestLogger);
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '..', '..', 'frontend'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
  etag: true,
  lastModified: true
}));

// Apply static cache middleware for production
if (process.env.NODE_ENV === 'production') {
  app.use('/images', staticCacheMiddleware(86400)); // 24 hours
  app.use('/css', staticCacheMiddleware(604800)); // 7 days
  app.use('/js', staticCacheMiddleware(604800)); // 7 days
}

// API Routes (using MongoDB routes with caching and invalidation)
// Backward compatibility routes for legacy frontend
app.get('/api/blog', (req, res) => {
  // Redirect /api/blog to /api/blogs for backward compatibility
  res.redirect(301, `/api/blogs`);
});

app.get('/api/blog/:id', (req, res) => {
  // Redirect /api/blog/:id to /api/blogs/:id for backward compatibility
  res.redirect(301, `/api/blogs/${req.params.id}`);
});

app.get('/api/events/public', (req, res) => {
  // Redirect /api/events/public to /api/events?published=true
  res.redirect(301, `/api/events?published=true`);
});

app.get('/api/sermons/public', (req, res) => {
  // Redirect /api/sermons/public to /api/sermons?published=true
  res.redirect(301, `/api/sermons?published=true`);
});

app.use('/api/auth', authRoutes);
app.use('/api/blogs',
  cacheMiddleware(1800), // 30 minutes cache for blogs
  invalidateCacheMiddleware(['/api/blogs']),
  blogRoutes
);
app.use('/api/events',
  cacheMiddleware(3600), // 1 hour cache for events
  invalidateCacheMiddleware(['/api/events']),
  eventRoutes
);
app.use('/api/sermons',
  cacheMiddleware(7200), // 2 hours cache for sermons
  invalidateCacheMiddleware(['/api/sermons']),
  sermonRoutes
);



app.use('/api/config', configRoutes);
app.use('/api/payments', paymentRoutes); // No caching for payment endpoints
app.use('/api/webhooks', webhookRoutes); // No caching for webhook endpoints

// Health check endpoint with MongoDB-specific information
app.get('/api/health', async (req, res) => {
  try {
    const dbHealth = await healthCheck();
    
    res.json({
      success: true,
      message: 'MongoDB server is healthy',
      timestamp: new Date().toISOString(),
      database: dbHealth.status,
      dbInfo: {
        type: 'MongoDB',
        host: dbHealth.host,
        database: dbHealth.database,
        state: dbHealth.state
      },
      version: '1.0.0-mongodb'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server health check failed',
      error: error.message,
      database: 'error'
    });
  }
});

// Dashboard stats endpoint (for dashboard overview) - MongoDB version
app.get('/api/stats', async (req, res) => {
  try {
    const [blogCount, eventCount, sermonCount, dbStats] = await Promise.all([
      Blog.getCount(),
      Event.getCount(),
      Sermon.getCount(),
      getDatabaseStats().catch(() => null) // Don't fail if stats unavailable
    ]);

    res.json({
      success: true,
      data: {
        blogs: blogCount,
        events: eventCount,
        sermons: sermonCount,
        total: blogCount + eventCount + sermonCount
      },
      database: {
        type: 'MongoDB',
        ...dbStats
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

// MongoDB-specific database info endpoint
app.get('/api/database/info', async (req, res) => {
  try {
    const dbStats = await getDatabaseStats();
    const dbHealth = await healthCheck();

    res.json({
      success: true,
      database: {
        type: 'MongoDB',
        status: dbHealth.status,
        host: dbHealth.host,
        database: dbHealth.database,
        stats: dbStats
      }
    });
  } catch (error) {
    console.error('Database info endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get database information'
    });
  }
});

// Performance monitoring endpoint
app.get('/api/performance', async (req, res) => {
  try {
    const cacheStats = getCacheStats();
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    res.json({
      success: true,
      performance: {
        uptime: process.uptime(),
        memory: {
          rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
          heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
          heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
          external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system
        },
        cache: {
          keys: cacheStats.keys,
          hits: cacheStats.hits,
          misses: cacheStats.misses,
          hitRate: `${(cacheStats.hitRate * 100).toFixed(2)}%`
        },
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch
        }
      }
    });
  } catch (error) {
    console.error('Performance endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get performance metrics'
    });
  }
});

// Catch-all handler for frontend routes (SPA support)
app.get('*', (req, res) => {
  try {
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
    
    const filePath = path.join(__dirname, '..', '..', 'frontend', htmlFile);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`HTML file not found: ${filePath}`);
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }
    
    res.sendFile(filePath);
  } catch (error) {
    console.error('Catch-all route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Error logging middleware
app.use(errorLogger);

// Global error handler
app.use((error, req, res, next) => {
  // Error already logged by errorLogger middleware
  
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
  
  // MongoDB connection error
  if (error.name === 'MongoError' || error.name === 'MongooseError') {
    return res.status(503).json({
      success: false,
      message: 'Database connection error'
    });
  }
  
  // Database query errors
  if (error.name === 'MongoServerError' || error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Database query error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Bad request'
    });
  }
  
  // Validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: Object.values(error.errors).map(err => err.message)
    });
  }
  
  // Default error response
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
    error: process.env.NODE_ENV === 'development' ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : undefined
  });
});

// Initialize production services
async function initializeProductionServices() {
  try {
    console.log('🔧 Initializing production services...');

    // Warm up cache
    if (process.env.ENABLE_RESPONSE_CACHING === 'true') {
      await warmUpCache();
    }

    // Start backup scheduler
    const { startBackupScheduler } = require('./scripts/backup-mongodb');
    startBackupScheduler();

    // Log health check
    logHealthCheck('healthy', {
      environment: process.env.NODE_ENV,
      https: HTTPS_ENABLED,
      caching: process.env.ENABLE_RESPONSE_CACHING === 'true',
      backups: process.env.BACKUP_ENABLED === 'true'
    });

    logger.info('Production services initialized successfully');
    console.log('✅ Production services initialized');

  } catch (error) {
    logger.error('Failed to initialize production services', { error: error.message });
    console.error('❌ Failed to initialize production services:', error.message);
  }
}

// Start server with HTTPS support
async function startServer() {
  try {
    // Connect to MongoDB
    console.log('🔍 Connecting to MongoDB...');
    await connectDatabase();

    // Test database connection
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error('❌ MongoDB connection failed. Please check your database configuration.');
      console.log('💡 Make sure MongoDB is running and accessible.');
      console.log('💡 Run "npm run setup-db" to initialize the database.');
      process.exit(1);
    }

    // Start HTTPS server if enabled
    if (HTTPS_ENABLED && sslOptions.key && sslOptions.cert) {
      const httpsServer = https.createServer(sslOptions, app);

      httpsServer.listen(PORT, async () => {
        console.log('🚀 Apostolic Church MongoDB Backend Server Started (HTTPS)');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`🔒 HTTPS Server running on: https://localhost:${PORT}`);
        console.log(`🌐 Frontend served from: https://localhost:${PORT}`);
        console.log(`🔧 API endpoints available at: https://localhost:${PORT}/api/`);
        console.log(`📊 Health check: https://localhost:${PORT}/api/health`);
        console.log(`🎛️ Dashboard: https://localhost:${PORT}/dashboard`);
        console.log(`🍃 Database: MongoDB (NoSQL Document Database)`);
        console.log(`🔐 SSL/TLS: Enabled with certificates`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ Production-ready HTTPS server running!');
        console.log('🔒 All traffic encrypted with SSL/TLS');
        console.log('⚡ Performance optimizations enabled');
        console.log('🛡️ Security headers configured');

        // Initialize production services
        await initializeProductionServices();
      });

      // Start HTTP server for redirects (production only)
      if (process.env.NODE_ENV === 'production') {
        const httpApp = express();
        httpApp.use((req, res) => {
          res.redirect(301, `https://${req.headers.host}${req.url}`);
        });

        httpApp.listen(HTTP_PORT, () => {
          console.log(`🔄 HTTP redirect server running on port ${HTTP_PORT} (redirects to HTTPS)`);
        });
      }

    } else {
      // Start HTTP server (development/fallback)
      const httpServer = http.createServer(app);

      httpServer.listen(PORT, async () => {
        console.log('🚀 Apostolic Church MongoDB Backend Server Started (HTTP)');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📡 HTTP Server running on: http://localhost:${PORT}`);
        console.log(`🌐 Frontend served from: http://localhost:${PORT}`);
        console.log(`🔧 API endpoints available at: http://localhost:${PORT}/api/`);
        console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
        console.log(`🎛️ Dashboard: http://localhost:${PORT}/dashboard`);
        console.log(`🍃 Database: MongoDB (NoSQL Document Database)`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        if (process.env.NODE_ENV === 'production') {
          console.log('⚠️ WARNING: Running HTTP in production mode!');
          console.log('🔒 For production, configure SSL certificates for HTTPS');
        } else {
          console.log('✅ Development server ready!');
          console.log('💡 For production, enable HTTPS with SSL certificates');
        }

        // Initialize production services
        await initializeProductionServices();
      });
    }

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);

    // Provide helpful error messages
    if (error.message.includes('ECONNREFUSED')) {
      console.log('');
      console.log('💡 MongoDB Connection Troubleshooting:');
      console.log('   1. Make sure MongoDB is installed and running');
      console.log('   2. Start MongoDB service:');
      console.log('      - Windows: net start MongoDB');
      console.log('      - macOS: brew services start mongodb-community');
      console.log('      - Linux: sudo systemctl start mongod');
      console.log('   3. Check MongoDB is listening on port 27017');
      console.log('   4. Verify MONGODB_URI in .env file');
    }

    if (error.code === 'ENOENT' && error.path) {
      console.log('');
      console.log('💡 SSL Certificate Error:');
      console.log(`   Certificate file not found: ${error.path}`);
      console.log('   1. Generate SSL certificates or disable HTTPS');
      console.log('   2. Update SSL_CERT_PATH and SSL_KEY_PATH in .env');
      console.log('   3. For development, set HTTPS_ENABLED=false');
    }

    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  const { closeDatabase } = require('./config/database-mongodb');
  await closeDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  const { closeDatabase } = require('./config/database-mongodb');
  await closeDatabase();
  process.exit(0);
});

// Start the server
startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application will continue running despite unhandled rejections
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1); // Exit process after logging
});

// Start periodic cleanup of expired refresh tokens
function startRefreshTokenCleanupJob() {
  // Run cleanup immediately on startup
  cleanupExpiredRefreshTokens();
  
  // Schedule cleanup to run every 12 hours
  setInterval(cleanupExpiredRefreshTokens, 12 * 60 * 60 * 1000); // 12 hours
  
  console.log('🔄 Refresh token cleanup job scheduled (every 12 hours)');
}

// Cleanup function to remove expired refresh tokens
async function cleanupExpiredRefreshTokens() {
  try {
    const RefreshToken = require('./models-mongodb/RefreshToken');
    const deletedCount = await RefreshToken.cleanExpiredTokens();
    
    if (deletedCount > 0) {
      console.log(`🧹 Cleaned up ${deletedCount} expired or revoked refresh tokens`);
      logger.info(`Cleaned up ${deletedCount} expired or revoked refresh tokens`);
    }
  } catch (error) {
    console.error('❌ Error cleaning up expired refresh tokens:', error.message);
    logger.error('Error cleaning up expired refresh tokens', { error: error.message });
  }
}
