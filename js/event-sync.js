/**
 * Event Sync Manager
 * Safely extends calendar and event grid functionality to sync with admin-uploaded events
 * Preserves all existing functionality while adding real-time sync capabilities
 */

class EventSyncManager {
    constructor() {
        this.isInitialized = false;
        this.syncNotificationTimeout = null;
        this.lastSyncTime = null;
        
        // Bind methods to preserve context
        this.handleStorageChange = this.handleStorageChange.bind(this);
        this.syncEvents = this.syncEvents.bind(this);
        this.showSyncNotification = this.showSyncNotification.bind(this);
    }

    /**
     * Initialize the event sync manager
     * Safe initialization that doesn't override existing functionality
     */
    init() {
        try {
            if (this.isInitialized) {
                console.log('EventSyncManager already initialized');
                return;
            }

            // Listen for localStorage changes (cross-tab communication)
            window.addEventListener('storage', this.handleStorageChange);
            
            // Listen for custom events from admin portal
            window.addEventListener('eventsUpdated', this.syncEvents);
            
            // Initial sync on page load
            this.syncEvents();
            
            this.isInitialized = true;
            console.log('EventSyncManager initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize EventSyncManager:', error);
        }
    }

    /**
     * Handle localStorage changes from other tabs (admin portal)
     */
    handleStorageChange(event) {
        try {
            if (event.key === 'events' && event.newValue !== event.oldValue) {
                console.log('Events updated in another tab, syncing...');
                this.syncEvents();
                this.showSyncNotification('Events updated from admin portal');
            }
        } catch (error) {
            console.error('Error handling storage change:', error);
        }
    }

    /**
     * Sync events to both calendar and event grid
     * Preserves existing functionality by extending rather than replacing
     */
    syncEvents() {
        try {
            // Update event grid (if present)
            this.updateEventGrid();
            
            // Update calendar (if present)
            this.updateCalendar();
            
            // Update list view (if present)
            this.updateListView();
            
            this.lastSyncTime = new Date();
            console.log('Events synced successfully at', this.lastSyncTime.toLocaleTimeString());
            
        } catch (error) {
            console.error('Error syncing events:', error);
        }
    }

    /**
     * Update the event grid safely
     * Uses existing loadEvents function if available
     */
    updateEventGrid() {
        try {
            const eventsGrid = document.querySelector('.events-grid');
            if (!eventsGrid) return;

            // Use existing loadEvents function if available
            if (typeof loadEvents === 'function') {
                loadEvents();
                return;
            }

            // Fallback: manual update
            this.renderEventGrid(eventsGrid);
            
        } catch (error) {
            console.error('Error updating event grid:', error);
        }
    }

    /**
     * Update calendar safely without overriding existing functionality
     * Extends the existing initCalendar function
     */
    updateCalendar() {
        try {
            const calendarBody = document.querySelector('.calendar-body');
            if (!calendarBody) return;

            // Check if initCalendar function exists and use it
            if (typeof initCalendar === 'function') {
                // Get current calendar state
                const currentHeader = document.querySelector('.calendar-header h3');
                const currentMonthYear = currentHeader ? currentHeader.textContent : '';
                
                // Re-initialize calendar with fresh data
                initCalendar();
                
                // Restore month/year if it was changed
                if (currentMonthYear && currentHeader) {
                    currentHeader.textContent = currentMonthYear;
                }
                return;
            }

            // Fallback: basic calendar update
            this.renderCalendarFallback(calendarBody);
            
        } catch (error) {
            console.error('Error updating calendar:', error);
        }
    }

    /**
     * Update list view if present (for calendar.html)
     */
    updateListView() {
        try {
            const listView = document.querySelector('.event-list-view');
            if (!listView) return;

            // Check if there's an existing list update function
            const filterButtons = document.querySelectorAll('.filter-btn');
            const activeFilter = document.querySelector('.filter-btn.active');
            
            if (activeFilter && typeof window.updateEventList === 'function') {
                const filter = activeFilter.getAttribute('data-filter') || 'all';
                window.updateEventList(filter);
            }
            
        } catch (error) {
            console.error('Error updating list view:', error);
        }
    }

