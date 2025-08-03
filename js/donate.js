// Initialize Stripe with enhanced configuration
// Using environment-based configuration for security
const stripe = Stripe(window.Config?.stripe?.publishableKey || 'pk_test_51RoXpfL498oAJ59VBDtpvH9n2mvk3wVUY9Uwd5IcU6xM1T15RRdgvMWP3G5XNG1lMJfs7vEj6uqPHloJdquKRDuy00mhpMZeNj');
const elements = stripe.elements({
    fonts: [{
        cssSrc: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600&display=swap'
    }]
});

// Create card element with enhanced styling to match form design
const card = elements.create('card', {
    style: {
        base: {
            color: '#333333',
            fontFamily: '"Open Sans", sans-serif',
            fontSmoothing: 'antialiased',
            fontSize: '16px',
            lineHeight: '24px',
            fontWeight: '400',
            '::placeholder': {
                color: '#999999'
            },
            ':-webkit-autofill': {
                color: '#333333'
            }
        },
        invalid: {
            color: '#dc3545',
            iconColor: '#dc3545'
        },
        complete: {
            color: '#28a745',
            iconColor: '#28a745'
        }
    },
    hidePostalCode: false
});

// Global variables for payment processing
let paymentIntentClientSecret = null;
let currentPaymentMethod = null;

// Donation page initialization
document.addEventListener('DOMContentLoaded', function() {
    // Mount the Stripe card element with enhanced error handling
    const cardElement = document.getElementById('card-element');
    if (cardElement) {
        try {
            card.mount('#card-element');
            console.log('Stripe card element mounted successfully');
        } catch (error) {
            console.error('Error mounting Stripe card element:', error);
            // Show user-friendly error message
            cardElement.innerHTML = '<div style="color: #dc3545; padding: 10px;">Unable to load payment form. Please refresh the page.</div>';
        }

        // Handle real-time validation errors from the card Element
        card.on('change', function(event) {
            const displayError = document.getElementById('card-errors');

            // Debug logging to help identify input issues
            console.log('Stripe card element change event:', {
                error: event.error,
                complete: event.complete,
                empty: event.empty,
                brand: event.brand
            });

            if (event.error) {
                displayError.textContent = event.error.message;
                displayError.style.display = 'block';
                cardElement.classList.add('error');
            } else {
                displayError.textContent = '';
                displayError.style.display = 'none';
                cardElement.classList.remove('error');

                // Add visual feedback for complete card input
                if (event.complete) {
                    cardElement.classList.add('complete');
                } else {
                    cardElement.classList.remove('complete');
                }
            }
        });

        // Add ready event handler to ensure element is fully loaded
        card.on('ready', function() {
            console.log('Stripe card element is ready for input');
        });
    }

    // Initialize counter animations
    initCounters();
    
    // Set up donation amount selection
    initDonationAmounts();
    
    // Set up payment method tabs
    initPaymentTabs();
    
    // Set up FAQ accordion
    initFaqAccordion();
    
    // Set up form submission
    initFormSubmission();
    
    // Activate smooth scrolling for anchor links
    initSmoothScroll();
    
    // Handle frequency toggle
    initFrequencyToggle();
    
    // Set up Youth Ministry donation button
    initYouthDonation();
    
    // Initialize ministry selection
    initMinistrySelection();
    
    // Initialize multi-step form
    initMultiStepForm();
    
    // Initialize summary updates
    initSummaryUpdates();
    
    // Initialize donation completion
    initDonationCompletion();

    // Initialize alternative payment methods
    initializeAlternativePaymentMethods();
});

// Enhanced payment processing functions
async function createPaymentIntent(amount, currency = 'usd', metadata = {}) {
    try {
        // Make real API call to create payment intent
        const response = await makeServerRequest('/create-payment-intent', {
            amount: amount, // Send amount in dollars (server will convert to cents)
            currency: currency,
            metadata: metadata
        });

        console.log('✅ Payment Intent created:', response.payment_intent_id);
        return response;
    } catch (error) {
        console.error('❌ Error creating payment intent:', error);
        throw new Error(error.message || 'Failed to initialize payment. Please try again.');
    }
}

