const pool = require('../config/db');

const Habit = {
  async findByUserId(userId, options = {}) {
    const { page, pageSize, includeInactive } = options;

    if (page && pageSize) {
      const offset = (page - 1) * pageSize;
      const whereClause = includeInactive
        ? 'WHERE user_id = ?'
        : 'WHERE user_id = ? AND is_active = 1';

      const [rows] = await pool.query(
        `SELECT * FROM habits ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [userId, pageSize, offset]
      );

      const [[{ total }]] = await pool.query(
        `SELECT COUNT(*) as total FROM habits ${whereClause}`,
        [userId]
      );

      return { rows, total };
    }

    const [rows] = await pool.query(
      'SELECT * FROM habits WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC',
      [userId]
    );
    return rows;
  },

  async create(data) {
    const [result] = await pool.query(
      'INSERT INTO habits (user_id, name, description, frequency, category, color, reminder_time) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [data.user_id, data.name, data.description, data.frequency, data.category, data.color, data.reminder_time]
    );
    return result.insertId;
  },

  async update(id, userId, data) {
    const setClauses = [];
    const values = [];

    const allowedFields = ['name', 'description', 'frequency', 'category', 'color', 'reminder_time', 'is_active'];
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        setClauses.push(`${field} = ?`);
        values.push(data[field]);
      }
    }

    if (setClauses.length === 0) {
      return false;
    }

    values.push(id, userId);
    const [result] = await pool.query(
      `UPDATE habits SET ${setClauses.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );
    return result.affectedRows > 0;
  },

  async delete(id, userId) {
    const [result] = await pool.query(
      'DELETE FROM habits WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  },

  async findById(id) {
    const [rows] = await pool.query(
      'SELECT * FROM habits WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }
};

module.exports = Habit;
