document.addEventListener('DOMContentLoaded', function() {
    // Get event ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');
    
    if (eventId) {
        loadEventDetail(eventId);
    } else {
        showError('Event not found');
    }
});

function loadEventDetail(id) {
    try {
        // Get all events from localStorage
        const allEvents = JSON.parse(localStorage.getItem('events') || '[]');
        
        // Find the specific event
        const event = allEvents.find(event => event.id === id);
        
        if (!event) {
            showError('Event not found');
            return;
        }
        
        // Only show published events
        if (event.status !== 'published') {
            showError('This event is not currently available');
            return;
        }
        
        displayEventDetail(event);
    } catch (error) {
        console.error('Error loading event detail:', error);
        showError('Unable to load event at this time. Please try again later.');
    }
}

function displayEventDetail(event) {
    const container = document.querySelector('.event-detail-container');
    if (!container) return;
    
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const formattedTime = eventDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    let html = `
        <article class="event-detail">
            <h1 class="event-title">${event.title}</h1>
            <div class="event-meta">
                <span class="event-date"><i class="fas fa-calendar-alt"></i> ${formattedDate}</span>
                <span class="event-time"><i class="fas fa-clock"></i> ${formattedTime}</span>
                <span class="event-location"><i class="fas fa-map-marker-alt"></i> ${event.location}</span>
            </div>
            
            ${event.imageUrl ? 
                `<div class="event-image"><img src="${event.imageUrl}" alt="${event.title}"></div>` : 
                ''
            }
            
            <div class="event-content">
                ${event.description}
            </div>
            
            <div class="event-actions">
                <button class="btn btn-primary" onclick="addToCalendar('${event.title}', '${event.date}', '${event.location}')">
                    <i class="fas fa-calendar-plus"></i> Add to Calendar
                </button>
            </div>
        </article>
        <div class="event-navigation">
            <a href="events.html" class="btn btn-secondary"><i class="fas fa-arrow-left"></i> Back to Events</a>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Update page title
    document.title = `${event.title} | Apostolic Church`;
}

function addToCalendar(title, dateTime, location) {
    // Format for Google Calendar
    const startDate = new Date(dateTime);
    const endDate = new Date(startDate.getTime() + (2 * 60 * 60 * 1000)); // Add 2 hours
    
    const startIso = startDate.toISOString().replace(/-|:|\.\d+/g, '');
    const endIso = endDate.toISOString().replace(/-|:|\.\d+/g, '');
    
    const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startIso}/${endIso}&location=${encodeURIComponent(location)}&sf=true&output=xml`;
    
    window.open(url, '_blank');
}

function showError(message) {
    const container = document.querySelector('.event-detail-container');
    if (container) {
        container.innerHTML = `
            <div class="error-container">
                <p class="error-message">${message}</p>
                <div class="error-actions">
                    <a href="events.html" class="btn btn-primary">Back to Events</a>
                </div>
            </div>
        `;
    }
}