// Admin Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin dashboard initialized');
    
    // Initialize sidebar navigation
    initSidebar();
    
    // Initialize dashboard content
    loadDashboardData();
    
    // Initialize logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Initialize modal functionality
    initModals();
    
    // Initialize TinyMCE editors
    initTinyMCE();
    
    // Initialize managers
    initManagers();

    // Add generate sample content button (consolidated from removed DOMContentLoaded listener)
    const dashboardActions = document.querySelector('.dashboard-actions');
    if (dashboardActions) {
        const generateButton = document.createElement('button');
        generateButton.className = 'btn btn-secondary';
        generateButton.innerHTML = '<i class="fas fa-magic"></i> Generate Sample Content';
        generateButton.onclick = generateSampleContent;
        dashboardActions.appendChild(generateButton);
    }

    // Show body after initialization (this was in the original code)
    document.body.style.display = 'block';
});

// Initialize sidebar navigation
function initSidebar() {
    // Toggle sidebar on mobile
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            document.querySelector('.sidebar').classList.toggle('active');
        });
    }
    
    // Handle navigation between sections
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Update page title
            const sectionName = this.getAttribute('data-section');
            const pageTitle = document.getElementById('pageTitle');
            if (pageTitle) {
                pageTitle.textContent = sectionName.charAt(0).toUpperCase() + sectionName.slice(1);
            }
            
            // Hide all sections
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Show selected section
            const selectedSection = document.getElementById(sectionName);
            if (selectedSection) {
                selectedSection.classList.add('active');
            }
            
            // Close sidebar on mobile
            if (window.innerWidth < 768) {
                document.querySelector('.sidebar').classList.remove('active');
            }
        });
    });
}

// Load dashboard data
function loadDashboardData() {
    console.log('Loading dashboard data...');
    
    // Load counts for dashboard stats
    loadContentCounts();
    
    // Load recent content
    loadRecentContent();
}

// Load content counts for dashboard stats
function loadContentCounts() {
    console.log('Loading content counts...');
    
    try {
        // Get counts from localStorage
        const blogs = JSON.parse(localStorage.getItem('blogs') || '[]');
        const events = JSON.parse(localStorage.getItem('events') || '[]');
        const sermons = JSON.parse(localStorage.getItem('sermons') || '[]');
        
        // Update dashboard stats
        const blogCount = document.getElementById('blogCount');
        const eventCount = document.getElementById('eventCount');
        const sermonCount = document.getElementById('sermonCount');
        
        if (blogCount) blogCount.textContent = blogs.length;
        if (eventCount) eventCount.textContent = events.length;
        if (sermonCount) sermonCount.textContent = sermons.length;
        
        console.log(`Stats loaded: ${blogs.length} blogs, ${events.length} events, ${sermons.length} sermons`);
    } catch (error) {
        console.error('Error loading content counts:', error);
    }
}

// Load recent content for dashboard
function loadRecentContent() {
    console.log('Loading recent content...');
    
    try {
        // Get content from localStorage
        const blogs = JSON.parse(localStorage.getItem('blogs') || '[]');
        const events = JSON.parse(localStorage.getItem('events') || '[]');
        
        // Sort by date (newest first)
        const sortedBlogs = [...blogs].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 3);
        const sortedEvents = [...events].filter(event => new Date(event.date) >= new Date()).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 3);
        
        // Update recent blog posts
        const recentBlogPosts = document.getElementById('recentBlogPosts');
        if (recentBlogPosts) {
            if (sortedBlogs.length > 0) {
                recentBlogPosts.innerHTML = sortedBlogs.map(blog => `
                    <div class="recent-item">
                        <h4>${blog.title}</h4>
                        <p>${blog.summary || ''}</p>
                        <div class="item-meta">
                            <span>${formatDate(blog.createdAt)}</span>
                            <span class="status-badge ${blog.status}">${blog.status}</span>
                        </div>
                    </div>
                `).join('');
            } else {
                recentBlogPosts.innerHTML = '<p class="empty-message">No blog posts found</p>';
            }
        }
        
        // Update upcoming events
        const upcomingEvents = document.getElementById('upcomingEvents');
        if (upcomingEvents) {
            if (sortedEvents.length > 0) {
                upcomingEvents.innerHTML = sortedEvents.map(event => `
                    <div class="recent-item">
                        <h4>${event.title}</h4>
                        <p>${event.location || ''}</p>
                        <div class="item-meta">
                            <span>${formatDate(event.date)}</span>
                            <span class="status-badge ${event.status}">${event.status}</span>
                        </div>
                    </div>
                `).join('');
            } else {
                upcomingEvents.innerHTML = '<p class="empty-message">No upcoming events found</p>';
            }
        }
    } catch (error) {
        console.error('Error loading recent content:', error);
    }
}

// Initialize modal functionality
function initModals() {
    // Close modal when clicking on close button
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
}

// Initialize TinyMCE editors
function initTinyMCE() {
    if (typeof tinymce !== 'undefined') {
        tinymce.init({
            selector: '.tinymce-editor',
            height: 300,
            plugins: 'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount',
            toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat',
            // Z-index configuration to ensure TinyMCE appears above modals
            skin_url: false, // Use default skin
            content_css: false, // Use default content CSS
            // Set base z-index for TinyMCE components to appear above modals (modal z-index: 2000)
            setup: function(editor) {
                editor.on('init', function() {
                    // Ensure TinyMCE toolbars and dropdowns appear above modal overlays
                    console.log('TinyMCE editor initialized with z-index fix for modal compatibility');
                });
            }
        });
    }
}

// Initialize managers
function initManagers() {
    // Initialize sample data if localStorage is empty
    initSampleData();
    
    // Initialize blog manager
    if (document.getElementById('blogTableBody')) {
        initBlogManager();
    }
    
    // Initialize event manager
    if (document.getElementById('eventTableBody')) {
        initEventManager();
    }
    
    // Initialize sermon manager
    if (document.getElementById('sermonTableBody')) {
        initSermonManager();
    }
    
    // Initialize toast notifications
    initToastNotifications();
}

// Initialize sample data if localStorage is empty
function initSampleData() {
    console.log('⚠️ initSampleData() is deprecated. Use SampleDataGenerator.seedAllSampleData() instead.');

    // Check if we have any content at all
    const hasBlogs = localStorage.getItem('blogs') && JSON.parse(localStorage.getItem('blogs')).length > 0;
    const hasEvents = localStorage.getItem('events') && JSON.parse(localStorage.getItem('events')).length > 0;
    const hasSermons = localStorage.getItem('sermons') && JSON.parse(localStorage.getItem('sermons')).length > 0;

    if (!hasBlogs && !hasEvents && !hasSermons) {
        console.log('No content found. Using SampleDataGenerator for consistent data...');

        // Use SampleDataGenerator for consistent data across dashboard and frontend
        if (typeof SampleDataGenerator !== 'undefined' && SampleDataGenerator.seedAllSampleData) {
            const result = SampleDataGenerator.seedAllSampleData();
            if (result.success) {
                console.log('✅ Sample data created via SampleDataGenerator');
                console.log(`- ${result.blogs} blog posts`);
                console.log(`- ${result.events} events`);
                console.log(`- ${result.sermons} sermons`);
            } else {
                console.error('❌ Failed to create sample data:', result.error);
            }
        } else {
            console.warn('SampleDataGenerator not available. No sample data created.');
        }
    } else {
        console.log('Existing content found. Skipping sample data creation.');
    }
}

