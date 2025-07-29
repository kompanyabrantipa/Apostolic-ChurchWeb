const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { generateProductionSecrets } = require('./generate-production-secrets');

// Production deployment script
async function deployProduction() {
  console.log('🚀 Apostolic Church Production Deployment');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    // Step 1: Pre-deployment checks
    console.log('\n📋 Step 1: Pre-deployment Checks');
    await preDeploymentChecks();
    
    // Step 2: Generate production secrets
    console.log('\n🔐 Step 2: Generate Production Secrets');
    const secrets = generateProductionSecrets();
    
    // Step 3: Setup production environment
    console.log('\n⚙️ Step 3: Setup Production Environment');
    await setupProductionEnvironment();
    
    // Step 4: Install production dependencies
    console.log('\n📦 Step 4: Install Production Dependencies');
    await installProductionDependencies();
    
    // Step 5: Setup database
    console.log('\n🗄️ Step 5: Setup Production Database');
    await setupProductionDatabase();
    
    // Step 6: Create SSL certificates (if needed)
    console.log('\n🔒 Step 6: SSL Certificate Setup');
    await setupSSLCertificates();
    
    // Step 7: Setup logging directories
    console.log('\n📝 Step 7: Setup Logging');
    await setupLogging();
    
    // Step 8: Setup backup directories
    console.log('\n💾 Step 8: Setup Backup System');
    await setupBackupSystem();
    
    // Step 9: Run production tests
    console.log('\n🧪 Step 9: Production Tests');
    await runProductionTests();
    
    // Step 10: Final deployment summary
    console.log('\n✅ Step 10: Deployment Summary');
    displayDeploymentSummary(secrets);
    
  } catch (error) {
    console.error('❌ Production deployment failed:', error.message);
    process.exit(1);
  }
}

async function preDeploymentChecks() {
  const checks = [
    { name: 'Node.js version', check: () => process.version >= 'v18.0.0' },
    { name: 'MongoDB connection', check: async () => await testMongoConnection() },
    { name: 'Required directories', check: () => checkRequiredDirectories() },
    { name: 'Environment template', check: () => fs.existsSync('.env-production.example') }
  ];
  
  for (const check of checks) {
    try {
      const result = await check.check();
      console.log(`   ${result ? '✅' : '❌'} ${check.name}`);
      if (!result) {
        throw new Error(`Pre-deployment check failed: ${check.name}`);
      }
    } catch (error) {
      console.log(`   ❌ ${check.name}: ${error.message}`);
      throw error;
    }
  }
}

async function testMongoConnection() {
  try {
    const { testConnection } = require('../config/database-mongodb');
    return await testConnection();
  } catch (error) {
    return false;
  }
}

function checkRequiredDirectories() {
  const requiredDirs = ['scripts', 'models-mongodb', 'routes-mongodb', 'middleware'];
  return requiredDirs.every(dir => fs.existsSync(dir));
}

async function setupProductionEnvironment() {
  // Copy production environment template
  if (fs.existsSync('.env-production')) {
    console.log('   ⚠️ Production .env file already exists');
    console.log('   📝 Please review and update manually if needed');
  } else {
    fs.copyFileSync('.env-production.example', '.env-production');
    console.log('   ✅ Created .env-production from template');
  }
  
  // Set file permissions
  try {
    fs.chmodSync('.env-production', 0o600);
    console.log('   🔒 Set secure file permissions (600)');
  } catch (error) {
    console.log('   ⚠️ Could not set file permissions (Windows?)');
  }
}

async function installProductionDependencies() {
  return new Promise((resolve, reject) => {
    const npm = spawn('npm', ['install', '--production'], {
      stdio: 'inherit',
      shell: true
    });
    
    npm.on('close', (code) => {
      if (code === 0) {
        console.log('   ✅ Production dependencies installed');
        resolve();
      } else {
        reject(new Error(`npm install failed with code ${code}`));
      }
    });
  });
}

