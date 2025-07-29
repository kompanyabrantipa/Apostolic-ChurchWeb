const { query } = require('../config/database');

class Event {
  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.date = data.date;
    this.location = data.location;
    this.description = data.description;
    this.imageUrl = data.image_url || data.imageUrl;
    this.status = data.status || 'draft';
    this.createdAt = data.created_at || data.createdAt;
    this.updatedAt = data.updated_at || data.updatedAt;
  }

  // Convert database row to localStorage-compatible format
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      date: this.date,
      location: this.location,
      description: this.description,
      imageUrl: this.imageUrl,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Create new event
  static async create(eventData) {
    try {
      // Generate ID if not provided (matching localStorage pattern)
      const id = eventData.id || Date.now().toString();
      
      const result = await query(`
        INSERT INTO events (id, title, date, location, description, image_url, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        id,
        eventData.title,
        eventData.date,
        eventData.location || '',
        eventData.description || '',
        eventData.imageUrl || '',
        eventData.status || 'draft'
      ]);

      return new Event(result.rows[0]);
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  // Get all events
  static async getAll() {
    try {
      const result = await query('SELECT * FROM events ORDER BY date ASC');
      return result.rows.map(row => new Event(row));
    } catch (error) {
      console.error('Error getting all events:', error);
      throw error;
    }
  }

  // Get event by ID
  static async getById(id) {
    try {
      const result = await query('SELECT * FROM events WHERE id = $1', [id]);
      return result.rows.length > 0 ? new Event(result.rows[0]) : null;
    } catch (error) {
      console.error('Error getting event by ID:', error);
      throw error;
    }
  }

  // Update event
  static async update(id, updateData) {
    try {
      const result = await query(`
        UPDATE events 
        SET title = $2, date = $3, location = $4, description = $5, 
            image_url = $6, status = $7
        WHERE id = $1
        RETURNING *
      `, [
        id,
        updateData.title,
        updateData.date,
        updateData.location || '',
        updateData.description || '',
        updateData.imageUrl || '',
        updateData.status || 'draft'
      ]);

      return result.rows.length > 0 ? new Event(result.rows[0]) : null;
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  // Delete event
  static async delete(id) {
    try {
      const result = await query('DELETE FROM events WHERE id = $1 RETURNING *', [id]);
      return result.rows.length > 0 ? new Event(result.rows[0]) : null;
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }

  // Get published events only (for frontend)
  static async getPublished() {
    try {
      const result = await query(
        'SELECT * FROM events WHERE status = $1 ORDER BY date ASC',
        ['published']
      );
      return result.rows.map(row => new Event(row));
    } catch (error) {
      console.error('Error getting published events:', error);
      throw error;
    }
  }

  // Get upcoming events (for dashboard)
  static async getUpcoming(limit = 5) {
    try {
      const result = await query(
        'SELECT * FROM events WHERE date >= NOW() ORDER BY date ASC LIMIT $1',
        [limit]
      );
      return result.rows.map(row => new Event(row));
    } catch (error) {
      console.error('Error getting upcoming events:', error);
      throw error;
    }
  }

  // Get event count
  static async getCount() {
    try {
      const result = await query('SELECT COUNT(*) as count FROM events');
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error getting event count:', error);
      throw error;
    }
  }
}

module.exports = Event;
