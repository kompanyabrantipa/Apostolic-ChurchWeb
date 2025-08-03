const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');
const cookieParser = require('cookie-parser');
require('dotenv').config();

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

console.log('🚀 Starting Apostolic Church Production Server...');

// GZIP Compression
if (process.env.ENABLE_GZIP === 'true') {
  app.use(compression({
    level: parseInt(process.env.COMPRESSION_LEVEL) || 6,
    threshold: 1024
  }));
  console.log('✅ GZIP compression enabled');
}

// Security middleware
const helmetConfig = {
  contentSecurityPolicy: process.env.CONTENT_SECURITY_POLICY === 'true',
  crossOriginEmbedderPolicy: false,
  referrerPolicy: { policy: process.env.REFERRER_POLICY || 'strict-origin-when-cross-origin' },
  xssFilter: process.env.ENABLE_XSS_PROTECTION !== 'false',
  noSniff: process.env.ENABLE_CONTENT_TYPE_NOSNIFF !== 'false',
  frameguard: { action: process.env.X_FRAME_OPTIONS || 'deny' }
};

if (process.env.HELMET_ENABLED !== 'false') {
  app.use(helmet(helmetConfig));
  console.log('✅ Security headers enabled');
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);
console.log('✅ Rate limiting enabled');

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
};

app.use(cors(corsOptions));
console.log('✅ CORS configured');

// Request logging middleware
if (process.env.ENABLE_ACCESS_LOG !== 'false') {
  app.use(requestLogger);
  console.log('✅ Request logging enabled');
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Serve static files
app.use(express.static(path.join(__dirname, '..'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
  etag: true,
  lastModified: true
}));

// Apply static cache middleware for production
if (process.env.NODE_ENV === 'production') {
  app.use('/images', staticCacheMiddleware(86400));
  app.use('/css', staticCacheMiddleware(604800));
  app.use('/js', staticCacheMiddleware(604800));
  console.log('✅ Static file caching enabled');
}

// API Routes with caching
app.use('/api/auth', authRoutes);
app.use('/api/blogs', 
  cacheMiddleware(1800),
  invalidateCacheMiddleware(['/api/blogs']),
  blogRoutes
);
app.use('/api/events', 
  cacheMiddleware(3600),
  invalidateCacheMiddleware(['/api/events']),
  eventRoutes
);
app.use('/api/sermons',
  cacheMiddleware(7200),
  invalidateCacheMiddleware(['/api/sermons']),
  sermonRoutes
);
app.use('/api/config', configRoutes);
app.use('/api/payments', paymentRoutes); // No caching for payment endpoints
app.use('/api/webhooks', webhookRoutes); // No caching for webhook endpoints
console.log('✅ API routes configured with caching');

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const dbHealth = await healthCheck();
    
    res.json({
      success: true,
      message: 'Production MongoDB server is healthy',
      timestamp: new Date().toISOString(),
      database: dbHealth.status,
      dbInfo: {
        type: 'MongoDB',
        host: dbHealth.host,
        database: dbHealth.database,
        state: dbHealth.state
      },
      version: '2.0.0-production',
      features: {
        caching: process.env.ENABLE_RESPONSE_CACHING === 'true',
        compression: process.env.ENABLE_GZIP === 'true',
        logging: process.env.ENABLE_ACCESS_LOG !== 'false',
        security: process.env.HELMET_ENABLED !== 'false'
      }
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

// Performance monitoring endpoint
app.get('/api/performance', async (req, res) => {
  try {
    const cacheStats = getCacheStats();
    const memoryUsage = process.memoryUsage();
    
    res.json({
      success: true,
      performance: {
        uptime: process.uptime(),
        memory: {
          rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
          heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
          heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`
        },
        cache: {
          keys: cacheStats.keys,
          hits: cacheStats.hits,
          misses: cacheStats.misses,
          hitRate: `${(cacheStats.hitRate * 100).toFixed(2)}%`
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get performance metrics'
    });
  }
});

// Dashboard stats endpoint
app.get('/api/stats', async (req, res) => {
  try {
    const [blogCount, eventCount, sermonCount, dbStats] = await Promise.all([
      Blog.getCount(),
      Event.getCount(),
      Sermon.getCount(),
      getDatabaseStats().catch(() => null)
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
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics'
    });
  }
});

// Catch-all handler for frontend routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: 'API endpoint not found'
    });
  }
  
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

// Error logging middleware
app.use(errorLogger);

// Global error handler
app.use((error, req, res, next) => {
  if (error.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS policy violation'
    });
  }
  
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
  });
});

// Initialize production services
async function initializeProductionServices() {
  try {
    console.log('🔧 Initializing production services...');
    
    // Warm up cache
    if (process.env.ENABLE_RESPONSE_CACHING === 'true') {
      await warmUpCache();
      console.log('✅ Cache warmed up');
    }
    
    // Start backup scheduler
    if (process.env.BACKUP_ENABLED === 'true') {
      const { startBackupScheduler } = require('./scripts/backup-mongodb');
      startBackupScheduler();
      console.log('✅ Backup scheduler started');
    }
    
    // Log health check
    logHealthCheck('healthy', {
      environment: process.env.NODE_ENV,
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

// Start server
async function startServer() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await connectDatabase();
    
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('MongoDB connection failed');
    }
    
    console.log('✅ MongoDB connected');
    
    app.listen(PORT, async () => {
      console.log('🚀 Apostolic Church Production Server Started');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📡 Server running on: http://localhost:${PORT}`);
      console.log(`🌐 Frontend served from: http://localhost:${PORT}`);
      console.log(`🔧 API endpoints: http://localhost:${PORT}/api/`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`⚡ Performance: http://localhost:${PORT}/api/performance`);
      console.log(`🎛️ Dashboard: http://localhost:${PORT}/dashboard`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ Production features enabled:');
      console.log(`   🗜️ GZIP Compression: ${process.env.ENABLE_GZIP === 'true' ? 'ON' : 'OFF'}`);
      console.log(`   📦 Response Caching: ${process.env.ENABLE_RESPONSE_CACHING === 'true' ? 'ON' : 'OFF'}`);
      console.log(`   📝 Access Logging: ${process.env.ENABLE_ACCESS_LOG !== 'false' ? 'ON' : 'OFF'}`);
      console.log(`   🛡️ Security Headers: ${process.env.HELMET_ENABLED !== 'false' ? 'ON' : 'OFF'}`);
      console.log(`   💾 Automated Backups: ${process.env.BACKUP_ENABLED === 'true' ? 'ON' : 'OFF'}`);
      
      // Initialize production services
      await initializeProductionServices();
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
