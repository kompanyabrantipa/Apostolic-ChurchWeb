/**
 * Enhanced DataService with API integration and localStorage fallback
 * This version maintains the exact same interface as the original DataService
 * but adds support for server-side API calls with localStorage as fallback
 */

const DataService = {
  // Configuration
  config: {
    apiBaseUrl: window.Config?.api?.baseUrl || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3001/api' : 'https://api.apostolicchurchlouisville.org/api'), // API base URL
    useApi: true, // Set to false to use localStorage only
    fallbackToLocalStorage: (window.Config?.environment === 'production' ? false : true) || true, // Fallback to localStorage if API fails (disabled in production)
    enableSync: true, // Enable real-time sync events
  },

  /**
   * Make API request with error handling and fallback
   */
  async apiRequest(endpoint, options = {}) {
    if (!this.config.useApi) {
      throw new Error("API disabled, use localStorage fallback");
    }

    // Validate API base URL
    if (!this.config.apiBaseUrl || typeof this.config.apiBaseUrl !== 'string') {
      throw new Error("Invalid API base URL configuration");
    }
    
    // Validate that API base URL has proper protocol in production
    if (window.Config?.environment === 'production') {
      if (!this.config.apiBaseUrl.startsWith('https://')) {
        console.warn('⚠️ Production API URL should use HTTPS:', this.config.apiBaseUrl);
      }
      
      // Check if API URL matches expected production pattern
      const expectedPattern = /^https:\/\/api\.[^.]+\.[^/]+\/api$/;
      if (!expectedPattern.test(this.config.apiBaseUrl)) {
        console.warn('⚠️ Production API URL may be incorrectly configured. Expected pattern: https://api.domain.tld/api');
        console.warn('📍 Current API URL:', this.config.apiBaseUrl);
      }
    }

    // Prevent requests to the root API endpoint which doesn't exist
    if (endpoint === '/' || endpoint === '') {
      throw new Error("Invalid API endpoint: Cannot call API root. Use specific resource endpoints like /blogs, /events, or /sermons.");
    }

    try {
      // Ensure API base URL doesn't end with a slash
      let baseUrl = this.config.apiBaseUrl;
      if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
      }
      
      // Ensure endpoint starts with a slash
      let normalizedEndpoint = endpoint;
      if (!endpoint.startsWith('/')) {
        normalizedEndpoint = '/' + endpoint;
      }
      
      // Construct the full URL
      let url = `${baseUrl}${normalizedEndpoint}`;
      
      // Fix double slash if present (but preserve protocol)
      if (url.includes('://')) {
        // Split by protocol
        const parts = url.split('://');
        const protocol = parts[0];
        const rest = parts[1].replace(/\/\/+/g, '/');
        url = protocol + '://' + rest;
      } else {
        // Handle relative URLs
        url = url.replace(/\/\/+/g, '/');
      }
      
      // Ensure we have the proper protocol
      if (url.startsWith('//')) {
        url = window.location.protocol + url;
      } else if (url.startsWith('/')) {
        // Handle relative URLs
        url = window.location.origin + url;
      }
      
      // Debug logging
      if (window.Config?.debug?.enabled) {
        console.log(`🔍 API Request: ${options.method || 'GET'} ${url}`);
      }
      
      // Get authentication token from localStorage or sessionStorage
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      
      // Add timeout to fetch requests for better production reliability
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), window.Config?.api?.timeout || 10000);
      
      const fetchOptions = {
        credentials: "include", // Include cookies for authentication
        headers: {
          "Content-Type": "application/json",
          ...(token && { 'Authorization': `Bearer ${token}` }), // Add Bearer token if available
          ...options.headers,
        },
        signal: controller.signal,
        ...options,
      };
      
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      if (window.Config?.debug?.enabled) {
        console.log(`📥 API Response: ${response.status} ${response.statusText} for ${url}`);
      }
      
      // Log response headers for debugging
      if (window.Config?.debug?.enabled) {
        console.log('📋 Response Headers:', [...response.headers.entries()]);
      }

      if (!response.ok) {
        // Try to parse error response as JSON first
        const errorText = await response.text();
        console.log(`❌ Error Response Body: ${errorText.substring(0, 200)}${errorText.length > 200 ? '...' : ''}`);
        
        // Check if error response is HTML (common for 404 errors)
        if (errorText.trim().startsWith('<!DOCTYPE html') || errorText.trim().startsWith('<html')) {
          // For HTML error responses, provide a cleaner error message
          throw new Error(`HTTP ${response.status}: ${response.statusText}. The requested API endpoint may not exist or the server is misconfigured.`);
        }
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (parseError) {
          // If not JSON, treat as plain text
          errorData = { message: errorText.substring(0, 200) || "Unknown error" };
        }
        
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      // Check content type before parsing
      const contentType = response.headers.get('content-type');
      console.log(`📄 Content-Type: ${contentType}`);
      
      // Check content type before processing
      if (!contentType || !contentType.includes('application/json')) {
        // In production, if we get HTML instead of JSON, it's likely a routing issue
        if (contentType && contentType.includes('text/html')) {
          console.error(`🚨 API routing error: Received HTML instead of JSON from ${url}`);
          console.error(`🚨 This usually indicates the API endpoint is not properly configured or the server is returning a fallback page.`);
                
          // Provide specific guidance based on environment
          if (window.Config?.environment === 'production') {
            console.error(`🔧 PRODUCTION TROUBLESHOOTING:`);
            console.error(`   1. Verify the API server is running at: ${this.config.apiBaseUrl}`);
            console.error(`   2. Check DNS records for api.${window.location.hostname}`);
            console.error(`   3. Verify SSL certificate is valid for the API domain`);
            console.error(`   4. Check server routing configuration`);
          } else {
            console.error(`🔧 DEVELOPMENT TROUBLESHOOTING:`);
            console.error(`   1. Verify the backend server is running on port 3001`);
            console.error(`   2. Check that API routes are properly configured`);
            console.error(`   3. Verify the API base URL is correct: ${this.config.apiBaseUrl}`);
          }
                
          throw new Error(`API routing error: Server returned HTML instead of JSON. Please check API configuration.`);
        } else {
          throw new Error(`Invalid content type: ${contentType}. Expected application/json.`);
        }
      }
      
      const textResponse = await response.text();
      
      // Log response body for debugging (limit size in production)
      if (window.Config?.debug?.enabled) {
        console.log(`📦 Response Body: ${textResponse.substring(0, 200)}${textResponse.length > 200 ? '...' : ''}`);
      } else if (textResponse.length > 10000) {
        // In production, only log first 1000 chars of large responses
        console.log(`📦 Response Body (truncated): ${textResponse.substring(0, 1000)}...`);
      }
      
      // Check if response is HTML instead of JSON (common in production misconfigurations)
      if (textResponse.trim().startsWith('<!DOCTYPE html') || textResponse.trim().startsWith('<html') || 
          (contentType && contentType.includes('text/html'))) {
        console.error(`🚨 Critical Error: Received HTML document instead of JSON from API endpoint ${url}`);
        console.error(`🚨 This indicates the API endpoint is not properly configured or is returning a fallback page.`);
        console.error(`🚨 Response preview: ${textResponse.substring(0, 200)}...`);
        
        // Provide specific guidance based on environment
        if (window.Config?.environment === 'production') {
          console.error(`🔧 PRODUCTION TROUBLESHOOTING:`);
          console.error(`   1. Verify the API server is running at: ${this.config.apiBaseUrl}`);
          console.error(`   2. Check DNS records for api.${window.location.hostname}`);
          console.error(`   3. Verify SSL certificate is valid for the API domain`);
          console.error(`   4. Check server routing configuration`);
        } else {
          console.error(`🔧 DEVELOPMENT TROUBLESHOOTING:`);
          console.error(`   1. Verify the backend server is running on port 3001`);
          console.error(`   2. Check that API routes are properly configured`);
          console.error(`   3. Verify the API base URL is correct: ${this.config.apiBaseUrl}`);
        }
        
        // In production, provide more helpful error message
        if (window.Config?.environment === 'production') {
          throw new Error(`API configuration error: Server returned an HTML page instead of JSON data. This usually indicates the API server is not properly configured for production deployment.`);
        } else {
          throw new Error(`Invalid response: Received HTML instead of JSON. Check that the API server is running and properly configured.`);
        }
      }
      
      // Try to parse as JSON
      try {
        const data = JSON.parse(textResponse);
        return data;
      } catch (parseError) {
        console.error(`❌ Failed to parse JSON response from ${url}`);
        console.error(`📝 Response was: ${textResponse}`);
        throw new Error(`Invalid JSON response: ${parseError.message}`);
      }
    } catch (error) {
      console.error("API request failed:", error);

      // Handle timeout and abort errors specifically
      if (error.name === 'AbortError') {
        console.warn("API request timed out or was aborted");
        error = new Error("Request timed out. Please check your connection and try again.");
      }

      // Handle HTML response errors (production routing issues)
      if (error.message.includes('API routing error') || error.message.includes('HTML instead of JSON')) {
        // In production, if we're getting HTML, try to determine the correct API URL
        if (window.Config?.environment === 'production') {
          console.warn("Attempting to determine correct API URL...");
          // Try alternative API URL patterns that are common in production deployments
          const alternativeUrls = [
            window.location.origin + '/api',  // Same domain API
            window.location.origin + '/backend/api',  // Backend subdirectory
            'https://api.' + window.location.hostname + '/api',  // Subdomain API
            'https://' + window.location.hostname + '/api'  // Root domain API
          ];
          
          for (const altUrl of alternativeUrls) {
            if (altUrl !== this.config.apiBaseUrl) {
              console.warn(`Try alternative API URL: ${altUrl}`);
              // We could potentially retry with alternative URLs here
              break;
            }
          }
        }
      }

      // Only fallback to localStorage on network errors, not on successful API responses
      if (this.config.fallbackToLocalStorage && (error.name === 'TypeError' || error.message.includes('fetch') || error.name === 'AbortError' || error.message.includes('HTML instead of JSON'))) {
        console.log("Falling back to localStorage due to network error...");
        // Let the calling method handle localStorage fallback
      } else {
        // Log the error but don't fallback for successful API responses with error status
        console.error("API request failed with non-network error:", error.message);
        // Log additional error details for debugging
        console.error("Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }

      throw error;
    }
  },

  /**
   * Get all items of a specific type
   * @param {string} type - Data type (blogs, events, sermons)
   * @returns {Array} Array of items
   */
  getAll: async function(type) {
    if (this.config.useApi) {
      // Map content types to their correct API endpoints
      const endpointMap = {
        'blogs': '/blogs',
        'events': '/events',
        'sermons': '/sermons'
      };
      
      const endpoint = endpointMap[type] || `/${type}`;
      const response = await this.apiRequest(endpoint);
      return response.data || [];
    }
    
    // If API is disabled, fallback to localStorage
    throw new Error("API disabled");
  },

  /**
   * Get published items only (for frontend pages)
   * @param {string} type - Data type (blogs, events, sermons)
   * @returns {Array} Array of published items
   */
  async getPublished(type) {
    try {
      // Try API first
      if (this.config.useApi) {
        // Map content types to their correct API endpoints
        const endpointMap = {
          'blogs': '/blogs?published=true',
          'events': '/events?published=true',
          'sermons': '/sermons?published=true'
        };
        
        const endpoint = endpointMap[type] || `/${type}?published=true`;
        const response = await this.apiRequest(endpoint);
        return response.data || [];
      }
      
      // If API is disabled, fallback to localStorage
      throw new Error("API disabled");
    } catch (error) {
      // Only fallback to localStorage if configured to do so or if API is disabled
      if (this.config.fallbackToLocalStorage || !this.config.useApi) {
        console.warn(
          "API getPublished failed, using localStorage:",
          error.message
        );
        try {
          const items = JSON.parse(localStorage.getItem(type) || "[]");
          return items.filter((item) => item.status === "published");
        } catch (localStorageError) {
          console.error("localStorage getPublished failed:", localStorageError);
          return [];
        }
      } else {
        // Re-throw the error if we're not supposed to fallback
        throw error;
      }
    }
  },

  /**
   * Get single item by ID
   * @param {string} type - Data type (blogs, events, sermons)
   * @param {string} id - Item ID
   * @returns {Object|null} Item or null if not found
   */
  async getById(type, id) {
    try {
      // Try API first
      if (this.config.useApi) {
        // Map content types to their correct API endpoints
        const endpointMap = {
          'blogs': '/blogs',
          'events': '/events',
          'sermons': '/sermons'
        };
        
        const basePath = endpointMap[type] || `/${type}`;
        const response = await this.apiRequest(`${basePath}/${id}`);
        return response.data || null;
      }
      
      // If API is disabled, fallback to localStorage
      throw new Error("API disabled");
    } catch (error) {
      // Only fallback to localStorage if configured to do so or if API is disabled
      if (this.config.fallbackToLocalStorage || !this.config.useApi) {
        console.warn("API getById failed, using localStorage:", error.message);
        try {
          const items = JSON.parse(localStorage.getItem(type) || "[]");
          return items.find((item) => item.id === id) || null;
        } catch (localStorageError) {
          console.error("localStorage getById failed:", localStorageError);
          return null;
        }
      } else {
        // Re-throw the error if we're not supposed to fallback
        throw error;
      }
    }
  },

  /**
   * Create new item
   * @param {string} type - Data type (blogs, events, sermons)
   * @param {Object} data - Item data
   * @returns {Object} Created item
   */
  async create(type, data) {
    let createdItem = null;
    let useLocalStorageSync = false;

    try {
      // Try API first
      if (this.config.useApi) {
        // Map content types to their correct API endpoints
        const endpointMap = {
          'blogs': '/blogs',
          'events': '/events',
          'sermons': '/sermons'
        };
        
        const endpoint = endpointMap[type] || `/${type}`;
        const response = await this.apiRequest(endpoint, {
          method: "POST",
          body: JSON.stringify(data),
        });
        createdItem = response.data;
      }
    } catch (error) {
      console.warn("API create failed, using localStorage:", error.message);
      useLocalStorageSync = true;
    }

    // Fallback to localStorage or dual-write
    // When API is enabled, completely disable localStorage fallback for create/update/delete
    if ((!createdItem && !this.config.useApi) || this.config.fallbackToLocalStorage) {
      try {
        const items = JSON.parse(localStorage.getItem(type) || "[]");

        // Generate ID if not provided
        const newItem = {
          id: data.id || Date.now().toString(),
          ...data,
          createdAt: data.createdAt || new Date().toISOString(),
        };

        items.push(newItem);
        localStorage.setItem(type, JSON.stringify(items));

        if (!createdItem) {
          createdItem = newItem;
        }

        // Update last sync timestamp
        this.updateLastSync();
      } catch (error) {
        console.error("localStorage create failed:", error);
        if (!createdItem) {
          throw error;
        }
      }
    }

    // Trigger sync events
    if (this.config.enableSync && createdItem) {
      try {
        this.triggerSync(type, "create", createdItem);
      } catch (syncError) {
        console.warn("Sync event trigger failed:", syncError.message);
      }
    }

    return createdItem;
  },

  /**
   * Update existing item
   * @param {string} type - Data type (blogs, events, sermons)
   * @param {string} id - Item ID
   * @param {Object} data - Updated data
   * @returns {Object|null} Updated item or null if not found
   */
  async update(type, id, data) {
    let updatedItem = null;
    let useLocalStorageSync = false;

    try {
      // Try API first
      if (this.config.useApi) {
        // Map content types to their correct API endpoints
        const endpointMap = {
          'blogs': '/blogs',
          'events': '/events',
          'sermons': '/sermons'
        };
        
        const basePath = endpointMap[type] || `/${type}`;
        const response = await this.apiRequest(`${basePath}/${id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        });
        updatedItem = response.data;
      }
    } catch (error) {
      console.warn("API update failed, using localStorage:", error.message);
      useLocalStorageSync = true;
    }

    // Fallback to localStorage or dual-write
    // When API is enabled, completely disable localStorage fallback for create/update/delete
    if ((!updatedItem && !this.config.useApi) || this.config.fallbackToLocalStorage) {
      try {
        const items = JSON.parse(localStorage.getItem(type) || "[]");
        const index = items.findIndex((item) => item.id === id);

        if (index !== -1) {
          items[index] = {
            ...items[index],
            ...data,
            updatedAt: new Date().toISOString(),
          };

          localStorage.setItem(type, JSON.stringify(items));

          if (!updatedItem) {
            updatedItem = items[index];
          }

          // Update last sync timestamp
          this.updateLastSync();
        }
      } catch (error) {
        console.error("localStorage update failed:", error);
        if (!updatedItem) {
          throw error;
        }
      }
    }

    // Trigger sync events
    if (this.config.enableSync && updatedItem) {
      try {
        this.triggerSync(type, "update", updatedItem);
      } catch (syncError) {
        console.warn("Sync event trigger failed:", syncError.message);
      }
    }

    return updatedItem;
  },

  /**
   * Delete item
   * @param {string} type - Data type (blogs, events, sermons)
   * @param {string} id - Item ID
   * @returns {boolean} True if deleted, false if not found
   */
  async delete(type, id) {
    let deletedItem = null;
    let useLocalStorageSync = false;

    try {
      // Try API first
      if (this.config.useApi) {
        // Map content types to their correct API endpoints
        const endpointMap = {
          'blogs': '/blogs',
          'events': '/events',
          'sermons': '/sermons'
        };
        
        const basePath = endpointMap[type] || `/${type}`;
        const response = await this.apiRequest(`${basePath}/${id}`, {
          method: "DELETE",
        });
        deletedItem = response.data;
      }
    } catch (error) {
      console.warn("API delete failed, using localStorage:", error.message);
      useLocalStorageSync = true;
    }

    // Fallback to localStorage or dual-write
    // When API is enabled, completely disable localStorage fallback for create/update/delete
    if ((!deletedItem && !this.config.useApi) || this.config.fallbackToLocalStorage) {
      try {
        const items = JSON.parse(localStorage.getItem(type) || "[]");
        const index = items.findIndex((item) => item.id === id);

        if (index !== -1) {
          const deleted = items.splice(index, 1)[0];
          localStorage.setItem(type, JSON.stringify(items));

          if (!deletedItem) {
            deletedItem = deleted;
          }

          // Update last sync timestamp
          this.updateLastSync();
        }
      } catch (error) {
        console.error("localStorage delete failed:", error);
        if (!deletedItem) {
          throw error;
        }
      }
    }

    // Trigger sync events
    if (this.config.enableSync && deletedItem) {
      try {
        this.triggerSync(type, "delete", deletedItem);
      } catch (syncError) {
        console.warn("Sync event trigger failed:", syncError.message);
      }
    }

    return !!deletedItem;
  },

  /**
   * Trigger synchronization events (maintains existing sync system)
   */
  triggerSync(type, action, item) {
    try {
      // Dispatch custom event for real-time sync
      const syncEvent = new CustomEvent("contentSync", {
        detail: {
          type: type,
          action: action,
          item: item,
          timestamp: new Date().toISOString(),
        },
      });

      window.dispatchEvent(syncEvent);

      // Also trigger storage event for cross-tab communication
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: type,
          newValue: JSON.stringify(item),
          storageArea: localStorage,
        })
      );

      if (window.Config?.debug?.enabled) {
        console.log(`🔄 Sync event triggered: ${action} ${type}`, item);
      }
    } catch (error) {
      console.error("Failed to trigger sync event:", error);
      // Don't throw error to prevent crashing the application
    }
  },

  /**
   * Update last sync timestamp
   */
  updateLastSync() {
    try {
      const lastSync = {
        timestamp: new Date().toISOString(),
        source: this.config.useApi ? "api" : "localStorage",
      };
      localStorage.setItem("lastSync", JSON.stringify(lastSync));
    } catch (error) {
      console.error("Failed to update last sync:", error);
    }
  },

  /**
   * Switch between API and localStorage modes
   */
  setApiMode(useApi) {
    this.config.useApi = useApi;
    console.log(
      `DataService mode switched to: ${useApi ? "API" : "localStorage"}`
    );
  },

  /**
   * Get current configuration
   */
  getConfig() {
    return { ...this.config };
  },
  
  /**
   * Test API connectivity
   * @returns {Promise<boolean>} True if API is reachable, false otherwise
   */
  async testConnectivity() {
    try {
      // Test a simple endpoint that should always exist
      const testEndpoints = ['/health', '/blogs', '/events', '/sermons'];
      
      for (const endpoint of testEndpoints) {
        try {
          const url = `${this.config.apiBaseUrl}${endpoint}`;
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          
          const response = await fetch(url, {
            method: 'GET',
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          
          const contentType = response.headers.get('content-type');
          
          // If we get a valid JSON response or a proper 404, the API is working
          if ((response.ok && contentType && contentType.includes('application/json')) || 
              (response.status === 404 && contentType && contentType.includes('application/json'))) {
            if (window.Config?.debug?.enabled) {
              console.log(`✅ API connectivity test passed for ${endpoint}`);
            }
            return true;
          }
          
          // If we get HTML, the API is misconfigured
          if (contentType && contentType.includes('text/html')) {
            console.warn(`⚠️ API returned HTML for ${endpoint} - possible misconfiguration`);
            continue;
          }
        } catch (testError) {
          // Continue to next endpoint
          continue;
        }
      }
      
      return false;
    } catch (error) {
      console.error('API connectivity test failed:', error.message);
      return false;
    }
  },
};

// Attach DataService to window object for global access
// This ensures it's available for both module and non-module usage
(async function() {
  if (typeof window !== 'undefined') {
    window.DataService = DataService;
    
    // Run diagnostics in development mode
    if (window.Config?.debug?.enabled) {
      try {
        const isConnected = await DataService.testConnectivity();
        if (!isConnected) {
          console.warn('⚠️ API connectivity test failed - check API configuration');
        }
      } catch (error) {
        console.warn('Diagnostics failed:', error.message);
      }
    }
  }
  
  // Export for module usage
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataService;
  }
})();

// Initialize DataService
console.log("🔧 Enhanced DataService with API integration loaded");
console.log("📡 API mode:", DataService.config.useApi ? "enabled" : "disabled");
console.log(
  "💾 localStorage fallback:",
  DataService.config.fallbackToLocalStorage ? "enabled" : "disabled"
);
console.log("📍 API Base URL:", DataService.config.apiBaseUrl);
console.log("⚙️ Full Config:", DataService.config);
console.log("🌐 Window Config:", window.Config);
