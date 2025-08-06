const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Generate secure production secrets
function generateProductionSecrets() {
  console.log('🔐 Generating Production Security Secrets');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Generate secure random strings
  const jwtSecret = crypto.randomBytes(64).toString('hex');
  const sessionSecret = crypto.randomBytes(64).toString('hex');
  const apiKey1 = crypto.randomBytes(32).toString('hex');
  const apiKey2 = crypto.randomBytes(32).toString('hex');
  
  // Generate secure admin credentials
  const adminUsername = 'church_admin_' + crypto.randomBytes(4).toString('hex');
  const adminPassword = generateSecurePassword();
  
  const secrets = {
    JWT_SECRET: jwtSecret,
    SESSION_SECRET: sessionSecret,
    ADMIN_USERNAME: adminUsername,
    ADMIN_PASSWORD: adminPassword,
    API_KEY_1: apiKey1,
    API_KEY_2: apiKey2,
    GENERATED_AT: new Date().toISOString()
  };
  
  console.log('✅ Generated secure secrets:');
  console.log(`   JWT Secret: ${jwtSecret.substring(0, 20)}... (128 chars)`);
  console.log(`   Session Secret: ${sessionSecret.substring(0, 20)}... (128 chars)`);
  console.log(`   Admin Username: ${adminUsername}`);
  console.log(`   Admin Password: ${adminPassword}`);
  console.log(`   API Keys: 2 keys generated`);
  
  // Save to secure file
  const secretsFile = path.join(__dirname, '..', 'production-secrets.json');
  fs.writeFileSync(secretsFile, JSON.stringify(secrets, null, 2), { mode: 0o600 });
  
  console.log(`💾 Secrets saved to: ${secretsFile}`);
  console.log('⚠️  IMPORTANT: Store these secrets securely and delete this file after deployment!');
  
  return secrets;
}

