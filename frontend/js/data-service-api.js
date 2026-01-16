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
    
    // One-time startup self-check
    _initialized: false,
    _performSelfCheck: function() {
        if (this._initialized) return;
        this._initialized = true;
        
        console.log('[DataService] Initializing with configuration:');
        console.log('- API Base URL:', this.config.apiBaseUrl);
        console.log('- API Enabled:', this.config.useApi);
        console.log('- Fallback Enabled:', this.config.fallbackToLocalStorage);
        console.log('- Sync Enabled:', this.config.enableSync);
        
        // Check endpoint mappings
        const mappings = {
            'blog': this.getBackendEndpoint('blog'),
            'blogs': this.getBackendEndpoint('blogs'),
            'event': this.getBackendEndpoint('event'),
            'events': this.getBackendEndpoint('events'),
            'sermon': this.getBackendEndpoint('sermon'),
            'sermons': this.getBackendEndpoint('sermons')
        };
        
        console.log('- Endpoint mappings:', mappings);
        
        // Log warning if any mapping is missing
        const hasMissingMapping = Object.values(mappings).some(value => value === null);
        if (hasMissingMapping) {
            console.warn('[DataService] Warning: Some endpoint mappings are missing');
        }
    },

    /**
     * API request handler with error handling and fallback
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Request options
     * @returns {Promise} API response
     */
    // Map frontend type names to backend endpoint names
    getBackendEndpoint: function(type) {
        if (typeof type !== 'string' || !type.trim()) {
            console.warn('Invalid type passed to getBackendEndpoint:', type);
            return null;
        }
        
        // Normalize type (trim + lowercase)
        const normalizedType = type.trim().toLowerCase();
        
        // Explicitly map all valid frontend types to backend endpoints
        const endpointMap = {
            'blog': 'blogs',
            'blogs': 'blogs',
            'event': 'events',
            'events': 'events',
            'sermon': 'sermons',
            'sermons': 'sermons'
        };
        
        const mappedEndpoint = endpointMap[normalizedType];
        
        if (!mappedEndpoint) {
            console.error('[DataService] Unknown content type mapped:', type, '->', normalizedType);
            return null;
        }
        
        return mappedEndpoint;
    },
    
    apiRequest: async function(endpoint, options = {}) {
        // Strict validation at the very top - blocks requests where endpoint is undefined, null, '', or '/'
        if (endpoint === undefined || endpoint === null || endpoint === '' || endpoint === '/') {
            console.error('[DataService] Blocked invalid API endpoint');
            throw new Error('Invalid API endpoint provided');
        }
        
        // Additional defensive guard: prevent ALL invalid API calls
        if (typeof endpoint !== 'string' || !endpoint.trim() || endpoint === '/api/' || endpoint === '/api') {
            console.error('[DataService] BLOCKED invalid API endpoint:', endpoint);
            throw new Error('Invalid API endpoint: ' + (endpoint || 'empty'));
        }
        
        // Additional check to ensure endpoint starts with /
        if (!endpoint.startsWith('/')) {
            console.error('[DataService] BLOCKED invalid API endpoint (does not start with /):', endpoint);
            throw new Error('Invalid API endpoint format: ' + endpoint);
        }
        
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
            let response = await fetch(this.config.apiBaseUrl + endpoint, requestOptions);

            // Check if response is ok
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                
                // Check if it's a 401 Unauthorized error (token expired)
                if (response.status === 401) {
                    // Try to refresh the token
                    const refreshTokenSuccess = await this.refreshToken();
                    
                    if (refreshTokenSuccess) {
                        // Retry the original request with the new token
                        const newAuthToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
                        if (newAuthToken) {
                            requestOptions.headers = {
                                ...requestOptions.headers,
                                'Authorization': 'Bearer ' + newAuthToken
                            };
                        }
                        
                        // Make the request again with the new token
                        response = await fetch(this.config.apiBaseUrl + endpoint, requestOptions);
                        
                        if (!response.ok) {
                            const retryErrorData = await response.json().catch(() => ({}));
                            throw new Error(retryErrorData.message || 'API request failed after token refresh: ' + response.status + ' ' + response.statusText);
                        }
                    } else {
                        // Token refresh failed, redirect to login
                        this.logoutAndRedirect();
                        throw new Error('Token refresh failed, user redirected to login');
                    }
                } else {
                    // If not a 401 error, throw the original error
                    throw new Error(errorData.message || 'API request failed: ' + response.status + ' ' + response.statusText);
                }
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
        // Strict validation guard: ensure type is a non-empty string
        if (typeof type !== 'string' || !type.trim()) {
            console.warn('DataService.getAll called with invalid type:', type, '– skipping API call');
            return [];
        }
        
        const backendEndpoint = this.getBackendEndpoint(type);
        
        // Check if the resolved endpoint is falsy, undefined, or an empty string
        if (!backendEndpoint || backendEndpoint === '' || backendEndpoint === '/' || backendEndpoint === 'api/' || backendEndpoint === '/api/') {
            console.error('[DataService] Invalid or missing endpoint for getAll(), skipping API request');
            // Use fallback only if enabled
            if (this.config.fallbackToLocalStorage) {
                // Check if we're in production by checking for localhost
                const isProduction = !(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:');
                if (isProduction) {
                    // In production, throw error instead of falling back
                    throw new Error('API failed and fallback disabled in production');
                } else {
                    // In development, allow fallback with warning
                    console.warn('API getAll failed for type "' + type + '", using localStorage fallback');
                    return JSON.parse(localStorage.getItem(type) || '[]');
                }
            } else {
                throw new Error('API disabled and no fallback available');
            }
        }
        
        if (this.config.useApi) {
            try {
                const backendEndpoint = this.getBackendEndpoint(type);
                if (!backendEndpoint) {
                    console.error('[DataService] BLOCKED API call due to invalid backend endpoint for type:', type);
                    throw new Error('Invalid backend endpoint for type: ' + type);
                }
                const endpoint = '/' + backendEndpoint;
                const response = await this.apiRequest(endpoint);
                return response.data || [];
            } catch (error) {
                // Only use localStorage fallback for actual API failures, not for invalid endpoints
                if (error.message.includes('Invalid API endpoint') || error.message.includes('Invalid backend endpoint')) {
                    throw error; // Don't use fallback for invalid endpoints
                }
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
        const backendEndpoint = this.getBackendEndpoint(type);
        if (!backendEndpoint) {
            console.log('[DataService] Invalid backend endpoint for type', type);
            // Use fallback only if enabled
            if (this.config.fallbackToLocalStorage) {
                // Check if we're in production by checking for localhost
                const isProduction = !(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:');
                if (isProduction) {
                    // In production, throw error instead of falling back
                    throw new Error('API failed and fallback disabled in production');
                } else {
                    // In development, allow fallback with warning
                    console.warn('API getById failed for type "' + type + '", using localStorage fallback');
                    const items = JSON.parse(localStorage.getItem(type) || '[]');
                    return items.find(item => item.id === id) || null;
                }
            } else {
                throw new Error('API disabled and no fallback available');
            }
        }
        
        if (this.config.useApi) {
            try {
                const backendEndpoint = this.getBackendEndpoint(type);
                if (!backendEndpoint) {
                    console.error('[DataService] BLOCKED API call due to invalid backend endpoint for type:', type);
                    throw new Error('Invalid backend endpoint for type: ' + type);
                }
                const endpoint = '/' + backendEndpoint + '/' + id;
                const response = await this.apiRequest(endpoint);
                return response.data || null;
            } catch (error) {
                // Only use localStorage fallback for actual API failures, not for invalid endpoints
                if (error.message.includes('Invalid API endpoint') || error.message.includes('Invalid backend endpoint')) {
                    throw error; // Don't use fallback for invalid endpoints
                }
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
        const backendEndpoint = this.getBackendEndpoint(type);
        if (!backendEndpoint) {
            console.log('[DataService] Invalid backend endpoint for type', type);
            // Use fallback only if enabled
            if (this.config.fallbackToLocalStorage) {
                // Check if we're in production by checking for localhost
                const isProduction = !(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:');
                if (isProduction) {
                    // In production, throw error instead of falling back
                    throw new Error('API failed and fallback disabled in production');
                } else {
                    // In development, allow fallback with warning
                    console.warn('API create failed for type "' + type + '", using localStorage fallback');
                    return this.createLocalStorage(type, data);
                }
            } else {
                throw new Error('API disabled and no fallback available');
            }
        }
        
        if (this.config.useApi) {
            try {
                const backendEndpoint = this.getBackendEndpoint(type);
                if (!backendEndpoint) {
                    console.error('[DataService] BLOCKED API call due to invalid backend endpoint for type:', type);
                    throw new Error('Invalid backend endpoint for type: ' + type);
                }
                const endpoint = '/' + backendEndpoint;
                const response = await this.apiRequest(endpoint, {
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
                // Only use localStorage fallback for actual API failures, not for invalid endpoints
                if (error.message.includes('Invalid API endpoint') || error.message.includes('Invalid backend endpoint')) {
                    throw error; // Don't use fallback for invalid endpoints
                }
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
        const backendEndpoint = this.getBackendEndpoint(type);
        if (!backendEndpoint) {
            console.log('[DataService] Invalid backend endpoint for type', type);
            // Use fallback only if enabled
            if (this.config.fallbackToLocalStorage) {
                // Check if we're in production by checking for localhost
                const isProduction = !(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:');
                if (isProduction) {
                    // In production, throw error instead of falling back
                    throw new Error('API failed and fallback disabled in production');
                } else {
                    // In development, allow fallback with warning
                    console.warn('API update failed for type "' + type + '", using localStorage fallback');
                    return this.updateLocalStorage(type, id, data);
                }
            } else {
                throw new Error('API disabled and no fallback available');
            }
        }
        
        if (this.config.useApi) {
            try {
                const backendEndpoint = this.getBackendEndpoint(type);
                if (!backendEndpoint) {
                    console.error('[DataService] BLOCKED API call due to invalid backend endpoint for type:', type);
                    throw new Error('Invalid backend endpoint for type: ' + type);
                }
                const endpoint = '/' + backendEndpoint + '/' + id;
                const response = await this.apiRequest(endpoint, {
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
                // Only use localStorage fallback for actual API failures, not for invalid endpoints
                if (error.message.includes('Invalid API endpoint') || error.message.includes('Invalid backend endpoint')) {
                    throw error; // Don't use fallback for invalid endpoints
                }
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
        const backendEndpoint = this.getBackendEndpoint(type);
        if (!backendEndpoint) {
            console.log('[DataService] Invalid backend endpoint for type', type);
            // Use fallback only if enabled
            if (this.config.fallbackToLocalStorage) {
                // Check if we're in production by checking for localhost
                const isProduction = !(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:');
                if (isProduction) {
                    // In production, throw error instead of falling back
                    throw new Error('API failed and fallback disabled in production');
                } else {
                    // In development, allow fallback with warning
                    console.warn('API delete failed for type "' + type + '", using localStorage fallback');
                    return this.deleteLocalStorage(type, id);
                }
            } else {
                throw new Error('API disabled and no fallback available');
            }
        }
        
        if (this.config.useApi) {
            try {
                const backendEndpoint = this.getBackendEndpoint(type);
                if (!backendEndpoint) {
                    console.error('[DataService] BLOCKED API call due to invalid backend endpoint for type:', type);
                    throw new Error('Invalid backend endpoint for type: ' + type);
                }
                const endpoint = '/' + backendEndpoint + '/' + id;
                const response = await this.apiRequest(endpoint, {
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
                // Only use localStorage fallback for actual API failures, not for invalid endpoints
                if (error.message.includes('Invalid API endpoint') || error.message.includes('Invalid backend endpoint')) {
                    throw error; // Don't use fallback for invalid endpoints
                }
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
        const backendEndpoint = this.getBackendEndpoint(type);
        if (!backendEndpoint) {
            console.log('[DataService] Invalid backend endpoint for type', type);
            // Use fallback only if enabled
            if (this.config.fallbackToLocalStorage) {
                // Check if we're in production by checking for localhost
                const isProduction = !(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:');
                if (isProduction) {
                    // In production, throw error instead of falling back
                    throw new Error('API failed and fallback disabled in production');
                } else {
                    // In development, allow fallback with warning
                    console.warn('API getPublished failed for type "' + type + '", using localStorage fallback');
                    const items = JSON.parse(localStorage.getItem(type) || '[]');
                    return items.filter(item => item.status === 'published');
                }
            } else {
                throw new Error('API disabled and no fallback available');
            }
        }
        
        if (this.config.useApi) {
            try {
                const backendEndpoint = this.getBackendEndpoint(type);
                if (!backendEndpoint) {
                    console.error('[DataService] BLOCKED API call due to invalid backend endpoint for type:', type);
                    throw new Error('Invalid backend endpoint for type: ' + type);
                }
                const endpoint = '/' + backendEndpoint + '/public';
                const response = await this.apiRequest(endpoint);
                return response.data || [];
            } catch (error) {
                // Only use localStorage fallback for actual API failures, not for invalid endpoints
                if (error.message.includes('Invalid API endpoint') || error.message.includes('Invalid backend endpoint')) {
                    throw error; // Don't use fallback for invalid endpoints
                }
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
    },
    
    /**
     * Refresh authentication token
     * @returns {Promise<boolean>} True if refresh was successful, false otherwise
     */
    async refreshToken() {
        try {
            const response = await fetch(`${this.config.apiBaseUrl}/auth/refresh-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include' // Include cookies for authentication
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.accessToken) {
                    // Store the new access token
                    if (localStorage.getItem('adminToken')) {
                        localStorage.setItem('adminToken', data.accessToken);
                    } else if (sessionStorage.getItem('adminToken')) {
                        sessionStorage.setItem('adminToken', data.accessToken);
                    }
                    return true;
                }
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('Token refresh failed:', errorData.message || 'Unknown error');
            }
        } catch (error) {
            console.error('Token refresh network error:', error);
        }
        
        return false;
    },
    
    /**
     * Logout user and redirect to login page
     */
    logoutAndRedirect() {
        // Clear stored tokens
        localStorage.removeItem('adminToken');
        sessionStorage.removeItem('adminToken');
        
        // Redirect to login page
        window.location.href = '/login';
    }
};

// Make DataService globally available
window.DataService = DataService;

// Perform startup self-check
if (DataService._performSelfCheck) {
    DataService._performSelfCheck();
}

console.log('DataService API initialized with API support and localStorage fallback');
