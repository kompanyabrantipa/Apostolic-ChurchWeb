// Data Service for managing localStorage data
const DataService = {
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
     * Create a new item
     * @param {string} type - Data type (blogs, events, sermons)
     * @param {Object} data - Item data
     * @returns {Object} Created item
     */
    create: function(type, data) {
        try {
            const items = this.getAll(type);
            const newItem = {
                id: this.generateId(),
                createdAt: new Date().toISOString(),
                ...data
            };

            items.push(newItem);
            localStorage.setItem(type, JSON.stringify(items));

            // Trigger sync events
            this.triggerSync(type, 'create', newItem);

            return newItem;
        } catch (error) {
            console.error(`Error creating ${type}:`, error);
            throw error;
        }
    },
    
    /**
     * Update an existing item
     * @param {string} type - Data type (blogs, events, sermons)
     * @param {string} id - Item ID
     * @param {Object} data - Updated data
     * @returns {Object|null} Updated item or null if not found
     */
    update: function(type, id, data) {
        try {
            const items = this.getAll(type);
            const index = items.findIndex(item => item.id === id);

            if (index === -1) {
                return null;
            }

            const updatedItem = {
                ...items[index],
                ...data,
                updatedAt: new Date().toISOString()
            };

            items[index] = updatedItem;
            localStorage.setItem(type, JSON.stringify(items));

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
            localStorage.setItem(type, JSON.stringify(items));

            // Trigger sync events
            this.triggerSync(type, 'delete', deletedItem);

            return true;
        } catch (error) {
            console.error(`Error deleting ${type}:`, error);
            throw error;
        }
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
            localStorage.setItem('lastSync', JSON.stringify(syncData));

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

