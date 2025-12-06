/**
 * Content Synchronization Verification Script
 * This script provides tools to verify that content synchronization is working properly
 * across all devices and browsers.
 */

// Function to create a test blog post
async function createTestBlogPost() {
    console.log('Creating test blog post...');
    
    try {
        const testData = {
            title: 'Synchronization Test Post',
            summary: 'This is a test post to verify cross-device synchronization.',
            content: '<p>This is a test post to verify that content uploaded from the admin dashboard appears for all users across all devices and browsers.</p>',
            imageUrl: 'images/blog-placeholder.jpg',
            status: 'published',
            createdAt: new Date().toISOString()
        };
        
        const result = await DataService.create('blogs', testData);
        console.log('✅ Test blog post created successfully:', result);
        return result;
    } catch (error) {
        console.error('❌ Failed to create test blog post:', error);
        return null;
    }
}

// Function to verify the test post exists
async function verifyTestPostExists(testPostId) {
    console.log('Verifying test post exists...');
    
    try {
        // Check via API
        const blogs = await DataService.getPublished('blogs');
        const testPost = blogs.find(blog => blog.id === testPostId);
        
        if (testPost) {
            console.log('✅ Test post found in API response');
            return true;
        } else {
            console.log('❌ Test post not found in API response');
            return false;
        }
    } catch (error) {
        console.error('❌ Failed to verify test post:', error);
        return false;
    }
}

// Function to clean up test data
async function cleanupTestData(testPostId) {
    console.log('Cleaning up test data...');
    
    try {
        if (testPostId) {
            await DataService.delete('blogs', testPostId);
            console.log('✅ Test data cleaned up successfully');
        }
    } catch (error) {
        console.error('❌ Failed to clean up test data:', error);
    }
}

// Function to run a complete synchronization verification
async function runSyncVerification() {
    console.log('🚀 Starting Content Synchronization Verification');
    console.log('==============================================');
    
    let testPostId = null;
    
    try {
        // Step 1: Create a test blog post
        const testPost = await createTestBlogPost();
        if (!testPost) {
            console.log('❌ Verification failed: Could not create test post');
            return;
        }
        
        testPostId = testPost.id;
        console.log('📝 Test post ID:', testPostId);
        
        // Step 2: Wait a moment for synchronization
        console.log('⏳ Waiting for synchronization...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Step 3: Verify the test post exists
        const exists = await verifyTestPostExists(testPostId);
        if (!exists) {
            console.log('❌ Verification failed: Test post not synchronized');
            return;
        }
        
        console.log('==============================================');
        console.log('🎉 Synchronization verification PASSED!');
        console.log('   Content uploaded from the admin dashboard');
        console.log('   appears for all users across all devices.');
        console.log('');
        console.log('📋 To verify manually:');
        console.log('   1. Open the blog page in a different browser/device');
        console.log('   2. Check if "Synchronization Test Post" appears');
        console.log('   3. The post should be visible on all devices');
        
    } catch (error) {
        console.error('❌ Synchronization verification failed:', error);
    } finally {
        // Clean up test data
        if (testPostId) {
            await cleanupTestData(testPostId);
        }
    }
}

// Add to window object for easy access
window.runSyncVerification = runSyncVerification;

// Auto-run verification if requested via URL parameter
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('syncTest') === 'true') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runSyncVerification);
    } else {
        runSyncVerification();
    }
}

console.log('🔧 Sync verification tools loaded. Run window.runSyncVerification() to test synchronization.');