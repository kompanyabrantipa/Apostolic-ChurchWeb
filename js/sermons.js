/**
 * Sermon loading and display functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // REMOVED: initSampleSermons() - no hardcoded content
    loadSermons();

    // Listen for storage changes (cross-tab communication)
    window.addEventListener('storage', function(event) {
        if (event.key === 'sermons' || event.key === 'lastSync') {
            const syncData = event.key === 'lastSync' ? JSON.parse(event.newValue || '{}') : null;
            if (!syncData || syncData.contentType === 'sermons' || syncData.contentType === 'all') {
                loadSermons();
            }
        }
    });

    // Listen for content sync events (same-tab updates)
    window.addEventListener('contentSync', function(event) {
        const syncData = event.detail;
        if (syncData.contentType === 'sermons' || syncData.contentType === 'all') {
            loadSermons();
        }
    });
});

// REMOVED: initSampleSermons function - no hardcoded content
// All sermons now come from localStorage via admin dashboard

/**
 * Load and display sermons from localStorage
 */
function loadSermons() {
    // Try multiple possible selectors to find the container
    const sermonContainer = document.getElementById('sermonContainer') || 
                           document.querySelector('.sermon-container') || 
                           document.querySelector('.content-section #sermonContainer');
                           
    if (!sermonContainer) {
        console.warn('Sermon container (#sermonContainer) not found. Skipping sermon loading.');
        return;
    }
    
    try {
        // Get sermons from localStorage
        const sermons = JSON.parse(localStorage.getItem('sermons') || '[]');
        
        // Filter published sermons only
        const publishedSermons = sermons.filter(sermon => sermon.status === 'published');
        
        // Sort by date (newest first)
        publishedSermons.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        
        if (publishedSermons.length === 0) {
            sermonContainer.innerHTML = '<div class="no-content">No sermons available at this time.</div>';
            return;
        }
        
        // Render sermons
        sermonContainer.innerHTML = publishedSermons.map(sermon => createSermonHTML(sermon)).join('');
        
        console.log(`Loaded ${publishedSermons.length} sermons`);
    } catch (error) {
        console.error('Error loading sermons:', error);
        sermonContainer.innerHTML = '<div class="error-message">Unable to load sermons. Please try again later.</div>';
    }
}

/**
 * Create HTML for a sermon card
 * @param {Object} sermon - The sermon object
 * @returns {string} HTML for the sermon card
 */
function createSermonHTML(sermon) {
    const date = new Date(sermon.date);
    const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    return `
        <div class="sermon-card" data-id="${sermon.id}">
            <h3 class="sermon-title">${sermon.title}</h3>
            <div class="sermon-meta">
                <span><i class="fas fa-user"></i> ${sermon.speaker}</span>
                <span><i class="fas fa-calendar"></i> ${formattedDate}</span>
            </div>
            <div class="sermon-actions">
                ${sermon.audioUrl ? `<a href="${sermon.audioUrl}" class="btn btn-sm"><i class="fas fa-headphones"></i> Listen</a>` : ''}
                ${sermon.videoUrl ? `<a href="${sermon.videoUrl}" class="btn btn-sm"><i class="fas fa-video"></i> Watch</a>` : ''}
                <a href="sermon-detail.html?id=${sermon.id}" class="btn btn-sm"><i class="fas fa-info-circle"></i> Details</a>
            </div>
        </div>
    `;
}

// Make functions available globally
window.loadSermons = loadSermons;
window.createSermonHTML = createSermonHTML;
