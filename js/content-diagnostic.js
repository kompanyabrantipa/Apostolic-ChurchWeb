/**
 * Church Website Content Diagnostic Utility
 * Add this script to your pages to help diagnose content display issues
 */

// Run diagnostic when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Content diagnostic utility loaded. Run diagnoseContent() in console to check for issues.');
});

/**
 * Diagnose content display issues
 * Run this function in the browser console to check for common problems
 */
function diagnoseContent() {
    console.group('Church Website Content Diagnostic');
    
    // Check HTML containers
    console.log('1. Checking HTML containers:');
    const blogContainer = document.querySelector('.posts-grid');
    const eventsContainer = document.querySelector('.events-list');
    const sermonContainer = document.getElementById('sermonContainer');
    
    console.log(`- Blog container (.posts-grid): ${blogContainer ? '✅ Found' : '❌ Missing'}`);
    console.log(`- Events container (.events-list): ${eventsContainer ? '✅ Found' : '❌ Missing'}`);
    console.log(`- Sermon container (#sermonContainer): ${sermonContainer ? '✅ Found' : '❌ Missing'}`);
    
    // Check localStorage data
    console.log('\n2. Checking localStorage data:');
    let blogs = [], events = [], sermons = [];
    
    try {
        blogs = JSON.parse(localStorage.getItem('blogs') || '[]');
        console.log(`- Blogs in localStorage: ${blogs.length}`);
        
        const publishedBlogs = blogs.filter(blog => blog.status === 'published');
        console.log(`- Published blogs: ${publishedBlogs.length}`);
    } catch (error) {
        console.log('❌ Error parsing blogs from localStorage:', error);
    }
    
    try {
        events = JSON.parse(localStorage.getItem('events') || '[]');
        console.log(`- Events in localStorage: ${events.length}`);
        
        const publishedEvents = events.filter(event => event.status === 'published');
        console.log(`- Published events: ${publishedEvents.length}`);
        
        const upcomingEvents = publishedEvents.filter(event => {
            try { return new Date(event.date) >= new Date(); } 
            catch(e) { return false; }
        });
        console.log(`- Upcoming published events: ${upcomingEvents.length}`);
    } catch (error) {
        console.log('❌ Error parsing events from localStorage:', error);
    }
    
    try {
        sermons = JSON.parse(localStorage.getItem('sermons') || '[]');
        console.log(`- Sermons in localStorage: ${sermons.length}`);
        
        const publishedSermons = sermons.filter(sermon => sermon.status === 'published');
        console.log(`- Published sermons: ${publishedSermons.length}`);
    } catch (error) {
        console.log('❌ Error parsing sermons from localStorage:', error);
    }
    
    // Check JavaScript functions
    console.log('\n3. Checking JavaScript functions:');
    console.log(`- loadBlogPosts function: ${typeof loadBlogPosts === 'function' ? '✅ Available' : '❌ Missing'}`);
    console.log(`- loadEvents function: ${typeof loadEvents === 'function' ? '✅ Available' : '❌ Missing'}`);
    console.log(`- loadSermons function: ${typeof loadSermons === 'function' ? '✅ Available' : '❌ Missing'}`);
    
    // Check script loading
    console.log('\n4. Checking script loading:');
    const scripts = Array.from(document.querySelectorAll('script')).map(s => s.src);
    console.log(`- blog.js: ${scripts.some(s => s.includes('blog.js')) ? '✅ Loaded' : '❌ Not found'}`);
    console.log(`- events.js: ${scripts.some(s => s.includes('events.js')) ? '✅ Loaded' : '❌ Not found'}`);
    console.log(`- sermons.js: ${scripts.some(s => s.includes('sermons.js')) ? '✅ Loaded' : '❌ Not found'}`);
    
    console.groupEnd();
    
    // Provide recommendations
    console.group('Recommendations:');
    
    if (!blogContainer && !eventsContainer && !sermonContainer) {
        console.log('❌ No content containers found. Add the missing HTML containers to your page.');
    }
    
    if (blogs.length === 0 && events.length === 0 && sermons.length === 0) {
        console.log('❌ No content found in localStorage. Try running seedSampleContent() if available.');
    }
    
    console.groupEnd();
    
    return 'Diagnostic complete. See console for results.';
}

// Make function available globally
window.diagnoseContent = diagnoseContent;

/**
 * Fix common content display issues
 * Run this function in the browser console to attempt automatic fixes
 */
function fixContentIssues() {
    console.group('Attempting to fix content issues:');
    
    // 1. Create missing containers if needed
    const contentSection = document.querySelector('.content-section');
    if (!contentSection) {
        console.log('Creating missing content section...');
        const main = document.querySelector('main') || document.body;
        const newSection = document.createElement('div');
        newSection.className = 'content-section';
        main.appendChild(newSection);
    }
    
    // 2. Create blog container if needed
    if (!document.querySelector('.posts-grid')) {
        console.log('Creating missing blog container...');
        const section = document.querySelector('.content-section');
        const blogContainer = document.createElement('div');
        blogContainer.className = 'posts-grid';
        section.appendChild(blogContainer);
    }
    
    // 3. Create events container if needed
    if (!document.querySelector('.events-list')) {
        console.log('Creating missing events container...');
        const section = document.querySelector('.content-section');
        const eventsContainer = document.createElement('div');
        eventsContainer.className = 'events-list';
        section.appendChild(eventsContainer);
    }
    
    // 4. Create sermon container if needed
    if (!document.getElementById('sermonContainer')) {
        console.log('Creating missing sermon container...');
        const section = document.querySelector('.content-section');
        const sermonContainer = document.createElement('div');
        sermonContainer.id = 'sermonContainer';
        section.appendChild(sermonContainer);
    }
    
    // 5. Try to load content
    console.log('Attempting to load content...');
    if (typeof loadBlogPosts === 'function') {
        console.log('Loading blog posts...');
        loadBlogPosts();
    }
    
    if (typeof loadEvents === 'function') {
        console.log('Loading events...');
        loadEvents();
    }
    
    if (typeof loadSermons === 'function') {
        console.log('Loading sermons...');
        loadSermons();
    }
    
    console.groupEnd();
    return 'Fix attempt complete. Run diagnoseContent() to check if issues were resolved.';
}

// Make function available globally
window.fixContentIssues = fixContentIssues;