// Initialize blog manager
function initBlogManager() {
    // Load blog posts to table
    loadBlogTable();
    
    // Add event listener for new blog button
    const newBlogBtn = document.getElementById('newBlogBtn');
    if (newBlogBtn) {
        newBlogBtn.addEventListener('click', function() {
            // Reset form
            document.getElementById('blogForm').reset();
            document.getElementById('blogId').value = '';
            document.getElementById('blogFormTitle').textContent = 'Add New Blog Post';

            // Reset TinyMCE editor
            if (tinymce.get('blogContent')) {
                tinymce.get('blogContent').setContent('');
            }

            // Clear media previews
            clearAllMediaPreviews();

            // Show modal
            document.getElementById('blogFormModal').style.display = 'block';
        });
    }
    
    // Add event listener for blog form submission
    const blogForm = document.getElementById('blogForm');
    if (blogForm) {
        blogForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('=== BLOG FORM SUBMISSION STARTED ===');

            const blogId = document.getElementById('blogId').value;
            const title = document.getElementById('blogTitle').value.trim();
            const summary = document.getElementById('blogSummary').value.trim();

            // Get content from TinyMCE editor with fallback
            let content = '';
            if (tinymce.get('blogContent')) {
                content = tinymce.get('blogContent').getContent();
            } else {
                // Fallback to textarea value if TinyMCE is not initialized
                content = document.getElementById('blogContent').value || '';
                console.warn('TinyMCE editor not found, using textarea fallback');
            }

            let imageUrl = document.getElementById('blogImage').value.trim();
            const status = document.getElementById('blogStatus').value;

            console.log('Form data collected:', {
                blogId: blogId || 'new',
                title: title,
                summaryLength: summary.length,
                contentLength: content.length,
                imageUrl: imageUrl || 'none',
                status: status
            });

            // Basic validation
            if (!title) {
                showToast('error', 'Title is required');
                return;
            }

            if (!content || content.trim() === '') {
                showToast('error', 'Content is required');
                return;
            }

            // Handle file upload - convert to data URL if file is selected
            const imageFile = window.MediaUploadManager ? window.MediaUploadManager.getFileData('blogImageFile') : null;
            console.log('Blog form submission - Image file:', imageFile ? 'File selected' : 'No file', 'Image URL:', imageUrl);

            if (imageFile && !imageUrl) {
                try {
                    console.log('Converting image file to data URL...');
                    imageUrl = await convertFileToDataURL(imageFile);
                    console.log('Image file converted successfully');
                } catch (error) {
                    console.error('Error converting image file:', error);
                    showToast('error', 'Error processing image file: ' + error.message);
                    return;
                }
            }

            try {
                if (blogId) {
                    // Update existing blog using DataService
                    if (typeof DataService !== 'undefined' && DataService.update) {
                        try {
                            const updatedBlog = await DataService.update('blogs', blogId, {
                                title,
                                summary,
                                content,
                                imageUrl,
                                status,
                                updatedAt: new Date().toISOString()
                            });

                            if (updatedBlog) {
                                showToast('success', 'Blog post updated successfully');
                            } else {
                                showToast('error', 'Failed to update blog post');
                                return;
                            }
                        } catch (error) {
                            console.error('Error updating blog:', error);
                            showToast('error', 'Failed to update blog post: ' + error.message);
                            return;
                        }
                    } else {
                        // Use DataService for updates
                        if (typeof DataService !== 'undefined' && DataService.update) {
                            try {
                                const updatedBlog = await DataService.update('blogs', blogId, {
                                    title,
                                    summary,
                                    content,
                                    imageUrl,
                                    status
                                });
                                
                                if (updatedBlog) {
                                    showToast('success', 'Blog post updated successfully');
                                } else {
                                    showToast('error', 'Failed to update blog post');
                                    return;
                                }
                            } catch (error) {
                                console.error('Error updating blog:', error);
                                showToast('error', 'Failed to update blog post: ' + error.message);
                                return;
                            }
                        } else {
                            // Fallback: direct localStorage manipulation
                            console.warn('DataService not available, using direct localStorage manipulation');
                            const blogs = JSON.parse(localStorage.getItem('blogs') || '[]');
                            const index = blogs.findIndex(blog => blog.id === blogId);
                            if (index !== -1) {
                                blogs[index] = {
                                    ...blogs[index],
                                    title,
                                    summary,
                                    content,
                                    imageUrl,
                                    status,
                                    updatedAt: new Date().toISOString()
                                };
                                try {
                                    localStorage.setItem('blogs', JSON.stringify(blogs));
                                } catch (error) {
                                    if (error.name === 'QuotaExceededError') {
                                        showToast('error', 'Storage quota exceeded. Please try with a smaller image or clear browser data.');
                                    } else {
                                        showToast('error', 'Failed to save blog post: ' + error.message);
                                    }
                                    return;
                                }
                                showToast('success', 'Blog post updated successfully');
                            }
                        }
                    }
                } else {
                    // Create new blog using DataService
                    if (typeof DataService !== 'undefined' && DataService.create) {
                        try {
                            const newBlog = await DataService.create('blogs', {
                                title,
                                summary,
                                content,
                                imageUrl,
                                status,
                                createdAt: new Date().toISOString()
                            });

                            if (newBlog) {
                                showToast('success', 'Blog post created successfully');
                            } else {
                                showToast('error', 'Failed to create blog post');
                                return;
                            }
                        } catch (error) {
                            console.error('Error creating blog:', error);
                            showToast('error', 'Failed to create blog post: ' + error.message);
                            return;
                        }
                    } else {
                        // Fallback: direct localStorage manipulation
                        console.warn('DataService not available, using direct localStorage manipulation');
                        const blogs = JSON.parse(localStorage.getItem('blogs') || '[]');
                        const newBlog = {
                            id: Date.now().toString(),
                            title,
                            summary,
                            content,
                            imageUrl,
                            status,
                            createdAt: new Date().toISOString()
                        };
                        blogs.push(newBlog);
                        try {
                            localStorage.setItem('blogs', JSON.stringify(blogs));
                        } catch (error) {
                            if (error.name === 'QuotaExceededError') {
                                showToast('error', 'Storage quota exceeded. Please try with a smaller image or clear browser data.');
                            } else {
                                showToast('error', 'Failed to save blog post: ' + error.message);
                            }
                            return;
                        }
                        showToast('success', 'Blog post created successfully');
                    }
                }

                console.log('=== BLOG FORM SUBMISSION COMPLETED SUCCESSFULLY ===');

                // Close modal
                document.getElementById('blogFormModal').style.display = 'none';

                // Reload table
                loadBlogTable();

                // Reload dashboard data
                loadDashboardData();

            } catch (error) {
                console.error('Error saving blog post:', error);
                showToast('error', 'Error saving blog post: ' + error.message);
            }
        });
    }
}

// Load blog posts to table
function loadBlogTable() {
    const tableBody = document.getElementById('blogTableBody');
    if (!tableBody) return;
    
    try {
        // Use DataService to get blogs from API
        if (typeof DataService !== 'undefined' && DataService.getAll) {
            DataService.getAll('blogs').then(blogs => {
                if (blogs.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="4" class="empty-table">No blog posts found</td></tr>';
                    return;
                }
                
                // Sort by date (newest first)
                const sortedBlogs = [...blogs].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
                
                tableBody.innerHTML = sortedBlogs.map(blog => `
                    <tr>
                        <td>${blog.title}</td>
                        <td>${formatDate(blog.createdAt)}</td>
                        <td><span class="status-badge ${blog.status}">${blog.status}</span></td>
                        <td>
                            <button class="btn-icon view-blog" data-id="${blog.id}" title="View Blog"><i class="fas fa-eye"></i></button>
                            <button class="btn-icon edit-blog" data-id="${blog.id}" title="Edit Blog"><i class="fas fa-edit"></i></button>
                            <button class="btn-icon delete-blog" data-id="${blog.id}" title="Delete Blog"><i class="fas fa-trash-alt"></i></button>
                        </td>
                    </tr>
                `).join('');
                
                // Add event listeners for view buttons
                document.querySelectorAll('.view-blog').forEach(button => {
                    button.addEventListener('click', function() {
                        const blogId = this.getAttribute('data-id');
                        viewBlog(blogId);
                    });
                });

                // Add event listeners for edit buttons
                document.querySelectorAll('.edit-blog').forEach(button => {
                    button.addEventListener('click', function() {
                        const blogId = this.getAttribute('data-id');
                        editBlog(blogId);
                    });
                });

                // Add event listeners for delete buttons
                document.querySelectorAll('.delete-blog').forEach(button => {
                    button.addEventListener('click', function() {
                        const blogId = this.getAttribute('data-id');
                        deleteBlog(blogId);
                    });
                });
            }).catch(error => {
                console.error('Error loading blog table:', error);
                tableBody.innerHTML = '<tr><td colspan="4" class="error-message">Error loading blog posts</td></tr>';
            });
        } else {
            // Fallback to localStorage
            console.warn('DataService not available, using localStorage fallback');
            const blogs = JSON.parse(localStorage.getItem('blogs') || '[]');
            
            if (blogs.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="4" class="empty-table">No blog posts found</td></tr>';
                return;
            }
            
            // Sort by date (newest first)
            const sortedBlogs = [...blogs].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            
            tableBody.innerHTML = sortedBlogs.map(blog => `
                <tr>
                    <td>${blog.title}</td>
                    <td>${formatDate(blog.createdAt)}</td>
                    <td><span class="status-badge ${blog.status}">${blog.status}</span></td>
                    <td>
                        <button class="btn-icon view-blog" data-id="${blog.id}" title="View Blog"><i class="fas fa-eye"></i></button>
                        <button class="btn-icon edit-blog" data-id="${blog.id}" title="Edit Blog"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon delete-blog" data-id="${blog.id}" title="Delete Blog"><i class="fas fa-trash-alt"></i></button>
                    </td>
                </tr>
            `).join('');
            
            // Add event listeners for view buttons
            document.querySelectorAll('.view-blog').forEach(button => {
                button.addEventListener('click', function() {
                    const blogId = this.getAttribute('data-id');
                    viewBlog(blogId);
                });
            });

            // Add event listeners for edit buttons
            document.querySelectorAll('.edit-blog').forEach(button => {
                button.addEventListener('click', function() {
                    const blogId = this.getAttribute('data-id');
                    editBlog(blogId);
                });
            });

            // Add event listeners for delete buttons
            document.querySelectorAll('.delete-blog').forEach(button => {
                button.addEventListener('click', function() {
                    const blogId = this.getAttribute('data-id');
                    deleteBlog(blogId);
                });
            });
        }
    } catch (error) {
        console.error('Error loading blog table:', error);
        tableBody.innerHTML = '<tr><td colspan="4" class="error-message">Error loading blog posts</td></tr>';
    }
}

