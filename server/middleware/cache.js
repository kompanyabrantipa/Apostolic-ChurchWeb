const NodeCache = require('node-cache');

// Create cache instance
const cache = new NodeCache({
  stdTTL: parseInt(process.env.CACHE_TTL) || 3600, // Default 1 hour
  checkperiod: 600, // Check for expired keys every 10 minutes
  useClones: false // Better performance, but be careful with object mutations
});

// Cache middleware for API responses
function cacheMiddleware(duration = null) {
  return (req, res, next) => {
    // Skip caching for authenticated requests or non-GET requests
    if (req.method !== 'GET' || req.user || req.headers.authorization) {
      return next();
    }
    
    // Skip caching if disabled
    if (process.env.ENABLE_RESPONSE_CACHING !== 'true') {
      return next();
    }
    
    const key = `cache:${req.originalUrl}`;
    const cachedResponse = cache.get(key);
    
    if (cachedResponse) {
      console.log(`📦 Cache HIT: ${req.originalUrl}`);
      res.set('X-Cache', 'HIT');
      return res.json(cachedResponse);
    }
    
    // Store original json method
    const originalJson = res.json;
    
    // Override json method to cache response
    res.json = function(data) {
      // Only cache successful responses
      if (res.statusCode === 200 && data && data.success !== false) {
        const cacheDuration = duration || parseInt(process.env.CACHE_TTL) || 3600;
        cache.set(key, data, cacheDuration);
        console.log(`📦 Cache SET: ${req.originalUrl} (TTL: ${cacheDuration}s)`);
        res.set('X-Cache', 'MISS');
      }
      
      // Call original json method
      return originalJson.call(this, data);
    };
    
    next();
  };
}

// Cache middleware for static content
function staticCacheMiddleware(maxAge = 86400) { // Default 24 hours
  return (req, res, next) => {
    if (process.env.NODE_ENV === 'production') {
      const cacheMaxAge = parseInt(process.env.STATIC_CACHE_MAX_AGE) || maxAge;
      res.set('Cache-Control', `public, max-age=${cacheMaxAge}`);
      res.set('Expires', new Date(Date.now() + cacheMaxAge * 1000).toUTCString());
    }
    next();
  };
}

// Clear cache for specific patterns
function clearCache(pattern = null) {
  if (pattern) {
    const keys = cache.keys();
    const matchingKeys = keys.filter(key => key.includes(pattern));
    cache.del(matchingKeys);
    console.log(`🗑️ Cleared ${matchingKeys.length} cache entries matching: ${pattern}`);
    return matchingKeys.length;
  } else {
    cache.flushAll();
    console.log('🗑️ Cleared all cache entries');
    return cache.getStats().keys;
  }
}

// Cache invalidation middleware (for content updates)
function invalidateCacheMiddleware(patterns = []) {
  return (req, res, next) => {
    // Store original methods
    const originalJson = res.json;
    const originalSend = res.send;
    
    // Override response methods to clear cache on successful updates
    const clearCacheOnSuccess = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        patterns.forEach(pattern => {
          clearCache(pattern);
        });
      }
      return data;
    };
    
    res.json = function(data) {
      clearCacheOnSuccess(data);
      return originalJson.call(this, data);
    };
    
    res.send = function(data) {
      clearCacheOnSuccess(data);
      return originalSend.call(this, data);
    };
    
    next();
  };
}

// Get cache statistics
function getCacheStats() {
  const stats = cache.getStats();
  return {
    keys: stats.keys,
    hits: stats.hits,
    misses: stats.misses,
    hitRate: stats.hits / (stats.hits + stats.misses) || 0,
    memory: process.memoryUsage(),
    uptime: process.uptime()
  };
}

// Warm up cache with frequently accessed content
async function warmUpCache() {
  console.log('🔥 Warming up cache...');
  
  try {
    const Blog = require('../models-mongodb/Blog');
    const Event = require('../models-mongodb/Event');
    const Sermon = require('../models-mongodb/Sermon');
    
    // Pre-load published content
    const [blogs, events, sermons] = await Promise.all([
      Blog.getPublished(),
      Event.getPublished(),
      Sermon.getPublished()
    ]);
    
    // Cache the results
    cache.set('cache:/api/blogs?published=true', { success: true, data: blogs });
    cache.set('cache:/api/events?published=true', { success: true, data: events });
    cache.set('cache:/api/sermons?published=true', { success: true, data: sermons });
    
    console.log(`🔥 Cache warmed up with ${blogs.length + events.length + sermons.length} items`);
  } catch (error) {
    console.error('❌ Cache warm-up failed:', error.message);
  }
}

module.exports = {
  cache,
  cacheMiddleware,
  staticCacheMiddleware,
  invalidateCacheMiddleware,
  clearCache,
  getCacheStats,
  warmUpCache
};
