// Data Service for managing localStorage data with quota management
const DataService = {

    /**
     * Check localStorage quota and available space
     * @returns {Object} Storage info
     */
    getStorageInfo: function() {
        try {
            const testKey = 'storage-test';
            const testData = '0'.repeat(1024); // 1KB test data
            let usedSpace = 0;
            let availableSpace = 0;

            // Calculate used space
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    usedSpace += localStorage[key].length + key.length;
                }
            }

            // Test available space by trying to store data
            try {
                let testSize = 0;
                while (testSize < 10 * 1024 * 1024) { // Test up to 10MB
                    localStorage.setItem(testKey, testData.repeat(testSize / 1024));
                    testSize += 1024;
                }
            } catch (e) {
                availableSpace = testSize;
            } finally {
                localStorage.removeItem(testKey);
            }

            return {
                used: usedSpace,
                available: availableSpace,
                total: usedSpace + availableSpace,
                usedMB: (usedSpace / 1024 / 1024).toFixed(2),
                availableMB: (availableSpace / 1024 / 1024).toFixed(2)
            };
        } catch (error) {
            console.warn('Could not determine storage info:', error);
            return { used: 0, available: 0, total: 0, usedMB: '0', availableMB: '0' };
        }
    },

    /**
     * Compress base64 image data by reducing quality/size
     * @param {string} base64Data - Base64 image data
     * @param {number} maxSizeKB - Maximum size in KB
     * @returns {Promise<string>} Compressed base64 data
     */
    compressImageData: function(base64Data, maxSizeKB = 500) {
        return new Promise((resolve) => {
            try {
                // If data is already small enough, return as-is
                if (base64Data.length < maxSizeKB * 1024 * 1.33) { // Account for base64 overhead
                    resolve(base64Data);
                    return;
                }

                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // Calculate new dimensions (max 800px width/height)
                    let { width, height } = img;
                    const maxDimension = 800;

                    if (width > maxDimension || height > maxDimension) {
                        if (width > height) {
                            height = (height * maxDimension) / width;
                            width = maxDimension;
                        } else {
                            width = (width * maxDimension) / height;
                            height = maxDimension;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;

                    // Draw and compress
                    ctx.drawImage(img, 0, 0, width, height);

                    // Try different quality levels
                    let quality = 0.8;
                    let compressedData = canvas.toDataURL('image/jpeg', quality);

                    // Reduce quality until size is acceptable
                    while (compressedData.length > maxSizeKB * 1024 * 1.33 && quality > 0.1) {
                        quality -= 0.1;
                        compressedData = canvas.toDataURL('image/jpeg', quality);
                    }

                    console.log(`Image compressed: ${(base64Data.length / 1024).toFixed(1)}KB → ${(compressedData.length / 1024).toFixed(1)}KB`);
                    resolve(compressedData);
                };

                img.onerror = function() {
                    console.warn('Could not compress image, using original');
                    resolve(base64Data);
                };

                img.src = base64Data;
            } catch (error) {
                console.warn('Image compression failed:', error);
                resolve(base64Data);
            }
        });
    },

    /**
     * Safe localStorage setItem with quota management
     * @param {string} key - Storage key
     * @param {string} value - Storage value
     * @returns {boolean} Success status
     */
    safeSetItem: function(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                console.warn('localStorage quota exceeded, attempting cleanup...');

                // Try to free up space by removing old items
                this.cleanupOldData();

                // Try again
                try {
                    localStorage.setItem(key, value);
                    console.log('Successfully saved after cleanup');
                    return true;
                } catch (retryError) {
                    console.error('Still cannot save after cleanup:', retryError);
                    throw new Error('Storage quota exceeded. Please try with a smaller file or clear browser data.');
                }
            } else {
                throw error;
            }
        }
    },

    /**
     * Clean up old data to free storage space
     */
    cleanupOldData: function() {
        try {
            const types = ['blogs', 'events', 'sermons'];
            let freedSpace = 0;

            types.forEach(type => {
                const items = this.getAll(type);
                if (items.length > 10) {
                    // Keep only the 10 most recent items
                    const sortedItems = items.sort((a, b) =>
                        new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0)
                    );
                    const keepItems = sortedItems.slice(0, 10);
                    const oldData = localStorage.getItem(type);
                    localStorage.setItem(type, JSON.stringify(keepItems));
                    const newData = localStorage.getItem(type);
                    freedSpace += (oldData?.length || 0) - (newData?.length || 0);
                    console.log(`Cleaned up ${type}: kept ${keepItems.length} of ${items.length} items`);
                }
            });

            console.log(`Freed ${(freedSpace / 1024).toFixed(1)}KB of storage space`);
        } catch (error) {
            console.warn('Cleanup failed:', error);
        }
    },
    /**
     * Generate a unique ID
     * @returns {string} Unique ID
     */
    generateId: function() {
        return Date.now().toString() + Math.random().toString(36).substr(2, 5);
    },
    
    /**
     * Get all items of a specific type
     * @param {string} type - Data type (blogs, events, sermons)
     * @returns {Array} Array of items
     */
    getAll: function(type) {
        try {
            return JSON.parse(localStorage.getItem(type) || '[]');
        } catch (error) {
            console.error(`Error getting ${type}:`, error);
            return [];
        }
    },
    
    /**
     * Get item by ID
     * @param {string} type - Data type (blogs, events, sermons)
     * @param {string} id - Item ID
     * @returns {Object|null} Item or null if not found
     */
    getById: function(type, id) {
        try {
            const items = this.getAll(type);
            return items.find(item => item.id === id) || null;
        } catch (error) {
            console.error(`Error getting ${type} by ID:`, error);
            return null;
        }
    },
    
    /**
     * Create a new item with storage quota management
     * @param {string} type - Data type (blogs, events, sermons)
     * @param {Object} data - Item data
     * @returns {Object} Created item
     */
    create: async function(type, data) {
        try {
            const items = this.getAll(type);

            // Compress image data if present
            const processedData = await this.processItemData(data);

            const newItem = {
                id: this.generateId(),
                createdAt: new Date().toISOString(),
                ...processedData
            };

            items.push(newItem);

            // Use safe storage method
            const success = this.safeSetItem(type, JSON.stringify(items));
            if (!success) {
                throw new Error('Failed to save data due to storage limitations');
            }

            // Trigger sync events
            this.triggerSync(type, 'create', newItem);

            return newItem;
        } catch (error) {
            console.error(`Error creating ${type}:`, error);
            throw error;
        }
    },
    
    /**
     * Update an existing item with storage quota management
     * @param {string} type - Data type (blogs, events, sermons)
     * @param {string} id - Item ID
     * @param {Object} data - Updated data
     * @returns {Object|null} Updated item or null if not found
     */
    update: async function(type, id, data) {
        try {
            const items = this.getAll(type);
            const index = items.findIndex(item => item.id === id);

            if (index === -1) {
                return null;
            }

            // Compress image data if present
            const processedData = await this.processItemData(data);

            const updatedItem = {
                ...items[index],
                ...processedData,
                updatedAt: new Date().toISOString()
            };

            items[index] = updatedItem;

            // Use safe storage method
            const success = this.safeSetItem(type, JSON.stringify(items));
            if (!success) {
                throw new Error('Failed to save data due to storage limitations');
            }

            // Trigger sync events
            this.triggerSync(type, 'update', updatedItem);

            return updatedItem;
        } catch (error) {
            console.error(`Error updating ${type}:`, error);
            throw error;
        }
    },
    
    /**
     * Delete an item
     * @param {string} type - Data type (blogs, events, sermons)
     * @param {string} id - Item ID
     * @returns {boolean} True if deleted, false if not found
     */
    delete: function(type, id) {
        try {
            const items = this.getAll(type);
            const index = items.findIndex(item => item.id === id);

            if (index === -1) {
                return false;
            }

            const deletedItem = items[index];
            items.splice(index, 1);
            // Use safe storage method
            const success = this.safeSetItem(type, JSON.stringify(items));
            if (!success) {
                console.warn('Failed to save after deletion, but item was removed from memory');
            }

            // Trigger sync events
            this.triggerSync(type, 'delete', deletedItem);

            return true;
        } catch (error) {
            console.error(`Error deleting ${type}:`, error);
            throw error;
        }
    },

    /**
     * Process item data to compress images and manage storage
     * @param {Object} data - Item data
     * @returns {Promise<Object>} Processed data
     */
    processItemData: async function(data) {
        const processedData = { ...data };

        // Compress image fields
        const imageFields = ['imageUrl', 'thumbnailUrl'];
        for (const field of imageFields) {
            if (processedData[field] && processedData[field].startsWith('data:image/')) {
                try {
                    processedData[field] = await this.compressImageData(processedData[field], 500);
                } catch (error) {
                    console.warn(`Failed to compress ${field}:`, error);
                }
            }
        }

        // For video/audio URLs, we don't compress but we could implement size limits
        const mediaFields = ['videoUrl', 'audioUrl'];
        for (const field of mediaFields) {
            if (processedData[field] && processedData[field].startsWith('data:')) {
                // Check if media file is too large (>2MB base64)
                if (processedData[field].length > 2 * 1024 * 1024 * 1.33) {
                    console.warn(`${field} is very large (${(processedData[field].length / 1024 / 1024).toFixed(1)}MB), this may cause storage issues`);
                    // Could implement media compression here if needed
                }
            }
        }

        return processedData;
    },

    /**
     * Trigger sync events for real-time updates
     * @param {string} type - Data type (blogs, events, sermons)
     * @param {string} action - Action performed (create, update, delete)
     * @param {Object} item - The affected item
     */
    triggerSync: function(type, action, item) {
        try {
            // Create sync data
            const syncData = {
                contentType: type,
                action: action,
                item: item,
                timestamp: Date.now()
            };

            // Store last sync info for cross-tab communication
            this.safeSetItem('lastSync', JSON.stringify(syncData));

            // Dispatch custom event for same-tab communication
            window.dispatchEvent(new CustomEvent('contentSync', {
                detail: syncData
            }));

            console.log(`Admin sync: ${action} ${type}`, item.title || item.id);
        } catch (error) {
            console.error('Error triggering sync:', error);
        }
    }
};

