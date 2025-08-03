document.addEventListener('DOMContentLoaded', function() {
    // Initial load of events
    loadEvents();
    
    // Listen for storage changes (cross-tab communication)
    window.addEventListener('storage', function(event) {
        if (event.key === 'events' || event.key === 'lastSync') {
            const syncData = event.key === 'lastSync' ? JSON.parse(event.newValue || '{}') : null;
            if (!syncData || syncData.contentType === 'events' || syncData.contentType === 'all') {
                loadEvents();
            }
        }
    });
    
    // Listen for content sync events (same-tab updates)
    window.addEventListener('contentSync', function(event) {
        const syncData = event.detail;
        if (syncData.contentType === 'events' || syncData.contentType === 'all') {
            loadEvents();
        }
    });
});

function loadEvents() {
    // Try to find the events grid container
    const eventsGrid = document.querySelector('.events-grid') ||
                       document.querySelector('.events-container') ||
                       document.querySelector('.events-list') ||
                       document.querySelector('.content-section .events-container');

    if (!eventsGrid) {
        console.warn('Events grid container not found. Skipping events loading.');
        return;
    }

    try {
        // Get events from localStorage
        const events = JSON.parse(localStorage.getItem('events') || '[]');

        // Filter published events only
        const publishedEvents = events.filter(event => event.status === 'published');

        // Get current date for filtering
        const now = new Date();

        // Filter for upcoming events
        const upcomingEvents = publishedEvents.filter(event => {
            try {
                return new Date(event.date) >= now;
            } catch (e) {
                return false;
            }
        });

        // Sort by date (soonest first)
        upcomingEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

        if (upcomingEvents.length === 0) {
            eventsGrid.innerHTML = '<div class="no-events-message">No events uploaded yet. Please check back later.</div>';
            return;
        }

        // Render events using the updated createEventHTML function
        eventsGrid.innerHTML = upcomingEvents.map(event => createEventHTML(event)).join('');

        console.log(`Loaded ${upcomingEvents.length} upcoming events`);
    } catch (error) {
        console.error('Error loading events:', error);
        eventsGrid.innerHTML = '<div class="error-message">Unable to load events. Please try again later.</div>';
    }
}

function createEventHTML(event) {
    // Format date for the date badge
    const date = event.date ? new Date(event.date) : new Date();
    const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const day = date.getDate();

    // Format time if available
    let timeString = '';
    if (event.date) {
        const eventDate = new Date(event.date);
        const dayName = eventDate.toLocaleDateString('en-US', { weekday: 'long' });
        timeString = eventDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
        });
        timeString = `${dayName} • ${timeString}`;
    }

    // Default values for missing properties
    const description = event.description || 'Join us for this special event.';
    const location = event.location || 'Church Location';
    const category = event.category || 'General';

    // Create location display
    const locationDisplay = location
        ? `<div class="event-location"><i class="fas fa-map-marker-alt"></i> ${location}</div>`
        : '';

    // Create time display
    const timeDisplay = timeString
        ? `<p class="event-time"><i class="far fa-clock"></i> ${timeString}</p>`
        : '';

    // Create media display
    const mediaDisplay = createMediaDisplay(event.imageUrl);

    return `
        <article class="event-card" data-aos="fade-up">
            ${mediaDisplay}
            <div class="event-card-header">
                <div class="event-date-small">
                    <span class="month">${month}</span>
                    <span class="day">${day}</span>
                </div>
            </div>
            <div class="event-card-content">
                <div class="event-type">${category}</div>
                <h3>${event.title}</h3>
                ${timeDisplay}
                <p>${description}</p>
                ${locationDisplay}
                <a href="event-detail.html?id=${event.id}" class="btn-text">Event Details <i class="fas fa-arrow-right"></i></a>
            </div>
        </article>
    `;
}

/**
 * Create media display HTML for cards
 * @param {string} mediaUrl - The media URL (image or video)
 * @returns {string} HTML for media display
 */
function createMediaDisplay(mediaUrl) {
    if (!mediaUrl) {
        return '';
    }

    // Check if it's a video file
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.avi', '.mov'];
    const isVideo = videoExtensions.some(ext => mediaUrl.toLowerCase().includes(ext)) ||
                   mediaUrl.startsWith('data:video/');

    if (isVideo) {
        return `
            <div class="card-media">
                <video src="${mediaUrl}" class="media-thumb" controls preload="metadata">
                    Your browser does not support the video tag.
                </video>
            </div>
        `;
    } else {
        return `
            <div class="card-media">
                <img src="${mediaUrl}" alt="Event Media" class="media-thumb" loading="lazy" />
            </div>
        `;
    }
}



