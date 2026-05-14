const pool = require('../config/db');

const PasswordReset = {
  async create(email, token, expiresAt) {
    const [result] = await pool.query(
      'INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)',
      [email, token, expiresAt]
    );
    return result.insertId;
  },

  async findByToken(token) {
    const [rows] = await pool.query(
      'SELECT * FROM password_resets WHERE token = ? AND used = 0 AND expires_at > NOW()',
      [token]
    );
    return rows[0] || null;
  },

  async markAsUsed(token) {
    await pool.query(
      'UPDATE password_resets SET used = 1 WHERE token = ?',
      [token]
    );
  },

  async invalidateExisting(email) {
    await pool.query(
      'UPDATE password_resets SET used = 1 WHERE email = ? AND used = 0',
      [email]
    );
  }
};

module.exports = PasswordReset;