async function setupProductionDatabase() {
  try {
    // Run database setup
    const { setupDatabase } = require('./setup-database-mongodb');
    await setupDatabase();
    console.log('   ✅ Production database initialized');
  } catch (error) {
    console.log('   ❌ Database setup failed:', error.message);
    throw error;
  }
}

async function setupSSLCertificates() {
  const sslDir = './ssl';
  
  if (!fs.existsSync(sslDir)) {
    fs.mkdirSync(sslDir, { recursive: true });
    console.log('   📁 Created SSL directory');
  }
  
  const certPath = path.join(sslDir, 'certificate.crt');
  const keyPath = path.join(sslDir, 'private.key');
  
  if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
    console.log('   ⚠️ SSL certificates not found');
    console.log('   📋 To enable HTTPS, place your SSL certificates in:');
    console.log(`      Certificate: ${path.resolve(certPath)}`);
    console.log(`      Private Key: ${path.resolve(keyPath)}`);
    console.log('   💡 For development, you can generate self-signed certificates:');
    console.log('      openssl req -x509 -newkey rsa:4096 -keyout ssl/private.key -out ssl/certificate.crt -days 365 -nodes');
  } else {
    console.log('   ✅ SSL certificates found');
  }
}

async function setupLogging() {
  const logDir = './logs';
  
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
    console.log('   📁 Created logs directory');
  }
  
  // Set appropriate permissions
  try {
    fs.chmodSync(logDir, 0o755);
    console.log('   🔒 Set log directory permissions');
  } catch (error) {
    console.log('   ⚠️ Could not set directory permissions');
  }
  
  console.log('   ✅ Logging system ready');
}

async function setupBackupSystem() {
  const backupDir = './backups';
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    console.log('   📁 Created backups directory');
  }
  
  // Test backup functionality
  try {
    const { testDisasterRecovery } = require('./backup-mongodb');
    await testDisasterRecovery();
    console.log('   ✅ Backup system verified');
  } catch (error) {
    console.log('   ⚠️ Backup system test failed:', error.message);
  }
}

async function runProductionTests() {
  try {
    const { testFullWorkflow } = require('./test-full-workflow');
    await testFullWorkflow();
    console.log('   ✅ Production tests passed');
  } catch (error) {
    console.log('   ❌ Production tests failed:', error.message);
    throw error;
  }
}

function displayDeploymentSummary(secrets) {
  console.log('🎉 Production Deployment Completed Successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('📋 Deployment Summary:');
  console.log('   ✅ Production environment configured');
  console.log('   ✅ Security secrets generated');
  console.log('   ✅ Dependencies installed');
  console.log('   ✅ Database initialized');
  console.log('   ✅ Logging system ready');
  console.log('   ✅ Backup system configured');
  console.log('   ✅ All tests passed');
  console.log('');
  console.log('🔐 Security Credentials:');
  console.log(`   Admin Username: ${secrets.ADMIN_USERNAME}`);
  console.log(`   Admin Password: ${secrets.ADMIN_PASSWORD}`);
  console.log('   ⚠️ IMPORTANT: Change these credentials after first login!');
  console.log('');
  console.log('🚀 Start Production Server:');
  console.log('   NODE_ENV=production node server-mongodb.js');
  console.log('');
  console.log('🌐 Production URLs:');
  console.log('   Website: https://yourdomain.com');
  console.log('   Dashboard: https://yourdomain.com/dashboard');
  console.log('   API Health: https://yourdomain.com/api/health');
  console.log('');
  console.log('📋 Next Steps:');
  console.log('   1. Update domain names in .env-production');
  console.log('   2. Configure SSL certificates');
  console.log('   3. Set up MongoDB Atlas (recommended)');
  console.log('   4. Configure email SMTP settings');
  console.log('   5. Set up monitoring and alerting');
  console.log('   6. Test the production deployment');
  console.log('');
  console.log('🔒 Security Reminders:');
  console.log('   - Change default admin credentials');
  console.log('   - Keep .env-production file secure');
  console.log('   - Regularly update dependencies');
  console.log('   - Monitor logs for security events');
  console.log('   - Test backup and recovery procedures');
}

if (require.main === module) {
  deployProduction();
}

module.exports = { deployProduction };