    /**
     * Render event grid as fallback
     */
    renderEventGrid(container) {
        try {
            const events = this.getPublishedEvents();
            const upcomingEvents = this.filterUpcomingEvents(events);

            if (upcomingEvents.length === 0) {
                container.innerHTML = '<div class="no-events-message">No events uploaded yet. Please check back later.</div>';
                return;
            }

            container.innerHTML = upcomingEvents.map(event => this.createEventCardHTML(event)).join('');
            
        } catch (error) {
            console.error('Error rendering event grid:', error);
            container.innerHTML = '<div class="error-message">Unable to load events. Please try again later.</div>';
        }
    }

    /**
     * Basic calendar rendering as fallback
     */
    renderCalendarFallback(container) {
        try {
            const events = this.getPublishedEvents();
            if (events.length === 0) return;

            // Simple placeholder update
            const placeholder = container.querySelector('.calendar-placeholder');
            if (placeholder) {
                const eventCount = events.length;
                placeholder.textContent = `${eventCount} upcoming events available. Full calendar functionality loading...`;
            }
            
        } catch (error) {
            console.error('Error rendering calendar fallback:', error);
        }
    }

    /**
     * Get published events from localStorage
     */
    getPublishedEvents() {
        try {
            const events = JSON.parse(localStorage.getItem('events') || '[]');
            return events.filter(event => event.status === 'published');
        } catch (error) {
            console.error('Error getting published events:', error);
            return [];
        }
    }

    /**
     * Filter for upcoming events
     */
    filterUpcomingEvents(events) {
        const now = new Date();
        return events.filter(event => {
            try {
                return new Date(event.date) >= now;
            } catch (e) {
                return false;
            }
        }).sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    /**
     * Create event card HTML (fallback implementation)
     */
    createEventCardHTML(event) {
        const date = event.date ? new Date(event.date) : new Date();
        const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
        const day = date.getDate();
        
        const description = event.description || 'Join us for this special event.';
        const location = event.location || 'Church Location';
        const category = event.category || 'General';
        
        return `
            <article class="event-card" data-aos="fade-up">
                <div class="event-card-header">
                    <div class="event-date-small">
                        <span class="month">${month}</span>
                        <span class="day">${day}</span>
                    </div>
                </div>
                <div class="event-card-content">
                    <div class="event-type">${category}</div>
                    <h3>${event.title}</h3>
                    <p>${description}</p>
                    <div class="event-location"><i class="fas fa-map-marker-alt"></i> ${location}</div>
                    <a href="event-detail.html?id=${event.id}" class="btn-text">Event Details <i class="fas fa-arrow-right"></i></a>
                </div>
            </article>
        `;
    }

    /**
     * Show sync notification to user
     */
    showSyncNotification(message) {
        try {
            // Clear existing notification
            if (this.syncNotificationTimeout) {
                clearTimeout(this.syncNotificationTimeout);
            }

            // Remove existing notification
            const existingNotification = document.querySelector('.sync-notification');
            if (existingNotification) {
                existingNotification.remove();
            }

            // Create new notification
            const notification = document.createElement('div');
            notification.className = 'sync-notification';
            notification.innerHTML = `
                <div class="sync-notification-content">
                    <i class="fas fa-sync-alt"></i>
                    <span>${message}</span>
                </div>
            `;

            // Add to page
            document.body.appendChild(notification);

            // Auto-remove after 3 seconds
            this.syncNotificationTimeout = setTimeout(() => {
                if (notification.parentNode) {
                    notification.classList.add('fade-out');
                    setTimeout(() => notification.remove(), 300);
                }
            }, 3000);

        } catch (error) {
            console.error('Error showing sync notification:', error);
        }
    }

    /**
     * Cleanup method
     */
    destroy() {
        try {
            window.removeEventListener('storage', this.handleStorageChange);
            window.removeEventListener('eventsUpdated', this.syncEvents);
            
            if (this.syncNotificationTimeout) {
                clearTimeout(this.syncNotificationTimeout);
            }
            
            this.isInitialized = false;
            console.log('EventSyncManager destroyed');
            
        } catch (error) {
            console.error('Error destroying EventSyncManager:', error);
        }
    }
}

// Initialize the sync manager when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Create global instance
        window.eventSyncManager = new EventSyncManager();
        window.eventSyncManager.init();
        
        // Trigger initial sync after a short delay to ensure other scripts are loaded
        setTimeout(() => {
            if (window.eventSyncManager) {
                window.eventSyncManager.syncEvents();
            }
        }, 500);
        
    } catch (error) {
        console.error('Failed to initialize EventSyncManager on DOMContentLoaded:', error);
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EventSyncManager;
}
