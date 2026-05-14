const pool = require('../config/db');

const User = {
  async findByUsername(username) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    return rows[0] || null;
  },

  async findByEmail(email) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0] || null;
  },

  async create({ username, email, password }) {
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, password]
    );
    return result.insertId;
  },

  async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, username, email, nickname, avatar, bio, status, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  async updateProfile(id, fields) {
    const allowedFields = ['nickname', 'avatar', 'bio'];
    const setClauses = [];
    const values = [];

    for (const field of allowedFields) {
      if (fields[field] !== undefined) {
        setClauses.push(`${field} = ?`);
        values.push(fields[field]);
      }
    }

    if (setClauses.length === 0) {
      return false;
    }

    values.push(id);
    const [result] = await pool.query(
      `UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  },

  async updatePassword(id, hashedPassword) {
    const [result] = await pool.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );
    return result.affectedRows > 0;
  },

  async updatePasswordByEmail(email, hashedPassword) {
    const [result] = await pool.query(
      'UPDATE users SET password = ? WHERE email = ?',
      [hashedPassword, email]
    );
    return result.affectedRows > 0;
  }
};

module.exports = User;
