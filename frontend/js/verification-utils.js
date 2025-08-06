/**
 * Utility function to verify that content from localStorage is correctly rendered on the frontend
 * @returns {boolean} True if all content types are rendering correctly, false otherwise
 */
function verifyLocalStorageRendering() {
    console.group('Frontend Rendering Verification');
    
    // Track overall verification status
    let allVerificationsSuccessful = true;
    
    // Verify blogs rendering
    const blogVerification = verifyBlogsRendering();
    allVerificationsSuccessful = allVerificationsSuccessful && blogVerification.success;
    
    // Verify sermons rendering
    const sermonVerification = verifySermonsRendering();
    allVerificationsSuccessful = allVerificationsSuccessful && sermonVerification.success;
    
    // Verify events rendering
    const eventVerification = verifyEventsRendering();
    allVerificationsSuccessful = allVerificationsSuccessful && eventVerification.success;
    
    // Log overall result
    if (allVerificationsSuccessful) {
        console.log('%c✅ All content types are rendering correctly!', 'color: green; font-weight: bold');
    } else {
        console.log('%c❌ Some content types are not rendering correctly. See details above.', 'color: red; font-weight: bold');
    }
    
    console.groupEnd();
    return allVerificationsSuccessful;
}

/**
 * Verify blogs are rendering correctly
 * @returns {Object} Verification result with success status and details
 */
function verifyBlogsRendering() {
    console.group('Blog Rendering Verification');
    
    try {
        // Get blogs from localStorage
        const allBlogs = JSON.parse(localStorage.getItem('blogs') || '[]');
        const publishedBlogs = allBlogs.filter(blog => blog.status === 'published');
        
        // Sort by date (newest first) to match frontend sorting
        publishedBlogs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        
        // Find blog container
        const postsGrid = document.querySelector('.posts-grid');
        if (!postsGrid) {
            console.log('❓ Blog container (.posts-grid) not found in DOM. Skipping verification.');
            console.groupEnd();
            return { success: true, message: 'Blog container not found, likely not on blogs page' };
        }
        
        // Get rendered blog elements
        const renderedBlogs = postsGrid.querySelectorAll('.blog-post, article.blog-post');
        
        // Check if empty state is correctly displayed
        if (publishedBlogs.length === 0) {
            const emptyMessage = postsGrid.querySelector('.no-content');
            if (!emptyMessage) {
                console.error('❌ No empty state message displayed when there are no published blogs');
                console.groupEnd();
                return { success: false, message: 'Missing empty state message for blogs' };
            }
            console.log('✅ Empty state correctly displayed for blogs');
            console.groupEnd();
            return { success: true, message: 'Empty state correctly displayed' };
        }
        
        // Check count
        if (renderedBlogs.length !== publishedBlogs.length) {
            console.error(`❌ Blog count mismatch: ${renderedBlogs.length} rendered vs ${publishedBlogs.length} in localStorage`);
            console.groupEnd();
            return { 
                success: false, 
                message: `Blog count mismatch: ${renderedBlogs.length} rendered vs ${publishedBlogs.length} in localStorage` 
            };
        }
        
        // Verify content of each blog
        let allBlogsCorrect = true;
        publishedBlogs.forEach((blog, index) => {
            const renderedBlog = renderedBlogs[index];
            
            // Check title
            const titleElement = renderedBlog.querySelector('h3');
            if (!titleElement || titleElement.textContent !== blog.title) {
                console.error(`❌ Blog #${index + 1} title mismatch:`, {
                    expected: blog.title,
                    actual: titleElement ? titleElement.textContent : 'not found'
                });
                allBlogsCorrect = false;
            }
            
            // Check if "Read More" link has correct ID
            const readMoreLink = renderedBlog.querySelector('a[href*="blog-detail.html"]');
            if (!readMoreLink || !readMoreLink.href.includes(`id=${blog.id}`)) {
                console.error(`❌ Blog #${index + 1} "Read More" link incorrect:`, {
                    expected: `blog-detail.html?id=${blog.id}`,
                    actual: readMoreLink ? readMoreLink.href : 'not found'
                });
                allBlogsCorrect = false;
            }
        });
        
        if (allBlogsCorrect) {
            console.log(`✅ All ${publishedBlogs.length} blogs are rendering correctly`);
            console.groupEnd();
            return { success: true, message: `All ${publishedBlogs.length} blogs rendering correctly` };
        } else {
            console.error('❌ Some blogs are not rendering correctly. See details above.');
            console.groupEnd();
            return { success: false, message: 'Some blogs are not rendering correctly' };
        }
    } catch (error) {
        console.error('❌ Error during blog verification:', error);
        console.groupEnd();
        return { success: false, message: `Error during verification: ${error.message}` };
    }
}

