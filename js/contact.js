document.addEventListener('DOMContentLoaded', function() {
    // EmailJS Configuration
    // Replace these with your actual EmailJS credentials
    const EMAILJS_CONFIG = {
        serviceID: 'your_service_id',        // Replace with your EmailJS service ID
        templateID: 'your_template_id',      // Replace with your EmailJS template ID
        publicKey: 'your_public_key'         // Replace with your EmailJS public key
    };

    // Initialize EmailJS with public key
    if (typeof emailjs !== 'undefined') {
        emailjs.init(EMAILJS_CONFIG.publicKey);
        console.log('EmailJS initialized successfully');
    } else {
        console.error('EmailJS library not loaded');
    }

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
            
            // Enhanced form validation
            const validationResult = validateForm(formDataObj);

            if (!validationResult.isValid) {
                // Highlight invalid fields
                validationResult.errors.forEach(error => {
                    const input = document.getElementById(error.field);
                    if (input) {
                        input.style.borderColor = '#dc3545';
                        input.style.boxShadow = '0 0 0 3px rgba(220, 53, 69, 0.1)';
                    }
                });

                // Show error message
                showFormMessage(validationResult.message, 'error');
                return;
            }

            // Clear any previous error styling
            clearFormErrors();

            // Send email via EmailJS
            sendEmailViaEmailJS(formDataObj, contactForm);
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

    // Enhanced Form Validation Functions
    function validateForm(formData) {
        const errors = [];
        const required = ['firstName', 'lastName', 'email', 'subject', 'message'];

        // Check required fields
        required.forEach(field => {
            if (!formData[field] || formData[field].trim() === '') {
                errors.push({
                    field: field,
                    message: `${getFieldLabel(field)} is required`
                });
            }
        });

        // Enhanced email validation
        if (formData.email && formData.email.trim() !== '') {
            const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
            if (!emailRegex.test(formData.email.trim())) {
                errors.push({
                    field: 'email',
                    message: 'Please enter a valid email address'
                });
            }
        }

        // Phone validation (if provided)
        if (formData.phone && formData.phone.trim() !== '') {
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            const cleanPhone = formData.phone.replace(/[\s\-\(\)\.]/g, '');
            if (!phoneRegex.test(cleanPhone) || cleanPhone.length < 10) {
                errors.push({
                    field: 'phone',
                    message: 'Please enter a valid phone number'
                });
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors,
            message: errors.length > 0 ? errors[0].message : ''
        };
    }

    function getFieldLabel(fieldName) {
        const labels = {
            firstName: 'First Name',
            lastName: 'Last Name',
            email: 'Email Address',
            phone: 'Phone Number',
            subject: 'Subject',
            message: 'Message'
        };
        return labels[fieldName] || fieldName;
    }

    function showFormMessage(message, type) {
        const formStatus = document.getElementById('formStatus');
        if (formStatus) {
            formStatus.className = `form-status ${type}`;
            formStatus.style.display = 'block';
            formStatus.textContent = message;
        }
    }

    function clearFormErrors() {
        const formInputs = document.querySelectorAll('.contact-form input, .contact-form textarea, .contact-form select');
        formInputs.forEach(input => {
            input.style.borderColor = '';
            input.style.boxShadow = '';
        });

        const formStatus = document.getElementById('formStatus');
        if (formStatus) {
            formStatus.style.display = 'none';
        }
    }

    // EmailJS Integration Function with Enhanced Error Handling
    function sendEmailViaEmailJS(formData, form) {
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;

        // Show loading state
        setLoadingState(true, submitButton);
        showFormMessage('Sending your message...', 'loading');

        // Prepare email template parameters
        const templateParams = {
            from_name: `${formData.firstName} ${formData.lastName}`,
            from_email: formData.email,
            phone: formData.phone || 'Not provided',
            subject: formData.subject,
            message: formData.message,
            subscribe: formData.subscribe ? 'Yes' : 'No',
            timestamp: new Date().toLocaleString(),
            reply_to: formData.email
        };

        // Comprehensive error checking
        if (!validateEmailJSConfiguration()) {
            handleEmailError('Email service configuration error. Please contact us directly.', submitButton, originalButtonText);
            return;
        }

        // Check network connectivity
        if (!navigator.onLine) {
            handleEmailError('No internet connection detected. Please check your connection and try again.', submitButton, originalButtonText);
            return;
        }

        // Send email using EmailJS with timeout
        const emailPromise = emailjs.send(EMAILJS_CONFIG.serviceID, EMAILJS_CONFIG.templateID, templateParams);
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), 15000); // 15 second timeout
        });

        Promise.race([emailPromise, timeoutPromise])
            .then(function(response) {
                console.log('Email sent successfully:', response);
                handleEmailSuccess(form, submitButton, originalButtonText);
            })
            .catch(function(error) {
                console.error('Email sending failed:', error);
                handleEmailError(getErrorMessage(error), submitButton, originalButtonText);
            });
    }

    function validateEmailJSConfiguration() {
        // Check if EmailJS is loaded
        if (typeof emailjs === 'undefined') {
            console.error('EmailJS library not loaded');
            return false;
        }

        // Check if configuration is set up (not using placeholder values)
        if (EMAILJS_CONFIG.serviceID === 'your_service_id' ||
            EMAILJS_CONFIG.templateID === 'your_template_id' ||
            EMAILJS_CONFIG.publicKey === 'your_public_key') {
            console.error('EmailJS configuration not set up properly');
            return false;
        }

        return true;
    }

    function getErrorMessage(error) {
        if (error.message === 'Request timeout') {
            return 'Request timed out. Please try again or contact us directly.';
        }

        if (error.status) {
            switch (error.status) {
                case 400:
                    return 'Invalid request. Please check your information and try again.';
                case 401:
                    return 'Authentication failed. Please contact us directly.';
                case 403:
                    return 'Service access denied. Please contact us directly.';
                case 404:
                    return 'Email service not found. Please contact us directly.';
                case 429:
                    return 'Too many requests. Please wait a moment and try again.';
                case 500:
                    return 'Server error. Please try again later or contact us directly.';
                default:
                    return 'Network error occurred. Please try again or contact us directly.';
            }
        }

        return 'Failed to send message. Please try again or contact us directly.';
    }

    function setLoadingState(isLoading, button) {
        if (isLoading) {
            button.disabled = true;
            button.innerHTML = '<span>Sending...</span><i class="fas fa-spinner fa-spin"></i>';
            button.style.opacity = '0.7';
        } else {
            button.disabled = false;
            button.style.opacity = '1';
        }
    }

    function handleEmailSuccess(form, button, originalButtonText) {
        // Reset form
        form.reset();

        // Reset button
        setLoadingState(false, button);
        button.innerHTML = originalButtonText;

        // Show success message
        showFormMessage('Your message has been sent successfully! We\'ll get back to you soon.', 'success');

        // Clear success message after 5 seconds
        setTimeout(() => {
            const formStatus = document.getElementById('formStatus');
            if (formStatus) {
                formStatus.style.display = 'none';
            }
        }, 5000);
    }

    function handleEmailError(errorMessage, button, originalButtonText) {
        // Reset button
        setLoadingState(false, button);
        button.innerHTML = originalButtonText;

        // Show comprehensive error message with multiple contact options
        const fallbackMessage = `${errorMessage}\n\n📧 Alternative Contact Methods:\n\n• Email: louisvilleapostolic@gmail.com\n• Phone: +1(302) 437-5593\n• Visit: 1205 Durette Lane, Louisville, KY\n• Office Hours: Mon-Fri 9AM-5PM, Sat 10AM-2PM\n\nWe apologize for the inconvenience and look forward to hearing from you!`;
        showFormMessage(fallbackMessage, 'error');

        // Log error for debugging
        console.error('Contact form error:', errorMessage);
    }
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