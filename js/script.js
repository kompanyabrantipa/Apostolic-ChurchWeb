// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', function() {
    // Add loaded class to body for animations
    document.body.classList.add('loaded');
    
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            this.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }
    
    // Animation using Intersection Observer
    const animatedElements = document.querySelectorAll('[data-aos]');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('aos-animate');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });
    
    animatedElements.forEach(element => {
        observer.observe(element);
    });
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            if (this.getAttribute('href') !== '#') {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
    
    initCalendar();
    
    // Update copyright year
    updateCopyrightYear();
    
    // Initialize hero slideshow
    initHeroSlideshow();
    
    // Dropdown Menu Functionality for Mobile
    // Get all dropdown items
    const dropdownItems = document.querySelectorAll('.has-dropdown');
    
    // For mobile view
    if (window.innerWidth <= 768) {
        dropdownItems.forEach(item => {
            // Create dropdown toggle button
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'dropdown-toggle';
            toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
            item.appendChild(toggleBtn);
            
            // Toggle dropdown on button click
            toggleBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                item.classList.toggle('open');
                
                // Rotate chevron
                const icon = this.querySelector('i');
                if (item.classList.contains('open')) {
                    icon.style.transform = 'rotate(180deg)';
                } else {
                    icon.style.transform = 'rotate(0)';
                }
            });
        });
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.has-dropdown')) {
            dropdownItems.forEach(item => {
                item.classList.remove('open');
                const icon = item.querySelector('.dropdown-toggle i');
                if (icon) icon.style.transform = 'rotate(0)';
            });
        }
    });
});

function initCalendar() {
    const calendarBody = document.querySelector('.calendar-body');
    if (!calendarBody) return;
    
    // Clear placeholder
    calendarBody.innerHTML = '';
    
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    
    // Load events from localStorage for calendar display
    const events = JSON.parse(localStorage.getItem('events') || '[]')
        .filter(event => event.status === 'published')
        .map(event => ({
            date: new Date(event.date),
            title: event.title,
            type: event.category || 'general'
        }));
    
    renderCalendar(currentMonth, currentYear, events, calendarBody);
    
    // Add event listeners for navigation
    document.querySelectorAll('.calendar-nav-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            if (this.querySelector('.fa-chevron-left')) {
                currentMonth--;
                if (currentMonth < 0) {
                    currentMonth = 11;
                    currentYear--;
                }
            } else {
                currentMonth++;
                if (currentMonth > 11) {
                    currentMonth = 0;
                    currentYear++;
                }
            }
            updateMonthDisplay(currentMonth, currentYear);
            renderCalendar(currentMonth, currentYear, events, calendarBody);
        });
    });
}

function updateMonthDisplay(month, year) {
    const monthNames = ["January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"];
    document.querySelector('.calendar-header h3').textContent = `${monthNames[month]} ${year}`;
}

function renderCalendar(month, year, events, calendarElement) {
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Clear previous calendar
    calendarElement.innerHTML = '';
    
    // Create calendar table
    const calendarTable = document.createElement('table');
    calendarTable.className = 'calendar-table';
    
    // Create header row with day names
    const headerRow = document.createElement('tr');
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 0; i < 7; i++) {
        const th = document.createElement('th');
        th.textContent = dayNames[i];
        headerRow.appendChild(th);
    }
    
    calendarTable.appendChild(headerRow);
    
    // Create calendar days
    let date = 1;
    for (let i = 0; i < 6; i++) {
        // Create week row
        const row = document.createElement('tr');
        
        // Create cells for each day of the week
        for (let j = 0; j < 7; j++) {
            const cell = document.createElement('td');
            
            if (i === 0 && j < firstDay) {
                // Empty cells before the first day of the month
                cell.classList.add('calendar-day', 'empty');
            } else if (date > daysInMonth) {
                // Empty cells after the last day of the month
                cell.classList.add('calendar-day', 'empty');
            } else {
                // Regular day cells
                cell.classList.add('calendar-day');
                
                const dayNumber = document.createElement('span');
                dayNumber.className = 'day-number';
                dayNumber.textContent = date;
                cell.appendChild(dayNumber);
                
                // Check if there are events on this day
                const dayEvents = events.filter(event => 
                    event.date.getDate() === date && 
                    event.date.getMonth() === month && 
                    event.date.getFullYear() === year
                );
                
                if (dayEvents.length > 0) {
                    cell.classList.add('has-event');
                    
                    const eventIndicator = document.createElement('div');
                    eventIndicator.className = 'event-indicator';
                    
                    dayEvents.forEach(event => {
                        const dot = document.createElement('span');
                        dot.className = `event-dot ${event.type}`;
                        eventIndicator.appendChild(dot);
                        
                        // Make cell clickable to show event details
                        cell.addEventListener('click', () => showEventDetails(event, cell));
                    });
                    
                    cell.appendChild(eventIndicator);
                }
                
                // Highlight current day
                const today = new Date();
                if (date === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                    cell.classList.add('today');
                }
                
                date++;
            }
            
            row.appendChild(cell);
        }
        
        calendarTable.appendChild(row);
        
        // Stop creating rows if we've gone past the last day of the month
        if (date > daysInMonth) {
            break;
        }
    }
    
    calendarElement.appendChild(calendarTable);
}

