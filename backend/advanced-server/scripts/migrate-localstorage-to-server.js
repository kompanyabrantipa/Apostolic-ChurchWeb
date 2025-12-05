#!/usr/bin/env node
/**
 * Migrate localStorage data to server API
 * 
 * This script helps migrate existing localStorage data to the live server API.
 * It reads exported localStorage data from JSON files and POSTs them to the server.
 * 
 * Usage:
 * 1. Export localStorage data from browser console:
 *    // Export blogs
 *    console.log(JSON.stringify(JSON.parse(localStorage.getItem("blogs") || "[]"), null, 2));
 *    // Export events
 *    console.log(JSON.stringify(JSON.parse(localStorage.getItem("events") || "[]"), null, 2));
 *    // Export sermons
 *    console.log(JSON.stringify(JSON.parse(localStorage.getItem("sermons") || "[]"), null, 2));
 * 
 * 2. Save the output to migration-data/blogs.json, migration-data/events.json, migration-data/sermons.json
 * 3. Run this script: node migrate-localstorage-to-server.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const API_BASE_URL = 'https://api.apostolicchurchlouisville.org';
const MIGRATION_DATA_DIR = path.join(__dirname, '..', 'migration-data');
const DRY_RUN = process.argv.includes('--dry-run');

// Simple HTTP client for API requests
function apiRequest(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      // Note: This script doesn't handle authentication
      // You may need to add authentication headers if required
    };

    const req = https.request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', chunk => responseData += chunk);
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsedData);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${parsedData.message || responseData}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${responseData}`));
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function migrateContentType(contentType, data) {
  console.log(`\n📦 Migrating ${contentType} (${data.length} items)...`);
  
  let migratedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  for (const item of data) {
    try {
      // Check if item already exists (by ID)
      try {
        const existing = await apiRequest(`/${contentType}/${item.id}`, 'GET');
        console.log(`  ⏭️  Skipping ${contentType} ${item.id} (already exists)`);
        skippedCount++;
        continue;
      } catch (e) {
        // Item doesn't exist, proceed with creation
      }
      
      if (DRY_RUN) {
        console.log(`  🔄 Would create ${contentType} ${item.id}: ${item.title || item.name || 'Untitled'}`);
      } else {
        // Create the item
        const result = await apiRequest(`/${contentType}`, 'POST', item);
        console.log(`  ✅ Created ${contentType} ${item.id}: ${item.title || item.name || 'Untitled'}`);
      }
      
      migratedCount++;
    } catch (error) {
      console.error(`  ❌ Failed to migrate ${contentType} ${item.id}: ${error.message}`);
      errorCount++;
    }
  }
  
  console.log(`  Completed ${contentType} migration: ${migratedCount} migrated, ${skippedCount} skipped, ${errorCount} errors`);
  return { migrated: migratedCount, skipped: skippedCount, errors: errorCount };
}

async function migrateAllData() {
  console.log(`🚀 Starting localStorage to server migration${DRY_RUN ? ' (DRY RUN)' : ''}...`);
  console.log(`🔗 API Base URL: ${API_BASE_URL}`);
  console.log(`📂 Migration Data Directory: ${MIGRATION_DATA_DIR}`);
  
  if (DRY_RUN) {
    console.log('📝 DRY RUN MODE: No actual data will be sent to the server\n');
  }
  
  // Check if migration data directory exists
  if (!fs.existsSync(MIGRATION_DATA_DIR)) {
    console.log('📁 Migration data directory not found');
    console.log('💡 Please export your localStorage data to JSON files in this directory:');
    console.log(`   - ${path.join(MIGRATION_DATA_DIR, 'blogs.json')}`);
    console.log(`   - ${path.join(MIGRATION_DATA_DIR, 'events.json')}`);
    console.log(`   - ${path.join(MIGRATION_DATA_DIR, 'sermons.json')}`);
    console.log('');
    console.log('📝 To export localStorage data, run this in your browser console:');
    console.log('   // Export blogs');
    console.log('   console.log(JSON.stringify(JSON.parse(localStorage.getItem("blogs") || "[]"), null, 2));');
    console.log('   // Export events');
    console.log('   console.log(JSON.stringify(JSON.parse(localStorage.getItem("events") || "[]"), null, 2));');
    console.log('   // Export sermons');
    console.log('   console.log(JSON.stringify(JSON.parse(localStorage.getItem("sermons") || "[]"), null, 2));');
    return;
  }
  
  const results = {
    blogs: { migrated: 0, skipped: 0, errors: 0 },
    events: { migrated: 0, skipped: 0, errors: 0 },
    sermons: { migrated: 0, skipped: 0, errors: 0 }
  };
  
  // Migrate each content type
  const contentTypes = ['blogs', 'events', 'sermons'];
  
  for (const contentType of contentTypes) {
    const filePath = path.join(MIGRATION_DATA_DIR, `${contentType}.json`);
    
    if (fs.existsSync(filePath)) {
      try {
        console.log(`\n📂 Reading ${contentType} data from ${filePath}...`);
        const rawData = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(rawData);
        
        if (Array.isArray(data)) {
          results[contentType] = await migrateContentType(contentType, data);
        } else {
          console.log(`  ⚠️  Invalid data format in ${filePath} (expected array)`);
        }
      } catch (error) {
        console.error(`  ❌ Failed to read/process ${filePath}: ${error.message}`);
      }
    } else {
      console.log(`\n⏭️  Skipping ${contentType} (file not found: ${filePath})`);
    }
  }
  
  // Summary
  console.log('\n📊 Migration Summary:');
  console.log('====================');
  for (const [type, stats] of Object.entries(results)) {
    console.log(`${type.toUpperCase()}: ${stats.migrated} migrated, ${stats.skipped} skipped, ${stats.errors} errors`);
  }
  
  const totalMigrated = Object.values(results).reduce((sum, stats) => sum + stats.migrated, 0);
  const totalSkipped = Object.values(results).reduce((sum, stats) => sum + stats.skipped, 0);
  const totalErrors = Object.values(results).reduce((sum, stats) => sum + stats.errors, 0);
  
  console.log(`\n📈 Total: ${totalMigrated} items migrated, ${totalSkipped} skipped, ${totalErrors} errors`);
  
  if (DRY_RUN) {
    console.log('\n💡 To actually migrate the data, run without --dry-run flag');
  } else {
    console.log('\n✅ Migration completed!');
  }
}

// Run the migration
migrateAllData().catch(error => {
  console.error('_migration failed:', error);
  process.exit(1);
});