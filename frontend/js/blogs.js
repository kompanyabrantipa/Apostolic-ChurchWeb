document.addEventListener('DOMContentLoaded', function() {
    // Seed sample content if needed
    if (typeof seedSampleContent === 'function') {
        seedSampleContent();
    }
    
    loadBlogs();
    
    // Listen for content sync events (same tab)
    window.addEventListener('contentSync', function(event) {
        const syncData = event.detail;
        if (syncData.contentType === 'blogs') {
            console.log('Frontend blogs: Detected content sync event', syncData);
            loadBlogs();
        }
    });
    
    // Listen for storage events (cross-tab)
    window.addEventListener('storage', function(event) {
        if (event.key === 'lastSync' || event.key === 'blogs') {
            const syncData = event.key === 'lastSync' ? JSON.parse(event.newValue) : null;
            if (!syncData || syncData.contentType === 'blogs') {
                console.log('Frontend blogs: Detected storage change event');
                loadBlogs();
            }
        }
    });
    
    // Set up auto-refresh every 60 seconds
    setInterval(loadBlogs, 60000);
});

function loadBlogs() {
    try {
        // Get published blogs from localStorage
        const allBlogs = JSON.parse(localStorage.getItem('blogs') || '[]');
        const blogs = allBlogs.filter(blog => blog.status === 'published');
        
        // Sort blogs by date (newest first)
        blogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        displayBlogs(blogs);
        console.log(`Frontend blogs: Loaded ${blogs.length} published blog posts`);
    } catch (error) {
        console.error('Error loading blogs:', error);
        const blogsContainer = document.querySelector('.blogs-container');
        if (blogsContainer) {
            blogsContainer.innerHTML = '<p class="error-message">Unable to load blog posts at this time. Please try again later.</p>';
        }
    }
}

function displayBlogs(blogs) {
    const blogsContainer = document.querySelector('.blogs-container');
    if (!blogsContainer) {
        console.error('Blogs container not found in the DOM');
        return;
    }
    
    if (blogs.length === 0) {
        blogsContainer.innerHTML = '<p class="no-content">No blog posts available at this time.</p>';
        return;
    }
    
    let html = '';
    blogs.forEach(blog => {
        html += `
            <div class="blog-card">
                <div class="blog-image">
                    <img src="${blog.imageUrl || 'images/placeholder.jpg'}" alt="${blog.title}">
                </div>
                <div class="blog-content">
                    <h3>${blog.title}</h3>
                    <p class="date">${formatDate(blog.createdAt)}</p>
                    <p>${blog.summary}</p>
                    <a href="blog-detail.html?id=${blog.id}" class="read-more">Read More</a>
                </div>
            </div>
        `;
    });
    
    blogsContainer.innerHTML = html;
}

function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateString;
    }
}



