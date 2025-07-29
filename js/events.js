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
    // Try multiple possible selectors to find the container
    const eventsList = document.querySelector('.events-container') ||
                       document.querySelector('.events-list') ||
                       document.querySelector('.content-section .events-container');

    if (!eventsList) {
        console.warn('Events container (.events-container or .events-list) not found. Skipping events loading.');
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
            eventsList.innerHTML = '<div class="no-content">No upcoming events at this time.</div>';
            return;
        }
        
        // Render events (using your existing createEventHTML function)
        eventsList.innerHTML = upcomingEvents.map(event => createEventHTML(event)).join('');
        
        console.log(`Loaded ${upcomingEvents.length} upcoming events`);
    } catch (error) {
        console.error('Error loading events:', error);
        eventsList.innerHTML = '<div class="error-message">Unable to load events. Please try again later.</div>';
    }
}

function createEventHTML(event) {
    // Format date
    const date = event.date ? new Date(event.date) : new Date();
    const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Format time if available
    let timeString = '';
    if (event.date) {
        const eventDate = new Date(event.date);
        timeString = eventDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    // Default values for missing properties
    const description = event.description || '';
    const location = event.location || '';
    
    // Create date display with time if available
    const dateDisplay = timeString 
        ? `<span class="event-date"><i class="fas fa-calendar"></i> ${formattedDate}, ${timeString}</span>`
        : `<span class="event-date"><i class="fas fa-calendar"></i> ${formattedDate}</span>`;
    
    // Add location if available
    const locationDisplay = location 
        ? `<span class="event-location"><i class="fas fa-map-marker-alt"></i> ${location}</span>`
        : '';
    
    return `
        <div class="event-card">
            <div class="event-header">
                <h4 class="event-title">${event.title}</h4>
                ${dateDisplay}
                ${locationDisplay}
            </div>
            <p class="event-description">${description}</p>
            <a href="event-detail.html?id=${event.id}" class="event-link">View Details</a>
        </div>
    `;
}






