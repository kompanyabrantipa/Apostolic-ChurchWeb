const { query } = require('../config/database');

class Sermon {
  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.speaker = data.speaker;
    this.date = data.date;
    this.description = data.description;
    this.videoUrl = data.video_url || data.videoUrl;
    this.audioUrl = data.audio_url || data.audioUrl;
    this.thumbnailUrl = data.thumbnail_url || data.thumbnailUrl;
    this.status = data.status || 'draft';
    this.createdAt = data.created_at || data.createdAt;
    this.updatedAt = data.updated_at || data.updatedAt;
  }

  // Convert database row to localStorage-compatible format
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      speaker: this.speaker,
      date: this.date,
      description: this.description,
      videoUrl: this.videoUrl,
      audioUrl: this.audioUrl,
      thumbnailUrl: this.thumbnailUrl,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Create new sermon
  static async create(sermonData) {
    try {
      // Generate ID if not provided (matching localStorage pattern)
      const id = sermonData.id || Date.now().toString();
      
      const result = await query(`
        INSERT INTO sermons (id, title, speaker, date, description, video_url, audio_url, thumbnail_url, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        id,
        sermonData.title,
        sermonData.speaker,
        sermonData.date,
        sermonData.description || '',
        sermonData.videoUrl || '',
        sermonData.audioUrl || '',
        sermonData.thumbnailUrl || '',
        sermonData.status || 'draft'
      ]);

      return new Sermon(result.rows[0]);
    } catch (error) {
      console.error('Error creating sermon:', error);
      throw error;
    }
  }

  // Get all sermons
  static async getAll() {
    try {
      const result = await query('SELECT * FROM sermons ORDER BY date DESC');
      return result.rows.map(row => new Sermon(row));
    } catch (error) {
      console.error('Error getting all sermons:', error);
      throw error;
    }
  }

  // Get sermon by ID
  static async getById(id) {
    try {
      const result = await query('SELECT * FROM sermons WHERE id = $1', [id]);
      return result.rows.length > 0 ? new Sermon(result.rows[0]) : null;
    } catch (error) {
      console.error('Error getting sermon by ID:', error);
      throw error;
    }
  }

  // Update sermon
  static async update(id, updateData) {
    try {
      const result = await query(`
        UPDATE sermons 
        SET title = $2, speaker = $3, date = $4, description = $5, 
            video_url = $6, audio_url = $7, thumbnail_url = $8, status = $9
        WHERE id = $1
        RETURNING *
      `, [
        id,
        updateData.title,
        updateData.speaker,
        updateData.date,
        updateData.description || '',
        updateData.videoUrl || '',
        updateData.audioUrl || '',
        updateData.thumbnailUrl || '',
        updateData.status || 'draft'
      ]);

      return result.rows.length > 0 ? new Sermon(result.rows[0]) : null;
    } catch (error) {
      console.error('Error updating sermon:', error);
      throw error;
    }
  }

  // Delete sermon
  static async delete(id) {
    try {
      const result = await query('DELETE FROM sermons WHERE id = $1 RETURNING *', [id]);
      return result.rows.length > 0 ? new Sermon(result.rows[0]) : null;
    } catch (error) {
      console.error('Error deleting sermon:', error);
      throw error;
    }
  }

  // Get published sermons only (for frontend)
  static async getPublished() {
    try {
      const result = await query(
        'SELECT * FROM sermons WHERE status = $1 ORDER BY date DESC',
        ['published']
      );
      return result.rows.map(row => new Sermon(row));
    } catch (error) {
      console.error('Error getting published sermons:', error);
      throw error;
    }
  }

  // Get recent sermons (for dashboard)
  static async getRecent(limit = 5) {
    try {
      const result = await query(
        'SELECT * FROM sermons ORDER BY date DESC LIMIT $1',
        [limit]
      );
      return result.rows.map(row => new Sermon(row));
    } catch (error) {
      console.error('Error getting recent sermons:', error);
      throw error;
    }
  }

  // Get sermon count
  static async getCount() {
    try {
      const result = await query('SELECT COUNT(*) as count FROM sermons');
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error getting sermon count:', error);
      throw error;
    }
  }
}

module.exports = Sermon;
