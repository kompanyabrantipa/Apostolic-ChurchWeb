document.addEventListener('DOMContentLoaded', function() {
    // Get sermon ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const sermonId = urlParams.get('id');
    
    if (sermonId) {
        loadSermonDetail(sermonId);
    } else {
        showError('Sermon not found');
    }
});

function loadSermonDetail(id) {
    try {
        // Get all sermons from localStorage
        const allSermons = JSON.parse(localStorage.getItem('sermons') || '[]');
        
        // Find the specific sermon
        const sermon = allSermons.find(sermon => sermon.id === id);
        
        if (!sermon) {
            showError('Sermon not found');
            return;
        }
        
        // Only show published sermons
        if (sermon.status !== 'published') {
            showError('This sermon is not currently available');
            return;
        }
        
        displaySermonDetail(sermon);
    } catch (error) {
        console.error('Error loading sermon detail:', error);
        showError('Unable to load sermon at this time. Please try again later.');
    }
}

function displaySermonDetail(sermon) {
    const container = document.querySelector('.sermon-detail-container');
    if (!container) return;
    
    const sermonDate = new Date(sermon.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    let html = `
        <article class="sermon-detail">
            <h1 class="sermon-title">${sermon.title}</h1>
            <div class="sermon-meta">
                <span class="sermon-speaker"><i class="fas fa-user"></i> ${sermon.speaker}</span>
                <span class="sermon-date"><i class="fas fa-calendar-alt"></i> ${sermonDate}</span>
            </div>
            
            <div class="sermon-content">
                <div class="sermon-description">
                    ${sermon.description || 'No description available.'}
                </div>
            </div>
            
            <div class="sermon-actions">
                <a href="sermons.html" class="btn btn-secondary"><i class="fas fa-arrow-left"></i> Back to Sermons</a>
            </div>
        </article>
    `;
    
    container.innerHTML = html;
    
    // Update page title
    document.title = `${sermon.title} | Apostolic Church`;
}

function showError(message) {
    const container = document.querySelector('.sermon-detail-container');
    if (container) {
        container.innerHTML = `
            <div class="error-container">
                <p class="error-message">${message}</p>
                <div class="error-actions">
                    <a href="sermons.html" class="btn btn-primary">Back to Sermons</a>
                </div>
            </div>
        `;
    }
}

