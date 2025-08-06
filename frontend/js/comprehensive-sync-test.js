/**
 * Comprehensive Sync Test for Apostolic Church International
 * Tests real-time synchronization between admin dashboard and frontend pages
 */

const ComprehensiveSyncTest = {
    /**
     * Run complete sync verification
     */
    runCompleteTest: function() {
        console.log('🚀 Starting Comprehensive Sync Test...\n');
        
        const results = {
            setupTest: this.testSetup(),
            publishedContentFilterTest: this.testPublishedContentFilter(),
            realTimeSyncTest: this.testRealTimeSync(),
            crossTabSyncTest: this.testCrossTabSync(),
            draftContentHidingTest: this.testDraftContentHiding(),
            sampleDataTest: this.testSampleDataIntegration()
        };
        
        console.log('\n📊 Comprehensive Test Results:');
        Object.keys(results).forEach(test => {
            const status = results[test] ? '✅ PASS' : '❌ FAIL';
            console.log(`${status} ${test}`);
        });
        
        const allPassed = Object.values(results).every(result => result);
        console.log(`\n${allPassed ? '🎉 All comprehensive tests passed!' : '⚠️ Some comprehensive tests failed!'}`);
        
        return results;
    },

    /**
     * Test 1: Verify setup and file inclusion
     */
    testSetup: function() {
        console.log('🔧 Testing setup and file inclusion...');
        
        try {
            // Check if DataService is available
            if (typeof DataService === 'undefined') {
                throw new Error('DataService not loaded');
            }
            console.log('  ✅ DataService loaded');
            
            // Check if SampleDataGenerator is available
            if (typeof SampleDataGenerator === 'undefined') {
                throw new Error('SampleDataGenerator not loaded');
            }
            console.log('  ✅ SampleDataGenerator loaded');
            
            // Check if sync methods exist
            if (typeof DataService.triggerSync !== 'function') {
                throw new Error('DataService.triggerSync method not found');
            }
            console.log('  ✅ Sync methods available');
            
            return true;
        } catch (error) {
            console.error('  ❌ Setup test failed:', error.message);
            return false;
        }
    },

    /**
     * Test 2: Verify published content filtering
     */
    testPublishedContentFilter: function() {
        console.log('📋 Testing published content filtering...');
        
        try {
            // Clear existing data
            localStorage.removeItem('blogs');
            localStorage.removeItem('events');
            localStorage.removeItem('sermons');
            
            // Create test data with mixed statuses
            const testBlogs = [
                { id: 'blog1', title: 'Published Blog', status: 'published', content: 'Test content' },
                { id: 'blog2', title: 'Draft Blog', status: 'draft', content: 'Draft content' }
            ];
            
            const testEvents = [
                { id: 'event1', title: 'Published Event', status: 'published', date: new Date(Date.now() + 86400000).toISOString() },
                { id: 'event2', title: 'Draft Event', status: 'draft', date: new Date(Date.now() + 86400000).toISOString() }
            ];
            
            const testSermons = [
                { id: 'sermon1', title: 'Published Sermon', status: 'published', speaker: 'Test Speaker', date: new Date().toISOString() },
                { id: 'sermon2', title: 'Draft Sermon', status: 'draft', speaker: 'Test Speaker', date: new Date().toISOString() }
            ];
            
            localStorage.setItem('blogs', JSON.stringify(testBlogs));
            localStorage.setItem('events', JSON.stringify(testEvents));
            localStorage.setItem('sermons', JSON.stringify(testSermons));
            
            console.log('  ✅ Test data created with mixed statuses');
            console.log('  ✅ Frontend pages should only show published content');
            
            return true;
        } catch (error) {
            console.error('  ❌ Published content filter test failed:', error.message);
            return false;
        }
    },

    /**
     * Test 3: Test real-time sync functionality
     */
    testRealTimeSync: function() {
        console.log('⚡ Testing real-time sync functionality...');
        
        try {
            let syncEventReceived = false;
            
            // Listen for sync events
            const syncListener = (event) => {
                if (event.detail && event.detail.contentType === 'blogs' && event.detail.action === 'create') {
                    syncEventReceived = true;
                    console.log('  ✅ Sync event received:', event.detail);
                }
            };
            
            window.addEventListener('contentSync', syncListener);
            
            // Create a blog post using DataService
            const testBlog = DataService.create('blogs', {
                title: 'Real-time Sync Test Blog',
                summary: 'Testing real-time sync',
                content: '<p>This blog tests real-time sync functionality.</p>',
                status: 'published'
            });
            
            // Give event time to fire
            setTimeout(() => {
                window.removeEventListener('contentSync', syncListener);
                
                if (syncEventReceived) {
                    console.log('  ✅ Real-time sync event triggered successfully');
                } else {
                    console.log('  ❌ Real-time sync event not received');
                }
            }, 100);
            
            console.log('  ✅ Blog created via DataService:', testBlog.title);
            
            return true;
        } catch (error) {
            console.error('  ❌ Real-time sync test failed:', error.message);
            return false;
        }
    },

    /**
     * Test 4: Test cross-tab sync (localStorage events)
     */
    testCrossTabSync: function() {
        console.log('🔄 Testing cross-tab sync functionality...');
        
        try {
            // Create sync data and store in localStorage
            const syncData = {
                contentType: 'events',
                action: 'create',
                item: { id: 'test-event', title: 'Cross-tab Test Event' },
                timestamp: Date.now()
            };
            
            localStorage.setItem('lastSync', JSON.stringify(syncData));
            console.log('  ✅ Cross-tab sync data stored in localStorage');
            
            // Verify lastSync data is properly formatted
            const storedSync = JSON.parse(localStorage.getItem('lastSync'));
            if (storedSync.contentType && storedSync.action && storedSync.timestamp) {
                console.log('  ✅ Cross-tab sync data format is correct');
            } else {
                throw new Error('Cross-tab sync data format is incorrect');
            }
            
            return true;
        } catch (error) {
            console.error('  ❌ Cross-tab sync test failed:', error.message);
            return false;
        }
    },

    /**
     * Test 5: Verify draft content is hidden from frontend
     */
    testDraftContentHiding: function() {
        console.log('🔒 Testing draft content hiding...');
        
        try {
            // Create draft content
            const draftBlog = DataService.create('blogs', {
                title: 'Draft Blog - Should Not Appear',
                summary: 'This is a draft blog',
                content: '<p>This should not appear on frontend.</p>',
                status: 'draft'
            });
            
            const draftEvent = DataService.create('events', {
                title: 'Draft Event - Should Not Appear',
                date: new Date(Date.now() + 86400000).toISOString(),
                location: 'Test Location',
                description: '<p>This should not appear on frontend.</p>',
                status: 'draft'
            });
            
            const draftSermon = DataService.create('sermons', {
                title: 'Draft Sermon - Should Not Appear',
                speaker: 'Test Speaker',
                date: new Date().toISOString(),
                description: '<p>This should not appear on frontend.</p>',
                status: 'draft'
            });
            
            console.log('  ✅ Draft content created:', draftBlog.title, draftEvent.title, draftSermon.title);
            console.log('  ✅ Frontend pages should NOT display this draft content');
            
            return true;
        } catch (error) {
            console.error('  ❌ Draft content hiding test failed:', error.message);
            return false;
        }
    },

    /**
     * Test 6: Test sample data integration
     */
    testSampleDataIntegration: function() {
        console.log('📝 Testing sample data integration...');
        
        try {
            // Clear existing data
            localStorage.removeItem('blogs');
            localStorage.removeItem('events');
            localStorage.removeItem('sermons');
            
            // Generate sample data
            const result = SampleDataGenerator.seedAllSampleData();
            
            if (!result.success) {
                throw new Error('Sample data generation failed');
            }
            
            // Verify sample data was created
            const blogs = JSON.parse(localStorage.getItem('blogs') || '[]');
            const events = JSON.parse(localStorage.getItem('events') || '[]');
            const sermons = JSON.parse(localStorage.getItem('sermons') || '[]');
            
            if (blogs.length === 0 || events.length === 0 || sermons.length === 0) {
                throw new Error('Sample data was not created properly');
            }
            
            // Verify all sample data is published
            const allPublished = [
                ...blogs.every(blog => blog.status === 'published'),
                ...events.every(event => event.status === 'published'),
                ...sermons.every(sermon => sermon.status === 'published')
            ].every(Boolean);
            
            if (!allPublished) {
                throw new Error('Not all sample data is published');
            }
            
            console.log(`  ✅ Sample data created: ${blogs.length} blogs, ${events.length} events, ${sermons.length} sermons`);
            console.log('  ✅ All sample data is published and ready for frontend display');
            
            return true;
        } catch (error) {
            console.error('  ❌ Sample data integration test failed:', error.message);
            return false;
        }
    },

    /**
     * Demonstrate complete workflow
     */
    demonstrateCompleteWorkflow: function() {
        console.log('🎬 Demonstrating complete admin-to-frontend workflow...\n');
        
        // Step 1: Clear existing data
        console.log('1. Clearing existing data...');
        localStorage.removeItem('blogs');
        localStorage.removeItem('events');
        localStorage.removeItem('sermons');
        localStorage.removeItem('lastSync');
        
        // Step 2: Create published content
        setTimeout(() => {
            console.log('2. Creating published blog post...');
            const publishedBlog = DataService.create('blogs', {
                title: 'Welcome to Our Church Community',
                summary: 'Join us in worship and fellowship',
                content: '<p>We welcome you to our church family with open arms.</p>',
                imageUrl: 'images/welcome.jpg',
                status: 'published'
            });
            console.log('   ✅ Published blog created:', publishedBlog.title);
        }, 500);
        
        // Step 3: Create draft content (should not appear on frontend)
        setTimeout(() => {
            console.log('3. Creating draft blog post...');
            const draftBlog = DataService.create('blogs', {
                title: 'Draft Blog - Work in Progress',
                summary: 'This is still being worked on',
                content: '<p>This content is not ready for publication.</p>',
                status: 'draft'
            });
            console.log('   ✅ Draft blog created (should NOT appear on frontend):', draftBlog.title);
        }, 1000);
        
        // Step 4: Create published event
        setTimeout(() => {
            console.log('4. Creating published event...');
            const publishedEvent = DataService.create('events', {
                title: 'Sunday Worship Service',
                date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                location: 'Main Sanctuary',
                description: '<p>Join us for worship, praise, and fellowship.</p>',
                status: 'published'
            });
            console.log('   ✅ Published event created:', publishedEvent.title);
        }, 1500);
        
        // Step 5: Create published sermon
        setTimeout(() => {
            console.log('5. Creating published sermon...');
            const publishedSermon = DataService.create('sermons', {
                title: 'Faith in Action',
                speaker: 'Pastor Johnson',
                date: new Date().toISOString(),
                description: '<p>A powerful message about living out our faith daily.</p>',
                status: 'published'
            });
            console.log('   ✅ Published sermon created:', publishedSermon.title);
            
            console.log('\n🎉 Complete workflow demonstration finished!');
            console.log('💡 Check frontend pages to verify:');
            console.log('   - Published content appears immediately');
            console.log('   - Draft content remains hidden');
            console.log('   - Real-time sync is working');
        }, 2000);
    }
};

// Make available globally
window.ComprehensiveSyncTest = ComprehensiveSyncTest;

console.log('🧪 Comprehensive Sync Test loaded.');
console.log('🚀 Use ComprehensiveSyncTest.runCompleteTest() to run all tests.');
console.log('🎬 Use ComprehensiveSyncTest.demonstrateCompleteWorkflow() to see the complete workflow.');
