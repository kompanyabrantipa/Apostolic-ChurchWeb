const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// Ensure log directory exists
const logDir = path.dirname(process.env.LOG_FILE || './logs/app.log');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} ${level}: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Create logger instance with simplified configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'apostolic-church-backend' },
  transports: [
    // File transport with rotation
    new DailyRotateFile({
      filename: process.env.LOG_FILE || './logs/app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: process.env.LOG_MAX_SIZE || '20m',
      maxFiles: process.env.LOG_MAX_FILES || '14d',
      zippedArchive: false, // Disable compression to avoid blocking
      level: process.env.LOG_LEVEL || 'info',
      handleExceptions: false,
      handleRejections: false
    }),

    // Error file transport
    new DailyRotateFile({
      filename: process.env.ERROR_LOG_FILE || './logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: process.env.LOG_MAX_SIZE || '20m',
      maxFiles: process.env.LOG_MAX_FILES || '30d',
      zippedArchive: false, // Disable compression to avoid blocking
      level: 'error',
      handleExceptions: false,
      handleRejections: false
    })
  ],

  // Disable exception and rejection handlers to prevent blocking
  exitOnError: false
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    level: 'debug'
  }));
}

// Request logging middleware
function requestLogger(req, res, next) {
  const start = Date.now();
  
  // Log request
  logger.info('HTTP Request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    referer: req.get('Referer'),
    timestamp: new Date().toISOString()
  });
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
    
    logger.log(logLevel, 'HTTP Response', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length'),
      ip: req.ip || req.connection.remoteAddress
    });
    
    // Log slow queries
    if (duration > (parseInt(process.env.SLOW_QUERY_THRESHOLD_MS) || 1000)) {
      logger.warn('Slow Request', {
        method: req.method,
        url: req.originalUrl,
        duration: `${duration}ms`,
        threshold: process.env.SLOW_QUERY_THRESHOLD_MS || '1000ms'
      });
    }
  });
  
  next();
}

// Database query logging
function logDatabaseQuery(operation, collection, query = {}, duration = 0) {
  if (process.env.ENABLE_QUERY_LOGGING === 'true') {
    logger.debug('Database Query', {
      operation,
      collection,
      query: JSON.stringify(query),
      duration: `${duration}ms`
    });
    
    // Log slow database queries
    if (duration > (parseInt(process.env.SLOW_QUERY_THRESHOLD_MS) || 1000)) {
      logger.warn('Slow Database Query', {
        operation,
        collection,
        query: JSON.stringify(query),
        duration: `${duration}ms`
      });
    }
  }
}

// Error logging middleware
function errorLogger(error, req, res, next) {
  logger.error('Application Error', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    body: req.method === 'POST' ? req.body : undefined
  });
  
  next(error);
}

// Security event logging
function logSecurityEvent(event, details = {}, req = null) {
  const logData = {
    securityEvent: event,
    ...details,
    timestamp: new Date().toISOString()
  };
  
  if (req) {
    logData.ip = req.ip || req.connection.remoteAddress;
    logData.userAgent = req.get('User-Agent');
    logData.url = req.originalUrl;
  }
  
  logger.warn('Security Event', logData);
}

// Performance metrics logging
function logPerformanceMetrics() {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  logger.info('Performance Metrics', {
    uptime: process.uptime(),
    memory: {
      rss: memoryUsage.rss,
      heapTotal: memoryUsage.heapTotal,
      heapUsed: memoryUsage.heapUsed,
      external: memoryUsage.external
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system
    }
  });
}

// Start performance metrics logging interval
if (process.env.ENABLE_PERFORMANCE_METRICS === 'true') {
  setInterval(logPerformanceMetrics, 300000); // Every 5 minutes
}

// Health check logging
function logHealthCheck(status, details = {}) {
  logger.info('Health Check', {
    status,
    ...details,
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  logger,
  requestLogger,
  errorLogger,
  logDatabaseQuery,
  logSecurityEvent,
  logPerformanceMetrics,
  logHealthCheck
};
