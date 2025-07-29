/**
 * Test Workflow Script
 * This script demonstrates the connection between admin dashboard and front-end
 */

// Function to test the workflow
function testAdminToFrontendWorkflow() {
    console.log('Starting test workflow...');
    
    // Step 1: Create a test blog post
    const testBlog = {
        title: 'Test Blog Post - ' + new Date().toLocaleTimeString(),
        summary: 'This is a test blog post created by the automated test workflow',
        content: '<p>This is a test blog post content. It should appear on the front-end immediately.</p>',
        imageUrl: 'https://via.placeholder.com/800x400?text=Test+Blog+Image',
        status: 'published',
        createdAt: new Date().toISOString()
    };
    
    console.log('Step 1: Creating test blog post...');
    
    // Add to localStorage (simulating admin dashboard action)
    try {
        const blogs = JSON.parse(localStorage.getItem('blogs') || '[]');
        const newBlog = {
            id: 'test-' + Date.now().toString(),
            ...testBlog
        };
        
        blogs.push(newBlog);
        localStorage.setItem('blogs', JSON.stringify(blogs));
        
        // Trigger sync event for real-time update
        const syncEvent = new CustomEvent('contentSync', {
            detail: {
                contentType: 'blogs',
                action: 'add',
                item: newBlog,
                timestamp: new Date().getTime()
            }
        });
        window.dispatchEvent(syncEvent);
        
        // Also update lastSync for cross-tab communication
        localStorage.setItem('lastSync', JSON.stringify({
            contentType: 'blogs',
            action: 'add',
            itemId: newBlog.id,
            timestamp: new Date().getTime()
        }));
        
        console.log('Test blog created successfully:', newBlog);
        console.log('Please check the front-end blog page to verify it appears');
        
        // Step 2: Set up deletion after 10 seconds
        setTimeout(() => {
            console.log('Step 2: Deleting test blog post...');
            
            try {
                const updatedBlogs = JSON.parse(localStorage.getItem('blogs') || '[]');
                const filteredBlogs = updatedBlogs.filter(blog => blog.id !== newBlog.id);
                
                localStorage.setItem('blogs', JSON.stringify(filteredBlogs));
                
                // Trigger sync event for real-time update
                const syncEvent = new CustomEvent('contentSync', {
                    detail: {
                        contentType: 'blogs',
                        action: 'delete',
                        item: newBlog,
                        timestamp: new Date().getTime()
                    }
                });
                window.dispatchEvent(syncEvent);
                
                // Also update lastSync for cross-tab communication
                localStorage.setItem('lastSync', JSON.stringify({
                    contentType: 'blogs',
                    action: 'delete',
                    itemId: newBlog.id,
                    timestamp: new Date().getTime()
                }));
                
                console.log('Test blog deleted successfully');
                console.log('Please check the front-end blog page to verify it was removed');
                
                console.log('Test workflow completed successfully');
            } catch (error) {
                console.error('Error deleting test blog:', error);
            }
        }, 10000);
        
    } catch (error) {
        console.error('Error creating test blog:', error);
    }
}

// Run the test workflow when this script is loaded
// Uncomment the line below to run the test
// testAdminToFrontendWorkflow();

