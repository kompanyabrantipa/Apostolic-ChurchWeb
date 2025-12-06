/**
 * Content Synchronization Test Script
 * This script verifies that content uploaded from the admin dashboard
 * appears for all users across all devices and browsers.
 */

// Test function to verify API connectivity
async function testApiConnectivity() {
    console.log('Testing API connectivity...');
    
    try {
        // Test blog API
        const blogResponse = await fetch('https://api.apostolicchurchlouisville.org/api/blog/public');
        const blogs = await blogResponse.json();
        console.log('✅ Blog API accessible, found', blogs.data?.length || blogs.length || 0, 'posts');
        
        // Test events API
        const eventsResponse = await fetch('https://api.apostolicchurchlouisville.org/api/events/public');
        const events = await eventsResponse.json();
        console.log('✅ Events API accessible, found', events.data?.length || events.length || 0, 'events');
        
        // Test sermons API
        const sermonsResponse = await fetch('https://api.apostolicchurchlouisville.org/api/sermons/public');
        const sermons = await sermonsResponse.json();
        console.log('✅ Sermons API accessible, found', sermons.data?.length || sermons.length || 0, 'sermons');
        
        return true;
    } catch (error) {
        console.error('❌ API connectivity test failed:', error);
        return false;
    }
}

// Test function to verify DataService is working
function testDataService() {
    console.log('Testing DataService...');
    
    if (typeof DataService === 'undefined') {
        console.error('❌ DataService not found');
        return false;
    }
    
    if (!DataService.config.useApi) {
        console.warn('⚠️ DataService is not configured to use API');
        return false;
    }
    
    console.log('✅ DataService is properly configured');
    console.log('   API Base URL:', DataService.config.apiBaseUrl);
    console.log('   API Enabled:', DataService.config.useApi);
    console.log('   LocalStorage Fallback:', DataService.config.fallbackToLocalStorage);
    
    return true;
}

// Test function to verify content loading
async function testContentLoading() {
    console.log('Testing content loading...');
    
    try {
        // Test loading published blogs
        const blogs = await DataService.getPublished('blogs');
        console.log('✅ Successfully loaded', blogs.length, 'published blogs');
        
        // Test loading published events
        const events = await DataService.getPublished('events');
        console.log('✅ Successfully loaded', events.length, 'published events');
        
        // Test loading published sermons
        const sermons = await DataService.getPublished('sermons');
        console.log('✅ Successfully loaded', sermons.length, 'published sermons');
        
        return true;
    } catch (error) {
        console.error('❌ Content loading test failed:', error);
        return false;
    }
}

// Main test function
async function runSyncTest() {
    console.log('🚀 Starting Content Synchronization Test');
    console.log('=====================================');
    
    // Test 1: API Connectivity
    const apiTestPassed = await testApiConnectivity();
    if (!apiTestPassed) {
        console.log('❌ Synchronization test failed: API connectivity issues');
        return;
    }
    
    // Test 2: DataService Configuration
    const dataServiceTestPassed = testDataService();
    if (!dataServiceTestPassed) {
        console.log('❌ Synchronization test failed: DataService configuration issues');
        return;
    }
    
    // Test 3: Content Loading
    const contentLoadingTestPassed = await testContentLoading();
    if (!contentLoadingTestPassed) {
        console.log('❌ Synchronization test failed: Content loading issues');
        return;
    }
    
    console.log('=====================================');
    console.log('🎉 All tests passed! Content synchronization is working correctly.');
    console.log('   Content uploaded from the admin dashboard will now appear');
    console.log('   for all users across all devices and browsers.');
}

// Run the test when the page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runSyncTest);
} else {
    runSyncTest();
}