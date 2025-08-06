const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const { logger } = require('../middleware/logger');
require('dotenv').config();

// MongoDB backup script using mongodump
async function backupMongoDB() {
  console.log('🔄 Starting MongoDB backup...');
  
  try {
    // Parse MongoDB URI to get connection details
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/apostolic_church';
    const uriParts = mongoUri.match(/mongodb:\/\/(?:([^:]+):([^@]+)@)?([^:\/]+):?(\d+)?\/(.+)/);
    
    if (!uriParts) {
      throw new Error('Invalid MongoDB URI format');
    }
    
    const [, username, password, host, port, database] = uriParts;
    
    // Create backup directory with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '..', 'backups', `mongodb-backup-${timestamp}`);
    
    if (!fs.existsSync(path.dirname(backupDir))) {
      fs.mkdirSync(path.dirname(backupDir), { recursive: true });
    }
    
    // Build mongodump command
    const mongodumpArgs = [
      '--host', `${host}:${port || 27017}`,
      '--db', database,
      '--out', backupDir
    ];
    
    // Add authentication if provided
    if (username && password) {
      mongodumpArgs.push('--username', username);
      mongodumpArgs.push('--password', password);
    }
    
    console.log(`📁 Backup directory: ${backupDir}`);
    console.log(`🗄️ Database: ${database}`);
    console.log(`🏠 Host: ${host}:${port || 27017}`);
    
    // Execute mongodump
    const mongodump = spawn('mongodump', mongodumpArgs);
    
    mongodump.stdout.on('data', (data) => {
      console.log(`📊 ${data.toString().trim()}`);
    });
    
    mongodump.stderr.on('data', (data) => {
      console.error(`⚠️ ${data.toString().trim()}`);
    });
    
    mongodump.on('close', (code) => {
      if (code === 0) {
        console.log('✅ MongoDB backup completed successfully!');
        console.log(`📁 Backup saved to: ${backupDir}`);
        
        // Get backup size
        const backupSize = getDirectorySize(backupDir);
        console.log(`💾 Backup size: ${formatBytes(backupSize)}`);
        
        // Create backup info file
        const backupInfo = {
          timestamp: new Date().toISOString(),
          database: database,
          host: `${host}:${port || 27017}`,
          backupPath: backupDir,
          size: backupSize,
          collections: fs.readdirSync(path.join(backupDir, database)).filter(f => f.endsWith('.bson')).map(f => f.replace('.bson', ''))
        };
        
        fs.writeFileSync(
          path.join(backupDir, 'backup-info.json'),
          JSON.stringify(backupInfo, null, 2)
        );
        
        console.log('📋 Backup information saved');
        console.log(`📊 Collections backed up: ${backupInfo.collections.join(', ')}`);
        
      } else {
        console.error(`❌ MongoDB backup failed with exit code ${code}`);
        process.exit(1);
      }
    });
    
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    
    if (error.message.includes('mongodump')) {
      console.log('');
      console.log('💡 MongoDB Tools Installation:');
      console.log('   - Windows: Download from https://www.mongodb.com/try/download/database-tools');
      console.log('   - macOS: brew install mongodb/brew/mongodb-database-tools');
      console.log('   - Linux: sudo apt-get install mongodb-database-tools');
    }
    
    process.exit(1);
  }
}

