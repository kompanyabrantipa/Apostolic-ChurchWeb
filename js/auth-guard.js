// Auth Guard - Protect admin routes
(function() {
    // Check if we're on a protected page (not login.html)
    if (!window.location.pathname.includes('login.html')) {
        console.log('Auth guard: Checking authentication...');
        
        // Check for authentication token
        const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
        
        if (!token) {
            console.log('Auth guard: No token found, redirecting to login');
            // Redirect to login page
            window.location.href = '/login.html';
        } else {
            console.log('Auth guard: Token found, user is authenticated');
            // User is authenticated, continue loading page
            // We'll keep the body hidden until the page is fully loaded
            // The body will be shown in the DOMContentLoaded event in admin.js
        }
    }
})();

