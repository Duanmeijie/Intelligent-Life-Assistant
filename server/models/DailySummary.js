const db = require('../config/db');

class DailySummary {
  static async findByUserId(userId, params = {}) {
    const { startDate, endDate, page, pageSize, offset } = params;

    let sql = 'SELECT * FROM daily_summaries WHERE user_id = ?';
    const values = [userId];

    if (startDate) {
      sql += ' AND summary_date >= ?';
      values.push(startDate);
    }

    if (endDate) {
      sql += ' AND summary_date <= ?';
      values.push(endDate);
    }

    sql += ' ORDER BY summary_date DESC';

    if (page && pageSize) {
      const [rows] = await db.query(
        sql + ' LIMIT ? OFFSET ?',
        [...values, pageSize, offset]
      );

      let countSql = 'SELECT COUNT(*) as total FROM daily_summaries WHERE user_id = ?';
      const countValues = [userId];
      if (startDate) {
        countSql += ' AND summary_date >= ?';
        countValues.push(startDate);
      }
      if (endDate) {
        countSql += ' AND summary_date <= ?';
        countValues.push(endDate);
      }

      const [[{ total }]] = await db.query(countSql, countValues);

      return { rows, total };
    }

    const [rows] = await db.query(sql, values);
    return rows;
  }

  static async findByDate(userId, date) {
    const [rows] = await db.query(
      'SELECT * FROM daily_summaries WHERE user_id = ? AND summary_date = ?',
      [userId, date]
    );
    return rows[0] || null;
  }

  static async createOrUpdate(userId, date, data) {
    const existing = await this.findByDate(userId, date);

    if (existing) {
      const [result] = await db.query(
        `UPDATE daily_summaries SET
          mood_rating = ?, journal = ?, sleep_hours = ?,
          water_intake = ?, exercise_minutes = ?, productivity_score = ?
         WHERE id = ? AND user_id = ?`,
        [
          data.mood_rating ?? existing.mood_rating,
          data.journal ?? existing.journal,
          data.sleep_hours ?? existing.sleep_hours,
          data.water_intake ?? existing.water_intake,
          data.exercise_minutes ?? existing.exercise_minutes,
          data.productivity_score ?? existing.productivity_score,
          existing.id,
          userId
        ]
      );
      return { updated: true, id: existing.id, affectedRows: result.affectedRows };
    }

    const [result] = await db.query(
      'INSERT INTO daily_summaries (user_id, summary_date, mood_rating, journal, sleep_hours, water_intake, exercise_minutes, productivity_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, date, data.mood_rating, data.journal, data.sleep_hours, data.water_intake, data.exercise_minutes, data.productivity_score]
    );
    return { updated: false, id: result.insertId };
  }

  static async delete(id, userId) {
    const [result] = await db.query(
      'DELETE FROM daily_summaries WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  }
}

module.exports = DailySummary;
