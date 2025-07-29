const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection configuration
const mongoConfig = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/apostolic_church',
  options: {
    // Connection pool settings
    maxPoolSize: 10, // Maximum number of connections in the pool
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    
    // Authentication (if required)
    ...(process.env.MONGODB_USERNAME && {
      auth: {
        username: process.env.MONGODB_USERNAME,
        password: process.env.MONGODB_PASSWORD
      }
    })
  }
};

// Connection state tracking
let isConnected = false;

// Connect to MongoDB
async function connectDatabase() {
  try {
    if (isConnected) {
      console.log('✅ MongoDB already connected');
      return mongoose.connection;
    }

    console.log('🔍 Connecting to MongoDB...');
    console.log(`📡 URI: ${mongoConfig.uri.replace(/\/\/.*@/, '//***:***@')}`); // Hide credentials in logs

    await mongoose.connect(mongoConfig.uri, mongoConfig.options);
    
    isConnected = true;
    console.log('✅ MongoDB connected successfully');
    console.log(`📅 Database: ${mongoose.connection.name}`);
    console.log(`🏠 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
    
    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    isConnected = false;
    throw error;
  }
}

// Test database connection
async function testConnection() {
  try {
    if (!isConnected) {
      await connectDatabase();
    }
    
    // Test with a simple operation
    const adminDb = mongoose.connection.db.admin();
    const serverStatus = await adminDb.serverStatus();
    
    console.log('📅 Database time:', new Date().toISOString());
    console.log('🔧 MongoDB version:', serverStatus.version);
    
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
    return false;
  }
}

// Close database connection
async function closeDatabase() {
  try {
    if (isConnected) {
      await mongoose.connection.close();
      isConnected = false;
      console.log('🔒 MongoDB connection closed');
    }
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error.message);
  }
}

// Get database connection
function getDatabase() {
  if (!isConnected) {
    throw new Error('Database not connected. Call connectDatabase() first.');
  }
  return mongoose.connection;
}

// Database health check
async function healthCheck() {
  try {
    if (!isConnected) {
      return { status: 'disconnected', message: 'Not connected to database' };
    }

    // Check connection state
    const state = mongoose.connection.readyState;
    const stateMap = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    if (state === 1) {
      // Test with a ping
      await mongoose.connection.db.admin().ping();
      
      return {
        status: 'connected',
        message: 'Database connection healthy',
        database: mongoose.connection.name,
        host: `${mongoose.connection.host}:${mongoose.connection.port}`,
        state: stateMap[state]
      };
    } else {
      return {
        status: stateMap[state] || 'unknown',
        message: `Database connection state: ${stateMap[state] || 'unknown'}`
      };
    }
  } catch (error) {
    return {
      status: 'error',
      message: error.message
    };
  }
}

// Get database statistics
async function getDatabaseStats() {
  try {
    if (!isConnected) {
      throw new Error('Database not connected');
    }

    const db = mongoose.connection.db;
    const stats = await db.stats();
    
    return {
      database: mongoose.connection.name,
      collections: stats.collections,
      dataSize: `${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`,
      storageSize: `${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`,
      indexes: stats.indexes,
      objects: stats.objects
    };
  } catch (error) {
    console.error('Error getting database stats:', error);
    throw error;
  }
}

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connected to MongoDB');
  isConnected = true;
});

mongoose.connection.on('error', (error) => {
  console.error('❌ Mongoose connection error:', error.message);
  isConnected = false;
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose disconnected from MongoDB');
  isConnected = false;
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, closing MongoDB connection...');
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, closing MongoDB connection...');
  await closeDatabase();
  process.exit(0);
});

// Utility function to format MongoDB queries for logging (similar to PostgreSQL version)
function logQuery(operation, collection, query = {}, options = {}) {
  const start = Date.now();
  
  return {
    end: (result) => {
      const duration = Date.now() - start;
      console.log('📊 Query executed:', {
        operation,
        collection,
        query: JSON.stringify(query).substring(0, 50) + '...',
        duration,
        results: Array.isArray(result) ? result.length : (result ? 1 : 0)
      });
    }
  };
}

module.exports = {
  connectDatabase,
  testConnection,
  closeDatabase,
  getDatabase,
  healthCheck,
  getDatabaseStats,
  logQuery,
  mongoose,
  isConnected: () => isConnected
};