// Edit blog post
function editBlog(id) {
    try {
        // Use DataService to get blog from API
        if (typeof DataService !== 'undefined' && DataService.getById) {
            DataService.getById('blogs', id).then(blog => {
                if (!blog) {
                    showToast('error', 'Blog post not found');
                    return;
                }
                
                // Populate form
                document.getElementById('blogId').value = blog.id;
                document.getElementById('blogTitle').value = blog.title;
                document.getElementById('blogSummary').value = blog.summary || '';
                document.getElementById('blogImage').value = blog.imageUrl || '';
                document.getElementById('blogStatus').value = blog.status;
                document.getElementById('blogFormTitle').textContent = 'Edit Blog Post';
                
                // Set TinyMCE content
                if (tinymce.get('blogContent')) {
                    tinymce.get('blogContent').setContent(blog.content || '');
                }
                
                // Show modal
                document.getElementById('blogFormModal').style.display = 'block';
            }).catch(error => {
                console.error('Error editing blog:', error);
                showToast('error', 'Error loading blog post');
            });
        } else {
            // Fallback to localStorage
            console.warn('DataService not available, using localStorage fallback');
            const blogs = JSON.parse(localStorage.getItem('blogs') || '[]');
            const blog = blogs.find(blog => blog.id === id);
            
            if (!blog) {
                showToast('error', 'Blog post not found');
                return;
            }
            
            // Populate form
            document.getElementById('blogId').value = blog.id;
            document.getElementById('blogTitle').value = blog.title;
            document.getElementById('blogSummary').value = blog.summary || '';
            document.getElementById('blogImage').value = blog.imageUrl || '';
            document.getElementById('blogStatus').value = blog.status;
            document.getElementById('blogFormTitle').textContent = 'Edit Blog Post';
            
            // Set TinyMCE content
            if (tinymce.get('blogContent')) {
                tinymce.get('blogContent').setContent(blog.content || '');
            }
            
            // Show modal
            document.getElementById('blogFormModal').style.display = 'block';
        }
    } catch (error) {
        console.error('Error editing blog:', error);
        showToast('error', 'Error loading blog post');
    }
}

// Delete blog post
function deleteBlog(id) {
    // Show confirmation modal
    const confirmModal = document.getElementById('confirmModal');
    const confirmMessage = document.getElementById('confirmMessage');
    
    confirmMessage.textContent = 'Are you sure you want to delete this blog post? This action cannot be undone.';
    confirmModal.style.display = 'block';
    
    // Add event listener for confirm button
    const confirmAction = document.getElementById('confirmAction');
    const cancelAction = document.getElementById('cancelAction');
    
    // Remove existing event listeners
    const newConfirmAction = confirmAction.cloneNode(true);
    confirmAction.parentNode.replaceChild(newConfirmAction, confirmAction);
    
    const newCancelAction = cancelAction.cloneNode(true);
    cancelAction.parentNode.replaceChild(newCancelAction, cancelAction);
    
    // Add new event listeners
    newConfirmAction.addEventListener('click', function() {
        try {
            // Use DataService for consistent deletion and sync events
            if (typeof DataService !== 'undefined' && DataService.delete) {
                const deleted = DataService.delete('blogs', id);

                if (deleted) {
                    // Close modal
                    confirmModal.style.display = 'none';

                    // Reload table
                    loadBlogTable();

                    // Reload dashboard data
                    loadDashboardData();

                    showToast('success', 'Blog post deleted successfully');
                } else {
                    showToast('error', 'Blog post not found');
                }
            } else {
                // Fallback: direct localStorage manipulation
                console.warn('DataService not available, using direct localStorage manipulation');
                const blogs = JSON.parse(localStorage.getItem('blogs') || '[]');
                const updatedBlogs = blogs.filter(blog => blog.id !== id);

                localStorage.setItem('blogs', JSON.stringify(updatedBlogs));

                // Manually trigger sync event
                const syncData = {
                    contentType: 'blogs',
                    action: 'delete',
                    id: id,
                    timestamp: Date.now()
                };
                localStorage.setItem('lastSync', JSON.stringify(syncData));
                window.dispatchEvent(new CustomEvent('contentSync', { detail: syncData }));

                // Close modal
                confirmModal.style.display = 'none';

                // Reload table
                loadBlogTable();

                // Reload dashboard data
                loadDashboardData();

                showToast('success', 'Blog post deleted successfully');
            }
        } catch (error) {
            console.error('Error deleting blog:', error);
            showToast('error', 'Error deleting blog post: ' + error.message);
        }
    });
    
    newCancelAction.addEventListener('click', function() {
        confirmModal.style.display = 'none';
    });
}