/**
 * Verify sermons are rendering correctly
 * @returns {Object} Verification result with success status and details
 */
function verifySermonsRendering() {
    console.group('Sermon Rendering Verification');
    
    try {
        // Get sermons from localStorage
        const allSermons = JSON.parse(localStorage.getItem('sermons') || '[]');
        const publishedSermons = allSermons.filter(sermon => sermon.status === 'published');
        
        // Sort by date (newest first) to match frontend sorting
        publishedSermons.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        
        // Find sermon container
        const sermonContainer = document.getElementById('sermonContainer');
        if (!sermonContainer) {
            console.log('❓ Sermon container (#sermonContainer) not found in DOM. Skipping verification.');
            console.groupEnd();
            return { success: true, message: 'Sermon container not found, likely not on sermons page' };
        }
        
        // Get rendered sermon elements
        const renderedSermons = sermonContainer.querySelectorAll('.sermon-card');
        
        // Check if empty state is correctly displayed
        if (publishedSermons.length === 0) {
            const emptyMessage = sermonContainer.querySelector('.no-content');
            if (!emptyMessage) {
                console.error('❌ No empty state message displayed when there are no published sermons');
                console.groupEnd();
                return { success: false, message: 'Missing empty state message for sermons' };
            }
            console.log('✅ Empty state correctly displayed for sermons');
            console.groupEnd();
            return { success: true, message: 'Empty state correctly displayed' };
        }
        
        // Check count
        if (renderedSermons.length !== publishedSermons.length) {
            console.error(`❌ Sermon count mismatch: ${renderedSermons.length} rendered vs ${publishedSermons.length} in localStorage`);
            console.groupEnd();
            return { 
                success: false, 
                message: `Sermon count mismatch: ${renderedSermons.length} rendered vs ${publishedSermons.length} in localStorage` 
            };
        }
        
        // Verify content of each sermon
        let allSermonsCorrect = true;
        publishedSermons.forEach((sermon, index) => {
            const renderedSermon = renderedSermons[index];
            
            // Check title
            const titleElement = renderedSermon.querySelector('.sermon-title');
            if (!titleElement || titleElement.textContent !== sermon.title) {
                console.error(`❌ Sermon #${index + 1} title mismatch:`, {
                    expected: sermon.title,
                    actual: titleElement ? titleElement.textContent : 'not found'
                });
                allSermonsCorrect = false;
            }
            
            // Check speaker
            const speakerElement = renderedSermon.querySelector('.sermon-meta span:first-child');
            if (!speakerElement || !speakerElement.textContent.includes(sermon.speaker)) {
                console.error(`❌ Sermon #${index + 1} speaker mismatch:`, {
                    expected: sermon.speaker,
                    actual: speakerElement ? speakerElement.textContent : 'not found'
                });
                allSermonsCorrect = false;
            }
            
            // Check if sermon ID is correctly set in data attribute
            if (!renderedSermon.dataset.id || renderedSermon.dataset.id !== sermon.id) {
                console.error(`❌ Sermon #${index + 1} ID attribute incorrect:`, {
                    expected: sermon.id,
                    actual: renderedSermon.dataset.id || 'not found'
                });
                allSermonsCorrect = false;
            }
        });
        
        if (allSermonsCorrect) {
            console.log(`✅ All ${publishedSermons.length} sermons are rendering correctly`);
            console.groupEnd();
            return { success: true, message: `All ${publishedSermons.length} sermons rendering correctly` };
        } else {
            console.error('❌ Some sermons are not rendering correctly. See details above.');
            console.groupEnd();
            return { success: false, message: 'Some sermons are not rendering correctly' };
        }
    } catch (error) {
        console.error('❌ Error during sermon verification:', error);
        console.groupEnd();
        return { success: false, message: `Error during verification: ${error.message}` };
    }
}

