document.addEventListener('DOMContentLoaded', function() {
    // Load tables if we're on the admin dashboard
    if (document.querySelector('.admin-dashboard')) {
        loadBlogTable();
        loadEventTable();
        loadSermonTable();
    }
});

// Function to load blog table
function loadBlogTable() {
    const blogTableBody = document.getElementById('blogTableBody');
    if (!blogTableBody) {
        console.error('Blog table body not found in DOM');
        return;
    }
    
    try {
        const blogs = JSON.parse(localStorage.getItem('blogs') || '[]');
        
        if (blogs.length === 0) {
            blogTableBody.innerHTML = '<tr><td colspan="5" class="text-center">No blog posts found</td></tr>';
            return;
        }
        
        // Sort blogs by date (newest first)
        blogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        let html = '';
        blogs.forEach(blog => {
            html += `
                <tr>
                    <td>${blog.title}</td>
                    <td>${formatDate(blog.createdAt)}</td>
                    <td><span class="status-badge ${blog.status}">${blog.status}</span></td>
                    <td>
                        <button class="btn btn-sm btn-primary edit-blog" data-id="${blog.id}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-danger delete-blog" data-id="${blog.id}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </td>
                </tr>
            `;
        });
        
        blogTableBody.innerHTML = html;
        
        // Add event listeners for edit buttons
        document.querySelectorAll('.edit-blog').forEach(button => {
            button.addEventListener('click', function() {
                const blogId = this.dataset.id;
                editBlog(blogId);
            });
        });
        
        console.log(`Admin: Loaded ${blogs.length} blogs into table`);
    } catch (error) {
        console.error('Error loading blog table:', error);
        blogTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading blog posts</td></tr>';
    }
}

// Function to load event table
function loadEventTable() {
    const eventTableBody = document.getElementById('eventTableBody');
    if (!eventTableBody) {
        console.error('Event table body not found in DOM');
        return;
    }
    
    try {
        const events = JSON.parse(localStorage.getItem('events') || '[]');
        
        if (events.length === 0) {
            eventTableBody.innerHTML = '<tr><td colspan="5" class="text-center">No events found</td></tr>';
            return;
        }
        
        // Sort events by date (upcoming first)
        events.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        let html = '';
        events.forEach(event => {
            html += `
                <tr>
                    <td>${event.title}</td>
                    <td>${formatDate(event.date)}</td>
                    <td>${event.location}</td>
                    <td><span class="status-badge ${event.status}">${event.status}</span></td>
                    <td>
                        <button class="btn btn-sm btn-primary edit-event" data-id="${event.id}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-danger delete-event" data-id="${event.id}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </td>
                </tr>
            `;
        });
        
        eventTableBody.innerHTML = html;
        
        // Add event listeners for edit buttons
        document.querySelectorAll('.edit-event').forEach(button => {
            button.addEventListener('click', function() {
                const eventId = this.dataset.id;
                editEvent(eventId);
            });
        });
        
        console.log(`Admin: Loaded ${events.length} events into table`);
    } catch (error) {
        console.error('Error loading event table:', error);
        eventTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading events</td></tr>';
    }
}

// Function to load sermon table
function loadSermonTable() {
    const sermonTableBody = document.getElementById('sermonTableBody');
    if (!sermonTableBody) {
        console.error('Sermon table body not found in DOM');
        return;
    }
    
    try {
        const sermons = JSON.parse(localStorage.getItem('sermons') || '[]');
        
        if (sermons.length === 0) {
            sermonTableBody.innerHTML = '<tr><td colspan="5" class="text-center">No sermons found</td></tr>';
            return;
        }
        
        // Sort sermons by date (newest first)
        sermons.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        let html = '';
        sermons.forEach(sermon => {
            html += `
                <tr>
                    <td>${sermon.title}</td>
                    <td>${sermon.speaker}</td>
                    <td>${formatDate(sermon.date)}</td>
                    <td><span class="status-badge ${sermon.status}">${sermon.status}</span></td>
                    <td>
                        <button class="btn btn-sm btn-primary edit-sermon" data-id="${sermon.id}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-danger delete-sermon" data-id="${sermon.id}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </td>
                </tr>
            `;
        });
        
        sermonTableBody.innerHTML = html;
        
        // Add event listeners for edit buttons
        document.querySelectorAll('.edit-sermon').forEach(button => {
            button.addEventListener('click', function() {
                const sermonId = this.dataset.id;
                editSermon(sermonId);
            });
        });
        
        console.log(`Admin: Loaded ${sermons.length} sermons into table`);
    } catch (error) {
        console.error('Error loading sermon table:', error);
        sermonTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading sermons</td></tr>';
    }
}

