// Initialize Stripe
const stripe = Stripe('pk_test_sample'); // Replace with your actual Stripe publishable key
const elements = stripe.elements();

// Create card element with custom styling
const card = elements.create('card', {
    style: {
        base: {
            color: '#333',
            fontFamily: '"Open Sans", sans-serif',
            fontSmoothing: 'antialiased',
            fontSize: '16px',
            '::placeholder': {
                color: '#aab7c4'
            },
            ':-webkit-autofill': {
                color: '#fce883'
            }
        },
        invalid: {
            color: '#dc3545',
            iconColor: '#dc3545'
        }
    }
});

// Donation page initialization
document.addEventListener('DOMContentLoaded', function() {
    // Mount the Stripe card element
    const cardElement = document.getElementById('card-element');
    if (cardElement) {
        card.mount('#card-element');
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
});

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
            
            // Show loading state
            const submitButton = cardForm.querySelector('.btn-donate');
            setLoadingState(submitButton, true);
            
            try {
                // Create payment method with Stripe
                const { paymentMethod, error } = await stripe.createPaymentMethod({
                    type: 'card',
                    card: card,
                    billing_details: {
                        name: cardName,
                        email: email
                    }
                });
                
                if (error) {
                    throw error;
                }
                
                // In a real app, you would send this to your server
                console.log('Donation data:', {
                    paymentMethodId: paymentMethod.id,
                    amount,
                    fund,
                    frequency,
                    email
                });
                
                // Show success and reset form
                const frequencyText = frequency === 'monthly' ? 'monthly' : frequency === 'weekly' ? 'weekly' : '';
                showSuccess(`Thank you for your ${frequencyText} donation of $${amount}!`);
                setTimeout(() => {
                    cardForm.reset();
                    card.clear();
                }, 3000);
                
            } catch (error) {
                showError(error.message);
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

// Show error message
function showError(message) {
    const errorElement = document.getElementById('card-errors');
    if (!errorElement) return;
    
    errorElement.textContent = message;
    errorElement.className = 'error-message';
    
    setTimeout(() => {
        errorElement.textContent = '';
        errorElement.className = '';
    }, 5000);
}

// Show success message
function showSuccess(message) {
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