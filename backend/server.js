const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const Stripe = require('stripe');

// Load environment variables from advanced-server directory
// This allows us to use the real Stripe keys configured there
require('dotenv').config({ path: require('path').join(__dirname, 'advanced-server', '.env') });

// Initialize Stripe with real API key from advanced-server/.env
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY environment variable is required');
  console.log('💡 Please check the advanced-server/.env file and ensure STRIPE_SECRET_KEY is set');
  process.exit(1);
}

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
console.log('✅ Stripe initialized with live API key from advanced-server/.env');

// Import routes
let testConnection;
try {
  const db = require('./models/DataStore');
  testConnection = () => {
    console.log('✅ Local file-based database connected');
    return true;
  };
  console.log('✅ Database module loaded (file-based storage)');
} catch (error) {
  console.log('ℹ️  Database module not available, running in basic mode');
  testConnection = async () => {
    console.log('⚠️  No database configured');
    return false;
  };
}

const authRoutes = require('./routes/auth');
const blogRoutes = require('./routes/blog');
const eventRoutes = require('./routes/events');
const sermonRoutes = require('./routes/sermons');
const uploadRoutes = require('./routes/upload');
const adminRoutes = require('./routes/admin');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later',
});

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5500',
    'https://apostolicchurchlouisville.org',
    'https://www.apostolicchurchlouisville.org'
  ],
  credentials: true
}));

// =======================
// Stripe Webhook (MUST be before body parsers)
// =======================
// IMPORTANT: raw body is required for webhook signature verification
app.post(
  '/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      // Verify webhook signature with the real webhook secret
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('⚠️ Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle different event types
    console.log('📫 Received webhook event:', event.type);
    
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('✅ PaymentIntent was successful:', {
          id: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          metadata: paymentIntent.metadata
        });

        // Example: Save donation record in DB
        // await Donations.create({
        //   amount: paymentIntent.amount,
        //   currency: paymentIntent.currency,
        //   donorEmail: paymentIntent.receipt_email,
        //   status: "succeeded"
        // });

        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log('❌ Payment failed:', {
          id: failedPayment.id,
          last_payment_error: failedPayment.last_payment_error
        });
        break;

      case 'payment_intent.created':
        const createdPayment = event.data.object;
        console.log('🔄 Payment intent created:', createdPayment.id);
        break;

      default:
        console.log(`📊 Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  }
);

// Middleware (body parsers come AFTER webhook route)
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser());

// Serve static files
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// =======================
// Stripe Payment Intent API
// =======================
app.post('/api/payments/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency, metadata } = req.body;
    console.log('💳 Creating payment intent:', { amount, currency, metadata });

    if (!amount) {
      return res
        .status(400)
        .json({ success: false, message: 'Amount is required' });
    }

    const amountInCents = Math.round(amount * 100);
    console.log('💰 Amount in cents:', amountInCents);

    if (amountInCents < 50) {
      return res.status(400).json({ success: false, message: 'Amount must be at least $0.50' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency || 'usd',
      metadata: {
        church_name: 'Apostolic Church International',
        fund: metadata.fund || 'General Fund',
        frequency: metadata.frequency || 'one-time',
        donor_email: metadata.donor_email || '',
        donor_name: metadata.donor_name || '',
        donation_source: 'website',
        created_at: new Date().toISOString(),
        ...metadata
      },
      automatic_payment_methods: { enabled: true },
      description: `Donation to ${metadata.fund || 'General Fund'} - ${metadata.frequency || 'one-time'}`,
    });

    console.log('✅ Payment intent created:', paymentIntent.id, 'for $' + amount);

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
    console.error('❌ Stripe Payment Intent Error:', error);
    
    // Handle specific Stripe errors
    if (error.type === 'StripeAuthenticationError') {
      if (error.code === 'api_key_expired') {
        console.error('🔑 Stripe API key has expired. Please update STRIPE_SECRET_KEY in advanced-server/.env');
        return res.status(401).json({ 
          success: false, 
          message: 'Payment system configuration error: API key expired. Please contact support.',
          error_type: 'api_key_expired'
        });
      } else {
        console.error('🔑 Stripe authentication failed. Please check STRIPE_SECRET_KEY in advanced-server/.env');
        return res.status(401).json({ 
          success: false, 
          message: 'Payment system authentication failed. Please contact support.',
          error_type: 'authentication_failed'
        });
      }
    }
    
    res.status(500).json({ 
      success: false, 
      message: error.message || 'An unexpected error occurred while processing payment',
      error_type: error.type || 'unknown_error'
    });
  }
});



// =======================
// API Routes with Rate Limit
// =======================
app.use('/api/auth', authRoutes);
app.use('/api/blog', apiLimiter, blogRoutes);
app.use('/api/events', apiLimiter, eventRoutes);
app.use('/api/sermons', apiLimiter, sermonRoutes);
app.use('/api/upload', apiLimiter, uploadRoutes);
app.use('/api/admin', apiLimiter, adminRoutes);

// =======================
// Health Check Endpoint
// =======================
app.get('/api/health', async (req, res) => {
  try {
    const dbConnected = await testConnection();
    
    res.json({
      success: true,
      message: 'Server is healthy',
      timestamp: new Date().toISOString(),
      database: dbConnected ? 'connected (file-based)' : 'not configured',
      version: '1.0.0',
      stripe: 'configured'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server health check failed',
      error: error.message
    });
  }
});

// =======================
// Serve Frontend Pages
// =======================
app.get('/dashboard*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// =======================
// Error Handling
// =======================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong on the server',
    error: process.env.NODE_ENV === 'production' ? null : err.message,
  });
});

// =======================
// Start Server
// =======================
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔑 Admin dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`🔑 Login page: http://localhost:${PORT}/login`);
  console.log(`💳 Stripe payments ready at /api/payments/create-payment-intent`);
  console.log(`📩 Stripe webhook listening at /api/webhooks/stripe`);
});
