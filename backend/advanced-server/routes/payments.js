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
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least $1'),
  body('currency').optional().isIn(['usd']).withMessage('Currency must be USD'),
  body('metadata').optional().isObject().withMessage('Metadata must be an object'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { amount, currency = 'usd', metadata = {} } = req.body;
    const amountInCents = Math.round(amount * 100);

    if (amountInCents < 50) {
      return res.status(400).json({ success: false, message: 'Amount must be at least $0.50' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency,
      metadata: {
        church_name: 'Apostolic Church International',
        fund: metadata.fund || 'General Fund',
        frequency: metadata.frequency || 'one-time',
        donor_email: metadata.donor_email || '',
        donor_name: metadata.donor_name || '',
        donation_source: 'website',
        created_at: new Date().toISOString(),
      },
      automatic_payment_methods: { enabled: true },
      description: `Donation to ${metadata.fund || 'General Fund'} - ${metadata.frequency || 'one-time'}`,
    });

    console.log(`✅ Payment Intent created: ${paymentIntent.id} for $${amount}`);

    res.json({
      success: true,
      message: 'Payment intent created successfully',
      data: {
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        amount,
        currency,
        status: paymentIntent.status,
      },
    });

  } catch (error) {
    console.error('❌ Error creating payment intent:', error);

    return res.status(500).json({
      success: false,
      message: error.message || 'An unexpected error occurred while processing payment',
      error_type: error.type || 'unknown_error',
    });
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
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { payment_intent_id } = req.body;
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

    console.log(`✅ Payment Intent retrieved: ${paymentIntent.id} - Status: ${paymentIntent.status}`);

    res.json({
      success: true,
      message: 'Payment status retrieved successfully',
      data: {
        payment_intent_id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100, // convert back to dollars
        currency: paymentIntent.currency,
        metadata: paymentIntent.metadata,
      },
    });

  } catch (error) {
    console.error('❌ Error retrieving payment intent:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve payment status', error_type: 'retrieval_error' });
  }
});

/**
 * @route   GET /api/payments/test
 * @desc    Test Stripe connection (dev only)
 * @access  Public
 */
router.get('/test', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, message: 'Test route disabled in production' });
  }

  try {
    const testPaymentIntent = await stripe.paymentIntents.create({
      amount: 100,
      currency: 'usd',
      metadata: { test: 'true', church_name: 'Apostolic Church International' }
    });
    await stripe.paymentIntents.cancel(testPaymentIntent.id);

    res.json({
      success: true,
      message: 'Stripe connection test successful',
      data: { stripe_connected: true, test_payment_intent_created: true, test_payment_intent_cancelled: true }
    });

  } catch (error) {
    console.error('❌ Stripe connection test failed:', error);
    res.status(500).json({ success: false, message: 'Stripe connection test failed: ' + error.message });
  }
});

module.exports = router;