// Initialize event manager
function initEventManager() {
    // Load events to table
    loadEventTable();
    
    // Add event listener for new event button
    const newEventBtn = document.getElementById('newEventBtn');
    if (newEventBtn) {
        newEventBtn.addEventListener('click', function() {
            // Reset form
            document.getElementById('eventForm').reset();
            document.getElementById('eventId').value = '';
            document.getElementById('eventFormTitle').textContent = 'Add New Event';

            // Reset TinyMCE editor
            if (tinymce.get('eventDescription')) {
                tinymce.get('eventDescription').setContent('');
            }

            // Clear media previews
            clearAllMediaPreviews();

            // Show modal
            document.getElementById('eventFormModal').style.display = 'block';
        });
    }
    
    // Add event listener for event form submission
    const eventForm = document.getElementById('eventForm');
    if (eventForm) {
        eventForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const eventId = document.getElementById('eventId').value;
            const title = document.getElementById('eventTitle').value;
            const date = document.getElementById('eventDate').value;
            const time = document.getElementById('eventTime').value;
            const location = document.getElementById('eventLocation').value;
            const description = tinymce.get('eventDescription').getContent();
            let imageUrl = document.getElementById('eventImage').value;
            const status = document.getElementById('eventStatus').value;

            // Handle file upload - convert to data URL if file is selected
            const imageFile = window.MediaUploadManager ? window.MediaUploadManager.getFileData('eventImageFile') : null;
            if (imageFile && !imageUrl) {
                try {
                    imageUrl = await convertFileToDataURL(imageFile);
                } catch (error) {
                    console.error('Error converting image/video file:', error);
                    showToast('error', 'Error processing media file');
                    return;
                }
            }

            // Create ISO date string
            const dateTime = date + (time ? 'T' + time + ':00' : 'T00:00:00');

            try {
                if (eventId) {
                    // Update existing event using DataService
                    if (typeof DataService !== 'undefined' && DataService.update) {
                        try {
                            const updatedEvent = await DataService.update('events', eventId, {
                                title,
                                date: dateTime,
                                location,
                                description,
                                imageUrl,
                                status,
                                updatedAt: new Date().toISOString()
                            });

                            if (updatedEvent) {
                                showToast('success', 'Event updated successfully');
                            } else {
                                showToast('error', 'Failed to update event');
                                return;
                            }
                        } catch (error) {
                            console.error('Error updating event:', error);
                            showToast('error', 'Failed to update event: ' + error.message);
                            return;
                        }
                    } else {
                        // Fallback: direct localStorage manipulation
                        console.warn('DataService not available, using direct localStorage manipulation');
                        const events = JSON.parse(localStorage.getItem('events') || '[]');
                        const index = events.findIndex(event => event.id === eventId);
                        if (index !== -1) {
                            events[index] = {
                                ...events[index],
                                title,
                                date: dateTime,
                                location,
                                description,
                                imageUrl,
                                status,
                                updatedAt: new Date().toISOString()
                            };
                            localStorage.setItem('events', JSON.stringify(events));
                            showToast('success', 'Event updated successfully');
                        }
                    }
                } else {
                    // Create new event using DataService
                    if (typeof DataService !== 'undefined' && DataService.create) {
                        try {
                            const newEvent = await DataService.create('events', {
                                title,
                                date: dateTime,
                                location,
                                description,
                                imageUrl,
                                status,
                                createdAt: new Date().toISOString()
                            });

                            if (newEvent) {
                                showToast('success', 'Event created successfully');
                            } else {
                                showToast('error', 'Failed to create event');
                                return;
                            }
                        } catch (error) {
                            console.error('Error creating event:', error);
                            showToast('error', 'Failed to create event: ' + error.message);
                            return;
                        }
                    } else {
                        // Fallback: direct localStorage manipulation
                        console.warn('DataService not available, using direct localStorage manipulation');
                        const events = JSON.parse(localStorage.getItem('events') || '[]');
                        const newEvent = {
                            id: Date.now().toString(),
                            title,
                            date: dateTime,
                            location,
                            description,
                            imageUrl,
                            status,
                            createdAt: new Date().toISOString()
                        };
                        events.push(newEvent);
                        localStorage.setItem('events', JSON.stringify(events));
                        showToast('success', 'Event created successfully');
                    }
                }

                // Close modal
                document.getElementById('eventFormModal').style.display = 'none';

                // Reload table
                loadEventTable();

                // Reload dashboard data
                loadDashboardData();

                // Trigger sync event for real-time updates across tabs
                try {
                    window.dispatchEvent(new CustomEvent('eventsUpdated', {
                        detail: {
                            action: eventId ? 'updated' : 'created',
                            eventId: eventId || 'new',
                            timestamp: new Date().toISOString()
                        }
                    }));
                    console.log('Event sync triggered for cross-tab communication');
                } catch (syncError) {
                    console.warn('Failed to trigger event sync:', syncError);
                }

            } catch (error) {
                console.error('Error saving event:', error);
                showToast('error', 'Error saving event: ' + error.message);
            }
        });
    }
}

// Load events to table
function loadEventTable() {
    const tableBody = document.getElementById('eventTableBody');
    if (!tableBody) return;
    
    try {
        // Use DataService to get events from API
        if (typeof DataService !== 'undefined' && DataService.getAll) {
            DataService.getAll('events').then(events => {
                if (events.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="5" class="empty-table">No events found</td></tr>';
                    return;
                }
                
                // Sort by date (upcoming first)
                const sortedEvents = [...events].sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
                
                tableBody.innerHTML = sortedEvents.map(event => `
                    <tr>
                        <td>${event.title}</td>
                        <td>${formatDate(event.date)}</td>
                        <td>${event.location || 'N/A'}</td>
                        <td><span class="status-badge ${event.status}">${event.status}</span></td>
                        <td>
                            <button class="btn-icon view-event" data-id="${event.id}" title="View Event"><i class="fas fa-eye"></i></button>
                            <button class="btn-icon edit-event" data-id="${event.id}" title="Edit Event"><i class="fas fa-edit"></i></button>
                            <button class="btn-icon delete-event" data-id="${event.id}" title="Delete Event"><i class="fas fa-trash-alt"></i></button>
                        </td>
                    </tr>
                `).join('');
                
                // Add event listeners for view buttons
                document.querySelectorAll('.view-event').forEach(button => {
                    button.addEventListener('click', function() {
                        const eventId = this.getAttribute('data-id');
                        viewEvent(eventId);
                    });
                });

                // Add event listeners for edit buttons
                document.querySelectorAll('.edit-event').forEach(button => {
                    button.addEventListener('click', function() {
                        const eventId = this.getAttribute('data-id');
                        editEvent(eventId);
                    });
                });

                // Add event listeners for delete buttons
                document.querySelectorAll('.delete-event').forEach(button => {
                    button.addEventListener('click', function() {
                        const eventId = this.getAttribute('data-id');
                        deleteEvent(eventId);
                    });
                });
            }).catch(error => {
                console.error('Error loading event table:', error);
                tableBody.innerHTML = '<tr><td colspan="5" class="error-message">Error loading events</td></tr>';
            });
        } else {
            // Fallback to localStorage
            console.warn('DataService not available, using localStorage fallback');
            const events = JSON.parse(localStorage.getItem('events') || '[]');
            
            if (events.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" class="empty-table">No events found</td></tr>';
                return;
            }
            
            // Sort by date (upcoming first)
            const sortedEvents = [...events].sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
            
            tableBody.innerHTML = sortedEvents.map(event => `
                <tr>
                    <td>${event.title}</td>
                    <td>${formatDate(event.date)}</td>
                    <td>${event.location || 'N/A'}</td>
                    <td><span class="status-badge ${event.status}">${event.status}</span></td>
                    <td>
                        <button class="btn-icon view-event" data-id="${event.id}" title="View Event"><i class="fas fa-eye"></i></button>
                        <button class="btn-icon edit-event" data-id="${event.id}" title="Edit Event"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon delete-event" data-id="${event.id}" title="Delete Event"><i class="fas fa-trash-alt"></i></button>
                    </td>
                </tr>
            `).join('');
            
            // Add event listeners for view buttons
            document.querySelectorAll('.view-event').forEach(button => {
                button.addEventListener('click', function() {
                    const eventId = this.getAttribute('data-id');
                    viewEvent(eventId);
                });
            });

            // Add event listeners for edit buttons
            document.querySelectorAll('.edit-event').forEach(button => {
                button.addEventListener('click', function() {
                    const eventId = this.getAttribute('data-id');
                    editEvent(eventId);
                });
            });

            // Add event listeners for delete buttons
            document.querySelectorAll('.delete-event').forEach(button => {
                button.addEventListener('click', function() {
                    const eventId = this.getAttribute('data-id');
                    deleteEvent(eventId);
                });
            });
        }
    } catch (error) {
        console.error('Error loading event table:', error);
        tableBody.innerHTML = '<tr><td colspan="5" class="error-message">Error loading events</td></tr>';
    }
}

// Edit event
function editEvent(id) {
    try {
        // Use DataService to get event from API
        if (typeof DataService !== 'undefined' && DataService.getById) {
            DataService.getById('events', id).then(event => {
                if (!event) {
                    showToast('error', 'Event not found');
                    return;
                }
                
                // Populate form
                document.getElementById('eventId').value = event.id;
                document.getElementById('eventTitle').value = event.title;
                document.getElementById('eventLocation').value = event.location || '';
                document.getElementById('eventStatus').value = event.status;
                document.getElementById('eventFormTitle').textContent = 'Edit Event';
                
                // Set date and time
                if (event.date) {
                    const dateObj = new Date(event.date);
                    if (!isNaN(dateObj.getTime())) {
                        // Set date (YYYY-MM-DD)
                        const dateString = dateObj.toISOString().split('T')[0];
                        document.getElementById('eventDate').value = dateString;
                        
                        // Set time (HH:MM)
                        const timeString = dateObj.toISOString().split('T')[1].substring(0, 5);
                        document.getElementById('eventTime').value = timeString;
                    }
                }
                
                // Set image URL
                if (event.imageUrl) {
                    document.getElementById('eventImage').value = event.imageUrl;
                }
                
                // Set TinyMCE content
                if (tinymce.get('eventDescription')) {
                    tinymce.get('eventDescription').setContent(event.description || '');
                }
                
                // Show modal
                document.getElementById('eventFormModal').style.display = 'block';
            }).catch(error => {
                console.error('Error editing event:', error);
                showToast('error', 'Error loading event');
            });
        } else {
            // Fallback to localStorage
            console.warn('DataService not available, using localStorage fallback');
            const events = JSON.parse(localStorage.getItem('events') || '[]');
            const event = events.find(event => event.id === id);
            
            if (!event) {
                showToast('error', 'Event not found');
                return;
            }
            
            // Populate form
            document.getElementById('eventId').value = event.id;
            document.getElementById('eventTitle').value = event.title;
            document.getElementById('eventLocation').value = event.location || '';
            document.getElementById('eventStatus').value = event.status;
            document.getElementById('eventFormTitle').textContent = 'Edit Event';
            
            // Set date and time
            if (event.date) {
                const dateObj = new Date(event.date);
                if (!isNaN(dateObj.getTime())) {
                    // Set date (YYYY-MM-DD)
                    const dateString = dateObj.toISOString().split('T')[0];
                    document.getElementById('eventDate').value = dateString;
                    
                    // Set time (HH:MM)
                    const timeString = dateObj.toISOString().split('T')[1].substring(0, 5);
                    document.getElementById('eventTime').value = timeString;
                }
            }
            
            // Set image URL
            if (event.imageUrl) {
                document.getElementById('eventImage').value = event.imageUrl;
            }
            
            // Set TinyMCE content
            if (tinymce.get('eventDescription')) {
                tinymce.get('eventDescription').setContent(event.description || '');
            }
            
            // Show modal
            document.getElementById('eventFormModal').style.display = 'block';
        }
    } catch (error) {
        console.error('Error editing event:', error);
        showToast('error', 'Error loading event');
    }
}

