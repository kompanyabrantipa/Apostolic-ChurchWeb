#!/usr/bin/env node

/**
 * Migration Script: localStorage to Server
 * 
 * This script migrates content from browser localStorage to the live server API.
 * It should be run manually by an administrator who is logged into the admin panel.
 * 
 * Usage:
 *   node scripts/migrate-localstorage-to-server.js [--dry-run] [--verbose]
 * 
 * Options:
 *   --dry-run   Show what would be migrated without actually sending to server
 *   --verbose   Show detailed output
 * 
 * Requirements:
 *   - Must be run in a browser environment with access to localStorage
 *   - User must be authenticated to the admin panel
 *   - Server API must be accessible
 */

(function() {
  'use strict';

  // Parse command line arguments
  const args = typeof process !== 'undefined' ? process.argv.slice(2) : [];
  const isDryRun = args.includes('--dry-run') || args.includes('-d');
  const isVerbose = args.includes('--verbose') || args.includes('-v');

  // Configuration
  const CONFIG = {
    apiUrl: 'https://api.apostolicchurchlouisville.org/api',
    contentTypes: ['blogs', 'events', 'sermons'],
    batchSize: 5, // Process items in batches to avoid overwhelming the server
    delayBetweenBatches: 1000 // ms
  };

  // Utility functions
  const log = {
    info: (...args) => console.log('[INFO]', ...args),
    warn: (...args) => console.warn('[WARN]', ...args),
    error: (...args) => console.error('[ERROR]', ...args),
    debug: (...args) => isVerbose && console.log('[DEBUG]', ...args)
  };

  /**
   * Check if user is authenticated
   */
  async function isAuthenticated() {
    try {
      const response = await fetch(`${CONFIG.apiUrl}/auth/verify`, {
        method: 'GET',
        credentials: 'include'
      });
      
      return response.ok;
    } catch (error) {
      log.error('Authentication check failed:', error.message);
      return false;
    }
  }

  /**
   * Get existing content from server
   */
  async function getServerContent(type) {
    try {
      const response = await fetch(`${CONFIG.apiUrl}/${type}`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${type}: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data || data || [];
    } catch (error) {
      log.error(`Error fetching server ${type}:`, error.message);
      return [];
    }
  }

  /**
   * Create content on server
   */
  async function createContentOnServer(type, content) {
    if (isDryRun) {
      log.info(`[DRY RUN] Would create ${type}:`, content.title || content.id);
      return { success: true, data: { id: content.id || Date.now().toString() } };
    }

    try {
      const response = await fetch(`${CONFIG.apiUrl}/${type}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(content)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to create ${type}: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      log.error(`Error creating ${type} on server:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if content already exists on server (by ID or title)
   */
  async function contentExistsOnServer(serverContent, localContent) {
    return serverContent.some(item => 
      item.id === localContent.id || 
      item.title === localContent.title
    );
  }

  /**
   * Process a batch of content items
   */
  async function processBatch(type, batch, serverContent) {
    const results = [];
    
    for (const item of batch) {
      try {
        // Check if content already exists
        if (await contentExistsOnServer(serverContent, item)) {
          log.debug(`${type} already exists on server:`, item.title || item.id);
          results.push({ item, status: 'skipped', reason: 'already_exists' });
          continue;
        }

        // Create content on server
        const result = await createContentOnServer(type, item);
        
        if (result.success) {
          log.info(`Successfully migrated ${type}:`, item.title || item.id);
          results.push({ item, status: 'migrated', result: result.data });
        } else {
          log.error(`Failed to migrate ${type}:`, item.title || item.id, result.error);
          results.push({ item, status: 'failed', error: result.error });
        }
      } catch (error) {
        log.error(`Error processing ${type}:`, item.title || item.id, error.message);
        results.push({ item, status: 'failed', error: error.message });
      }
    }
    
    return results;
  }

  /**
   * Delay function for batching
   */
  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Main migration function
   */
  async function migrateContentType(type) {
    log.info(`Starting migration for ${type}...`);

    // Get localStorage content
    let localStorageContent = [];
    try {
      localStorageContent = JSON.parse(localStorage.getItem(type) || '[]');
      log.info(`Found ${localStorageContent.length} ${type} in localStorage`);
    } catch (error) {
      log.error(`Error reading localStorage ${type}:`, error.message);
      return { type, status: 'failed', error: error.message };
    }

    if (localStorageContent.length === 0) {
      log.info(`No ${type} found in localStorage`);
      return { type, status: 'completed', migrated: 0, skipped: 0, failed: 0 };
    }

    // Get server content for duplicate checking
    log.info(`Fetching existing ${type} from server...`);
    const serverContent = await getServerContent(type);
    log.info(`Found ${serverContent.length} ${type} on server`);

    // Process items in batches
    const batches = [];
    for (let i = 0; i < localStorageContent.length; i += CONFIG.batchSize) {
      batches.push(localStorageContent.slice(i, i + CONFIG.batchSize));
    }

    log.info(`Processing ${batches.length} batches of ${type}...`);
    
    let totalMigrated = 0;
    let totalSkipped = 0;
    let totalFailed = 0;
    const allResults = [];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      log.info(`Processing batch ${i + 1}/${batches.length} (${batch.length} items)...`);
      
      const batchResults = await processBatch(type, batch, serverContent);
      allResults.push(...batchResults);
      
      const migrated = batchResults.filter(r => r.status === 'migrated').length;
      const skipped = batchResults.filter(r => r.status === 'skipped').length;
      const failed = batchResults.filter(r => r.status === 'failed').length;
      
      totalMigrated += migrated;
      totalSkipped += skipped;
      totalFailed += failed;
      
      log.info(`Batch ${i + 1} complete: ${migrated} migrated, ${skipped} skipped, ${failed} failed`);
      
      // Delay between batches (except for the last one)
      if (i < batches.length - 1 && !isDryRun) {
        log.debug(`Waiting ${CONFIG.delayBetweenBatches}ms before next batch...`);
        await delay(CONFIG.delayBetweenBatches);
      }
    }

    log.info(`Migration complete for ${type}: ${totalMigrated} migrated, ${totalSkipped} skipped, ${totalFailed} failed`);
    
    return {
      type,
      status: 'completed',
      migrated: totalMigrated,
      skipped: totalSkipped,
      failed: totalFailed,
      results: allResults
    };
  }

  /**
   * Main function
   */
  async function main() {
    log.info('Starting localStorage to Server Migration Tool');
    log.info('Mode:', isDryRun ? 'DRY RUN' : 'LIVE MIGRATION');
    
    // Check authentication
    if (!isDryRun) {
      log.info('Checking authentication...');
      if (!(await isAuthenticated())) {
        log.error('User is not authenticated. Please log in to the admin panel first.');
        return;
      }
      log.info('User is authenticated');
    }

    // Migrate each content type
    const results = [];
    for (const type of CONFIG.contentTypes) {
      try {
        const result = await migrateContentType(type);
        results.push(result);
      } catch (error) {
        log.error(`Failed to migrate ${type}:`, error.message);
        results.push({ type, status: 'failed', error: error.message });
      }
    }

    // Summary
    log.info('\n=== MIGRATION SUMMARY ===');
    for (const result of results) {
      if (result.status === 'completed') {
        log.info(`${result.type}: ${result.migrated} migrated, ${result.skipped} skipped, ${result.failed} failed`);
      } else {
        log.error(`${result.type}: Failed - ${result.error}`);
      }
    }
    
    log.info('Migration tool finished');
  }

  // Run the migration if this script is executed directly
  if (typeof window !== 'undefined' || (typeof module !== 'undefined' && !module.parent)) {
    main().catch(error => {
      log.error('Migration failed with unhandled error:', error);
    });
  }

  // Export for testing or programmatic use
  if (typeof module !== 'undefined') {
    module.exports = { migrateContentType, main };
  }
})();