document.addEventListener('DOMContentLoaded', function() {
    // Initial load of blog posts
    loadBlogPosts();
    
    // Listen for storage changes (cross-tab communication)
    window.addEventListener('storage', function(event) {
        if (event.key === 'blogs' || event.key === 'lastSync') {
            const syncData = event.key === 'lastSync' ? JSON.parse(event.newValue || '{}') : null;
            if (!syncData || syncData.contentType === 'blogs' || syncData.contentType === 'all') {
                loadBlogPosts();
            }
        }
    });
    
    // Listen for content sync events (same-tab updates)
    window.addEventListener('contentSync', function(event) {
        const syncData = event.detail;
        if (syncData.contentType === 'blogs' || syncData.contentType === 'all') {
            loadBlogPosts();
        }
    });
});

function loadBlogPosts() {
    // Try multiple possible selectors to find the container
    const postsGrid = document.querySelector('.blog-masonry') ||
                      document.querySelector('.blog-container') ||
                      document.querySelector('.posts-grid') ||
                      document.querySelector('.content-section .posts-grid');

    if (!postsGrid) {
        console.warn('Blog container not found. Tried: .blog-masonry, .blog-container, .posts-grid');
        return;
    }

    console.log('Found blog container:', postsGrid.className);
    
    try {
        // Get blogs from localStorage
        const blogs = JSON.parse(localStorage.getItem('blogs') || '[]');
        
        // Filter published blogs only
        const publishedBlogs = blogs.filter(blog => blog.status === 'published');
        
        if (publishedBlogs.length === 0) {
            postsGrid.innerHTML = '<div class="no-content">No blog posts available at this time.</div>';
            return;
        }
        
        // Render blogs (using your existing createBlogPostHTML function)
        postsGrid.innerHTML = publishedBlogs.map(blog => createBlogPostHTML(blog)).join('');
        
        console.log(`Loaded ${publishedBlogs.length} blog posts`);
    } catch (error) {
        console.error('Error loading blog posts:', error);
        postsGrid.innerHTML = '<div class="error-message">Unable to load blog posts. Please try again later.</div>';
    }
}

function createBlogPostHTML(blog) {
    // Format date
    const date = blog.createdAt ? new Date(blog.createdAt) : new Date();
    const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Default values for missing properties
    const category = blog.category || 'Faith';
    const author = blog.author || 'Church Staff';
    const comments = blog.comments || 0;
    const excerpt = blog.summary || blog.content?.substring(0, 150) || '';

    // Create media display - prioritize uploaded media over default placeholder
    const mediaDisplay = createBlogMediaDisplay(blog.imageUrl, blog.title, category);

    return `
        <article class="blog-post">
            ${mediaDisplay}
            <div class="post-content">
                <h3>${blog.title}</h3>
                <div class="post-meta">
                    <span><i class="fas fa-user"></i> ${author}</span>
                    <span><i class="fas fa-calendar"></i> ${formattedDate}</span>
                    <span><i class="fas fa-comments"></i> ${comments} Comments</span>
                </div>
                <p>${excerpt}${excerpt.length >= 150 ? '...' : ''}</p>
                <a href="blog-detail.html?id=${blog.id}" class="btn-small">Read More</a>
            </div>
        </article>
    `;
}

/**
 * Create media display HTML for blog cards
 * @param {string} imageUrl - The image URL
 * @param {string} title - The blog title for alt text
 * @param {string} category - The blog category
 * @returns {string} HTML for media display
 */
function createBlogMediaDisplay(imageUrl, title, category) {
    // Use uploaded image if available, otherwise use default placeholder
    const mediaUrl = imageUrl || 'images/blog-placeholder.jpg';

    // Check if it's a video file (though blogs typically use images)
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.avi', '.mov'];
    const isVideo = videoExtensions.some(ext => mediaUrl.toLowerCase().includes(ext)) ||
                   mediaUrl.startsWith('data:video/');

    if (isVideo) {
        return `
            <div class="card-media post-image">
                <video src="${mediaUrl}" class="media-thumb" controls preload="metadata">
                    Your browser does not support the video tag.
                </video>
                <span class="category-badge">${category}</span>
            </div>
        `;
    } else {
        return `
            <div class="card-media post-image">
                <img src="${mediaUrl}" alt="${title}" class="media-thumb" loading="lazy" />
                <span class="category-badge">${category}</span>
            </div>
        `;
    }
}
