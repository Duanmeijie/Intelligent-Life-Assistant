const pool = require('../config/db');

const SocialPost = {
  async findAll(filters = {}) {
    let sql = `SELECT
                 sp.*,
                 u.username,
                 u.nickname,
                 u.avatar
               FROM social_posts sp
               LEFT JOIN users u ON sp.user_id = u.id
               WHERE sp.status = 1`;
    const values = [];

    if (filters.userId) {
      sql += ' AND sp.user_id = ?';
      values.push(filters.userId);
    }

    sql += ' ORDER BY sp.created_at DESC';

    return { sql, values };
  },

  async countAll(filters = {}) {
    let sql = 'SELECT COUNT(*) AS total FROM social_posts WHERE status = 1';
    const values = [];

    if (filters.userId) {
      sql += ' AND user_id = ?';
      values.push(filters.userId);
    }

    const [rows] = await pool.query(sql, values);
    return rows[0].total;
  },

  async create(data) {
    const images = data.images ? JSON.stringify(data.images) : null;
    const [result] = await pool.query(
      'INSERT INTO social_posts (user_id, content, images) VALUES (?, ?, ?)',
      [data.user_id, data.content, images]
    );
    return result.insertId;
  },

  async delete(id, userId) {
    const [result] = await pool.query(
      'DELETE FROM social_posts WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT sp.*, u.username, u.nickname, u.avatar
       FROM social_posts sp
       LEFT JOIN users u ON sp.user_id = u.id
       WHERE sp.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async incrementLikes(id) {
    const [result] = await pool.query(
      'UPDATE social_posts SET likes_count = likes_count + 1 WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  },

  async decrementLikes(id) {
    const [result] = await pool.query(
      'UPDATE social_posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  },

  async incrementComments(id) {
    const [result] = await pool.query(
      'UPDATE social_posts SET comments_count = comments_count + 1 WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
};

module.exports = SocialPost;
