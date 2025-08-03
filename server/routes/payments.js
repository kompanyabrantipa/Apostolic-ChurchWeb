const express = require('express');
const Stripe = require('stripe');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Initialize Stripe with secret key from environment
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * @route   POST /api/payments/create-payment-intent
 * @desc    Create a payment intent for donation processing
 * @access  Public
 */
router.post('/create-payment-intent', [
  // Validation middleware
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least $1'),
  body('currency').optional().isIn(['usd']).withMessage('Currency must be USD'),
  body('metadata').optional().isObject().withMessage('Metadata must be an object'),
  body('metadata.fund').optional().isString().withMessage('Fund must be a string'),
  body('metadata.frequency').optional().isString().withMessage('Frequency must be a string'),
  body('metadata.donor_email').optional().isEmail().withMessage('Donor email must be valid'),
  body('metadata.donor_name').optional().isString().withMessage('Donor name must be a string')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { amount, currency = 'usd', metadata = {} } = req.body;

    // Convert amount to cents (Stripe expects amounts in smallest currency unit)
    const amountInCents = Math.round(amount * 100);

    // Validate amount
    if (amountInCents < 50) { // Minimum $0.50 for Stripe
      return res.status(400).json({
        success: false,
        message: 'Amount must be at least $0.50'
      });
    }

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency,
      metadata: {
        // Add church-specific metadata
        church_name: 'Apostolic Church International',
        fund: metadata.fund || 'General Fund',
        frequency: metadata.frequency || 'one-time',
        donor_email: metadata.donor_email || '',
        donor_name: metadata.donor_name || '',
        created_at: new Date().toISOString()
      },
      automatic_payment_methods: {
        enabled: true,
      },
      // Add description for Stripe dashboard
      description: `Donation to ${metadata.fund || 'General Fund'} - ${metadata.frequency || 'one-time'}`
    });

    // Log successful payment intent creation (for debugging)
    console.log(`✅ Payment Intent created: ${paymentIntent.id} for $${amount}`);

    // Return client secret and payment intent details
    res.json({
      success: true,
      message: 'Payment intent created successfully',
      data: {
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        amount: amount,
        currency: currency,
        status: paymentIntent.status
      }
    });

  } catch (error) {
    console.error('❌ Error creating payment intent:', error);

    // Handle specific Stripe errors
    if (error.type === 'StripeCardError') {
      return res.status(400).json({
        success: false,
        message: 'Card error: ' + error.message,
        error_type: 'card_error'
      });
    } else if (error.type === 'StripeRateLimitError') {
      return res.status(429).json({
        success: false,
        message: 'Too many requests made to the API too quickly',
        error_type: 'rate_limit_error'
      });
    } else if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid parameters: ' + error.message,
        error_type: 'invalid_request_error'
      });
    } else if (error.type === 'StripeAPIError') {
      return res.status(500).json({
        success: false,
        message: 'An error occurred with our API',
        error_type: 'api_error'
      });
    } else if (error.type === 'StripeConnectionError') {
      return res.status(500).json({
        success: false,
        message: 'A network error occurred',
        error_type: 'connection_error'
      });
    } else if (error.type === 'StripeAuthenticationError') {
      return res.status(401).json({
        success: false,
        message: 'Authentication with Stripe failed',
        error_type: 'authentication_error'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'An unexpected error occurred while processing payment',
        error_type: 'unknown_error'
      });
    }
  }
});

/**
 * @route   POST /api/payments/confirm-payment
 * @desc    Confirm payment status (optional endpoint for additional verification)
 * @access  Public
 */
router.post('/confirm-payment', [
  body('payment_intent_id').isString().notEmpty().withMessage('Payment intent ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { payment_intent_id } = req.body;

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

    console.log(`✅ Payment Intent retrieved: ${paymentIntent.id} - Status: ${paymentIntent.status}`);

    res.json({
      success: true,
      message: 'Payment status retrieved successfully',
      data: {
        payment_intent_id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100, // Convert back to dollars
        currency: paymentIntent.currency,
        metadata: paymentIntent.metadata
      }
    });

  } catch (error) {
    console.error('❌ Error retrieving payment intent:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payment status',
      error_type: 'retrieval_error'
    });
  }
});

/**
 * @route   GET /api/payments/test
 * @desc    Test Stripe connection and configuration
 * @access  Public (for testing only)
 */
router.get('/test', async (req, res) => {
  try {
    // Test Stripe connection by creating a minimal payment intent
    const testPaymentIntent = await stripe.paymentIntents.create({
      amount: 100, // $1.00
      currency: 'usd',
      metadata: {
        test: 'true',
        church_name: 'Apostolic Church International'
      }
    });

    // Immediately cancel the test payment intent
    await stripe.paymentIntents.cancel(testPaymentIntent.id);

    res.json({
      success: true,
      message: 'Stripe connection test successful',
      data: {
        stripe_connected: true,
        test_payment_intent_created: true,
        test_payment_intent_cancelled: true,
        stripe_account: testPaymentIntent.client_secret ? 'Valid' : 'Invalid'
      }
    });

  } catch (error) {
    console.error('❌ Stripe connection test failed:', error);
    
    res.status(500).json({
      success: false,
      message: 'Stripe connection test failed: ' + error.message,
      data: {
        stripe_connected: false,
        error_type: error.type || 'unknown'
      }
    });
  }
});

module.exports = router;
