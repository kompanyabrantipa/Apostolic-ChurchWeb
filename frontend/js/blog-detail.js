document.addEventListener('DOMContentLoaded', function() {
    // Get blog ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const blogId = urlParams.get('id');
    
    if (blogId) {
        loadBlogDetail(blogId);
    } else {
        showError('Blog post not found');
    }
});

function loadBlogDetail(id) {
    try {
        // Get all blogs from localStorage
        const allBlogs = JSON.parse(localStorage.getItem('blogs') || '[]');
        
        // Find the specific blog
        const blog = allBlogs.find(blog => blog.id === id);
        
        if (!blog) {
            showError('Blog post not found');
            return;
        }
        
        // Only show published blogs
        if (blog.status !== 'published') {
            showError('This blog post is not currently available');
            return;
        }
        
        displayBlogDetail(blog);
    } catch (error) {
        console.error('Error loading blog detail:', error);
        showError('Unable to load blog post at this time. Please try again later.');
    }
}

function displayBlogDetail(blog) {
    const container = document.querySelector('.blog-detail-container');
    if (!container) return;
    
    const blogDate = new Date(blog.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    let html = `
        <article class="blog-detail">
            <h1 class="blog-title">${blog.title}</h1>
            <div class="blog-meta">
                <span class="blog-date"><i class="fas fa-calendar-alt"></i> ${blogDate}</span>
            </div>
            ${blog.imageUrl ? 
                `<div class="blog-image"><img src="${blog.imageUrl}" alt="${blog.title}"></div>` : 
                ''
            }
            <div class="blog-content">
                ${blog.content}
            </div>
        </article>
        <div class="blog-navigation">
            <a href="blogs.html" class="btn btn-secondary"><i class="fas fa-arrow-left"></i> Back to Blogs</a>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Update page title
    document.title = `${blog.title} | Apostolic Church`;
}

function showError(message) {
    const container = document.querySelector('.blog-detail-container');
    if (container) {
        container.innerHTML = `
            <div class="error-container">
                <p class="error-message">${message}</p>
                <div class="error-actions">
                    <a href="blogs.html" class="btn btn-primary">Back to Blogs</a>
                </div>
            </div>
        `;
    }
}
