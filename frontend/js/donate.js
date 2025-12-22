
// =======================
// Stripe Initialization
// =======================
const stripe = Stripe(
  window.Config?.stripe?.publishableKey ||
    "pk_live_51RoXpfL498oAJ59Vyd2YKh5B79oLSZkIbYTyxtOXbwr5SEWFlTbLWWiOAOAUBBLim9nT9YRZ6yvwyjhKTJ2wWRaF00SQehdjew"
);

const elements = stripe.elements({
  fonts: [
    {
      cssSrc:
        "https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600&display=swap",
    },
  ],
});

// Create card element with enhanced styling
const card = elements.create("card", {
  style: {
    base: {
      color: "#333333",
      fontFamily: '"Open Sans", sans-serif',
      fontSmoothing: "antialiased",
      fontSize: "16px",
      lineHeight: "24px",
      fontWeight: "400",
      "::placeholder": { color: "#999999" },
      ":-webkit-autofill": { color: "#333333" },
    },
    invalid: { color: "#dc3545", iconColor: "#dc3545" },
    complete: { color: "#28a745", iconColor: "#28a745" },
  },
  hidePostalCode: false,
});

// =======================
// Mount Elements
// =======================
document.addEventListener("DOMContentLoaded", function () {
  const cardElement = document.getElementById("card-element");
  if (cardElement) {
    try {
      card.mount("#card-element");
    } catch (error) {
      console.error("Error mounting Stripe card element:", error);
      cardElement.innerHTML =
        '<div style="color: #dc3545; padding: 10px;">Unable to load payment form. Please refresh the page.</div>';
    }

    card.on("change", function (event) {
      const displayError = document.getElementById("card-errors");
      if (event.error) {
        displayError.textContent = event.error.message;
        displayError.style.display = "block";
      } else {
        displayError.textContent = "";
        displayError.style.display = "none";
      }
    });
  }

  // Init other UI helpers
  initCounters();
  initDonationAmounts();
  initSummaryUpdates(); // Move this right after initDonationAmounts
  initPaymentTabs();
  initFaqAccordion();
  initFormSubmission();
  initSmoothScroll();
  initFrequencyToggle();
  initYouthDonation();
  initMinistrySelection();
  initMultiStepForm();
  initDonationCompletion();
  initializeAlternativePaymentMethods();
});

// =======================
// Payment Core
// =======================
async function createPaymentIntent(amount, currency = "usd", metadata = {}) {
  const response = await makeServerRequest("/create-payment-intent", {
    amount: amount, // dollars (server converts to cents)
    currency: currency,
    metadata: metadata,
  });
  return response;
}

