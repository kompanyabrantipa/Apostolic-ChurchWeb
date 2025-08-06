const express = require('express');
const Stripe = require('stripe');

const router = express.Router();

// Initialize Stripe with secret key from environment
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Webhook endpoint secret for signature verification
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * @route   POST /api/webhooks/stripe
 * @desc    Handle Stripe webhook events
 * @access  Public (but verified with Stripe signature)
 */
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify webhook signature if endpoint secret is configured
    if (endpointSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } else {
      // For development/testing without webhook secret
      event = JSON.parse(req.body);
      console.log('⚠️ Webhook processed without signature verification (development mode)');
    }
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('✅ Payment succeeded:', {
          id: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          metadata: paymentIntent.metadata
        });

        // Here you could save the successful payment to your database
        // await savePaymentToDatabase(paymentIntent);
        
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log('❌ Payment failed:', {
          id: failedPayment.id,
          amount: failedPayment.amount / 100,
          currency: failedPayment.currency,
          last_payment_error: failedPayment.last_payment_error
        });
        break;

      case 'payment_intent.created':
        const createdPayment = event.data.object;
        console.log('📝 Payment intent created:', {
          id: createdPayment.id,
          amount: createdPayment.amount / 100,
          currency: createdPayment.currency,
          metadata: createdPayment.metadata
        });
        break;

      case 'payment_method.attached':
        const paymentMethod = event.data.object;
        console.log('💳 Payment method attached:', paymentMethod.id);
        break;

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.json({ received: true });

  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    res.status(500).json({ 
      error: 'Webhook processing failed',
      message: error.message 
    });
  }
});

/**
 * @route   GET /api/webhooks/test
 * @desc    Test webhook endpoint configuration
 * @access  Public (for testing only)
 */
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Webhook endpoint is accessible',
    data: {
      endpoint_secret_configured: !!endpointSecret,
      stripe_configured: !!process.env.STRIPE_SECRET_KEY,
      webhook_url: '/api/webhooks/stripe'
    }
  });
});

module.exports = router;