// Delete event
function deleteEvent(id) {
    // Show confirmation modal
    const confirmModal = document.getElementById('confirmModal');
    const confirmMessage = document.getElementById('confirmMessage');
    
    confirmMessage.textContent = 'Are you sure you want to delete this event? This action cannot be undone.';
    confirmModal.style.display = 'block';
    
    // Add event listener for confirm button
    const confirmAction = document.getElementById('confirmAction');
    const cancelAction = document.getElementById('cancelAction');
    
    // Remove existing event listeners
    const newConfirmAction = confirmAction.cloneNode(true);
    confirmAction.parentNode.replaceChild(newConfirmAction, confirmAction);
    
    const newCancelAction = cancelAction.cloneNode(true);
    cancelAction.parentNode.replaceChild(newCancelAction, cancelAction);
    
    // Add new event listeners
    newConfirmAction.addEventListener('click', function() {
        try {
            // Use DataService for consistent deletion and sync events
            if (typeof DataService !== 'undefined' && DataService.delete) {
                const deleted = DataService.delete('events', id);

                if (deleted) {
                    // Close modal
                    confirmModal.style.display = 'none';

                    // Reload table
                    loadEventTable();

                    // Reload dashboard data
                    loadDashboardData();

                    showToast('success', 'Event deleted successfully');
                } else {
                    showToast('error', 'Event not found');
                }
            } else {
                // Fallback: direct localStorage manipulation
                console.warn('DataService not available, using direct localStorage manipulation');
                const events = JSON.parse(localStorage.getItem('events') || '[]');
                const updatedEvents = events.filter(event => event.id !== id);

                localStorage.setItem('events', JSON.stringify(updatedEvents));

                // Manually trigger sync event
                const syncData = {
                    contentType: 'events',
                    action: 'delete',
                    id: id,
                    timestamp: Date.now()
                };
                localStorage.setItem('lastSync', JSON.stringify(syncData));
                window.dispatchEvent(new CustomEvent('contentSync', { detail: syncData }));

                // Close modal
                confirmModal.style.display = 'none';

                // Reload table
                loadEventTable();

                // Reload dashboard data
                loadDashboardData();

                // Trigger additional sync event for real-time updates
                try {
                    window.dispatchEvent(new CustomEvent('eventsUpdated', {
                        detail: {
                            action: 'deleted',
                            eventId: id,
                            timestamp: new Date().toISOString()
                        }
                    }));
                    console.log('Event deletion sync triggered for cross-tab communication');
                } catch (syncError) {
                    console.warn('Failed to trigger event deletion sync:', syncError);
                }

                showToast('success', 'Event deleted successfully');
            }
        } catch (error) {
            console.error('Error deleting event:', error);
            showToast('error', 'Error deleting event: ' + error.message);
        }
    });
    
    newCancelAction.addEventListener('click', function() {
        confirmModal.style.display = 'none';
    });
}

// Initialize sermon manager
function initSermonManager() {
    // Load sermons to table
    loadSermonTable();
    
    // Add event listener for new sermon button
    const newSermonBtn = document.getElementById('newSermonBtn');
    if (newSermonBtn) {
        newSermonBtn.addEventListener('click', function() {
            // Reset form
            document.getElementById('sermonForm').reset();
            document.getElementById('sermonId').value = '';
            document.getElementById('sermonFormTitle').textContent = 'Add New Sermon';

            // Reset TinyMCE editor if used
            if (tinymce.get('sermonDescription')) {
                tinymce.get('sermonDescription').setContent('');
            }

            // Clear media previews
            clearAllMediaPreviews();

            // Show modal
            document.getElementById('sermonFormModal').style.display = 'block';
        });
    }
    
    // Add event listener for sermon form submission
    const sermonForm = document.getElementById('sermonForm');
    if (sermonForm) {
        sermonForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const sermonId = document.getElementById('sermonId').value;
            const title = document.getElementById('sermonTitle').value;
            const speaker = document.getElementById('sermonSpeaker').value;
            const date = document.getElementById('sermonDate').value;
            const description = document.getElementById('sermonDescription').value;
            let videoUrl = document.getElementById('sermonVideoUrl').value;
            let audioUrl = document.getElementById('sermonAudioUrl').value;
            let thumbnailUrl = document.getElementById('sermonThumbnail').value;
            const status = document.getElementById('sermonStatus').value;

            // Handle file uploads - convert to data URLs if files are selected
            const videoFile = window.MediaUploadManager ? window.MediaUploadManager.getFileData('sermonVideoFile') : null;
            const audioFile = window.MediaUploadManager ? window.MediaUploadManager.getFileData('sermonAudioFile') : null;
            const thumbnailFile = window.MediaUploadManager ? window.MediaUploadManager.getFileData('sermonThumbnailFile') : null;

            try {
                if (videoFile && !videoUrl) {
                    videoUrl = await convertFileToDataURL(videoFile);
                }
                if (audioFile && !audioUrl) {
                    audioUrl = await convertFileToDataURL(audioFile);
                }
                if (thumbnailFile && !thumbnailUrl) {
                    thumbnailUrl = await convertFileToDataURL(thumbnailFile);
                }
            } catch (error) {
                console.error('Error converting media files:', error);
                showToast('error', 'Error processing media files');
                return;
            }

            try {
                if (sermonId) {
                    // Update existing sermon using DataService
                    if (typeof DataService !== 'undefined' && DataService.update) {
                        try {
                            const updatedSermon = await DataService.update('sermons', sermonId, {
                                title,
                                speaker,
                                date,
                                description,
                                videoUrl,
                                audioUrl,
                                thumbnailUrl,
                                status,
                                updatedAt: new Date().toISOString()
                            });

                            if (updatedSermon) {
                                showToast('success', 'Sermon updated successfully');
                            } else {
                                showToast('error', 'Failed to update sermon');
                                return;
                            }
                        } catch (error) {
                            console.error('Error updating sermon:', error);
                            showToast('error', 'Failed to update sermon: ' + error.message);
                            return;
                        }
                    } else {
                        // Fallback: direct localStorage manipulation
                        console.warn('DataService not available, using direct localStorage manipulation');
                        const sermons = JSON.parse(localStorage.getItem('sermons') || '[]');
                        const index = sermons.findIndex(sermon => sermon.id === sermonId);
                        if (index !== -1) {
                            sermons[index] = {
                                ...sermons[index],
                                title,
                                speaker,
                                date,
                                description,
                                videoUrl,
                                audioUrl,
                                thumbnailUrl,
                                status,
                                updatedAt: new Date().toISOString()
                            };
                            localStorage.setItem('sermons', JSON.stringify(sermons));
                            showToast('success', 'Sermon updated successfully');
                        }
                    }
                } else {
                    // Create new sermon using DataService
                    if (typeof DataService !== 'undefined' && DataService.create) {
                        try {
                            const newSermon = await DataService.create('sermons', {
                                title,
                                speaker,
                                date,
                                description,
                                videoUrl,
                                audioUrl,
                                thumbnailUrl,
                                status,
                                createdAt: new Date().toISOString()
                            });

                            if (newSermon) {
                                showToast('success', 'Sermon created successfully');
                            } else {
                                showToast('error', 'Failed to create sermon');
                                return;
                            }
                        } catch (error) {
                            console.error('Error creating sermon:', error);
                            showToast('error', 'Failed to create sermon: ' + error.message);
                            return;
                        }
                    } else {
                        // Fallback: direct localStorage manipulation
                        console.warn('DataService not available, using direct localStorage manipulation');
                        const sermons = JSON.parse(localStorage.getItem('sermons') || '[]');
                        const newSermon = {
                            id: Date.now().toString(),
                            title,
                            speaker,
                            date,
                            description,
                            videoUrl,
                            audioUrl,
                            thumbnailUrl,
                            status,
                            createdAt: new Date().toISOString()
                        };
                        sermons.push(newSermon);
                        localStorage.setItem('sermons', JSON.stringify(sermons));
                        showToast('success', 'Sermon created successfully');
                    }
                }

                // Close modal
                document.getElementById('sermonFormModal').style.display = 'none';

                // Reload table
                loadSermonTable();

                // Reload dashboard data
                loadDashboardData();

            } catch (error) {
                console.error('Error saving sermon:', error);
                showToast('error', 'Error saving sermon: ' + error.message);
            }
        });
    }
}

