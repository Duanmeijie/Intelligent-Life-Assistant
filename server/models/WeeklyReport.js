const db = require('../config/db');

class WeeklyReport {
  static async findByUserId(userId, params = {}) {
    const { page, pageSize, offset } = params;

    if (page && pageSize) {
      const [rows] = await db.query(
        'SELECT * FROM weekly_reports WHERE user_id = ? ORDER BY week_start DESC LIMIT ? OFFSET ?',
        [userId, pageSize, offset]
      );

      const [[{ total }]] = await db.query(
        'SELECT COUNT(*) as total FROM weekly_reports WHERE user_id = ?',
        [userId]
      );

      return { rows, total };
    }

    const [rows] = await db.query(
      'SELECT * FROM weekly_reports WHERE user_id = ? ORDER BY week_start DESC',
      [userId]
    );
    return rows;
  }

  static async findLatest(userId) {
    const [rows] = await db.query(
      'SELECT * FROM weekly_reports WHERE user_id = ? ORDER BY week_start DESC LIMIT 1',
      [userId]
    );
    return rows[0] || null;
  }

  static async create(data) {
    const [result] = await db.query(
      'INSERT INTO weekly_reports (user_id, week_start, week_end, total_checkins, total_habits, completion_rate, avg_mood, summary) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [data.user_id, data.week_start, data.week_end, data.total_checkins, data.total_habits, data.completion_rate, data.avg_mood, data.summary]
    );
    return result.insertId;
  }

  static async delete(id, userId) {
    const [result] = await db.query(
      'DELETE FROM weekly_reports WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  }
}

module.exports = WeeklyReport;
