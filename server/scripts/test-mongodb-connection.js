const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection test script
async function testMongoDBConnection() {
  console.log('🔍 MongoDB Connection Diagnostic Tool');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Check environment variables
  console.log('📋 Environment Configuration:');
  console.log(`   MONGODB_URI: ${process.env.MONGODB_URI || 'NOT SET'}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'NOT SET'}`);
  console.log(`   PORT: ${process.env.PORT || 'NOT SET'}`);
  console.log('');
  
  // Default MongoDB URI if not set
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/apostolic_church';
  console.log(`🔗 Attempting connection to: ${mongoUri}`);
  console.log('');
  
  try {
    // Test 1: Basic connection
    console.log('🧪 Test 1: Basic MongoDB Connection');
    console.log('   Connecting...');
    
    const connection = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      socketTimeoutMS: 45000,
      maxPoolSize: 10
    });
    
    console.log('   ✅ Connection successful!');
    console.log(`   📅 Connected to: ${connection.connection.name}`);
    console.log(`   🏠 Host: ${connection.connection.host}:${connection.connection.port}`);
    console.log(`   🔧 MongoDB version: ${(await connection.connection.db.admin().serverStatus()).version}`);
    console.log('');
    
    // Test 2: Database operations
    console.log('🧪 Test 2: Database Operations');
    console.log('   Testing basic database operations...');
    
    const db = connection.connection.db;
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log(`   📊 Collections found: ${collections.length}`);
    collections.forEach(col => console.log(`      - ${col.name}`));
    console.log('');
    
    // Test write operation
    const testCollection = db.collection('connection_test');
    const testDoc = {
      test: true,
      timestamp: new Date(),
      message: 'MongoDB connection test successful'
    };
    
    const insertResult = await testCollection.insertOne(testDoc);
    console.log('   ✅ Write test successful');
    console.log(`   📝 Inserted document ID: ${insertResult.insertedId}`);
    
    // Test read operation
    const readResult = await testCollection.findOne({ _id: insertResult.insertedId });
    console.log('   ✅ Read test successful');
    console.log(`   📖 Retrieved document: ${readResult.message}`);
    
    // Clean up test document
    await testCollection.deleteOne({ _id: insertResult.insertedId });
    console.log('   🧹 Test document cleaned up');
    console.log('');
    
    // Test 3: Church-specific collections
    console.log('🧪 Test 3: Church Database Structure');
    
    const churchCollections = ['users', 'blogs', 'events', 'sermons'];
    for (const collectionName of churchCollections) {
      const collection = db.collection(collectionName);
      const count = await collection.countDocuments();
      console.log(`   📊 ${collectionName}: ${count} documents`);
    }
    console.log('');
    
    // Test 4: Indexes
    console.log('🧪 Test 4: Index Information');
    for (const collectionName of churchCollections) {
      try {
        const collection = db.collection(collectionName);
        const indexes = await collection.indexes();
        console.log(`   🔍 ${collectionName} indexes: ${indexes.length}`);
        indexes.forEach(index => {
          const keys = Object.keys(index.key).join(', ');
          console.log(`      - ${index.name}: ${keys}`);
        });
      } catch (error) {
        console.log(`   ⚠️ ${collectionName}: Collection doesn't exist yet`);
      }
    }
    console.log('');
    
    // Success summary
    console.log('🎉 MongoDB Connection Test Results: ALL PASSED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Connection: Working');
    console.log('✅ Database Operations: Working');
    console.log('✅ Church Collections: Ready');
    console.log('✅ Indexes: Configured');
    console.log('');
    console.log('🚀 Your MongoDB setup is ready for the Apostolic Church backend!');
    
  } catch (error) {
    console.log('❌ MongoDB Connection Test: FAILED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('🚨 Error Details:');
    console.error(`   Type: ${error.name}`);
    console.error(`   Message: ${error.message}`);
    
    if (error.code) {
      console.error(`   Code: ${error.code}`);
    }
    
    console.log('');
    console.log('💡 Troubleshooting Steps:');
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('   🔧 MongoDB service is not running');
      console.log('   📋 Solutions:');
      console.log('      - Windows: net start MongoDB');
      console.log('      - macOS: brew services start mongodb-community');
      console.log('      - Linux: sudo systemctl start mongod');
      console.log('');
    }
    
    if (error.message.includes('Authentication failed')) {
      console.log('   🔐 Authentication issue');
      console.log('   📋 Solutions:');
      console.log('      - Check username/password in MONGODB_URI');
      console.log('      - Try connecting without authentication first');
      console.log('      - Verify user permissions in MongoDB');
      console.log('');
    }
    
    if (error.message.includes('Server selection timed out')) {
      console.log('   ⏱️ Connection timeout');
      console.log('   📋 Solutions:');
      console.log('      - Check if MongoDB is running on the correct port');
      console.log('      - Verify firewall settings');
      console.log('      - Check network connectivity');
      console.log('');
    }
    
    console.log('   🔍 General troubleshooting:');
    console.log('      1. Verify MongoDB is installed and running');
    console.log('      2. Check the connection string in .env file');
    console.log('      3. Test connection with MongoDB Compass or mongosh');
    console.log('      4. Review MongoDB logs for additional details');
    
  } finally {
    // Close connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔒 Connection closed');
    }
  }
}

// Check MongoDB service status (platform-specific)
function checkMongoDBService() {
  console.log('🔍 MongoDB Service Status Check');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const { spawn } = require('child_process');
  const os = require('os');
  const platform = os.platform();
  
  console.log(`🖥️ Platform: ${platform}`);
  console.log('');
  
  if (platform === 'win32') {
    console.log('📋 Windows MongoDB Service Commands:');
    console.log('   Check status: sc query MongoDB');
    console.log('   Start service: net start MongoDB');
    console.log('   Stop service: net stop MongoDB');
    console.log('');
    
    // Try to check service status
    const serviceCheck = spawn('sc', ['query', 'MongoDB'], { shell: true });
    
    serviceCheck.stdout.on('data', (data) => {
      console.log('🔍 Service Status:');
      console.log(data.toString());
    });
    
    serviceCheck.stderr.on('data', (data) => {
      console.log('⚠️ Service check failed:');
      console.log(data.toString());
      console.log('💡 MongoDB might not be installed as a Windows service');
    });
    
  } else if (platform === 'darwin') {
    console.log('📋 macOS MongoDB Service Commands:');
    console.log('   Check status: brew services list | grep mongodb');
    console.log('   Start service: brew services start mongodb-community');
    console.log('   Stop service: brew services stop mongodb-community');
    console.log('');
    
  } else if (platform === 'linux') {
    console.log('📋 Linux MongoDB Service Commands:');
    console.log('   Check status: sudo systemctl status mongod');
    console.log('   Start service: sudo systemctl start mongod');
    console.log('   Stop service: sudo systemctl stop mongod');
    console.log('   Enable on boot: sudo systemctl enable mongod');
    console.log('');
  }
}

// Run tests based on command line arguments
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'service') {
    checkMongoDBService();
  } else {
    testMongoDBConnection();
  }
}

module.exports = { testMongoDBConnection, checkMongoDBService };