/**
 * Verify events are rendering correctly
 * @returns {Object} Verification result with success status and details
 */
function verifyEventsRendering() {
    console.group('Event Rendering Verification');
    
    try {
        // Get events from localStorage
        const allEvents = JSON.parse(localStorage.getItem('events') || '[]');
        const publishedEvents = allEvents.filter(event => event.status === 'published');
        
        // Get current date for filtering
        const now = new Date();
        
        // Filter for upcoming events to match frontend filtering
        const upcomingEvents = publishedEvents.filter(event => new Date(event.date) >= now);
        
        // Sort by date (soonest first) to match frontend sorting
        upcomingEvents.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
        
        // Find event container
        const eventsList = document.querySelector('.events-list');
        if (!eventsList) {
            console.log('❓ Event container (.events-list) not found in DOM. Skipping verification.');
            console.groupEnd();
            return { success: true, message: 'Event container not found, likely not on events page' };
        }
        
        // Get rendered event elements
        const renderedEvents = eventsList.querySelectorAll('.event-card');
        
        // Check if empty state is correctly displayed
        if (upcomingEvents.length === 0) {
            const emptyMessage = eventsList.querySelector('.no-content');
            if (!emptyMessage) {
                console.error('❌ No empty state message displayed when there are no upcoming events');
                console.groupEnd();
                return { success: false, message: 'Missing empty state message for events' };
            }
            console.log('✅ Empty state correctly displayed for events');
            console.groupEnd();
            return { success: true, message: 'Empty state correctly displayed' };
        }
        
        // Check count
        if (renderedEvents.length !== upcomingEvents.length) {
            console.error(`❌ Event count mismatch: ${renderedEvents.length} rendered vs ${upcomingEvents.length} upcoming in localStorage`);
            console.groupEnd();
            return { 
                success: false, 
                message: `Event count mismatch: ${renderedEvents.length} rendered vs ${upcomingEvents.length} upcoming in localStorage` 
            };
        }
        
        // Verify content of each event
        let allEventsCorrect = true;
        upcomingEvents.forEach((event, index) => {
            const renderedEvent = renderedEvents[index];
            
            // Check title
            const titleElement = renderedEvent.querySelector('.event-title');
            if (!titleElement || titleElement.textContent !== event.title) {
                console.error(`❌ Event #${index + 1} title mismatch:`, {
                    expected: event.title,
                    actual: titleElement ? titleElement.textContent : 'not found'
                });
                allEventsCorrect = false;
            }
            
            // Check if "View Details" link has correct ID
            const detailLink = renderedEvent.querySelector('a[href*="event-detail.html"]');
            if (!detailLink || !detailLink.href.includes(`id=${event.id}`)) {
                console.error(`❌ Event #${index + 1} detail link incorrect:`, {
                    expected: `event-detail.html?id=${event.id}`,
                    actual: detailLink ? detailLink.href : 'not found'
                });
                allEventsCorrect = false;
            }
        });
        
        if (allEventsCorrect) {
            console.log(`✅ All ${upcomingEvents.length} events are rendering correctly`);
            console.groupEnd();
            return { success: true, message: `All ${upcomingEvents.length} events rendering correctly` };
        } else {
            console.error('❌ Some events are not rendering correctly. See details above.');
            console.groupEnd();
            return { success: false, message: 'Some events are not rendering correctly' };
        }
    } catch (error) {
        console.error('❌ Error during event verification:', error);
        console.groupEnd();
        return { success: false, message: `Error during verification: ${error.message}` };
    }
}

// Make the verification function available globally for console testing
window.verifyLocalStorageRendering = verifyLocalStorageRendering;

