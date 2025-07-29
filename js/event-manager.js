// Event Manager for handling event-related operations
const EventManager = {
    /**
     * Load events to table
     */
    loadEventTable: function() {
        const tableBody = document.getElementById('eventTableBody');
        if (!tableBody) return;
        
        try {
            const events = DataService.getAll('events');
            
            if (events.length > 0) {
                // Sort by date (upcoming first)
                const sortedEvents = [...events].sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
                
                tableBody.innerHTML = sortedEvents.map(event => `
                    <tr>
                        <td>${event.title}</td>
                        <td>${this.formatDate(event.date)}</td>
                        <td>${event.location || 'N/A'}</td>
                        <td><span class="status-badge ${event.status}">${event.status}</span></td>
                        <td>
                            <button class="btn-icon edit-event" data-id="${event.id}"><i class="fas fa-edit"></i></button>
                            <button class="btn-icon delete-event" data-id="${event.id}"><i class="fas fa-trash-alt"></i></button>
                        </td>
                    </tr>
                `).join('');
                
                // Add event listeners for edit buttons
                document.querySelectorAll('.edit-event').forEach(btn => {
                    btn.addEventListener('click', () => this.editEvent(btn.getAttribute('data-id')));
                });
                
                // Add event listeners for delete buttons
                document.querySelectorAll('.delete-event').forEach(btn => {
                    btn.addEventListener('click', () => this.deleteEvent(btn.getAttribute('data-id')));
                });
            } else {
                tableBody.innerHTML = '<tr><td colspan="5" class="empty-table">No events found</td></tr>';
            }
        } catch (error) {
            console.error('Error loading event table:', error);
            showToast('error', 'Failed to load events');
        }
    },
    
    /**
     * Create a new event
     * @param {Event} event - Form submit event
     */
    createEvent: function(event) {
        event.preventDefault();
        
        try {
            // Get form data
            const form = event.target;
            const title = form.querySelector('#eventTitle').value.trim();
            const date = form.querySelector('#eventDate').value;
            const time = form.querySelector('#eventTime').value;
            const location = form.querySelector('#eventLocation').value.trim();
            const description = tinymce.get('eventDescription').getContent();
            const imageUrl = form.querySelector('#eventImage').value.trim();
            const status = form.querySelector('#eventStatus').value;
            
            // Validate form data
            if (!title) {
                showToast('error', 'Title is required');
                return;
            }
            
            if (!date) {
                showToast('error', 'Date is required');
                return;
            }
            
            if (!location) {
                showToast('error', 'Location is required');
                return;
            }
            
            // Validate URL if provided
            if (imageUrl && !this.isValidUrl(imageUrl)) {
                showToast('error', 'Please enter a valid image URL');
                return;
            }
            
            // Combine date and time
            const dateTime = time ? `${date}T${time}:00` : `${date}T00:00:00`;
            
            // Create event
            const newEvent = DataService.create('events', {
                title,
                date: dateTime,
                location,
                description,
                imageUrl,
                status
            });
            
            // Close modal
            document.getElementById('eventFormModal').style.display = 'none';
            
            // Reset form
            form.reset();
            tinymce.get('eventDescription').setContent('');
            
            // Reload event table
            this.loadEventTable();
            
            // Reload dashboard data
            loadDashboardData();
            
            // Show success message
            showToast('success', 'Event created successfully');
        } catch (error) {
            console.error('Error creating event:', error);
            showToast('error', 'Failed to create event');
        }
    },
    
    /**
     * Format date for display
     * @param {string} dateString - ISO date string
     * @returns {string} Formatted date
     */
    formatDate: function(dateString) {
        if (!dateString) return 'N/A';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Invalid Date';
        }
    },
    
    /**
     * Validate URL
     * @param {string} url - URL to validate
     * @returns {boolean} True if valid, false otherwise
     */
    isValidUrl: function(url) {
        try {
            new URL(url);
            return true;
        } catch (error) {
            return false;
        }
    },
    
    /**
     * Initialize event manager
     */
    init: function() {
        // Load event table
        this.loadEventTable();
        
        // Add event listener for new event button
        const newEventBtn = document.getElementById('newEventBtn');
        if (newEventBtn) {
            newEventBtn.addEventListener('click', () => {
                // Reset form
                const form = document.getElementById('eventForm');
                if (form) {
                    form.reset();
                    document.getElementById('eventId').value = '';
                    if (tinymce.get('eventDescription')) {
                        tinymce.get('eventDescription').setContent('');
                    }
                }
                
                // Show modal
                document.getElementById('eventFormModal').style.display = 'block';
            });
        }
        
        // Add event listener for event form submission
        const eventForm = document.getElementById('eventForm');
        if (eventForm) {
            eventForm.addEventListener('submit', (event) => this.createEvent(event));
        }
    }
};

