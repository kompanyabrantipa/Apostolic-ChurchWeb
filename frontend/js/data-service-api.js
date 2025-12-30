// Enhanced Data Service with API support and localStorage fallback
const DataService = {

    // Configuration object
    config: {
        useApi: true,                    // Use API endpoints when available
        fallbackToLocalStorage: true,    // Fallback to localStorage if API fails
        enableSync: true,                // Enable cross-tab synchronization
        apiBaseUrl: window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1') 
            ? 'http://' + window.location.hostname + ':3001/api' 
            : 'https://api.apostolicchurchlouisville.org/api'
    },

    /**
     * API request handler with error handling and fallback
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Request options
     * @returns {Promise} API response
     */
    apiRequest: async function(endpoint, options = {}) {
        if (!this.config.useApi) {
            throw new Error('API mode is disabled');
        }

        try {
            // Prepare request options
            const requestOptions = {
                method: options.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                credentials: 'include', // Include cookies for authentication
                ...options
            };

            // Add authentication token if available
            const authToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
            if (authToken) {
                // Ensure Authorization header is properly set, overriding any existing value
                requestOptions.headers = {
                    ...requestOptions.headers,
                    'Authorization': 'Bearer ' + authToken
                };
            }

            // Make the API request
            const response = await fetch(this.config.apiBaseUrl + endpoint, requestOptions);

            // Check if response is ok
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'API request failed: ' + response.status + ' ' + response.statusText);
            }

            // Parse and return response
            const responseData = await response.json();
            return responseData;

        } catch (error) {
            console.error('API request error:', error.message);
            
            // If fallback is enabled, return error to allow fallback handling
            if (this.config.fallbackToLocalStorage) {
                throw new Error('API disabled and fallback to localStorage enabled');
            } else {
                throw error;
            }
        }
    },

    /**
     * Fallback localStorage request handler
     * @param {string} endpoint - API endpoint to map to localStorage
     * @param {Object} options - Request options
     * @returns {Promise} localStorage response
     */
    localStorageFallback: async function(endpoint, options = {}) {
        console.log('Using localStorage fallback for:', endpoint);

        // Extract type from endpoint (e.g., /blogs -> 'blogs')
        const type = endpoint.replace(/^\//, '').split('/')[0];

        // Handle different HTTP methods
        switch (options.method) {
            case 'GET':
                if (endpoint.includes('/:id') || endpoint.split('/').length === 3) {
                    // Get by ID
                    const id = endpoint.split('/')[2];
                    return this.getById(type, id);
                } else {
                    // Get all
                    return { data: this.getAll(type) };
                }
            case 'POST':
                // Create
                const newContent = await this.create(type, options.body);
                return { success: true, data: newContent };
            case 'PUT':
                // Update
                const id = endpoint.split('/')[2];
                const updatedContent = await this.update(type, id, options.body);
                return { success: true, data: updatedContent };
            case 'DELETE':
                // Delete
                const deleteId = endpoint.split('/')[2];
                const deleted = this.delete(type, deleteId);
                return { success: deleted };
            default:
                return { data: this.getAll(type) };
        }
    },

    /**
     * Map API endpoints to localStorage operations
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Request options
     * @returns {Promise} Response
     */
    async apiRequestWithFallback(endpoint, options = {}) {
        try {
            // Try API first
            if (this.config.useApi) {
                const response = await this.apiRequest(endpoint, options);
                return response;
            } else {
                throw new Error('API mode disabled');
            }
        } catch (error) {
            // If API fails and fallback is enabled, use localStorage
            if (this.config.fallbackToLocalStorage) {
                console.warn('API request failed, using localStorage fallback:', error.message);
                return await this.localStorageFallback(endpoint, options);
            } else {
                // If no fallback, rethrow the error
                throw error;
            }
        }
    },

    /**
     * Get all items of a specific type
     * @param {string} type - Data type (blogs, events, sermons)
     * @returns {Array} Array of items
     */
    async getAll(type) {
        if (this.config.useApi) {
            try {
                const response = await this.apiRequest('/' + type);
                return response.data || [];
            } catch (error) {
                if (this.config.fallbackToLocalStorage) {
                    console.warn('API getAll failed, using localStorage:', error.message);
                    return JSON.parse(localStorage.getItem(type) || '[]');
                } else {
                    throw new Error('API disabled and no fallback available');
                }
            }
        } else {
            // Direct localStorage access
            return JSON.parse(localStorage.getItem(type) || '[]');
        }
    },

    /**
     * Get item by ID
     * @param {string} type - Data type (blogs, events, sermons)
     * @param {string} id - Item ID
     * @returns {Object|null} Item or null if not found
     */
    async getById(type, id) {
        if (this.config.useApi) {
            try {
                const response = await this.apiRequest('/' + type + '/' + id);
                return response.data || null;
            } catch (error) {
                if (this.config.fallbackToLocalStorage) {
                    console.warn('API getById failed, using localStorage:', error.message);
                    const items = JSON.parse(localStorage.getItem(type) || '[]');
                    return items.find(item => item.id === id) || null;
                } else {
                    throw new Error('API disabled and no fallback available');
                }
            }
        } else {
            // Direct localStorage access
            const items = JSON.parse(localStorage.getItem(type) || '[]');
            return items.find(item => item.id === id) || null;
        }
    },

    /**
     * Create a new item
     * @param {string} type - Data type (blogs, events, sermons)
     * @param {Object} data - Item data
     * @returns {Object} Created item
     */
    async create(type, data) {
        if (this.config.useApi) {
            try {
                const response = await this.apiRequest('/' + type, {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
                const newItem = response.data;
                
                // Trigger sync events if enabled
                if (this.config.enableSync) {
                    this.triggerSync(type, 'create', newItem);
                }
                
                return newItem;
            } catch (error) {
                if (this.config.fallbackToLocalStorage) {
                    console.warn('API create failed, using localStorage:', error.message);
                    // Fallback to localStorage implementation
                    return this.createLocalStorage(type, data);
                } else {
                    throw new Error('API disabled and no fallback available');
                }
            }
        } else {
            // Direct localStorage access
            return this.createLocalStorage(type, data);
        }
    },

    /**
     * Create item in localStorage (fallback implementation)
     */
    async createLocalStorage(type, data) {
        const items = JSON.parse(localStorage.getItem(type) || '[]');
        const newItem = {
            id: this.generateId(),
            createdAt: new Date().toISOString(),
            ...data
        };
        items.push(newItem);
        localStorage.setItem(type, JSON.stringify(items));
        
        // Trigger sync events if enabled
        if (this.config.enableSync) {
            this.triggerSync(type, 'create', newItem);
        }
        
        return newItem;
    },

    /**
     * Update an existing item
     * @param {string} type - Data type (blogs, events, sermons)
     * @param {string} id - Item ID
     * @param {Object} data - Updated data
     * @returns {Object|null} Updated item or null if not found
     */
    async update(type, id, data) {
        if (this.config.useApi) {
            try {
                const response = await this.apiRequest('/' + type + '/' + id, {
                    method: 'PUT',
                    body: JSON.stringify(data)
                });
                const updatedItem = response.data;
                
                // Trigger sync events if enabled
                if (this.config.enableSync) {
                    this.triggerSync(type, 'update', updatedItem);
                }
                
                return updatedItem;
            } catch (error) {
                if (this.config.fallbackToLocalStorage) {
                    console.warn('API update failed, using localStorage:', error.message);
                    // Fallback to localStorage implementation
                    return this.updateLocalStorage(type, id, data);
                } else {
                    throw new Error('API disabled and no fallback available');
                }
            }
        } else {
            // Direct localStorage access
            return this.updateLocalStorage(type, id, data);
        }
    },

    /**
     * Update item in localStorage (fallback implementation)
     */
    async updateLocalStorage(type, id, data) {
        const items = JSON.parse(localStorage.getItem(type) || '[]');
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
        
        // Trigger sync events if enabled
        if (this.config.enableSync) {
            this.triggerSync(type, 'update', updatedItem);
        }
        
        return updatedItem;
    },

    /**
     * Delete an item
     * @param {string} type - Data type (blogs, events, sermons)
     * @param {string} id - Item ID
     * @returns {boolean} True if deleted, false if not found
     */
    async delete(type, id) {
        if (this.config.useApi) {
            try {
                const response = await this.apiRequest('/' + type + '/' + id, {
                    method: 'DELETE'
                });
                
                if (response.success) {
                    // Trigger sync events if enabled
                    if (this.config.enableSync) {
                        this.triggerSync(type, 'delete', { id });
                    }
                    return true;
                }
                return false;
            } catch (error) {
                if (this.config.fallbackToLocalStorage) {
                    console.warn('API delete failed, using localStorage:', error.message);
                    // Fallback to localStorage implementation
                    return this.deleteLocalStorage(type, id);
                } else {
                    throw new Error('API disabled and no fallback available');
                }
            }
        } else {
            // Direct localStorage access
            return this.deleteLocalStorage(type, id);
        }
    },

    /**
     * Delete item in localStorage (fallback implementation)
     */
    deleteLocalStorage(type, id) {
        const items = JSON.parse(localStorage.getItem(type) || '[]');
        const index = items.findIndex(item => item.id === id);

        if (index === -1) {
            return false;
        }

        const deletedItem = items[index];
        items.splice(index, 1);
        localStorage.setItem(type, JSON.stringify(items));
        
        // Trigger sync events if enabled
        if (this.config.enableSync) {
            this.triggerSync(type, 'delete', deletedItem);
        }
        
        return true;
    },

    /**
     * Get published items only
     * @param {string} type - Data type (blogs, events, sermons)
     * @returns {Array} Array of published items
     */
    async getPublished(type) {
        if (this.config.useApi) {
            try {
                const response = await this.apiRequest('/' + type + '?published=true');
                return response.data || [];
            } catch (error) {
                if (this.config.fallbackToLocalStorage) {
                    console.warn('API getPublished failed, using localStorage:', error.message);
                    const items = JSON.parse(localStorage.getItem(type) || '[]');
                    return items.filter(item => item.status === 'published');
                } else {
                    throw new Error('API disabled and no fallback available');
                }
            }
        } else {
            // Direct localStorage access
            const items = JSON.parse(localStorage.getItem(type) || '[]');
            return items.filter(item => item.status === 'published');
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
     * Trigger sync events for real-time updates
     * @param {string} type - Data type (blogs, events, sermons)
     * @param {string} action - Action performed (create, update, delete)
     * @param {Object} item - The affected item
     */
    triggerSync: function(type, action, item) {
        if (!this.config.enableSync) return;

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

            console.log('Admin sync: ' + action + ' ' + type, item.title || item.id);
        } catch (error) {
            console.error('Error triggering sync:', error);
        }
    }
};

// Make DataService globally available
window.DataService = DataService;

console.log('DataService API initialized with API support and localStorage fallback');