// Add helper function to test with sample data
window.testWithSampleData = function() {
    // Generate sample data
    const sampleBlogs = [
        {
            id: 'test-blog-1',
            title: 'Test Blog Post 1',
            summary: 'This is a test blog post',
            content: '<p>This is the content of test blog post 1</p>',
            status: 'published',
            createdAt: new Date().toISOString(),
            author: 'Test Author',
            category: 'Test'
        },
        {
            id: 'test-blog-2',
            title: 'Test Blog Post 2',
            summary: 'This is another test blog post',
            content: '<p>This is the content of test blog post 2</p>',
            status: 'published',
            createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            author: 'Test Author 2',
            category: 'Test'
        }
    ];
    
    const sampleSermons = [
        {
            id: 'test-sermon-1',
            title: 'Test Sermon 1',
            speaker: 'Test Speaker',
            date: new Date().toISOString(),
            description: 'This is a test sermon',
            status: 'published'
        },
        {
            id: 'test-sermon-2',
            title: 'Test Sermon 2',
            speaker: 'Test Speaker 2',
            date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            description: 'This is another test sermon',
            status: 'published'
        }
    ];
    
    const sampleEvents = [
        {
            id: 'test-event-1',
            title: 'Test Event 1',
            date: new Date(Date.now() + 86400000).toISOString(), // 1 day in future
            location: 'Test Location',
            description: 'This is a test event',
            status: 'published'
        },
        {
            id: 'test-event-2',
            title: 'Test Event 2',
            date: new Date(Date.now() + 172800000).toISOString(), // 2 days in future
            location: 'Test Location 2',
            description: 'This is another test event',
            status: 'published'
        }
    ];
    
    // Save to localStorage
    localStorage.setItem('blogs', JSON.stringify(sampleBlogs));
    localStorage.setItem('sermons', JSON.stringify(sampleSermons));
    localStorage.setItem('events', JSON.stringify(sampleEvents));
    
    // Trigger content sync event
    window.dispatchEvent(new CustomEvent('contentSync', {
        detail: {
            contentType: 'all',
            action: 'add',
            timestamp: Date.now()
        }
    }));
    
    console.log('Sample data loaded. Run verifyLocalStorageRendering() to check rendering.');
    
    // Return true to indicate success
    return true;
};

// Add helper function to test with broken data
window.testWithBrokenData = function() {
    // Generate sample data with issues
    const sampleBlogs = [
        {
            id: 'test-blog-1',
            title: 'Test Blog Post 1',
            summary: 'This is a test blog post',
            content: '<p>This is the content of test blog post 1</p>',
            status: 'published',
            createdAt: new Date().toISOString()
        },
        {
            id: 'test-blog-2',
            title: 'Test Blog Post 2',
            // Missing summary
            content: '<p>This is the content of test blog post 2</p>',
            status: 'draft', // Not published
            createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
        }
    ];
    
    const sampleSermons = [
        {
            id: 'test-sermon-1',
            title: 'Test Sermon 1',
            // Missing speaker
            date: new Date().toISOString(),
            description: 'This is a test sermon',
            status: 'published'
        },
        {
            id: 'test-sermon-2',
            // Missing title
            speaker: 'Test Speaker 2',
            date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            description: 'This is another test sermon',
            status: 'published'
        }
    ];
    
    const sampleEvents = [
        {
            id: 'test-event-1',
            title: 'Test Event 1',
            date: new Date(Date.now() - 86400000).toISOString(), // 1 day in past
            location: 'Test Location',
            description: 'This is a test event',
            status: 'published'
        },
        {
            id: 'test-event-2',
            title: 'Test Event 2',
            date: new Date(Date.now() + 172800000).toISOString(), // 2 days in future
            location: 'Test Location 2',
            description: 'This is another test event',
            status: 'draft' // Not published
        }
    ];
    
    // Save to localStorage
    localStorage.setItem('blogs', JSON.stringify(sampleBlogs));
    localStorage.setItem('sermons', JSON.stringify(sampleSermons));
    localStorage.setItem('events', JSON.stringify(sampleEvents));
    
    // Trigger content sync event
    window.dispatchEvent(new CustomEvent('contentSync', {
        detail: {
            contentType: 'all',
            action: 'add',
            timestamp: Date.now()
        }
    }));
    
    console.log('Broken data loaded. Run verifyLocalStorageRendering() to check rendering.');
    
    // Return true to indicate success
    return true;
};

console.log('Verification utilities loaded. Run verifyLocalStorageRendering() to check frontend rendering.');