function showEventDetails(event, cell) {
    // Remove any existing event details popup
    document.querySelectorAll('.event-popup').forEach(popup => popup.remove());
    
    const popup = document.createElement('div');
    popup.className = 'event-popup';
    
    const eventType = document.createElement('span');
    eventType.className = `event-type-label ${event.type}`;
    eventType.textContent = event.type.charAt(0).toUpperCase() + event.type.slice(1);
    
    const eventTitle = document.createElement('h4');
    eventTitle.textContent = event.title;
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-popup';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        popup.remove();
    });
    
    popup.appendChild(closeBtn);
    popup.appendChild(eventType);
    popup.appendChild(eventTitle);
    
    // Position the popup near the cell
    const rect = cell.getBoundingClientRect();
    const calendarRect = document.querySelector('.calendar-container').getBoundingClientRect();
    
    document.body.appendChild(popup);
    
    // Adjust position to be next to the cell
    const popupRect = popup.getBoundingClientRect();
    
    let top = rect.top + window.scrollY;
    let left = rect.right + window.scrollX + 10;
    
    // Make sure popup doesn't go off the right edge
    if (left + popupRect.width > calendarRect.right) {
        left = rect.left + window.scrollX - popupRect.width - 10;
    }
    
    popup.style.top = `${top}px`;
    popup.style.left = `${left}px`;
    
    // Close popup when clicking outside
    document.addEventListener('click', function closePopup(e) {
        if (!popup.contains(e.target) && e.target !== cell) {
            popup.remove();
            document.removeEventListener('click', closePopup);
        }
    });
}

// Update copyright year in footer
function updateCopyrightYear() {
    const currentYear = new Date().getFullYear();
    const copyrightElements = document.querySelectorAll('.footer-bottom p');
    
    copyrightElements.forEach(element => {
        if (element.textContent.includes('©')) {
            element.textContent = element.textContent.replace(/\d{4}/, currentYear);
        }
    });
}

// Hero Section Slideshow
function initHeroSlideshow() {
    const slides = document.querySelectorAll('.slideshow-slide');
    if (slides.length === 0) return;
    
    let currentSlide = 0;
    const slideInterval = 5000; // Change slide every 5 seconds
    
    function nextSlide() {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }
    
    // Start the slideshow
    setInterval(nextSlide, slideInterval);
}

// Sermon handling functions - now use localStorage data
// const sermons = []; // REMOVED: hardcoded sermons array

function handleSermonUpload(event) {
    event.preventDefault();
    
    const formData = {
        title: document.getElementById('sermonTitle').value,
        speaker: document.getElementById('sermonSpeaker').value,
        date: document.getElementById('sermonDate').value,
        file: document.getElementById('sermonFile').files[0],
        description: document.getElementById('sermonDescription').value
    };
    
    // In a real application, you would send this to a server
    sermons.unshift(formData);
    displaySermons();
    event.target.reset();
}

function displaySermons() {
    const container = document.getElementById('sermonContainer');
    container.innerHTML = sermons.map(sermon => `
        <div class="sermon-card">
            <div class="sermon-info">
                <h3 class="sermon-title">${sermon.title}</h3>
                <div class="sermon-meta">
                    <span><i class="fas fa-user"></i> ${sermon.speaker}</span>
                    <span><i class="fas fa-calendar"></i> ${new Date(sermon.date).toLocaleDateString()}</span>
                </div>
                ${sermon.description ? `<p class="sermon-description">${sermon.description}</p>` : ''}
            </div>
            <div class="sermon-actions">
                <button class="action-btn play">
                    <i class="fas fa-play"></i> Play
                </button>
                <button class="action-btn download">
                    <i class="fas fa-download"></i> Download
                </button>
            </div>
        </div>
    `).join('');
}