// Real server request for payment processing
async function makeServerRequest(endpoint, data) {
    try {
        const apiBaseUrl = (typeof window !== 'undefined' && window.Config?.api?.baseUrl) || '/api';
        const response = await fetch(`${apiBaseUrl}/payments${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || `Server error: ${response.status}`);
        }

        if (!result.success) {
            throw new Error(result.message || 'Server request failed');
        }

        return result.data;
    } catch (error) {
        console.error('Server request error:', error);
        throw error;
    }
}

// Email validation utility
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Enhanced payment confirmation function
async function confirmPayment(clientSecret, billingDetails) {
    try {
        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: card,
                billing_details: billingDetails
            }
        });

        if (error) {
            throw error;
        }

        return paymentIntent;
    } catch (error) {
        console.error('Payment confirmation error:', error);
        throw error;
    }
}

// Future payment methods integration (Apple Pay, Google Pay, etc.)
function initializeAlternativePaymentMethods() {
    // Check if Apple Pay is available
    if (window.ApplePaySession && ApplePaySession.canMakePayments()) {
        // Apple Pay is available - could add Apple Pay button here
        console.log('Apple Pay is available');
    }

    // Check if Google Pay is available
    if (window.google && window.google.payments) {
        // Google Pay is available - could add Google Pay button here
        console.log('Google Pay is available');
    }

    // Placeholder for future payment method integrations
    // This modular approach allows easy addition of new payment methods
}

// Recurring donation setup (for future implementation)
function setupRecurringDonation(paymentMethodId, amount, frequency) {
    // This would typically create a subscription on your server
    console.log('Setting up recurring donation:', {
        paymentMethodId,
        amount,
        frequency
    });

    // Return promise for consistent API
    return Promise.resolve({
        subscription_id: 'sub_' + Math.random().toString(36).substr(2, 9),
        status: 'active'
    });
}

// Counter animation for impact numbers
function initCounters() {
    const counters = document.querySelectorAll('.counter');
    
    // Only animate if in viewport
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    counters.forEach(counter => {
        observer.observe(counter);
    });
}

function animateCounter(counter) {
    const target = parseInt(counter.getAttribute('data-target'));
    const duration = 2000; // ms
    const step = Math.ceil(target / 100);
    let current = 0;
    const timer = setInterval(() => {
        current += step;
        counter.textContent = current;
        
        if (current >= target) {
            counter.textContent = target;
            clearInterval(timer);
        }
    }, duration / 100);
}

// Handle donation amount selection
function initDonationAmounts() {
    const amountButtons = document.querySelectorAll('.amount-btn');
    const customAmountContainer = document.querySelector('.custom-amount-container');
    const customAmountInput = document.getElementById('customAmount');
    
    if (!amountButtons.length) return;
    
    // Set first amount as default
    amountButtons[0].classList.add('active');
    
    amountButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            amountButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Handle custom amount input
            if (button.classList.contains('amount-btn-custom')) {
                customAmountContainer.classList.remove('hidden');
                customAmountInput.focus();
            } else {
                customAmountContainer.classList.add('hidden');
            }
            
            // Update summary
            updateSummary();
        });
    });
    
    // Handle custom amount input changes
    if (customAmountInput) {
        customAmountInput.addEventListener('input', updateSummary);
    }
}

// Handle payment method tabs
function initPaymentTabs() {
    const paymentTabs = document.querySelectorAll('.payment-tab');
    const paymentForms = document.querySelectorAll('.payment-form');
    
    if (!paymentTabs.length) return;
    
    paymentTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Get selected method
            const method = tab.getAttribute('data-method');
            
            // Update active tab
            paymentTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Show selected payment form
            paymentForms.forEach(form => {
                form.classList.remove('active');
                if (form.id === `${method}-method`) {
                    form.classList.add('active');
                }
            });
            
            // Remount card element if credit card selected
            if (method === 'card') {
                setTimeout(() => {
                    const cardElement = document.getElementById('card-element');
                    if (cardElement && cardElement.innerHTML === '') {
                        card.mount('#card-element');
                    }
                }, 100);
            }
        });
    });
}

// Handle FAQ accordion
function initFaqAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    if (!faqItems.length) return;
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            // Check if this item is already active
            const isActive = item.classList.contains('active');
            
            // Close all items
            faqItems.forEach(faq => faq.classList.remove('active'));
            
            // If item wasn't active, open it
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
}

// Handle form submission
function initFormSubmission() {
    const cardForm = document.getElementById('card-form');
    const paypalButton = document.querySelector('.btn-paypal');
    
    if (cardForm) {
        cardForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get form values
            const cardName = document.getElementById('cardName').value;
            const email = document.getElementById('email').value;
            
            // Get selected amount
            let amount;
            const activeAmountBtn = document.querySelector('.amount-btn.active');
            if (activeAmountBtn.classList.contains('amount-btn-custom')) {
                amount = document.getElementById('customAmount').value;
                if (!amount || amount <= 0) {
                    showError('Please enter a valid donation amount');
                    return;
                }
            } else {
                amount = activeAmountBtn.getAttribute('data-amount');
            }
            
            // Get selected fund
            const fundInput = document.querySelector('input[name="fund"]:checked');
            const fund = fundInput ? fundInput.value : 'tithe';
            
            // Get frequency
            const frequencyInput = document.querySelector('input[name="frequency"]:checked');
            const frequency = frequencyInput ? frequencyInput.value : 'one-time';
            
            // Validate inputs
            if (!cardName || !email) {
                showError('Please fill out all required fields');
                return;
            }

            // Validate email format
            if (!isValidEmail(email)) {
                showError('Please enter a valid email address');
                return;
            }
            
            // Show loading state
            const submitButton = cardForm.querySelector('.btn-donate');
            setLoadingState(submitButton, true);
            
            try {
                // Step 1: Create payment intent
                const paymentIntentData = await createPaymentIntent(amount, 'usd', {
                    fund: fund,
                    frequency: frequency,
                    donor_email: email,
                    donor_name: cardName
                });

                // Step 2: Confirm payment with card
                const billingDetails = {
                    name: cardName,
                    email: email
                };

                const paymentIntent = await confirmPayment(paymentIntentData.client_secret, billingDetails);

                // Step 3: Handle successful payment
                if (paymentIntent.status === 'succeeded') {
                    // Show success message with payment confirmation
                    const frequencyText = frequency === 'monthly' ? 'monthly' : frequency === 'weekly' ? 'weekly' : '';
                    const successMessage = `Thank you for your ${frequencyText} donation of $${amount}! Your payment has been processed successfully.`;
                    const confirmationMessage = `Payment confirmation: ${paymentIntent.id}`;
                    showSuccess(successMessage + '<br><small style="opacity: 0.8;">' + confirmationMessage + '</small>');

                    // Log successful donation with real payment data
                    console.log('✅ Real payment processed successfully:', {
                        paymentIntentId: paymentIntent.id,
                        amount: amount,
                        fund: fund,
                        frequency: frequency,
                        email: email,
                        status: paymentIntent.status,
                        created: paymentIntent.created,
                        currency: paymentIntent.currency
                    });

                    // Reset form after delay
                    setTimeout(() => {
                        cardForm.reset();
                        card.clear();
                        // Reset step navigation if needed
                        if (typeof navigateToStep === 'function') {
                            navigateToStep('1');
                        }
                    }, 3000);
                } else {
                    throw new Error('Payment was not completed successfully');
                }

            } catch (error) {
                console.error('Payment error:', error);
                showError(error.message || 'An error occurred while processing your payment. Please try again.');
            } finally {
                setLoadingState(submitButton, false);
            }
        });
    }
    
    // Handle PayPal button click
    if (paypalButton) {
        paypalButton.addEventListener('click', function() {
            // This would typically redirect to PayPal
            alert('This would redirect to PayPal in a real application');
        });
    }
}

// Enhanced error message display
function showError(message) {
    // Clear any existing messages
    clearMessages();

    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-status error';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;

    // Find the best place to show the error
    const cardErrors = document.getElementById('card-errors');
    const form = document.querySelector('#card-form') || document.querySelector('.contribution-card');

    if (cardErrors && message.toLowerCase().includes('card')) {
        cardErrors.textContent = message;
        cardErrors.style.display = 'block';
    } else if (form) {
        form.insertBefore(errorDiv, form.firstChild);
        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => errorDiv.remove(), 7000);
    }
}

// Enhanced success message display
function showSuccess(message) {
    // Clear any existing messages
    clearMessages();

    const successDiv = document.createElement('div');
    successDiv.className = 'form-status success';
    successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;

    const form = document.querySelector('#card-form') || document.querySelector('.contribution-card');
    if (form) {
        form.insertBefore(successDiv, form.firstChild);
        successDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => successDiv.remove(), 10000);
    }
}

// Clear all messages
function clearMessages() {
    const existingMessages = document.querySelectorAll('.form-status');
    existingMessages.forEach(msg => msg.remove());

    const cardErrors = document.getElementById('card-errors');
    if (cardErrors) {
        cardErrors.textContent = '';
        cardErrors.style.display = 'none';
    }
}

// Original showSuccess function (keeping for compatibility)
function showSuccessOriginal(message) {
    const errorElement = document.getElementById('card-errors');
    if (!errorElement) return;
    
    errorElement.textContent = message;
    errorElement.className = 'success-message';
    
    setTimeout(() => {
        errorElement.textContent = '';
        errorElement.className = '';
    }, 5000);
}

// Set button loading state
function setLoadingState(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    } else {
        button.disabled = false;
        button.innerHTML = '<span>Complete Donation</span><i class="fas fa-heart"></i>';
    }
}

// Initialize smooth scrolling for anchor links
function initSmoothScroll() {
    const scrollLinks = document.querySelectorAll('.smooth-scroll');
    
    scrollLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Handle donation frequency toggle
function initFrequencyToggle() {
    const frequencyInputs = document.querySelectorAll('input[name="frequency"]');
    const switchHighlight = document.querySelector('.switch-highlight');

    if (!frequencyInputs.length || !switchHighlight) return;

    frequencyInputs.forEach(input => {
        input.addEventListener('change', function() {
            if (this.id === 'one-time') {
                switchHighlight.style.transform = 'translateX(0)';
            } else if (this.id === 'weekly') {
                switchHighlight.style.transform = 'translateX(100%)';
            } else if (this.id === 'monthly') {
                switchHighlight.style.transform = 'translateX(200%)';
            }
        });
    });
}

// Function to handle Youth Ministry donation button
function initYouthDonation() {
    const youthButton = document.querySelector('.btn-youth');
    if (!youthButton) return;
    
    youthButton.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Scroll to donation form
        const donationForm = document.querySelector('#donation-form');
        if (donationForm) {
            donationForm.scrollIntoView({ behavior: 'smooth' });
        }
        
        // Select Youth fund option
        const youthFund = document.querySelector('#youth');
        if (youthFund) {
            youthFund.checked = true;
            
            // Add visual feedback - find the label and flash it
            const youthLabel = document.querySelector('label[for="youth"]');
            if (youthLabel) {
                youthLabel.classList.add('pulse');
                setTimeout(() => {
                    youthLabel.classList.remove('pulse');
                }, 1500);
            }
        }
        
        // Select $75 amount if available, otherwise first amount
        const amount75 = document.querySelector('.amount-btn[data-amount="75"]');
        if (amount75) {
            // Remove active class from all buttons
            document.querySelectorAll('.amount-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to $75 button
            amount75.classList.add('active');
        }
    });
}

// Function to handle ministry selection from the Give To section
function initMinistrySelection() {
    const ministryButtons = document.querySelectorAll('.ministry-select-btn');
    
    if (!ministryButtons.length) return;
    
    ministryButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get the fund to select
            const fundId = this.getAttribute('data-fund');
            
            // Scroll to donation form
            const donationForm = document.querySelector('#donation-form');
            if (donationForm) {
                donationForm.scrollIntoView({ behavior: 'smooth' });
            }
            
            // Select the appropriate fund radio button
            const fundInput = document.getElementById(fundId);
            if (fundInput) {
                fundInput.checked = true;
                
                // Add visual feedback
                const fundLabel = document.querySelector(`label[for="${fundId}"]`);
                if (fundLabel) {
                    fundLabel.classList.add('pulse');
                    setTimeout(() => {
                        fundLabel.classList.remove('pulse');
                    }, 1500);
                }
            }
            
            // Highlight the ministry card
            document.querySelectorAll('.ministry-card').forEach(card => {
                card.classList.remove('active-ministry');
            });
            
            const ministryCard = this.closest('.ministry-card');
            if (ministryCard) {
                ministryCard.classList.add('active-ministry');
            }
        });
    });
}

// Add some additional styling for error/success messages
document.head.insertAdjacentHTML('beforeend', `
    <style>
        .error-message {
            background-color: #fff0f0;
            color: #dc3545;
            padding: 12px 15px;
            border-radius: 8px;
            font-size: 0.9rem;
            margin-top: 15px;
            border-left: 4px solid #dc3545;
        }
        
        .success-message {
            background-color: #f0fff5;
            color: #28a745;
            padding: 12px 15px;
            border-radius: 8px;
            font-size: 0.9rem;
            margin-top: 15px;
            border-left: 4px solid #28a745;
        }
    </style>
`);

// Function to handle multi-step form
function initMultiStepForm() {
    const nextButtons = document.querySelectorAll('.btn-next');
    const backButtons = document.querySelectorAll('.btn-back');
    
    // Handle next step buttons
    nextButtons.forEach(button => {
        button.addEventListener('click', function() {
            const nextStep = this.getAttribute('data-next');
            
            // Basic validation before proceeding
            if (nextStep === '2') {
                // Check if amount is selected
                const activeAmountBtn = document.querySelector('.amount-btn.active');
                if (!activeAmountBtn) {
                    showMessage('Please select a donation amount', 'error');
                    return;
                }
                
                // If custom amount, validate it
                if (activeAmountBtn.classList.contains('amount-btn-custom')) {
                    const customAmount = document.getElementById('customAmount').value;
                    if (!customAmount || customAmount <= 0) {
                        showMessage('Please enter a valid donation amount', 'error');
                        return;
                    }
                }
            }
            
            if (nextStep === '3') {
                // Validate contact info
                const firstName = document.getElementById('firstName').value;
                const lastName = document.getElementById('lastName').value;
                const email = document.getElementById('email').value;
                
                if (!firstName || !lastName || !email) {
                    showMessage('Please fill out all required fields', 'error');
                    return;
                }
                
                if (!isValidEmail(email)) {
                    showMessage('Please enter a valid email address', 'error');
                    return;
                }
                
                // Update final summary
                updateFinalSummary();
            }
            
            // Navigate to next step
            navigateToStep(nextStep);
        });
    });
    
    // Handle back buttons
    backButtons.forEach(button => {
        button.addEventListener('click', function() {
            const prevStep = this.getAttribute('data-back');
            navigateToStep(prevStep);
        });
    });
}

// Navigate to a specific step
function navigateToStep(stepNumber) {
    // Update steps
    document.querySelectorAll('.step').forEach(step => {
        if (parseInt(step.getAttribute('data-step')) <= parseInt(stepNumber)) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
    
    // Show the corresponding content
    document.querySelectorAll('.contribution-step-content').forEach(content => {
        content.classList.remove('active');
    });
    
    document.getElementById(`step-${stepNumber}`).classList.add('active');
}

// Initialize summary updates
function initSummaryUpdates() {
    // Fund options
    const fundOptions = document.querySelectorAll('input[name="fund"]');
    fundOptions.forEach(option => {
        option.addEventListener('change', updateSummary);
    });
    
    // Frequency options
    const frequencyOptions = document.querySelectorAll('input[name="frequency"]');
    frequencyOptions.forEach(option => {
        option.addEventListener('change', updateSummary);
    });
    
    // Update summary initially
    updateSummary();
}

// Update the contribution summary
function updateSummary() {
    // Get selected amount
    let amount;
    const activeAmountBtn = document.querySelector('.amount-btn.active');
    if (activeAmountBtn && activeAmountBtn.classList.contains('amount-btn-custom')) {
        amount = document.getElementById('customAmount').value || '0';
    } else if (activeAmountBtn) {
        amount = activeAmountBtn.getAttribute('data-amount');
    } else {
        amount = '0';
    }
    
    // Get selected fund
    const selectedFund = document.querySelector('input[name="fund"]:checked');
    const fundName = selectedFund ? selectedFund.nextElementSibling.querySelector('.fund-name').textContent : 'General';
    
    // Get selected frequency
    const selectedFrequency = document.querySelector('input[name="frequency"]:checked');
    const frequencyName = selectedFrequency ? selectedFrequency.nextElementSibling.textContent : 'One Time';
    
    // Update summary values
    const summaryAmount = document.getElementById('summary-amount');
    const summaryFund = document.getElementById('summary-fund');
    const summaryFrequency = document.getElementById('summary-frequency');
    
    if (summaryAmount) summaryAmount.textContent = `$${amount}`;
    if (summaryFund) summaryFund.textContent = fundName;
    if (summaryFrequency) summaryFrequency.textContent = frequencyName;
}

// Update the final summary before payment
function updateFinalSummary() {
    const summaryAmount = document.getElementById('summary-amount');
    const summaryFund = document.getElementById('summary-fund');
    const summaryFrequency = document.getElementById('summary-frequency');
    
    const finalAmount = document.getElementById('final-summary-amount');
    const finalFund = document.getElementById('final-summary-fund');
    const finalFrequency = document.getElementById('final-summary-frequency');
    const finalTotal = document.getElementById('final-summary-total');
    
    if (finalAmount && summaryAmount) finalAmount.textContent = summaryAmount.textContent;
    if (finalFund && summaryFund) finalFund.textContent = summaryFund.textContent;
    if (finalFrequency && summaryFrequency) finalFrequency.textContent = summaryFrequency.textContent;
    if (finalTotal && summaryAmount) finalTotal.textContent = summaryAmount.textContent;
}

// Initialize donation completion
function initDonationCompletion() {
    const completeButton = document.getElementById('complete-donation');
    
    if (completeButton) {
        completeButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get active payment method
            const activePaymentTab = document.querySelector('.payment-tab.active');
            if (!activePaymentTab) {
                showMessage('Please select a payment method', 'error');
                return;
            }
            
            const paymentMethod = activePaymentTab.getAttribute('data-method');
            
            if (paymentMethod === 'card') {
                processCardPayment();
            } else if (paymentMethod === 'paypal') {
                processPayPalPayment();
            } else if (paymentMethod === 'bank') {
                processBankTransfer();
            }
        });
    }
}

// Process card payment
function processCardPayment() {
    // Validate card form
    const cardName = document.getElementById('cardName').value;
    if (!cardName) {
        showMessage('Please enter the name on your card', 'error');
        return;
    }
    
    // Show loading state
    const submitButton = document.getElementById('complete-donation');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    // Get donation information
    const amount = document.getElementById('final-summary-amount').textContent.replace('$', '');
    const fund = document.getElementById('final-summary-fund').textContent;
    const frequency = document.getElementById('final-summary-frequency').textContent;
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;
    
    // Create payment method with Stripe
    stripe.createPaymentMethod({
        type: 'card',
        card: card,
        billing_details: {
            name: cardName,
            email: email
        }
    }).then(function(result) {
        if (result.error) {
            // Show error and restore button
            showMessage(result.error.message, 'error');
            submitButton.disabled = false;
            submitButton.innerHTML = '<span>Complete Donation</span><i class="fas fa-heart"></i>';
        } else {
            // In a real application, you would send the payment method ID to your server
            // For demo purposes, we'll just show success
            showMessage(`Thank you for your ${frequency.toLowerCase()} donation of ${amount} to our ${fund} fund!`, 'success');
            
            // Reset form after 3 seconds
            setTimeout(() => {
                // Reset to step 1
                navigateToStep('1');
                
                // Reset form fields
                document.getElementById('firstName').value = '';
                document.getElementById('lastName').value = '';
                document.getElementById('email').value = '';
                document.getElementById('address').value = '';
                document.getElementById('city').value = '';
                document.getElementById('state').value = '';
                document.getElementById('zip').value = '';
                document.getElementById('phone').value = '';
                document.getElementById('cardName').value = '';
                card.clear();
                
                // Reset buttons
                submitButton.disabled = false;
                submitButton.innerHTML = '<span>Complete Donation</span><i class="fas fa-heart"></i>';
            }, 3000);
        }
    });
}

// Process PayPal payment
function processPayPalPayment() {
    // In a real application, this would redirect to PayPal
    // For demo purposes, we'll just show a message
    alert('Redirecting to PayPal for payment processing...');
}

// Process bank transfer
function processBankTransfer() {
    // Show success message
    showMessage('Thank you! Please complete your bank transfer using the details provided above.', 'success');
    
    // Reset form after 3 seconds
    setTimeout(() => {
        navigateToStep('1');
    }, 3000);
}

// Show message to the user
function showMessage(message, type) {
    const errorElement = document.getElementById('card-errors');
    if (!errorElement) return;
    
    errorElement.textContent = message;
    errorElement.className = type === 'success' ? 'success-message' : 'error-message';
    
    // Clear message after 5 seconds if it's a success message
    if (type === 'success') {
        setTimeout(() => {
            errorElement.textContent = '';
            errorElement.className = '';
        }, 5000);
    }
}

// Email validation helper
function isValidEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
} 