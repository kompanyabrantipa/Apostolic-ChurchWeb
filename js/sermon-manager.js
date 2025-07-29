// Sermon Manager for handling sermon-related operations
const SermonManager = {
    /**
     * Load sermons to table
     */
    loadSermonTable: function() {
        const tableBody = document.getElementById('sermonTableBody');
        if (!tableBody) return;
        
        try {
            const sermons = DataService.getAll('sermons');
            
            if (sermons.length > 0) {
                // Sort by date (newest first)
                const sortedSermons = [...sermons].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
                
                tableBody.innerHTML = sortedSermons.map(sermon => `
                    <tr>
                        <td>${sermon.title}</td>
                        <td>${sermon.speaker}</td>
                        <td>${this.formatDate(sermon.date)}</td>
                        <td><span class="status-badge ${sermon.status}">${sermon.status}</span></td>
                        <td>
                            <button class="btn-icon edit-sermon" data-id="${sermon.id}"><i class="fas fa-edit"></i></button>
                            <button class="btn-icon delete-sermon" data-id="${sermon.id}"><i class="fas fa-trash-alt"></i></button>
                        </td>
                    </tr>
                `).join('');
                
                // Add event listeners for edit buttons
                document.querySelectorAll('.edit-sermon').forEach(btn => {
                    btn.addEventListener('click', () => this.editSermon(btn.getAttribute('data-id')));
                });
                
                // Add event listeners for delete buttons
                document.querySelectorAll('.delete-sermon').forEach(btn => {
                    btn.addEventListener('click', () => this.deleteSermon(btn.getAttribute('data-id')));
                });
            } else {
                tableBody.innerHTML = '<tr><td colspan="5" class="empty-table">No sermons found</td></tr>';
            }
        } catch (error) {
            console.error('Error loading sermon table:', error);
            showToast('error', 'Failed to load sermons');
        }
    },
    
    /**
     * Create a new sermon
     * @param {Event} event - Form submit event
     */
    createSermon: function(event) {
        event.preventDefault();
        
        try {
            // Get form data
            const form = event.target;
            const title = form.querySelector('#sermonTitle').value.trim();
            const speaker = form.querySelector('#sermonSpeaker').value.trim();
            const date = form.querySelector('#sermonDate').value;
            const description = tinymce.get('sermonDescription') ? 
                tinymce.get('sermonDescription').getContent() : 
                form.querySelector('#sermonDescription').value.trim();
            const videoUrl = form.querySelector('#sermonVideoUrl').value.trim();
            const audioUrl = form.querySelector('#sermonAudioUrl').value.trim();
            const thumbnailUrl = form.querySelector('#sermonThumbnail').value.trim();
            const status = form.querySelector('#sermonStatus').value;
            
            // Validate form data
            if (!title) {
                showToast('error', 'Title is required');
                return;
            }
            
            if (!speaker) {
                showToast('error', 'Speaker is required');
                return;
            }
            
            if (!date) {
                showToast('error', 'Date is required');
                return;
            }
            
            // Validate URLs if provided
            if (videoUrl && !this.isValidUrl(videoUrl)) {
                showToast('error', 'Please enter a valid video URL');
                return;
            }
            
            if (audioUrl && !this.isValidUrl(audioUrl)) {
                showToast('error', 'Please enter a valid audio URL');
                return;
            }
            
            if (thumbnailUrl && !this.isValidUrl(thumbnailUrl)) {
                showToast('error', 'Please enter a valid thumbnail URL');
                return;
            }
            
            // Create sermon
            const newSermon = DataService.create('sermons', {
                title,
                speaker,
                date,
                description,
                videoUrl,
                audioUrl,
                thumbnailUrl,
                status
            });
            
            // Close modal
            document.getElementById('sermonFormModal').style.display = 'none';
            
            // Reset form
            form.reset();
            if (tinymce.get('sermonDescription')) {
                tinymce.get('sermonDescription').setContent('');
            }
            
            // Reload sermon table
            this.loadSermonTable();
            
            // Reload dashboard data
            loadDashboardData();
            
            // Show success message
            showToast('success', 'Sermon created successfully');
        } catch (error) {
            console.error('Error creating sermon:', error);
            showToast('error', 'Failed to create sermon');
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
                day: 'numeric'
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
     * Initialize sermon manager
     */
    init: function() {
        // Load sermon table
        this.loadSermonTable();
        
        // Add event listener for new sermon button
        const newSermonBtn = document.getElementById('newSermonBtn');
        if (newSermonBtn) {
            newSermonBtn.addEventListener('click', () => {
                // Reset form
                const form = document.getElementById('sermonForm');
                if (form) {
                    form.reset();
                    document.getElementById('sermonId').value = '';
                    if (tinymce.get('sermonDescription')) {
                        tinymce.get('sermonDescription').setContent('');
                    }
                }
                
                // Show modal
                document.getElementById('sermonFormModal').style.display = 'block';
            });
        }
        
        // Add event listener for sermon form submission
        const sermonForm = document.getElementById('sermonForm');
        if (sermonForm) {
            sermonForm.addEventListener('submit', (event) => this.createSermon(event));
        }
    }
};