// Event listeners
const sermonUploadForm = document.getElementById('sermonUploadForm');
if (sermonUploadForm) {
    sermonUploadForm.addEventListener('submit', handleSermonUpload);
}
const speakerFilter = document.getElementById('speakerFilter');
if (speakerFilter) {
    speakerFilter.addEventListener('change', filterSermons);
}

const sermonSearch = document.getElementById('sermonSearch');
if (sermonSearch) {
    sermonSearch.addEventListener('input', filterSermons);
}

function filterSermons() {
    const speaker = document.getElementById('speakerFilter').value;
    const search = document.getElementById('sermonSearch').value.toLowerCase();
    
    const filtered = sermons.filter(sermon => {
        const matchesSpeaker = speaker === 'all' || sermon.speaker.toLowerCase().includes(speaker);
        const matchesSearch = sermon.title.toLowerCase().includes(search) || 
                            sermon.description.toLowerCase().includes(search);
        return matchesSpeaker && matchesSearch;
    });
    
    displayFilteredSermons(filtered);
}

// Blog functionality - REMOVED hardcoded content
// Blog pages now use dynamic content from localStorage via blog.js
function initBlog() {
    console.log('⚠️ initBlog() with hardcoded content has been removed.');
    console.log('Blog pages now use dynamic content from localStorage via blog.js');

    // All blog functionality is now handled by blog.js
    // No hardcoded content initialization needed
}

// REMOVED: renderFeaturedPost - hardcoded blog content removed
// Featured posts are now handled by blog.js using localStorage data

// REMOVED: updateCategoryCounters - hardcoded blog content removed
// Category counters are now handled by blog.js using localStorage data

// REMOVED: renderBlogPosts - hardcoded blog content removed
// Blog posts are now rendered by blog.js using localStorage data

// REMOVED: renderRecentPosts - hardcoded blog content removed
// Recent posts are now handled by blog.js using localStorage data

// REMOVED: initBlogSearch - hardcoded blog content removed
// Blog search is now handled by blog.js using localStorage data

// Initialize blog functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize hardcoded blog content if we're NOT on the blog page
    // The blog page should use dynamic content from localStorage via blog.js
    const isBlogPage = window.location.pathname.includes('blog.html') ||
                       document.querySelector('.blog-content') !== null;

    if (!isBlogPage) {
        initBlog();
    } else {
        console.log('Blog page detected - skipping hardcoded blog initialization, using dynamic content instead');
    }
});

// REMOVED: seedSampleContent call - no hardcoded content initialization
// All content now comes from localStorage via admin dashboard

// Check if we're on a detail page
const urlParams = new URLSearchParams(window.location.search);
const contentId = urlParams.get('id');

if (contentId) {
    // Determine which detail page we're on
    if (window.location.pathname.includes('blog-detail')) {
        loadBlogDetail(contentId);
    } else if (window.location.pathname.includes('event-detail')) {
        loadEventDetail(contentId);
    } else if (window.location.pathname.includes('sermon-detail')) {
        loadSermonDetail(contentId);
    }
}

// Handle mobile menu toggle
const menuToggle = document.querySelector('.menu-toggle');
if (menuToggle) {
    menuToggle.addEventListener('click', function() {
        const nav = document.querySelector('nav ul');
        if (nav) {
            nav.classList.toggle('active');
        }
    });
}

// Handle newsletter form submission
const newsletterForm = document.getElementById('newsletterForm');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('newsletterEmail');
        if (email && email.value) {
            // Store subscription in localStorage
            const subscriptions = JSON.parse(localStorage.getItem('subscriptions') || '[]');
            subscriptions.push({
                email: email.value,
                date: new Date().toISOString()
            });
            localStorage.setItem('subscriptions', JSON.stringify(subscriptions));
            
            // Show success message
            alert('Thank you for subscribing to our newsletter!');
            email.value = '';
        }
    });
}

// Function to load blog detail
function loadBlogDetail(blogId) {
    try {
        const blogs = JSON.parse(localStorage.getItem('blogs') || '[]');
        const blog = blogs.find(b => b.id === blogId && b.status === 'published');
        
        if (!blog) {
            showDetailError('Blog post not found');
            return;
        }
        
        // Update page title
        document.title = `${blog.title} - Apostolic Church`;
        
        // Update content
        const blogTitle = document.querySelector('.blog-detail-title');
        if (blogTitle) blogTitle.textContent = blog.title;
        
        const blogDate = document.querySelector('.blog-detail-date');
        if (blogDate) blogDate.textContent = formatDate(blog.createdAt);
        
        const blogImage = document.querySelector('.blog-detail-image img');
        if (blogImage) blogImage.src = blog.imageUrl || 'images/placeholder.jpg';
        
        const blogContent = document.querySelector('.blog-detail-content');
        if (blogContent) blogContent.innerHTML = blog.content;
        
        console.log('Loaded blog detail:', blog.title);
    } catch (error) {
        console.error('Error loading blog detail:', error);
        showDetailError('Unable to load blog post');
    }
}

