/**
 * Enhanced DataService with API integration and localStorage fallback
 * This version maintains the exact same interface as the original DataService
 * but adds support for server-side API calls with localStorage as fallback
 */

const DataService = {
  // Configuration
  config: {
    apiBaseUrl: window.Config?.api?.baseUrl || "https://api.apostolicchurchlouisville.org/api", // API base URL
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

    try {
      const url = `${this.config.apiBaseUrl}${endpoint}`.replace('//api', '/api'); // Fix double slash if present
      const response = await fetch(url, {
        credentials: "include", // Include cookies for authentication
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Unknown error" }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("API request failed:", error);

      // Only fallback to localStorage on network errors, not on successful API responses
      if (this.config.fallbackToLocalStorage && (error.name === 'TypeError' || error.message.includes('fetch'))) {
        console.log("Falling back to localStorage due to network error...");
        // Let the calling method handle localStorage fallback
      } else {
        // Log the error but don't fallback for successful API responses with error status
        console.error("API request failed with non-network error:", error.message);
      }

      throw error;
    }
  },

  /**
   * Get all items of a specific type
   * @param {string} type - Data type (blogs, events, sermons)
   * @returns {Array} Array of items
   */
  async getAll(type) {
    try {
      // Try API first
      if (this.config.useApi) {
        // Map content types to their correct API endpoints
        const endpointMap = {
          'blogs': '/blog',
          'events': '/events',
          'sermons': '/sermons'
        };
        
        const endpoint = endpointMap[type] || `/${type}`;
        const response = await this.apiRequest(endpoint);
        return response.data || [];
      }
    } catch (error) {
      console.warn("API getAll failed, using localStorage:", error.message);
    }

    // Fallback to localStorage
    try {
      const items = JSON.parse(localStorage.getItem(type) || "[]");
      return items;
    } catch (error) {
      console.error("localStorage getAll failed:", error);
      return [];
    }
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
          'blogs': '/blog/public',
          'events': '/events/public',
          'sermons': '/sermons/public'
        };
        
        const endpoint = endpointMap[type] || `/${type}?published=true`;
        const response = await this.apiRequest(endpoint);
        return response.data || [];
      }
    } catch (error) {
      console.warn(
        "API getPublished failed, using localStorage:",
        error.message
      );
    }

    // Fallback to localStorage
    try {
      const items = JSON.parse(localStorage.getItem(type) || "[]");
      return items.filter((item) => item.status === "published");
    } catch (error) {
      console.error("localStorage getPublished failed:", error);
      return [];
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
          'blogs': '/blog',
          'events': '/events',
          'sermons': '/sermons'
        };
        
        const basePath = endpointMap[type] || `/${type}`;
        const response = await this.apiRequest(`${basePath}/${id}`);
        return response.data || null;
      }
    } catch (error) {
      console.warn("API getById failed, using localStorage:", error.message);
    }

    // Fallback to localStorage
    try {
      const items = JSON.parse(localStorage.getItem(type) || "[]");
      return items.find((item) => item.id === id) || null;
    } catch (error) {
      console.error("localStorage getById failed:", error);
      return null;
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
          'blogs': '/blog',
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
    if (!createdItem || this.config.fallbackToLocalStorage) {
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
          'blogs': '/blog',
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
    if (!updatedItem || this.config.fallbackToLocalStorage) {
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
          'blogs': '/blog',
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
    if (!deletedItem || this.config.fallbackToLocalStorage) {
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
