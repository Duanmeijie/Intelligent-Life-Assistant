const pool = require('../config/db');

const SocialLike = {
  async findByUserAndPost(userId, postId) {
    const [rows] = await pool.query(
      'SELECT * FROM social_likes WHERE user_id = ? AND post_id = ?',
      [userId, postId]
    );
    return rows[0] || null;
  },

  async create(userId, postId) {
    const [result] = await pool.query(
      'INSERT INTO social_likes (user_id, post_id) VALUES (?, ?)',
      [userId, postId]
    );
    return result.insertId;
  },

  async delete(userId, postId) {
    const [result] = await pool.query(
      'DELETE FROM social_likes WHERE user_id = ? AND post_id = ?',
      [userId, postId]
    );
    return result.affectedRows > 0;
  }
};

module.exports = SocialLike;