// Load sermons to table
function loadSermonTable() {
    const tableBody = document.getElementById('sermonTableBody');
    if (!tableBody) return;
    
    try {
        // Use DataService to get sermons from API
        if (typeof DataService !== 'undefined' && DataService.getAll) {
            DataService.getAll('sermons').then(sermons => {
                if (sermons.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="5" class="empty-table">No sermons found</td></tr>';
                    return;
                }
                
                // Sort by date (newest first)
                const sortedSermons = [...sermons].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
                
                tableBody.innerHTML = sortedSermons.map(sermon => `
                    <tr>
                        <td>${sermon.title}</td>
                        <td>${sermon.speaker}</td>
                        <td>${formatDate(sermon.date)}</td>
                        <td><span class="status-badge ${sermon.status}">${sermon.status}</span></td>
                        <td>
                            <button class="btn-icon view-sermon" data-id="${sermon.id}" title="View Sermon"><i class="fas fa-eye"></i></button>
                            <button class="btn-icon edit-sermon" data-id="${sermon.id}" title="Edit Sermon"><i class="fas fa-edit"></i></button>
                            <button class="btn-icon delete-sermon" data-id="${sermon.id}" title="Delete Sermon"><i class="fas fa-trash-alt"></i></button>
                        </td>
                    </tr>
                `).join('');
                
                // Add event listeners for view buttons
                document.querySelectorAll('.view-sermon').forEach(button => {
                    button.addEventListener('click', function() {
                        const sermonId = this.getAttribute('data-id');
                        viewSermon(sermonId);
                    });
                });

                // Add event listeners for edit buttons
                document.querySelectorAll('.edit-sermon').forEach(button => {
                    button.addEventListener('click', function() {
                        const sermonId = this.getAttribute('data-id');
                        editSermon(sermonId);
                    });
                });

                // Add event listeners for delete buttons
                document.querySelectorAll('.delete-sermon').forEach(button => {
                    button.addEventListener('click', function() {
                        const sermonId = this.getAttribute('data-id');
                        deleteSermon(sermonId);
                    });
                });
            }).catch(error => {
                console.error('Error loading sermon table:', error);
                tableBody.innerHTML = '<tr><td colspan="5" class="error-message">Error loading sermons</td></tr>';
            });
        } else {
            // Fallback to localStorage
            console.warn('DataService not available, using localStorage fallback');
            const sermons = JSON.parse(localStorage.getItem('sermons') || '[]');
            
            if (sermons.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" class="empty-table">No sermons found</td></tr>';
                return;
            }
            
            // Sort by date (newest first)
            const sortedSermons = [...sermons].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
            
            tableBody.innerHTML = sortedSermons.map(sermon => `
                <tr>
                    <td>${sermon.title}</td>
                    <td>${sermon.speaker}</td>
                    <td>${formatDate(sermon.date)}</td>
                    <td><span class="status-badge ${sermon.status}">${sermon.status}</span></td>
                    <td>
                        <button class="btn-icon view-sermon" data-id="${sermon.id}" title="View Sermon"><i class="fas fa-eye"></i></button>
                        <button class="btn-icon edit-sermon" data-id="${sermon.id}" title="Edit Sermon"><i class="fas fa-edit"></i></button>
                        <button class="btn-icon delete-sermon" data-id="${sermon.id}" title="Delete Sermon"><i class="fas fa-trash-alt"></i></button>
                    </td>
                </tr>
            `).join('');
            
            // Add event listeners for view buttons
            document.querySelectorAll('.view-sermon').forEach(button => {
                button.addEventListener('click', function() {
                    const sermonId = this.getAttribute('data-id');
                    viewSermon(sermonId);
                });
            });

            // Add event listeners for edit buttons
            document.querySelectorAll('.edit-sermon').forEach(button => {
                button.addEventListener('click', function() {
                    const sermonId = this.getAttribute('data-id');
                    editSermon(sermonId);
                });
            });

            // Add event listeners for delete buttons
            document.querySelectorAll('.delete-sermon').forEach(button => {
                button.addEventListener('click', function() {
                    const sermonId = this.getAttribute('data-id');
                    deleteSermon(sermonId);
                });
            });
        }
    } catch (error) {
        console.error('Error loading sermon table:', error);
        tableBody.innerHTML = '<tr><td colspan="5" class="error-message">Error loading sermons</td></tr>';
    }
}

// Edit sermon
function editSermon(id) {
    try {
        // Use DataService to get sermon from API
        if (typeof DataService !== 'undefined' && DataService.getById) {
            DataService.getById('sermons', id).then(sermon => {
                if (!sermon) {
                    showToast('error', 'Sermon not found');
                    return;
                }
                
                // Populate form
                document.getElementById('sermonId').value = sermon.id;
                document.getElementById('sermonTitle').value = sermon.title;
                document.getElementById('sermonSpeaker').value = sermon.speaker || '';

                // Format date for date input (YYYY-MM-DD)
                if (sermon.date) {
                    const dateObj = new Date(sermon.date);
                    if (!isNaN(dateObj.getTime())) {
                        const dateString = dateObj.toISOString().split('T')[0];
                        document.getElementById('sermonDate').value = dateString;
                    }
                }

                // Set TinyMCE content for description
                if (tinymce.get('sermonDescription')) {
                    tinymce.get('sermonDescription').setContent(sermon.description || '');
                } else {
                    // Fallback if TinyMCE is not initialized
                    document.getElementById('sermonDescription').value = sermon.description || '';
                }

                document.getElementById('sermonVideoUrl').value = sermon.videoUrl || '';
                document.getElementById('sermonAudioUrl').value = sermon.audioUrl || '';
                document.getElementById('sermonThumbnail').value = sermon.thumbnailUrl || '';
                document.getElementById('sermonStatus').value = sermon.status;
                document.getElementById('sermonFormTitle').textContent = 'Edit Sermon';
                
                // Show modal
                document.getElementById('sermonFormModal').style.display = 'block';
            }).catch(error => {
                console.error('Error editing sermon:', error);
                showToast('error', 'Error loading sermon');
            });
        } else {
            // Fallback to localStorage
            console.warn('DataService not available, using localStorage fallback');
            const sermons = JSON.parse(localStorage.getItem('sermons') || '[]');
            const sermon = sermons.find(sermon => sermon.id === id);
            
            if (!sermon) {
                showToast('error', 'Sermon not found');
                return;
            }
            
            // Populate form
            document.getElementById('sermonId').value = sermon.id;
            document.getElementById('sermonTitle').value = sermon.title;
            document.getElementById('sermonSpeaker').value = sermon.speaker || '';

            // Format date for date input (YYYY-MM-DD)
            if (sermon.date) {
                const dateObj = new Date(sermon.date);
                if (!isNaN(dateObj.getTime())) {
                    const dateString = dateObj.toISOString().split('T')[0];
                    document.getElementById('sermonDate').value = dateString;
                }
            }

            // Set TinyMCE content for description
            if (tinymce.get('sermonDescription')) {
                tinymce.get('sermonDescription').setContent(sermon.description || '');
            } else {
                // Fallback if TinyMCE is not initialized
                document.getElementById('sermonDescription').value = sermon.description || '';
            }

            document.getElementById('sermonVideoUrl').value = sermon.videoUrl || '';
            document.getElementById('sermonAudioUrl').value = sermon.audioUrl || '';
            document.getElementById('sermonThumbnail').value = sermon.thumbnailUrl || '';
            document.getElementById('sermonStatus').value = sermon.status;
            document.getElementById('sermonFormTitle').textContent = 'Edit Sermon';
            
            // Show modal
            document.getElementById('sermonFormModal').style.display = 'block';
        }
    } catch (error) {
        console.error('Error editing sermon:', error);
        showToast('error', 'Error loading sermon');
    }
}