// Function to test all content types
function testAllContentTypes() {
    console.log('Starting comprehensive test workflow for all content types...');
    
    // Test blog post
    const testBlog = {
        id: 'test-blog-' + Date.now().toString(),
        title: 'Test Blog Post - ' + new Date().toLocaleTimeString(),
        summary: 'This is a test blog post created by the automated test workflow',
        content: '<p>This is a test blog post content. It should appear on the front-end immediately.</p>',
        imageUrl: 'https://via.placeholder.com/800x400?text=Test+Blog+Image',
        status: 'published',
        createdAt: new Date().toISOString()
    };
    
    // Test event
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 0, 0, 0);
    
    const testEvent = {
        id: 'test-event-' + Date.now().toString(),
        title: 'Test Event - ' + new Date().toLocaleTimeString(),
        date: tomorrow.toISOString(),
        location: 'Church Main Hall',
        description: '<p>This is a test event created by the automated test workflow.</p>',
        imageUrl: 'https://via.placeholder.com/800x400?text=Test+Event',
        status: 'published',
        createdAt: new Date().toISOString()
    };
    
    // Test sermon
    const testSermon = {
        id: 'test-sermon-' + Date.now().toString(),
        title: 'Test Sermon - ' + new Date().toLocaleTimeString(),
        speaker: 'Test Pastor',
        date: new Date().toISOString(),
        description: 'This is a test sermon created by the automated test workflow.',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        audioUrl: '',
        thumbnailUrl: 'https://via.placeholder.com/400x300?text=Test+Sermon',
        status: 'published',
        createdAt: new Date().toISOString()
    };
    
    // Add all test content to localStorage
    try {
        // Add blog
        const blogs = JSON.parse(localStorage.getItem('blogs') || '[]');
        blogs.push(testBlog);
        localStorage.setItem('blogs', JSON.stringify(blogs));
        
        // Trigger sync event
        window.dispatchEvent(new CustomEvent('contentSync', {
            detail: {
                contentType: 'blogs',
                action: 'add',
                item: testBlog,
                timestamp: new Date().getTime()
            }
        }));
        
        console.log('Test blog created successfully:', testBlog);
        
        // Add event
        const events = JSON.parse(localStorage.getItem('events') || '[]');
        events.push(testEvent);
        localStorage.setItem('events', JSON.stringify(events));
        
        // Trigger sync event
        window.dispatchEvent(new CustomEvent('contentSync', {
            detail: {
                contentType: 'events',
                action: 'add',
                item: testEvent,
                timestamp: new Date().getTime()
            }
        }));
        
        console.log('Test event created successfully:', testEvent);
        
        // Add sermon
        const sermons = JSON.parse(localStorage.getItem('sermons') || '[]');
        sermons.push(testSermon);
        localStorage.setItem('sermons', JSON.stringify(sermons));
        
        // Trigger sync event
        window.dispatchEvent(new CustomEvent('contentSync', {
            detail: {
                contentType: 'sermons',
                action: 'add',
                item: testSermon,
                timestamp: new Date().getTime()
            }
        }));
        
        console.log('Test sermon created successfully:', testSermon);
        
        // Update lastSync for cross-tab communication
        localStorage.setItem('lastSync', JSON.stringify({
            contentType: 'all',
            action: 'add',
            timestamp: new Date().getTime()
        }));
        
        console.log('All test content created successfully');
        console.log('Please check the front-end pages to verify they appear');
        
        // Set up deletion after 15 seconds
        setTimeout(() => {
            console.log('Deleting all test content...');
            
            try {
                // Delete blog
                const updatedBlogs = JSON.parse(localStorage.getItem('blogs') || '[]');
                const filteredBlogs = updatedBlogs.filter(blog => blog.id !== testBlog.id);
                localStorage.setItem('blogs', JSON.stringify(filteredBlogs));
                
                // Trigger sync event
                window.dispatchEvent(new CustomEvent('contentSync', {
                    detail: {
                        contentType: 'blogs',
                        action: 'delete',
                        item: testBlog,
                        timestamp: new Date().getTime()
                    }
                }));
                
                // Delete event
                const updatedEvents = JSON.parse(localStorage.getItem('events') || '[]');
                const filteredEvents = updatedEvents.filter(event => event.id !== testEvent.id);
                localStorage.setItem('events', JSON.stringify(filteredEvents));
                
                // Trigger sync event
                window.dispatchEvent(new CustomEvent('contentSync', {
                    detail: {
                        contentType: 'events',
                        action: 'delete',
                        item: testEvent,
                        timestamp: new Date().getTime()
                    }
                }));
                
                // Delete sermon
                const updatedSermons = JSON.parse(localStorage.getItem('sermons') || '[]');
                const filteredSermons = updatedSermons.filter(sermon => sermon.id !== testSermon.id);
                localStorage.setItem('sermons', JSON.stringify(filteredSermons));
                
                // Trigger sync event
                window.dispatchEvent(new CustomEvent('contentSync', {
                    detail: {
                        contentType: 'sermons',
                        action: 'delete',
                        item: testSermon,
                        timestamp: new Date().getTime()
                    }
                }));
                
                // Update lastSync for cross-tab communication
                localStorage.setItem('lastSync', JSON.stringify({
                    contentType: 'all',
                    action: 'delete',
                    timestamp: new Date().getTime()
                }));
                
                console.log('All test content deleted successfully');
                console.log('Please check the front-end pages to verify they were removed');
                
                console.log('Comprehensive test workflow completed successfully');
            } catch (error) {
                console.error('Error deleting test content:', error);
            }
        }, 15000);
        
    } catch (error) {
        console.error('Error creating test content:', error);
    }
}

// Run the comprehensive test when this script is loaded
// Uncomment the line below to run the comprehensive test
// testAllContentTypes();

