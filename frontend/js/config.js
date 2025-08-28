/**
 * Frontend Configuration
 * This file contains client-side configuration values
 * 
 * SECURITY NOTE: Only include values that are safe to expose to the client
 * Never include secret keys, API secrets, or sensitive configuration here
 */

// Environment detection
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const isDevelopment = !isProduction;

// Configuration object
const Config = {
    // Environment
    environment: isProduction ? 'production' : 'development',
    
    // Stripe Configuration (Client-side only)
    stripe: {
        // Publishable key (safe to expose to client)
        publishableKey: isProduction
            ? 'pk_test_51RoXpfL498oAJ59VBDtpvH9n2mvk3wVUY9Uwd5IcU6xM1T15RRdgvMWP3G5XNG1lMJfs7vEj6uqPHloJdquKRDuy00mhpMZeNj' // Replace with production key when ready
            : 'pk_test_51RoXpfL498oAJ59VBDtpvH9n2mvk3wVUY9Uwd5IcU6xM1T15RRdgvMWP3G5XNG1lMJfs7vEj6uqPHloJdquKRDuy00mhpMZeNj'
    },
    
    // API Configuration
    api: {
        baseUrl: isProduction ? '/api' : '/api',
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

// Freeze configuration to prevent modification
Object.freeze(Config);
Object.freeze(Config.stripe);
Object.freeze(Config.api);
Object.freeze(Config.features);
Object.freeze(Config.debug);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Config;
} else {
    window.Config = Config;
}

// Log configuration in development
if (Config.debug.enabled) {
    console.log('🔧 Frontend Configuration Loaded:', {
        environment: Config.environment,
        stripeKeyPrefix: Config.stripe.publishableKey.substring(0, 12) + '...',
        apiBaseUrl: Config.api.baseUrl,
        features: Config.features
    });
}
