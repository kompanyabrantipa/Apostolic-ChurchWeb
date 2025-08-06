/**
 * Blog Manager - Handles blog CRUD operations
 * EventManager removed to avoid conflicts - using event-manager.js instead
 */
const BlogManager = {
    /**
     * Load blog posts to table
     */
    loadBlogTable: function() {
        const tableBody = document.getElementById('blogTableBody');
        
        if (!tableBody) {
            console.error('Blog table body element not found');
            return;
        }
        
        try {
            const blogs = DataService.getAll('blogs');
            
            if (blogs.length > 0) {
                // Sort by creation date (newest first)
                const sortedBlogs = [...blogs].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
                
                tableBody.innerHTML = sortedBlogs.map(blog => `
                    <tr>
                        <td>${blog.title}</td>
                        <td>${blog.summary || 'No summary'}</td>
                        <td><span class="status-badge ${blog.status}">${blog.status}</span></td>
                        <td>${this.formatDate(blog.createdAt)}</td>
                        <td>
                            <button class="btn-icon edit-blog" data-id="${blog.id}"><i class="fas fa-edit"></i></button>
                            <button class="btn-icon delete-blog" data-id="${blog.id}"><i class="fas fa-trash-alt"></i></button>
                        </td>
                    </tr>
                `).join('');
                
                // Add event listeners for edit buttons
                document.querySelectorAll('.edit-blog').forEach(btn => {
                    btn.addEventListener('click', () => this.editBlog(btn.getAttribute('data-id')));
                });
                
                // Add event listeners for delete buttons
                document.querySelectorAll('.delete-blog').forEach(btn => {
                    btn.addEventListener('click', () => this.deleteBlog(btn.getAttribute('data-id')));
                });
            } else {
                tableBody.innerHTML = '<tr><td colspan="5" class="empty-table">No blog posts found</td></tr>';
            }
        } catch (error) {
            console.error('Error loading blog table:', error);
            showToast('error', 'Error', 'Failed to load blog posts');
        }
    },
    
    /**
     * Create a new blog post
     * @param {Event} event - Form submit event
     */
    createBlog: function(event) {
        event.preventDefault();
        
        try {
            // Get form data
            const form = event.target;
            const title = form.querySelector('#blogTitle').value.trim();
            const summary = form.querySelector('#blogSummary').value.trim();
            const content = tinymce.get('blogContent').getContent();
            const status = form.querySelector('#blogStatus').value;
            const imageUrl = form.querySelector('#blogImageUrl').value.trim();
            
            // Validate form data
            if (!title) {
                showToast('error', 'Validation Error', 'Title is required');
                return;
            }
            
            if (!summary) {
                showToast('error', 'Validation Error', 'Summary is required');
                return;
            }
            
            if (!content) {
                showToast('error', 'Validation Error', 'Content is required');
                return;
            }
            
            // Create blog post
            const newBlog = DataService.create('blogs', {
                title,
                summary,
                content,
                status,
                imageUrl: imageUrl || 'images/blog-placeholder.jpg'
            });
            
            // Close modal
            document.getElementById('addBlogModal').style.display = 'none';
            
            // Reset form
            form.reset();
            tinymce.get('blogContent').setContent('');
            
            // Reload blog table
            this.loadBlogTable();
            
            // Show success message
            showToast('success', 'Success', 'Blog post created successfully');
        } catch (error) {
            console.error('Error creating blog:', error);
            showToast('error', 'Error', 'Failed to create blog post');
        }
    },
    
    /**
     * Edit a blog post
     * @param {string} id - Blog ID
     */
    editBlog: function(id) {
        try {
            // Get blog post
            const blog = DataService.getById('blogs', id);
            
            if (!blog) {
                showToast('error', 'Error', 'Blog post not found');
                return;
            }
            
            // Populate edit form
            const form = document.getElementById('editBlogForm');
            form.querySelector('#editBlogId').value = blog.id;
            form.querySelector('#editBlogTitle').value = blog.title;
            form.querySelector('#editBlogSummary').value = blog.summary;
            form.querySelector('#editBlogImageUrl').value = blog.imageUrl || '';
            form.querySelector('#editBlogStatus').value = blog.status;
            
            // Set TinyMCE content
            if (tinymce.get('editBlogContent')) {
                tinymce.get('editBlogContent').setContent(blog.content || '');
            }
            
            // Show modal
            document.getElementById('editBlogModal').style.display = 'block';
        } catch (error) {
            console.error('Error editing blog:', error);
            showToast('error', 'Error', 'Failed to load blog post for editing');
        }
    },
    
    /**
     * Update a blog post
     * @param {Event} event - Form submit event
     */
    updateBlog: function(event) {
        event.preventDefault();
        
        try {
            // Get form data
            const form = event.target;
            const id = form.querySelector('#editBlogId').value;
            const title = form.querySelector('#editBlogTitle').value.trim();
            const summary = form.querySelector('#editBlogSummary').value.trim();
            const content = tinymce.get('editBlogContent').getContent();
            const status = form.querySelector('#editBlogStatus').value;
            const imageUrl = form.querySelector('#editBlogImageUrl').value.trim();
            
            // Validate form data
            if (!title) {
                showToast('error', 'Validation Error', 'Title is required');
                return;
            }
            
            if (!summary) {
                showToast('error', 'Validation Error', 'Summary is required');
                return;
            }
            
            if (!content) {
                showToast('error', 'Validation Error', 'Content is required');
                return;
            }
            
            // Update blog post
            const updatedBlog = DataService.update('blogs', id, {
                title,
                summary,
                content,
                status,
                imageUrl: imageUrl || 'images/blog-placeholder.jpg'
            });
            
            if (!updatedBlog) {
                showToast('error', 'Error', 'Blog post not found');
                return;
            }
            
            // Close modal
            document.getElementById('editBlogModal').style.display = 'none';
            
            // Reload blog table
            this.loadBlogTable();
            
            // Show success message
            showToast('success', 'Success', 'Blog post updated successfully');
        } catch (error) {
            console.error('Error updating blog:', error);
            showToast('error', 'Error', 'Failed to update blog post');
        }
    },
    
    /**
     * Delete a blog post
     * @param {string} id - Blog ID
     */
    deleteBlog: function(id) {
        if (!confirm('Are you sure you want to delete this blog post?')) {
            return;
        }
        
        try {
            // Delete blog post
            const deleted = DataService.delete('blogs', id);
            
            if (!deleted) {
                showToast('error', 'Error', 'Blog post not found');
                return;
            }
            
            // Reload blog table
            this.loadBlogTable();
            
            // Show success message
            showToast('success', 'Success', 'Blog post deleted successfully');
        } catch (error) {
            console.error('Error deleting blog:', error);
            showToast('error', 'Error', 'Failed to delete blog post');
        }
    },
    
    /**
     * Format date for display
     * @param {string} dateString - Date string
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
     * Initialize blog manager
     */
    init: function() {
        // Load blog table
        this.loadBlogTable();
        
        // Add event listeners
        const addBlogForm = document.getElementById('addBlogForm');
        if (addBlogForm) {
            addBlogForm.addEventListener('submit', (event) => this.createBlog(event));
        }
        
        const editBlogForm = document.getElementById('editBlogForm');
        if (editBlogForm) {
            editBlogForm.addEventListener('submit', (event) => this.updateBlog(event));
        }
    }
};
