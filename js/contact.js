document.addEventListener('DOMContentLoaded', function() {
    // FAQ Accordion Functionality
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            // Close all other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                }
            });
            
            // Toggle current item
            item.classList.toggle('active');
        });
    });
    
    // Contact Form Submission
    const contactForm = document.getElementById('contactForm');
    const formStatus = document.getElementById('formStatus');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(contactForm);
            const formDataObj = {};
            
            formData.forEach((value, key) => {
                formDataObj[key] = value;
            });
            
            // Perform validation
            const required = ['firstName', 'lastName', 'email', 'subject', 'message'];
            let isValid = true;
            
            required.forEach(field => {
                const input = document.getElementById(field);
                if (!formDataObj[field] || formDataObj[field].trim() === '') {
                    input.style.borderColor = '#dc3545';
                    isValid = false;
                } else {
                    input.style.borderColor = '';
                }
            });
            
            if (!isValid) {
                formStatus.className = 'form-status error';
                formStatus.style.display = 'block';
                formStatus.textContent = 'Please fill out all required fields.';
                return;
            }
            
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formDataObj.email)) {
                document.getElementById('email').style.borderColor = '#dc3545';
                formStatus.className = 'form-status error';
                formStatus.style.display = 'block';
                formStatus.textContent = 'Please enter a valid email address.';
                return;
            }
            
            // Simulate form submission
            formStatus.textContent = 'Sending message...';
            formStatus.className = 'form-status';
            formStatus.style.display = 'block';
            
            // This would be replaced with actual form submission logic
            setTimeout(() => {
                // Reset form
                contactForm.reset();
                
                // Show success message
                formStatus.className = 'form-status success';
                formStatus.textContent = 'Your message has been sent successfully! We\'ll get back to you soon.';
                
                // Clear success message after 5 seconds
                setTimeout(() => {
                    formStatus.style.display = 'none';
                }, 5000);
            }, 1500);
        });
    }
    
    // Form field enhancements
    const formInputs = document.querySelectorAll('.contact-form input, .contact-form textarea, .contact-form select');
    
    formInputs.forEach(input => {
        // Add focus/blur effects
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', () => {
            if (!input.value) {
                input.parentElement.classList.remove('focused');
            }
        });
        
        // Clear error styling on input change
        input.addEventListener('input', () => {
            input.style.borderColor = '';
            formStatus.style.display = 'none';
        });
    });
});

// Initialize Google Maps
function initMap() {
    // Church location coordinates (Louisville, Kentucky)
    const churchLocation = { lat: 38.2527, lng: -85.7585 }; // Louisville coordinates
    
    // Map styles to match website theme
    const mapStyles = [
        {
            "featureType": "administrative",
            "elementType": "labels.text.fill",
            "stylers": [{"color": "#444444"}]
        },
        {
            "featureType": "landscape",
            "elementType": "all",
            "stylers": [{"color": "#f2f2f2"}]
        },
        {
            "featureType": "poi",
            "elementType": "all",
            "stylers": [{"visibility": "off"}]
        },
        {
            "featureType": "road",
            "elementType": "all",
            "stylers": [{"saturation": -100}, {"lightness": 45}]
        },
        {
            "featureType": "road.highway",
            "elementType": "all",
            "stylers": [{"visibility": "simplified"}]
        },
        {
            "featureType": "road.arterial",
            "elementType": "labels.icon",
            "stylers": [{"visibility": "off"}]
        },
        {
            "featureType": "transit",
            "elementType": "all",
            "stylers": [{"visibility": "off"}]
        },
        {
            "featureType": "water",
            "elementType": "all",
            "stylers": [{"color": "#5142fc"}, {"visibility": "on"}]
        }
    ];
    
    // Create map
    const map = new google.maps.Map(document.getElementById("map"), {
        zoom: 15,
        center: churchLocation,
        styles: mapStyles,
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true
    });
    
    // Custom marker icon
    const markerIcon = {
        path: 'M20 2C12.268 2 6 8.268 6 16c0 7 6.292 14.768 14 22 7.708-7.232 14-15 14-22 0-7.732-6.268-14-14-14z',
        fillColor: '#5142fc',
        fillOpacity: 1,
        scale: 1.2,
        strokeColor: '#835ef6',
        strokeWeight: 2,
        anchor: new google.maps.Point(20, 40)
    };
    
    // Add marker
    const marker = new google.maps.Marker({
        position: churchLocation,
        map: map,
        title: "Apostolic Church USA",
        icon: markerIcon,
        animation: google.maps.Animation.DROP
    });
    
    // Info window content
    const infoContent = `
        <div class="map-info-window">
            <h3>Apostolic Church USA</h3>
            <p><i class="fas fa-map-marker-alt"></i> 1205 Durette Lane, Louisville, KY</p>
            <p><i class="fas fa-clock"></i> Sunday Services: 9:00 AM & 11:00 AM</p>
            <a href="https://maps.google.com/maps?q=1205+Durette+Lane,+Louisville,+KY" target="_blank" class="btn-text">Get Directions</a>
        </div>
    `;
    
    // Create and open info window
    const infoWindow = new google.maps.InfoWindow({
        content: infoContent,
        maxWidth: 300
    });
    
    // Open info window when marker is clicked
    marker.addListener("click", () => {
        infoWindow.open(map, marker);
    });
    
    // Open info window by default
    infoWindow.open(map, marker);
    
    // Add some map interactions
    map.addListener("click", () => {
        infoWindow.close();
    });
    
    // Add responsive handling
    window.addEventListener("resize", () => {
        google.maps.event.trigger(map, "resize");
        map.setCenter(churchLocation);
    });
}

// Load Google Maps API
function loadGoogleMaps() {
    if (document.getElementById('map')) {
        const script = document.createElement('script');
        script.src = "https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initMap";
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    }
}

// Check if the map container exists and load Google Maps
if (document.getElementById('map')) {
    loadGoogleMaps();
} 