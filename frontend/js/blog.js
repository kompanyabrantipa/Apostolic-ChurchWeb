// Blog pagination state
let blogPagination = {
    currentPage: 0,
    postsPerPage: 6,
    allPosts: [],
    displayedPosts: []
};

document.addEventListener('DOMContentLoaded', function() {
    // Initial load of blog posts
    loadBlogPosts();

    // Initialize Load More button
    initLoadMoreButton();

    // Listen for storage changes (cross-tab communication)
    window.addEventListener('storage', function(event) {
        if (event.key === 'blogs' || event.key === 'lastSync') {
            const syncData = event.key === 'lastSync' ? JSON.parse(event.newValue || '{}') : null;
            if (!syncData || syncData.contentType === 'blogs' || syncData.contentType === 'all') {
                resetPagination();
                loadBlogPosts();
            }
        }
    });

    // Listen for content sync events (same-tab updates)
    window.addEventListener('contentSync', function(event) {
        const syncData = event.detail;
        if (syncData.contentType === 'blogs' || syncData.contentType === 'all') {
            resetPagination();
            loadBlogPosts();
        }
    });
});

function loadBlogPosts(loadMore = false) {
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
        // Use DataService to get blogs from API
        if (typeof DataService !== 'undefined' && DataService.getPublished) {
            DataService.getPublished('blogs').then(publishedBlogs => {
                // Sort by date (newest first)
                publishedBlogs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

                if (publishedBlogs.length === 0) {
                    postsGrid.innerHTML = '<div class="no-content">No blog posts available at this time.</div>';
                    updateLoadMoreButton(false, false);
                    return;
                }

                // Store all posts for pagination
                blogPagination.allPosts = publishedBlogs;

                if (!loadMore) {
                    // Initial load - reset pagination
                    blogPagination.currentPage = 0;
                    blogPagination.displayedPosts = [];
                }

                // Calculate posts to display
                const startIndex = blogPagination.currentPage * blogPagination.postsPerPage;
                const endIndex = startIndex + blogPagination.postsPerPage;
                const newPosts = publishedBlogs.slice(startIndex, endIndex);

                // Add new posts to displayed posts
                blogPagination.displayedPosts = blogPagination.displayedPosts.concat(newPosts);

                // Render posts
                if (loadMore) {
                    // Append new posts to existing content
                    const newPostsHTML = newPosts.map(blog => createBlogPostHTML(blog)).join('');
                    postsGrid.insertAdjacentHTML('beforeend', newPostsHTML);
                } else {
                    // Replace all content
                    postsGrid.innerHTML = blogPagination.displayedPosts.map(blog => createBlogPostHTML(blog)).join('');
                }

                // Update pagination state
                blogPagination.currentPage++;

                // Update Load More button visibility
                const hasMorePosts = blogPagination.displayedPosts.length < publishedBlogs.length;
                updateLoadMoreButton(true, hasMorePosts);

                console.log(`Loaded ${newPosts.length} blog posts (${blogPagination.displayedPosts.length}/${publishedBlogs.length} total)`);
            }).catch(error => {
                console.error('Error loading blog posts:', error);
                postsGrid.innerHTML = '<div class="error-message">Unable to load blog posts. Please try again later.</div>';
                updateLoadMoreButton(false, false);
            });
        } else {
            // Fallback to localStorage
            console.warn('DataService not available, using localStorage fallback');
            const blogs = JSON.parse(localStorage.getItem('blogs') || '[]');

            // Filter published blogs only and sort by date (newest first)
            const publishedBlogs = blogs
                .filter(blog => blog.status === 'published')
                .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

            if (publishedBlogs.length === 0) {
                postsGrid.innerHTML = '<div class="no-content">No blog posts available at this time.</div>';
                updateLoadMoreButton(false, false);
                return;
            }

            // Store all posts for pagination
            blogPagination.allPosts = publishedBlogs;

            if (!loadMore) {
                // Initial load - reset pagination
                blogPagination.currentPage = 0;
                blogPagination.displayedPosts = [];
            }

            // Calculate posts to display
            const startIndex = blogPagination.currentPage * blogPagination.postsPerPage;
            const endIndex = startIndex + blogPagination.postsPerPage;
            const newPosts = publishedBlogs.slice(startIndex, endIndex);

            // Add new posts to displayed posts
            blogPagination.displayedPosts = blogPagination.displayedPosts.concat(newPosts);

            // Render posts
            if (loadMore) {
                // Append new posts to existing content
                const newPostsHTML = newPosts.map(blog => createBlogPostHTML(blog)).join('');
                postsGrid.insertAdjacentHTML('beforeend', newPostsHTML);
            } else {
                // Replace all content
                postsGrid.innerHTML = blogPagination.displayedPosts.map(blog => createBlogPostHTML(blog)).join('');
            }

            // Update pagination state
            blogPagination.currentPage++;

            // Update Load More button visibility
            const hasMorePosts = blogPagination.displayedPosts.length < publishedBlogs.length;
            updateLoadMoreButton(true, hasMorePosts);

            console.log(`Loaded ${newPosts.length} blog posts (${blogPagination.displayedPosts.length}/${publishedBlogs.length} total)`);
        }
    } catch (error) {
        console.error('Error loading blog posts:', error);
        postsGrid.innerHTML = '<div class="error-message">Unable to load blog posts. Please try again later.</div>';
        updateLoadMoreButton(false, false);
    }
}

function resetPagination() {
    blogPagination.currentPage = 0;
    blogPagination.allPosts = [];
    blogPagination.displayedPosts = [];
}

function initLoadMoreButton() {
    const loadMoreBtn = document.querySelector('.load-more');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            // Show loading state
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
            this.disabled = true;

            // Simulate loading delay for better UX
            setTimeout(() => {
                loadBlogPosts(true);
                this.innerHTML = originalText;
                this.disabled = false;
            }, 500);
        });
    }
}

function updateLoadMoreButton(show, hasMore) {
    const loadMoreBtn = document.querySelector('.load-more');
    if (loadMoreBtn) {
        if (show && hasMore) {
            loadMoreBtn.style.display = 'block';
            loadMoreBtn.innerHTML = 'Load More Posts';
        } else if (show && !hasMore) {
            loadMoreBtn.style.display = 'block';
            loadMoreBtn.innerHTML = 'All posts loaded';
            loadMoreBtn.disabled = true;
            loadMoreBtn.style.opacity = '0.6';
        } else {
            loadMoreBtn.style.display = 'none';
        }
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
    const category = blog.category || 'Blog';
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
