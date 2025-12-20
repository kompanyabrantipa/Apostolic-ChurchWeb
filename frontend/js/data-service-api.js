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
    fallbackToLocalStorage: false, // Fallback to localStorage if API fails
    enableSync: true, // Enable real-time sync events
  },

  /**
   * Make API request with error handling and fallback
   */
  async apiRequest(endpoint, options = {}) {
    if (!this.config.useApi) {
      throw new Error("API disabled, use localStorage fallback");
    }

    // Prevent requests to the root API endpoint which doesn't exist
    if (endpoint === '/' || endpoint === '') {
      throw new Error("Invalid API endpoint: Cannot call API root. Use specific resource endpoints like /blogs, /events, or /sermons.");
    }

    try {
      const url = `${this.config.apiBaseUrl}${endpoint}`.replace('//api', '/api'); // Fix double slash if present
      
      // Debug logging
      console.log(`🔍 API Request: ${options.method || 'GET'} ${url}`);
      
      // Get authentication token from localStorage or sessionStorage
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
      
      const response = await fetch(url, {
        credentials: "include", // Include cookies for authentication
        headers: {
          "Content-Type": "application/json",
          ...(token && { 'Authorization': `Bearer ${token}` }), // Add Bearer token if available
          ...options.headers,
        },
        ...options,
      });

      console.log(`📥 API Response: ${response.status} ${response.statusText} for ${url}`);
      
      // Log response headers for debugging
      console.log('📋 Response Headers:', [...response.headers.entries()]);

      if (!response.ok) {
        // Try to parse error response as JSON first
        const errorText = await response.text();
        console.log(`❌ Error Response Body: ${errorText.substring(0, 200)}${errorText.length > 200 ? '...' : ''}`);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (parseError) {
          // If not JSON, treat as plain text
          errorData = { message: errorText || "Unknown error" };
        }
        
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      // Check content type before parsing
      const contentType = response.headers.get('content-type');
      console.log(`📄 Content-Type: ${contentType}`);
      
      const textResponse = await response.text();
      console.log(`📦 Response Body: ${textResponse.substring(0, 200)}${textResponse.length > 200 ? '...' : ''}`);
      
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

      // Only fallback to localStorage on network errors, not on successful API responses
      if (this.config.fallbackToLocalStorage && (error.name === 'TypeError' || error.message.includes('fetch'))) {
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
      this.triggerSync(type, "create", createdItem);
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
      this.triggerSync(type, "update", updatedItem);
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
      this.triggerSync(type, "delete", deletedItem);
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

      console.log(`🔄 Sync event triggered: ${action} ${type}`, item);
    } catch (error) {
      console.error("Failed to trigger sync event:", error);
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
};

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