function generateSecurePassword() {
  const length = 16;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  // Ensure at least one of each type
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
  password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Special
  
  // Fill the rest
  for (let i = 4; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Create production .env file
function createProductionEnv(secrets) {
  console.log('\n📝 Creating production .env file...');
  
  const productionEnv = `# =============================================================================
# APOSTOLIC CHURCH INTERNATIONAL - PRODUCTION CONFIGURATION
# =============================================================================
# Generated on: ${new Date().toISOString()}
# WARNING: Keep this file secure and never commit to version control!

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================

# Production MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/apostolic_church_prod
MONGODB_USERNAME=
MONGODB_PASSWORD=

# For MongoDB Atlas (recommended for production):
# MONGODB_URI=mongodb+srv://church_admin:SECURE_PASSWORD@apostolic-cluster.mongodb.net/apostolic_church_prod?retryWrites=true&w=majority

# MongoDB Connection Pool Settings
MONGODB_MAX_POOL_SIZE=20
MONGODB_SERVER_SELECTION_TIMEOUT_MS=5000
MONGODB_SOCKET_TIMEOUT_MS=45000
MONGODB_CONNECT_TIMEOUT_MS=10000
MONGODB_MAX_IDLE_TIME_MS=30000

# =============================================================================
# SECURITY CONFIGURATION
# =============================================================================

# JWT Configuration (SECURE - Generated)
JWT_SECRET=${secrets.JWT_SECRET}
JWT_EXPIRES_IN=8h

# Admin User Configuration (SECURE - Generated)
ADMIN_USERNAME=${secrets.ADMIN_USERNAME}
ADMIN_PASSWORD=${secrets.ADMIN_PASSWORD}

# Session Configuration (SECURE - Generated)
SESSION_SECRET=${secrets.SESSION_SECRET}
COOKIE_SECURE=true
COOKIE_HTTP_ONLY=true
COOKIE_SAME_SITE=strict

# API Keys for External Integrations
VALID_API_KEYS=${secrets.API_KEY_1},${secrets.API_KEY_2}

# =============================================================================
# SERVER CONFIGURATION
# =============================================================================

# Production Server Settings
NODE_ENV=production
PORT=443
HTTPS_ENABLED=true
HTTP_PORT=80

# SSL Configuration
SSL_CERT_PATH=/etc/ssl/certs/apostolicchurch.crt
SSL_KEY_PATH=/etc/ssl/private/apostolicchurch.key
SSL_CA_PATH=/etc/ssl/certs/apostolicchurch-ca.crt

# =============================================================================
# CORS & SECURITY HEADERS
# =============================================================================

# Production CORS Configuration
FRONTEND_URL=https://apostolicchurch.org
ALLOWED_ORIGINS=https://apostolicchurch.org,https://www.apostolicchurch.org

# Security Headers
HELMET_ENABLED=true
CONTENT_SECURITY_POLICY=true
HSTS_MAX_AGE=31536000
REFERRER_POLICY=strict-origin-when-cross-origin
X_FRAME_OPTIONS=DENY
X_CONTENT_TYPE_OPTIONS=nosniff

# =============================================================================
# RATE LIMITING & PERFORMANCE
# =============================================================================

# Production Rate Limiting (more restrictive)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=30
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=false

# API Rate Limiting
API_RATE_LIMIT_WINDOW_MS=300000
API_RATE_LIMIT_MAX_REQUESTS=15

# Performance Settings
ENABLE_GZIP=true
COMPRESSION_LEVEL=6
ENABLE_RESPONSE_CACHING=true
CACHE_TTL=3600

# =============================================================================
# LOGGING & MONITORING
# =============================================================================

# Logging Configuration
LOG_LEVEL=warn
LOG_FILE=/var/log/apostolic-church/app.log
LOG_MAX_SIZE=50m
LOG_MAX_FILES=10
ENABLE_ACCESS_LOG=true

# Performance Monitoring
ENABLE_QUERY_LOGGING=true
SLOW_QUERY_THRESHOLD_MS=500
ENABLE_PERFORMANCE_METRICS=true

# Health Check Configuration
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_INTERVAL=30000
HEALTH_CHECK_TIMEOUT=5000

# =============================================================================
# BACKUP & MAINTENANCE
# =============================================================================

# Automated Backup Settings
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=90
BACKUP_STORAGE_PATH=/backups/mongodb

# Maintenance Mode
MAINTENANCE_MODE=false
MAINTENANCE_MESSAGE=Website is temporarily under maintenance. Please check back in a few minutes.

# =============================================================================
# FILE UPLOAD & STORAGE
# =============================================================================

# File Upload Settings (production limits)
UPLOAD_DIR=/var/www/apostolic-church/uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,webp,pdf
MAX_FILES_PER_REQUEST=3

# Cloud Storage (optional)
CLOUD_STORAGE_ENABLED=false
# AWS_S3_BUCKET=apostolic-church-media
# AWS_ACCESS_KEY_ID=your_access_key
# AWS_SECRET_ACCESS_KEY=your_secret_key
# AWS_REGION=us-east-1

# =============================================================================
# EMAIL CONFIGURATION
# =============================================================================

# SMTP Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@apostolicchurch.org
SMTP_PASS=your_email_app_password
FROM_EMAIL=noreply@apostolicchurch.org
FROM_NAME=Apostolic Church International

# =============================================================================
# STRIPE PAYMENT CONFIGURATION
# =============================================================================

# Stripe API Keys (SECURE - Replace with production keys for live environment)
# WARNING: These are test keys - replace with production keys before going live
STRIPE_PUBLISHABLE_KEY=pk_test_51RoXpfL498oAJ59VBDtpvH9n2mvk3wVUY9Uwd5IcU6xM1T15RRdgvMWP3G5XNG1lMJfs7vEj6uqPHloJdquKRDuy00mhpMZeNj
STRIPE_SECRET_KEY=sk_test_51RoXpfL498oAJ59VHNEbpn1NYG2CpdmYhlskCtKCSE5bRp1RoB55RnaL3Dzz7NVmRSRXXZy4a1YLphdkyP1RZkuG00v5NNdCmo

# Stripe Webhook Configuration
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# =============================================================================
# PRODUCTION OPTIMIZATIONS
# =============================================================================

# Database Optimization
ENABLE_QUERY_OPTIMIZATION=true
CONNECTION_POOL_MIN=5
CONNECTION_POOL_MAX=20

# Static File Serving
SERVE_STATIC_FILES=true
STATIC_CACHE_MAX_AGE=86400

# Security Hardening
MAX_LOGIN_ATTEMPTS=3
LOCKOUT_DURATION_MINUTES=60
ENABLE_XSS_PROTECTION=true
ENABLE_CONTENT_TYPE_NOSNIFF=true
ENABLE_FRAME_OPTIONS=true

# =============================================================================
# DEVELOPMENT SETTINGS (DISABLED IN PRODUCTION)
# =============================================================================

# Development Tools (MUST BE FALSE IN PRODUCTION)
DEBUG_MODE=false
ENABLE_API_DOCS=false
ENABLE_GRAPHQL_PLAYGROUND=false
WATCH_FILES=false
RELOAD_ON_CHANGE=false
`;

  const envPath = path.join(__dirname, '..', '.env-production');
  fs.writeFileSync(envPath, productionEnv, { mode: 0o600 });
  
  console.log(`✅ Production .env file created: ${envPath}`);
  console.log('🔒 File permissions set to 600 (owner read/write only)');
  
  return envPath;
}

if (require.main === module) {
  const secrets = generateProductionSecrets();
  createProductionEnv(secrets);
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Review the generated .env-production file');
  console.log('2. Update domain names and SSL certificate paths');
  console.log('3. Configure MongoDB Atlas connection string');
  console.log('4. Set up SSL certificates');
  console.log('5. Test production configuration');
  console.log('\n⚠️  SECURITY: Delete production-secrets.json after deployment!');
}

module.exports = { generateProductionSecrets, createProductionEnv };