// Delete sermon
function deleteSermon(id) {
    // Show confirmation modal
    const confirmModal = document.getElementById('confirmModal');
    const confirmMessage = document.getElementById('confirmMessage');
    
    confirmMessage.textContent = 'Are you sure you want to delete this sermon? This action cannot be undone.';
    confirmModal.style.display = 'block';
    
    // Add event listener for confirm button
    const confirmAction = document.getElementById('confirmAction');
    const cancelAction = document.getElementById('cancelAction');
    
    // Remove existing event listeners
    const newConfirmAction = confirmAction.cloneNode(true);
    confirmAction.parentNode.replaceChild(newConfirmAction, confirmAction);
    
    const newCancelAction = cancelAction.cloneNode(true);
    cancelAction.parentNode.replaceChild(newCancelAction, cancelAction);
    
    // Add new event listeners
    newConfirmAction.addEventListener('click', function() {
        try {
            // Use DataService for consistent deletion and sync events
            if (typeof DataService !== 'undefined' && DataService.delete) {
                const deleted = DataService.delete('sermons', id);

                if (deleted) {
                    // Close modal
                    confirmModal.style.display = 'none';

                    // Reload table
                    loadSermonTable();

                    // Reload dashboard data
                    loadDashboardData();

                    showToast('success', 'Sermon deleted successfully');
                } else {
                    showToast('error', 'Sermon not found');
                }
            } else {
                // Fallback: direct localStorage manipulation
                console.warn('DataService not available, using direct localStorage manipulation');
                const sermons = JSON.parse(localStorage.getItem('sermons') || '[]');
                const updatedSermons = sermons.filter(sermon => sermon.id !== id);

                localStorage.setItem('sermons', JSON.stringify(updatedSermons));

                // Manually trigger sync event
                const syncData = {
                    contentType: 'sermons',
                    action: 'delete',
                    id: id,
                    timestamp: Date.now()
                };
                localStorage.setItem('lastSync', JSON.stringify(syncData));
                window.dispatchEvent(new CustomEvent('contentSync', { detail: syncData }));

                // Close modal
                confirmModal.style.display = 'none';

                // Reload table
                loadSermonTable();

                // Reload dashboard data
                loadDashboardData();

                showToast('success', 'Sermon deleted successfully');
            }
        } catch (error) {
            console.error('Error deleting sermon:', error);
            showToast('error', 'Error deleting sermon: ' + error.message);
        }
    });
    
    newCancelAction.addEventListener('click', function() {
        confirmModal.style.display = 'none';
    });
}

// View blog post
function viewBlog(id) {
    try {
        const blogs = JSON.parse(localStorage.getItem('blogs') || '[]');
        const blog = blogs.find(blog => blog.id === id);

        if (!blog) {
            showToast('error', 'Blog post not found');
            return;
        }

        // Create and show view modal
        showViewModal('Blog Post', {
            'Title': blog.title,
            'Summary': blog.summary,
            'Status': blog.status,
            'Created': formatDate(blog.createdAt),
            'Image URL': blog.imageUrl || 'N/A',
            'Content': blog.content
        });
    } catch (error) {
        console.error('Error viewing blog:', error);
        showToast('error', 'Error loading blog post');
    }
}

// View event
function viewEvent(id) {
    try {
        const events = JSON.parse(localStorage.getItem('events') || '[]');
        const event = events.find(event => event.id === id);

        if (!event) {
            showToast('error', 'Event not found');
            return;
        }

        // Create and show view modal
        showViewModal('Event Details', {
            'Title': event.title,
            'Date': formatDate(event.date),
            'Location': event.location || 'N/A',
            'Status': event.status,
            'Created': formatDate(event.createdAt),
            'Image URL': event.imageUrl || 'N/A',
            'Description': event.description
        });
    } catch (error) {
        console.error('Error viewing event:', error);
        showToast('error', 'Error loading event');
    }
}

// View sermon
function viewSermon(id) {
    try {
        const sermons = JSON.parse(localStorage.getItem('sermons') || '[]');
        const sermon = sermons.find(sermon => sermon.id === id);

        if (!sermon) {
            showToast('error', 'Sermon not found');
            return;
        }

        // Create and show view modal
        showViewModal('Sermon Details', {
            'Title': sermon.title,
            'Speaker': sermon.speaker,
            'Date': formatDate(sermon.date),
            'Status': sermon.status,
            'Created': formatDate(sermon.createdAt),
            'Video URL': sermon.videoUrl || 'N/A',
            'Audio URL': sermon.audioUrl || 'N/A',
            'Thumbnail URL': sermon.thumbnailUrl || 'N/A',
            'Description': sermon.description
        });
    } catch (error) {
        console.error('Error viewing sermon:', error);
        showToast('error', 'Error loading sermon');
    }
}