async function makeServerRequest(endpoint, data) {
  const baseUrl = window.Config?.api?.baseUrl || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3001/api' : 'https://api.apostolicchurchlouisville.org/api');
  const response = await fetch(`${baseUrl}/payments${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || `Server error: ${response.status}`);
  }
  return result.data;
}

async function confirmPayment(clientSecret, billingDetails) {
  // Real Stripe payment confirmation
  const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
    payment_method: { card: card, billing_details: billingDetails },
  });
  if (error) throw error;
  return paymentIntent;
}

// =======================
// Real Form Submission
// =======================
function initFormSubmission() {
  const cardForm = document.getElementById("card-form");
  if (!cardForm) return;

  cardForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const cardName = document.getElementById("cardName").value;
    const email = document.getElementById("email").value;
    const activeAmountBtn = document.querySelector(".amount-btn.active");
    let amount =
      activeAmountBtn?.classList.contains("amount-btn-custom")
        ? document.getElementById("customAmount").value
        : activeAmountBtn?.getAttribute("data-amount");

    const fundInput = document.querySelector('input[name="fund"]:checked');
    const fund = fundInput ? fundInput.value : "tithe";

    const frequencyInput = document.querySelector('input[name="frequency"]:checked');
    const frequency = frequencyInput ? frequencyInput.value : "one-time";

    if (!cardName || !email) return showError("Please fill out all required fields");
    if (!isValidEmail(email)) return showError("Please enter a valid email");
    if (!amount || amount <= 0) return showError("Please enter a valid donation amount");

    const submitButton = cardForm.querySelector(".btn-donate");
    setLoadingState(submitButton, true);

    try {
      // 1. Create intent
      console.log('Creating payment intent for amount:', amount);
      const paymentIntentData = await createPaymentIntent(amount, "usd", {
        fund,
        frequency,
        donor_email: email,
        donor_name: cardName,
      });
      console.log('Payment intent created:', paymentIntentData);

      // 2. Confirm payment
      console.log('Confirming payment...');
      const billingDetails = { name: cardName, email: email };
      const paymentIntent = await confirmPayment(
        paymentIntentData.client_secret,
        billingDetails
      );
      console.log('Payment confirmed:', paymentIntent);

      // 3. Success
      if (paymentIntent.status === "succeeded") {
        console.log('Payment succeeded!');
        const frequencyText =
          frequency === "monthly" ? "monthly" : frequency === "weekly" ? "weekly" : "";
        
        showSuccess(
          `Thank you for your ${frequencyText} donation of $${amount}!<br>
          <small>Confirmation: ${paymentIntent.id}</small>`
        );

        setTimeout(() => {
          cardForm.reset();
          card.clear();
          if (typeof navigateToStep === "function") navigateToStep("1");
        }, 3000);
      } else {
        console.error('Payment not completed, status:', paymentIntent.status);
        throw new Error("Payment was not completed successfully");
      }
    } catch (err) {
      console.error('Payment error:', err);
      
      // Handle specific error types
      let errorMessage = err.message || "An error occurred while processing your payment";
      
      if (err.message && err.message.includes('api_key_expired')) {
        errorMessage = "Payment system is temporarily unavailable. Please try again later or contact support.";
      } else if (err.message && err.message.includes('authentication_failed')) {
        errorMessage = "Payment system configuration issue. Please contact support.";
      }
      
      showError(errorMessage);
    } finally {
      setLoadingState(submitButton, false);
    }
  });
}

// =======================
// Multi-Step Integration
// =======================
function initDonationCompletion() {
  const completeButton = document.getElementById("complete-donation");
  if (!completeButton) return;

  completeButton.addEventListener("click", async function (e) {
    e.preventDefault();
    const activePaymentTab = document.querySelector(".payment-tab.active");
    if (!activePaymentTab) return showMessage("Please select a payment method", "error");

    if (activePaymentTab.getAttribute("data-method") === "card") {
      // ✅ Use real flow (not demo)
      document.getElementById("card-form").dispatchEvent(new Event("submit"));
    } else if (activePaymentTab.getAttribute("data-method") === "paypal") {
      processPayPalPayment();
    } else if (activePaymentTab.getAttribute("data-method") === "bank") {
      processBankTransfer();
    }
  });
}

// =======================
// UI Initialization Functions  
// =======================

// Initialize donation amount buttons
function initDonationAmounts() {
  const amountButtons = document.querySelectorAll('.amount-btn');
  const customAmountContainer = document.querySelector('.custom-amount-container');
  const customAmountInput = document.getElementById('customAmount');
  
  // Set first amount button as active by default
  if (amountButtons.length > 0) {
    // Remove any existing active classes first
    amountButtons.forEach(btn => btn.classList.remove('active'));
    // Add active class to first button
    amountButtons[0].classList.add('active');
  }

  // Add click handlers for amount buttons
  amountButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Remove active class from all buttons
      amountButtons.forEach(btn => btn.classList.remove('active'));
      // Add active class to clicked button
      this.classList.add('active');

      // Handle custom amount display
      if (this.classList.contains('amount-btn-custom')) {
        customAmountContainer.classList.remove('hidden');
        customAmountInput.focus();
      } else {
        customAmountContainer.classList.add('hidden');
        customAmountInput.value = '';
      }

      // Update summary
      updateSummary();
    });
  });

  // Handle custom amount input
  if (customAmountInput) {
    customAmountInput.addEventListener('input', updateSummary);
  }
  
  // Update summary after initialization to reflect defaults
  updateSummary();
}

// Initialize multi-step form navigation
function initMultiStepForm() {
  const nextButtons = document.querySelectorAll('.btn-next');
  const backButtons = document.querySelectorAll('.btn-back');

  // Next button handlers
  nextButtons.forEach(button => {
    button.addEventListener('click', function() {
      const nextStep = this.getAttribute('data-next');
      if (nextStep && validateCurrentStep()) {
        navigateToStep(nextStep);
      }
    });
  });

  // Back button handlers
  backButtons.forEach(button => {
    button.addEventListener('click', function() {
      const prevStep = this.getAttribute('data-back');
      if (prevStep) {
        navigateToStep(prevStep);
      }
    });
  });
}

// Navigate to specific step
function navigateToStep(stepNumber) {
  const steps = document.querySelectorAll('.step');
  const stepContents = document.querySelectorAll('.contribution-step-content');

  // Update step indicators
  steps.forEach((step, index) => {
    if (index < stepNumber) {
      step.classList.add('completed');
      step.classList.remove('active');
    } else if (index === stepNumber - 1) {
      step.classList.add('active');
      step.classList.remove('completed');
    } else {
      step.classList.remove('active', 'completed');
    }
  });

  // Update step content visibility
  stepContents.forEach((content, index) => {
    if (index === stepNumber - 1) {
      content.classList.add('active');
    } else {
      content.classList.remove('active');
    }
  });

  // Update summary when moving to final step
  if (stepNumber == 3) {
    updateFinalSummary();
  }
}

// Validate current step before proceeding
function validateCurrentStep() {
  const activeStep = document.querySelector('.step.active');
  if (!activeStep) return true;

  const stepNumber = activeStep.getAttribute('data-step');
  
  if (stepNumber === '1') {
    // Validate amount selection
    const activeAmount = document.querySelector('.amount-btn.active');
    
    if (!activeAmount) {
      showError('Please select a donation amount');
      return false;
    }
    
    if (activeAmount.classList.contains('amount-btn-custom')) {
      const customAmount = document.getElementById('customAmount').value;
      if (!customAmount || parseFloat(customAmount) <= 0) {
        showError('Please enter a valid custom amount');
        return false;
      }
    }
    return true;
  }
  
  if (stepNumber === '2') {
    // Validate required fields
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;
    
    if (!firstName || !lastName || !email) {
      showError('Please fill in all required fields');
      return false;
    }
    
    if (!isValidEmail(email)) {
      showError('Please enter a valid email address');
      return false;
    }
    return true;
  }
  
  return true;
}

// Initialize summary updates
function initSummaryUpdates() {
  // Set up listeners for fund selection
  const fundInputs = document.querySelectorAll('input[name="fund"]');
  fundInputs.forEach(input => {
    input.addEventListener('change', updateSummary);
  });

  // Set up listeners for frequency selection
  const frequencyInputs = document.querySelectorAll('input[name="frequency"]');
  frequencyInputs.forEach(input => {
    input.addEventListener('change', updateSummary);
  });

  // Initial summary update
  updateSummary();
}

// Update contribution summary
function updateSummary() {
  const activeAmountBtn = document.querySelector('.amount-btn.active');
  const fundInput = document.querySelector('input[name="fund"]:checked');
  const frequencyInput = document.querySelector('input[name="frequency"]:checked');
  
  let amount = '50'; // Default to $50
  if (activeAmountBtn) {
    if (activeAmountBtn.classList.contains('amount-btn-custom')) {
      const customAmount = document.getElementById('customAmount').value;
      amount = customAmount || '0';
    } else {
      amount = activeAmountBtn.getAttribute('data-amount') || '50';
    }
  }
  
  const fund = fundInput ? fundInput.value : 'tithe';
  const frequency = frequencyInput ? frequencyInput.value : 'one-time';
  
  // Update summary displays
  const summaryAmount = document.getElementById('summary-amount');
  const summaryFund = document.getElementById('summary-fund');
  const summaryFrequency = document.getElementById('summary-frequency');
  
  if (summaryAmount) summaryAmount.textContent = `$${amount}`;
  if (summaryFund) summaryFund.textContent = getFundDisplayName(fund);
  if (summaryFrequency) summaryFrequency.textContent = getFrequencyDisplayName(frequency);
}

// Update final summary on step 3
function updateFinalSummary() {
  const activeAmountBtn = document.querySelector('.amount-btn.active');
  const fundInput = document.querySelector('input[name="fund"]:checked');
  const frequencyInput = document.querySelector('input[name="frequency"]:checked');
  
  let amount = '50'; // Default to $50
  if (activeAmountBtn) {
    if (activeAmountBtn.classList.contains('amount-btn-custom')) {
      const customAmount = document.getElementById('customAmount').value;
      amount = customAmount || '0';
    } else {
      amount = activeAmountBtn.getAttribute('data-amount') || '50';
    }
  }
  
  const fund = fundInput ? fundInput.value : 'tithe';
  const frequency = frequencyInput ? frequencyInput.value : 'one-time';
  
  // Update final summary displays
  const finalAmount = document.getElementById('final-summary-amount');
  const finalFund = document.getElementById('final-summary-fund');
  const finalFrequency = document.getElementById('final-summary-frequency');
  const finalTotal = document.getElementById('final-summary-total');
  
  if (finalAmount) finalAmount.textContent = `$${amount}`;
  if (finalFund) finalFund.textContent = getFundDisplayName(fund);
  if (finalFrequency) finalFrequency.textContent = getFrequencyDisplayName(frequency);
  if (finalTotal) finalTotal.textContent = `$${amount}`;
  
  // Update card name field with user's name
  const firstName = document.getElementById('firstName').value;
  const lastName = document.getElementById('lastName').value;
  const cardName = document.getElementById('cardName');
  if (cardName && firstName && lastName) {
    cardName.value = `${firstName} ${lastName}`;
  }
}

// Helper function to get display name for fund
function getFundDisplayName(fund) {
  const fundNames = {
    'tithe': 'Tithe',
    'offering': 'Offering',
    'youth': 'Youth Movement',
    'childern ministry': "Children's Ministry",
    "women's movement": "Women's Movement",
    "men's movement": "Men's Movement"
  };
  return fundNames[fund] || fund;
}

// Helper function to get display name for frequency
function getFrequencyDisplayName(frequency) {
  const frequencyNames = {
    'one-time': 'One Time',
    'weekly': 'Weekly',
    'monthly': 'Monthly'
  };
  return frequencyNames[frequency] || frequency;
}

// Placeholder functions for other missing initializers
function initCounters() {
  // Add any counter animations if needed
}

function initPaymentTabs() {
  // Payment tabs are already handled, this is a placeholder
}

function initFaqAccordion() {
  // FAQ functionality if needed
}

function initSmoothScroll() {
  // Smooth scroll functionality
  const smoothScrollLinks = document.querySelectorAll('.smooth-scroll');
  smoothScrollLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

function initFrequencyToggle() {
  // Frequency toggle is handled by radio buttons and CSS
}

function initYouthDonation() {
  // Youth-specific donation handling if needed
}

function initMinistrySelection() {
  // Ministry selection is handled by radio buttons
}

function initializeAlternativePaymentMethods() {
  // Alternative payment methods if needed
}

// =======================
// Message Helpers
// =======================
function showError(message) {
  clearMessages();
  const errorDiv = document.createElement("div");
  errorDiv.className = "form-status error";
  errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
  const form = document.querySelector("#card-form") || document.querySelector(".contribution-card");
  if (form) form.insertBefore(errorDiv, form.firstChild);
}

function showSuccess(message) {
  clearMessages();
  const successDiv = document.createElement("div");
  successDiv.className = "form-status success";
  successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
  const form = document.querySelector("#card-form") || document.querySelector(".contribution-card");
  if (form) form.insertBefore(successDiv, form.firstChild);
}

function clearMessages() {
  document.querySelectorAll(".form-status").forEach((msg) => msg.remove());
  const cardErrors = document.getElementById("card-errors");
  if (cardErrors) cardErrors.textContent = "";
}

function setLoadingState(button, isLoading) {
  if (!button) return;
  button.disabled = isLoading;
  button.innerHTML = isLoading
    ? '<i class="fas fa-spinner fa-spin"></i> Processing...'
    : '<span>Complete Donation</span><i class="fas fa-heart"></i>';
}

// =======================
// Validation
// =======================
function isValidEmail(email) {
  const re =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}
