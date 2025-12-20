/**
 * Frontend Configuration
 * This file contains client-side configuration values
 */

// Detect environment
// More robust detection: check if we're on localhost or if we're accessing the API on the same host
const isLocalhost =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === '[::1]' ||
  (window.location.hostname.match(/^\d+\.\d+\.\d+\.\d+$/) && !window.location.hostname.startsWith('192.168.'));

// Also check if we're accessing the local development server
const isLocalDevelopment = isLocalhost || window.location.port === '3001';

const isProduction = !isLocalDevelopment;

const isDevelopment = !isProduction;

// Configuration object
const Config = {
  // Environment
  environment: isProduction ? 'production' : 'development',

  // Stripe Configuration (Client-side only)
  stripe: {
    // Publishable key (safe to expose to client)
    // Using the live publishable key that matches the live secret key in advanced-server/.env
    publishableKey: 'pk_live_51RoXpfL498oAJ59Vyd2YKh5B79oLSZkIbYTyxtOXbwr5SEWFlTbLWWiOAOAUBBLim9nT9YRZ6yvwyjhKTJ2wWRaF00SQehdjew'
  },

  // API Configuration
  api: {
    baseUrl: isProduction ? 'https://api.apostolicchurchlouisville.org/api' : `http://${window.location.hostname}:3001/api`,
    timeout: 10000
  },

  // Feature flags
  features: {
    enableRealTimePayments: true,
    enablePaymentValidation: true,
    enablePaymentLogging: isDevelopment
  },

  // Debug settings
  debug: {
    enabled: isDevelopment,
    logLevel: isDevelopment ? 'debug' : 'error'
  }
};

// Freeze configuration to prevent accidental modification
Object.freeze(Config);
Object.freeze(Config.stripe);
Object.freeze(Config.api);
Object.freeze(Config.features);
Object.freeze(Config.debug);

// Export for Node.js or attach to window for browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Config;
} else {
  window.Config = Config;
}

// Log configuration only in development
if (Config.debug.enabled) {
  console.log('🔧 Frontend Configuration Loaded:', {
    environment: Config.environment,
    stripeKeyPrefix:
      Config.stripe.publishableKey.substring(0, 12) + '...',
    apiBaseUrl: Config.api.baseUrl,
    features: Config.features
  });
}
