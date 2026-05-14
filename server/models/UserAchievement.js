const pool = require('../config/db');

const UserAchievement = {
  async findByUserId(userId) {
    const [rows] = await pool.query(
      `SELECT ua.*, a.code, a.name, a.description, a.icon, a.category, a.threshold
       FROM user_achievements ua
       JOIN achievements a ON ua.achievement_id = a.id
       WHERE ua.user_id = ?
       ORDER BY ua.achieved_at DESC`,
      [userId]
    );
    return rows;
  },

  async award(userId, achievementId) {
    const existing = await pool.query(
      'SELECT id FROM user_achievements WHERE user_id = ? AND achievement_id = ?',
      [userId, achievementId]
    );
    if (existing[0].length > 0) return null;

    const [result] = await pool.query(
      'INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?)',
      [userId, achievementId]
    );

    const [rows] = await pool.query(
      `SELECT a.* FROM achievements a WHERE a.id = ?`,
      [achievementId]
    );

    return { id: result.insertId, achievement: rows[0] };
  },

  async countByUserId(userId) {
    const [[result]] = await pool.query(
      'SELECT COUNT(*) as count FROM user_achievements WHERE user_id = ?',
      [userId]
    );
    return result.count;
  },

  async getAchievements() {
    const [rows] = await pool.query('SELECT * FROM achievements ORDER BY threshold ASC');
    return rows;
  },

  async getAchievementByCode(code) {
    const [rows] = await pool.query('SELECT * FROM achievements WHERE code = ?', [code]);
    return rows[0] || null;
  },

  async getAchievementById(id) {
    const [rows] = await pool.query('SELECT * FROM achievements WHERE id = ?', [id]);
    return rows[0] || null;
  }
};

module.exports = UserAchievement;
