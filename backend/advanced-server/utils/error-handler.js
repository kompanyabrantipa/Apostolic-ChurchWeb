/**
 * Error Handling and Diagnostics Utility
 * Provides enhanced error handling, logging, and diagnostics for the Apostolic Church backend
 */

// Enhanced error logger with detailed information
function logDetailedError(context, error, req = null) {
  const errorInfo = {
    context,
    error: {
      message: error.message,
      name: error.name,
      stack: error.stack,
      code: error.code,
      errno: error.errno,
      syscall: error.syscall
    },
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  };

  // Add request information if available
  if (req) {
    errorInfo.request = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      headers: req.headers,
      body: req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH' ? req.body : undefined
    };
  }

  console.error(`[${context}] Detailed Error:`, JSON.stringify(errorInfo, null, 2));
}

// Database query error handler
function handleDatabaseError(res, error, operation) {
  logDetailedError(`Database Operation: ${operation}`, error);
  
  // Handle specific MongoDB errors
  if (error.name === 'MongoServerError') {
    return res.status(500).json({
      success: false,
      message: 'Database operation failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid data format',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Bad request'
    });
  }
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Data validation failed',
      errors: Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }))
    });
  }
  
  // Generic database error
  return res.status(500).json({
    success: false,
    message: 'Database operation failed',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  });
}

// Async wrapper for route handlers to catch unhandled promise rejections
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Environment variable validator
function validateEnvironmentVariables(requiredVars) {
  const missingVars = requiredVars.filter(envVar => !process.env[envVar]);
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars);
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  console.log('✅ All required environment variables are present');
}

// Database connection health check
async function checkDatabaseHealth() {
  try {
    // This would be implemented based on your database connection logic
    console.log('🔍 Checking database health...');
    // Add your database health check logic here
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    logDetailedError('Database Health Check', error);
    return { status: 'unhealthy', error: error.message };
  }
}

// API endpoint health check
function checkEndpointHealth(req, res) {
  try {
    res.json({
      success: true,
      message: 'Endpoint is healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    logDetailedError('Endpoint Health Check', error, req);
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}

module.exports = {
  logDetailedError,
  handleDatabaseError,
  asyncHandler,
  validateEnvironmentVariables,
  checkDatabaseHealth,
  checkEndpointHealth
};