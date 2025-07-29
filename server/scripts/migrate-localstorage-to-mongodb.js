const fs = require('fs');
const path = require('path');
const { connectDatabase, testConnection, closeDatabase } = require('../config/database-mongodb');
const Blog = require('../models-mongodb/Blog');
const Event = require('../models-mongodb/Event');
const Sermon = require('../models-mongodb/Sermon');

// This script migrates data from localStorage JSON files to MongoDB database
// It expects localStorage data to be exported to JSON files in the migration-data directory

async function migrateFromLocalStorage() {
  console.log('🚀 Starting localStorage to MongoDB migration...');
  
  try {
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      throw new Error('MongoDB connection failed');
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
          
          // Create blog in MongoDB using the same ID from localStorage
          const blog = await Blog.create({
            id: blogData.id, // Preserve original ID
            title: blogData.title,
            summary: blogData.summary || '',
            content: blogData.content || '',
            imageUrl: blogData.imageUrl || '',
            status: blogData.status || 'draft',
            author: blogData.author || 'Church Staff',
            category: blogData.category || 'Faith',
            comments: blogData.comments || 0
          });
          
          console.log(`✅ Migrated blog: "${blog.title}" (ID: ${blog._id})`);
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
          
          // Create event in MongoDB using the same ID from localStorage
          const event = await Event.create({
            id: eventData.id, // Preserve original ID
            title: eventData.title,
            date: eventData.date,
            location: eventData.location || '',
            description: eventData.description || '',
            imageUrl: eventData.imageUrl || '',
            status: eventData.status || 'draft'
          });
          
          console.log(`✅ Migrated event: "${event.title}" (ID: ${event._id})`);
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
          
          // Create sermon in MongoDB using the same ID from localStorage
          const sermon = await Sermon.create({
            id: sermonData.id, // Preserve original ID
            title: sermonData.title,
            speaker: sermonData.speaker,
            date: sermonData.date,
            description: sermonData.description || '',
            videoUrl: sermonData.videoUrl || '',
            audioUrl: sermonData.audioUrl || '',
            thumbnailUrl: sermonData.thumbnailUrl || '',
            status: sermonData.status || 'draft'
          });
          
          console.log(`✅ Migrated sermon: "${sermon.title}" (ID: ${sermon._id})`);
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
    
    console.log('📈 MongoDB database contents:');
    console.log(`   - Blogs: ${blogCount}`);
    console.log(`   - Events: ${eventCount}`);
    console.log(`   - Sermons: ${sermonCount}`);
    console.log(`   - Total: ${blogCount + eventCount + sermonCount}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (totalMigrated > 0) {
      console.log('✅ Your localStorage data has been successfully migrated to MongoDB!');
      console.log('🔄 Next steps:');
      console.log('   1. Update your DataService to use API endpoints');
      console.log('   2. Test the dashboard and frontend functionality');
      console.log('   3. Verify real-time synchronization is working');
      console.log('   4. Consider backing up your MongoDB database');
    } else {
      console.log('ℹ️ No new data was migrated (all items already exist or no data files found)');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

// Helper function to create sample migration data for testing
async function createSampleMigrationData() {
  console.log('🎬 Creating sample migration data for testing...');
  
  const migrationDataDir = path.join(__dirname, '..', 'migration-data');
  if (!fs.existsSync(migrationDataDir)) {
    fs.mkdirSync(migrationDataDir, { recursive: true });
  }
  
  // Sample blogs data (matching localStorage structure)
  const sampleBlogs = [
    {
      id: "welcome-to-apostolic-church-2024",
      title: "Welcome to Apostolic Church International",
      summary: "Discover our mission to spread God's love and build a strong community of faith.",
      content: "<p>Welcome to Apostolic Church International! We are a vibrant community of believers dedicated to worshiping God, growing in faith, and serving our community with love and compassion.</p><p>Our church family is built on the foundation of God's Word, where every person is valued and welcomed. Whether you're new to faith or have been walking with Christ for years, you'll find a home here.</p><p>Join us every Sunday at 10:00 AM for worship, fellowship, and powerful messages that will strengthen your faith and inspire your daily walk with God.</p>",
      imageUrl: "/images/church-welcome.jpg",
      status: "published",
      author: "Pastor Michael Johnson",
      category: "Welcome",
      comments: 0,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "power-of-prayer-in-daily-life",
      title: "The Power of Prayer in Daily Life",
      summary: "Discover how prayer transforms our relationship with God and strengthens our faith journey.",
      content: "<p>Prayer is not just a religious duty—it's a powerful conversation with our Heavenly Father that transforms our hearts and circumstances. In our busy world, taking time to pray can seem challenging, but it's essential for spiritual growth.</p><p>Through prayer, we find peace in troubled times, wisdom for difficult decisions, and strength to face life's challenges. God invites us to bring everything to Him—our joys, concerns, hopes, and fears.</p><p>This week, we encourage you to set aside dedicated time each day for prayer. Start with just 10 minutes of quiet conversation with God, and watch how it transforms your perspective and strengthens your faith.</p>",
      imageUrl: "/images/prayer-hands.jpg",
      status: "published",
      author: "Pastor Sarah Williams",
      category: "Faith & Prayer",
      comments: 0,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "community-outreach-impact-2024",
      title: "Making a Difference: Our Community Outreach Impact",
      summary: "See how our church family is serving the community and spreading God's love through action.",
      content: "<p>At Apostolic Church International, we believe faith without works is incomplete. This year, our community outreach programs have touched hundreds of lives through practical demonstrations of God's love.</p><p>Our food pantry has served over 500 families, providing groceries and hope to those facing financial hardship. Our youth mentorship program has paired 30 young people with caring adults who guide them in faith and life skills.</p><p>Additionally, our monthly community clean-up events have beautified local parks and neighborhoods while building relationships with our neighbors. We've also partnered with local schools to provide backpacks and supplies to students in need.</p><p>Join us in making a difference! Contact our outreach coordinator to learn about volunteer opportunities that match your heart and schedule.</p>",
      imageUrl: "/images/community-service.jpg",
      status: "published",
      author: "Deacon Robert Martinez",
      category: "Community Service",
      comments: 0,
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
  
  // Sample events data (matching localStorage structure)
  const sampleEvents = [
    {
      id: "sunday-worship-service-weekly",
      title: "Sunday Worship Service",
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // This Sunday
      location: "Main Sanctuary - 123 Faith Avenue",
      description: "<p>Join us every Sunday at 10:00 AM for an uplifting worship experience filled with contemporary music, heartfelt prayer, and inspiring biblical teaching.</p><p>Our worship team leads us in songs of praise, and Pastor Johnson delivers messages that speak to real-life challenges and victories. Communion is served on the first Sunday of each month.</p><p>Children's ministry is available for ages 2-12, and nursery care is provided for infants and toddlers. Come as you are—all are welcome!</p>",
      imageUrl: "/images/sunday-worship.jpg",
      status: "published",
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "youth-bible-study-wednesday",
      title: "Youth Bible Study & Fellowship",
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // This Wednesday
      location: "Youth Center - Lower Level",
      description: "<p>Calling all teens and young adults (ages 13-25)! Join us every Wednesday at 7:00 PM for dynamic Bible study, engaging discussions, and fun fellowship activities.</p><p>This week we're exploring 'Living with Purpose' - discovering God's unique plan for your life. We'll dive into scripture, share testimonies, and support each other in our faith journey.</p><p>Pizza and refreshments provided! Bring a friend and experience community like never before.</p>",
      imageUrl: "/images/youth-fellowship.jpg",
      status: "published",
      createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "community-food-drive-2024",
      title: "Community Food Drive & Distribution",
      date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // Next weekend
      location: "Church Parking Lot & Fellowship Hall",
      description: "<p>Help us serve our community by participating in our monthly food drive and distribution event. We're collecting non-perishable food items, personal care products, and household essentials for local families in need.</p><p>Drop-off times: Saturday 9:00 AM - 12:00 PM. Distribution begins at 1:00 PM for community members who need assistance.</p><p>Volunteers needed for sorting, packing, and distribution. This is a wonderful opportunity for the whole family to serve together and make a tangible difference in our neighborhood.</p><p>Items most needed: canned goods, pasta, rice, cereal, toiletries, and cleaning supplies.</p>",
      imageUrl: "/images/food-drive.jpg",
      status: "published",
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "marriage-enrichment-retreat-2024",
      title: "Marriage Enrichment Retreat",
      date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), // Three weeks out
      location: "Mountain View Retreat Center",
      description: "<p>Strengthen your marriage and deepen your relationship with this weekend retreat designed for couples at any stage of marriage. Join us for a time of renewal, connection, and spiritual growth.</p><p>The retreat includes interactive workshops on communication, conflict resolution, and building intimacy. You'll also enjoy quiet time together, group discussions with other couples, and inspiring messages about God's design for marriage.</p><p>Registration includes all meals, accommodation, and materials. Childcare arrangements can be made through the church office. Early bird pricing available until next Friday.</p><p>Investment: $150 per couple (scholarships available). Register at the church office or online.</p>",
      imageUrl: "/images/marriage-retreat.jpg",
      status: "published",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
  
  // Sample sermons data (matching localStorage structure)
  const sampleSermons = [
    {
      id: "walking-by-faith-not-sight-2024",
      title: "Walking by Faith, Not by Sight",
      speaker: "Pastor Michael Johnson",
      date: new Date().toISOString(), // This week's sermon
      description: "<p>In times of uncertainty and challenge, God calls us to trust Him completely, even when we can't see the full picture. This powerful message explores 2 Corinthians 5:7 and how we can develop unwavering faith that sustains us through life's storms.</p><p>Discover practical steps to strengthen your faith, overcome doubt, and experience God's peace that surpasses understanding. Learn how biblical heroes like Abraham, Moses, and David walked by faith and how their examples can guide us today.</p><p>Key points: Understanding God's faithfulness, overcoming fear with trust, and finding hope in God's promises.</p>",
      videoUrl: "https://vimeo.com/apostolic-church/walking-by-faith",
      audioUrl: "https://soundcloud.com/apostolic-church/walking-by-faith-audio",
      thumbnailUrl: "/images/walking-by-faith-sermon.jpg",
      status: "published",
      createdAt: new Date().toISOString()
    },
    {
      id: "love-in-action-serving-others-2024",
      title: "Love in Action: Serving Others",
      speaker: "Pastor Sarah Williams",
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Last week
      description: "<p>True love is demonstrated through action, not just words. This inspiring message challenges us to move beyond comfortable Christianity and actively serve those around us, following Christ's example of sacrificial love.</p><p>Explore Jesus' teachings on service, the parable of the Good Samaritan, and practical ways to show God's love in our daily lives. Discover how serving others transforms not only their lives but our own hearts as well.</p><p>Learn about opportunities to serve in our church and community, and find your unique calling to make a difference in the world around you.</p>",
      videoUrl: "https://vimeo.com/apostolic-church/love-in-action",
      audioUrl: "https://soundcloud.com/apostolic-church/love-in-action-audio",
      thumbnailUrl: "/images/love-in-action-sermon.jpg",
      status: "published",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "finding-peace-in-gods-presence-2024",
      title: "Finding Peace in God's Presence",
      speaker: "Pastor Michael Johnson",
      date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // Two weeks ago
      description: "<p>In our fast-paced, anxiety-filled world, God offers us a peace that the world cannot give. This comforting message explores Philippians 4:6-7 and teaches us how to find rest and tranquility in God's loving presence.</p><p>Learn the difference between worldly peace and God's peace, discover the power of prayer and meditation, and understand how worship and gratitude can transform our perspective on life's challenges.</p><p>Practical applications include developing a daily quiet time, practicing biblical meditation, and creating space for God in our busy schedules.</p>",
      videoUrl: "https://vimeo.com/apostolic-church/finding-peace",
      audioUrl: "https://soundcloud.com/apostolic-church/finding-peace-audio",
      thumbnailUrl: "/images/finding-peace-sermon.jpg",
      status: "published",
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "the-power-of-forgiveness-2024",
      title: "The Power of Forgiveness",
      speaker: "Pastor Sarah Williams",
      date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(), // Three weeks ago
      description: "<p>Forgiveness is one of the most challenging yet liberating acts we can perform. This transformative message explores Jesus' teachings on forgiveness and how releasing others from their wrongs against us actually sets us free.</p><p>Discover the difference between forgiveness and reconciliation, learn practical steps to forgive even when it's difficult, and understand how God's forgiveness of us empowers us to forgive others.</p><p>This message includes real-life testimonies of forgiveness and healing, showing how God can restore relationships and bring beauty from ashes.</p>",
      videoUrl: "https://vimeo.com/apostolic-church/power-of-forgiveness",
      audioUrl: "https://soundcloud.com/apostolic-church/power-of-forgiveness-audio",
      thumbnailUrl: "/images/forgiveness-sermon.jpg",
      status: "published",
      createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString()
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
  console.log('🚀 Now run "npm run migrate" to migrate this sample data to MongoDB');
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