// Function to edit a blog post
function editBlog(blogId) {
    try {
        const blogs = JSON.parse(localStorage.getItem('blogs') || '[]');
        const blog = blogs.find(b => b.id === blogId);
        
        if (!blog) {
            console.error('Blog post not found:', blogId);
            return;
        }
        
        // Fill form with blog data
        const blogForm = document.getElementById('blogForm');
        if (!blogForm) {
            console.error('Blog form not found in DOM');
            return;
        }
        
        document.getElementById('blogId').value = blog.id;
        document.getElementById('blogTitle').value = blog.title;
        document.getElementById('blogSummary').value = blog.summary;
        document.getElementById('blogContent').value = blog.content;
        document.getElementById('blogImageUrl').value = blog.imageUrl || '';
        document.getElementById('blogStatus').value = blog.status;
        
        // Show form modal
        const blogModal = new bootstrap.Modal(document.getElementById('blogModal'));
        blogModal.show();
        
        console.log('Editing blog:', blog.title);
    } catch (error) {
        console.error('Error editing blog:', error);
    }
}

// Function to edit an event
function editEvent(eventId) {
    try {
        const events = JSON.parse(localStorage.getItem('events') || '[]');
        const event = events.find(e => e.id === eventId);
        
        if (!event) {
            console.error('Event not found:', eventId);
            return;
        }
        
        // Fill form with event data
        const eventForm = document.getElementById('eventForm');
        if (!eventForm) {
            console.error('Event form not found in DOM');
            return;
        }
        
        document.getElementById('eventId').value = event.id;
        document.getElementById('eventTitle').value = event.title;
        document.getElementById('eventDate').value = event.date.split('T')[0];
        document.getElementById('eventLocation').value = event.location;
        document.getElementById('eventDescription').value = event.description;
        document.getElementById('eventImageUrl').value = event.imageUrl || '';
        document.getElementById('eventStatus').value = event.status;
        
        // Show form modal
        const eventModal = new bootstrap.Modal(document.getElementById('eventModal'));
        eventModal.show();
        
        console.log('Editing event:', event.title);
    } catch (error) {
        console.error('Error editing event:', error);
    }
}

// Function to edit a sermon
function editSermon(sermonId) {
    try {
        const sermons = JSON.parse(localStorage.getItem('sermons') || '[]');
        const sermon = sermons.find(s => s.id === sermonId);
        
        if (!sermon) {
            console.error('Sermon not found:', sermonId);
            return;
        }
        
        // Fill form with sermon data
        const sermonForm = document.getElementById('sermonForm');
        if (!sermonForm) {
            console.error('Sermon form not found in DOM');
            return;
        }
        
        document.getElementById('sermonId').value = sermon.id;
        document.getElementById('sermonTitle').value = sermon.title;
        document.getElementById('sermonSpeaker').value = sermon.speaker;
        document.getElementById('sermonDate').value = sermon.date.split('T')[0];
        document.getElementById('sermonDescription').value = sermon.description;
        document.getElementById('sermonVideoUrl').value = sermon.videoUrl || '';
        document.getElementById('sermonAudioUrl').value = sermon.audioUrl || '';
        document.getElementById('sermonThumbnailUrl').value = sermon.thumbnailUrl || '';
        document.getElementById('sermonStatus').value = sermon.status;
        
        // Show form modal
        const sermonModal = new bootstrap.Modal(document.getElementById('sermonModal'));
        sermonModal.show();
        
        console.log('Editing sermon:', sermon.title);
    } catch (error) {
        console.error('Error editing sermon:', error);
    }
}

// Helper function to format dates
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateString;
    }
}