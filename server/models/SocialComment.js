const pool = require('../config/db');

const SocialComment = {
  async findByPostId(postId) {
    const [rows] = await pool.query(
      `SELECT sc.*, u.username, u.nickname, u.avatar
       FROM social_comments sc
       LEFT JOIN users u ON sc.user_id = u.id
       WHERE sc.post_id = ?
       ORDER BY sc.created_at ASC`,
      [postId]
    );
    return rows;
  },

  async create(data) {
    const [result] = await pool.query(
      'INSERT INTO social_comments (post_id, user_id, content) VALUES (?, ?, ?)',
      [data.post_id, data.user_id, data.content]
    );
    return result.insertId;
  }
};

module.exports = SocialComment;
