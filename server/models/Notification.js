const pool = require('../config/db');

const Notification = {
  async create(data) {
    const { user_id, type, title, content, related_id, related_type } = data;
    const [result] = await pool.query(
      'INSERT INTO notifications (user_id, type, title, content, related_id, related_type) VALUES (?, ?, ?, ?, ?, ?)',
      [user_id, type, title, content || null, related_id || null, related_type || null]
    );
    return result.insertId;
  },

  async findByUserId(userId, options = {}) {
    const { page = 1, pageSize = 20, unreadOnly = false } = options;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE n.user_id = ?';
    const params = [userId];

    if (unreadOnly) {
      whereClause += ' AND n.is_read = 0';
    }

    const [rows] = await pool.query(
      `SELECT n.* FROM notifications n ${whereClause} ORDER BY n.created_at DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM notifications n ${whereClause}`,
      params
    );

    return { rows, total };
  },

  async countUnread(userId) {
    const [[result]] = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );
    return result.count;
  },

  async markAsRead(id, userId) {
    const [result] = await pool.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  },

  async markAllAsRead(userId) {
    const [result] = await pool.query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
      [userId]
    );
    return result.affectedRows;
  },

  async delete(id, userId) {
    const [result] = await pool.query(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  }
};

module.exports = Notification;
