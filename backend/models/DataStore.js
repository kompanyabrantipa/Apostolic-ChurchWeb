const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * DataStore class for handling JSON file-based data storage
 */
class DataStore {
  /**
   * Create a new DataStore instance
   * @param {string} storeName - Name of the JSON file (without extension)
   */
  constructor(storeName) {
    this.storePath = path.join(__dirname, '..', 'data', `${storeName}.json`);
  }

  /**
   * Get all items from the store
   * @returns {Promise<Array>} Array of items
   */
  async getAll() {
    try {
      const data = await fs.readFile(this.storePath, 'utf8');
      return JSON.parse(data || '[]');
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, create it with empty array
        await fs.writeFile(this.storePath, '[]');
        return [];
      }
      throw error;
    }
  }

  /**
   * Get item by ID
   * @param {string} id - Item ID
   * @returns {Promise<Object|null>} Item or null if not found
   */
  async getById(id) {
    const items = await this.getAll();
    return items.find(item => item.id === id) || null;
  }

  /**
   * Create a new item
   * @param {Object} data - Item data
   * @returns {Promise<Object>} Created item
   */
  async create(data) {
    const items = await this.getAll();
    
    const newItem = {
      id: uuidv4(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    items.push(newItem);
    await fs.writeFile(this.storePath, JSON.stringify(items, null, 2));
    
    return newItem;
  }

  /**
   * Update an existing item
   * @param {string} id - Item ID
   * @param {Object} data - Updated data
   * @returns {Promise<Object|null>} Updated item or null if not found
   */
  async update(id, data) {
    const items = await this.getAll();
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
    await fs.writeFile(this.storePath, JSON.stringify(items, null, 2));
    
    return updatedItem;
  }

  /**
   * Delete an item
   * @param {string} id - Item ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async delete(id) {
    const items = await this.getAll();
    const initialLength = items.length;
    
    const filteredItems = items.filter(item => item.id !== id);
    
    if (filteredItems.length === initialLength) {
      return false;
    }
    
    await fs.writeFile(this.storePath, JSON.stringify(filteredItems, null, 2));
    return true;
  }

  /**
   * Get public items (status = published)
   * @returns {Promise<Array>} Array of published items
   */
  async getPublic() {
    const items = await this.getAll();
    return items.filter(item => item.status === 'published');
  }
}

module.exports = { DataStore };
