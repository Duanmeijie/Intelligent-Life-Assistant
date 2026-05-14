const pool = require('../config/db');

const UserSetting = {
  async findByUserId(userId) {
    const [rows] = await pool.query(
      'SELECT * FROM user_settings WHERE user_id = ?',
      [userId]
    );
    return rows[0] || null;
  },

  async upsert(userId, data) {
    const existing = await this.findByUserId(userId);
    if (existing) {
      const fields = [];
      const values = [];
      Object.keys(data).forEach((key) => {
        if (data[key] !== undefined) {
          fields.push(`${key} = ?`);
          values.push(data[key]);
        }
      });
      if (fields.length === 0) return existing;
      values.push(userId);
      await pool.query(
        `UPDATE user_settings SET ${fields.join(', ')} WHERE user_id = ?`,
        values
      );
    } else {
      const keys = ['user_id', ...Object.keys(data)];
      const placeholders = keys.map(() => '?').join(', ');
      const values = [userId, ...Object.values(data)];
      await pool.query(
        `INSERT INTO user_settings (${keys.join(', ')}) VALUES (${placeholders})`,
        values
      );
    }
    return this.findByUserId(userId);
  }
};

module.exports = UserSetting;
