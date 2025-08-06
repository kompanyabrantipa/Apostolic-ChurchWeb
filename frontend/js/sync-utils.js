/**
 * Sync Utilities
 * Helper functions for synchronizing content between admin and frontend
 */

// Function to listen for content changes
function initContentSync(contentTypes, callback) {
    // Listen for content sync events (same tab)
    window.addEventListener('contentSync', function(event) {
        const syncData = event.detail;
        if (contentTypes.includes(syncData.contentType) || syncData.contentType === 'all') {
            console.log(`Sync detected for ${syncData.contentType}:`, syncData.action);
            if (typeof callback === 'function') {
                callback(syncData);
            }
        }
    });
    
    // Listen for storage events (cross-tab)
    window.addEventListener('storage', function(event) {
        if (event.key === 'lastSync') {
            try {
                const syncData = JSON.parse(event.newValue);
                if (contentTypes.includes(syncData.contentType) || syncData.contentType === 'all') {
                    console.log(`Storage event detected for ${syncData.contentType}:`, syncData.action);
                    if (typeof callback === 'function') {
                        callback(syncData);
                    }
                }
            } catch (error) {
                console.error('Error parsing sync data:', error);
            }
        } else if (contentTypes.includes(event.key)) {
            // Direct change to the content storage
            console.log(`Direct storage change detected for ${event.key}`);
            if (typeof callback === 'function') {
                callback({ contentType: event.key, action: 'unknown' });
            }
        }
    });
}

// Function to trigger content sync
function triggerContentSync(contentType, action, item) {
    // Create and dispatch custom event
    const syncEvent = new CustomEvent('contentSync', {
        detail: {
            contentType: contentType,
            action: action,
            item: item,
            timestamp: new Date().getTime()
        }
    });
    
    window.dispatchEvent(syncEvent);
    
    // Update lastSync for cross-tab communication
    localStorage.setItem('lastSync', JSON.stringify({
        contentType: contentType,
        action: action,
        itemId: item ? item.id : null,
        timestamp: new Date().getTime()
    }));
    
    console.log(`Triggered sync for ${contentType}:`, action);
}

// Function to safely get content from localStorage
function getContentFromStorage(contentType) {
    try {
        return JSON.parse(localStorage.getItem(contentType) || '[]');
    } catch (error) {
        console.error(`Error retrieving ${contentType} from localStorage:`, error);
        return [];
    }
}

// Function to safely save content to localStorage
function saveContentToStorage(contentType, content) {
    try {
        localStorage.setItem(contentType, JSON.stringify(content));
        return true;
    } catch (error) {
        console.error(`Error saving ${contentType} to localStorage:`, error);
        return false;
    }
}

// Function to get only published content
function getPublishedContent(contentType) {
    const allContent = getContentFromStorage(contentType);
    return allContent.filter(item => item.status === 'published');
}

// REMOVED: seedSampleContent function - no hardcoded content
// All content now comes from localStorage via admin dashboard

// Export functions if using modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initContentSync,
        triggerContentSync,
        getContentFromStorage,
        saveContentToStorage,
        getPublishedContent
        // REMOVED: seedSampleContent - no hardcoded content
    };
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize content sync for all content types
    initContentSync(['blogs', 'events', 'sermons'], function(syncData) {
        console.log(`Content sync detected: ${syncData.contentType}`);
        
        // Reload appropriate content based on sync type
        if (syncData.contentType === 'blogs' || syncData.contentType === 'all') {
            if (typeof loadBlogPosts === 'function' && document.querySelector('.posts-grid')) {
                loadBlogPosts();
            }
        }
        
        if (syncData.contentType === 'events' || syncData.contentType === 'all') {
            if (typeof loadEvents === 'function' && document.querySelector('.events-list')) {
                loadEvents();
            }
        }
        
        if (syncData.contentType === 'sermons' || syncData.contentType === 'all') {
            if (typeof loadSermons === 'function' && document.getElementById('sermonContainer')) {
                loadSermons();
            }
        }
    });
    
    // REMOVED: seedSampleContent call - no hardcoded content initialization
    // All content now comes from localStorage via admin dashboard
    console.log('Content sync initialized. Frontend will display only content created via admin dashboard.');
});

