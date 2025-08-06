const fs = require('fs');
const path = require('path');
const { query, testConnection, closePool } = require('../config/database');
const Blog = require('../models/Blog');
const Event = require('../models/Event');
const Sermon = require('../models/Sermon');

// This script migrates data from localStorage JSON files to PostgreSQL database
// It expects localStorage data to be exported to JSON files in the migration-data directory

async function migrateFromLocalStorage() {
  console.log('🚀 Starting localStorage to PostgreSQL migration...');
  
  try {
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }
    
    // Create migration-data directory if it doesn't exist
    const migrationDataDir = path.join(__dirname, '..', 'migration-data');
    if (!fs.existsSync(migrationDataDir)) {
      fs.mkdirSync(migrationDataDir, { recursive: true });
      console.log('📁 Created migration-data directory');
      console.log('💡 Please export your localStorage data to JSON files in this directory:');
      console.log(`   - ${path.join(migrationDataDir, 'blogs.json')}`);
      console.log(`   - ${path.join(migrationDataDir, 'events.json')}`);
      console.log(`   - ${path.join(migrationDataDir, 'sermons.json')}`);
      console.log('');
      console.log('📝 To export localStorage data, run this in your browser console:');
      console.log('   // Export blogs');
      console.log('   console.log(JSON.stringify(JSON.parse(localStorage.getItem("blogs") || "[]"), null, 2));');
      console.log('   // Export events');
      console.log('   console.log(JSON.stringify(JSON.parse(localStorage.getItem("events") || "[]"), null, 2));');
      console.log('   // Export sermons');
      console.log('   console.log(JSON.stringify(JSON.parse(localStorage.getItem("sermons") || "[]"), null, 2));');
      return;
    }
    
    let totalMigrated = 0;
    
    // Migrate blogs
    const blogsFile = path.join(migrationDataDir, 'blogs.json');
    if (fs.existsSync(blogsFile)) {
      console.log('📚 Migrating blogs...');
      const blogsData = JSON.parse(fs.readFileSync(blogsFile, 'utf8'));
      
      for (const blogData of blogsData) {
        try {
          // Check if blog already exists
          const existing = await Blog.getById(blogData.id);
          if (existing) {
            console.log(`⚠️ Blog "${blogData.title}" already exists, skipping...`);
            continue;
          }
          
          // Create blog in database
          const blog = await Blog.create({
            id: blogData.id,
            title: blogData.title,
            summary: blogData.summary || '',
            content: blogData.content || '',
            imageUrl: blogData.imageUrl || '',
            status: blogData.status || 'draft',
            author: blogData.author || 'Church Staff',
            category: blogData.category || 'Faith',
            comments: blogData.comments || 0
          });
          
          console.log(`✅ Migrated blog: "${blog.title}"`);
          totalMigrated++;
          
        } catch (error) {
          console.error(`❌ Failed to migrate blog "${blogData.title}":`, error.message);
        }
      }
      
      console.log(`📚 Blogs migration completed: ${blogsData.length} processed`);
    } else {
      console.log('📚 No blogs.json file found, skipping blogs migration');
    }
    
    // Migrate events
    const eventsFile = path.join(migrationDataDir, 'events.json');
    if (fs.existsSync(eventsFile)) {
      console.log('📅 Migrating events...');
      const eventsData = JSON.parse(fs.readFileSync(eventsFile, 'utf8'));
      
      for (const eventData of eventsData) {
        try {
          // Check if event already exists
          const existing = await Event.getById(eventData.id);
          if (existing) {
            console.log(`⚠️ Event "${eventData.title}" already exists, skipping...`);
            continue;
          }
          
          // Create event in database
          const event = await Event.create({
            id: eventData.id,
            title: eventData.title,
            date: eventData.date,
            location: eventData.location || '',
            description: eventData.description || '',
            imageUrl: eventData.imageUrl || '',
            status: eventData.status || 'draft'
          });
          
          console.log(`✅ Migrated event: "${event.title}"`);
          totalMigrated++;
          
        } catch (error) {
          console.error(`❌ Failed to migrate event "${eventData.title}":`, error.message);
        }
      }
      
      console.log(`📅 Events migration completed: ${eventsData.length} processed`);
    } else {
      console.log('📅 No events.json file found, skipping events migration');
    }
    
    // Migrate sermons
    const sermonsFile = path.join(migrationDataDir, 'sermons.json');
    if (fs.existsSync(sermonsFile)) {
      console.log('🎤 Migrating sermons...');
      const sermonsData = JSON.parse(fs.readFileSync(sermonsFile, 'utf8'));
      
      for (const sermonData of sermonsData) {
        try {
          // Check if sermon already exists
          const existing = await Sermon.getById(sermonData.id);
          if (existing) {
            console.log(`⚠️ Sermon "${sermonData.title}" already exists, skipping...`);
            continue;
          }
          
          // Create sermon in database
          const sermon = await Sermon.create({
            id: sermonData.id,
            title: sermonData.title,
            speaker: sermonData.speaker,
            date: sermonData.date,
            description: sermonData.description || '',
            videoUrl: sermonData.videoUrl || '',
            audioUrl: sermonData.audioUrl || '',
            thumbnailUrl: sermonData.thumbnailUrl || '',
            status: sermonData.status || 'draft'
          });
          
          console.log(`✅ Migrated sermon: "${sermon.title}"`);
          totalMigrated++;
          
        } catch (error) {
          console.error(`❌ Failed to migrate sermon "${sermonData.title}":`, error.message);
        }
      }
      
      console.log(`🎤 Sermons migration completed: ${sermonsData.length} processed`);
    } else {
      console.log('🎤 No sermons.json file found, skipping sermons migration');
    }
    
    // Migration summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Migration completed successfully!');
    console.log(`📊 Total items migrated: ${totalMigrated}`);
    
    // Get final counts
    const [blogCount, eventCount, sermonCount] = await Promise.all([
      Blog.getCount(),
      Event.getCount(),
      Sermon.getCount()
    ]);
    
    console.log('📈 Database contents:');
    console.log(`   - Blogs: ${blogCount}`);
    console.log(`   - Events: ${eventCount}`);
    console.log(`   - Sermons: ${sermonCount}`);
    console.log(`   - Total: ${blogCount + eventCount + sermonCount}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (totalMigrated > 0) {
      console.log('✅ Your localStorage data has been successfully migrated to PostgreSQL!');
      console.log('🔄 Next steps:');
      console.log('   1. Update your DataService to use API endpoints');
      console.log('   2. Test the dashboard and frontend functionality');
      console.log('   3. Verify real-time synchronization is working');
    } else {
      console.log('ℹ️ No new data was migrated (all items already exist or no data files found)');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await closePool();
  }
}

// Helper function to create sample migration data for testing
async function createSampleMigrationData() {
  console.log('🎬 Creating sample migration data for testing...');
  
  const migrationDataDir = path.join(__dirname, '..', 'migration-data');
  if (!fs.existsSync(migrationDataDir)) {
    fs.mkdirSync(migrationDataDir, { recursive: true });
  }
  
  // Sample blogs data
  const sampleBlogs = [
    {
      id: "sample-blog-1",
      title: "Welcome to Our Church Community",
      summary: "Join us as we explore faith, fellowship, and service together.",
      content: "<p>Welcome to Apostolic Church International! We are excited to have you join our growing community of believers.</p><p>Our church is built on the foundation of love, faith, and service to others. Whether you're new to faith or have been walking with God for years, you'll find a home here.</p>",
      imageUrl: "images/blog-placeholder.jpg",
      status: "published",
      author: "Pastor Johnson",
      category: "Welcome",
      comments: 0,
      createdAt: new Date().toISOString()
    },
    {
      id: "sample-blog-2",
      title: "The Power of Prayer in Daily Life",
      summary: "Discover how prayer can transform your everyday experiences.",
      content: "<p>Prayer is not just a religious ritual—it's a powerful tool for transformation and connection with God.</p><p>In this post, we'll explore practical ways to incorporate prayer into your daily routine and experience its life-changing effects.</p>",
      imageUrl: "images/blog-placeholder.jpg",
      status: "published",
      author: "Church Staff",
      category: "Faith",
      comments: 0,
      createdAt: new Date().toISOString()
    }
  ];
  
  // Sample events data
  const sampleEvents = [
    {
      id: "sample-event-1",
      title: "Sunday Worship Service",
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Next week
      location: "Main Sanctuary",
      description: "<p>Join us for our weekly worship service featuring inspiring music, fellowship, and a powerful message from God's Word.</p>",
      imageUrl: "images/event-placeholder.jpg",
      status: "published",
      createdAt: new Date().toISOString()
    },
    {
      id: "sample-event-2",
      title: "Community Outreach Program",
      date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // Two weeks from now
      location: "Community Center",
      description: "<p>Help us serve our local community through food distribution, clothing drive, and fellowship activities.</p>",
      imageUrl: "images/event-placeholder.jpg",
      status: "published",
      createdAt: new Date().toISOString()
    }
  ];
  
  // Sample sermons data
  const sampleSermons = [
    {
      id: "sample-sermon-1",
      title: "Walking in Faith",
      speaker: "Pastor Johnson",
      date: new Date().toISOString(),
      description: "<p>A powerful message about trusting God's plan even when we can't see the full picture.</p>",
      videoUrl: "https://example.com/sermon1",
      audioUrl: "https://example.com/sermon1-audio",
      thumbnailUrl: "images/sermon-placeholder.jpg",
      status: "published",
      createdAt: new Date().toISOString()
    },
    {
      id: "sample-sermon-2",
      title: "Love in Action",
      speaker: "Pastor Smith",
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Last week
      description: "<p>Exploring how we can demonstrate God's love through our actions and service to others.</p>",
      videoUrl: "https://example.com/sermon2",
      audioUrl: "https://example.com/sermon2-audio",
      thumbnailUrl: "images/sermon-placeholder.jpg",
      status: "published",
      createdAt: new Date().toISOString()
    }
  ];
  
  // Write sample data to files
  fs.writeFileSync(path.join(migrationDataDir, 'blogs.json'), JSON.stringify(sampleBlogs, null, 2));
  fs.writeFileSync(path.join(migrationDataDir, 'events.json'), JSON.stringify(sampleEvents, null, 2));
  fs.writeFileSync(path.join(migrationDataDir, 'sermons.json'), JSON.stringify(sampleSermons, null, 2));
  
  console.log('✅ Sample migration data created successfully!');
  console.log(`📁 Files created in: ${migrationDataDir}`);
  console.log('   - blogs.json (2 sample blogs)');
  console.log('   - events.json (2 sample events)');
  console.log('   - sermons.json (2 sample sermons)');
  console.log('');
  console.log('🚀 Now run "npm run migrate" to migrate this sample data to the database');
}

// Run migration if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--sample')) {
    createSampleMigrationData();
  } else {
    migrateFromLocalStorage();
  }
}

module.exports = { migrateFromLocalStorage, createSampleMigrationData };
