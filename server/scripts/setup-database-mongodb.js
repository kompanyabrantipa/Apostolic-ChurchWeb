const { connectDatabase, testConnection, closeDatabase, getDatabaseStats } = require('../config/database-mongodb');
const User = require('../models-mongodb/User');
const Blog = require('../models-mongodb/Blog');
const Event = require('../models-mongodb/Event');
const Sermon = require('../models-mongodb/Sermon');
require('dotenv').config();

async function setupDatabase() {
  console.log('🚀 Starting MongoDB database setup...');
  
  try {
    // Test connection first
    console.log('🔍 Testing MongoDB connection...');
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Could not connect to MongoDB database');
    }
    
    // Ensure all models are registered and indexes are created
    console.log('📋 Creating collections and indexes...');
    
    // Create indexes for all models
    await Promise.all([
      User.createIndexes(),
      Blog.createIndexes(),
      Event.createIndexes(),
      Sermon.createIndexes()
    ]);
    
    console.log('✅ Collections and indexes created successfully');
    
    // Create default admin user
    console.log('👤 Creating default admin user...');
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    // Check if admin user already exists
    const existingUser = await User.findByUsername(adminUsername);
    
    if (!existingUser) {
      const adminUser = await User.createUser({
        username: adminUsername,
        password: adminPassword,
        role: 'admin'
      });
      
      console.log(`✅ Admin user created: ${adminUsername}`);
      console.log(`🔑 Admin password: ${adminPassword}`);
      console.log(`👤 User ID: ${adminUser._id}`);
    } else {
      console.log('ℹ️ Admin user already exists');
    }
    
    // Verify collections
    console.log('🔍 Verifying collections...');
    const db = require('../config/database-mongodb').mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log('📊 Available collections:');
    collections.forEach(collection => {
      console.log(`  - ${collection.name}`);
    });
    
    // Get database statistics
    console.log('📈 Database statistics:');
    const stats = await getDatabaseStats();
    console.log(`  - Database: ${stats.database}`);
    console.log(`  - Collections: ${stats.collections}`);
    console.log(`  - Data Size: ${stats.dataSize}`);
    console.log(`  - Storage Size: ${stats.storageSize}`);
    console.log(`  - Indexes: ${stats.indexes}`);
    console.log(`  - Objects: ${stats.objects}`);
    
    // Test CRUD operations
    console.log('🧪 Testing CRUD operations...');
    
    // Test blog creation
    const testBlog = await Blog.create({
      title: 'MongoDB Setup Test Blog',
      summary: 'This is a test blog created during MongoDB setup',
      content: '<p>This blog verifies that MongoDB CRUD operations are working correctly.</p>',
      status: 'draft',
      author: 'System'
    });
    
    console.log(`✅ Test blog created: ${testBlog._id}`);
    
    // Test blog retrieval
    const retrievedBlog = await Blog.getById(testBlog._id);
    if (retrievedBlog) {
      console.log('✅ Test blog retrieved successfully');
    }
    
    // Test blog update
    const updatedBlog = await Blog.update(testBlog._id, {
      title: 'MongoDB Setup Test Blog (Updated)',
      status: 'published'
    });
    
    if (updatedBlog) {
      console.log('✅ Test blog updated successfully');
    }
    
    // Clean up test blog
    const deletedBlog = await Blog.delete(testBlog._id);
    if (deletedBlog) {
      console.log('✅ Test blog deleted successfully');
    }
    
    console.log('🎉 MongoDB database setup completed successfully!');
    console.log('');
    console.log('🎯 Advantages of MongoDB for your church:');
    console.log('  ✅ Perfect for JSON-like data (matches localStorage structure)');
    console.log('  ✅ Flexible schema - easy to add new fields');
    console.log('  ✅ Excellent performance for read-heavy workloads');
    console.log('  ✅ Built-in replication and sharding support');
    console.log('  ✅ Rich query capabilities with aggregation framework');
    console.log('  ✅ GridFS for file storage (images, videos)');
    console.log('  ✅ Horizontal scaling when your church grows');
    console.log('');
    console.log('📋 Next steps:');
    console.log('  1. Start the MongoDB server: npm run dev');
    console.log('  2. Test the API endpoints');
    console.log('  3. Migrate your localStorage data: npm run migrate');
    console.log('  4. Update your frontend to use the MongoDB backend');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Provide helpful error messages
    if (error.message.includes('ECONNREFUSED')) {
      console.log('');
      console.log('💡 MongoDB Connection Failed - Troubleshooting:');
      console.log('  1. Make sure MongoDB is installed and running');
      console.log('  2. Check if MongoDB service is started:');
      console.log('     - Windows: net start MongoDB');
      console.log('     - macOS: brew services start mongodb-community');
      console.log('     - Linux: sudo systemctl start mongod');
      console.log('  3. Verify MongoDB is listening on the correct port (default: 27017)');
      console.log('  4. Check your MONGODB_URI in the .env file');
    }
    
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

// Helper function to create sample data for testing
async function createSampleData() {
  console.log('🎬 Creating sample data for testing...');
  
  try {
    await connectDatabase();
    
    // Sample blogs
    const sampleBlogs = [
      {
        title: 'Welcome to Our MongoDB-Powered Church Website',
        summary: 'Discover how our new MongoDB backend enhances your church experience.',
        content: '<p>We are excited to announce that our church website now runs on MongoDB, providing better performance and flexibility for our growing community.</p><p>This modern database solution allows us to serve you better with faster content delivery and more reliable service.</p>',
        status: 'published',
        author: 'Pastor Johnson',
        category: 'Announcements'
      },
      {
        title: 'The Power of Community in Faith',
        summary: 'Exploring how fellowship strengthens our spiritual journey.',
        content: '<p>Community is at the heart of our faith. When we come together in fellowship, we create bonds that strengthen our individual and collective spiritual growth.</p><p>Join us as we explore the biblical foundations of Christian community and how it transforms lives.</p>',
        status: 'published',
        author: 'Church Staff',
        category: 'Faith'
      }
    ];
    
    // Sample events
    const sampleEvents = [
      {
        title: 'Sunday Worship Service',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
        location: 'Main Sanctuary',
        description: '<p>Join us for our weekly worship service featuring inspiring music, fellowship, and a powerful message from God\'s Word.</p><p>Service includes communion and prayer time.</p>',
        status: 'published'
      },
      {
        title: 'Community Outreach Program',
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Two weeks from now
        location: 'Community Center',
        description: '<p>Help us serve our local community through food distribution, clothing drive, and fellowship activities.</p><p>Volunteers needed - all ages welcome!</p>',
        status: 'published'
      }
    ];
    
    // Sample sermons
    const sampleSermons = [
      {
        title: 'Walking in Faith Through Uncertainty',
        speaker: 'Pastor Johnson',
        date: new Date(),
        description: '<p>A powerful message about trusting God\'s plan even when we can\'t see the full picture ahead.</p><p>Learn how to maintain faith during life\'s challenging seasons.</p>',
        videoUrl: 'https://example.com/sermon1',
        audioUrl: 'https://example.com/sermon1-audio',
        thumbnailUrl: 'images/sermon-placeholder.jpg',
        status: 'published'
      },
      {
        title: 'Love in Action: Serving Others',
        speaker: 'Pastor Smith',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last week
        description: '<p>Exploring how we can demonstrate God\'s love through our actions and service to others in our community.</p><p>Practical steps for living out our faith daily.</p>',
        videoUrl: 'https://example.com/sermon2',
        audioUrl: 'https://example.com/sermon2-audio',
        thumbnailUrl: 'images/sermon-placeholder.jpg',
        status: 'published'
      }
    ];
    
    // Create sample data
    console.log('📚 Creating sample blogs...');
    for (const blogData of sampleBlogs) {
      const blog = await Blog.create(blogData);
      console.log(`  ✅ Created blog: "${blog.title}"`);
    }
    
    console.log('📅 Creating sample events...');
    for (const eventData of sampleEvents) {
      const event = await Event.create(eventData);
      console.log(`  ✅ Created event: "${event.title}"`);
    }
    
    console.log('🎤 Creating sample sermons...');
    for (const sermonData of sampleSermons) {
      const sermon = await Sermon.create(sermonData);
      console.log(`  ✅ Created sermon: "${sermon.title}"`);
    }
    
    console.log('✅ Sample data created successfully!');
    console.log('🚀 Your MongoDB database is now ready with sample content');
    
  } catch (error) {
    console.error('❌ Failed to create sample data:', error.message);
    throw error;
  } finally {
    await closeDatabase();
  }
}

// Run setup if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--sample')) {
    createSampleData();
  } else {
    setupDatabase();
  }
}

module.exports = { setupDatabase, createSampleData };
