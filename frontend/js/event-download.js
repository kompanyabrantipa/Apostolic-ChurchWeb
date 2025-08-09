/**
 * Event Download Manager
 * Handles downloading events as ICS calendar files
 */

class EventDownloadManager {
    constructor() {
        this.initializeDownloadButtons();
    }

    /**
     * Initialize download buttons on page load
     */
    initializeDownloadButtons() {
        // Initialize calendar download button
        const calendarDownloadBtn = document.getElementById('downloadCalendarBtn');
        if (calendarDownloadBtn) {
            calendarDownloadBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.downloadAllEvents();
            });
        }

        // Initialize individual event download buttons (will be added dynamically)
        this.addDownloadButtonsToEvents();
    }

    /**
     * Add download buttons to existing event cards
     */
    addDownloadButtonsToEvents() {
        // Add download buttons to event cards in events grid
        const eventCards = document.querySelectorAll('.event-card');
        eventCards.forEach(card => {
            if (!card.querySelector('.download-event-btn')) {
                this.addDownloadButtonToCard(card);
            }
        });

        // Add download button to event detail page
        const eventActions = document.querySelector('.event-actions');
        if (eventActions && !eventActions.querySelector('.download-event-btn')) {
            this.addDownloadButtonToEventDetail();
        }
    }

    /**
     * Add download button to an event card
     */
    addDownloadButtonToCard(card) {
        const eventContent = card.querySelector('.event-card-content');
        if (eventContent) {
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'download-event-btn btn-secondary';
            downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download';
            downloadBtn.onclick = () => this.downloadEventFromCard(card);
            
            // Insert before the last element (usually the "Event Details" link)
            const lastElement = eventContent.lastElementChild;
            eventContent.insertBefore(downloadBtn, lastElement);
        }
    }

    /**
     * Add download button to event detail page
     */
    addDownloadButtonToEventDetail() {
        const eventActions = document.querySelector('.event-actions');
        if (eventActions) {
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'download-event-btn btn btn-secondary';
            downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download Event';
            downloadBtn.onclick = () => this.downloadCurrentEvent();
            
            eventActions.appendChild(downloadBtn);
        }
    }

    /**
     * Download event from card (extract data from DOM)
     */
    downloadEventFromCard(card) {
        try {
            // Extract event data from card
            const title = card.querySelector('h3')?.textContent || 'Event';
            const dateElement = card.querySelector('.event-date-small');
            const timeElement = card.querySelector('.event-time');
            const locationElement = card.querySelector('.event-location');
            
            // Parse date
            let eventDate = new Date();
            if (dateElement) {
                const month = dateElement.querySelector('.month')?.textContent;
                const day = dateElement.querySelector('.day')?.textContent;
                if (month && day) {
                    const monthIndex = this.getMonthIndex(month);
                    const currentYear = new Date().getFullYear();
                    eventDate = new Date(currentYear, monthIndex, parseInt(day));
                }
            }

            // Parse time
            let eventTime = '12:00';
            if (timeElement) {
                const timeText = timeElement.textContent;
                const timeMatch = timeText.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i);
                if (timeMatch) {
                    eventTime = timeMatch[1];
                }
            }

            // Get location
            const location = locationElement?.textContent?.replace(/^\s*📍\s*/, '') || 'Church Location';

            // Get description
            const description = card.querySelector('p')?.textContent || '';

            const eventData = {
                title,
                date: eventDate,
                time: eventTime,
                location,
                description
            };

            this.generateAndDownloadICS(eventData);
        } catch (error) {
            console.error('Error downloading event from card:', error);
            alert('Unable to download event. Please try again.');
        }
    }

    /**
     * Download current event from detail page
     */
    downloadCurrentEvent() {
        try {
            // Get event ID from URL
            const urlParams = new URLSearchParams(window.location.search);
            const eventId = urlParams.get('id');
            
            if (eventId) {
                // Get event from localStorage
                const events = JSON.parse(localStorage.getItem('events') || '[]');
                const event = events.find(e => e.id === eventId && e.status === 'published');
                
                if (event) {
                    this.generateAndDownloadICS(event);
                } else {
                    throw new Error('Event not found');
                }
            } else {
                // Extract from DOM if no ID available
                const title = document.querySelector('.event-title')?.textContent || 'Event';
                const dateElement = document.querySelector('.event-date');
                const timeElement = document.querySelector('.event-time');
                const locationElement = document.querySelector('.event-location');
                const descriptionElement = document.querySelector('.event-content');

                const eventData = {
                    title,
                    date: dateElement?.textContent || '',
                    time: timeElement?.textContent || '',
                    location: locationElement?.textContent || '',
                    description: descriptionElement?.textContent || ''
                };

                this.generateAndDownloadICS(eventData);
            }
        } catch (error) {
            console.error('Error downloading current event:', error);
            alert('Unable to download event. Please try again.');
        }
    }

    /**
     * Download all published events
     */
    downloadAllEvents() {
        try {
            const events = JSON.parse(localStorage.getItem('events') || '[]');
            const publishedEvents = events.filter(event => event.status === 'published');
            
            if (publishedEvents.length === 0) {
                alert('No events available for download.');
                return;
            }

            // Generate ICS for multiple events
            this.generateAndDownloadMultipleICS(publishedEvents);
        } catch (error) {
            console.error('Error downloading all events:', error);
            alert('Unable to download events. Please try again.');
        }
    }

    /**
     * Generate and download ICS file for a single event
     */
    generateAndDownloadICS(eventData) {
        const icsContent = this.generateICSContent([eventData]);
        const filename = this.sanitizeFilename(`${eventData.title}-${this.formatDateForFilename(eventData.date)}.ics`);
        this.downloadFile(icsContent, filename, 'text/calendar');
    }

    /**
     * Generate and download ICS file for multiple events
     */
    generateAndDownloadMultipleICS(events) {
        const icsContent = this.generateICSContent(events);
        const filename = `church-events-${this.formatDateForFilename(new Date())}.ics`;
        this.downloadFile(icsContent, filename, 'text/calendar');
    }

    /**
     * Generate ICS file content
     */
    generateICSContent(events) {
        let icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Apostolic Church International//Event Calendar//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH'
        ];

        events.forEach(event => {
            const eventLines = this.generateEventLines(event);
            icsContent = icsContent.concat(eventLines);
        });

        icsContent.push('END:VCALENDAR');
        return icsContent.join('\r\n');
    }

    /**
     * Generate ICS lines for a single event
     */
    generateEventLines(event) {
        const eventDate = new Date(event.date);
        const eventId = event.id || this.generateEventId(event);
        
        // Parse time if available
        let startDateTime = new Date(eventDate);
        let endDateTime = new Date(eventDate);
        
        if (event.time) {
            const timeStr = event.time.toString();
            const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
            if (timeMatch) {
                let hours = parseInt(timeMatch[1]);
                const minutes = parseInt(timeMatch[2]);
                const ampm = timeMatch[3];
                
                if (ampm && ampm.toUpperCase() === 'PM' && hours !== 12) {
                    hours += 12;
                } else if (ampm && ampm.toUpperCase() === 'AM' && hours === 12) {
                    hours = 0;
                }
                
                startDateTime.setHours(hours, minutes, 0, 0);
                endDateTime.setHours(hours + 1, minutes, 0, 0); // Default 1 hour duration
            }
        }

        const formatDateTime = (date) => {
            return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        };

        return [
            'BEGIN:VEVENT',
            `UID:${eventId}@apostolicchurch.org`,
            `DTSTART:${formatDateTime(startDateTime)}`,
            `DTEND:${formatDateTime(endDateTime)}`,
            `SUMMARY:${this.escapeICSText(event.title || 'Church Event')}`,
            `DESCRIPTION:${this.escapeICSText(event.description || '')}`,
            `LOCATION:${this.escapeICSText(event.location || 'Apostolic Church International')}`,
            `ORGANIZER:CN=Apostolic Church International:MAILTO:louisvilleapostolic@gmail.com`,
            `CREATED:${formatDateTime(new Date())}`,
            `LAST-MODIFIED:${formatDateTime(new Date())}`,
            'STATUS:CONFIRMED',
            'TRANSP:OPAQUE',
            'END:VEVENT'
        ];
    }

    /**
     * Helper methods
     */
    getMonthIndex(monthStr) {
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
                       'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        return months.indexOf(monthStr.toUpperCase());
    }

    generateEventId(event) {
        return `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    sanitizeFilename(filename) {
        return filename.replace(/[^a-z0-9.-]/gi, '_').toLowerCase();
    }

    formatDateForFilename(date) {
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    }

    escapeICSText(text) {
        return text.replace(/[\\,;]/g, '\\$&').replace(/\n/g, '\\n');
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.eventDownloadManager = new EventDownloadManager();
});

// Re-initialize when events are updated
window.addEventListener('contentSync', function(event) {
    if (event.detail.contentType === 'events' || event.detail.contentType === 'all') {
        setTimeout(() => {
            if (window.eventDownloadManager) {
                window.eventDownloadManager.addDownloadButtonsToEvents();
            }
        }, 100);
    }
});
