const { query } = require('../config/database');

class Blog {
  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.summary = data.summary;
    this.content = data.content;
    this.imageUrl = data.image_url || data.imageUrl;
    this.status = data.status || 'draft';
    this.author = data.author || 'Church Staff';
    this.category = data.category || 'Faith';
    this.comments = data.comments || 0;
    this.createdAt = data.created_at || data.createdAt;
    this.updatedAt = data.updated_at || data.updatedAt;
  }

  // Convert database row to localStorage-compatible format
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      summary: this.summary,
      content: this.content,
      imageUrl: this.imageUrl,
      status: this.status,
      author: this.author,
      category: this.category,
      comments: this.comments,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Create new blog
  static async create(blogData) {
    try {
      // Generate ID if not provided (matching localStorage pattern)
      const id = blogData.id || Date.now().toString();
      
      const result = await query(`
        INSERT INTO blogs (id, title, summary, content, image_url, status, author, category, comments)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        id,
        blogData.title,
        blogData.summary || '',
        blogData.content || '',
        blogData.imageUrl || '',
        blogData.status || 'draft',
        blogData.author || 'Church Staff',
        blogData.category || 'Faith',
        blogData.comments || 0
      ]);

      return new Blog(result.rows[0]);
    } catch (error) {
      console.error('Error creating blog:', error);
      throw error;
    }
  }

  // Get all blogs
  static async getAll() {
    try {
      const result = await query('SELECT * FROM blogs ORDER BY created_at DESC');
      return result.rows.map(row => new Blog(row));
    } catch (error) {
      console.error('Error getting all blogs:', error);
      throw error;
    }
  }

  // Get blog by ID
  static async getById(id) {
    try {
      const result = await query('SELECT * FROM blogs WHERE id = $1', [id]);
      return result.rows.length > 0 ? new Blog(result.rows[0]) : null;
    } catch (error) {
      console.error('Error getting blog by ID:', error);
      throw error;
    }
  }

  // Update blog
  static async update(id, updateData) {
    try {
      const result = await query(`
        UPDATE blogs 
        SET title = $2, summary = $3, content = $4, image_url = $5, 
            status = $6, author = $7, category = $8, comments = $9
        WHERE id = $1
        RETURNING *
      `, [
        id,
        updateData.title,
        updateData.summary || '',
        updateData.content || '',
        updateData.imageUrl || '',
        updateData.status || 'draft',
        updateData.author || 'Church Staff',
        updateData.category || 'Faith',
        updateData.comments || 0
      ]);

      return result.rows.length > 0 ? new Blog(result.rows[0]) : null;
    } catch (error) {
      console.error('Error updating blog:', error);
      throw error;
    }
  }

  // Delete blog
  static async delete(id) {
    try {
      const result = await query('DELETE FROM blogs WHERE id = $1 RETURNING *', [id]);
      return result.rows.length > 0 ? new Blog(result.rows[0]) : null;
    } catch (error) {
      console.error('Error deleting blog:', error);
      throw error;
    }
  }

  // Get published blogs only (for frontend)
  static async getPublished() {
    try {
      const result = await query(
        'SELECT * FROM blogs WHERE status = $1 ORDER BY created_at DESC',
        ['published']
      );
      return result.rows.map(row => new Blog(row));
    } catch (error) {
      console.error('Error getting published blogs:', error);
      throw error;
    }
  }

  // Get recent blogs (for dashboard)
  static async getRecent(limit = 5) {
    try {
      const result = await query(
        'SELECT * FROM blogs ORDER BY created_at DESC LIMIT $1',
        [limit]
      );
      return result.rows.map(row => new Blog(row));
    } catch (error) {
      console.error('Error getting recent blogs:', error);
      throw error;
    }
  }

  // Get blog count
  static async getCount() {
    try {
      const result = await query('SELECT COUNT(*) as count FROM blogs');
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error getting blog count:', error);
      throw error;
    }
  }
}

module.exports = Blog;