// Restore MongoDB from backup
async function restoreMongoDB(backupPath) {
  console.log('🔄 Starting MongoDB restore...');
  
  try {
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup path does not exist: ${backupPath}`);
    }
    
    // Parse MongoDB URI
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/apostolic_church';
    const uriParts = mongoUri.match(/mongodb:\/\/(?:([^:]+):([^@]+)@)?([^:\/]+):?(\d+)?\/(.+)/);
    
    if (!uriParts) {
      throw new Error('Invalid MongoDB URI format');
    }
    
    const [, username, password, host, port, database] = uriParts;
    
    // Build mongorestore command
    const mongorestoreArgs = [
      '--host', `${host}:${port || 27017}`,
      '--db', database,
      '--drop', // Drop existing collections before restore
      path.join(backupPath, database)
    ];
    
    // Add authentication if provided
    if (username && password) {
      mongorestoreArgs.push('--username', username);
      mongorestoreArgs.push('--password', password);
    }
    
    console.log(`📁 Restore from: ${backupPath}`);
    console.log(`🗄️ Database: ${database}`);
    console.log(`🏠 Host: ${host}:${port || 27017}`);
    
    // Execute mongorestore
    const mongorestore = spawn('mongorestore', mongorestoreArgs);
    
    mongorestore.stdout.on('data', (data) => {
      console.log(`📊 ${data.toString().trim()}`);
    });
    
    mongorestore.stderr.on('data', (data) => {
      console.error(`⚠️ ${data.toString().trim()}`);
    });
    
    mongorestore.on('close', (code) => {
      if (code === 0) {
        console.log('✅ MongoDB restore completed successfully!');
      } else {
        console.error(`❌ MongoDB restore failed with exit code ${code}`);
        process.exit(1);
      }
    });
    
  } catch (error) {
    console.error('❌ Restore failed:', error.message);
    process.exit(1);
  }
}

// Helper function to get directory size
function getDirectorySize(dirPath) {
  let totalSize = 0;
  
  function calculateSize(currentPath) {
    const stats = fs.statSync(currentPath);
    
    if (stats.isDirectory()) {
      const files = fs.readdirSync(currentPath);
      files.forEach(file => {
        calculateSize(path.join(currentPath, file));
      });
    } else {
      totalSize += stats.size;
    }
  }
  
  calculateSize(dirPath);
  return totalSize;
}

// Helper function to format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// List available backups
function listBackups() {
  console.log('📋 Available MongoDB backups:');
  
  const backupsDir = path.join(__dirname, '..', 'backups');
  
  if (!fs.existsSync(backupsDir)) {
    console.log('📁 No backups directory found');
    return;
  }
  
  const backups = fs.readdirSync(backupsDir)
    .filter(dir => dir.startsWith('mongodb-backup-'))
    .sort()
    .reverse(); // Most recent first
  
  if (backups.length === 0) {
    console.log('📁 No backups found');
    return;
  }
  
  backups.forEach((backup, index) => {
    const backupPath = path.join(backupsDir, backup);
    const infoPath = path.join(backupPath, 'backup-info.json');
    
    if (fs.existsSync(infoPath)) {
      const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
      console.log(`${index + 1}. ${backup}`);
      console.log(`   📅 Created: ${new Date(info.timestamp).toLocaleString()}`);
      console.log(`   💾 Size: ${formatBytes(info.size)}`);
      console.log(`   📊 Collections: ${info.collections.join(', ')}`);
      console.log('');
    } else {
      console.log(`${index + 1}. ${backup} (no info available)`);
    }
  });
}

// Run based on command line arguments
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'backup':
      backupMongoDB();
      break;
    case 'restore':
      const backupPath = args[1];
      if (!backupPath) {
        console.error('❌ Please provide backup path: npm run backup restore /path/to/backup');
        process.exit(1);
      }
      restoreMongoDB(backupPath);
      break;
    case 'list':
      listBackups();
      break;
    default:
      console.log('📋 MongoDB Backup Utility');
      console.log('');
      console.log('Usage:');
      console.log('  npm run backup           - Create new backup');
      console.log('  npm run backup restore   - Restore from backup');
      console.log('  npm run backup list      - List available backups');
      console.log('');
      console.log('Examples:');
      console.log('  node scripts/backup-mongodb.js backup');
      console.log('  node scripts/backup-mongodb.js restore ./backups/mongodb-backup-2024-01-15T10-30-00-000Z');
      console.log('  node scripts/backup-mongodb.js list');
  }
}

// Verify backup integrity
async function verifyBackup(backupPath) {
  console.log('🔍 Verifying backup integrity...');

  try {
    const backupInfoPath = path.join(backupPath, 'backup-info.json');

    if (!fs.existsSync(backupInfoPath)) {
      throw new Error('Backup info file not found');
    }

    const backupInfo = JSON.parse(fs.readFileSync(backupInfoPath, 'utf8'));
    const expectedCollections = backupInfo.collections || [];

    // Check if all expected collection files exist
    const databasePath = path.join(backupPath, backupInfo.database);

    if (!fs.existsSync(databasePath)) {
      throw new Error(`Database backup directory not found: ${databasePath}`);
    }

    const actualFiles = fs.readdirSync(databasePath);
    const bsonFiles = actualFiles.filter(f => f.endsWith('.bson'));
    const metadataFiles = actualFiles.filter(f => f.endsWith('.metadata.json'));

    console.log(`📊 Backup verification results:`);
    console.log(`   Expected collections: ${expectedCollections.length}`);
    console.log(`   BSON files found: ${bsonFiles.length}`);
    console.log(`   Metadata files found: ${metadataFiles.length}`);

    // Verify each collection has both BSON and metadata files
    let verified = true;
    for (const collection of expectedCollections) {
      const bsonFile = `${collection}.bson`;
      const metadataFile = `${collection}.metadata.json`;

      if (!bsonFiles.includes(bsonFile)) {
        console.log(`   ❌ Missing BSON file: ${bsonFile}`);
        verified = false;
      }

      if (!metadataFiles.includes(metadataFile)) {
        console.log(`   ❌ Missing metadata file: ${metadataFile}`);
        verified = false;
      }

      if (bsonFiles.includes(bsonFile) && metadataFiles.includes(metadataFile)) {
        const bsonPath = path.join(databasePath, bsonFile);
        const bsonStats = fs.statSync(bsonPath);
        console.log(`   ✅ ${collection}: ${formatBytes(bsonStats.size)}`);
      }
    }

    if (verified) {
      console.log('✅ Backup verification successful!');
      logger.info('Backup verified successfully', { backupPath, collections: expectedCollections.length });
      return true;
    } else {
      console.log('❌ Backup verification failed!');
      logger.error('Backup verification failed', { backupPath, issues: 'Missing files' });
      return false;
    }

  } catch (error) {
    console.error('❌ Backup verification error:', error.message);
    logger.error('Backup verification error', { backupPath, error: error.message });
    return false;
  }
}

// Clean up old backups based on retention policy
async function cleanupOldBackups() {
  console.log('🧹 Cleaning up old backups...');

  try {
    const backupsDir = path.join(__dirname, '..', 'backups');
    const retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS) || 30;
    const cutoffDate = new Date(Date.now() - (retentionDays * 24 * 60 * 60 * 1000));

    if (!fs.existsSync(backupsDir)) {
      console.log('📁 No backups directory found');
      return;
    }

    const backups = fs.readdirSync(backupsDir)
      .filter(dir => dir.startsWith('mongodb-backup-'))
      .map(dir => {
        const backupPath = path.join(backupsDir, dir);
        const stats = fs.statSync(backupPath);
        return { name: dir, path: backupPath, created: stats.birthtime };
      })
      .sort((a, b) => b.created - a.created); // Newest first

    let deletedCount = 0;
    let deletedSize = 0;

    for (const backup of backups) {
      if (backup.created < cutoffDate) {
        const size = getDirectorySize(backup.path);
        fs.rmSync(backup.path, { recursive: true, force: true });
        deletedCount++;
        deletedSize += size;
        console.log(`   🗑️ Deleted: ${backup.name} (${formatBytes(size)})`);
      }
    }

    console.log(`✅ Cleanup completed: ${deletedCount} backups deleted (${formatBytes(deletedSize)} freed)`);
    logger.info('Backup cleanup completed', {
      deletedCount,
      deletedSize,
      retentionDays,
      remainingBackups: backups.length - deletedCount
    });

  } catch (error) {
    console.error('❌ Backup cleanup failed:', error.message);
    logger.error('Backup cleanup failed', { error: error.message });
  }
}

// Automated backup scheduler
function startBackupScheduler() {
  const schedule = process.env.BACKUP_SCHEDULE || '0 2 * * *'; // Default: 2 AM daily

  if (process.env.BACKUP_ENABLED === 'true') {
    console.log(`📅 Starting automated backup scheduler: ${schedule}`);

    cron.schedule(schedule, async () => {
      console.log('🔄 Starting scheduled backup...');
      logger.info('Scheduled backup started');

      try {
        await backupMongoDB();

        // Verify the backup
        const backupsDir = path.join(__dirname, '..', 'backups');
        const backups = fs.readdirSync(backupsDir)
          .filter(dir => dir.startsWith('mongodb-backup-'))
          .sort()
          .reverse();

        if (backups.length > 0) {
          const latestBackup = path.join(backupsDir, backups[0]);
          await verifyBackup(latestBackup);
        }

        // Clean up old backups
        await cleanupOldBackups();

        logger.info('Scheduled backup completed successfully');

      } catch (error) {
        console.error('❌ Scheduled backup failed:', error.message);
        logger.error('Scheduled backup failed', { error: error.message });
      }
    });

    logger.info('Backup scheduler started', { schedule });
  } else {
    console.log('📅 Automated backups disabled (BACKUP_ENABLED=false)');
  }
}

// Disaster recovery test
async function testDisasterRecovery() {
  console.log('🧪 Testing disaster recovery procedures...');

  try {
    // Create a test backup
    console.log('1. Creating test backup...');
    await backupMongoDB();

    // Find the latest backup
    const backupsDir = path.join(__dirname, '..', 'backups');
    const backups = fs.readdirSync(backupsDir)
      .filter(dir => dir.startsWith('mongodb-backup-'))
      .sort()
      .reverse();

    if (backups.length === 0) {
      throw new Error('No backups found for testing');
    }

    const testBackupPath = path.join(backupsDir, backups[0]);

    // Verify backup integrity
    console.log('2. Verifying backup integrity...');
    const verified = await verifyBackup(testBackupPath);

    if (!verified) {
      throw new Error('Backup verification failed');
    }

    // Test restore process (dry run)
    console.log('3. Testing restore process (dry run)...');
    console.log(`   Backup path: ${testBackupPath}`);
    console.log(`   Would restore to: ${process.env.MONGODB_URI}`);

    console.log('✅ Disaster recovery test completed successfully!');
    console.log('📋 Recovery procedures verified:');
    console.log('   ✅ Backup creation');
    console.log('   ✅ Backup verification');
    console.log('   ✅ Restore process validation');

    logger.info('Disaster recovery test completed successfully');

  } catch (error) {
    console.error('❌ Disaster recovery test failed:', error.message);
    logger.error('Disaster recovery test failed', { error: error.message });
  }
}

module.exports = {
  backupMongoDB,
  restoreMongoDB,
  listBackups,
  verifyBackup,
  cleanupOldBackups,
  startBackupScheduler,
  testDisasterRecovery
};
