const pool = require('../config/db');

const Schedule = {
  async findByUserId(userId, filters = {}) {
    let sql = 'SELECT * FROM schedules WHERE user_id = ?';
    const values = [userId];

    if (filters.startDate) {
      sql += ' AND start_time >= ?';
      values.push(filters.startDate);
    }

    if (filters.endDate) {
      sql += ' AND end_time <= ?';
      values.push(filters.endDate);
    }

    if (filters.category) {
      sql += ' AND category = ?';
      values.push(filters.category);
    }

    if (filters.status) {
      sql += ' AND status = ?';
      values.push(filters.status);
    }

    sql += ' ORDER BY start_time ASC';

    return { sql, values };
  },

  async countByUserId(userId, filters = {}) {
    let sql = 'SELECT COUNT(*) AS total FROM schedules WHERE user_id = ?';
    const values = [userId];

    if (filters.startDate) {
      sql += ' AND start_time >= ?';
      values.push(filters.startDate);
    }

    if (filters.endDate) {
      sql += ' AND end_time <= ?';
      values.push(filters.endDate);
    }

    if (filters.category) {
      sql += ' AND category = ?';
      values.push(filters.category);
    }

    if (filters.status) {
      sql += ' AND status = ?';
      values.push(filters.status);
    }

    const [rows] = await pool.query(sql, values);
    return rows[0].total;
  },

  async create(data) {
    const [result] = await pool.query(
      'INSERT INTO schedules (user_id, title, description, category, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?)',
      [data.user_id, data.title, data.description, data.category, data.start_time, data.end_time]
    );
    return result.insertId;
  },

  async update(id, userId, data) {
    const [result] = await pool.query(
      'UPDATE schedules SET title = ?, description = ?, category = ?, start_time = ?, end_time = ? WHERE id = ? AND user_id = ?',
      [data.title, data.description, data.category, data.start_time, data.end_time, id, userId]
    );
    return result.affectedRows > 0;
  },

  async delete(id, userId) {
    const [result] = await pool.query(
      'DELETE FROM schedules WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  },

  async findById(id) {
    const [rows] = await pool.query(
      'SELECT * FROM schedules WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  async updateStatus(id, userId, status) {
    const [result] = await pool.query(
      'UPDATE schedules SET status = ? WHERE id = ? AND user_id = ?',
      [status, id, userId]
    );
    return result.affectedRows > 0;
  }
};

module.exports = Schedule;
