const { connectDatabase, closeDatabase } = require('../config/database-mongodb');
const Blog = require('../models-mongodb/Blog');
const Event = require('../models-mongodb/Event');
const Sermon = require('../models-mongodb/Sermon');

async function clearSampleData() {
  console.log('🧹 Clearing existing sample data from MongoDB...');
  
  try {
    await connectDatabase();
    
    // Delete all existing sample data (both old and new patterns)
    const blogResult = await Blog.deleteMany({
      $or: [
        { id: { $regex: /^mongodb-sample-/ } },
        { imageUrl: { $regex: /blog-placeholder\.jpg$/ } },
        { category: "Faith & Technology" },
        { title: { $regex: /MongoDB/ } }
      ]
    });

    const eventResult = await Event.deleteMany({
      $or: [
        { id: { $regex: /^mongodb-sample-/ } },
        { imageUrl: { $regex: /event-placeholder\.jpg$/ } },
        { title: { $regex: /Technology & Faith/ } }
      ]
    });

    const sermonResult = await Sermon.deleteMany({
      $or: [
        { id: { $regex: /^mongodb-sample-/ } },
        { thumbnailUrl: { $regex: /sermon-placeholder\.jpg$/ } },
        { videoUrl: { $regex: /example\.com/ } }
      ]
    });
    
    console.log(`✅ Cleared ${blogResult.deletedCount} sample blogs`);
    console.log(`✅ Cleared ${eventResult.deletedCount} sample events`);
    console.log(`✅ Cleared ${sermonResult.deletedCount} sample sermons`);
    
    console.log('🎉 Sample data cleared successfully!');
    
  } catch (error) {
    console.error('❌ Failed to clear sample data:', error.message);
    throw error;
  } finally {
    await closeDatabase();
  }
}

if (require.main === module) {
  clearSampleData();
}

module.exports = { clearSampleData };
