const express = require('express');
const router = express.Router();

/**
 * @route   GET /api/config/client
 * @desc    Get client-safe configuration
 * @access  Public
 */
router.get('/client', (req, res) => {
  try {
    // Only expose client-safe configuration values
    const clientConfig = {
      environment: process.env.NODE_ENV || 'development',
      stripe: {
        // LIVE publishable key (safe for client-side) - PRODUCTION READY
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_live_51RoXpfL498oAJ59Vyd2YKh5B79oLSZkIbYTyxtOXbwr5SEWFlTbLWWiOAOAUBBLim9nT9YRZ6yvwyjhKTJ2wWRaF00SQehdjew'
      },
      api: {
        baseUrl: '/api',
        timeout: 10000
      },
      features: {
        enableRealTimePayments: true,
        enablePaymentValidation: true,
        enablePaymentLogging: process.env.NODE_ENV === 'development'
      },
      debug: {
        enabled: process.env.NODE_ENV === 'development',
        logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'error'
      }
    };

    // Set appropriate cache headers
    if (process.env.NODE_ENV === 'production') {
      res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
    } else {
      res.set('Cache-Control', 'no-cache');
    }

    res.json({
      success: true,
      data: clientConfig
    });

  } catch (error) {
    console.error('Error serving client config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load configuration'
    });
  }
});

/**
 * @route   GET /api/config/client.js
 * @desc    Get client configuration as JavaScript module
 * @access  Public
 */
router.get('/client.js', (req, res) => {
  try {
    // Generate JavaScript configuration
    const clientConfig = {
      environment: process.env.NODE_ENV || 'development',
      stripe: {
        // LIVE publishable key - PRODUCTION READY
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_live_51RoXpfL498oAJ59Vyd2YKh5B79oLSZkIbYTyxtOXbwr5SEWFlTbLWWiOAOAUBBLim9nT9YRZ6yvwyjhKTJ2wWRaF00SQehdjew'
      },
      api: {
        baseUrl: '/api',
        timeout: 10000
      },
      features: {
        enableRealTimePayments: true,
        enablePaymentValidation: true,
        enablePaymentLogging: process.env.NODE_ENV === 'development'
      },
      debug: {
        enabled: process.env.NODE_ENV === 'development',
        logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'error'
      }
    };

    const jsContent = `
// Auto-generated client configuration
// Generated at: ${new Date().toISOString()}
window.Config = ${JSON.stringify(clientConfig, null, 2)};

// Freeze configuration to prevent modification
Object.freeze(window.Config);
Object.freeze(window.Config.stripe);
Object.freeze(window.Config.api);
Object.freeze(window.Config.features);
Object.freeze(window.Config.debug);

// Log configuration in development
if (window.Config.debug.enabled) {
    console.log('🔧 Dynamic Configuration Loaded:', {
        environment: window.Config.environment,
        stripeKeyPrefix: window.Config.stripe.publishableKey.substring(0, 12) + '...',
        apiBaseUrl: window.Config.api.baseUrl,
        features: window.Config.features
    });
}
`;

    // Set appropriate headers
    res.set('Content-Type', 'application/javascript');
    if (process.env.NODE_ENV === 'production') {
      res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
    } else {
      res.set('Cache-Control', 'no-cache');
    }

    res.send(jsContent);

  } catch (error) {
    console.error('Error serving client config JS:', error);
    res.status(500).send('// Configuration loading failed');
  }
});

module.exports = router;
