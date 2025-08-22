#!/usr/bin/env node

/**
 * Stripe Keys Validation Script
 * Validates that Stripe keys are properly configured and are live keys
 * 
 * Usage: node scripts/validate-stripe-keys.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Stripe Key Configuration...\n');

// Expected live key prefixes
const EXPECTED_LIVE_PUBLISHABLE_PREFIX = 'pk_live_';
const EXPECTED_LIVE_SECRET_PREFIX = 'sk_live_';

// Current live keys (for validation)
const EXPECTED_PUBLISHABLE_KEY = 'pk_live_51RoXpfL498oAJ59Vyd2YKh5B79oLSZkIbYTyxtOXbwr5SEWFlTbLWWiOAOAUBBLim9nT9YRZ6yvwyjhKTJ2wWRaF00SQehdjew';
const EXPECTED_SECRET_KEY = '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';

let validationResults = [];
let hasErrors = false;

/**
 * Validate a file for Stripe key presence and correctness
 */
function validateFile(filePath, keyType, expectedKey) {
    try {
        if (!fs.existsSync(filePath)) {
            validationResults.push(`❌ File not found: ${filePath}`);
            hasErrors = true;
            return;
        }

        const content = fs.readFileSync(filePath, 'utf8');
        
        if (content.includes(expectedKey)) {
            validationResults.push(`✅ ${keyType} key correctly configured in: ${filePath}`);
        } else if (keyType === 'Publishable' && content.includes('pk_live_')) {
            validationResults.push(`⚠️  ${keyType} key found but may be incorrect in: ${filePath}`);
        } else if (keyType === 'Secret' && content.includes('sk_live_')) {
            validationResults.push(`⚠️  ${keyType} key found but may be incorrect in: ${filePath}`);
        } else if (content.includes('pk_test_') || content.includes('sk_test_')) {
            validationResults.push(`❌ TEST key found instead of LIVE key in: ${filePath}`);
            hasErrors = true;
        } else {
            validationResults.push(`❌ No ${keyType} key found in: ${filePath}`);
            hasErrors = true;
        }
    } catch (error) {
        validationResults.push(`❌ Error reading ${filePath}: ${error.message}`);
        hasErrors = true;
    }
}

/**
 * Check environment variables
 */
function validateEnvironmentVariables() {
    const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
    const secretKey = process.env.STRIPE_SECRET_KEY;
    
    if (publishableKey) {
        if (publishableKey === EXPECTED_PUBLISHABLE_KEY) {
            validationResults.push('✅ Environment variable STRIPE_PUBLISHABLE_KEY is correctly set');
        } else if (publishableKey.startsWith(EXPECTED_LIVE_PUBLISHABLE_PREFIX)) {
            validationResults.push('⚠️  Environment variable STRIPE_PUBLISHABLE_KEY is set but may be incorrect');
        } else {
            validationResults.push('❌ Environment variable STRIPE_PUBLISHABLE_KEY is not a live key');
            hasErrors = true;
        }
    } else {
        validationResults.push('⚠️  Environment variable STRIPE_PUBLISHABLE_KEY is not set (will use fallback)');
    }
    
    if (secretKey) {
        if (secretKey === EXPECTED_SECRET_KEY) {
            validationResults.push('✅ Environment variable STRIPE_SECRET_KEY is correctly set');
        } else if (secretKey.startsWith(EXPECTED_LIVE_SECRET_PREFIX)) {
            validationResults.push('⚠️  Environment variable STRIPE_SECRET_KEY is set but may be incorrect');
        } else {
            validationResults.push('❌ Environment variable STRIPE_SECRET_KEY is not a live key');
            hasErrors = true;
        }
    } else {
        validationResults.push('❌ Environment variable STRIPE_SECRET_KEY is not set');
        hasErrors = true;
    }
}

// Files to validate
const filesToValidate = [
    // Frontend files (publishable key)
    { path: '../../../frontend/js/config.js', type: 'Publishable', key: EXPECTED_PUBLISHABLE_KEY },
    { path: '../../../frontend/js/donate.js', type: 'Publishable', key: EXPECTED_PUBLISHABLE_KEY },
    { path: '../routes/config.js', type: 'Publishable', key: EXPECTED_PUBLISHABLE_KEY },

    // Backend template files
    { path: './generate-production-secrets.js', type: 'Secret', key: EXPECTED_SECRET_KEY }
];

console.log('📁 Validating configuration files...\n');

// Validate each file
filesToValidate.forEach(file => {
    const fullPath = path.resolve(__dirname, file.path);
    validateFile(fullPath, file.type, file.key);
});

console.log('🌍 Validating environment variables...\n');

// Validate environment variables
validateEnvironmentVariables();

// Display results
console.log('📋 Validation Results:\n');
validationResults.forEach(result => console.log(result));

console.log('\n' + '='.repeat(60));

if (hasErrors) {
    console.log('❌ VALIDATION FAILED - Some issues need to be addressed');
    console.log('\n🔧 Recommendations:');
    console.log('1. Ensure all files contain the correct live Stripe keys');
    console.log('2. Set environment variables STRIPE_PUBLISHABLE_KEY and STRIPE_SECRET_KEY');
    console.log('3. Never commit live keys to version control');
    console.log('4. Use environment variables in production');
    process.exit(1);
} else {
    console.log('✅ VALIDATION PASSED - All Stripe keys are properly configured');
    console.log('\n🔒 Security Reminders:');
    console.log('1. These are LIVE keys - handle with extreme care');
    console.log('2. Never share or commit these keys to version control');
    console.log('3. Monitor Stripe dashboard for any suspicious activity');
    console.log('4. Rotate keys periodically for security');
}

console.log('\n🚀 Your Stripe integration is ready for production!');