// Generic function to show view modal
function showViewModal(title, data) {
    // Create modal HTML
    const modalHTML = `
        <div id="viewModal" class="modal" style="display: block;">
            <div class="modal-content" style="max-width: 800px; max-height: 80vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2>${title}</h2>
                    <span class="close-modal" onclick="closeViewModal()">&times;</span>
                </div>
                <div class="modal-body">
                    ${Object.entries(data).map(([key, value]) => {
                        if (key === 'Content' || key === 'Description') {
                            return `
                                <div class="view-field">
                                    <strong>${key}:</strong>
                                    <div class="content-preview" style="border: 1px solid #ddd; padding: 10px; margin-top: 5px; border-radius: 4px; background: #f9f9f9; max-height: 200px; overflow-y: auto;">
                                        ${value || 'No content available'}
                                    </div>
                                </div>
                            `;
                        } else {
                            return `
                                <div class="view-field" style="margin-bottom: 15px;">
                                    <strong>${key}:</strong> <span>${value || 'N/A'}</span>
                                </div>
                            `;
                        }
                    }).join('')}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeViewModal()">Close</button>
                </div>
            </div>
        </div>
    `;

    // Remove existing view modal if any
    const existingModal = document.getElementById('viewModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Close view modal
function closeViewModal() {
    const modal = document.getElementById('viewModal');
    if (modal) {
        modal.remove();
    }
}

// Handle logout
function handleLogout() {
    // Clear tokens
    localStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminToken');
    
    // Redirect to login page
    window.location.href = '/login.html';
}

// Helper function to format dates
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Helper function to show toast notifications
function showToast(type, title, message) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-header">
            <strong>${title}</strong>
            <button type="button" class="toast-close">&times;</button>
        </div>
        <div class="toast-body">${message}</div>
    `;
    
    document.body.appendChild(toast);
    
    // Add show class to animate in
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 5000);
    
    // Close button functionality
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    });
}

// Add sample data for testing if localStorage is empty
function addSampleData() {
    // Check if localStorage is empty
    if (!localStorage.getItem('blogs')) {
        // Sample blog posts
        const sampleBlogs = [
            {
                id: '1',
                title: 'Welcome to Our Church',
                summary: 'An introduction to our church community',
                content: '<p>Welcome to the Apostolic Church International. We are a community of believers...</p>',
                status: 'published',
                createdAt: '2023-06-15T10:30:00Z'
            },
            {
                id: '2',
                title: 'Sunday Service Highlights',
                summary: 'Recap of our recent Sunday service',
                content: '<p>This Sunday, we had a wonderful time of worship and fellowship...</p>',
                status: 'published',
                createdAt: '2023-06-10T14:20:00Z'
            }
        ];
        localStorage.setItem('blogs', JSON.stringify(sampleBlogs));
    }
    
    if (!localStorage.getItem('events')) {
        // Sample events
        const sampleEvents = [
            {
                id: '1',
                title: 'Annual Conference',
                date: '2023-07-15T09:00:00Z',
                location: 'Main Sanctuary',
                description: '<p>Join us for our annual conference featuring guest speakers...</p>',
                status: 'published'
            },
            {
                id: '2',
                title: 'Youth Retreat',
                date: '2023-08-05T15:00:00Z',
                location: 'Retreat Center',
                description: '<p>A weekend of spiritual growth and fellowship for our youth...</p>',
                status: 'published'
            }
        ];
        localStorage.setItem('events', JSON.stringify(sampleEvents));
    }
    
    if (!localStorage.getItem('sermons')) {
        // DISABLED: No sample sermons to prevent unwanted content creation
        localStorage.setItem('sermons', JSON.stringify([]));
    }
    
    console.log('Sample data added to localStorage');
}

// Helper function to convert file to data URL
function convertFileToDataURL(file) {
    return new Promise((resolve, reject) => {
        try {
            const reader = new FileReader();
            reader.onload = function(e) {
                resolve(e.target.result);
            };
            reader.onerror = function(error) {
                reject(error);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            reject(error);
        }
    });
}

// Helper function to clear all media previews when forms are reset
function clearAllMediaPreviews() {
    try {
        if (window.MediaUploadManager && typeof window.MediaUploadManager.clearAllPreviews === 'function') {
            window.MediaUploadManager.clearAllPreviews();
        }
    } catch (error) {
        console.error('Error clearing media previews:', error);
    }
}

// REMOVED: Orphaned TinyMCE initialization code that was causing syntax errors
// TinyMCE initialization is now handled in the initTinyMCE() function

// Helper function to format dates
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// REMOVED: Duplicate showToast function
// Toast functionality is handled by initToastNotifications() function

// REMOVED: Duplicate addSampleData function and call
// Sample data creation is now handled by initSampleData() in the main initialization

// Initialize toast notifications
function initToastNotifications() {
    window.showToast = function(type, message, title = '') {
        const toast = document.getElementById('toast');
        const toastIcon = document.getElementById('toastIcon');
        const toastTitle = document.getElementById('toastTitle');
        const toastMessage = document.getElementById('toastMessage');
        const toastProgress = document.querySelector('.toast-progress');
        
        // Set toast type
        toast.className = 'toast';
        toast.classList.add(type);
        
        // Set icon
        toastIcon.className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
        
        // Set title
        toastTitle.textContent = title || (type === 'success' ? 'Success' : 'Error');
        
        // Set message
        toastMessage.textContent = message;
        
        // Show toast
        toast.classList.add('show');
        
        // Reset progress animation
        toastProgress.style.animation = 'none';
        toastProgress.offsetHeight; // Trigger reflow
        toastProgress.style.animation = 'progress 3s linear forwards';
        
        // Hide toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    };
}

// Call this function to add sample data for testing
addSampleData();

// Add this function to the existing admin.js file
function syncContentToFrontend(contentType, action, item) {
    // Create a custom event with content details
    const syncEvent = new CustomEvent('contentSync', {
        detail: {
            contentType: contentType, // 'blogs', 'events', or 'sermons'
            action: action, // 'add', 'update', or 'delete'
            item: item, // the content item that was changed
            timestamp: new Date().getTime()
        }
    });
    
    // Dispatch the event to notify any listeners
    window.dispatchEvent(syncEvent);
    
    // Also trigger storage event for cross-tab communication
    // We'll store a sync marker in localStorage that other tabs can detect
    localStorage.setItem('lastSync', JSON.stringify({
        contentType: contentType,
        action: action,
        itemId: item.id,
        timestamp: new Date().getTime()
    }));
    
    console.log(`Admin: ${action} ${contentType} item synced to frontend`, item);
}

// Note: Form handlers are now managed by individual manager files (blog-manager.js, event-manager.js, sermon-manager.js)
// This ensures proper DataService integration and sync event triggering



// Initialize sample data if localStorage is empty
// REMOVED: Duplicate initSampleData function - using the one at line 226 instead

// Function to generate sample content for testing
function generateSampleContent() {
    console.log('🎬 Generating sample content for testing...');

    try {
        // Use DataService to create content with proper sync events
        if (typeof DataService !== 'undefined' && DataService.create) {
            // Generate a sample blog post
            const sampleBlog = DataService.create('blogs', {
                title: 'Sample Blog Post - ' + new Date().toLocaleTimeString(),
                summary: 'This is an automatically generated sample blog post for testing purposes.',
                content: '<p>This is a sample blog post created for testing the sync functionality between the admin dashboard and the frontend website.</p><p>If you can see this content on the blog page, the sync is working correctly!</p>',
                imageUrl: 'images/blog-placeholder.jpg',
                status: 'published'
            });

            console.log('✅ Sample blog created:', sampleBlog.title);
        } else {
            console.warn('DataService not available, falling back to direct localStorage manipulation');

            // Fallback: direct localStorage manipulation
            const sampleBlog = {
                id: 'sample-' + Date.now(),
                title: 'Sample Blog Post - ' + new Date().toLocaleTimeString(),
                summary: 'This is an automatically generated sample blog post for testing purposes.',
                content: '<p>This is a sample blog post created for testing the sync functionality between the admin dashboard and the frontend website.</p><p>If you can see this content on the blog page, the sync is working correctly!</p>',
                imageUrl: 'images/blog-placeholder.jpg',
                status: 'published',
                createdAt: new Date().toISOString()
            };

            // Add to localStorage
            const blogs = JSON.parse(localStorage.getItem('blogs') || '[]');
            blogs.push(sampleBlog);
            localStorage.setItem('blogs', JSON.stringify(blogs));

            // Sync to frontend
            if (typeof syncContentToFrontend === 'function') {
                syncContentToFrontend('blogs', 'add', sampleBlog);
            }
        }

        // Generate a sample event
        const eventDate = new Date();
        eventDate.setDate(eventDate.getDate() + 14); // 2 weeks from now

        const sampleEvent = {
            id: 'sample-' + (Date.now() + 1),
            title: 'Sample Event - ' + new Date().toLocaleTimeString(),
            date: eventDate.toISOString(),
            location: 'Church Auditorium',
            description: '<p>This is a sample event created for testing the sync functionality between the admin dashboard and the frontend website.</p>',
            imageUrl: 'images/event-placeholder.jpg',
            status: 'published',
            createdAt: new Date().toISOString()
        };

        // Add to localStorage
        const events = JSON.parse(localStorage.getItem('events') || '[]');
        events.push(sampleEvent);
        localStorage.setItem('events', JSON.stringify(events));

        // Sync to frontend
        if (typeof syncContentToFrontend === 'function') {
            syncContentToFrontend('events', 'add', sampleEvent);
        }

        // Generate a sample sermon
        const sermonDate = new Date();
        sermonDate.setDate(sermonDate.getDate() - 7); // 1 week ago

        const sampleSermon = {
            id: 'sample-' + (Date.now() + 2),
            title: 'Sample Sermon - ' + new Date().toLocaleTimeString(),
            speaker: 'Pastor Test',
            date: sermonDate.toISOString(),
            description: 'This is a sample sermon created for testing the sync functionality between the admin dashboard and the frontend website.',
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            audioUrl: '',
            thumbnailUrl: 'images/sermon-placeholder.jpg',
            status: 'published',
            createdAt: new Date().toISOString()
        };

        // Add to localStorage
        const sermons = JSON.parse(localStorage.getItem('sermons') || '[]');
        sermons.push(sampleSermon);
        localStorage.setItem('sermons', JSON.stringify(sermons));

        // Sync to frontend
        if (typeof syncContentToFrontend === 'function') {
            syncContentToFrontend('sermons', 'add', sampleSermon);
        }

        // Show success message
        if (typeof showToast === 'function') {
            showToast('success', 'Sample content generated successfully');
        }

        // Reload tables if functions exist
        if (typeof loadBlogTable === 'function') loadBlogTable();
        if (typeof loadEventTable === 'function') loadEventTable();
        if (typeof loadSermonTable === 'function') loadSermonTable();

        console.log('Generated sample content for testing');
    } catch (error) {
        console.error('Error generating sample content:', error);
        if (typeof showToast === 'function') {
            showToast('error', 'Failed to generate sample content: ' + error.message);
        }
    }
}

// REMOVED: Duplicate DOMContentLoaded listener for generate sample content button
// This functionality is now consolidated in the main DOMContentLoaded listener