// Function to load event detail
function loadEventDetail(eventId) {
    try {
        const events = JSON.parse(localStorage.getItem('events') || '[]');
        const event = events.find(e => e.id === eventId && e.status === 'published');
        
        if (!event) {
            showDetailError('Event not found');
            return;
        }
        
        // Update page title
        document.title = `${event.title} - Apostolic Church`;
        
        // Update content
        const eventTitle = document.querySelector('.event-detail-title');
        if (eventTitle) eventTitle.textContent = event.title;
        
        const eventDate = document.querySelector('.event-detail-date');
        if (eventDate) eventDate.textContent = formatDate(event.date);
        
        const eventLocation = document.querySelector('.event-detail-location');
        if (eventLocation) eventLocation.textContent = event.location;
        
        const eventImage = document.querySelector('.event-detail-image img');
        if (eventImage) eventImage.src = event.imageUrl || 'images/placeholder.jpg';
        
        const eventDescription = document.querySelector('.event-detail-description');
        if (eventDescription) eventDescription.innerHTML = event.description;
        
        console.log('Loaded event detail:', event.title);
    } catch (error) {
        console.error('Error loading event detail:', error);
        showDetailError('Unable to load event');
    }
}

// Function to load sermon detail
function loadSermonDetail(sermonId) {
    try {
        const sermons = JSON.parse(localStorage.getItem('sermons') || '[]');
        const sermon = sermons.find(s => s.id === sermonId && s.status === 'published');
        
        if (!sermon) {
            showDetailError('Sermon not found');
            return;
        }
        
        // Update page title
        document.title = `${sermon.title} - Apostolic Church`;
        
        // Update content
        const sermonTitle = document.querySelector('.sermon-detail-title');
        if (sermonTitle) sermonTitle.textContent = sermon.title;
        
        const sermonSpeaker = document.querySelector('.sermon-detail-speaker');
        if (sermonSpeaker) sermonSpeaker.textContent = sermon.speaker;
        
        const sermonDate = document.querySelector('.sermon-detail-date');
        if (sermonDate) sermonDate.textContent = formatDate(sermon.date);
        
        const sermonVideo = document.querySelector('.sermon-video iframe');
        if (sermonVideo && sermon.videoUrl) sermonVideo.src = sermon.videoUrl;
        
        const sermonAudio = document.querySelector('.sermon-audio audio');
        if (sermonAudio && sermon.audioUrl) {
            sermonAudio.src = sermon.audioUrl;
            document.querySelector('.sermon-audio').style.display = 'block';
        }
        
        const sermonDescription = document.querySelector('.sermon-detail-description');
        if (sermonDescription) sermonDescription.innerHTML = sermon.description;
        
        console.log('Loaded sermon detail:', sermon.title);
    } catch (error) {
        console.error('Error loading sermon detail:', error);
        showDetailError('Unable to load sermon');
    }
}

// Helper function to show error on detail pages
function showDetailError(message) {
    const contentContainer = document.querySelector('.content-container') || document.querySelector('main');
    if (contentContainer) {
        contentContainer.innerHTML = `
            <div class="error-container">
                <h2>Content Not Found</h2>
                <p>${message}</p>
                <a href="javascript:history.back()" class="btn btn-primary">Go Back</a>
            </div>
        `;
    }
}

// Helper function to format dates
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

// Replace the problematic code at line 381
document.addEventListener('DOMContentLoaded', function() {
  // Check if element exists before adding event listener
  const targetElement = document.getElementById('targetElementId');
  if (targetElement) {
    targetElement.addEventListener('click', function() {
      // Your event handling code
    });
  }
  
  // Initialize content if we're on the right pages
  if (document.querySelector('.posts-grid')) {
    loadBlogPosts();
  }
  
  if (document.querySelector('.events-list')) {
    loadEvents();
  }
  
  if (document.getElementById('sermonContainer')) {
    // Check if loadSermons function exists before calling it
    if (typeof loadSermons === 'function') {
        loadSermons();
    } else {
        console.warn('loadSermons function is not defined. Make sure sermons.js is loaded.');
    }
  }
});




