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
 * Load and display sermons from API
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
        // Use DataService to get sermons from API
        if (typeof DataService !== 'undefined' && DataService.getPublished) {
            DataService.getPublished('sermons').then(sermons => {
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
            }).catch(error => {
                console.error('Error loading sermons:', error);
                sermonContainer.innerHTML = '<div class="error-message">Unable to load sermons. Please try again later.</div>';
            });
        } else {
            // Fallback to localStorage
            console.warn('DataService not available, using localStorage fallback');
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
        }
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

    // Create media display for sermon
    const mediaDisplay = createSermonMediaDisplay(sermon);

    return `
        <div class="sermon-card" data-id="${sermon.id}">
            ${mediaDisplay}
            <div class="sermon-card-content">
                <h3 class="sermon-title">${sermon.title}</h3>
                <div class="sermon-meta">
                    <span><i class="fas fa-user"></i> ${sermon.speaker}</span>
                    <span><i class="fas fa-calendar"></i> ${formattedDate}</span>
                </div>
                <div class="sermon-actions">
                    ${sermon.audioUrl ? `<a href="${sermon.audioUrl}" class="btn btn-sm"><i class="fas fa-headphones"></i> Listen</a>` : ''}
                    ${sermon.videoUrl ? `<a href="${sermon.videoUrl}" class="btn btn-sm"><i class="fas fa-video"></i> Watch</a>` : ''}
                </div>
            </div>
        </div>
    `;
}

/**
 * Create media display HTML for sermon cards
 * @param {Object} sermon - The sermon object
 * @returns {string} HTML for media display
 */
function createSermonMediaDisplay(sermon) {
    // Priority: thumbnailUrl > videoUrl > audioUrl > default
    let mediaUrl = sermon.thumbnailUrl;
    let mediaType = 'image';

    if (!mediaUrl && sermon.videoUrl) {
        mediaUrl = sermon.videoUrl;
        mediaType = 'video';
    } else if (!mediaUrl && sermon.audioUrl) {
        mediaUrl = sermon.audioUrl;
        mediaType = 'audio';
    }

    if (!mediaUrl) {
        return '';
    }

    // Check file type if not explicitly set
    if (mediaType === 'image') {
        const videoExtensions = ['.mp4', '.webm', '.ogg', '.avi', '.mov'];
        const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a'];

        if (videoExtensions.some(ext => mediaUrl.toLowerCase().includes(ext)) || mediaUrl.startsWith('data:video/')) {
            mediaType = 'video';
        } else if (audioExtensions.some(ext => mediaUrl.toLowerCase().includes(ext)) || mediaUrl.startsWith('data:audio/')) {
            mediaType = 'audio';
        }
    }

    switch (mediaType) {
        case 'video':
            return `
                <div class="card-media">
                    <video src="${mediaUrl}" class="media-thumb" controls preload="metadata">
                        Your browser does not support the video tag.
                    </video>
                </div>
            `;
        case 'audio':
            return `
                <div class="card-media audio-media">
                    <div class="audio-placeholder">
                        <i class="fas fa-music"></i>
                        <span>Audio Sermon</span>
                    </div>
                    <audio src="${mediaUrl}" controls class="audio-player">
                        Your browser does not support the audio tag.
                    </audio>
                </div>
            `;
        default:
            return `
                <div class="card-media">
                    <img src="${mediaUrl}" alt="Sermon Thumbnail" class="media-thumb" loading="lazy" />
                </div>
            `;
    }
}

// Make functions available globally
window.loadSermons = loadSermons;
window.createSermonHTML = createSermonHTML;
