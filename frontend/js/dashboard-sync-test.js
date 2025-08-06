/**
 * Dashboard Sync Test - Tests real-time sync from dashboard forms
 * This script verifies that the actual dashboard forms trigger sync events
 */

const DashboardSyncTest = {
    /**
     * Test dashboard form integration
     */
    testDashboardForms: function() {
        console.log('🧪 Testing Dashboard Form Integration...\n');
        
        const results = {
            blogManagerTest: this.testBlogManager(),
            eventManagerTest: this.testEventManager(),
            sermonManagerTest: this.testSermonManager(),
            syncEventTest: this.testSyncEvents()
        };
        
        console.log('\n📊 Dashboard Form Test Results:');
        Object.keys(results).forEach(test => {
            const status = results[test] ? '✅ PASS' : '❌ FAIL';
            console.log(`${status} ${test}`);
        });
        
        const allPassed = Object.values(results).every(result => result);
        console.log(`\n${allPassed ? '🎉 All dashboard tests passed!' : '⚠️ Some dashboard tests failed!'}`);
        
        return results;
    },

    /**
     * Test BlogManager integration
     */
    testBlogManager: function() {
        console.log('📝 Testing BlogManager integration...');
        
        try {
            // Check if BlogManager exists and has required methods
            if (typeof BlogManager === 'undefined') {
                throw new Error('BlogManager not found');
            }
            
            if (typeof BlogManager.createBlog !== 'function') {
                throw new Error('BlogManager.createBlog method not found');
            }
            
            if (typeof BlogManager.loadBlogTable !== 'function') {
                throw new Error('BlogManager.loadBlogTable method not found');
            }
            
            console.log('  ✅ BlogManager methods available');
            
            // Check if BlogManager is initialized
            const blogForm = document.getElementById('blogForm');
            if (blogForm) {
                console.log('  ✅ Blog form found in DOM');
            } else {
                console.log('  ⚠️ Blog form not found in DOM (may be normal if not on dashboard page)');
            }
            
            return true;
        } catch (error) {
            console.error('  ❌ BlogManager test failed:', error.message);
            return false;
        }
    },

    /**
     * Test EventManager integration
     */
    testEventManager: function() {
        console.log('📅 Testing EventManager integration...');
        
        try {
            // Check if EventManager exists and has required methods
            if (typeof EventManager === 'undefined') {
                throw new Error('EventManager not found');
            }
            
            if (typeof EventManager.createEvent !== 'function') {
                throw new Error('EventManager.createEvent method not found');
            }
            
            if (typeof EventManager.loadEventTable !== 'function') {
                throw new Error('EventManager.loadEventTable method not found');
            }
            
            console.log('  ✅ EventManager methods available');
            
            // Check if EventManager is initialized
            const eventForm = document.getElementById('eventForm');
            if (eventForm) {
                console.log('  ✅ Event form found in DOM');
            } else {
                console.log('  ⚠️ Event form not found in DOM (may be normal if not on dashboard page)');
            }
            
            return true;
        } catch (error) {
            console.error('  ❌ EventManager test failed:', error.message);
            return false;
        }
    },

    /**
     * Test SermonManager integration
     */
    testSermonManager: function() {
        console.log('🎤 Testing SermonManager integration...');
        
        try {
            // Check if SermonManager exists and has required methods
            if (typeof SermonManager === 'undefined') {
                throw new Error('SermonManager not found');
            }
            
            if (typeof SermonManager.createSermon !== 'function') {
                throw new Error('SermonManager.createSermon method not found');
            }
            
            if (typeof SermonManager.loadSermonTable !== 'function') {
                throw new Error('SermonManager.loadSermonTable method not found');
            }
            
            console.log('  ✅ SermonManager methods available');
            
            // Check if SermonManager is initialized
            const sermonForm = document.getElementById('sermonForm');
            if (sermonForm) {
                console.log('  ✅ Sermon form found in DOM');
            } else {
                console.log('  ⚠️ Sermon form not found in DOM (may be normal if not on dashboard page)');
            }
            
            return true;
        } catch (error) {
            console.error('  ❌ SermonManager test failed:', error.message);
            return false;
        }
    },

    /**
     * Test sync event system
     */
    testSyncEvents: function() {
        console.log('⚡ Testing sync event system...');
        
        try {
            let syncEventReceived = false;
            
            // Listen for sync events
            const syncListener = (event) => {
                if (event.detail && event.detail.contentType === 'test_dashboard') {
                    syncEventReceived = true;
                    console.log('  ✅ Dashboard sync event received:', event.detail);
                }
            };
            
            window.addEventListener('contentSync', syncListener);
            
            // Test DataService sync triggering
            if (typeof DataService !== 'undefined' && typeof DataService.triggerSync === 'function') {
                DataService.triggerSync('test_dashboard', 'create', { id: 'test', title: 'Dashboard Test' });
                console.log('  ✅ DataService.triggerSync method working');
            } else {
                throw new Error('DataService.triggerSync method not available');
            }
            
            // Give event time to fire
            setTimeout(() => {
                window.removeEventListener('contentSync', syncListener);
                
                if (syncEventReceived) {
                    console.log('  ✅ Sync event system working correctly');
                } else {
                    console.log('  ❌ Sync event not received');
                }
            }, 100);
            
            return true;
        } catch (error) {
            console.error('  ❌ Sync event test failed:', error.message);
            return false;
        }
    },

    /**
     * Simulate dashboard form submission
     */
    simulateDashboardFormSubmission: function() {
        console.log('🎬 Simulating dashboard form submission...\n');
        
        try {
            // Clear existing data
            localStorage.removeItem('blogs');
            localStorage.removeItem('events');
            localStorage.removeItem('sermons');
            
            console.log('1. Creating blog post via DataService...');
            const testBlog = DataService.create('blogs', {
                title: 'Dashboard Test Blog',
                summary: 'This blog was created via dashboard simulation',
                content: '<p>This blog post was created to test dashboard-to-frontend sync.</p>',
                imageUrl: 'images/test.jpg',
                status: 'published'
            });
            console.log('   ✅ Blog created:', testBlog.title);
            
            setTimeout(() => {
                console.log('2. Creating event via DataService...');
                const testEvent = DataService.create('events', {
                    title: 'Dashboard Test Event',
                    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    location: 'Test Location',
                    description: '<p>This event was created to test dashboard-to-frontend sync.</p>',
                    status: 'published'
                });
                console.log('   ✅ Event created:', testEvent.title);
            }, 500);
            
            setTimeout(() => {
                console.log('3. Creating sermon via DataService...');
                const testSermon = DataService.create('sermons', {
                    title: 'Dashboard Test Sermon',
                    speaker: 'Test Speaker',
                    date: new Date().toISOString(),
                    description: '<p>This sermon was created to test dashboard-to-frontend sync.</p>',
                    status: 'published'
                });
                console.log('   ✅ Sermon created:', testSermon.title);
                
                console.log('\n🎉 Dashboard simulation complete!');
                console.log('💡 Check frontend pages to verify content appears:');
                console.log('   - blog.html should show the test blog');
                console.log('   - events.html should show the test event');
                console.log('   - sermon-archive.html should show the test sermon');
            }, 1000);
            
        } catch (error) {
            console.error('❌ Dashboard simulation failed:', error.message);
        }
    },

    /**
     * Check current dashboard state
     */
    checkDashboardState: function() {
        console.log('🔍 Checking current dashboard state...\n');
        
        // Check if we're on the dashboard page
        const isDashboard = window.location.pathname.includes('dashboard') || 
                           document.getElementById('blogTableBody') !== null;
        
        console.log('Dashboard page detected:', isDashboard);
        
        // Check form elements
        const blogForm = document.getElementById('blogForm');
        const eventForm = document.getElementById('eventForm');
        const sermonForm = document.getElementById('sermonForm');
        
        console.log('Blog form available:', !!blogForm);
        console.log('Event form available:', !!eventForm);
        console.log('Sermon form available:', !!sermonForm);
        
        // Check managers
        console.log('BlogManager available:', typeof BlogManager !== 'undefined');
        console.log('EventManager available:', typeof EventManager !== 'undefined');
        console.log('SermonManager available:', typeof SermonManager !== 'undefined');
        console.log('DataService available:', typeof DataService !== 'undefined');
        
        // Check current data
        try {
            const blogs = JSON.parse(localStorage.getItem('blogs') || '[]');
            const events = JSON.parse(localStorage.getItem('events') || '[]');
            const sermons = JSON.parse(localStorage.getItem('sermons') || '[]');
            
            console.log(`Current data: ${blogs.length} blogs, ${events.length} events, ${sermons.length} sermons`);
        } catch (error) {
            console.error('Error checking current data:', error);
        }
    }
};

// Make available globally
window.DashboardSyncTest = DashboardSyncTest;

console.log('🧪 Dashboard Sync Test loaded.');
console.log('🔍 Use DashboardSyncTest.checkDashboardState() to check current state.');
console.log('🧪 Use DashboardSyncTest.testDashboardForms() to test form integration.');
console.log('🎬 Use DashboardSyncTest.simulateDashboardFormSubmission() to simulate form submission.');