// Add a function to verify the sync is working
function verifySyncFunctionality() {
    console.log('Verifying sync functionality...');
    
    // Create a test item
    const testItem = {
        id: 'verify-sync-' + Date.now().toString(),
        title: 'Sync Verification - ' + new Date().toLocaleTimeString(),
        summary: 'This item tests if the sync system is working properly',
        content: '<p>If you can see this content update in real-time, the sync system is working!</p>',
        imageUrl: 'https://via.placeholder.com/800x400?text=Sync+Test',
        status: 'published',
        createdAt: new Date().toISOString()
    };
    
    // Add to localStorage
    const blogs = JSON.parse(localStorage.getItem('blogs') || '[]');
    blogs.push(testItem);
    localStorage.setItem('blogs', JSON.stringify(blogs));
    
    // Trigger sync event
    window.dispatchEvent(new CustomEvent('contentSync', {
        detail: {
            contentType: 'blogs',
            action: 'add',
            item: testItem,
            timestamp: new Date().getTime()
        }
    }));
    
    // Update lastSync for cross-tab communication
    localStorage.setItem('lastSync', JSON.stringify({
        contentType: 'blogs',
        action: 'add',
        itemId: testItem.id,
        timestamp: new Date().getTime()
    }));
    
    console.log('Sync test item created:', testItem);
    console.log('Check the blog page to verify it appears without refreshing');
    
    // Update the item after 5 seconds
    setTimeout(() => {
        console.log('Updating sync test item...');
        
        const updatedBlogs = JSON.parse(localStorage.getItem('blogs') || '[]');
        const index = updatedBlogs.findIndex(blog => blog.id === testItem.id);
        
        if (index !== -1) {
            updatedBlogs[index] = {
                ...updatedBlogs[index],
                title: 'UPDATED: ' + updatedBlogs[index].title,
                summary: 'This item has been updated to verify sync works for updates too',
                updatedAt: new Date().toISOString()
            };
            
            localStorage.setItem('blogs', JSON.stringify(updatedBlogs));
            
            // Trigger sync event
            window.dispatchEvent(new CustomEvent('contentSync', {
                detail: {
                    contentType: 'blogs',
                    action: 'update',
                    item: updatedBlogs[index],
                    timestamp: new Date().getTime()
                }
            }));
            
            // Update lastSync for cross-tab communication
            localStorage.setItem('lastSync', JSON.stringify({
                contentType: 'blogs',
                action: 'update',
                itemId: testItem.id,
                timestamp: new Date().getTime()
            }));
            
            console.log('Sync test item updated:', updatedBlogs[index]);
            console.log('Check the blog page to verify it updates without refreshing');
        }
        
        // Delete the item after another 5 seconds
        setTimeout(() => {
            console.log('Deleting sync test item...');
            
            const finalBlogs = JSON.parse(localStorage.getItem('blogs') || '[]');
            const filteredBlogs = finalBlogs.filter(blog => blog.id !== testItem.id);
            
            localStorage.setItem('blogs', JSON.stringify(filteredBlogs));
            
            // Trigger sync event
            window.dispatchEvent(new CustomEvent('contentSync', {
                detail: {
                    contentType: 'blogs',
                    action: 'delete',
                    item: testItem,
                    timestamp: new Date().getTime()
                }
            }));
            
            // Update lastSync for cross-tab communication
            localStorage.setItem('lastSync', JSON.stringify({
                contentType: 'blogs',
                action: 'delete',
                itemId: testItem.id,
                timestamp: new Date().getTime()
            }));
            
            console.log('Sync test item deleted');
            console.log('Check the blog page to verify it disappears without refreshing');
            console.log('Sync verification completed successfully');
        }, 5000);
    }, 5000);
}

// Add a button to run the tests if we're on a test page
document.addEventListener('DOMContentLoaded', function() {
    const testContainer = document.getElementById('testContainer');
    if (testContainer) {
        const testButton = document.createElement('button');
        testButton.className = 'btn btn-primary';
        testButton.textContent = 'Run Basic Test';
        testButton.onclick = testAdminToFrontendWorkflow;
        testContainer.appendChild(testButton);
        
        const comprehensiveTestButton = document.createElement('button');
        comprehensiveTestButton.className = 'btn btn-info';
        comprehensiveTestButton.textContent = 'Run Comprehensive Test';
        comprehensiveTestButton.onclick = testAllContentTypes;
        comprehensiveTestButton.style.marginLeft = '10px';
        testContainer.appendChild(comprehensiveTestButton);
        
        const verifyButton = document.createElement('button');
        verifyButton.className = 'btn btn-success';
        verifyButton.textContent = 'Verify Sync Functionality';
        verifyButton.onclick = verifySyncFunctionality;
        verifyButton.style.marginLeft = '10px';
        testContainer.appendChild(verifyButton);
    }
});

